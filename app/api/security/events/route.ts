import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAuditLogs, logAuditEvent } from "@/lib/database"

interface SecurityEvent {
  id: number
  timestamp: string
  type: "THREAT" | "ALERT" | "WARNING" | "INFO"
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  source: string
  ipAddress?: string
  userAgent?: string
  resolved: boolean
  details?: any
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can view security events
    const canViewSecurityEvents = await RBACService.canViewSecurityEvents(user.role)

    if (!canViewSecurityEvents) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "security_events",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to view security events" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can view security events" },
        { status: 403 },
      )
    }

    // Get audit logs to analyze for security events
    const auditLogsResponse = await getAuditLogs(1000, 0)

    if (!auditLogsResponse.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    const auditLogs = auditLogsResponse.data || []
    
    // Convert audit logs to security events based on patterns
    const securityEvents: SecurityEvent[] = []
    let eventId = 1

    // Analyze audit logs for security patterns
    auditLogs.forEach((log: any) => {
      // Failed login attempts
      if (log.action === "LOGIN" && log.status === "FAILED") {
        securityEvents.push({
          id: eventId++,
          timestamp: log.created_at,
          type: "ALERT",
          severity: "MEDIUM",
          title: "Failed Login Attempt",
          description: `Failed login attempt from ${log.user_email || 'unknown user'}`,
          source: "Authentication System",
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          resolved: false,
          details: log.details,
        })
      }

      // Unauthorized access attempts
      if (log.action === "UNAUTHORIZED_ACCESS") {
        securityEvents.push({
          id: eventId++,
          timestamp: log.created_at,
          type: "THREAT",
          severity: log.risk_level === "HIGH" || log.risk_level === "CRITICAL" ? "HIGH" : "MEDIUM",
          title: "Unauthorized Access Attempt",
          description: `Unauthorized access attempt to ${log.resource || 'unknown resource'}`,
          source: "Access Control",
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          resolved: false,
          details: log.details,
        })
      }

      // Multiple failed attempts from same IP
      if (log.action === "LOGIN" && log.status === "FAILED" && log.ip_address) {
        const failedAttempts = auditLogs.filter((l: any) => 
          l.action === "LOGIN" && 
          l.status === "FAILED" && 
          l.ip_address === log.ip_address &&
          new Date(l.created_at) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        )

        if (failedAttempts.length >= 5) {
          securityEvents.push({
            id: eventId++,
            timestamp: log.created_at,
            type: "THREAT",
            severity: "HIGH",
            title: "Multiple Failed Login Attempts",
            description: `${failedAttempts.length} failed login attempts from IP ${log.ip_address}`,
            source: "Authentication System",
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            resolved: false,
            details: { attempts: failedAttempts.length, timeWindow: "15 minutes" },
          })
        }
      }

      // Suspicious user agent patterns
      if (log.user_agent && (
        log.user_agent.includes("bot") || 
        log.user_agent.includes("crawler") ||
        log.user_agent.includes("scraper") ||
        log.user_agent.length < 20
      )) {
        securityEvents.push({
          id: eventId++,
          timestamp: log.created_at,
          type: "WARNING",
          severity: "MEDIUM",
          title: "Suspicious User Agent",
          description: `Suspicious user agent detected: ${log.user_agent}`,
          source: "User Agent Analysis",
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          resolved: false,
          details: { userAgent: log.user_agent },
        })
      }

      // Bulk operations (potential data exfiltration)
      if (log.action.includes("BULK") && log.status === "SUCCESS") {
        securityEvents.push({
          id: eventId++,
          timestamp: log.created_at,
          type: "INFO",
          severity: "LOW",
          title: "Bulk Operation Detected",
          description: `Bulk operation performed: ${log.action}`,
          source: "Data Operations",
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          resolved: true,
          details: log.details,
        })
      }
    })

    // Add some simulated security events for demonstration
    if (securityEvents.length === 0) {
      securityEvents.push(
        {
          id: eventId++,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: "THREAT",
          severity: "HIGH",
          title: "Suspicious Network Activity",
          description: "Multiple connection attempts from unknown IP addresses detected",
          source: "Network Monitor",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          resolved: false,
          details: { connectionAttempts: 15, timeWindow: "5 minutes" },
        },
        {
          id: eventId++,
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          type: "ALERT",
          severity: "MEDIUM",
          title: "Database Access Pattern Change",
          description: "Unusual database access pattern detected from faculty user",
          source: "Database Monitor",
          ipAddress: "10.0.0.50",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          resolved: true,
          details: { queries: 45, timeWindow: "10 minutes" },
        }
      )
    }

    // Sort by timestamp (newest first)
    securityEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Log the security events access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_SECURITY_EVENTS",
      resource: "security_events",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { eventsCount: securityEvents.length },
    })

    return NextResponse.json({
      success: true,
      data: securityEvents,
    })
  } catch (error) {
    console.error("Security events API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
