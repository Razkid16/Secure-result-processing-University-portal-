import { type NextRequest, NextResponse } from "next/server"
import { getValidSession, updateLastActivity } from "@/lib/database"

export async function POST(request: NextRequest) {
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

    // Update last activity for this session
    await updateLastActivity(sessionToken)

    return NextResponse.json({
      success: true,
      message: "Heartbeat received"
    })

  } catch (error) {
    console.error("Heartbeat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 