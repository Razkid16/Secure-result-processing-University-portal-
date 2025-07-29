"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Download, Upload, Search, AlertCircle, GraduationCap, EyeOff, Eye, Printer, Key, CheckCircle, Loader2, RotateCcw, Shield } from "lucide-react"
import { RBACService } from "@/lib/rbac"
import { toast } from "sonner"

interface AcademicResult {
  id: number
  student_id: number
  student_name?: string
  student_email?: string
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  grade_point: number
  faculty_id: number
  faculty_name?: string
  lecturer_id?: number
  lecturer_name?: string
  status: "Draft" | "Forward for Approval" | "Published" | "Under Review" | "Pending" | "Denied"
  approval_notes?: string | null
  approved_by?: number | null
  approved_at?: string | null
  faculty_note?: string | null
  created_at: string
  updated_at: string
  credits?: number
}

interface ResultManagementProps {
  user: any
}

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function ResultManagement({ user }: ResultManagementProps) {
  const [filteredResults, setFilteredResults] = useState<AcademicResult[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [academicYearFilter, setAcademicYearFilter] = useState("2023/2024")
  const [isSecureDecryptDialogOpen, setIsSecureDecryptDialogOpen] = useState(false)
  const [secureFileContent, setSecureFileContent] = useState('')
  const [decryptedSecureContent, setDecryptedSecureContent] = useState<any>(null)
  const [decryptingSecureFile, setDecryptingSecureFile] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [manualPrivateKey, setManualPrivateKey] = useState('')
  const [showManualPrivateKey, setShowManualPrivateKey] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isCreatePasswordDialogOpen, setIsCreatePasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showDecryptPrivateKey, setShowDecryptPrivateKey] = useState(false)
  const [isPrivateKeyVerificationLoading, setIsPrivateKeyVerificationLoading] = useState(false)
  const [isUploadPrivateKeyDialogOpen, setIsUploadPrivateKeyDialogOpen] = useState(false)
  const [uploadPrivateKey, setUploadPrivateKey] = useState('')
  const [showUploadPrivateKey, setShowUploadPrivateKey] = useState(false)
  const [uploadPrivateKeyError, setUploadPrivateKeyError] = useState('')
  const [isUploadPrivateKeyLoading, setIsUploadPrivateKeyLoading] = useState(false)
  const [pendingCourseForUpload, setPendingCourseForUpload] = useState<any>(null)
  
  // Private key verification for faculty actions
  const [isFacultyPrivateKeyDialogOpen, setIsFacultyPrivateKeyDialogOpen] = useState(false)
  const [facultyPrivateKey, setFacultyPrivateKey] = useState('')
  const [showFacultyPrivateKey, setShowFacultyPrivateKey] = useState(false)
  const [facultyPrivateKeyError, setFacultyPrivateKeyError] = useState('')
  const [isFacultyPrivateKeyLoading, setIsFacultyPrivateKeyLoading] = useState(false)
  const [pendingFacultyAction, setPendingFacultyAction] = useState<string | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<AcademicResult | null>(null)
  const [isDenialDetailsOpen, setIsDenialDetailsOpen] = useState(false)
  const [selectedDenialResult, setSelectedDenialResult] = useState<AcademicResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canBulkOps: false,
  })

  const [results, setResults] = useState<AcademicResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    student_id: "",
    student_name: "",
    matric_number: "",
    course_code: "",
    course_title: "",
    semester: "",
    session: "",
    ca_score: "",
    exam_score: "",
    status: "Draft" as "Draft" | "Forward for Approval" | "Published" | "Under Review" | "Pending" | "Denied",
    faculty_note: "",
  })

  const [formKey, setFormKey] = useState(0)
  
  // Courses state for lecturer
  const [courses, setCourses] = useState<Array<{id: number, course_code: string, course_title: string, department: string}>>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  
  // Students state for lecturer's courses
  const [students, setStudents] = useState<Array<{id: number, name: string, matric_number: string, email: string}>>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Debug formData changes
  useEffect(() => {
    console.log("formData changed:", formData)
  }, [formData])

  // Refs for direct input manipulation
  const studentNameInputRef = useRef<HTMLInputElement>(null)
  const matricNumberInputRef = useRef<HTMLInputElement>(null)

  // Load permissions and students on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        console.log("Loading permissions for role:", user.role)

        const [canView, canEdit, canDelete, canExport, canBulkOps] = await Promise.all([
          RBACService.canViewResults(user.role),
          RBACService.canEditResults(user.role),
          RBACService.canDeleteResults(user.role),
          RBACService.canExportData(user.role),
          RBACService.canPerformBulkOperations(user.role),
        ])

        console.log("Permissions loaded:", { canView, canEdit, canDelete, canExport, canBulkOps })

        setPermissions({
          canView,
          canEdit,
          canDelete,
          canExport,
          canBulkOps,
        })
      } catch (error) {
        console.error("Failed to load permissions:", error)
      }
    }

    const loadCourses = async () => {
      if (user.role === "Lecturer") {
        try {
          setCoursesLoading(true)
          console.log("Loading courses for lecturer:", user)
          const response = await fetch('/api/courses')
          if (response.ok) {
            const data = await response.json()
            console.log("All courses from API:", data.data)
            // Filter courses for the current lecturer
            const lecturerCourses = data.data.filter((course: any) => {
              const matchesId = course.lecturer_id === user.id
              const matchesName = course.lecturer_name === user.name
              console.log(`Course ${course.course_code}: lecturer_id=${course.lecturer_id}, lecturer_name=${course.lecturer_name}, user.id=${user.id}, user.name=${user.name}, matchesId=${matchesId}, matchesName=${matchesName}`)
              return matchesId || matchesName
            })
            console.log("Filtered lecturer courses:", lecturerCourses)
            setCourses(lecturerCourses)
            
            // Load students registered for these courses
            await loadStudentsForCourses(lecturerCourses)
          } else {
            console.error("Failed to load courses")
          }
        } catch (error) {
          console.error("Failed to load courses:", error)
        } finally {
          setCoursesLoading(false)
        }
      }
    }

    const loadStudentsForCourses = async (lecturerCourses: any[]) => {
      if (lecturerCourses.length === 0) return
      
      try {
        setStudentsLoading(true)
        console.log("Loading students for courses:", lecturerCourses.map(c => c.course_code))
        
        // Get course registrations for the lecturer's courses
        const response = await fetch('/api/course-registrations')
        if (response.ok) {
          const data = await response.json()
          console.log("All course registrations:", data.data)
          
          // Get course IDs for the lecturer's courses
          const courseIds = lecturerCourses.map(course => course.id)
          
          // Filter registrations for the lecturer's courses
          const relevantRegistrations = data.data.filter((registration: any) => 
            courseIds.includes(registration.course_id)
          )
          console.log("Relevant registrations:", relevantRegistrations)
          
          // Get all users to get complete student information
          const usersResponse = await fetch('/api/users?role=Student')
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            const allUsers = usersData.data || []
            console.log("All users:", allUsers)
            
            // Get unique students from these registrations with complete user data
            const uniqueStudents = relevantRegistrations.reduce((acc: any[], registration: any) => {
              const existingStudent = acc.find(s => s.id === registration.student_id)
              if (!existingStudent) {
                // Find the complete user data
                const userData = allUsers.find((user: any) => user.id === registration.student_id)
                if (userData) {
                  acc.push({
                    id: registration.student_id,
                    name: userData.name,
                    matric_number: userData.matric_number || userData.email?.split('@')[0] || registration.student_id.toString(),
                    email: userData.email
                  })
                }
              }
              return acc
            }, [])
            
            console.log("Unique students for lecturer:", uniqueStudents)
            setStudents(uniqueStudents)
          } else {
            console.error("Failed to load users")
          }
        } else {
          console.error("Failed to load course registrations")
        }
      } catch (error) {
        console.error("Failed to load students for courses:", error)
      } finally {
        setStudentsLoading(false)
      }
    }

    loadPermissions()
    loadCourses()
    
    // Note: Private key is now manually entered by user for security
  }, [user.role, user.id, user.name])



  // Load results from database
  useEffect(() => {
    const loadResults = async () => {
      if (!permissions.canView) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/results')
        if (response.ok) {
          const data = await response.json()
          setResults(data.data || [])
        } else {
          setError("Failed to load results")
        }
      } catch (error) {
        console.error("Failed to load results:", error)
        setError("Failed to load results")
      } finally {
        setLoading(false)
      }
    }

    if (permissions.canView) {
      loadResults()
    }
  }, [permissions.canView])

  // Filter results
  useEffect(() => {
    let filtered = results

    if (searchTerm) {
      filtered = filtered.filter(
        (result) =>
          result.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.course_title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // For students, only show published results and apply academic year filter
    if (user.role === "Student") {
      // Filter out non-published results for students
      filtered = filtered.filter((result) => result.status === "Published")
      
      // Apply academic year filter for students
      if (academicYearFilter) {
        filtered = filtered.filter((result) => result.session === academicYearFilter)
      }
    } else {
      if (statusFilter !== "all") {
        filtered = filtered.filter((result) => result.status === statusFilter)
      }
    }

    if (semesterFilter !== "all") {
      filtered = filtered.filter((result) => result.semester === semesterFilter)
    }

    setFilteredResults(filtered)
  }, [results, searchTerm, statusFilter, semesterFilter, academicYearFilter, user.role])

  const calculateGrade = (total: number) => {
    if (total >= 70) return { grade: "A", point: 5.0 }
    if (total >= 60) return { grade: "B", point: 4.0 }
    if (total >= 50) return { grade: "C", point: 3.0 }
    if (total >= 45) return { grade: "D", point: 2.0 }
    if (total >= 40) return { grade: "E", point: 1.0 }
    return { grade: "F", point: 0.0 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!permissions.canEdit) {
      setError("You don't have permission to add results")
      return
    }

    setIsSubmitting(true)
    setError("")

    // Validate required fields
    const requiredFields = ['student_id', 'course_code', 'course_title', 'semester', 'session', 'ca_score', 'exam_score']
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData]
      return !value || value === '' || value === null || value === undefined
    })
    

    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`)
      return
    }

    try {
      console.log('Form data before submission:', formData);
      const caScore = Number.parseFloat(formData.ca_score)
      const examScore = Number.parseFloat(formData.exam_score)

      // Check if this is an edit operation
      const isEditing = selectedResult !== null

      // Ensure matric number is set from student data if not already set
      if (!formData.matric_number && formData.student_id) {
        const student = students.find(s => s.id === Number.parseInt(formData.student_id))
        if (student && student.matric_number) {
          setFormData(prev => ({ ...prev, matric_number: student.matric_number || "" }))
        }
      }

      // For lecturers, handle draft vs forward for approval
      if (user.role === "Lecturer") {
        if (formData.status === "Draft") {
          if (isEditing) {
            // Update existing result locally
            setResults(prev => prev.map(result => 
              result.id === selectedResult!.id 
                ? { 
                    ...result, 
                    student_id: Number.parseInt(formData.student_id),
                    student_name: formData.student_name,
                    course_code: formData.course_code,
                    course_title: formData.course_title,
                    semester: formData.semester,
                    session: formData.session,
                    ca_score: caScore, 
                    exam_score: examScore, 
                    total_score: caScore + examScore, 
                    grade: calculateGrade(caScore + examScore).grade, 
                    grade_point: calculateGrade(caScore + examScore).point, 
                    status: "Draft" 
                  }
                : result
            ))
            toast.success("Draft updated locally")
          } else {
            // Save draft locally (don't upload to server)
            const draftResult: AcademicResult = {
              id: Date.now(), // Temporary ID
              student_id: Number.parseInt(formData.student_id),
              student_name: formData.student_name,
              course_code: formData.course_code,
              course_title: formData.course_title,
              semester: formData.semester,
              session: formData.session,
              ca_score: caScore,
              exam_score: examScore,
              total_score: caScore + examScore,
              grade: calculateGrade(caScore + examScore).grade,
              grade_point: calculateGrade(caScore + examScore).point,
              faculty_id: user.faculty_id || 0,
              status: "Draft",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            // Add to local results (this will be lost on page refresh)
            setResults(prev => [...prev, draftResult])
            toast.success("Draft saved locally")
          }
          
          // Reset form
          setFormData({
            student_id: "",
            student_name: "",
            matric_number: "",
            course_code: "",
            course_title: "",
            semester: "",
            session: "",
            ca_score: "",
            exam_score: "",
            status: "Draft",
            faculty_note: "",
          })
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedResult(null)
          return
        } else if (formData.status === "Forward for Approval") {
          // Upload to server with "Pending" status (private key already verified at upload button)
          const studentId = Number.parseInt(formData.student_id)
          
          const resultData = {
            student_id: studentId,
            course_code: formData.course_code,
            course_title: formData.course_title,
            semester: formData.semester,
            session: formData.session,
            ca_score: caScore,
            exam_score: examScore,
            faculty_id: user.faculty_id, // Add faculty_id for lecturers
            status: "Pending", // Will be automatically set to Pending for lecturers
            faculty_note: formData.faculty_note || null,
          }

          console.log('Sending result data to server:', resultData);

          const url = isEditing ? `/api/results/${selectedResult!.id}` : '/api/results'
          const method = isEditing ? 'PUT' : 'POST'

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData),
          })

          const data = await response.json()
          console.log('Server response:', data);

          if (!response.ok) {
            console.error('Server error:', data);
            setError(data.error || "Failed to forward result for approval")
            return
          }

          // Show success message
          if (data.message) {
            toast.success(data.message)
          } else {
            toast.success("Result forwarded for approval")
          }

          // Update local state with the returned data instead of reloading
          if (data.data) {
            if (isEditing) {
              setResults(prev => prev.map(result => 
                result.id === selectedResult!.id ? data.data as AcademicResult : result
              ))
            } else {
              setResults(prev => [...prev, data.data as AcademicResult])
            }
          }

          // Reset form
          setFormData({
            student_id: "",
            student_name: "",
            matric_number: "",
            course_code: "",
            course_title: "",
            semester: "",
            session: "",
            ca_score: "",
            exam_score: "",
            status: "Draft",
            faculty_note: "",
          })
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedResult(null)
          return
        }
      }

      // For other roles (Faculty, Admin), use normal flow
      const resultData = {
        student_id: Number.parseInt(formData.student_id),
        course_code: formData.course_code,
        course_title: formData.course_title,
        semester: formData.semester,
        session: formData.session,
        ca_score: caScore,
        exam_score: examScore,
        status: formData.status,
        faculty_note: formData.faculty_note || null,
      }

      const url = isEditing ? `/api/results/${selectedResult!.id}` : '/api/results'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save result")
        return
      }

      // Show success message
      if (data.message) {
        toast.success(data.message)
      } else {
        toast.success(isEditing ? "Result updated successfully" : "Result saved successfully")
      }

      // Update local state with the returned data instead of reloading
      if (data.data) {
        if (isEditing) {
          setResults(prev => prev.map(result => 
            result.id === selectedResult!.id ? data.data as AcademicResult : result
          ))
        } else {
          setResults(prev => [...prev, data.data as AcademicResult])
        }
      }

                // Reset form
          setFormData({
            student_id: "",
            student_name: "",
            matric_number: "",
            course_code: "",
            course_title: "",
            semester: "",
            session: "",
            ca_score: "",
            exam_score: "",
            status: "Draft",
            faculty_note: "",
          })
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedResult(null)
          setIsSubmitting(false)
    } catch (error) {
      console.error("Failed to save result:", error)
      setError("Failed to save result")
      setIsSubmitting(false)
    }
  }

  const handleEdit = (result: AcademicResult) => {
    if (!permissions.canEdit) {
      setError("You don't have permission to edit results")
      return
    }

    // Find the student to get matric number
    const student = students.find(s => s.id === result.student_id)
    const matricNumber = student?.matric_number || ""

    setSelectedResult(result)
    setFormData({
      student_id: result.student_id.toString(),
      student_name: result.student_name || "",
      matric_number: matricNumber,
      course_code: result.course_code,
      course_title: result.course_title,
      semester: result.semester,
      session: result.session,
      ca_score: result.ca_score.toString(),
      exam_score: result.exam_score.toString(),
      status: result.status,
      faculty_note: result.faculty_note || "",
    })

    setIsEditDialogOpen(true)
  }

  const handleShowDenialDetails = (result: AcademicResult) => {
    setSelectedDenialResult(result)
    setIsDenialDetailsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!permissions.canDelete) {
      setError("You don't have permission to delete results")
      return
    }

    if (!confirm("Are you sure you want to delete this result?")) {
      return
    }

    try {
      const response = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to delete result")
        return
      }

      // Update local state by removing the deleted result
      setResults(prev => prev.filter(result => result.id !== id))
      toast.success("Result deleted successfully")
    } catch (error) {
      console.error("Failed to delete result:", error)
      setError("Failed to delete result")
    }
  }

  const handleExport = async () => {
    if (!permissions.canExport) {
      setError("You don't have permission to export data")
      return
    }

    // Demo mode - create CSV and download
    const csvContent = [
      "Student ID,Student Name,Course Code,Course Title,Semester,Session,CA Score,Exam Score,Total Score,Grade,Status",
      ...filteredResults.map(
        (result) =>
          `${result.student_id},"${result.student_name}","${result.course_code}","${result.course_title}","${result.semester}","${result.session}",${result.ca_score},${result.exam_score},${result.total_score},"${result.grade}","${result.status}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = "academic_results.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrintResults = () => {
    if (filteredResults.length === 0) {
      toast.error("No results to print")
      return
    }

    const totalCredits = filteredResults.reduce((sum, result) => sum + (result.credits || 0), 0)
    const averageScore = filteredResults.length > 0 
      ? filteredResults.reduce((sum, result) => sum + (result.total_score || 0), 0) / filteredResults.length
      : 0
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Results - ${user.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .university { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info div { margin: 5px 0; }
          .label { font-weight: bold; color: #374151; }
          .summary { margin-bottom: 30px; padding: 15px; background-color: #f8fafc; border-radius: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #1f2937; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .table th { background-color: #f3f4f6; font-weight: bold; }
          .grade-a { background-color: #dcfce7; color: #166534; }
          .grade-b { background-color: #dbeafe; color: #1e40af; }
          .grade-c { background-color: #fef3c7; color: #92400e; }
          .grade-d { background-color: #fed7aa; color: #c2410c; }
          .grade-e { background-color: #fecaca; color: #991b1b; }
          .grade-f { background-color: #fecaca; color: #991b1b; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="university">TECHNOLOGICAL UNIVERSITY</div>
          <div style="font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 10px;">ACADEMIC RESULTS TRANSCRIPT</div>
          <div style="font-size: 16px; color: #6b7280;">Official Academic Record</div>
        </div>
        
        <div class="student-info">
          <div><span class="label">Student Name:</span> ${user.name}</div>
          <div><span class="label">Email:</span> ${user.email}</div>
          <div><span class="label">Faculty:</span> ${user.department}</div>
          <div><span class="label">Department:</span> ${user.department}</div>
          <div><span class="label">Academic Year:</span> ${filteredResults[0]?.session || 'N/A'}</div>
          <div><span class="label">Semester:</span> ${filteredResults[0]?.semester || 'N/A'}</div>
        </div>
        
        <div class="summary">
          <h3 style="margin-top: 0; margin-bottom: 15px; color: #1f2937;">Academic Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${filteredResults.length}</div>
              <div class="summary-label">Total Courses</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${averageScore.toFixed(1)}%</div>
              <div class="summary-label">Average Score</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${totalCredits.toFixed(1)}</div>
              <div class="summary-label">Total Credits</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${Math.max(...filteredResults.map(r => r.total_score))}%</div>
              <div class="summary-label">Highest Score</div>
            </div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Semester</th>
              <th>CA Score</th>
              <th>Exam Score</th>
              <th>Total Score</th>
              <th>Grade</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredResults.map(result => `
              <tr>
                <td>${result.course_code}</td>
                <td>${result.course_title}</td>
                <td>${result.semester} ${result.session}</td>
                <td>${result.ca_score}%</td>
                <td>${result.exam_score}%</td>
                <td>${result.total_score}%</td>
                <td class="grade-${result.grade.toLowerCase()}">${result.grade}</td>
                <td>${result.credits || 0}</td>
                <td style="color: #059669; font-weight: bold;">${result.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>This is an official academic transcript from Technological University</div>
          <div style="margin-top: 10px; font-weight: bold;">Valid for Academic Records</div>
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Transcript</button>
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
      toast.error("Please allow pop-ups to print your results")
    }
  }

  const handleDownloadResults = async () => {
    if (filteredResults.length === 0) {
      toast.error("No results to download")
      return
    }

    try {
      // For students, use secure PDF download
      if (user.role === "Student") {
        setGeneratingPDF(true);
        const response = await fetch('/api/results/secure-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            academicYear: academicYearFilter,
            semester: semesterFilter
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Create secure PDF file for download
          const blob = new Blob([data.data.fileContent], { type: 'application/pdf' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', data.data.fileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Secure PDF downloaded successfully. This file requires your private key to decrypt and view the contents.");
        } else {
          const errorData = await response.json();
          toast.error(`Download failed: ${errorData.error || 'Unknown error'}`);
        }
        setGeneratingPDF(false);
      } else {
        // For non-students, use regular CSV download
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
          'Status'
        ];

        const csvContent = [
          headers.join(','),
          ...filteredResults.map(result => [
            result.course_code,
            `"${result.course_title}"`,
            result.semester,
            result.session,
            result.ca_score,
            result.exam_score,
            result.total_score,
            result.grade,
            result.grade_point,
            result.status
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `academic_results_${user.name}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Results downloaded successfully");
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download results");
      setGeneratingPDF(false);
    }
  }

  const handleSecureFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('File uploaded:', file.name, 'Size:', file.size, 'Type:', file.type);
        console.log('Content preview:', content.substring(0, 200));
        setSecureFileContent(content);
      };
      if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const checkStudentPassword = async () => {
    try {
      const response = await fetch('/api/digital-signatures/check-student-password', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.hasPassword;
      }
      return false;
    } catch (error) {
      console.error('Error checking password:', error);
      return false;
    }
  };

  const verifyPassword = async (enteredPassword: string) => {
    try {
      setIsPasswordLoading(true);
      console.log('Client-side password verification:');
      console.log('- Entered password:', enteredPassword);
      
      const response = await fetch('/api/digital-signatures/verify-student-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: enteredPassword })
      });
      
      console.log('- Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('- Response data:', data);
        return data.success;
      } else {
        const errorData = await response.json();
        console.log('- Error response:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const createStudentPassword = async (newPassword: string) => {
    try {
      setIsPasswordLoading(true);
      const response = await fetch('/api/digital-signatures/create-student-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success;
      }
      return false;
    } catch (error) {
      console.error('Error creating password:', error);
      return false;
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleShowKeyClick = async () => {
    const hasPassword = await checkStudentPassword();
    
    if (!hasPassword) {
      // First time - create password
      setIsCreatePasswordDialogOpen(true);
    } else {
      // Has password - verify it
      setIsPasswordDialogOpen(true);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter your password');
      return;
    }

    const isValid = await verifyPassword(password);
    if (isValid) {
      setIsPasswordDialogOpen(false);
      setPassword('');
      setPasswordError('');
      // Load and show the private key
      await loadAndShowPrivateKey();
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleCreatePassword = async () => {
    if (!newPassword.trim()) {
      setPasswordError('Please enter a password');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const success = await createStudentPassword(newPassword);
    if (success) {
      setIsCreatePasswordDialogOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError('');
      toast.success('Password created successfully!');
      // Load and show the private key
      await loadAndShowPrivateKey();
    } else {
      setPasswordError('Failed to create password. Please try again.');
    }
  };

  const loadAndShowPrivateKey = async () => {
    try {
      console.log('Loading private key after password verification...');
      const response = await fetch('/api/digital-signatures/student-private-key');
      if (response.ok) {
        const data = await response.json();
        console.log('Private key loaded successfully:', data);
        setManualPrivateKey(data.data.privateKey);
        setShowManualPrivateKey(true);
        toast.success('Private key loaded successfully!');
      } else {
        console.error('Failed to load private key:', response.status);
        toast.error('Failed to load private key');
      }
    } catch (error) {
      console.error('Error loading private key:', error);
      toast.error('Failed to load private key');
    }
  };

  const decryptSecureFile = async () => {
    if (!secureFileContent || !manualPrivateKey.trim()) {
      toast.error("Please upload a secure file and enter your private key");
      return;
    }

    try {
      setDecryptingSecureFile(true);
      console.log('Decrypting secure file with manual private key...'); // Debugging
      console.log('File content length:', secureFileContent.length); // Debugging
      console.log('Private key length:', manualPrivateKey.length); // Debugging

      const response = await fetch('/api/results/decrypt-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secureFileContent, 
          privateKey: manualPrivateKey.trim() 
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Decryption successful:', data); // Debugging
        setDecryptedSecureContent(data);
        toast.success("Secure file decrypted successfully!");
      } else {
        const errorData = await response.json();
        console.error('Decryption failed:', errorData); // Debugging
        toast.error(errorData.error || "Failed to decrypt secure file");
      }
    } catch (error) {
      console.error('Decryption error:', error);
      toast.error("Failed to decrypt secure file");
    } finally {
      setDecryptingSecureFile(false);
    }
  };

  const downloadDecryptedSecurePDF = () => {
    if (!decryptedSecureContent) return;

    console.log('Download PDF - Full decrypted content:', decryptedSecureContent);
    console.log('Download PDF - Type of decrypted content:', typeof decryptedSecureContent);
    console.log('Download PDF - Keys in decrypted content:', Object.keys(decryptedSecureContent));
    
    // The decrypt-secure API returns: { success: true, data: decryptedContent }
    // The decryptedContent is the actual pdfContent structure from secure-download
    let data;
    if (decryptedSecureContent.success && decryptedSecureContent.data) {
      // API response format: { success: true, data: {...} }
      data = decryptedSecureContent.data;
    } else if (decryptedSecureContent.data) {
      // Direct data property
      data = decryptedSecureContent.data;
    } else {
      // Direct format: the decrypted content itself
      data = decryptedSecureContent;
    }
    
    // Handle nested data structure - the actual content might be in data.data
    if (data && data.data) {
      data = data.data;
    }
    
    console.log('Download PDF - Final data structure:', data);
    console.log('Download PDF - Data type:', typeof data);
    console.log('Download PDF - Data keys:', Object.keys(data || {}));
    console.log('Download PDF - Student info:', data?.student);
    console.log('Download PDF - Metadata:', data?.metadata);
    console.log('Download PDF - Academic info:', data?.academicInfo);
    console.log('Download PDF - Summary:', data?.summary);
    console.log('Download PDF - Results:', data?.results);
    console.log('Download PDF - Results length:', data?.results?.length);
    
    // Get student information from the pdfContent structure
    const studentName = data?.student?.name || data?.metadata?.studentName || 'N/A';
    const studentEmail = data?.student?.email || data?.metadata?.studentEmail || 'N/A';
    const department = data?.student?.department || 'N/A';
    const academicYear = data?.academicInfo?.year || data?.metadata?.academicYear || 'N/A';
    const semester = data?.academicInfo?.semester || data?.metadata?.semester || 'N/A';
    const totalResults = data?.academicInfo?.totalResults || data?.metadata?.totalResults || 0;
    const downloadDate = data?.academicInfo?.downloadDate || data?.metadata?.downloadDate || new Date().toISOString();
    
    // Get summary information from the pdfContent structure
    const totalCourses = data?.summary?.totalCourses || data?.metadata?.totalResults || 0;
    const averageScore = data?.summary?.averageScore || 0;
    const totalCredits = data?.summary?.totalCredits || 0;
    const highestScore = data?.summary?.highestScore || 0;
    
    // Get results
    const results = data?.results || [];

    console.log('Download PDF - Extracted values:');
    console.log('- Student Name:', studentName);
    console.log('- Student Email:', studentEmail);
    console.log('- Department:', department);
    console.log('- Academic Year:', academicYear);
    console.log('- Semester:', semester);
    console.log('- Total Courses:', totalCourses);
    console.log('- Average Score:', averageScore);
    console.log('- Total Credits:', totalCredits);
    console.log('- Highest Score:', highestScore);
    console.log('- Results count:', results.length);
    console.log('- First result:', results[0]);

    // Process results to ensure total_score is calculated
    const processedResults = results.map((result: any) => {
      // Calculate total_score if it's missing or undefined
      const total_score = result.total_score || (result.ca_score + result.exam_score);
      return {
        ...result,
        total_score: total_score
      };
    });

    // Recalculate summary values from processed results
    const recalculatedTotalCourses = processedResults.length;
    const recalculatedAverageScore = processedResults.length > 0 
      ? (processedResults.reduce((sum: number, result: any) => sum + (result.total_score || 0), 0) / processedResults.length).toFixed(1)
      : '0.0';
    const recalculatedTotalCredits = processedResults.reduce((sum: number, result: any) => sum + (result.credits || 0), 0).toFixed(1);
    const recalculatedHighestScore = processedResults.length > 0 
      ? Math.max(...processedResults.map((r: any) => r.total_score || 0))
      : 0;

    console.log('Download PDF - Recalculated values:');
    console.log('- Recalculated Total Courses:', recalculatedTotalCourses);
    console.log('- Recalculated Average Score:', recalculatedAverageScore);
    console.log('- Recalculated Total Credits:', recalculatedTotalCredits);
    console.log('- Recalculated Highest Score:', recalculatedHighestScore);
    console.log('- Processed Results:', processedResults);

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Results Transcript</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .university { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info div { margin: 5px 0; }
          .label { font-weight: bold; color: #374151; }
          .summary { margin-bottom: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 15px; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
          .summary-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .summary-label { font-size: 12px; color: #6b7280; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .table th { background-color: #f3f4f6; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          .download-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px; 
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          .download-btn:hover { background: #2563eb; }
          .download-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <button class="download-btn" onclick="downloadPDF()" id="downloadBtn">
          📄 Download PDF
        </button>

        <div class="header">
          <div class="university">TECHNOLOGICAL UNIVERSITY</div>
          <div style="font-size: 16px; color: #6b7280;">Academic Results Transcript</div>
        </div>

        <div class="student-info">
          <div><span class="label">Student Name:</span> ${studentName}</div>
          <div><span class="label">Email:</span> ${studentEmail}</div>
          <div><span class="label">Department:</span> ${department}</div>
          <div><span class="label">Academic Year:</span> ${academicYear}</div>
          <div><span class="label">Semester:</span> ${semester}</div>
          <div><span class="label">Download Date:</span> ${new Date(downloadDate).toLocaleDateString()}</div>
        </div>

        <div class="summary">
          <h3>Academic Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value" style="color: #3b82f6;">${recalculatedTotalCourses}</div>
              <div class="summary-label">Total Courses</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981;">${recalculatedAverageScore}%</div>
              <div class="summary-label">Average Score</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #8b5cf6;">${recalculatedTotalCredits}</div>
              <div class="summary-label">Total Credits</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #f59e0b;">${recalculatedHighestScore}%</div>
              <div class="summary-label">Highest Score</div>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Semester</th>
              <th>CA Score</th>
              <th>Exam Score</th>
              <th>Total Score</th>
              <th>Grade</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${processedResults.map((result: any) => `
              <tr>
                <td>${result.course_code}</td>
                <td>${result.course_title}</td>
                <td>${result.semester}</td>
                <td>${result.ca_score}</td>
                <td>${result.exam_score}</td>
                <td>${result.total_score}</td>
                <td>${result.grade}</td>
                <td>${result.credits || 0}</td>
                <td style="color: #059669; font-weight: bold;">${result.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>This is an official transcript from Technological University</div>
        </div>

        <script>
          async function downloadPDF() {
            const btn = document.getElementById('downloadBtn');
            btn.disabled = true;
            btn.textContent = '🔄 Generating PDF...';
            
            try {
              // Hide the download button temporarily
              btn.style.display = 'none';
              
              // Generate PDF using html2canvas and jsPDF
              const element = document.body;
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
              });
              
              const imgData = canvas.toDataURL('image/png');
              const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
              const imgWidth = 210;
              const pageHeight = 295;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;
              
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              
              while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
              }
              
              // Download the PDF
              const fileName = 'academic_transcript_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf';
              pdf.save(fileName);
              
              btn.textContent = '✅ PDF Downloaded!';
              setTimeout(() => {
                btn.textContent = '📄 Download PDF';
                btn.disabled = false;
              }, 2000);
              
            } catch (error) {
              console.error('Error generating PDF:', error);
              btn.textContent = '❌ Error - Try Again';
              setTimeout(() => {
                btn.textContent = '📄 Download PDF';
                btn.disabled = false;
              }, 3000);
            } finally {
              btn.style.display = 'block';
            }
          }
        </script>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decrypted_transcript_${studentName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("HTML transcript downloaded! Open it in a browser and print as PDF.");
  };

  const generatePDFFromContent = () => {
    if (!decryptedSecureContent) return;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Academic Results Transcript</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .university { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info div { margin: 5px 0; }
          .label { font-weight: bold; color: #374151; }
          .summary { margin-bottom: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 15px; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
          .summary-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .summary-label { font-size: 12px; color: #6b7280; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .table th { background-color: #f3f4f6; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          .download-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px; 
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          .download-btn:hover { background: #2563eb; }
          .download-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <button class="download-btn" onclick="downloadPDF()" id="downloadBtn">
          📄 Download PDF
        </button>

        <div class="header">
          <div class="university">TECHNOLOGICAL UNIVERSITY</div>
          <div style="font-size: 16px; color: #6b7280;">Academic Results Transcript</div>
        </div>

        <div class="student-info">
          <div><span class="label">Student Name:</span> ${decryptedSecureContent.data.student?.name || 'N/A'}</div>
          <div><span class="label">Email:</span> ${decryptedSecureContent.data.student?.email || 'N/A'}</div>
          <div><span class="label">Department:</span> ${decryptedSecureContent.data.student?.department || 'N/A'}</div>
          <div><span class="label">Academic Year:</span> ${decryptedSecureContent.data.academicInfo?.year || 'N/A'}</div>
          <div><span class="label">Semester:</span> ${decryptedSecureContent.data.academicInfo?.semester || 'N/A'}</div>
          <div><span class="label">Download Date:</span> ${new Date(decryptedSecureContent.data.academicInfo?.downloadDate || '').toLocaleDateString()}</div>
        </div>

        <div class="summary">
          <h3>Academic Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value" style="color: #3b82f6;">${decryptedSecureContent.data.summary?.totalCourses || 0}</div>
              <div class="summary-label">Total Courses</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #10b981;">${decryptedSecureContent.data.summary?.averageScore || 0}%</div>
              <div class="summary-label">Average Score</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #8b5cf6;">${decryptedSecureContent.data.summary?.totalCredits || 0}</div>
              <div class="summary-label">Total Credits</div>
            </div>
            <div class="summary-item">
              <div class="summary-value" style="color: #f59e0b;">${decryptedSecureContent.data.summary?.highestScore || 0}%</div>
              <div class="summary-label">Highest Score</div>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Semester</th>
              <th>CA Score</th>
              <th>Exam Score</th>
              <th>Total Score</th>
              <th>Grade</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${decryptedSecureContent.data.results?.map((result: any) => `
              <tr>
                <td>${result.course_code}</td>
                <td>${result.course_title}</td>
                <td>${result.semester}</td>
                <td>${result.ca_score}</td>
                <td>${result.exam_score}</td>
                <td>${result.total_score}</td>
                <td>${result.grade}</td>
                <td>${result.credits || 0}</td>
                <td>${result.status}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>This is an official transcript from Technological University</div>
        </div>

        <script>
          async function downloadPDF() {
            const btn = document.getElementById('downloadBtn');
            btn.disabled = true;
            btn.textContent = '🔄 Generating PDF...';
            
            try {
              // Hide the download button temporarily
              btn.style.display = 'none';
              
              // Generate PDF using html2canvas and jsPDF
              const element = document.body;
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
              });
              
              const imgData = canvas.toDataURL('image/png');
              const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
              const imgWidth = 210;
              const pageHeight = 295;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;
              
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              
              while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
              }
              
              // Download the PDF
              const fileName = 'academic_transcript_${decryptedSecureContent.data.student?.name || 'student'}_${new Date().toISOString().split('T')[0]}.pdf';
              pdf.save(fileName);
              
              btn.textContent = '✅ PDF Downloaded!';
              setTimeout(() => {
                btn.textContent = '📄 Download PDF';
                btn.disabled = false;
              }, 2000);
              
            } catch (error) {
              console.error('Error generating PDF:', error);
              btn.textContent = '❌ Error - Try Again';
              setTimeout(() => {
                btn.textContent = '📄 Download PDF';
                btn.disabled = false;
              }, 3000);
            } finally {
              btn.style.display = 'block';
            }
          }
        </script>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decrypted_transcript_${decryptedSecureContent.data.student?.name || 'student'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("HTML transcript generated. You can open it in a browser and print as PDF.");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "Draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "Forward for Approval":
        return <Badge className="bg-blue-100 text-blue-800">Forward for Approval</Badge>
      case "Under Review":
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
      case "Pending":
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      case "Denied":
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getGradeBadge = (grade: string) => {
    const colors = {
      A: "bg-green-100 text-green-800",
      B: "bg-blue-100 text-blue-800",
      C: "bg-yellow-100 text-yellow-800",
      D: "bg-orange-100 text-orange-800",
      E: "bg-red-100 text-red-800",
      F: "bg-red-200 text-red-900",
    }
    return <Badge className={colors[grade as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{grade}</Badge>
  }

  const handleCourseSelection = (courseCode: string) => {
    const selectedCourse = courses.find(course => course.course_code === courseCode)
    if (selectedCourse) {
      setFormData(prev => ({
        ...prev,
        course_code: selectedCourse.course_code,
        course_title: selectedCourse.course_title
      }))
    }
  }

  const handleStudentSelection = (studentId: string) => {
    const selectedStudent = students.find(student => student.id.toString() === studentId)
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        student_id: selectedStudent.id.toString(),
        student_name: selectedStudent.name,
        matric_number: selectedStudent.matric_number
      }))
    }
  }



  const handleUploadButtonClick = async (course: any) => {
    // For lecturers, require private key verification before opening upload dialog
    if (user.role === "Lecturer") {
      setPendingCourseForUpload(course)
      setIsUploadPrivateKeyDialogOpen(true)
      // Try to auto-fill private key if password is already verified
      setTimeout(() => checkAndAutoFillPrivateKey(), 100)
    } else {
      // For other roles, open dialog directly
      setFormData({
        student_id: "",
        student_name: "",
        matric_number: "",
        course_code: course.course_code,
        course_title: course.course_title,
        semester: "",
        session: "",
        ca_score: "",
        exam_score: "",
        status: "Draft" as const,
        faculty_note: "",
      })
      setIsAddDialogOpen(true)
    }
  }

  const handleUploadPrivateKeySubmit = async () => {
    if (!uploadPrivateKey.trim()) {
      setUploadPrivateKeyError("Private key is required")
      return
    }

    try {
      setIsUploadPrivateKeyLoading(true)
      setUploadPrivateKeyError("")

      // Fetch lecturer's actual private key from the API to compare
      const response = await fetch('/api/digital-signatures/lecturer-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.data.privateKey) {
        // Compare the entered private key with the stored one
        if (uploadPrivateKey.trim() === data.data.privateKey.trim()) {
          // Private key verified successfully, open upload dialog
          if (pendingCourseForUpload) {
            setFormData({
              student_id: "",
              student_name: "",
              matric_number: "",
              course_code: pendingCourseForUpload.course_code,
              course_title: pendingCourseForUpload.course_title,
              semester: "",
              session: "",
              ca_score: "",
              exam_score: "",
              status: "Draft" as const,
              faculty_note: "",
            })
            setIsAddDialogOpen(true)
            toast.success("Private key verified - Upload dialog opened")
          }
          
          // Reset private key dialog
          setIsUploadPrivateKeyDialogOpen(false)
          setUploadPrivateKey("")
          setPendingCourseForUpload(null)
        } else {
          setUploadPrivateKeyError("Incorrect private key")
        }
      } else {
        setUploadPrivateKeyError("Failed to retrieve your private key")
      }
    } catch (error) {
      console.error('Error verifying private key:', error)
      setUploadPrivateKeyError("Failed to verify private key")
    } finally {
      setIsUploadPrivateKeyLoading(false)
    }
  }

  const checkAndAutoFillPrivateKey = async () => {
    try {
      // First check if lecturer has already verified their password
      const passwordCheckResponse = await fetch('/api/digital-signatures/check-lecturer-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const passwordCheckData = await passwordCheckResponse.json()

      if (passwordCheckResponse.ok && passwordCheckData.hasPassword) {
        // Lecturer has a password set, now try to auto-fill the private key
        const keysResponse = await fetch('/api/digital-signatures/lecturer-keys', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        const keysData = await keysResponse.json()

        if (keysResponse.ok && keysData.success && keysData.data.privateKey) {
          // Auto-fill the private key field
          setUploadPrivateKey(keysData.data.privateKey)
          setShowUploadPrivateKey(true)
          toast.success("Private key auto-filled from verified session")
        }
      }
    } catch (error) {
      console.error('Error checking password status:', error)
      // Don't show error toast here as this is just an auto-fill attempt
    }
  }

  const verifyFacultyPrivateKey = async () => {
    if (!facultyPrivateKey.trim()) {
      setFacultyPrivateKeyError("Private key is required")
      return
    }

    try {
      setIsFacultyPrivateKeyLoading(true)
      setFacultyPrivateKeyError("")

      // Fetch faculty's actual private key from the API to compare
      const response = await fetch('/api/digital-signatures/faculty-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.data.privateKey) {
        // Compare the entered private key with the stored one
        if (facultyPrivateKey.trim() === data.data.privateKey.trim()) {
          // Private key verified successfully, proceed with faculty action
          if (pendingFacultyAction === "add_result") {
            setIsAddDialogOpen(true)
          }
          
          // Reset private key dialog
          setIsFacultyPrivateKeyDialogOpen(false)
          setFacultyPrivateKey("")
          setPendingFacultyAction(null)
          toast.success("Private key verified - proceeding with action")
        } else {
          setFacultyPrivateKeyError("Incorrect private key")
        }
      } else {
        setFacultyPrivateKeyError("Failed to retrieve your private key")
      }
    } catch (error) {
      console.error('Error verifying private key:', error)
      setFacultyPrivateKeyError("Failed to verify private key")
    } finally {
      setIsFacultyPrivateKeyLoading(false)
    }
  }

  const checkAndAutoFillFacultyPrivateKey = async () => {
    try {
      // First check if faculty has already verified their password
      const passwordCheckResponse = await fetch('/api/digital-signatures/check-faculty-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const passwordCheckData = await passwordCheckResponse.json()

      if (passwordCheckResponse.ok && passwordCheckData.hasPassword) {
        // Faculty has a password set, now try to auto-fill the private key
        const keysResponse = await fetch('/api/digital-signatures/faculty-keys', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        const keysData = await keysResponse.json()

        if (keysResponse.ok && keysData.success && keysData.data.privateKey) {
          // Auto-fill the private key field
          setFacultyPrivateKey(keysData.data.privateKey)
          setShowFacultyPrivateKey(true)
          toast.success("Private key auto-filled from verified session")
        }
      }
    } catch (error) {
      console.error('Error checking password status:', error)
      // Don't show error toast here as this is just an auto-fill attempt
    }
  }

  // Student search functionality


  if (!permissions.canView) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <EyeOff className="h-4 w-4" />
            <AlertDescription>You don't have permission to view academic results.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading results...</span>
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
            <GraduationCap className="h-5 w-5" />
            <span>Academic Results Management</span>
          </CardTitle>
          <CardDescription>
            {user.role === "Administrator" && "Manage all academic results with full system access"}
            {user.role === "Faculty" && "Manage results for your courses with edit and export capabilities"}
            {user.role === "Lecturer" && "Upload results for your courses (automatically forwarded to your assigned faculty for approval)"}
            {user.role === "Student" && "View your academic results (read-only access)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search bar - only for non-students */}
            {user.role !== "Student" && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name, course code, or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            <div className="flex gap-2">
              {user.role === "Student" ? (
                <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023/2024">2023/2024</SelectItem>
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                    <SelectItem value="2025/2026">2025/2026</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

                    {/* Course Selection for Lecturers */}
          {user.role === "Lecturer" && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Select a Course to Upload Results</h3>
              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{course.course_code}</CardTitle>
                        <CardDescription className="text-sm">{course.course_title}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{course.department}</span>
                          <Button 
                            onClick={() => handleUploadButtonClick(course)}
                            size="sm"
                            disabled={isPrivateKeyVerificationLoading}
                          >
                            {isPrivateKeyVerificationLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Results
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</h4>
                    <p className="text-gray-500">You don't have any courses assigned to you yet. Contact your administrator to get courses assigned.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Dialog for Add Result - Available for all roles */}
          {permissions.canEdit && (
            <Dialog 
              open={isAddDialogOpen} 
              onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (open) {
                  // Reset form when dialog opens (only if not pre-filled by course selection)
                  if (!formData.course_code) {
                    setFormData({
                      student_id: "",
                      student_name: "",
                      matric_number: "",
                      course_code: "",
                      course_title: "",
                      semester: "",
                      session: "",
                      ca_score: "",
                      exam_score: "",
                      status: "Draft" as const,
                      faculty_note: "",
                    })
                  }
                }
              }}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Academic Result</DialogTitle>
                  <DialogDescription>
                    Enter the student's academic result details
                    {user.role === "Lecturer" && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                        <strong>Note:</strong> Your result will be automatically forwarded to your assigned faculty for approval.
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Hidden field for student_id */}
                  <input 
                    type="hidden" 
                    value={formData.student_id} 
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="student_name">Student Name</Label>
                      {user.role === "Lecturer" ? (
                        <Select
                          value={formData.student_id}
                          onValueChange={handleStudentSelection}
                          disabled={studentsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select a student"} />
                          </SelectTrigger>
                          <SelectContent>
                            {students.length === 0 ? (
                              <SelectItem value="no-students" disabled>
                                No students found for your courses
                              </SelectItem>
                            ) : (
                              students.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          ref={studentNameInputRef}
                          key={`student_name_${formKey}`}
                          id="student_name"
                          type="text"
                          value={formData.student_name || ""}
                          onChange={(e) => {
                            console.log("Student name input changed to:", e.target.value)
                            setFormData(prev => ({ ...prev, student_name: e.target.value }))
                          }}
                          placeholder={formData.student_name ? "" : "Student name will be auto-filled"}
                          required
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="matric_number">Matric Number</Label>
                      <Input
                        ref={matricNumberInputRef}
                        key={`matric_number_${formKey}`}
                        id="matric_number"
                        value={formData.matric_number || ""}
                        onChange={(e) => {
                          console.log("Matric number input changed to:", e.target.value)
                          setFormData(prev => ({ ...prev, matric_number: e.target.value }))
                        }}
                        placeholder={formData.matric_number ? "Matric number will be auto-filled" : ""}
                        className={formData.matric_number ? "bg-green-50 border-green-300" : ""}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="course_code">Course Code</Label>
                      {user.role === "Lecturer" ? (
                        <Select
                          value={formData.course_code}
                          onValueChange={handleCourseSelection}
                          disabled={coursesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.length === 0 ? (
                              <SelectItem value="no-courses" disabled>
                                No courses found for this lecturer
                              </SelectItem>
                            ) : (
                              courses.map((course) => (
                                <SelectItem key={course.id} value={course.course_code}>
                                  {course.course_code} - {course.course_title}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="course_code"
                          value={formData.course_code}
                          onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                          required
                        />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="course_title">Course Title</Label>
                      <Input
                        id="course_title"
                        value={formData.course_title}
                        onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(value) => setFormData({ ...formData, semester: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First">First</SelectItem>
                          <SelectItem value="Second">Second</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="session">Session</Label>
                      <Input
                        id="session"
                        placeholder="e.g., 2023/2024"
                        value={formData.session}
                        onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ca_score">CA Score (0-30)</Label>
                      <Input
                        id="ca_score"
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        value={formData.ca_score}
                        onChange={(e) => setFormData({ ...formData, ca_score: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam_score">Exam Score (0-70)</Label>
                      <Input
                        id="exam_score"
                        type="number"
                        min="0"
                        max="70"
                        step="0.1"
                        value={formData.exam_score}
                        onChange={(e) => setFormData({ ...formData, exam_score: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {user.role === "Lecturer" ? (
                          <>
                            <SelectItem value="Draft">Draft (Save Locally)</SelectItem>
                            <SelectItem value="Forward for Approval">Forward for Approval</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Published">Published</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {user.role === "Lecturer" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.status === "Draft" 
                          ? "Draft will be saved locally and not uploaded to the system"
                          : "Forward for Approval will send the result to your faculty for review"
                        }
                      </p>
                    )}
                  </div>
                  {user.role === "Lecturer" && (
                    <div>
                      <Label htmlFor="faculty_note">Note to Faculty (Optional)</Label>
                      <textarea
                        id="faculty_note"
                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add any notes or explanations for the faculty reviewing this result..."
                        value={formData.faculty_note}
                        onChange={(e) => setFormData({ ...formData, faculty_note: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This note will be sent to your faculty when you forward the result for approval.
                      </p>
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Adding..." : "Add Result"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Action Buttons - Role-based visibility */}
          <div className="flex flex-wrap gap-2 mb-6">
            {permissions.canEdit && user.role !== "Lecturer" && (
              <Dialog 
                open={isAddDialogOpen} 
                onOpenChange={(open) => {
                  // For faculty, require private key verification before opening dialog
                  if (user.role === "Faculty" && open) {
                    setPendingFacultyAction("add_result")
                    setIsFacultyPrivateKeyDialogOpen(true)
                    // Try to auto-fill private key if password is already verified
                    setTimeout(() => checkAndAutoFillFacultyPrivateKey(), 100)
                    return
                  }
                  
                  setIsAddDialogOpen(open)
                  if (open) {
                    // Reset form when dialog opens
                    setFormData({
                      student_id: "",
                      student_name: "",
                      matric_number: "",
                      course_code: "",
                      course_title: "",
                      semester: "",
                      session: "",
                      ca_score: "",
                      exam_score: "",
                      status: "Draft" as const,
                      faculty_note: "",
                    })
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Result
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Academic Result</DialogTitle>
                    <DialogDescription>
                      Enter the student's academic result details
                      {user.role === "Lecturer" && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                          <strong>Note:</strong> Your result will be automatically forwarded to your assigned faculty for approval.
                        </div>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">


                    {/* Hidden field for student_id */}
                    <input 
                      type="hidden" 
                      value={formData.student_id} 
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student_name">Student Name</Label>
                        {user.role === "Lecturer" ? (
                          <Select
                            value={formData.student_id}
                            onValueChange={handleStudentSelection}
                            disabled={studentsLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select a student"} />
                            </SelectTrigger>
                            <SelectContent>
                              {students.length === 0 ? (
                                <SelectItem value="no-students" disabled>
                                  No students found for your courses
                                </SelectItem>
                              ) : (
                                students.map((student) => (
                                  <SelectItem key={student.id} value={student.id.toString()}>
                                    {student.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            ref={studentNameInputRef}
                            key={`student_name_${formKey}`}
                            id="student_name"
                            type="text"
                            value={formData.student_name || ""}
                            onChange={(e) => {
                              console.log("Student name input changed to:", e.target.value)
                              setFormData(prev => ({ ...prev, student_name: e.target.value }))
                            }}
                            placeholder={formData.student_name ? "" : "Student name will be auto-filled"}
                            required
                          />
                        )}
                      </div>
                      <div>
                        <Label htmlFor="matric_number">Matric Number</Label>
                        <Input
                          ref={matricNumberInputRef}
                          key={`matric_number_${formKey}`}
                          id="matric_number"
                          value={formData.matric_number || ""}
                          onChange={(e) => {
                            console.log("Matric number input changed to:", e.target.value)
                            setFormData(prev => ({ ...prev, matric_number: e.target.value }))
                          }}
                          placeholder={formData.matric_number ? "Matric number will be auto-filled" : ""}

                          required
                        />

                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="course_code">Course Code</Label>
                        {user.role === "Lecturer" ? (
                          <Select
                            value={formData.course_code}
                            onValueChange={handleCourseSelection}
                            disabled={coursesLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.length === 0 ? (
                                <SelectItem value="no-courses" disabled>
                                  No courses found for this lecturer
                                </SelectItem>
                              ) : (
                                courses.map((course) => (
                                  <SelectItem key={course.id} value={course.course_code}>
                                    {course.course_code} - {course.course_title}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="course_code"
                            value={formData.course_code}
                            onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                            required
                          />
                        )}
                      </div>
                      <div>
                        <Label htmlFor="course_title">Course Title</Label>
                        <Input
                          id="course_title"
                          value={formData.course_title}
                          onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                          value={formData.semester}
                          onValueChange={(value) => setFormData({ ...formData, semester: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="First">First</SelectItem>
                            <SelectItem value="Second">Second</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="session">Session</Label>
                        <Input
                          id="session"
                          placeholder="e.g., 2023/2024"
                          value={formData.session}
                          onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ca_score">CA Score (0-30)</Label>
                        <Input
                          id="ca_score"
                          type="number"
                          min="0"
                          max="30"
                          step="0.1"
                          value={formData.ca_score}
                          onChange={(e) => setFormData({ ...formData, ca_score: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="exam_score">Exam Score (0-70)</Label>
                        <Input
                          id="exam_score"
                          type="number"
                          min="0"
                          max="70"
                          step="0.1"
                          value={formData.exam_score}
                          onChange={(e) => setFormData({ ...formData, exam_score: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {user.role === "Lecturer" ? (
                            <>
                              <SelectItem value="Draft">Draft (Save Locally)</SelectItem>
                              <SelectItem value="Forward for Approval">Forward for Approval</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Under Review">Under Review</SelectItem>
                              <SelectItem value="Published">Published</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {user.role === "Lecturer" && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.status === "Draft" 
                            ? "Draft will be saved locally and not uploaded to the system"
                            : "Forward for Approval will send the result to your faculty for review"
                          }
                        </p>
                      )}
                    </div>
                    {user.role === "Lecturer" && (
                      <div>
                        <Label htmlFor="faculty_note">Note to Faculty (Optional)</Label>
                        <textarea
                          id="faculty_note"
                          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add any notes or explanations for the faculty reviewing this result..."
                          value={formData.faculty_note}
                          onChange={(e) => setFormData({ ...formData, faculty_note: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This note will be sent to your faculty when you forward the result for approval.
                        </p>
                      </div>
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add Result"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {permissions.canExport && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}

            {/* Print and Download buttons for students */}
            {user.role === "Student" && filteredResults.length > 0 && (
              <>
                <Button variant="outline" onClick={handlePrintResults}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Transcript
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadResults}
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Secure PDF
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsSecureDecryptDialogOpen(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Decrypt Secure File
                </Button>
                <Button variant="outline" onClick={handleShowKeyClick}>
                  <Key className="h-4 w-4 mr-2" /> Show Private Key
                </Button>
              </>
            )}

            {permissions.canBulkOps && (
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            )}
          </div>

          {/* Student Summary Section */}
          {user.role === "Student" && filteredResults.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Your Academic Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{filteredResults.length}</div>
                    <div className="text-sm text-gray-600">Total Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredResults.length > 0 
                        ? (filteredResults.reduce((sum, result) => sum + (result.total_score || 0), 0) / filteredResults.length).toFixed(1)
                        : '0.0'}%
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {filteredResults.reduce((sum, result) => sum + (result.credits || 0), 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Total Credits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {filteredResults.length > 0 
                        ? Math.max(...filteredResults.map(r => r.total_score || 0))
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Highest Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



          {/* Results Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>CA</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Status</TableHead>
                  {(permissions.canEdit || permissions.canDelete) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      {user.role === "Student" ? "No results found for your account" : "No results found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.student_name || `Student ${result.student_id}`}</div>
                          {user.role !== "Student" && (
                            <div className="text-sm text-gray-500">{result.student_email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.course_code}</div>
                          <div className="text-sm text-gray-500">{result.course_title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{result.semester}</div>
                          <div className="text-sm text-gray-500">{result.session}</div>
                        </div>
                      </TableCell>
                      <TableCell>{result.ca_score}</TableCell>
                      <TableCell>{result.exam_score}</TableCell>
                      <TableCell className="font-medium">
                        {typeof result.ca_score === 'number' && typeof result.exam_score === 'number' 
                          ? (result.ca_score + result.exam_score) 
                          : result.total_score || 'N/A'}
                      </TableCell>
                      <TableCell>{getGradeBadge(result.grade)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="justify-center">
                          {result.credits || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {result.lecturer_name || (result.lecturer_id ? `Lecturer ${result.lecturer_id}` : 'N/A')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {result.status === "Denied" && result.approval_notes && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleShowDenialDetails(result)}
                              title="View denial details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(result)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(result.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Academic Result</DialogTitle>
                <DialogDescription>Update the student's academic result details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Search Section */}


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_student_name">Student Name</Label>
                    {user.role === "Lecturer" ? (
                      <Select
                        value={formData.student_id}
                        onValueChange={handleStudentSelection}
                        disabled={studentsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select a student"} />
                        </SelectTrigger>
                        <SelectContent>
                          {students.length === 0 ? (
                            <SelectItem value="no-students" disabled>
                              No students found for your courses
                            </SelectItem>
                          ) : (
                            students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="edit_student_name"
                        type="text"
                        value={formData.student_name || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                        placeholder="Student name"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_matric_number">Matric Number</Label>
                    <Input
                      id="edit_matric_number"
                      value={formData.matric_number || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, matric_number: e.target.value }))}
                      placeholder="Matric number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_course_code">Course Code</Label>
                    {user.role === "Lecturer" ? (
                      <Select
                        value={formData.course_code}
                        onValueChange={handleCourseSelection}
                        disabled={coursesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.length === 0 ? (
                            <SelectItem value="no-courses" disabled>
                              No courses found for this lecturer
                            </SelectItem>
                          ) : (
                            courses.map((course) => (
                              <SelectItem key={course.id} value={course.course_code}>
                                {course.course_code} - {course.course_title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="edit_course_code"
                        value={formData.course_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, course_code: e.target.value }))}
                        required
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_course_title">Course Title</Label>
                    <Input
                      id="edit_course_title"
                      value={formData.course_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, course_title: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_semester">Semester</Label>
                    <Select
                      value={formData.semester}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First">First</SelectItem>
                        <SelectItem value="Second">Second</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit_session">Session</Label>
                    <Input
                      id="edit_session"
                      placeholder="e.g., 2023/2024"
                      value={formData.session}
                      onChange={(e) => setFormData(prev => ({ ...prev, session: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_ca_score">CA Score (0-30)</Label>
                    <Input
                      id="edit_ca_score"
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      value={formData.ca_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, ca_score: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_exam_score">Exam Score (0-70)</Label>
                    <Input
                      id="edit_exam_score"
                      type="number"
                      min="0"
                      max="70"
                      step="0.1"
                      value={formData.exam_score}
                      onChange={(e) => setFormData(prev => ({ ...prev, exam_score: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {user.role === "Lecturer" ? (
                        <>
                          <SelectItem value="Draft">Draft (Save Locally)</SelectItem>
                          <SelectItem value="Forward for Approval">Forward for Approval</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {user.role === "Lecturer" && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.status === "Draft" 
                        ? "Draft will be saved locally and not uploaded to the system"
                        : "Forward for Approval will send the result to your faculty for review"
                      }
                    </p>
                  )}
                </div>
                {user.role === "Lecturer" && (
                  <div>
                    <Label htmlFor="edit_faculty_note">Note to Faculty (Optional)</Label>
                    <textarea
                      id="edit_faculty_note"
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes or explanations for the faculty reviewing this result..."
                      value={formData.faculty_note}
                      onChange={(e) => setFormData(prev => ({ ...prev, faculty_note: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This note will be sent to your faculty when you forward the result for approval.
                    </p>
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Result"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Denial Details Dialog */}
          <Dialog open={isDenialDetailsOpen} onOpenChange={setIsDenialDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Denial Details</DialogTitle>
                <DialogDescription>Reason for result denial</DialogDescription>
              </DialogHeader>
              {selectedDenialResult && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Result Information</Label>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div><strong>Student:</strong> {selectedDenialResult.student_name || `Student ${selectedDenialResult.student_id}`}</div>
                      <div><strong>Course:</strong> {selectedDenialResult.course_code} - {selectedDenialResult.course_title}</div>
                      <div><strong>Semester:</strong> {selectedDenialResult.semester} | <strong>Session:</strong> {selectedDenialResult.session}</div>
                      <div><strong>Score:</strong> {selectedDenialResult.total_score}% | <strong>Grade:</strong> {selectedDenialResult.grade}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Denial Reason</Label>
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{selectedDenialResult.approval_notes}</p>
                    </div>
                  </div>
                  {selectedDenialResult.approved_at && (
                    <div>
                      <Label className="text-sm font-medium">Denied On</Label>
                      <div className="mt-2 text-sm text-gray-600">
                        {new Date(selectedDenialResult.approved_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDenialDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Secure File Decryption Dialog */}
          <Dialog open={isSecureDecryptDialogOpen} onOpenChange={setIsSecureDecryptDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Decrypt Secure File</DialogTitle>
                <DialogDescription>
                  Upload a secure file (.secure or .pdf) and decrypt it using your private key
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="secure-file">Upload Secure File</Label>
                  <Input 
                    id="secure-file" 
                    type="file" 
                    accept=".secure,.pdf" 
                    onChange={handleSecureFileUpload} 
                    className="mt-1" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a secure file (.secure or .pdf) that was downloaded from this system
                  </p>
                </div>

                <div>
                  <Label htmlFor="private-key">Your Private Key</Label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Textarea
                        id="private-key"
                        placeholder="Paste your private key here..."
                        value={manualPrivateKey}
                        onChange={(e) => setManualPrivateKey(e.target.value)}
                        className="font-mono text-xs"
                        rows={6}
                        style={{
                          filter: showDecryptPrivateKey ? 'none' : 'blur(2px)',
                          userSelect: showDecryptPrivateKey ? 'text' : 'none'
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDecryptPrivateKey(!showDecryptPrivateKey)}
                      >
                        {showDecryptPrivateKey ? (
                          <><EyeOff className="w-4 h-4 mr-1" />Hide</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-1" />Show</>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enter your private key to decrypt the secure file. This key should have been provided to you when your digital signature was generated.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={decryptSecureFile}
                  disabled={decryptingSecureFile || !secureFileContent || !manualPrivateKey.trim()}
                  className="w-full"
                >
                  {decryptingSecureFile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Decrypting...
                    </>
                  ) : (
                    'Decrypt Secure File'
                  )}
                </Button>

                {decryptedSecureContent && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800">File Decrypted Successfully!</h4>
                      <div className="text-sm text-green-700 mt-2">
                        {(() => {
                          let data;
                          if (decryptedSecureContent.success && decryptedSecureContent.data) {
                            data = decryptedSecureContent.data;
                          } else if (decryptedSecureContent.data) {
                            data = decryptedSecureContent.data;
                          } else {
                            data = decryptedSecureContent;
                          }
                          
                          // Handle nested data structure - the actual content might be in data.data
                          if (data && data.data) {
                            data = data.data;
                          }
                          
                          console.log('Modal - Final data structure:', data);
                          console.log('Modal - Data keys:', Object.keys(data || {}));
                          console.log('Modal - Student info:', data?.student);
                          console.log('Modal - Academic info:', data?.academicInfo);
                          console.log('Modal - Summary:', data?.summary);
                          console.log('Modal - Results:', data?.results);
                          
                          if (data?.student && data?.academicInfo) {
                            // New PDF format
                            return (
                              <>
                                <p><strong>Student:</strong> {data.student.name || 'N/A'}</p>
                                <p><strong>Email:</strong> {data.student.email || 'N/A'}</p>
                                <p><strong>Department:</strong> {data.student.department || 'N/A'}</p>
                                <p><strong>Total Results:</strong> {data.academicInfo?.totalResults || 'N/A'}</p>
                                <p><strong>Download Date:</strong> {new Date(data.academicInfo?.downloadDate || '').toLocaleString()}</p>
                                <p><strong>Academic Year:</strong> {data.academicInfo?.year || 'N/A'}</p>
                                <p><strong>Semester:</strong> {data.academicInfo?.semester || 'N/A'}</p>
                              </>
                            );
                          } else if (data?.metadata) {
                            // Old secure file format
                            return (
                              <>
                                <p><strong>Student:</strong> {data.metadata.studentName}</p>
                                <p><strong>Email:</strong> {data.metadata.studentEmail}</p>
                                <p><strong>Total Results:</strong> {data.metadata.totalResults}</p>
                                <p><strong>Download Date:</strong> {new Date(data.metadata.downloadDate).toLocaleString()}</p>
                                <p><strong>Academic Year:</strong> {data.metadata.academicYear}</p>
                                <p><strong>Semester:</strong> {data.metadata.semester}</p>
                              </>
                            );
                          } else {
                            return <p>Data structure not recognized</p>;
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadDecryptedSecurePDF}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        onClick={generatePDFFromContent}
                        variant="outline"
                        className="flex-1"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Generate PDF
                      </Button>
                    </div>

                    <div>
                      <Label>Decrypted Content Preview</Label>
                      <Textarea
                        value={
                          (() => {
                            let data;
                            if (decryptedSecureContent.success && decryptedSecureContent.data) {
                              data = decryptedSecureContent.data;
                            } else if (decryptedSecureContent.data) {
                              data = decryptedSecureContent.data;
                            } else {
                              data = decryptedSecureContent;
                            }
                            
                            // Handle nested data structure - the actual content might be in data.data
                            if (data && data.data) {
                              data = data.data;
                            }
                            
                            console.log('Preview - Final data structure:', data);
                            
                            // Show the actual content, not just metadata
                            return data?.csvData || JSON.stringify(data, null, 2);
                          })()
                        }
                        readOnly
                        className="font-mono text-xs"
                        rows={10}
                      />
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Password Verification Dialog */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Enter Your Password</span>
                </DialogTitle>
                <DialogDescription>
                  Enter your password to view your private key
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                </div>
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={isPasswordLoading}
                    className="flex-1"
                  >
                    {isPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify Password'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setPassword('');
                      setPasswordError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Password Dialog */}
          <Dialog open={isCreatePasswordDialogOpen} onOpenChange={setIsCreatePasswordDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Create Your Password</span>
                </DialogTitle>
                <DialogDescription>
                  Create a password to protect your private key. This password will be stored securely.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password (min 6 characters)"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreatePassword()}
                  />
                </div>
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreatePassword}
                    disabled={isPasswordLoading}
                    className="flex-1"
                  >
                    {isPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Password'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatePasswordDialogOpen(false);
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setPasswordError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Student Actions */}
          {user.role === "Student" && filteredResults.length > 0 && (
            <div className="flex gap-2 mb-6">
              <Button onClick={handlePrintResults} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4 mr-2" /> Print Transcript
              </Button>
              <Button 
                onClick={handleDownloadResults} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Secure PDF
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsSecureDecryptDialogOpen(true)}>
                <Key className="h-4 w-4 mr-2" /> Decrypt Secure File
              </Button>
              <Button variant="outline" onClick={handleShowKeyClick}>
                <Key className="h-4 w-4 mr-2" /> Show Private Key
              </Button>
            </div>
          )}

          {/* Display Private Key After Password Verification */}
          {user.role === "Student" && showManualPrivateKey && manualPrivateKey && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Your Private Key (Password Protected)</span>
                </CardTitle>
                <CardDescription>
                  Your private key is now visible after password verification. Keep it secure and don't share it with anyone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Password Verified - Key Visible
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowManualPrivateKey(false);
                        setManualPrivateKey('');
                      }}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide Key
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Your Private Key (Keep Secure)</Label>
                    <Textarea
                      value={manualPrivateKey}
                      readOnly
                      className="font-mono text-xs bg-gray-50"
                      rows={8}
                    />
                    <p className="text-xs text-gray-600">
                      Use this private key to decrypt files that were encrypted with your public key. 
                      Never share this key with anyone. The key will be hidden when you refresh the page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </CardContent>
      </Card>

      {/* Upload Private Key Verification Dialog */}
      {isUploadPrivateKeyDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Verify Private Key</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsUploadPrivateKeyDialogOpen(false)
                    setUploadPrivateKey("")
                    setPendingCourseForUpload(null)
                    setUploadPrivateKeyError("")
                  }}
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Enter your assigned private key to access the upload functionality. 
                {uploadPrivateKey && showUploadPrivateKey && (
                  <span className="text-green-600 font-medium"> Your private key has been auto-filled from your verified session.</span>
                )}
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="uploadPrivateKey">Private Key</Label>
                  <div className="relative">
                    <Textarea
                      id="uploadPrivateKey"
                      value={uploadPrivateKey}
                      onChange={(e) => setUploadPrivateKey(e.target.value)}
                      placeholder="Enter your assigned private key"
                      className={`font-mono text-xs ${uploadPrivateKeyError ? "border-red-500" : ""}`}
                      rows={6}
                      style={{
                        filter: showUploadPrivateKey ? 'none' : 'blur(3px)',
                        userSelect: showUploadPrivateKey ? 'text' : 'none'
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setShowUploadPrivateKey(!showUploadPrivateKey)}
                    >
                      {showUploadPrivateKey ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  {uploadPrivateKeyError && (
                    <p className="text-red-500 text-sm mt-1">{uploadPrivateKeyError}</p>
                  )}
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Your assigned private key is required to verify your identity before uploading results. 
                    This ensures only authorized lecturers can submit academic results.
                    {uploadPrivateKey && showUploadPrivateKey && (
                      <span className="block mt-2 text-green-700">
                        <strong>✓ Auto-filled:</strong> Your private key has been automatically filled from your previously verified session.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsUploadPrivateKeyDialogOpen(false)
                      setUploadPrivateKey("")
                      setPendingCourseForUpload(null)
                      setUploadPrivateKeyError("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUploadPrivateKeySubmit}
                    disabled={isUploadPrivateKeyLoading}
                  >
                    {isUploadPrivateKeyLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Open Upload'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Private Key Verification Dialog */}
      {isFacultyPrivateKeyDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Verify Private Key for Action</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsFacultyPrivateKeyDialogOpen(false)
                    setFacultyPrivateKey("")
                    setPendingFacultyAction(null)
                    setFacultyPrivateKeyError("")
                  }}
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Enter your assigned private key to {pendingFacultyAction === "add_result" ? "add a new result" : "perform this action"}.
                {facultyPrivateKey && showFacultyPrivateKey && (
                  <span className="text-green-600 font-medium"> Your private key has been auto-filled from your verified session.</span>
                )}
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="facultyPrivateKey">Private Key</Label>
                  <div className="relative">
                    <Textarea
                      id="facultyPrivateKey"
                      value={facultyPrivateKey}
                      onChange={(e) => setFacultyPrivateKey(e.target.value)}
                      placeholder="Enter your assigned private key"
                      className={`font-mono text-xs ${facultyPrivateKeyError ? "border-red-500" : ""}`}
                      rows={6}
                      style={{
                        filter: showFacultyPrivateKey ? 'none' : 'blur(3px)',
                        userSelect: showFacultyPrivateKey ? 'text' : 'none'
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setShowFacultyPrivateKey(!showFacultyPrivateKey)}
                    >
                      {showFacultyPrivateKey ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  {facultyPrivateKeyError && (
                    <p className="text-red-500 text-sm mt-1">{facultyPrivateKeyError}</p>
                  )}
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Your assigned private key is required to verify your identity before {pendingFacultyAction === "add_result" ? "adding results" : "performing actions"}. 
                    This ensures only authorized faculty can perform these operations.
                    {facultyPrivateKey && showFacultyPrivateKey && (
                      <span className="block mt-2 text-green-700">
                        <strong>✓ Auto-filled:</strong> Your private key has been automatically filled from your previously verified session.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFacultyPrivateKeyDialogOpen(false)
                      setFacultyPrivateKey("")
                      setPendingFacultyAction(null)
                      setFacultyPrivateKeyError("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={verifyFacultyPrivateKey}
                    disabled={isFacultyPrivateKeyLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isFacultyPrivateKeyLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Proceed'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
