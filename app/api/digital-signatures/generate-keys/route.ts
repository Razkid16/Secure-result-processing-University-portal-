import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { generateUserKeys } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Generate keys API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can generate keys for users
    if (user.role !== 'Administrator') {
      console.log('User is not admin:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "digital_signatures",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;
    console.log('Requested userId:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log('Calling generateUserKeys...');
    const result = generateUserKeys(userId);
    console.log('generateUserKeys result:', result ? 'success' : 'failed');

    if (!result) {
      console.log('User not found or generation failed');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "GENERATE_DIGITAL_KEYS",
      resource: "digital_signatures",
      resourceId: userId.toString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
    });

    console.log('Keys generated successfully');
    return NextResponse.json({
      success: true,
      message: "Digital keys generated successfully"
    });

  } catch (error) {
    console.error("Generate keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 