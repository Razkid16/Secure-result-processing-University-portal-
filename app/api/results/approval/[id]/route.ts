import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { RBACService } from "@/lib/rbac"
import { 
  approveResultRequest, 
  denyResultRequest,
  logAuditEvent 
} from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only faculty can approve/deny requests
    if (user.role !== "Faculty") {
      return NextResponse.json({ error: "Only faculty can approve/deny requests" }, { status: 403 })
    }

    const requestId = parseInt(params.id)
    if (isNaN(requestId)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 })
    }

    const body = await request.json()
    const { action, reason } = body

    if (!action || (action !== "approve" && action !== "deny")) {
      return NextResponse.json({ error: "Action must be 'approve' or 'deny'" }, { status: 400 })
    }

    if (action === "deny" && !reason) {
      return NextResponse.json({ error: "Reason is required when denying a request" }, { status: 400 })
    }

    let result
    if (action === "approve") {
      result = await approveResultRequest(requestId, user.id, reason)
    } else {
      result = await denyResultRequest(requestId, user.id, reason)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Log the action
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: action === "approve" ? "APPROVE_RESULT_REQUEST" : "DENY_RESULT_REQUEST",
      resource: "result_approvals",
      resourceId: requestId.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { 
        action,
        reason: reason || null,
        requestId
      },
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Request ${action}d successfully`
    })
  } catch (error) {
    console.error("Result approval action API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 