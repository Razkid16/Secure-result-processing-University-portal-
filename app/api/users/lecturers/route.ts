import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getLecturersByDepartment, logAuditEvent, getUsers } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only faculty and administrators can access this endpoint
    if (user.role !== "Faculty" && user.role !== "Administrator") {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "lecturers",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Only faculty and administrators can view department lecturers" },
      })
      return NextResponse.json({ error: "Only faculty and administrators can view department lecturers" }, { status: 403 })
    }

    let lecturers
    let department = user.department

    if (user.role === "Administrator") {
      // For administrators, get all lecturers
      const allUsersResult = await getUsers()
      if (!allUsersResult.success) {
        return NextResponse.json({ error: allUsersResult.error }, { status: 500 })
      }
      lecturers = allUsersResult.data.filter((u: any) => u.role === "Lecturer")
      department = "All Departments"
    } else {
      // For faculty, get lecturers in their department
      const result = await getLecturersByDepartment(user.department)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      lecturers = result.data
    }

    // Log the access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_DEPARTMENT_LECTURERS",
      resource: "lecturers",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { 
        department: department,
        lecturerCount: lecturers.length 
      },
    })

    return NextResponse.json({
      success: true,
      lecturers: lecturers,
      department: department,
    })
  } catch (error) {
    console.error("Get department lecturers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 