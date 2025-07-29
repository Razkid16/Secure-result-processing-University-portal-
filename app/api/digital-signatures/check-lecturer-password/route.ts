import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Check lecturer password API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only lecturers can access this endpoint
    if (user.role !== 'Lecturer') {
      console.log('User is not a lecturer:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "lecturer_password_check",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only lecturers can access this endpoint" }, { status: 403 });
    }

    // Get lecturer's data
    const lecturerData = await getUserById(user.id);
    if (!lecturerData) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    const hasPassword = !!lecturerData.private_key_password;

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CHECK_LECTURER_PASSWORD_STATUS",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: {
        lecturerName: user.name,
        hasPassword: hasPassword
      }
    });

    console.log('Lecturer password status checked successfully');
    return NextResponse.json({
      success: true,
      hasPassword: hasPassword,
      message: hasPassword ? "Lecturer has a password set" : "Lecturer needs to create a password"
    });

  } catch (error) {
    console.error("Check lecturer password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 