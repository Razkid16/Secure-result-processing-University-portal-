import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getAllResults } from "@/lib/database"

export async function GET(request: NextRequest) {
  const user = await AuthService.getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only administrators, faculty, and lecturers can view hashing information
  if (!["Administrator", "Faculty", "Lecturer"].includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const result = await getAllResults()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  
  console.log('Hashing API Debug:')
  console.log('- Total results in database:', result.data.length)
  console.log('- Results with hash field:', result.data.filter((r: any) => r.hash).length)
  console.log('- Sample result structure:', result.data[0] ? Object.keys(result.data[0]) : 'No results')
  
  // Only results with a hash value
  let hashes = result.data.filter((r: any) => r.hash).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  console.log('- Results with non-null hash:', hashes.length)
  if (hashes.length > 0) {
    console.log('- Sample hash:', hashes[0].hash?.substring(0, 20) + '...')
  }
  
  // Populate student names and approver information for results
  hashes = hashes.map((r: any) => {
    // Populate student name and email
    const student = global.__inMemoryDB?.users?.find((u: any) => u.id === r.student_id)
    if (student) {
      r.student_name = student.name
      r.student_email = student.email
    }
    
    // Populate approver name and email
    if (r.approved_by) {
      const approver = global.__inMemoryDB?.users?.find((u: any) => u.id === Number(r.approved_by))
      if (approver) {
        r.approver_name = approver.name
        r.approver_email = approver.email
        r.approver_role = approver.role
      }
    }
    
    return r
  })
  
  return NextResponse.json({ success: true, data: hashes })
} 