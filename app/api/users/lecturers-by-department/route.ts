import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getLecturersByDepartment, logAuditEvent } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can access this endpoint
    if (user.role !== "Administrator") {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "lecturers_by_department",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Only administrators can view lecturers by department" },
      })
      return NextResponse.json({ error: "Only administrators can view lecturers by department" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")

    if (!department) {
      return NextResponse.json({ error: "Department parameter is required" }, { status: 400 })
    }

    // Get lecturers in the specified department
    const result = await getLecturersByDepartment(department)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Log the access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_LECTURERS_BY_DEPARTMENT",
      resource: "lecturers_by_department",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { 
        department: department,
        lecturerCount: result.data.length 
      },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      department: department,
    })
  } catch (error) {
    console.error("Get lecturers by department API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 