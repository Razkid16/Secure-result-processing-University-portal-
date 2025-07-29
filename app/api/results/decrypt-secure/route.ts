import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { CryptoService } from '@/lib/crypto';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Decrypt secure file API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can decrypt their own secure files
    if (user.role !== 'Student') {
      console.log('User is not a student:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "decrypt_secure_file",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only students can decrypt their secure files" }, { status: 403 });
    }

    const body = await request.json();
    const { secureFileContent, privateKey } = body;

    console.log('Received request with:');
    console.log('- File content length:', secureFileContent?.length || 0);
    console.log('- File content preview:', secureFileContent?.substring(0, 200));
    console.log('- Private key length:', privateKey?.length || 0);

    if (!secureFileContent || !privateKey) {
      console.log('Missing required data');
      return NextResponse.json({ error: "Secure file content and private key are required" }, { status: 400 });
    }

    try {
      // Validate that it's a secure file or PDF
      const isValidSecureFile = CryptoService.isValidSecureFile(secureFileContent);
      const isValidSecurePDF = CryptoService.isValidSecurePDF(secureFileContent);
      
      console.log('File validation:');
      console.log('- Is valid secure file:', isValidSecureFile);
      console.log('- Is valid secure PDF:', isValidSecurePDF);
      
      if (!isValidSecureFile && !isValidSecurePDF) {
        console.log('Invalid file format');
        return NextResponse.json({ error: "Invalid secure file format" }, { status: 400 });
      }

      // Decrypt the secure file using student's private key
      let decryptedContent;
      if (isValidSecurePDF) {
        decryptedContent = CryptoService.decryptSecurePDF(secureFileContent, privateKey);
      } else {
        decryptedContent = CryptoService.decryptSecureFile(secureFileContent, privateKey);
      }

      console.log('Decrypted content structure:');
      console.log('- Type:', typeof decryptedContent);
      console.log('- Keys:', Object.keys(decryptedContent || {}));
      console.log('- Full content:', JSON.stringify(decryptedContent, null, 2));
      console.log('- Student info:', decryptedContent?.student);
      console.log('- Academic info:', decryptedContent?.academicInfo);
      console.log('- Summary:', decryptedContent?.summary);
      console.log('- Results count:', decryptedContent?.results?.length);

      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "DECRYPT_SECURE_FILE",
        resource: "results",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "SUCCESS",
        riskLevel: "MEDIUM",
        details: {
          studentName: decryptedContent.data?.metadata?.studentName,
          totalResults: decryptedContent.data?.metadata?.totalResults
        }
      });

      console.log('Secure file decrypted successfully');
      return NextResponse.json({
        success: true,
        data: decryptedContent,
        message: "Secure file decrypted successfully"
      });

    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "DECRYPT_SECURE_FILE",
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
    console.error("Decrypt secure file error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 