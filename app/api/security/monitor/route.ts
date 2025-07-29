import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { SecurityMonitor } from "@/lib/security-monitor"
import { logAuditEvent } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "Administrator") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Run security monitoring
    await SecurityMonitor.monitorSecurityEvents()

    // Get security metrics
    const metrics = await SecurityMonitor.getSecurityMetrics()

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_SECURITY_MONITOR",
      resource: "security_monitor",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
    })

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    console.error("Security monitor API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
