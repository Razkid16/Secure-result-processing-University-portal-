import { NextRequest, NextResponse } from 'next/server'
import { getValidSession } from '@/lib/database'
import { RBACService } from '@/lib/rbac'
import { createCourse, getCourses, getUsers } from '@/lib/database'

export async function GET(request: NextRequest) {
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

    // Get all courses
    const courses = await getCourses()
    
    // Get all users to map lecturer names
    const usersResponse = await getUsers()
    
    // Add lecturer names to courses
    const coursesWithLecturerNames = courses.map((course: any) => {
      const lecturer = usersResponse.success ? usersResponse.data.find((user: any) => user.id === course.lecturer_id) : null
      return {
        ...course,
        lecturer_name: lecturer ? lecturer.name : 'Not assigned'
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: coursesWithLecturerNames 
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/courses - Starting course creation')
    
    // Get session token from cookies
    const sessionToken = request.cookies.get('secure_session')?.value

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate session and get user
    const session = await getValidSession(sessionToken)
    if (!session) {
      console.log('Invalid session')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
    }

    console.log('User:', user)

    // Check if user can create courses
    const canCreateCourses = await RBACService.hasPermission(user.role, "create_courses")
    console.log('Can create courses:', canCreateCourses)

    if (!canCreateCourses) {
      console.log('Insufficient permissions')
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    console.log('Request body:', body)
    
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

    console.log('Extracted fields:', { course_code, course_title, department, credits, semester, academic_year, lecturer_id, capacity, is_active })

    // Validate required fields
    if (!course_code || !course_title || !department || !credits || !semester || !academic_year || !capacity) {
      console.log('Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields: course_code, course_title, department, credits, semester, academic_year, capacity' 
      }, { status: 400 })
    }

    // Get lecturer name if lecturer_id is provided
    let lecturer_name = null
    if (lecturer_id && lecturer_id !== 'none') {
      const allUsersResult = await getUsers()
      if (allUsersResult.success) {
        const lecturer = allUsersResult.data.find((u: any) => u.id === Number(lecturer_id) && u.role === 'Lecturer')
        lecturer_name = lecturer ? lecturer.name : null
      }
    }

    // Create course
    const newCourse = await createCourse({
      course_code,
      course_title,
      department,
      credits: Number(credits),
      semester,
      academic_year,
      lecturer_id: lecturer_id === 'none' ? null : Number(lecturer_id),
      capacity: Number(capacity),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_by: user.id,
    })

    // Add lecturer name to the response
    const courseWithLecturerName = {
      ...newCourse,
      lecturer_name
    }

    return NextResponse.json({ course: courseWithLecturerName }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 