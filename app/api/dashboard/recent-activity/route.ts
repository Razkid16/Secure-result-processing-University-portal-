import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAuditLogs, logAuditEvent } from "@/lib/database"

interface RecentActivity {
  id: number
  timestamp: string
  action: string
  description: string
  user: string
  type: "success" | "info" | "warning" | "error"
  icon: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only administrators can access recent activity
    if (user.role !== "Administrator") {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "dashboard_recent_activity",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "MEDIUM",
        details: { reason: "Non-administrator attempting to access recent activity" },
      })

      return NextResponse.json(
        { error: "Access denied - Only administrators can view recent activity" },
        { status: 403 },
      )
    }

    // Get audit logs for recent activity
    const auditLogsResponse = await getAuditLogs(50, 0) // Get last 50 activities

    if (!auditLogsResponse.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    const auditLogs = auditLogsResponse.data || []
    
    // Convert audit logs to recent activity format
    const recentActivity: RecentActivity[] = []
    let activityId = 1

    auditLogs.forEach((log: any) => {
      // Skip logs older than 24 hours
      const logTime = new Date(log.created_at)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      if (logTime < oneDayAgo) return

      // Administrators can see all activities

      let description = ""
      let type: "success" | "info" | "warning" | "error" = "info"
      let icon = "Activity"

      // Map audit log actions to user-friendly descriptions
      switch (log.action) {
        case "LOGIN":
          if (log.status === "SUCCESS") {
            description = "User logged in successfully"
            type = "success"
            icon = "CheckCircle"
          } else {
            description = "Failed login attempt"
            type = "error"
            icon = "XCircle"
          }
          break

        case "LOGOUT":
          description = "User logged out"
          type = "info"
          icon = "LogOut"
          break

        case "CREATE_RESULT":
          description = "New academic result created"
          type = "success"
          icon = "FileText"
          break

        case "UPDATE_RESULT":
          description = "Academic result updated"
          type = "info"
          icon = "Edit"
          break

        case "DELETE_RESULT":
          description = "Academic result deleted"
          type = "warning"
          icon = "Trash"
          break

        case "BULK_UPLOAD":
          description = "Bulk results uploaded"
          type = "success"
          icon = "Upload"
          break

        case "VIEW_RESULTS":
          description = "Results viewed"
          type = "info"
          icon = "Eye"
          break

        case "VIEW_AUDIT_LOGS":
          description = "Audit logs accessed"
          type = "info"
          icon = "ClipboardList"
          break

        case "VIEW_SECURITY_EVENTS":
          description = "Security events viewed"
          type = "info"
          icon = "Shield"
          break

        case "VIEW_SECURITY_STATS":
          description = "Security statistics accessed"
          type = "info"
          icon = "BarChart3"
          break

        case "VIEW_THREAT_PATTERNS":
          description = "Threat patterns analyzed"
          type = "info"
          icon = "Target"
          break

        case "UNAUTHORIZED_ACCESS":
          description = `Unauthorized access attempt to ${log.resource || 'unknown resource'}`
          type = "error"
          icon = "AlertTriangle"
          break

        case "VIEW_DASHBOARD":
          description = "Dashboard accessed"
          type = "info"
          icon = "Home"
          break

        case "VIEW_USERS":
          description = "User management accessed"
          type = "info"
          icon = "Users"
          break

        default:
          description = log.action.replace(/_/g, ' ').toLowerCase()
          type = log.status === "SUCCESS" ? "success" : 
                 log.status === "FAILED" ? "error" : 
                 log.risk_level === "HIGH" || log.risk_level === "CRITICAL" ? "warning" : "info"
          icon = "Activity"
      }

      // Add role-specific activities for demonstration
      if (user.role === "Administrator" && recentActivity.length < 3) {
        const adminActivities = [
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            action: "SYSTEM_BACKUP",
            description: "System backup completed successfully",
            user: "System",
            type: "success" as const,
            icon: "Database"
          },
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            action: "USER_PERMISSIONS",
            description: "User permissions updated",
            user: user.name,
            type: "info" as const,
            icon: "Shield"
          },
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            action: "SECURITY_SCAN",
            description: "Security scan completed",
            user: "System",
            type: "success" as const,
            icon: "ShieldCheck"
          }
        ]
        
        adminActivities.forEach(activity => {
          if (recentActivity.length < 5) {
            recentActivity.push(activity)
          }
        })
      }

      if (user.role === "Faculty" && recentActivity.length < 3) {
        const facultyActivities = [
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            action: "PUBLISH_RESULTS",
            description: "Course results published",
            user: user.name,
            type: "success" as const,
            icon: "CheckCircle"
          },
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            action: "EXPORT_DATA",
            description: "Course data exported",
            user: user.name,
            type: "info" as const,
            icon: "Download"
          }
        ]
        
        facultyActivities.forEach(activity => {
          if (recentActivity.length < 5) {
            recentActivity.push(activity)
          }
        })
      }

      if (user.role === "Student" && recentActivity.length < 3) {
        const studentActivities = [
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            action: "VIEW_RESULTS",
            description: "New results available",
            user: user.name,
            type: "success" as const,
            icon: "FileText"
          },
          {
            id: activityId++,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            action: "UPDATE_PROFILE",
            description: "Profile information updated",
            user: user.name,
            type: "info" as const,
            icon: "User"
          }
        ]
        
        studentActivities.forEach(activity => {
          if (recentActivity.length < 5) {
            recentActivity.push(activity)
          }
        })
      }

      // Add the actual audit log activity
      recentActivity.push({
        id: activityId++,
        timestamp: log.created_at,
        action: log.action,
        description,
        user: log.user_name || log.user_email || "Unknown",
        type,
        icon
      })
    })

    // Sort by timestamp (newest first) and limit to 10 items
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivity = recentActivity.slice(0, 10)

    // Log the recent activity access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_RECENT_ACTIVITY",
      resource: "dashboard_recent_activity",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { activitiesCount: limitedActivity.length },
    })

    return NextResponse.json({
      success: true,
      data: limitedActivity,
    })
  } catch (error) {
    console.error("Recent activity API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 