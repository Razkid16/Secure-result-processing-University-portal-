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

    // Check if user can approve course registrations
    const canApproveRegistrations = await RBACService.hasPermission(user.role, "approve_course_registrations")

    if (!canApproveRegistrations) {
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
    const { approved_by } = body

    // Update the registration status to approved
    const approvedRegistration = await updateCourseRegistration(parseInt(params.id), {
      status: "Approved",
      approved_by: approved_by || user.id,
      approved_at: new Date().toISOString(),
      notes: "Approved by faculty"
    })

    // Log the approval event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "APPROVE_COURSE_REGISTRATION",
      resource: "course_registrations",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        registrationId: params.id,
        approvedBy: approved_by || user.id,
        approvedAt: approvedRegistration.approved_at
      }
    })

    return NextResponse.json({
      success: true,
      message: "Course registration approved successfully",
      data: approvedRegistration,
    })
  } catch (error) {
    console.error("Course registration approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 