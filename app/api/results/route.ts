import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAllResults, createResult, updateResult, deleteResult, getUsers, logAuditEvent, canLecturerUploadResults, signResult } from "@/lib/database"
import { CryptoService } from "@/lib/crypto"

declare global {
  var __inMemoryDB: any
}

function calculateGrade(total: number): { grade: string; point: number } {
  if (total >= 70) return { grade: "A", point: 5.0 }
  if (total >= 60) return { grade: "B", point: 4.0 }
  if (total >= 50) return { grade: "C", point: 3.0 }
  if (total >= 45) return { grade: "D", point: 2.0 }
  if (total >= 40) return { grade: "E", point: 1.0 }
  return { grade: "F", point: 0.0 }
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('Results API - Current user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department
    });

    // Check if user can view results
    const canViewResults = await RBACService.hasPermission(user.role, "view_results")

    if (!canViewResults) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      })

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: any = {}

    // Apply role-based filtering
    if (user.role === "Student") {
      // Students can only see their own results
      filters.studentId = user.id
      console.log('Student filtering - student ID:', user.id);
    } else if (user.role === "Faculty") {
      // Faculty can see results for their courses/department
      filters.facultyId = user.id
    }
    // Admin can see all results (no additional filters)

    // Get all results and apply filtering
    const result = await getAllResults()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    let filteredResults = result.data
    console.log('All results from database:', filteredResults.length);
    console.log('Sample result:', filteredResults[0]);

    // Populate lecturer names and credits for results
    filteredResults = filteredResults.map((r: any) => {
      // Add lecturer name if lecturer_id exists
      if (r.lecturer_id) {
        const lecturer = global.__inMemoryDB?.users?.find((u: any) => u.id === r.lecturer_id)
        if (lecturer) {
          r.lecturer_name = lecturer.name
        }
      }
      
      // Add credits from course data
      const course = global.__inMemoryDB?.courses?.find((c: any) => c.course_code === r.course_code)
      if (course) {
        r.credits = course.credits
        
        // If result doesn't have lecturer info, get it from the course
        if (!r.lecturer_id && course.lecturer_id) {
          const courseLecturer = global.__inMemoryDB?.users?.find((u: any) => u.id === course.lecturer_id)
          if (courseLecturer) {
            r.lecturer_id = course.lecturer_id
            r.lecturer_name = courseLecturer.name
            r.lecturer_email = courseLecturer.email
          }
        }
      } else {
        r.credits = 0 // Default to 0 if course not found
      }
      
      // Debug grade point information
      console.log(`Result ${r.id} - Grade: ${r.grade}, Grade Point: ${r.grade_point}, Total Score: ${r.total_score}, Lecturer: ${r.lecturer_name || 'N/A'}`);
      
      return r
    })

    // Apply role-based filtering
    if (user.role === "Student") {
      // Students can only see their own published results
      filteredResults = filteredResults.filter((r: any) => 
        r.student_id === user.id && r.status === "Published"
      )
      console.log('After student filtering - results count:', filteredResults.length);
    } else if (user.role === "Faculty") {
      filteredResults = filteredResults.filter((r: any) => r.faculty_id === user.id)
    } else if (user.role === "Lecturer") {
      // For lecturers, filter by their faculty_id
      filteredResults = filteredResults.filter((r: any) => r.faculty_id === user.faculty_id)
      // Keep approval notes for denied results so lecturers can see denial reasons
      filteredResults = filteredResults.map((r: any) => {
        if (r.status === "Denied") {
          // Keep approval notes for denied results
          return r
        } else {
          // Remove approval notes for non-denied results
          const { approval_notes, approved_by, approved_at, ...resultWithoutApprovalNotes } = r
          return resultWithoutApprovalNotes
        }
      })
    }

    // Apply additional filters
    if (searchParams.get("courseCode")) {
      filteredResults = filteredResults.filter((r: any) => 
        r.course_code.toLowerCase().includes(searchParams.get("courseCode")!.toLowerCase())
      )
    }
    if (searchParams.get("semester")) {
      filteredResults = filteredResults.filter((r: any) => r.semester === searchParams.get("semester"))
    }
    if (searchParams.get("session")) {
      filteredResults = filteredResults.filter((r: any) => r.session === searchParams.get("session"))
    }

    // Apply pagination
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const paginatedResults = filteredResults.slice(offset, offset + limit)

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_RESULTS",
      resource: "results",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        role: user.role,
        resultCount: result.data?.length || 0,
        filters,
      },
    })

    return NextResponse.json({
      success: true,
      data: paginatedResults,
      total: filteredResults.length,
    })
  } catch (error) {
    console.error("Results API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      student_id, 
      course_code, 
      course_title, 
      semester, 
      session, 
      ca_score, 
      exam_score, 
      total_score, 
      grade_point, 
      faculty_id
    } = body;
    
    let requestStatus: "Draft" | "Published" | "Under Review" | "Pending" | "Denied" = (body.status as any) || "Draft";

    // Check permissions based on role
    let canCreateResults = false
    
    if (user.role === "Administrator") {
      canCreateResults = true
    } else if (user.role === "Faculty") {
      canCreateResults = await RBACService.hasPermission(user.role, "edit_results")
    } else if (user.role === "Lecturer") {
      // Lecturers can always forward results for approval (this is their primary function)
      canCreateResults = true
    } else {
      canCreateResults = false
    }

    if (!canCreateResults) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
        details: { attemptedAction: "ADD_RESULT", userRole: user.role },
      })

      return NextResponse.json(
        { error: "Insufficient permissions - Only administrators, faculty, and lecturers can add results" },
        { status: 403 },
      )
    }

    // Validate required fields
    const requiredFields = ['student_id', 'course_code', 'course_title', 'semester', 'session', 'ca_score', 'exam_score']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: missingFields 
      }, { status: 400 })
    }

    // Validate scores
    if (body.ca_score < 0 || body.ca_score > 30) {
      return NextResponse.json({ error: "CA score must be between 0 and 30" }, { status: 400 })
    }
    if (body.exam_score < 0 || body.exam_score > 70) {
      return NextResponse.json({ error: "Exam score must be between 0 and 70" }, { status: 400 })
    }

    // Calculate total score and grade
    const totalScore = body.ca_score + body.exam_score
    const { grade, point } = calculateGrade(totalScore)

    // Set status and faculty assignment based on user role
    let assignedFacultyId = body.faculty_id || user.id

    if (user.role === "Lecturer") {
      requestStatus = "Pending" // Lecturers' results are automatically pending
      
      // Get the lecturer's assigned faculty
      const lecturerFacultyId = user.faculty_id
      if (!lecturerFacultyId) {
        return NextResponse.json({ 
          error: "You are not assigned to any faculty. Please contact the administrator." 
        }, { status: 400 })
      }
      
      assignedFacultyId = lecturerFacultyId // Assign to the lecturer's faculty
    }

    // For Lecturer role and Pending status, generate hash and capture additional info
    let hash = null;
    let lecturer_id = null;
    let lecturer_email = null;
    let lecturer_name = null;
    let ip_address = null;
    let location = null;
    let user_agent = null;

    if (user.role === 'lecturer' && requestStatus === 'Pending') {
      // Capture IP address
      ip_address = request.ip || 
                   request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
      
      // Capture user agent
      user_agent = request.headers.get('user-agent') || 'unknown';
      
      // Placeholder for location (in real implementation, you'd use a geolocation service)
      location = 'Unknown Location';
      
      lecturer_id = user.id;
      lecturer_email = user.email;
      lecturer_name = user.name;

      // Generate hash including lecturer information
      const hashData = {
        student_id,
        course_code,
        course_title,
        semester,
        session,
        ca_score,
        exam_score,
        total_score,
        grade,
        grade_point,
        faculty_id,
        lecturer_id,
        lecturer_email,
        lecturer_name,
        ip_address,
        location,
        user_agent,
        timestamp: new Date().toISOString()
      };
      
      console.log('Generating hash for lecturer submission:')
      console.log('- Hash data:', JSON.stringify(hashData, null, 2))
      
      hash = CryptoService.generateHash(JSON.stringify(hashData));
      
      console.log('- Generated hash:', hash)
      console.log('- Hash length:', hash.length)
    }

    const result = await createResult({
      student_id,
      course_code,
      course_title,
      semester,
      session,
      ca_score,
      exam_score,
      total_score,
      grade,
      grade_point,
      faculty_id,
      status: requestStatus,
      hash,
      lecturer_id,
      lecturer_email,
      lecturer_name,
      ip_address,
      location,
      user_agent
    });

    if (result.success) {
      // Automatically sign the result if it's a lecturer submission
      if (user.role === 'lecturer' && requestStatus === 'Pending' && result.data) {
        await signResult(result.data.id, user.id, 'submit');
      }

      // Note: Audit logging is already handled in ResultProcessor.createResult()
      // Additional audit log for API access
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "CREATE_RESULT_API",
        resource: "results",
        resourceId: (result.data as any)?.id?.toString() || "unknown",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: { 
          studentId: student_id,
          courseCode: course_code,
          score: total_score,
          role: user.role
        },
      })

      return NextResponse.json({
        success: true,
        data: result.data,
        message: user.role === "Lecturer" 
          ? "Result has been forwarded to your assigned faculty for approval" 
          : "Result created successfully"
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Create result API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
