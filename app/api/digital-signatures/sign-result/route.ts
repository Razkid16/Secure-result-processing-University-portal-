import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { signResult } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resultId, action } = body;

    if (!resultId || !action) {
      return NextResponse.json({ error: "Result ID and action are required" }, { status: 400 });
    }

    // Validate action
    const validActions = ['submit', 'approve', 'deny', 'publish'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const success = signResult(resultId, user.id, action as any);

    if (!success) {
      return NextResponse.json({ error: "Failed to sign result" }, { status: 500 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "SIGN_RESULT",
      resource: "digital_signatures",
      resourceId: resultId.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { action }
    });

    return NextResponse.json({
      success: true,
      message: "Result signed successfully"
    });

  } catch (error) {
    console.error("Sign result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 