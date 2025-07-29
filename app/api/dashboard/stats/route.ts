import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { getAllResults, getUsers, logAuditEvent } from "@/lib/database"

interface AcademicResult {
  id: number
  student_id: number
  student_name?: string
  student_email?: string
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  grade_point: number
  faculty_id: number
  faculty_name?: string
  lecturer_id?: number | null
  lecturer_name?: string | null
  status: "Draft" | "Published" | "Under Review" | "Pending" | "Denied"
  created_at: string
  updated_at: string
}

interface User {
  id: number
  email: string
  name: string
  role: string
  department: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get results data
    const resultsResponse = await getAllResults()
    const usersResponse = await getUsers()

    if (!resultsResponse.success || !usersResponse.success) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    }

    const allResults = resultsResponse.data || [] as AcademicResult[]
    const allUsers = usersResponse.data || [] as User[]

    // Filter results based on user role
    let filteredResults = allResults
    if (user.role === "Faculty") {
      filteredResults = allResults.filter((result: AcademicResult) => result.faculty_id === user.id)
    } else if (user.role === "Student") {
      // Students can only see their own published results
      filteredResults = allResults.filter((result: AcademicResult) => 
        result.student_id === user.id && result.status === "Published"
      )
    } else if (user.role === "Lecturer") {
      // Lecturers see results they created or results for their assigned courses
      filteredResults = allResults.filter((result: AcademicResult) => 
        result.lecturer_id === user.id || 
        (result.faculty_id === user.faculty_id && result.lecturer_id === null)
      )
    }

    // Calculate statistics
    const totalResults = filteredResults.length
    const publishedResults = filteredResults.filter((result: AcademicResult) => result.status === "Published").length
    const draftResults = filteredResults.filter((result: AcademicResult) => result.status === "Draft").length
    const underReviewResults = filteredResults.filter((result: AcademicResult) => result.status === "Under Review").length

    // Count students and faculty based on role
    let totalStudents = 0
    let totalFaculty = 0

    if (user.role === "Administrator") {
      totalStudents = allUsers.filter((u: User) => u.role === "Student").length
      totalFaculty = allUsers.filter((u: User) => u.role === "Faculty").length
    } else if (user.role === "Faculty") {
      // Faculty sees students in their courses
      const facultyStudents = new Set(
        filteredResults.map((result: AcademicResult) => result.student_id)
      )
      totalStudents = facultyStudents.size
      totalFaculty = 1 // Just themselves
    } else if (user.role === "Student") {
      totalStudents = 1 // Just themselves
      totalFaculty = 0
    }

    // Security alerts (demo data for now)
    const securityAlerts = user.role === "Administrator" ? 2 : 0

    // System health
    const systemHealth = "Good"

    // Recent activity (demo data)
    const recentActivity = user.role === "Administrator" ? 23 : 
                          user.role === "Faculty" ? 5 : 2

    const stats = {
      totalResults,
      publishedResults,
      draftResults,
      underReviewResults,
      totalStudents,
      totalFaculty,
      recentActivity,
      securityAlerts,
      systemHealth,
    }

    // Log the dashboard access
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_DASHBOARD_STATS",
      resource: "dashboard",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { role: user.role, stats },
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Dashboard stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 