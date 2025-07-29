import { hasUserPermission, getUserPermissions } from "./database"

export interface Permission {
  name: string
  resource: string
  action: string
  description?: string
}

export class RBACService {
  // Define role-based permissions - PROPERLY DIFFERENTIATED
  private static rolePermissions = {
    Administrator: [
      "view_results",
      "edit_results",
      "delete_results",
      "export_data",
      "manage_users",
      "view_audit_logs",
      "system_config",
      "view_security_events",
      "bulk_operations",
      "approve_results",
      "create_courses",
      "update_courses",
      "delete_courses",
      "view_courses",
      "view_course_registrations", // Administrators can view all course registrations
      "create_course_registrations", // Administrators can create course registrations
      "update_course_registrations", // Administrators can update course registrations
      "delete_course_registrations", // Administrators can delete course registrations
      "approve_course_registrations", // Administrators can approve course registrations
      "reject_course_registrations", // Administrators can reject course registrations
    ],
    Faculty: [
      "view_results",
      "edit_results", // Faculty can edit results for their courses
      "export_data", // Faculty can export their course data
      "approve_results", // Faculty can approve results from lecturers
      "view_course_registrations", // Faculty can view course registrations in their department
      "create_course_registrations", // Faculty can create course registrations
      "update_course_registrations", // Faculty can update course registrations
      "delete_course_registrations", // Faculty can delete course registrations
      "approve_course_registrations", // Faculty can approve course registrations
      "reject_course_registrations", // Faculty can reject course registrations
    ],
    Lecturer: [
      "view_results",
      "edit_results", // Lecturers can upload results (will be marked as pending)
      "request_result_upload", // Lecturers can request approval to upload results
      "export_data", // Lecturers can export their course data
    ],
    Student: [
      "view_results", // Students can ONLY view their own results
      "view_course_registrations", // Students can view their own course registrations
      "create_course_registrations", // Students can create course registrations
      "update_course_registrations", // Students can update their own course registrations
      "delete_course_registrations", // Students can delete their own course registrations
    ],
    Staff: [
      "view_results", // Staff can view results
      "view_audit_logs", // Staff can view audit logs
    ],
  }

  // Check if user has permission - FIXED FOR DEMO WITH PROPER ROLE DIFFERENTIATION
  static async hasPermission(userRole: string, permission: string): Promise<boolean> {
    try {
      console.log(`Checking permission: ${permission} for role: ${userRole}`)
      
      // For demo purposes, use hardcoded permissions if database is not available
      const isServer = typeof window === "undefined"
      const hasEnv = !!process.env.DATABASE_URL

      if (!isServer || !hasEnv) {
        // Demo mode - use hardcoded permissions with proper role differentiation
        console.log(`User role: "${userRole}"`)
        console.log(`Available roles:`, Object.keys(this.rolePermissions))
        const rolePerms = this.rolePermissions[userRole as keyof typeof this.rolePermissions] || []
        console.log(`Available permissions for ${userRole}:`, rolePerms)
        const hasPermission = rolePerms.includes(permission)
        console.log(`Permission ${permission} for ${userRole}: ${hasPermission}`)

        return hasPermission
      }

      // Real database check
      return await hasUserPermission(userRole, permission)
    } catch (error) {
      console.error("Permission check error:", error)
      // Fallback to hardcoded permissions on error
      const rolePerms = this.rolePermissions[userRole as keyof typeof this.rolePermissions] || []
      return rolePerms.includes(permission)
    }
  }

  // Get all permissions for a role - FIXED FOR DEMO
  static async getRolePermissions(userRole: string): Promise<Permission[]> {
    try {
      // For demo purposes, use hardcoded permissions if database is not available
      const isServer = typeof window === "undefined"
      const hasEnv = !!process.env.DATABASE_URL

      if (!isServer || !hasEnv) {
        // Demo mode - return hardcoded permissions
        const rolePerms = this.rolePermissions[userRole as keyof typeof this.rolePermissions] || []
        return rolePerms.map((perm) => ({
          name: perm,
          resource: "general",
          action: perm,
          description: `Permission to ${perm.replace("_", " ")}`,
        }))
      }

      // Real database query
      return await getUserPermissions(userRole)
    } catch (error) {
      console.error("Get role permissions error:", error)
      // Fallback to hardcoded permissions on error
      const rolePerms = this.rolePermissions[userRole as keyof typeof this.rolePermissions] || []
      return rolePerms.map((perm) => ({
        name: perm,
        resource: "general",
        action: perm,
        description: `Permission to ${perm.replace("_", " ")}`,
      }))
    }
  }

  // Specific permission checks for common operations
  static async canViewResults(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "view_results")
  }

  static async canEditResults(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "edit_results")
  }

  static async canDeleteResults(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "delete_results")
  }

  static async canExportData(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "export_data")
  }

  static async canManageUsers(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "manage_users")
  }

  static async canViewAuditLogs(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "view_audit_logs")
  }

  static async canViewSecurityEvents(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "view_security_events")
  }

  static async canPerformBulkOperations(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "bulk_operations")
  }

  static async canConfigureSystem(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "system_config")
  }

  static async canRequestResultUpload(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "request_result_upload")
  }

  // Result approval permissions
  static async canApproveResults(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "approve_results")
  }

  // Course management permissions
  static async canCreateCourses(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "create_courses")
  }

  static async canUpdateCourses(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "update_courses")
  }

  static async canDeleteCourses(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "delete_courses")
  }

  static async canViewCourses(userRole: string): Promise<boolean> {
    return await this.hasPermission(userRole, "view_courses")
  }


  // Role hierarchy check
  static isHigherRole(userRole: string, targetRole: string): boolean {
    const roleHierarchy = {
      Administrator: 4,
      Faculty: 3,
      Lecturer: 3, // Same level as Faculty
      Staff: 2,
      Student: 1,
    }

    return (
      (roleHierarchy[userRole as keyof typeof roleHierarchy] || 0) >
      (roleHierarchy[targetRole as keyof typeof roleHierarchy] || 0)
    )
  }
}
