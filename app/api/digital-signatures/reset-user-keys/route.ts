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

    if (user.role !== "Administrator") {
      return NextResponse.json({ error: "Only administrators can access this endpoint" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user data from database
    const userData = await getUserById(userId);
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('Reset user keys debug:');
    console.log('- Target User ID:', userId);
    console.log('- Target User Name:', userData.name);
    console.log('- Current keys exist:', !!(userData.public_key && userData.private_key));
    console.log('- Current password exists:', !!userData.private_key_password);

    // Reset keys and password by setting them to null
    await updateUser(userId, {
      public_key: null,
      private_key: null,
      certificate: null,
      certificate_valid_until: null,
      private_key_password: null
    });

    console.log('- User keys and password reset successfully');

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "RESET_USER_KEYS",
      resource: "digital_signatures",
      resourceId: userId.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: { 
        targetUserId: userId,
        targetUserName: userData.name,
        keysReset: true,
        passwordReset: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Keys and password reset successfully for ${userData.name}.`
    });

  } catch (error) {
    console.error("Reset user keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 