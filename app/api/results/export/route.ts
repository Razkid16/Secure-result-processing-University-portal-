import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { ResultProcessor } from "@/lib/result-processor"
import { logAuditEvent } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can export data (Admin and Faculty only - Students cannot)
    const canExportData = await RBACService.hasPermission(user.role, "export_data")

    if (!canExportData) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "results_export",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { attemptedAction: "EXPORT_RESULTS" },
      })

      return NextResponse.json({ error: "Insufficient permissions - Students cannot export data" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: any = {}

    // Apply role-based filtering for export
    if (user.role === "Faculty") {
      // Faculty can only export their course data
      filters.facultyId = user.id
    }
    // Admin can export all data (no additional filters)

    // Add query parameters
    if (searchParams.get("courseCode")) filters.courseCode = searchParams.get("courseCode")
    if (searchParams.get("semester")) filters.semester = searchParams.get("semester")
    if (searchParams.get("academicYear")) filters.academicYear = searchParams.get("academicYear")
    if (searchParams.get("department")) filters.department = searchParams.get("department")

    const result = await ResultProcessor.exportResults(filters, user.id, user.email, request.ip || "unknown")

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="academic_results_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export results API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
