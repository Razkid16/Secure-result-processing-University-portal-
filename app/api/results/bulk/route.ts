import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { createResult, getUsers, logAuditEvent } from "@/lib/database"

interface BulkResultData {
  student_id: number
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  faculty_id: number
  status?: "Draft" | "Published" | "Under Review"
}

interface BulkUploadRequest {
  results: BulkResultData[]
  faculty_id?: number
  semester: string
  session: string
  status?: "Draft" | "Published" | "Under Review"
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can perform bulk operations (Admin only)
    const canBulkOps = await RBACService.canPerformBulkOperations(user.role)

    if (!canBulkOps) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_BULK_UPLOAD",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { reason: "Insufficient permissions for bulk operations" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can perform bulk operations" },
        { status: 403 },
      )
    }

    const body: BulkUploadRequest = await request.json()
    const { results, faculty_id, semester, session, status = "Draft" } = body

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "Results array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Validate required fields for each result
    for (const result of results) {
      if (!result.student_id || !result.course_code || !result.course_title) {
        return NextResponse.json(
          { error: "Each result must have student_id, course_code, and course_title" },
          { status: 400 }
        )
      }
    }

    // Get all students to validate student IDs
    const usersResponse = await getUsers()
    if (!usersResponse.success) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const students = usersResponse.data.filter((u: any) => u.role === "Student")
    const studentIds = new Set(students.map((s: any) => s.id))

    // Validate that all student IDs exist
    const invalidStudentIds = results
      .map(r => r.student_id)
      .filter(id => !studentIds.has(id))

    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid student IDs: ${invalidStudentIds.join(", ")}` },
        { status: 400 }
      )
    }

    // Calculate grades and create results
    const createdResults = []
    const errors = []

    for (const resultData of results) {
      try {
        const totalScore = resultData.ca_score + resultData.exam_score
        const { grade, point } = calculateGrade(totalScore)

        const result = await createResult({
          student_id: resultData.student_id,
          course_code: resultData.course_code,
          course_title: resultData.course_title,
          semester: resultData.semester || semester,
          session: resultData.session || session,
          ca_score: resultData.ca_score,
          exam_score: resultData.exam_score,
          total_score: totalScore,
          grade,
          grade_point: point,
          faculty_id: resultData.faculty_id || faculty_id || user.id,
          status: resultData.status || status,
        })

        if (result.success) {
          createdResults.push(result.data)
        } else {
          errors.push({
            student_id: resultData.student_id,
            course_code: resultData.course_code,
            error: result.error || "Failed to create result"
          })
        }
      } catch (error) {
        errors.push({
          student_id: resultData.student_id,
          course_code: resultData.course_code,
          error: "Unexpected error"
        })
      }
    }

    // Log the bulk upload
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "BULK_UPLOAD_RESULTS",
      resource: "results",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        totalRequested: results.length,
        created: createdResults.length,
        errors: errors.length,
        semester,
        session,
        status,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        created: createdResults.length,
        errors: errors.length,
        errorDetails: errors,
        total: results.length,
      },
    })
  } catch (error) {
    console.error("Bulk upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateGrade(total: number): { grade: string; point: number } {
  if (total >= 70) return { grade: "A", point: 5.0 }
  if (total >= 60) return { grade: "B", point: 4.0 }
  if (total >= 50) return { grade: "C", point: 3.0 }
  if (total >= 45) return { grade: "D", point: 2.0 }
  if (total >= 40) return { grade: "E", point: 1.0 }
  return { grade: "F", point: 0.0 }
}
