import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("Login attempt for:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    const result = await AuthService.authenticate(email, password, ipAddress, userAgent)

    console.log("Authentication result:", result.success)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    if (!result.sessionToken) {
      console.error("No session token generated")
      return NextResponse.json({ error: "Session creation failed" }, { status: 500 })
    }

    console.log("Setting session cookie with token:", result.sessionToken.substring(0, 10) + "...")

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: result.user,
      sessionToken: result.sessionToken, // Include token in response for debugging
    })

    // Set session cookie with explicit settings for development
    response.cookies.set("secure_session", result.sessionToken, {
      httpOnly: true,
      secure: false, // Must be false for localhost
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
      path: "/",
      domain: undefined, // Let browser set domain automatically
    })

    console.log("Cookie set in response headers")
    return response
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
