import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { logAuditEvent, cleanupExpiredSessions } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (user) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "LOGOUT",
        resource: "authentication",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "LOW",
      })
    }

    await AuthService.logout()

    // Clean up expired sessions in the background (don't wait for it)
    cleanupExpiredSessions().catch(error => {
      console.error("Session cleanup error:", error)
    })

    const response = NextResponse.json({ success: true })
    response.cookies.delete("secure_session")

    return response
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
