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

    // Only faculty can check their password status
    if (user.role !== 'Faculty') {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "check_faculty_password",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only faculty can check password status" }, { status: 403 });
    }

    // Get faculty's data
    const facultyData = await getUserById(user.id);
    if (!facultyData) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Check if faculty has set a password
    const hasPassword = !!facultyData.private_key_password;

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CHECK_FACULTY_PASSWORD_STATUS",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        facultyName: user.name,
        hasPassword: hasPassword
      }
    });

    return NextResponse.json({
      success: true,
      hasPassword: hasPassword,
      message: hasPassword ? "Faculty has set a password" : "Faculty has not set a password"
    });

  } catch (error) {
    console.error("Check faculty password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 