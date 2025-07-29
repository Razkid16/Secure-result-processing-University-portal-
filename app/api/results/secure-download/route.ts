import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { getAllResults, getUserById } from '@/lib/database';
import { CryptoService } from '@/lib/crypto';
import { logAuditEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Secure download API called');
    const user = await AuthService.getCurrentUser();
    console.log('Current user:', user?.email);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can download secure files
    if (user.role !== 'Student') {
      console.log('User is not a student:', user.role);
      await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "UNAUTHORIZED_ACCESS",
        resource: "secure_results_download",
        ipAddress: request.ip || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        status: "BLOCKED",
        riskLevel: "HIGH",
      });

      return NextResponse.json({ error: "Only students can download secure result files" }, { status: 403 });
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

    // Get student's public key
    const studentUser = await getUserById(user.id);
    if (!studentUser || !studentUser.public_key) {
      return NextResponse.json({ error: "Your public key is not available. Please ask an administrator to generate digital keys for your account." }, { status: 500 });
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
      requiresPrivateKey: true,
      fileFormat: 'SECURE_ACADEMIC_RESULTS'
    };

    const resultsData = {
      metadata,
      csvData: csvContent,
      results: filteredResults
    };

    // Create PDF content structure
    const pdfContent = {
      title: "Academic Results Transcript",
      student: {
        name: user.name,
        email: user.email,
        department: user.department
      },
      academicInfo: {
        year: academicYear || 'All',
        semester: semester || 'All',
        totalResults: filteredResults.length,
        downloadDate: new Date().toISOString()
      },
      results: filteredResults,
      summary: {
        totalCourses: filteredResults.length,
        averageScore: filteredResults.length > 0 
          ? (filteredResults.reduce((sum: number, result: any) => sum + result.total_score, 0) / filteredResults.length).toFixed(1)
          : '0.0',
        totalCredits: filteredResults.reduce((sum: number, result: any) => sum + (result.credits || 0), 0).toFixed(1),
        highestScore: filteredResults.length > 0 
          ? Math.max(...filteredResults.map((r: any) => r.total_score))
          : 0
      }
    };

    // Create secure PDF using student's public key
    const securePDF = CryptoService.createSecurePDF(pdfContent, studentUser.public_key);

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "DOWNLOAD_SECURE_PDF",
      resource: "results",
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "SUCCESS",
      riskLevel: "MEDIUM",
      details: {
        totalResults: filteredResults.length,
        academicYear,
        semester,
        fileFormat: 'PDF'
      }
    });

    console.log('Secure PDF generated successfully');
    return NextResponse.json({
      success: true,
      data: {
        fileContent: securePDF.pdfContent,
        fileExtension: securePDF.fileExtension,
        fileName: `secure_results_${user.name}_${new Date().toISOString().split('T')[0]}.pdf`,
        pdfData: pdfContent
      },
      message: "Secure PDF generated successfully. This file requires your private key to decrypt and view the contents."
    });

  } catch (error) {
    console.error("Secure download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 