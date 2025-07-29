import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAuditLogs, logAuditEvent } from "@/lib/database"

interface AuditLog {
  id: number
  user_id: number | null
  user_email: string
  user_name: string | null
  action: string
  resource: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  status: "SUCCESS" | "FAILED" | "BLOCKED"
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  details: any
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can view audit logs
    const canViewAuditLogs = await RBACService.canViewAuditLogs(user.role)

    if (!canViewAuditLogs) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "audit_stats",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to view audit statistics" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can view audit statistics" },
        { status: 403 },
      )
    }

    // Get all audit logs for statistics calculation
    const auditLogsResponse = await getAuditLogs(10000, 0) // Get a large number to calculate stats

    if (!auditLogsResponse.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    const allLogs = auditLogsResponse.data || [] as AuditLog[]

    // Filter logs based on user role
    let filteredLogs = allLogs
    if (user.role === "Faculty") {
      // Faculty can only see their own audit logs
      filteredLogs = allLogs.filter((log: AuditLog) => log.user_id === user.id)
    } else if (user.role === "Student") {
      // Students can only see their own audit logs
      filteredLogs = allLogs.filter((log: AuditLog) => log.user_id === user.id)
    }
    // Administrators can see all logs (no filtering)

    // Calculate statistics
    const total = filteredLogs.length
    const success = filteredLogs.filter((log: AuditLog) => log.status === "SUCCESS").length
    const failed = filteredLogs.filter((log: AuditLog) => log.status === "FAILED").length
    const blocked = filteredLogs.filter((log: AuditLog) => log.status === "BLOCKED").length
    const highRisk = filteredLogs.filter((log: AuditLog) => 
      log.risk_level === "HIGH" || log.risk_level === "CRITICAL"
    ).length

    // Calculate additional statistics
    const critical = filteredLogs.filter((log: AuditLog) => log.risk_level === "CRITICAL").length
    const medium = filteredLogs.filter((log: AuditLog) => log.risk_level === "MEDIUM").length
    const low = filteredLogs.filter((log: AuditLog) => log.risk_level === "LOW").length

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = filteredLogs.filter((log: AuditLog) => 
      new Date(log.created_at) > oneDayAgo
    ).length

    // Get top actions
    const actionCounts = filteredLogs.reduce((acc: any, log: AuditLog) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {})

    const topActions = Object.entries(actionCounts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }))

    const stats = {
      total,
      success,
      failed,
      blocked,
      highRisk,
      critical,
      medium,
      low,
      recentActivity,
      topActions,
      successRate: total > 0 ? ((success / total) * 100).toFixed(1) : "0",
      failureRate: total > 0 ? (((failed + blocked) / total) * 100).toFixed(1) : "0",
    }

    // Log the audit statistics access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_AUDIT_STATS",
      resource: "audit_stats",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { 
        role: user.role, 
        stats: {
          total,
          success,
          failed,
          blocked,
          highRisk
        }
      },
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Audit stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 