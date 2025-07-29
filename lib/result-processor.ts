import { executeQuery, logAuditEvent } from "./database"

export interface ResultData {
  studentId: number
  courseCode: string
  courseTitle: string
  semester: string
  academicYear: string
  score: number
  facultyId?: number
  department: string
}

export interface BulkResultData {
  studentEmail: string
  courseCode: string
  score: number
  semester: string
  academicYear: string
}

export class ResultProcessor {
  // Validate result data
  static validateResultData(data: any) {
    const errors: string[] = []

    if (!data.studentId || typeof data.studentId !== "number") {
      errors.push("Valid student ID is required")
    }

    if (!data.courseCode || typeof data.courseCode !== "string") {
      errors.push("Course code is required")
    }

    if (!data.courseTitle || typeof data.courseTitle !== "string") {
      errors.push("Course title is required")
    }

    if (!data.semester || typeof data.semester !== "string") {
      errors.push("Semester is required")
    }

    if (!data.academicYear || typeof data.academicYear !== "string") {
      errors.push("Academic year is required")
    }

    if (typeof data.score !== "number" || data.score < 0 || data.score > 100) {
      errors.push("Score must be a number between 0 and 100")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Get results based on user role and filters
  static async getResults(filters: any) {
    try {
      let query = `
        SELECT ar.*, 
               s.name as student_name, 
               s.email as student_email,
               f.name as faculty_name
        FROM academic_results ar
        LEFT JOIN users s ON ar.student_id = s.id
        LEFT JOIN users f ON ar.faculty_id = f.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      // Apply role-based filtering
      if (filters.studentId) {
        query += ` AND ar.student_id = $${paramIndex}`
        params.push(filters.studentId)
        paramIndex++
      }

      if (filters.facultyId) {
        query += ` AND ar.faculty_id = $${paramIndex}`
        params.push(filters.facultyId)
        paramIndex++
      }

      if (filters.courseCode) {
        query += ` AND ar.course_code = $${paramIndex}`
        params.push(filters.courseCode)
        paramIndex++
      }

      if (filters.semester) {
        query += ` AND ar.semester = $${paramIndex}`
        params.push(filters.semester)
        paramIndex++
      }

      if (filters.academicYear) {
        query += ` AND ar.academic_year = $${paramIndex}`
        params.push(filters.academicYear)
        paramIndex++
      }

      if (filters.department) {
        query += ` AND ar.department = $${paramIndex}`
        params.push(filters.department)
        paramIndex++
      }

      query += ` ORDER BY ar.created_at DESC`

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`
        params.push(filters.limit)
        paramIndex++
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`
        params.push(filters.offset)
        paramIndex++
      }

      const result = await executeQuery(query, params)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      return {
        success: true,
        data: result.data || [],
        total: result.data?.length || 0,
      }
    } catch (error) {
      console.error("Error getting results:", error)
      return { success: false, error: "Failed to fetch results" }
    }
  }

  // Create a new result
  static async createResult(data: ResultData, userId: number, userEmail: string, ipAddress: string) {
    try {
      const grade = this.calculateGrade(data.score)

      const result = await executeQuery(
        `
        INSERT INTO academic_results (
          student_id, course_code, course_title, semester, academic_year, 
          score, grade, faculty_id, department, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING *
      `,
        [
          data.studentId,
          data.courseCode,
          data.courseTitle,
          data.semester,
          data.academicYear,
          data.score,
          grade,
          data.facultyId || userId,
          data.department,
        ],
      )

      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Log the action
      await logAuditEvent({
        userId,
        userEmail,
        action: "CREATE_RESULT",
        resource: "results",
        resourceId: result.data?.[0]?.id?.toString(),
        ipAddress,
        status: "SUCCESS",
        riskLevel: "LOW",
        details: {
          studentId: data.studentId,
          courseCode: data.courseCode,
          score: data.score,
        },
      })

      return { success: true, data: result.data?.[0] }
    } catch (error) {
      console.error("Error creating result:", error)
      return { success: false, error: "Failed to create result" }
    }
  }

  // Update a result
  static async updateResult(resultId: number, data: any, userId: number, userEmail: string, ipAddress: string) {
    try {
      const grade = this.calculateGrade(data.score)

      const result = await executeQuery(
        `
        UPDATE academic_results 
        SET score = $1, grade = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `,
        [data.score, grade, resultId],
      )

      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Log the action
      await logAuditEvent({
        userId,
        userEmail,
        action: "UPDATE_RESULT",
        resource: "results",
        resourceId: resultId.toString(),
        ipAddress,
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          newScore: data.score,
          newGrade: grade,
        },
      })

      return { success: true, data: result.data?.[0] }
    } catch (error) {
      console.error("Error updating result:", error)
      return { success: false, error: "Failed to update result" }
    }
  }

  // Delete a result
  static async deleteResult(resultId: number, userId: number, userEmail: string, ipAddress: string) {
    try {
      // Get result details before deletion for audit log
      const getResult = await executeQuery("SELECT * FROM academic_results WHERE id = $1", [resultId])

      const result = await executeQuery("DELETE FROM academic_results WHERE id = $1 RETURNING *", [resultId])

      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Log the action
      await logAuditEvent({
        userId,
        userEmail,
        action: "DELETE_RESULT",
        resource: "results",
        resourceId: resultId.toString(),
        ipAddress,
        status: "SUCCESS",
        riskLevel: "HIGH",
        details: {
          deletedResult: getResult.success && getResult.data ? getResult.data[0] : null,
        },
      })

      return { success: true }
    } catch (error) {
      console.error("Error deleting result:", error)
      return { success: false, error: "Failed to delete result" }
    }
  }

  // Export results to CSV
  static async exportResults(filters: any, userId: number, userEmail: string, ipAddress: string) {
    try {
      const results = await this.getResults(filters)

      if (!results.success) {
        return { success: false, error: results.error }
      }

      // Convert to CSV
      const headers = [
        "Student Name",
        "Student Email",
        "Course Code",
        "Course Title",
        "Score",
        "Grade",
        "Semester",
        "Academic Year",
        "Department",
        "Date Added",
      ]

      const csvRows = [headers.join(",")]

      for (const result of results.data || []) {
        const row = [
          `"${result.student_name || ""}"`,
          `"${result.student_email || ""}"`,
          `"${result.course_code || ""}"`,
          `"${result.course_title || ""}"`,
          result.score || 0,
          `"${result.grade || ""}"`,
          `"${result.semester || ""}"`,
          `"${result.academic_year || ""}"`,
          `"${result.department || ""}"`,
          `"${new Date(result.created_at).toLocaleDateString()}"`,
        ]
        csvRows.push(row.join(","))
      }

      const csvContent = csvRows.join("\n")

      // Log the export action
      await logAuditEvent({
        userId,
        userEmail,
        action: "EXPORT_RESULTS",
        resource: "results",
        ipAddress,
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          recordCount: results.data?.length || 0,
          filters,
        },
      })

      return { success: true, data: csvContent }
    } catch (error) {
      console.error("Error exporting results:", error)
      return { success: false, error: "Failed to export results" }
    }
  }

  // Calculate grade from score
  private static calculateGrade(score: number): string {
    if (score >= 90) return "A+"
    if (score >= 85) return "A"
    if (score >= 80) return "B+"
    if (score >= 75) return "B"
    if (score >= 70) return "C+"
    if (score >= 65) return "C"
    if (score >= 60) return "D+"
    if (score >= 55) return "D"
    if (score >= 50) return "E"
    return "F"
  }

  // Process bulk results
  static async processBulkResults(
    bulkData: BulkResultData[],
    department: string,
    userId: number,
    userEmail: string,
    ipAddress: string,
  ) {
    try {
      let processed = 0
      const errors: string[] = []

      for (const item of bulkData) {
        try {
          // Find student by email
          const studentResult = await executeQuery("SELECT id FROM users WHERE email = $1 AND role = 'Student'", [
            item.studentEmail,
          ])

          if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
            errors.push(`Student not found: ${item.studentEmail}`)
            continue
          }

          // Find course by code
          const courseResult = await executeQuery("SELECT * FROM courses WHERE course_code = $1", [item.courseCode])

          if (!courseResult.success || !courseResult.data || courseResult.data.length === 0) {
            errors.push(`Course not found: ${item.courseCode}`)
            continue
          }

          const student = studentResult.data![0]
          const course = courseResult.data![0]

          // Create result
          const resultData: ResultData = {
            studentId: student.id,
            courseCode: course.course_code,
            courseTitle: course.course_title,
            semester: item.semester,
            academicYear: item.academicYear,
            score: item.score,
            facultyId: userId,
            department: course.department || department,
          }

          const createResult = await this.createResult(resultData, userId, userEmail, ipAddress)

          if (createResult.success) {
            processed++
          } else {
            errors.push(`Failed to create result for ${item.studentEmail}: ${createResult.error}`)
          }
        } catch (error) {
          errors.push(`Error processing ${item.studentEmail}: ${error}`)
        }
      }

      return {
        success: true,
        processed,
        errors,
      }
    } catch (error) {
      console.error("Error processing bulk results:", error)
      return { success: false, error: "Failed to process bulk results" }
    }
  }
}
