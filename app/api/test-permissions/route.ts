import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test various permissions
    const permissions = [
      "view_courses",
      "create_courses", 
      "update_courses",
      "delete_courses",
      "view_results",
      "manage_users"
    ]

    const results: Record<string, boolean> = {}
    
    for (const permission of permissions) {
      const hasPermission = await RBACService.hasPermission(user.role, permission)
      results[permission] = hasPermission
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      },
      permissions: results
    })
  } catch (error) {
    console.error("Test permissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 