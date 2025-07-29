import { NextRequest, NextResponse } from "next/server"
import { getCourseRegistrations, getUsers } from "@/lib/database"
import { getUserPermissions } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id)
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: "Invalid course ID" },
        { status: 400 }
      )
    }

    // Get all course registrations
    const allRegistrations = await getCourseRegistrations()
    
    // Filter registrations for this specific course
    const courseRegistrations = allRegistrations.filter(
      (registration: any) => registration.course_id === courseId
    )

    // Get all users to get student details
    const allUsersResult = await getUsers()
    const allUsers = allUsersResult.data || []
    
    // Map registrations to include student details
    const studentsWithDetails = courseRegistrations.map((registration: any) => {
      const student = allUsers.find((user: any) => user.id === registration.student_id)
      return {
        id: registration.id,
        student_id: registration.student_id,
        student_name: student?.name || "Unknown Student",
        student_email: student?.email || "unknown@example.com",
        student_matric_number: student?.matric_number || "N/A",
        student_level: student?.level || "N/A",
        course_id: registration.course_id,
        course_code: registration.course_code,
        course_title: registration.course_title,
        semester: registration.semester,
        session: registration.session,
        status: registration.status,
        registration_date: registration.registration_date,
        approved_by: registration.approved_by,
        approved_at: registration.approved_at,
        notes: registration.notes
      }
    })

    return NextResponse.json({
      success: true,
      data: studentsWithDetails
    })

  } catch (error) {
    console.error("Error fetching course students:", error)
    return NextResponse.json(
      { error: "Failed to fetch course students" },
      { status: 500 }
    )
  }
} 