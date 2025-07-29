import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "Student") {
      return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 });
    }

    // Get user data from database
    const userData = await getUserById(user.id);
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has a password set
    const hasPassword = !!(userData.private_key_password);

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CHECK_STUDENT_PASSWORD",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { hasPassword }
    });

    return NextResponse.json({
      success: true,
      hasPassword
    });

  } catch (error) {
    console.error("Check student password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 