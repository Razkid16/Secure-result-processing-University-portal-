import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getAllResults, getUserById } from '@/lib/database';
import { CryptoService } from '@/lib/crypto';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Encrypted download API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can download their own encrypted results
    if (user.role !== 'Student') {
      console.log('User is not a student:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "encrypted_results_download",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only students can download encrypted results" }, { status: 403 });
    }

    const body = await request.json();
    const { academicYear, semester } = body;

    // Get all results and filter for the student
    const result = await getAllResults();
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }

    let filteredResults = result.data.filter((r: any) => 
      r.student_id === user.id && r.status === "Published"
    );

    // Apply filters if provided
    if (academicYear) {
      filteredResults = filteredResults.filter((r: any) => r.session === academicYear);
    }
    if (semester && semester !== "all") {
      filteredResults = filteredResults.filter((r: any) => r.semester === semester);
    }

    if (filteredResults.length === 0) {
      return NextResponse.json({ error: "No results found for download" }, { status: 404 });
    }

    // Get admin user to get their public key
    const adminUser = await getUserById(1); // Assuming admin has ID 1
    if (!adminUser || !adminUser.public_key) {
      return NextResponse.json({ error: "Admin public key not available" }, { status: 500 });
    }

    // Create CSV content
    const headers = [
      'Course Code',
      'Course Title', 
      'Semester',
      'Academic Year',
      'CA Score',
      'Exam Score',
      'Total Score',
      'Grade',
      'Grade Point',
      'Status',
      'Download Date'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredResults.map((result: any) => [
        result.course_code,
        `"${result.course_title}"`,
        result.semester,
        result.session,
        result.ca_score,
        result.exam_score,
        result.total_score,
        result.grade,
        result.grade_point,
        result.status,
        new Date().toISOString()
      ].join(','))
    ].join('\n');

    // Add metadata
    const metadata = {
      studentName: user.name,
      studentEmail: user.email,
      downloadDate: new Date().toISOString(),
      totalResults: filteredResults.length,
      academicYear: academicYear || 'All',
      semester: semester || 'All',
      encryptedBy: 'Secure Academic System',
      encryptionMethod: 'RSA-2048 + AES-256',
      requiresAdminPrivateKey: true
    };

    const fullContent = JSON.stringify({
      metadata,
      csvData: csvContent
    }, null, 2);

    // Encrypt the content with admin's public key
    const encryptedContent = CryptoService.hybridEncrypt(fullContent, adminUser.public_key);

    // Create encrypted file content
    const encryptedFile = {
      version: '1.0',
      encryptionMethod: 'RSA-2048 + AES-256',
      encryptedData: encryptedContent.encryptedData,
      encryptedKey: encryptedContent.encryptedKey,
      iv: encryptedContent.iv,
      metadata: {
        studentName: user.name,
        studentEmail: user.email,
        downloadDate: new Date().toISOString(),
        totalResults: filteredResults.length,
        requiresAdminPrivateKey: true,
        instructions: 'This file is encrypted and can only be opened with the admin private key'
      }
    };

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "DOWNLOAD_ENCRYPTED_RESULTS",
      resource: "results",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        totalResults: filteredResults.length,
        academicYear,
        semester
      }
    });

    console.log('Encrypted results generated successfully');
    return NextResponse.json({
      success: true,
      data: encryptedFile,
      message: "Encrypted results generated successfully. This file can only be opened with the admin private key."
    });

  } catch (error) {
    console.error("Encrypted download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 