import { executeQuery } from "./database"

export class SecurityMonitor {
  private static readonly THREAT_PATTERNS = {
    BRUTE_FORCE: /^(FAILED_LOGIN|LOGIN_ATTEMPT)$/,
    SUSPICIOUS_ACCESS: /^(UNAUTHORIZED_ACCESS|PRIVILEGE_ESCALATION)$/,
    DATA_BREACH: /^(BULK_EXPORT|MASS_DELETE|UNAUTHORIZED_QUERY)$/,
  }

  private static readonly RISK_THRESHOLDS = {
    FAILED_LOGINS: 3,
    SUSPICIOUS_IPS: 5,
    RAPID_REQUESTS: 10,
  }

  // Monitor for security threats
  static async monitorSecurityEvents() {
    try {
      // Check for brute force attacks
      await this.detectBruteForceAttacks()

      // Check for suspicious IP patterns
      await this.detectSuspiciousIPs()

      // Check for privilege escalation attempts
      await this.detectPrivilegeEscalation()

      // Check for data exfiltration patterns
      await this.detectDataExfiltration()
    } catch (error) {
      console.error("Security monitoring error:", error)
    }
  }

  // Detect brute force attacks
  private static async detectBruteForceAttacks() {
    const result = await executeQuery(
      `
      SELECT ip_address, COUNT(*) as attempt_count, user_email
      FROM audit_logs 
      WHERE action = 'FAILED_LOGIN' 
        AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY ip_address, user_email
      HAVING COUNT(*) >= $1
    `,
      [this.RISK_THRESHOLDS.FAILED_LOGINS],
    )

    if (result.success && result.data.length > 0) {
      for (const attack of result.data) {
        await this.createSecurityEvent({
          eventType: "BRUTE_FORCE",
          severity: "CRITICAL",
          sourceIp: attack.ip_address,
          targetResource: "login_endpoint",
          description: `Brute force attack detected from ${attack.ip_address} targeting ${attack.user_email}`,
          blocked: true,
        })
      }
    }
  }

  // Detect suspicious IP patterns
  private static async detectSuspiciousIPs() {
    const result = await executeQuery(
      `
      SELECT ip_address, COUNT(DISTINCT user_email) as user_count, COUNT(*) as total_attempts
      FROM audit_logs 
      WHERE created_at > NOW() - INTERVAL '1 hour'
        AND status = 'FAILED'
      GROUP BY ip_address
      HAVING COUNT(DISTINCT user_email) >= $1
    `,
      [this.RISK_THRESHOLDS.SUSPICIOUS_IPS],
    )

    if (result.success && result.data.length > 0) {
      for (const suspicious of result.data) {
        await this.createSecurityEvent({
          eventType: "SUSPICIOUS_IP",
          severity: "HIGH",
          sourceIp: suspicious.ip_address,
          targetResource: "multiple_accounts",
          description: `Suspicious IP ${suspicious.ip_address} attempting access to ${suspicious.user_count} different accounts`,
          blocked: false,
        })
      }
    }
  }

  // Detect privilege escalation attempts
  private static async detectPrivilegeEscalation() {
    const result = await executeQuery(`
      SELECT user_email, action, resource, COUNT(*) as attempt_count
      FROM audit_logs 
      WHERE action = 'UNAUTHORIZED_ACCESS'
        AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY user_email, action, resource
      HAVING COUNT(*) >= 2
    `)

    if (result.success && result.data.length > 0) {
      for (const escalation of result.data) {
        await this.createSecurityEvent({
          eventType: "PRIVILEGE_ESCALATION",
          severity: "HIGH",
          targetResource: escalation.resource,
          description: `Privilege escalation attempt by ${escalation.user_email} on ${escalation.resource}`,
          blocked: true,
        })
      }
    }
  }

  // Detect data exfiltration patterns
  private static async detectDataExfiltration() {
    const result = await executeQuery(
      `
      SELECT user_email, COUNT(*) as access_count, 
             COUNT(DISTINCT resource) as resource_count
      FROM audit_logs 
      WHERE action IN ('VIEW_RESULTS', 'EXPORT_DATA', 'BULK_QUERY')
        AND created_at > NOW() - INTERVAL '1 hour'
      GROUP BY user_email
      HAVING COUNT(*) >= $1 OR COUNT(DISTINCT resource) >= 10
    `,
      [this.RISK_THRESHOLDS.RAPID_REQUESTS],
    )

    if (result.success && result.data.length > 0) {
      for (const exfiltration of result.data) {
        await this.createSecurityEvent({
          eventType: "DATA_EXFILTRATION",
          severity: "CRITICAL",
          targetResource: "academic_data",
          description: `Potential data exfiltration by ${exfiltration.user_email}: ${exfiltration.access_count} rapid accesses to ${exfiltration.resource_count} resources`,
          blocked: false,
        })
      }
    }
  }

  // Create security event
  private static async createSecurityEvent(event: {
    eventType: string
    severity: string
    sourceIp?: string
    targetResource: string
    description: string
    blocked: boolean
  }) {
    return executeQuery(
      `
      INSERT INTO security_events (event_type, severity, source_ip, target_resource, description, blocked)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [event.eventType, event.severity, event.sourceIp || null, event.targetResource, event.description, event.blocked],
    )
  }

  // Get security dashboard metrics
  static async getSecurityMetrics() {
    const metrics = {
      totalEvents: 0,
      criticalEvents: 0,
      blockedEvents: 0,
      activeThreats: 0,
      recentEvents: [],
    }

    try {
      // Total events in last 24 hours
      const totalResult = await executeQuery(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `)
      metrics.totalEvents = totalResult.success ? Number.parseInt(totalResult.data[0]?.count || "0") : 0

      // Critical events
      const criticalResult = await executeQuery(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE severity = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours'
      `)
      metrics.criticalEvents = criticalResult.success ? Number.parseInt(criticalResult.data[0]?.count || "0") : 0

      // Blocked events
      const blockedResult = await executeQuery(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE blocked = true AND created_at > NOW() - INTERVAL '24 hours'
      `)
      metrics.blockedEvents = blockedResult.success ? Number.parseInt(blockedResult.data[0]?.count || "0") : 0

      // Active threats (unresolved)
      const activeResult = await executeQuery(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE resolved = false AND severity IN ('HIGH', 'CRITICAL')
      `)
      metrics.activeThreats = activeResult.success ? Number.parseInt(activeResult.data[0]?.count || "0") : 0

      // Recent events
      const recentResult = await executeQuery(`
        SELECT * FROM security_events 
        ORDER BY created_at DESC 
        LIMIT 10
      `)
      metrics.recentEvents = recentResult.success ? recentResult.data : []
    } catch (error) {
      console.error("Error fetching security metrics:", error)
    }

    return metrics
  }
}
