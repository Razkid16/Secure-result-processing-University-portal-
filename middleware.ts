import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("Middleware checking path:", pathname)

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/api/auth/login", "/api/auth/validate", "/api/auth/me", "/"]

  if (publicRoutes.includes(pathname)) {
    console.log("Public route, allowing access")
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("secure_session")
  const sessionToken = sessionCookie?.value

  console.log(
    "All cookies:",
    request.cookies.getAll().map((c) => `${c.name}=${c.value.substring(0, 10)}...`),
  )
  console.log("Session cookie found:", !!sessionCookie)
  console.log("Session token exists:", !!sessionToken)

  if (sessionToken) {
    console.log("Session token preview:", sessionToken.substring(0, 10) + "...")
  }

  if (!sessionToken) {
    console.log("No session token, redirecting to login")
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  console.log("Session token found, allowing access")
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
}
