import { NextRequest, NextResponse } from 'next/server'
import { getValidSession } from '@/lib/database'
import { RBACService } from '@/lib/rbac'
import { getCourseById, updateCourse, deleteCourse } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('secure_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session and get user
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
    }

    // Check if user can view courses
    const canViewCourses = await RBACService.hasPermission(user.role, "view_courses")

    if (!canViewCourses) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Get course by ID
    const course = await getCourseById(courseId)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('secure_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session and get user
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
    }

    // Check if user can update courses
    const canUpdateCourses = await RBACService.hasPermission(user.role, "update_courses")

    if (!canUpdateCourses) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    console.log('PUT /api/courses/[id] - Request body:', body)
    
    const { 
      course_code, 
      course_title, 
      department, 
      credits, 
      semester, 
      academic_year, 
      lecturer_id, 
      capacity,
      is_active 
    } = body

    console.log('PUT /api/courses/[id] - Extracted fields:', { 
      course_code, course_title, department, credits, semester, 
      academic_year, lecturer_id, capacity, is_active 
    })

    // Get lecturer name if lecturer_id is provided
    let lecturer_name = null
    if (lecturer_id && lecturer_id !== 'none') {
      const { getUsers } = await import('@/lib/database')
      const allUsersResult = await getUsers()
      if (allUsersResult.success) {
        const lecturer = allUsersResult.data.find((u: any) => u.id === Number(lecturer_id) && u.role === 'Lecturer')
        lecturer_name = lecturer ? lecturer.name : null
      }
    }

    // Update course
    const updatedCourse = await updateCourse(courseId, {
      course_code,
      course_title,
      department,
      credits: credits ? Number(credits) : undefined,
      semester,
      academic_year,
      lecturer_id: lecturer_id === 'none' ? null : Number(lecturer_id),
      capacity: capacity ? Number(capacity) : undefined,
      is_active,
    })

    // Add lecturer name to the response
    const courseWithLecturerName = {
      ...updatedCourse,
      lecturer_name
    }

    return NextResponse.json({ course: courseWithLecturerName })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('secure_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session and get user
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
    }

    // Check if user can delete courses
    const canDeleteCourses = await RBACService.hasPermission(user.role, "delete_courses")

    if (!canDeleteCourses) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

    // Delete course
    const deletedCourse = await deleteCourse(courseId)

    return NextResponse.json({ course: deletedCourse })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 