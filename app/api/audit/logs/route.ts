import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAuditLogs, logAuditEvent } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can view audit logs (Admin and Faculty only)
    const canViewAuditLogs = await RBACService.hasPermission(user.role, "view_audit_logs")

    if (!canViewAuditLogs) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "audit_logs",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Students cannot access audit logs" },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const result = await getAuditLogs(limit, offset)

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    // Log the audit log access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_AUDIT_LOGS",
      resource: "audit_logs",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Audit logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
