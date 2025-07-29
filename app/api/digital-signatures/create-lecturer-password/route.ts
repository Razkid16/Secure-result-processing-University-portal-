import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Create lecturer password API called');
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
        resource: "lecturer_password_create",
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

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Get lecturer's data
    const lecturerData = await getUserById(user.id);
    if (!lecturerData) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Check if lecturer already has a password set
    if (lecturerData.private_key_password) {
      return NextResponse.json({ 
        error: "Password already exists. Cannot create a new password." 
      }, { status: 400 });
    }

    // Store the password (temporarily using plain text)
    try {
      const updateResult = await updateUser(user.id, {
        private_key_password: password
      });

      console.log('Lecturer password created successfully');

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "CREATE_LECTURER_PASSWORD",
        resource: "digital_signatures",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          lecturerName: user.name,
          passwordCreated: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Password created successfully"
      });
    } catch (error) {
      console.error('Failed to update lecturer password:', error);
      return NextResponse.json({ error: "Failed to create password" }, { status: 500 });
    }

  } catch (error) {
    console.error("Create lecturer password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 