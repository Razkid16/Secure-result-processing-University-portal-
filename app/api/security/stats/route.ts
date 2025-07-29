import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAuditLogs, logAuditEvent } from "@/lib/database"

interface SecurityStats {
  totalThreats: number
  activeThreats: number
  resolvedThreats: number
  systemHealth: number
  networkSecurity: number
  dataIntegrity: number
  userActivity: number
  recentIncidents: number
  threatTrend: "increasing" | "decreasing" | "stable"
  lastScan: string
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
        resource: "security_stats",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to view security statistics" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can view security statistics" },
        { status: 403 },
      )
    }

    // Get audit logs for analysis
    const auditLogsResponse = await getAuditLogs(1000, 0)

    if (!auditLogsResponse.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    const auditLogs = auditLogsResponse.data || []
    
    // Calculate security statistics
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Count threats and incidents
    const totalThreats = auditLogs.filter((log: any) => 
      log.action === "UNAUTHORIZED_ACCESS" || 
      (log.action === "LOGIN" && log.status === "FAILED") ||
      log.risk_level === "HIGH" || 
      log.risk_level === "CRITICAL"
    ).length

    const activeThreats = auditLogs.filter((log: any) => 
      (log.action === "UNAUTHORIZED_ACCESS" || 
       (log.action === "LOGIN" && log.status === "FAILED") ||
       log.risk_level === "HIGH" || 
       log.risk_level === "CRITICAL") &&
      new Date(log.created_at) > oneDayAgo
    ).length

    const resolvedThreats = Math.floor(totalThreats * 0.7) // Simulate 70% resolution rate

    const recentIncidents = auditLogs.filter((log: any) => 
      new Date(log.created_at) > oneHourAgo
    ).length

    // Calculate system health metrics
    const failedLogins = auditLogs.filter((log: any) => 
      log.action === "LOGIN" && log.status === "FAILED"
    ).length

    const totalLogins = auditLogs.filter((log: any) => 
      log.action === "LOGIN"
    ).length

    const loginSuccessRate = totalLogins > 0 ? ((totalLogins - failedLogins) / totalLogins) * 100 : 100
    const systemHealth = Math.max(0, Math.min(100, loginSuccessRate - (activeThreats * 5)))

    // Calculate network security score
    const suspiciousIPs = new Set()
    auditLogs.forEach((log: any) => {
      if (log.ip_address && (
        log.action === "UNAUTHORIZED_ACCESS" ||
        (log.action === "LOGIN" && log.status === "FAILED")
      )) {
        suspiciousIPs.add(log.ip_address)
      }
    })

    const networkSecurity = Math.max(0, Math.min(100, 100 - (suspiciousIPs.size * 3)))

    // Calculate data integrity score
    const dataOperations = auditLogs.filter((log: any) => 
      log.action.includes("CREATE") || 
      log.action.includes("UPDATE") || 
      log.action.includes("DELETE") ||
      log.action.includes("BULK")
    ).length

    const successfulDataOps = auditLogs.filter((log: any) => 
      (log.action.includes("CREATE") || 
       log.action.includes("UPDATE") || 
       log.action.includes("DELETE") ||
       log.action.includes("BULK")) &&
      log.status === "SUCCESS"
    ).length

    const dataIntegrity = dataOperations > 0 ? (successfulDataOps / dataOperations) * 100 : 100

    // Calculate user activity score
    const recentActivity = auditLogs.filter((log: any) => 
      new Date(log.created_at) > oneHourAgo
    ).length

    const userActivity = Math.min(100, recentActivity * 2) // Scale activity to 0-100

    // Determine threat trend
    const recentThreats = auditLogs.filter((log: any) => 
      (log.action === "UNAUTHORIZED_ACCESS" || 
       (log.action === "LOGIN" && log.status === "FAILED") ||
       log.risk_level === "HIGH" || 
       log.risk_level === "CRITICAL") &&
      new Date(log.created_at) > oneHourAgo
    ).length

    const previousThreats = auditLogs.filter((log: any) => 
      (log.action === "UNAUTHORIZED_ACCESS" || 
       (log.action === "LOGIN" && log.status === "FAILED") ||
       log.risk_level === "HIGH" || 
       log.risk_level === "CRITICAL") &&
      new Date(log.created_at) > oneDayAgo &&
      new Date(log.created_at) <= oneHourAgo
    ).length

    let threatTrend: "increasing" | "decreasing" | "stable" = "stable"
    if (recentThreats > previousThreats * 1.5) {
      threatTrend = "increasing"
    } else if (recentThreats < previousThreats * 0.5) {
      threatTrend = "decreasing"
    }

    const stats: SecurityStats = {
      totalThreats,
      activeThreats,
      resolvedThreats,
      systemHealth: Math.round(systemHealth),
      networkSecurity: Math.round(networkSecurity),
      dataIntegrity: Math.round(dataIntegrity),
      userActivity: Math.round(userActivity),
      recentIncidents,
      threatTrend,
      lastScan: now.toISOString(),
    }

    // Log the security stats access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_SECURITY_STATS",
      resource: "security_stats",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { stats },
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Security stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 