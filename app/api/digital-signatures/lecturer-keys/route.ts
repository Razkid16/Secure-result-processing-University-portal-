import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserById } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Lecturer keys API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only lecturers can access their own keys
    if (user.role !== 'Lecturer') {
      console.log('User is not a lecturer:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "lecturer_keys",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only lecturers can access their digital keys" }, { status: 403 });
    }

    // Get lecturer's digital signature data
    const lecturerData = await getUserById(user.id);
    if (!lecturerData) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Check if lecturer has digital keys
    if (!lecturerData.public_key || !lecturerData.private_key) {
      return NextResponse.json({ 
        error: "Your digital keys have not been generated yet. Please ask an administrator to generate them for you." 
      }, { status: 404 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "VIEW_LECTURER_KEYS",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        lecturerName: user.name,
        hasPrivateKey: !!lecturerData.private_key,
        hasPublicKey: !!lecturerData.public_key,
        hasCertificate: !!lecturerData.certificate
      }
    });

    console.log('Lecturer keys retrieved successfully');
    return NextResponse.json({
      success: true,
      data: {
        privateKey: lecturerData.private_key,
        publicKey: lecturerData.public_key,
        certificate: lecturerData.certificate,
        certificateValidUntil: lecturerData.certificate_valid_until
      },
      message: "Lecturer keys retrieved successfully"
    });

  } catch (error) {
    console.error("Lecturer keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 