import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { logAuditEvent, updateCourseRegistration } from "@/lib/database"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can reject course registrations
    const canRejectRegistrations = await RBACService.hasPermission(user.role, "reject_course_registrations")

    if (!canRejectRegistrations) {
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
    const { rejected_by } = body

    // Update the registration status to rejected
    const rejectedRegistration = await updateCourseRegistration(parseInt(params.id), {
      status: "Rejected",
      approved_by: null,
      approved_at: null,
      notes: "Rejected by faculty"
    })

    // Log the rejection event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "REJECT_COURSE_REGISTRATION",
      resource: "course_registrations",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        registrationId: params.id,
        rejectedBy: rejected_by || user.id,
        rejectedAt: rejectedRegistration.rejected_at
      }
    })

    return NextResponse.json({
      success: true,
      message: "Course registration rejected successfully",
      data: rejectedRegistration,
    })
  } catch (error) {
    console.error("Course registration rejection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 