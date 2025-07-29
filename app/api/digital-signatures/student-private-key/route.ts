import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserPrivateKey } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Student private key API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can access their own private key
    if (user.role !== 'Student') {
      console.log('User is not a student:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "student_private_key",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only students can access their private key" }, { status: 403 });
    }

    console.log('Getting private key for student:', user.id);
    const privateKey = getUserPrivateKey(user.id);
    
    if (!privateKey) {
      console.log('No private key found for student');
      return NextResponse.json({ 
        error: "No private key found. Please ask an administrator to generate digital keys for your account." 
      }, { status: 404 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "ACCESS_PRIVATE_KEY",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
    });

    console.log('Private key retrieved successfully');
    return NextResponse.json({
      success: true,
      data: {
        privateKey,
        message: "Your private key is available. Use this to decrypt files that were encrypted with your public key."
      }
    });

  } catch (error) {
    console.error("Student private key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 