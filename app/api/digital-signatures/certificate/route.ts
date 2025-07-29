import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getUserCertificate } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Only admins can view other users' certificates
    if (user.role !== 'Administrator' && user.id !== parseInt(userId)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const certificate = getUserCertificate(parseInt(userId));

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate
    });

  } catch (error) {
    console.error("Get certificate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 