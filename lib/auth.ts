import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import {
  getUserByEmail,
  createSession,
  getValidSession,
  deleteSession,
  logAuditEvent,
  updateLastLogin,
  incrementFailedLogins,
  resetFailedLogins,
  getUsers,
} from "./database"
import { CryptoService } from "./crypto"

export interface User {
  id: number
  email: string
  name: string
  role: string
  department: string
  status: string
  faculty_id?: number | null
  lecturer_id?: string | null
  gender?: string | null
}

export class AuthService {
  private static readonly SESSION_COOKIE_NAME = "secure_session"
  private static readonly SESSION_DURATION = 30 * 60 * 1000 // 30 minutes

  // Demo users for when database is not available
  private static demoUsers = [
    {
      id: 1,
      email: "admin@tech-u.edu.ng",
      name: "System Administrator",
      role: "Administrator",
      department: "IT Services",
      status: "Active",
      password: "SecureAdmin123!",
    },
    {
      id: 2,
      email: "s.johnson@tech-u.edu.ng",
      name: "Dr. Sarah Johnson",
      role: "Faculty",
      department: "Computer Science",
      status: "Active",
      password: "SecureAdmin123!",
    },
    {
      id: 3,
      email: "j.doe@tech-u.edu.ng",
      name: "John Doe",
      role: "Student",
      department: "Computer Science",
      status: "Active",
      password: "SecureAdmin123!",
    },
  ]

  static async authenticate(email: string, password: string, ipAddress: string, userAgent: string) {
    try {
      console.log(`Login attempt for: ${email}`)

      // Always try to use the database first (either SQLite or in-memory)
      const isServer = typeof window === "undefined"
      
      let user = null

      if (isServer) {
        // Try database authentication first
        user = await getUserByEmail(email)
        console.log(`Database lookup for ${email}:`, user ? `Found user ${user.name} with role ${user.role} (ID: ${user.id})` : 'User not found')
        
        // Additional debugging - list all users to see what's in the database
        const allUsers = await getUsers()
        if (allUsers.success && allUsers.data) {
          console.log('All users in database:', allUsers.data.map((u: any) => `${u.email} (${u.role})`))
        }

        if (!user) {
          await logAuditEvent({
            userEmail: email,
            action: "LOGIN_FAILED",
            resource: "authentication",
            ipAddress,
            userAgent,
            status: "FAILED",
            riskLevel: "MEDIUM",
            details: { reason: "User not found" },
          })
          return { success: false, error: "Invalid credentials" }
        }

        // Verify password using CryptoService
        const isValidPassword = await CryptoService.verifyPassword(password, user.password_hash)
        if (!isValidPassword) {
          await incrementFailedLogins(email)
          await logAuditEvent({
            userId: user.id,
            userEmail: email,
            action: "LOGIN_FAILED",
            resource: "authentication",
            ipAddress,
            userAgent,
            status: "FAILED",
            riskLevel: "HIGH",
            details: { reason: "Invalid password" },
          })
          return { success: false, error: "Invalid credentials" }
        }

        await resetFailedLogins(email)
        await updateLastLogin(user.id)
      }

      // Generate session token
      const sessionToken = CryptoService.generateSessionToken()

      // Store session
      if (isServer) {
        await createSession(user.id, sessionToken, ipAddress, userAgent)
        console.log(`Session created for user ${user.name} (${user.role}) with ID ${user.id}`)
      }

      // Log successful login
      if (isServer) {
        await logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          action: "LOGIN_SUCCESS",
          resource: "authentication",
          ipAddress,
          userAgent,
          status: "SUCCESS",
          riskLevel: "LOW",
        })
      }

      return {
        success: true,
        user,
        sessionToken,
      }
    } catch (error) {
      console.error("Authentication error:", error)
      return { success: false, error: "Authentication failed" }
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value

      console.log("Auth me endpoint called")
      console.log("Session token from cookie:", !!sessionToken)
      if (sessionToken) {
        console.log("Token preview:", sessionToken.substring(0, 10) + "...")
      }

      if (!sessionToken) {
        console.log("No session token found")
        return null
      }

      const isServer = typeof window === "undefined"

      if (isServer) {
        // Database session validation
        const session = await getValidSession(sessionToken)
        console.log("Current user found:", !!session)
        if (!session) {
          return null
        }

        const currentUser = {
          id: session.user_id,
          email: session.email,
          name: session.name,
          role: session.role,
          department: session.department,
          status: "Active",
          faculty_id: session.faculty_id,
          lecturer_id: session.lecturer_id,
          gender: session.gender,
        }
        console.log(`Current user from session: ${currentUser.name} (${currentUser.role})`)
        return currentUser
      }

      return null
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  static async logout(sessionToken?: string) {
    try {
      if (!sessionToken) {
        const cookieStore = await cookies()
        sessionToken = cookieStore.get(this.SESSION_COOKIE_NAME)?.value
      }

      if (sessionToken) {
        const isServer = typeof window === "undefined"

        if (isServer) {
          await deleteSession(sessionToken)
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, error: "Logout failed" }
    }
  }

  static async validateSession(request: NextRequest): Promise<User | null> {
    try {
      const sessionToken = request.cookies.get(this.SESSION_COOKIE_NAME)?.value

      if (!sessionToken) {
        return null
      }

      // Check if we're in demo mode
      const isServer = typeof window === "undefined"
      const hasEnv = !!process.env.DATABASE_URL

      if (!isServer || !hasEnv) {
        // Demo mode validation - return admin user
        return {
          id: 1,
          email: "admin@tech-u.edu.ng",
          name: "System Administrator",
          role: "Administrator",
          department: "IT Services",
          status: "Active",
        }
      }

      // Real database validation
      const session = await getValidSession(sessionToken)
      if (!session) {
        return null
      }

      return {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        department: session.department,
        status: "Active",
        faculty_id: session.faculty_id,
        lecturer_id: session.lecturer_id,
        gender: session.gender,
      }
    } catch (error) {
      console.error("Session validation error:", error)
      return null
    }
  }
}
