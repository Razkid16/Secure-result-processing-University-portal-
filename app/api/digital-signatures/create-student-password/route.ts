import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';
// import bcrypt from 'bcrypt'; // TODO: Add bcrypt for production

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "Student") {
      return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    // Get user data from database
    const userData = await getUserById(user.id);
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if password already exists
    if (userData.private_key_password) {
      return NextResponse.json({ error: "Password already exists for this user" }, { status: 400 });
    }

    console.log('Password creation debug:');
    console.log('- User ID:', user.id);
    console.log('- New password:', password);
    console.log('- Password length:', password.length);

    // Store password (temporary plain text storage - TODO: use bcrypt in production)
    const hashedPassword = password; // TODO: const hashedPassword = await bcrypt.hash(password, 12);

    console.log('- Stored password:', hashedPassword);

    // Update user with password
    await updateUser(user.id, {
      private_key_password: hashedPassword
    });

    console.log('- Password saved successfully');

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE_STUDENT_PASSWORD",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "LOW",
      details: { passwordCreated: true }
    });

    return NextResponse.json({
      success: true,
      message: "Password created successfully"
    });

  } catch (error) {
    console.error("Create student password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 