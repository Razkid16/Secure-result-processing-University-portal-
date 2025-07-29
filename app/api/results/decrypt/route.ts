import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { CryptoService } from '@/lib/crypto';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Decrypt results API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can decrypt files
    if (user.role !== 'Administrator') {
      console.log('User is not admin:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "decrypt_results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only administrators can decrypt result files" }, { status: 403 });
    }

    const body = await request.json();
    const { encryptedFile, privateKey } = body;

    if (!encryptedFile || !privateKey) {
      return NextResponse.json({ error: "Encrypted file and private key are required" }, { status: 400 });
    }

    try {
      // Decrypt the file using admin's private key
      const decryptedContent = CryptoService.hybridDecrypt(
        encryptedFile.encryptedData,
        encryptedFile.encryptedKey,
        encryptedFile.iv,
        privateKey
      );

      const parsedContent = JSON.parse(decryptedContent);

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "DECRYPT_RESULTS_FILE",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          studentName: parsedContent.metadata?.studentName,
          studentEmail: parsedContent.metadata?.studentEmail,
          totalResults: parsedContent.metadata?.totalResults
        }
      });

      console.log('Results decrypted successfully');
      return NextResponse.json({
        success: true,
        data: parsedContent,
        message: "Results decrypted successfully"
      });

    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "DECRYPT_RESULTS_FILE",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "FAILED",
        riskLevel: "HIGH",
        details: {
          error: "Invalid private key or corrupted file"
        }
      });

      return NextResponse.json({ 
        error: "Decryption failed. Please check your private key and ensure the file is not corrupted." 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Decrypt results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 