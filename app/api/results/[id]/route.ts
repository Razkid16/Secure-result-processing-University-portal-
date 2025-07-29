import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { updateResult, deleteResult, getAllResults, logAuditEvent } from "@/lib/database"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions based on role
    let canEditResults = false
    
    if (user.role === "Administrator") {
      canEditResults = true
    } else if (user.role === "Faculty") {
      canEditResults = await RBACService.hasPermission(user.role, "edit_results")
    } else if (user.role === "Lecturer") {
      // Lecturers can always forward results for approval (this is their primary function)
      canEditResults = true
    } else {
      canEditResults = false
    }

    if (!canEditResults) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "results",
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { attemptedAction: "UPDATE_RESULT" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators, faculty, and lecturers can edit results" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const resultId = Number.parseInt(params.id)

    // Validate required fields
    if (body.ca_score !== undefined && (body.ca_score < 0 || body.ca_score > 30)) {
      return NextResponse.json({ error: "CA score must be between 0 and 30" }, { status: 400 })
    }
    if (body.exam_score !== undefined && (body.exam_score < 0 || body.exam_score > 70)) {
      return NextResponse.json({ error: "Exam score must be between 0 and 70" }, { status: 400 })
    }

    // Calculate total score and grade if scores are being updated
    let updateData = { ...body }
    if (body.ca_score !== undefined || body.exam_score !== undefined) {
      // Get current result to calculate new total
      const currentResult = await getAllResults()
      const result = currentResult.data?.find((r: any) => r.id === resultId)
      
      if (result) {
        const newCaScore = body.ca_score !== undefined ? body.ca_score : result.ca_score
        const newExamScore = body.exam_score !== undefined ? body.exam_score : result.exam_score
        const totalScore = newCaScore + newExamScore
        const { grade, point } = calculateGrade(totalScore)
        
        updateData = {
          ...updateData,
          total_score: totalScore,
          grade,
          grade_point: point,
        }
      }
    }

    // Handle lecturer approval workflow
    if (user.role === "Lecturer") {
      // Set status to "Pending" for lecturers when forwarding for approval
      updateData.status = "Pending"
      
      // Get the lecturer's assigned faculty
      const lecturerFacultyId = user.faculty_id
      if (!lecturerFacultyId) {
        return NextResponse.json({ 
          error: "You are not assigned to any faculty. Please contact the administrator." 
        }, { status: 400 })
      }
      
      // Assign to the lecturer's faculty
      updateData.faculty_id = lecturerFacultyId
    }

    const result = await updateResult(resultId, updateData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: user.role === "Lecturer" ? "FORWARD_RESULT_FOR_APPROVAL" : "UPDATE_RESULT",
      resource: "results",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { 
        updatedFields: Object.keys(body),
        role: user.role,
        ...(user.role === "Lecturer" && { facultyId: user.faculty_id })
      },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      message: user.role === "Lecturer" 
        ? "Result has been forwarded to your assigned faculty for approval" 
        : "Result updated successfully"
    })
  } catch (error) {
    console.error("Update result API error:", error)
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

    // Check if user can delete results
    const canDeleteResults = await RBACService.hasPermission(user.role, "delete_results")

    if (!canDeleteResults) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "results",
        resourceId: params.id,
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { attemptedAction: "DELETE_RESULT" },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators can delete results" },
        { status: 403 },
      )
    }

    const resultId = Number.parseInt(params.id)
    const result = await deleteResult(resultId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "DELETE_RESULT",
      resource: "results",
      resourceId: params.id,
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "HIGH",
      details: { 
        deletedResult: result.data,
        role: user.role
      },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error("Delete result API error:", error)
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
