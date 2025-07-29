"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  GraduationCap,
  Download,
  Printer
} from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: number
  course_code: string
  course_title: string
  department: string
  credits: number
  semester: string
  academic_year: string
  capacity: number
  lecturer_id: number
  lecturer_name: string
  is_active: boolean
  created_by: number
  created_at: string
  updated_at: string
}

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

interface CourseRegistrationProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export function CourseRegistration({ user }: CourseRegistrationProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<CourseRegistration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    student_id: "",
    course_id: "",
    semester: "",
    session: "",
    notes: "",
  })

  // Course selection state for students
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set())
  const [totalCredits, setTotalCredits] = useState(0)
  const MIN_CREDITS = 15
  const MAX_CREDITS = 24

  // Reset form data when dialog opens/closes
  const resetForm = () => {
    setFormData({
      student_id: "",
      course_id: "",
      semester: "",
      session: "",
      notes: "",
    })
    setSelectedRegistration(null)
    setError("")
  }

  // Handle course selection and auto-fill other fields
  const handleCourseSelection = (courseId: string) => {
    const selectedCourse = courses.find(course => course.id.toString() === courseId)
    
    if (selectedCourse) {
      setFormData({
        ...formData,
        course_id: courseId,
        semester: selectedCourse.semester,
        session: selectedCourse.academic_year,
      })
    } else {
      setFormData({
        ...formData,
        course_id: courseId,
        semester: "",
        session: "",
      })
    }
  }

  // Handle course selection for students (multiple courses)
  const handleStudentCourseSelection = (courseId: number) => {
    const course = courses.find(c => c.id === courseId)
    if (!course) return

    const newSelectedCourses = new Set(selectedCourses)
    const currentCredits = Array.from(selectedCourses).reduce((total, id) => {
      const selectedCourse = courses.find(c => c.id === id)
      return total + (selectedCourse?.credits || 0)
    }, 0)

    if (newSelectedCourses.has(courseId)) {
      // Remove course
      newSelectedCourses.delete(courseId)
    } else {
      // Add course if it doesn't exceed credit limit
      if (currentCredits + course.credits <= MAX_CREDITS) {
        newSelectedCourses.add(courseId)
      } else {
        toast.error(`Cannot add ${course.course_code}. Would exceed ${MAX_CREDITS} credit limit.`)
        return
      }
    }

    setSelectedCourses(newSelectedCourses)
    
    // Calculate total credits
    const newTotalCredits = Array.from(newSelectedCourses).reduce((total, id) => {
      const selectedCourse = courses.find(c => c.id === id)
      return total + (selectedCourse?.credits || 0)
    }, 0)
    setTotalCredits(newTotalCredits)
  }

  // Register all selected courses
  const handleBulkRegistration = async () => {
    if (selectedCourses.size === 0) {
      toast.error("Please select at least one course")
      return
    }

    if (totalCredits < MIN_CREDITS) {
      toast.error(`You must select at least ${MIN_CREDITS} credits to register`)
      return
    }

    if (totalCredits > MAX_CREDITS) {
      toast.error(`You cannot register for more than ${MAX_CREDITS} credits`)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const registrationPromises = Array.from(selectedCourses).map(async (courseId) => {
        const course = courses.find(c => c.id === courseId)
        if (!course) return null

        const registrationData = {
          student_id: user.id,
          course_id: courseId,
                  semester: course.semester,
        session: course.academic_year,
          notes: "Bulk registration",
        }

        const response = await fetch('/api/course-registrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        })

        if (!response.ok) {
          throw new Error(`Failed to register for ${course.course_code}`)
        }

        return response.json()
      })

      await Promise.all(registrationPromises)
      
      toast.success(`Successfully registered for ${selectedCourses.size} course(s)`)
      setSelectedCourses(new Set())
      setTotalCredits(0)
      loadData() // Refresh the data
      setIsSubmitting(false)
    } catch (error) {
      console.error("Bulk registration error:", error)
      setError("Failed to register for some courses")
      toast.error("Some registrations failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Load courses and registrations
  useEffect(() => {
    loadData()
  }, [])

  // Filter out courses that the student has already registered for
  useEffect(() => {
    if (user.role === "Student") {
      // Get course IDs that the student has already registered for
      const registeredCourseIds = registrations.map(reg => reg.course_id)
      
      // Filter out courses that are already registered
      const availableCourses = courses.filter(course => !registeredCourseIds.includes(course.id))
      
      setFilteredCourses(availableCourses)
    } else {
      // For non-students, show all courses
      setFilteredCourses(courses)
    }
  }, [courses, registrations, user.role])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("Loading data for user:", user)
      
      // Load courses based on user role
      let coursesUrl = '/api/courses'
      if (user.role === "Student") {
        // Students can only see courses from their department
        coursesUrl += `?department=${user.department}`
      }
      
      console.log("Fetching courses from:", coursesUrl)
      const coursesResponse = await fetch(coursesUrl)
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        const availableCourses = coursesData.data || []
        console.log("Courses loaded:", availableCourses.length, "courses")
        console.log("Available courses:", availableCourses)
        setCourses(availableCourses)
      } else {
        console.error("Failed to load courses:", coursesResponse.status)
      }

      // Load registrations based on user role
      let registrationsUrl = '/api/course-registrations'
      if (user.role === "Student") {
        registrationsUrl += `?student_id=${user.id}`
      } else if (user.role === "Faculty") {
        registrationsUrl += `?department=${user.department}`
      }

      const registrationsResponse = await fetch(registrationsUrl)
      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json()
        setRegistrations(registrationsData.data || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Failed to load course registration data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    console.log("User role:", user.role)
    console.log("User ID:", user.id)
    
    setIsSubmitting(true)
    setError("")

    try {
      const registrationData = {
        student_id: user.role === "Student" ? user.id : parseInt(formData.student_id),
        course_id: parseInt(formData.course_id),
        semester: formData.semester,
        session: formData.session,
        notes: formData.notes || null,
      }
      
      console.log("Registration data to send:", registrationData)

      const url = selectedRegistration ? `/api/course-registrations/${selectedRegistration.id}` : '/api/course-registrations'
      const method = selectedRegistration ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to save registration")
        return
      }

      toast.success(selectedRegistration ? "Registration updated successfully" : "Registration created successfully")
      
      // Reset form
      setFormData({
        student_id: "",
        course_id: "",
        semester: "",
        session: "",
        notes: "",
      })
      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      setSelectedRegistration(null)
      
      // Reload data
      loadData()
    } catch (error) {
      console.error("Failed to save registration:", error)
      setError("Failed to save registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this registration?")) {
      return
    }

    try {
      const response = await fetch(`/api/course-registrations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to delete registration")
        return
      }

      toast.success("Registration deleted successfully")
      loadData()
    } catch (error) {
      console.error("Failed to delete registration:", error)
      setError("Failed to delete registration")
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/course-registrations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved_by: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to approve registration")
        return
      }

      toast.success("Registration approved successfully")
      loadData()
    } catch (error) {
      console.error("Failed to approve registration:", error)
      setError("Failed to approve registration")
    }
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/course-registrations/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejected_by: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to reject registration")
        return
      }

      toast.success("Registration rejected successfully")
      loadData()
    } catch (error) {
      console.error("Failed to reject registration:", error)
      setError("Failed to reject registration")
    }
  }

  const openEditDialog = (registration: CourseRegistration) => {
    setSelectedRegistration(registration)
    setFormData({
      student_id: registration.student_id.toString(),
      course_id: registration.course_id.toString(),
      semester: registration.semester,
      session: registration.session,
      notes: registration.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Approved": "bg-green-100 text-green-800 border-green-200",
      "Rejected": "bg-red-100 text-red-800 border-red-200",
      "Dropped": "bg-gray-100 text-gray-800 border-gray-200",
    }
    return <Badge className={colors[status as keyof typeof colors] || colors.Pending}>{status}</Badge>
  }

  const handlePrintRegistration = () => {
    if (registrations.length === 0) {
      toast.error("No registrations to print")
      return
    }

    const totalCredits = registrations.reduce((sum, reg) => sum + reg.credits, 0)
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Course Registration - ${user.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .university { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .student-info { margin-bottom: 30px; }
          .student-info div { margin: 5px 0; }
          .label { font-weight: bold; color: #374151; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .table th { background-color: #f3f4f6; font-weight: bold; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
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
          <div style="font-size: 16px; color: #6b7280;">Course Registration Report</div>
        </div>
        
        <div class="student-info">
          <div><span class="label">Student Name:</span> ${user.name}</div>
          <div><span class="label">Email:</span> ${user.email}</div>
          <div><span class="label">Faculty:</span> ${user.department}</div>
          <div><span class="label">Department:</span> ${user.department}</div>
          <div><span class="label">Academic Year:</span> ${registrations[0]?.session || 'N/A'}</div>
          <div><span class="label">Semester:</span> ${registrations[0]?.semester || 'N/A'}</div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.map(reg => `
              <tr>
                <td>${reg.course_code}</td>
                <td>${reg.course_title}</td>
                <td>${reg.credits}</td>
                <td>${reg.status}</td>
                <td>${new Date(reg.registration_date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <div>Total Courses Registered: ${registrations.length}</div>
          <div>Total Credits: ${totalCredits}</div>
        </div>
        
        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>This is an official document from Technological University</div>
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print / Save as PDF</button>
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
      toast.error("Please allow pop-ups to print your registration")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading course registrations...</span>
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
            <span>Course Registration Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Available Courses Section - Show for Students */}
          {user.role === "Student" && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Available Courses in {user.department}</span>
                    </CardTitle>
                    <CardDescription>
                      Select courses to register for (Min {MIN_CREDITS} credits, Max {MAX_CREDITS} credits per semester)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">Selected Credits:</span>{" "}
                      <span className={`font-bold ${
                        totalCredits < MIN_CREDITS ? 'text-orange-600' : 
                        totalCredits > MAX_CREDITS ? 'text-red-600' : 
                        'text-green-600'
                      }`}>
                        {totalCredits}/{MAX_CREDITS}
                      </span>
                    </div>
                    {selectedCourses.size > 0 && (
                      <Button 
                        onClick={handleBulkRegistration}
                        disabled={isSubmitting || totalCredits < MIN_CREDITS || totalCredits > MAX_CREDITS}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Registering...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Register {selectedCourses.size} Course{selectedCourses.size > 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => {
                      const isSelected = selectedCourses.has(course.id)
                      const canSelect = totalCredits + course.credits <= MAX_CREDITS || isSelected
                      
                      return (
                        <div 
                          key={course.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-green-500 bg-green-50' 
                              : canSelect 
                                ? 'hover:bg-gray-50' 
                                : 'opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => canSelect && handleStudentCourseSelection(course.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <h3 className="font-semibold text-sm">{course.course_code}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {course.credits} credits
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{course.course_title}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {course.semester} Semester • {course.academic_year}
                          </p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Lecturer: {course.lecturer_name || 'Not assigned'}</span>
                            <span>0/{course.capacity} enrolled</span>
                          </div>
                          {!canSelect && !isSelected && (
                            <div className="mt-2 text-xs text-red-600">
                              Would exceed {MAX_CREDITS} credit limit
                            </div>
                          )}
                          {totalCredits < MIN_CREDITS && totalCredits > 0 && (
                            <div className="mt-2 text-xs text-orange-600">
                              Need at least {MIN_CREDITS} credits to register
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {user.role === "Student" && registrations.length > 0 
                        ? "All available courses have been registered" 
                        : "No courses available"
                      }
                    </p>
                    <p className="text-sm">
                      {user.role === "Student" && registrations.length > 0
                        ? "You have registered for all available courses in your department"
                        : `There are currently no courses available in your department (${user.department})`
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Registrations Table */}
          <div className="border rounded-lg">
            {/* Print/Download Button for Students */}
            {user.role === "Student" && registrations.length > 0 && (
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Your Registered Courses</h3>
                    <p className="text-sm text-muted-foreground">
                      Total Credits: {registrations.reduce((sum, reg) => sum + reg.credits, 0)} | 
                      Total Courses: {registrations.length}
                    </p>
                  </div>
                  <Button
                    onClick={handlePrintRegistration}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Registration
                  </Button>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  {(user.role === "Administrator" || user.role === "Faculty") && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === "Student" ? 6 : 7} className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No registrations found</p>
                      <p className="text-sm">No course registrations available</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registration.student_name}</p>
                          <p className="text-sm text-muted-foreground">{registration.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registration.course_code}</p>
                          <p className="text-sm text-muted-foreground">{registration.course_title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium">
                          {registration.credits} Credits
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{registration.semester}</p>
                          <p className="text-sm text-muted-foreground">{registration.session}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(registration.registration_date).toLocaleDateString()}
                      </TableCell>
                      {(user.role === "Administrator" || user.role === "Faculty") && (
                        <TableCell>
                          <div className="flex gap-2">
                            {registration.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(registration.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(registration.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(registration)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(registration.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {user.role === "Student" ? "Register for Course" : "Add Course Registration"}
            </DialogTitle>
            <DialogDescription>
              {user.role === "Student" 
                ? `Register for a course in your department (${user.department})`
                : "Register a student for a course"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Only show Student ID field for Faculty/Admin */}
            {(user.role === "Administrator" || user.role === "Faculty") && (
              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="course_id">Course</Label>
              <Select
                value={formData.course_id}
                onValueChange={handleCourseSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.length === 0 ? (
                    <SelectItem value="no-courses" disabled>
                      No courses available for your department
                    </SelectItem>
                  ) : (
                    filteredCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.course_code} - {course.course_title} ({course.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="semester" className="flex items-center gap-2">
                  Semester
                  {formData.course_id && (
                    <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                  )}
                </Label>
                <Input
                  id="semester"
                  value={formData.semester}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Auto-filled from course"
                />
              </div>
              <div>
                <Label htmlFor="session" className="flex items-center gap-2">
                  Session
                  {formData.course_id && (
                    <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
                  )}
                </Label>
                <Input
                  id="session"
                  value={formData.session}
                  readOnly
                  className="bg-gray-50"
                  placeholder="Auto-filled from course"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (user.role === "Student" ? "Register for Course" : "Save Registration")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {user.role === "Student" ? "Update Course Registration" : "Edit Course Registration"}
            </DialogTitle>
            <DialogDescription>
              {user.role === "Student" 
                ? "Update your course registration details"
                : "Update registration details"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Only show Student field for Faculty/Admin */}
            {(user.role === "Administrator" || user.role === "Faculty") && (
              <div>
                <Label htmlFor="edit_student">Student</Label>
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="font-medium">{selectedRegistration?.student_name || `Student ${formData.student_id}`}</div>
                  {selectedRegistration?.student_email && (
                    <div className="text-sm text-gray-500">{selectedRegistration.student_email}</div>
                  )}
                </div>
                <input
                  type="hidden"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit_course_id">Course</Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.length === 0 ? (
                    <SelectItem value="no-courses" disabled>
                      No courses available for your department
                    </SelectItem>
                  ) : (
                    filteredCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.course_code} - {course.course_title} ({course.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_semester">Semester</Label>
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
                <Label htmlFor="edit_session">Session</Label>
                <Input
                  id="edit_session"
                  placeholder="e.g., 2023/2024"
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_notes">Notes (Optional)</Label>
              <Input
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : (user.role === "Student" ? "Update Registration" : "Update Registration")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 