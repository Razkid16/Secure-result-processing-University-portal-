import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getUsers } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only faculty and admin can view students
    if (user.role === "Student") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")

    const result = await getUsers()
    
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    // Filter for students only
    let students = result.data.filter((user: any) => user.role === 'Student')
    
    // Apply department filter if specified
    if (department) {
      students = students.filter((user: any) => user.department === department)
    }

    // Sort by name
    students.sort((a: any, b: any) => a.name.localeCompare(b.name))

    return NextResponse.json({
      success: true,
      data: students,
    })
  } catch (error) {
    console.error("Students API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
