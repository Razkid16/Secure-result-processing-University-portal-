import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { createUser, getUsers, updateUser, deleteUser, logAuditEvent } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions based on role
    const canManageUsers = await RBACService.hasPermission(user.role, "manage_users")
    const canViewStudents = user.role === "Faculty" || user.role === "Lecturer" || user.role === "Administrator"
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get("role")

    // Faculty and Lecturers can only view students, Admin can view all
    if ((user.role === "Faculty" || user.role === "Lecturer") && roleFilter !== "Student") {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "users",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "MEDIUM",
        details: { reason: "Faculty/Lecturer attempting to access non-student users" },
      })

      return NextResponse.json(
        { error: "Faculty and Lecturers can only view student users" },
        { status: 403 },
      )
    }

    // Only admin can manage users (create, update, delete)
    if (!canManageUsers && !canViewStudents) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "users",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to view users" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions to view users" },
        { status: 403 },
      )
    }

    const result = await getUsers()

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Apply role filtering
    let filteredUsers = result.data || []
    console.log("=== ROLE FILTERING DEBUG ===")
    console.log("Role filter:", roleFilter)
    console.log("Total users before role filtering:", filteredUsers.length)
    console.log("Users before role filtering:", filteredUsers.map((u: any) => ({ id: u.id, name: u.name, role: u.role, department: u.department })))
    
    if (roleFilter) {
      filteredUsers = filteredUsers.filter((u: any) => u.role === roleFilter)
      console.log("Users after role filtering:", filteredUsers.map((u: any) => ({ id: u.id, name: u.name, role: u.role, department: u.department })))
      console.log("Total users after role filtering:", filteredUsers.length)
    }
    console.log("=== END ROLE FILTERING DEBUG ===")

    // Faculty and Lecturers can only see students in their department
    if (user.role === "Faculty" || user.role === "Lecturer") {
      console.log("=== USER FILTERING DEBUG ===")
      console.log("Faculty/Lecturer department:", user.department)
      console.log("Total users before filtering:", filteredUsers.length)
      console.log("Users before filtering:", filteredUsers.map((u: any) => ({ id: u.id, name: u.name, role: u.role, department: u.department })))
      
      filteredUsers = filteredUsers.filter((u: any) => u.department === user.department)
      
      console.log("Users after filtering:", filteredUsers.map((u: any) => ({ id: u.id, name: u.name, role: u.role, department: u.department })))
      console.log("Total users after filtering:", filteredUsers.length)
      console.log("=== END USER FILTERING DEBUG ===")
    }

    // Log the user access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_USERS",
      resource: "users",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { roleFilter, userCount: filteredUsers.length },
    })

    return NextResponse.json({
      success: true,
      data: filteredUsers,
    })
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can manage users (Admin only)
    const canManageUsers = await RBACService.hasPermission(user.role, "manage_users")

    if (!canManageUsers) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "users",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to create users" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can create users" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { email, name, password, role, department, faculty_id, level, matric_number, lecturer_id, gender } = body

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: "Email, name, password, and role are required" },
        { status: 400 }
      )
    }

    // Department is required for non-admin roles
    if (role !== "Administrator" && !department) {
      return NextResponse.json(
        { error: "Department is required for non-administrator roles" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("=== USER CREATION DEBUG ===")
    console.log("Creating user with data:", { email, name, role, department, faculty_id })
    
    const result = await createUser({
      email,
      name,
      password_hash: hashedPassword,
      role,
      department,
      faculty_id: faculty_id || null,
      level: level || null,
      matric_number: matric_number || null,
      lecturer_id: lecturer_id || null,
      gender: gender || null,
    })
    
    console.log("User creation result:", result)
    console.log("=== END USER CREATION DEBUG ===")

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create user" }, { status: 500 })
    }

    // Log the user creation
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE_USER",
      resource: "users",
      resourceId: result.data?.id?.toString() || "unknown",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { createdUserEmail: email, role },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Create user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
