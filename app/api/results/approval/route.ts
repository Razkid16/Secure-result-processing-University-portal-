import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { 
  getAllResults,
  updateResult,
  logAuditEvent,
  signResult
} from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    const canViewRequests = await RBACService.hasPermission(user.role, "view_results")
    if (!canViewRequests) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get all results
    const result = await getAllResults()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Check for history query param
    const url = new URL(request.url)
    const showHistory = url.searchParams.get("history") === "1"

    let filteredResults = []

    if (user.role === "Faculty") {
      if (showHistory) {
        // Show all results for this faculty that are approved, denied, or have been modified
        filteredResults = result.data.filter((r: any) =>
          (r.status === "Published" || r.status === "Denied" || r.status === "Under Review" || r.status === "Draft") && r.faculty_id === user.faculty_id
        )
      } else {
        // Show only pending results for this faculty
        filteredResults = result.data.filter((r: any) =>
          r.status === "Pending" && r.faculty_id === user.faculty_id
        )
      }
    } else if (user.role === "Lecturer") {
      if (showHistory) {
        // Show all results for this faculty that are approved, denied, or have been modified
        filteredResults = result.data.filter((r: any) =>
          (r.status === "Published" || r.status === "Denied" || r.status === "Under Review" || r.status === "Draft") && r.faculty_id === user.faculty_id
        )
      } else {
        // Show only pending results for this faculty
        filteredResults = result.data.filter((r: any) =>
          r.status === "Pending" && r.faculty_id === user.faculty_id
        )
      }
    }

    // Populate student names for results
    filteredResults = filteredResults.map((r: any) => {
      // Populate student name and email
      const student = global.__inMemoryDB?.users?.find((u: any) => u.id === r.student_id)
      if (student) {
        r.student_name = student.name
        r.student_email = student.email
      }
      return r
    })

    // Log the access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: showHistory ? "VIEW_APPROVED_DENIED_RESULTS" : "VIEW_PENDING_RESULTS",
      resource: "results",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { count: filteredResults.length },
    })

    return NextResponse.json({
      success: true,
      data: filteredResults,
    })
  } catch (error) {
    console.error("Result approval API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only faculty can approve/deny results
    if (user.role !== "Faculty") {
      return NextResponse.json({ error: "Only faculty can approve/deny results" }, { status: 403 })
    }

    const body = await request.json()
    const { resultId, action, reason } = body

    // Validate required fields
    if (!resultId || !action || (action !== "approve" && action !== "deny")) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      )
    }

    // Get the result to verify it belongs to this faculty
    const allResults = await getAllResults()
    if (!allResults.success) {
      return NextResponse.json({ error: allResults.error }, { status: 500 })
    }

    const targetResult = allResults.data.find((r: any) => r.id === resultId)
    if (!targetResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    if (targetResult.faculty_id !== user.faculty_id) {
      return NextResponse.json({ error: "You can only approve/deny results assigned to you" }, { status: 403 })
    }

    if (targetResult.status !== "Pending") {
      return NextResponse.json({ error: "Only pending results can be approved/denied" }, { status: 400 })
    }

    // Update the result status
    const newStatus = action === "approve" ? "Published" : "Denied"
    const updateResultResponse = await updateResult(resultId, {
      status: newStatus,
      approval_notes: reason || null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })

    if (!updateResultResponse.success) {
      return NextResponse.json({ error: updateResultResponse.error }, { status: 500 })
    }

    // Automatically sign the result for approval/denial actions
    const signatureAction = action === 'approve' ? 'approve' : 'deny';
    await signResult(resultId, user.id, signatureAction);

    // Log the approval/denial
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: action === "approve" ? "APPROVE_RESULT" : "DENY_RESULT",
      resource: "results",
      resourceId: resultId.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { 
        resultId,
        action,
        reason: reason || null,
        courseCode: targetResult.course_code,
        studentId: targetResult.student_id
      },
    })

    return NextResponse.json({
      success: true,
      data: updateResultResponse.data,
      message: `Result ${action === "approve" ? "approved" : "denied"} successfully`
    })
  } catch (error) {
    console.error("Approve/deny result API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 