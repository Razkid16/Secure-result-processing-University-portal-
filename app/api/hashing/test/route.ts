import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { createResult } from "@/lib/database"
import { CryptoService } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  const user = await AuthService.getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only administrators can create test data
  if (user.role !== "Administrator") {
    return NextResponse.json({ error: "Only administrators can create test data" }, { status: 403 })
  }

  try {
    // Create a test result with a hash
    const testResultData = {
      student_id: 1,
      course_code: "TEST101",
      course_title: "Test Course",
      semester: "First",
      session: "2023/2024",
      ca_score: 25,
      exam_score: 45,
      total_score: 70,
      grade: "A",
      grade_point: 5.0,
      faculty_id: 2,
      status: "Pending" as const,
      lecturer_id: 3,
      lecturer_email: "test.lecturer@example.com",
      lecturer_name: "Test Lecturer",
      ip_address: "127.0.0.1",
      location: "Test Location",
      user_agent: "Test User Agent"
    }

    // Generate hash for the test result
    const hashData = {
      ...testResultData,
      timestamp: new Date().toISOString()
    }

    console.log('Creating test result with hash:')
    console.log('- Hash data:', JSON.stringify(hashData, null, 2))

    const hash = CryptoService.generateHash(JSON.stringify(hashData))
    
    console.log('- Generated hash:', hash)
    console.log('- Hash length:', hash.length)

    // Create the result with the hash
    const result = await createResult({
      ...testResultData,
      hash: hash
    })

    if (result.success) {
      console.log('Test result created successfully with hash')
      return NextResponse.json({
        success: true,
        data: result.data,
        message: "Test result created with hash successfully"
      })
    } else {
      console.error('Failed to create test result:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

  } catch (error) {
    console.error("Test hash creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 