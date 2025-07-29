"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, GraduationCap, Mail, Calendar, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

interface CourseStudent {
  id: number
  student_id: number
  student_name: string
  student_email: string
  student_matric_number: string
  student_level: string
  course_id: number
  course_code: string
  course_title: string
  semester: string
  session: string
  status: "Pending" | "Approved" | "Rejected" | "Dropped"
  registration_date: string
  approved_by?: number
  approved_at?: string
  notes?: string
}

interface CourseStudentsProps {
  courseId: number
  courseCode: string
  courseTitle: string
  isOpen: boolean
  onClose: () => void
}

export function CourseStudents({ courseId, courseCode, courseTitle, isOpen, onClose }: CourseStudentsProps) {
  const [students, setStudents] = useState<CourseStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && courseId) {
      fetchStudents()
    }
  }, [isOpen, courseId])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch(`/api/courses/${courseId}/students`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch students")
      }

      const data = await response.json()
      
      if (data.success) {
        setStudents(data.data || [])
      } else {
        setError(data.error || "Failed to load students")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      setError("Failed to load students")
      toast.error("Failed to load students for this course")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "Rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case "Dropped":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Dropped
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students - {courseCode}: {courseTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading students...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchStudents} variant="outline">
                Try Again
              </Button>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Registered</h3>
              <p className="text-gray-600">
                No students have registered for this course yet.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-xl font-bold text-gray-900">{students.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {student.student_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{student.student_matric_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Level {student.student_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(student.registration_date).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 