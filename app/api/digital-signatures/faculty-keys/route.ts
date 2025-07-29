import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Faculty keys API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only faculty can access their own keys
    if (user.role !== 'Faculty') {
      console.log('User is not faculty:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "faculty_keys",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only faculty can access their digital keys" }, { status: 403 });
    }

    // Get faculty's digital signature data
    const facultyData = await getUserById(user.id);
    if (!facultyData) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Check if faculty has digital keys
    if (!facultyData.public_key || !facultyData.private_key) {
      return NextResponse.json({ 
        error: "Your digital keys have not been generated yet. Please ask an administrator to generate them for you." 
      }, { status: 404 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_FACULTY_KEYS",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        facultyName: user.name,
        hasPrivateKey: !!facultyData.private_key,
        hasPublicKey: !!facultyData.public_key,
        hasCertificate: !!facultyData.certificate
      }
    });

    console.log('Faculty keys retrieved successfully');
    return NextResponse.json({
      success: true,
      data: {
        privateKey: facultyData.private_key,
        publicKey: facultyData.public_key,
        certificate: facultyData.certificate,
        certificateValidUntil: facultyData.certificate_valid_until
      },
      message: "Faculty keys retrieved successfully"
    });

  } catch (error) {
    console.error("Faculty keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 