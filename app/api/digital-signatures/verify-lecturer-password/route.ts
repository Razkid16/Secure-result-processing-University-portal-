import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Verify lecturer password API called');
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
        resource: "lecturer_password_verify",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only lecturers can access this endpoint" }, { status: 403 });
    }

    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Get lecturer's data
    const lecturerData = await getUserById(user.id);
    if (!lecturerData) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Check if lecturer has a password set
    if (!lecturerData.private_key_password) {
      return NextResponse.json({ 
        error: "No password set. Please create a password first." 
      }, { status: 400 });
    }

    // Verify password (temporarily using plain text comparison)
    const isPasswordCorrect = password === lecturerData.private_key_password;

    console.log('Password verification result:', {
      providedPassword: password,
      storedPassword: lecturerData.private_key_password,
      isCorrect: isPasswordCorrect
    });

    if (isPasswordCorrect) {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "VERIFY_LECTURER_PASSWORD",
        resource: "digital_signatures",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          lecturerName: user.name,
          passwordVerified: true
        }
      });

      console.log('Lecturer password verified successfully');
      return NextResponse.json({
        success: true,
        message: "Password verified successfully"
      });
    } else {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "VERIFY_LECTURER_PASSWORD",
        resource: "digital_signatures",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "FAILED",
        riskLevel: "HIGH",
        details: {
          lecturerName: user.name,
          passwordVerified: false
        }
      });

      console.log('Lecturer password verification failed');
      return NextResponse.json({
        success: false,
        error: "Incorrect password"
      }, { status: 401 });
    }

  } catch (error) {
    console.error("Verify lecturer password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 