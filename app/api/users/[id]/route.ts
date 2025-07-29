import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { updateUser, deleteUser, logAuditEvent } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to update users" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can update users" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { email, name, role, department, faculty_id, is_active, lecturer_id, gender } = body

    // Validate required fields
    if (!email || !name || !role || !department) {
      return NextResponse.json(
        { error: "Email, name, role, and department are required" },
        { status: 400 }
      )
    }

    const result = await updateUser(Number(params.id), {
      email,
      name,
      role,
      department,
      faculty_id,
      is_active,
      lecturer_id,
      gender
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update user" }, { status: 500 })
    }

    // Log the user update
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE_USER",
      resource: "users",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { updatedUserEmail: email, role },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Update user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions to delete users" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can delete users" },
        { status: 403 },
      )
    }

    // Prevent deleting the main admin user (ID 1)
    if (Number(params.id) === 1) {
      return NextResponse.json(
        { error: "Cannot delete the main administrator account" },
        { status: 400 }
      )
    }

    const result = await deleteUser(Number(params.id))

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete user" }, { status: 500 })
    }

    // Log the user deletion
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "DELETE_USER",
      resource: "users",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "HIGH",
      details: { deletedUserEmail: result.data.email, role: result.data.role },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Delete user API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 