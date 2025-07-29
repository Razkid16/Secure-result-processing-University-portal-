import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { resetAllDigitalSignatures } from '@/lib/database';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Reset digital signatures API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can reset all digital signatures
    if (user.role !== 'Administrator') {
      console.log('User is not admin:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "digital_signatures_reset",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    console.log('Calling resetAllDigitalSignatures...');
    const result = resetAllDigitalSignatures();
    console.log('resetAllDigitalSignatures result:', result ? 'success' : 'failed');

    if (!result) {
      console.log('Reset failed');
      return NextResponse.json({ error: "Failed to reset digital signatures" }, { status: 500 });
    }

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "RESET_ALL_DIGITAL_SIGNATURES",
      resource: "digital_signatures",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "HIGH",
    });

    console.log('All digital signatures reset successfully');
    return NextResponse.json({
      success: true,
      message: "All digital signatures have been reset successfully"
    });

  } catch (error) {
    console.error("Reset digital signatures error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 