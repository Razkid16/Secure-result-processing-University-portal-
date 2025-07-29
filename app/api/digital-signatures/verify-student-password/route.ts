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

    // Get user data from database
    const userData = await getUserById(user.id);
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('Password verification debug:');
    console.log('- User ID:', user.id);
    console.log('- Entered password:', password);
    console.log('- Stored password:', userData.private_key_password);
    console.log('- Password exists:', !!userData.private_key_password);

    if (!userData.private_key_password) {
      return NextResponse.json({ error: "No password set for this user" }, { status: 400 });
    }

    // Verify password (temporary simple comparison - TODO: use bcrypt in production)
    const isValid = password === userData.private_key_password;
    console.log('- Password match:', isValid);
    // const isValid = await bcrypt.compare(password, userData.private_key_password);

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VERIFY_STUDENT_PASSWORD",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: isValid ? "SUCCESS" : "FAILED",
      riskLevel: isValid ? "LOW" : "MEDIUM",
      details: { passwordVerified: isValid }
    });

    return NextResponse.json({
      success: isValid,
      message: isValid ? "Password verified successfully" : "Invalid password"
    });

  } catch (error) {
    console.error("Verify student password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 