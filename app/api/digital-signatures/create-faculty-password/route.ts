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

    // Only faculty can create their password
    if (user.role !== 'Faculty') {
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "create_faculty_password",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only faculty can create password" }, { status: 403 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Get faculty's data
    const facultyData = await getUserById(user.id);
    if (!facultyData) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Check if faculty already has a password
    if (facultyData.private_key_password) {
      return NextResponse.json({ error: "Password has already been set for your private key" }, { status: 400 });
    }

    try {
      // Update faculty with new password (currently storing as plain text for testing)
      await updateUser(user.id, {
        private_key_password: password
      });

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "CREATE_FACULTY_PASSWORD",
        resource: "digital_signatures",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          facultyName: user.name,
          passwordLength: password.length
        }
      });

      return NextResponse.json({
        success: true,
        message: "Password created successfully"
      });

    } catch (updateError) {
      console.error("Error updating faculty password:", updateError);
      return NextResponse.json({ error: "Failed to create password" }, { status: 500 });
    }

  } catch (error) {
    console.error("Create faculty password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 