import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Auth me endpoint called")

    // Check cookies from request
    const sessionToken = request.cookies.get("secure_session")?.value
    console.log("Session token from cookie:", !!sessionToken)

    if (sessionToken) {
      console.log("Token preview:", sessionToken.substring(0, 10) + "...")
    }

    const user = await AuthService.getCurrentUser()
    console.log("Current user found:", !!user)

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
