import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getUsers } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can access this test endpoint
    if (user.role !== "Administrator") {
      return NextResponse.json({ error: "Only administrators can access this endpoint" }, { status: 403 })
    }

    const result = await getUsers()

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const users = result.data || []
    
    // Group users by role and department
    const usersByRole = users.reduce((acc: any, user: any) => {
      if (!acc[user.role]) {
        acc[user.role] = []
      }
             acc[user.role].push({
         id: user.id,
         name: user.name,
         email: user.email,
         department: user.department,
         faculty_id: user.faculty_id,
         level: user.level,
         matric_number: user.matric_number,
         created_at: user.created_at
       })
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      usersByRole,
             allUsers: users.map((u: any) => ({
         id: u.id,
         name: u.name,
         email: u.email,
         role: u.role,
         department: u.department,
         faculty_id: u.faculty_id,
         level: u.level,
         matric_number: u.matric_number,
         created_at: u.created_at
       }))
    })
  } catch (error) {
    console.error("Test users API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 