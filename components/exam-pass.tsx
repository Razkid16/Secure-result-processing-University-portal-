"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Printer
} from "lucide-react"
import { toast } from "sonner"

interface CourseRegistration {
  id: number
  student_id: number
  student_name: string
  student_email: string
  course_id: number
  course_code: string
  course_title: string
  credits: number
  semester: string
  session: string
  status: "Pending" | "Approved" | "Rejected" | "Dropped"
  registration_date: string
  approved_by?: number
  approved_at?: string
  notes?: string
}

interface ExamPassProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export function ExamPass({ user }: ExamPassProps) {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentSemester, setCurrentSemester] = useState("")
  const [currentSession, setCurrentSession] = useState("")

  useEffect(() => {
    loadExamPassData()
  }, [])

  const loadExamPassData = async () => {
    try {
      setLoading(true)
      
      // Get current semester and session
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      
      // Determine current semester (assuming First semester: Jan-Jun, Second semester: Jul-Dec)
      const semester = currentMonth >= 1 && currentMonth <= 6 ? "First" : "Second"
      const session = `${currentYear}/${currentYear + 1}`
      
      setCurrentSemester(semester)
      setCurrentSession(session)

      // Load registrations for current semester
      const response = await fetch(`/api/course-registrations?student_id=${user.id}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const allRegistrations = data.data || []
        
        // Filter for current semester and approved registrations only
        const currentRegistrations = allRegistrations.filter((reg: CourseRegistration) => 
          reg.semester === semester && 
          reg.session === session && 
          reg.status === "Approved"
        )
        
        setRegistrations(currentRegistrations)
      } else {
        setError("Failed to load exam pass data")
      }
    } catch (error) {
      console.error("Failed to load exam pass data:", error)
      setError("Failed to load exam pass data")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintExamPass = () => {
    if (registrations.length === 0) {
      toast.error("No courses available for exam pass")
      return
    }

    const totalCredits = registrations.reduce((sum, reg) => sum + reg.credits, 0)
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exam Pass - ${user.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .university { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .exam-pass-title { font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info div { margin: 5px 0; }
          .label { font-weight: bold; color: #374151; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .table th { background-color: #f3f4f6; font-weight: bold; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          .notice { margin-top: 20px; padding: 15px; background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="university">TECHNOLOGICAL UNIVERSITY</div>
          <div class="exam-pass-title">EXAMINATION PASS</div>
          <div style="font-size: 16px; color: #6b7280;">${currentSemester} Semester, ${currentSession} Academic Year</div>
        </div>
        
        <div class="student-info">
          <div><span class="label">Student Name:</span> ${user.name}</div>
          <div><span class="label">Email:</span> ${user.email}</div>
          <div><span class="label">Faculty:</span> ${user.department}</div>
          <div><span class="label">Department:</span> ${user.department}</div>
          <div><span class="label">Semester:</span> ${currentSemester} Semester</div>
          <div><span class="label">Academic Year:</span> ${currentSession}</div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Credits</th>
              <th>Registration Status</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.map(reg => `
              <tr>
                <td>${reg.course_code}</td>
                <td>${reg.course_title}</td>
                <td>${reg.credits}</td>
                <td><span style="color: #059669; font-weight: bold;">${reg.status}</span></td>
                <td>${new Date(reg.registration_date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <div>Total Courses: ${registrations.length}</div>
          <div>Total Credits: ${totalCredits}</div>
        </div>
        
        <div class="notice">
          <strong>Important Notice:</strong><br>
          • This document serves as your examination pass for the ${currentSemester} Semester, ${currentSession} Academic Year.<br>
          • You are eligible to sit for examinations in the courses listed above.<br>
          • Please present this document along with your student ID at examination venues.<br>
          • Ensure all course fees are paid before the examination period.<br>
          • Contact your department office for any discrepancies.
        </div>
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>This is an official document from Technological University</div>
          <div style="margin-top: 10px; font-weight: bold;">Valid for ${currentSemester} Semester, ${currentSession} Academic Year</div>
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Exam Pass</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
    } else {
      toast.error("Please allow pop-ups to print your exam pass")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading exam pass data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Examination Pass</span>
          </CardTitle>
          <CardDescription>
            Your registered courses eligible for examinations in {currentSemester} Semester, {currentSession} Academic Year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Print Button */}
          {registrations.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Your Exam Pass</h3>
                  <p className="text-sm text-muted-foreground">
                    Total Courses: {registrations.length} | Total Credits: {registrations.reduce((sum, reg) => sum + reg.credits, 0)}
                  </p>
                </div>
                <Button
                  onClick={handlePrintExamPass}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Exam Pass
                </Button>
              </div>
            </div>
          )}

          {/* Courses Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Title</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No courses available for exam pass</p>
                      <p className="text-sm">
                        {currentSemester} Semester, {currentSession} Academic Year
                      </p>
                      <p className="text-sm mt-2">
                        You need to register for courses and have them approved to generate an exam pass.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="font-medium">{registration.course_code}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registration.course_title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium">
                          {registration.credits} Credits
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Information Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>Important Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Only approved course registrations are eligible for examinations.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Print your exam pass and present it at examination venues along with your student ID.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Ensure all course fees are paid before the examination period.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Contact your department office for any discrepancies or questions.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
} 