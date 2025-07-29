import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { logAuditEvent, createCourseRegistration, getCourseRegistrations } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can view course registrations
    const canViewRegistrations = await RBACService.hasPermission(user.role, "view_course_registrations")

    if (!canViewRegistrations) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "course_registrations",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("student_id")
    const department = searchParams.get("department")

    // Get registrations from database
    const registrations = await getCourseRegistrations(
      studentId ? parseInt(studentId) : undefined,
      department || undefined
    )

    return NextResponse.json({
      success: true,
      data: registrations,
    })
  } catch (error) {
    console.error("Course registrations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can create course registrations
    const canCreateRegistrations = await RBACService.hasPermission(user.role, "create_course_registrations")

    if (!canCreateRegistrations) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "course_registrations",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Course registration request body:", body)
    const { student_id, course_id, semester, session, notes } = body

    // Validate required fields
    if (!student_id || !course_id || !semester || !session) {
      console.log("Missing required fields:", { student_id, course_id, semester, session })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create course registration in database
    const newRegistration = await createCourseRegistration({
      student_id: parseInt(student_id),
      course_id: parseInt(course_id),
      semester,
      session,
      notes: notes || null
    })

    // Log the registration event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE_COURSE_REGISTRATION",
      resource: "course_registrations",
      resourceId: newRegistration.id.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        studentId: newRegistration.student_id,
        courseId: newRegistration.course_id,
        semester: newRegistration.semester,
        session: newRegistration.session
      }
    })

    return NextResponse.json({
      success: true,
      message: "Course registration created successfully",
      data: newRegistration,
    })
  } catch (error) {
    console.error("Course registration creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 