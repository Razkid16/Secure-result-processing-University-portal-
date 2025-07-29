import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
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

    console.log('Password reset debug:');
    console.log('- User ID:', user.id);
    console.log('- Current password exists:', !!userData.private_key_password);

    // Reset password by setting it to null
    await updateUser(user.id, {
      private_key_password: null
    });

    console.log('- Password reset successfully');

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "RESET_STUDENT_PASSWORD",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { passwordReset: true }
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now create a new password."
    });

  } catch (error) {
    console.error("Reset student password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 