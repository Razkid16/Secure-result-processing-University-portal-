import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { verifyResultSignature } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { resultId, action } = body;

    if (!resultId || !action) {
      return NextResponse.json({ error: "Result ID and action are required" }, { status: 400 });
    }

    const isValid = verifyResultSignature(resultId, action);

    return NextResponse.json({
      success: true,
      valid: isValid,
      message: isValid 
        ? "Signature is valid and authentic" 
        : "Signature verification failed - data may have been tampered with"
    });

  } catch (error) {
    console.error("Verify signature error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 