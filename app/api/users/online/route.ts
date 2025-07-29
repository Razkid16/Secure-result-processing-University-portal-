import { NextRequest, NextResponse } from "next/server"
import { getValidSession, getUsers, logAuditEvent } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("secure_session")?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: "No session token provided" },
        { status: 401 }
      )
    }

    // Validate session
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    // Get user from session
    if (!session) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      )
    }

    // Check permissions - only administrators can view online users
    if (session.role !== "Administrator") {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "online_users",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "MEDIUM",
        details: { reason: "Non-administrator attempting to access online users" },
      })

      return NextResponse.json(
        { error: "Access denied - Only administrators can view online users" },
        { status: 403 }
      )
    }

    // Get all users
    const result = await getUsers()
    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    // Get online users based on active sessions
    const now = new Date()
    const onlineUsers = result.data.filter((user: any) => {
      // Check if user has an active session with recent activity
      const activeSession = global.__inMemoryDB.user_sessions.find((session: any) => {
        if (session.user_id !== user.id || !session.session_token) {
          return false
        }
        
        // Check if session is not expired
        const sessionExpired = new Date(session.expires_at) <= now
        if (sessionExpired) {
          return false
        }
        
        // Check if user has been active in the last 2 minutes
        if (session.last_activity) {
          const lastActivity = new Date(session.last_activity)
          const timeDiff = now.getTime() - lastActivity.getTime()
          const minutesDiff = timeDiff / (1000 * 60)
          return minutesDiff <= 2 // Consider offline if no activity for 2 minutes
        }
        
        return true // If no last_activity recorded, consider online
      })
      
      return !!activeSession
    })

    // Log the access
    await logAuditEvent({
      userId: session.user_id,
      userEmail: session.email,
      action: "VIEW_ONLINE_USERS",
      resource: "online_users",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { onlineCount: onlineUsers.length, totalUsers: result.data.length },
    })

    return NextResponse.json({
      success: true,
      data: onlineUsers,
      count: onlineUsers.length,
    })

  } catch (error) {
    console.error("Error fetching online users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 