import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { logAuditEvent, updateCourseRegistration, deleteCourseRegistration } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can update course registrations
    const canUpdateRegistrations = await RBACService.hasPermission(user.role, "update_course_registrations")

    if (!canUpdateRegistrations) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "course_registrations",
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, course_id, semester, session, notes } = body

    // Validate required fields
    if (!student_id || !course_id || !semester || !session) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update the course registration in database
    const updatedRegistration = await updateCourseRegistration(parseInt(params.id), {
      notes: notes || null
    })

    // Log the update event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE_COURSE_REGISTRATION",
      resource: "course_registrations",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        studentId: updatedRegistration.student_id,
        courseId: updatedRegistration.course_id,
        semester: updatedRegistration.semester,
        session: updatedRegistration.session
      }
    })

    return NextResponse.json({
      success: true,
      message: "Course registration updated successfully",
      data: updatedRegistration,
    })
  } catch (error) {
    console.error("Course registration update error:", error)
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

    // Check if user can delete course registrations
    const canDeleteRegistrations = await RBACService.hasPermission(user.role, "delete_course_registrations")

    if (!canDeleteRegistrations) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "course_registrations",
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Delete the course registration from database
    await deleteCourseRegistration(parseInt(params.id))

    // Log the deletion event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "DELETE_COURSE_REGISTRATION",
      resource: "course_registrations",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        registrationId: params.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Course registration deleted successfully",
    })
  } catch (error) {
    console.error("Course registration deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 