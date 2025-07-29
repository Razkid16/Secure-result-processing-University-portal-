import { NextRequest, NextResponse } from "next/server"
import { getValidSession, clearAllAuditLogs, logAuditEvent } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("secure_session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No session token provided" }, { status: 401 })
    }

    // Validate session
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Check if user is administrator
    if (session.role !== "Administrator") {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "audit_logs_clear",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Non-administrator attempting to clear audit logs" },
      })

      return NextResponse.json(
        { error: "Access denied - Only administrators can clear audit logs" },
        { status: 403 }
      )
    }

    // Get password from request body
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Verify admin password
    const adminUser = global.__inMemoryDB.users.find((u: any) => u.id === session.user_id)
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash)
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "AUDIT_LOGS_CLEAR_ATTEMPT",
        resource: "audit_logs",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "FAILED",
        riskLevel: "HIGH",
        details: { reason: "Invalid admin password provided" },
      })

      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Get the current count of logs before clearing
    const currentLogCount = global.__inMemoryDB.audit_logs.length

    // Log the clearing action BEFORE clearing the logs
    await logAuditEvent({
      userId: session.user_id,
      userEmail: session.email,
      action: "AUDIT_LOGS_CLEARED",
      resource: "audit_logs",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "HIGH",
      details: { 
        clearedCount: currentLogCount,
        reason: "Administrator cleared all audit logs",
        timestamp: new Date().toISOString()
      },
    })

    // Clear all audit logs (this will clear everything except the log we just created)
    const result = await clearAllAuditLogs()
    if (!result.success) {
      return NextResponse.json({ error: "Failed to clear audit logs" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${result.clearedCount} audit logs`,
      clearedCount: result.clearedCount
    })

  } catch (error) {
    console.error("Error clearing audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 