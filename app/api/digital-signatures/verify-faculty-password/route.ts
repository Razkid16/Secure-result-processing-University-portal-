import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only faculty can verify their password
    if (user.role !== 'Faculty') {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "verify_faculty_password",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only faculty can verify password" }, { status: 403 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Get faculty's data
    const facultyData = await getUserById(user.id);
    if (!facultyData) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Check if faculty has set a password
    if (!facultyData.private_key_password) {
      return NextResponse.json({ error: "No password has been set for your private key" }, { status: 400 });
    }

    // Verify password (currently using plain text comparison for testing)
    const isPasswordCorrect = password === facultyData.private_key_password;

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VERIFY_FACULTY_PASSWORD",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: isPasswordCorrect ? "SUCCESS" : "FAILED",
      riskLevel: isPasswordCorrect ? "LOW" : "MEDIUM",
      details: {
        facultyName: user.name,
        passwordCorrect: isPasswordCorrect
      }
    });

    if (isPasswordCorrect) {
      return NextResponse.json({
        success: true,
        message: "Password verified successfully"
      });
    } else {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

  } catch (error) {
    console.error("Verify faculty password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 