import { type NextRequest, NextResponse } from "next/server"
import { getValidSession } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("secure_session")?.value

    console.log("Validating session token:", !!sessionToken)

    if (!sessionToken) {
      return NextResponse.json({ error: "No session token" }, { status: 401 })
    }

    const session = await getValidSession(sessionToken)
    console.log("Session validation result:", !!session)

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        department: session.department,
      },
    })
  } catch (error) {
    console.error("Session validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
