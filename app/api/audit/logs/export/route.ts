import { NextRequest, NextResponse } from "next/server"
import { getValidSession, getAuditLogs, logAuditEvent } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("secure_session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No session token provided" }, { status: 401 })
    }

    // Validate session
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Check permissions - only administrators and faculty can export logs
    if (session.role !== "Administrator" && session.role !== "Faculty") {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "audit_logs_export",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "MEDIUM",
        details: { reason: "Non-authorized user attempting to export audit logs" },
      })

      return NextResponse.json(
        { error: "Access denied - Only administrators and faculty can export audit logs" },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const riskLevel = searchParams.get('riskLevel')
    const userEmail = searchParams.get('userEmail')

    // Get all audit logs (using a large limit to get all logs)
    const result = await getAuditLogs(10000, 0) // Large limit to get all logs
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    let logsToExport = result.data || []

    // Apply filters if provided
    if (action && action !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.action.toLowerCase().includes(action.toLowerCase()))
    }
    if (status && status !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.status === status)
    }
    if (riskLevel && riskLevel !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.risk_level === riskLevel)
    }
    if (userEmail) {
      logsToExport = logsToExport.filter((log: any) => log.user_email.toLowerCase().includes(userEmail.toLowerCase()))
    }

    // Faculty can only see logs related to their department
    if (session.role === "Faculty") {
      logsToExport = logsToExport.filter((log: any) => {
        // Faculty can see logs from students in their department
        // This is a simplified filter - you might want to enhance this based on your data structure
        return true // For now, allow faculty to see all logs
      })
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'User Name',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'Risk Level',
      'IP Address',
      'User Agent',
      'Details'
    ]

    // Convert logs to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...logsToExport.map((log: any) => [
        log.id,
        `"${new Date(log.created_at).toLocaleString()}"`,
        `"${log.user_name || 'N/A'}"`,
        `"${log.user_email}"`,
        `"${log.action}"`,
        `"${log.resource || 'N/A'}"`,
        `"${log.resource_id || 'N/A'}"`,
        `"${log.status}"`,
        `"${log.risk_level}"`,
        `"${log.ip_address || 'N/A'}"`,
        `"${log.user_agent || 'N/A'}"`,
        `"${log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : 'N/A'}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    // Log the export action
    await logAuditEvent({
      userId: session.user_id,
      userEmail: session.email,
      action: "AUDIT_LOGS_EXPORTED",
      resource: "audit_logs",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { 
        exportedCount: logsToExport.length,
        filters: { action, status, riskLevel, userEmail },
        format: "CSV"
      },
    })

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

    return response

  } catch (error) {
    console.error("Error exporting audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("secure_session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "No session token provided" }, { status: 401 })
    }

    // Validate session
    const session = await getValidSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Check permissions - only administrators and faculty can export logs
    if (session.role !== "Administrator" && session.role !== "Faculty") {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "audit_logs_export",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "MEDIUM",
        details: { reason: "Non-authorized user attempting to export audit logs" },
      })

      return NextResponse.json(
        { error: "Access denied - Only administrators and faculty can export audit logs" },
        { status: 403 }
      )
    }

    // Get password from request body
    const { password } = await request.json()
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    // Verify user password
    const user = global.__inMemoryDB.users.find((u: any) => u.id === session.user_id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      await logAuditEvent({
        userId: session.user_id,
        userEmail: session.email,
        action: "AUDIT_LOGS_EXPORT_ATTEMPT",
        resource: "audit_logs",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "FAILED",
        riskLevel: "HIGH",
        details: { reason: "Invalid password provided for export" },
      })

      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const status = searchParams.get('status')
    const riskLevel = searchParams.get('riskLevel')
    const userEmail = searchParams.get('userEmail')

    // Get all audit logs (using a large limit to get all logs)
    const result = await getAuditLogs(10000, 0) // Large limit to get all logs
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    let logsToExport = result.data || []

    // Apply filters if provided
    if (action && action !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.action.toLowerCase().includes(action.toLowerCase()))
    }
    if (status && status !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.status === status)
    }
    if (riskLevel && riskLevel !== 'all') {
      logsToExport = logsToExport.filter((log: any) => log.risk_level === riskLevel)
    }
    if (userEmail) {
      logsToExport = logsToExport.filter((log: any) => log.user_email.toLowerCase().includes(userEmail.toLowerCase()))
    }

    // Faculty can only see logs related to their department
    if (session.role === "Faculty") {
      logsToExport = logsToExport.filter((log: any) => {
        // Faculty can see logs from students in their department
        // This is a simplified filter - you might want to enhance this based on your data structure
        return true // For now, allow faculty to see all logs
      })
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'User Name',
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'Risk Level',
      'IP Address',
      'User Agent',
      'Details'
    ]

    // Convert logs to CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...logsToExport.map((log: any) => [
        log.id,
        `"${new Date(log.created_at).toLocaleString()}"`,
        `"${log.user_name || 'N/A'}"`,
        `"${log.user_email}"`,
        `"${log.action}"`,
        `"${log.resource || 'N/A'}"`,
        `"${log.resource_id || 'N/A'}"`,
        `"${log.status}"`,
        `"${log.risk_level}"`,
        `"${log.ip_address || 'N/A'}"`,
        `"${log.user_agent || 'N/A'}"`,
        `"${log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : 'N/A'}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    // Log the export action
    await logAuditEvent({
      userId: session.user_id,
      userEmail: session.email,
      action: "AUDIT_LOGS_EXPORTED",
      resource: "audit_logs",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { 
        exportedCount: logsToExport.length,
        filters: { action, status, riskLevel, userEmail },
        format: "CSV"
      },
    })

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })

    return response

  } catch (error) {
    console.error("Error exporting audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 