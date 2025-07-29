"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CourseStudents } from "@/components/course-students"

interface Course {
  id: number
  course_code: string
  course_title: string
  department: string
  credits: number
  semester: string
  academic_year: string
  lecturer_id: number | null
  lecturer_name: string | null
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LecturerCoursesProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
    lecturer_id?: string | null
  }
}

export function LecturerCourses({ user }: LecturerCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [user.id])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch courses")
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('Courses API response:', data)
        console.log('User ID:', user.id)
        console.log('All courses:', data.data)
        
        // Filter courses assigned to this lecturer
        const lecturerCourses = data.data.filter((course: Course) => {
          console.log(`Course ${course.course_code}: lecturer_id=${course.lecturer_id}, user.id=${user.id}, match=${course.lecturer_id === user.id}`)
          return course.lecturer_id === user.id
        })
        
        console.log('Filtered lecturer courses:', lecturerCourses)
        setCourses(lecturerCourses)
      } else {
        console.log('API error:', data.error)
        setError(data.error || "Failed to load courses")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to load courses")
      toast({
        title: "Error",
        description: "Failed to load your assigned courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getSemesterColor = (semester: string) => {
    switch (semester.toLowerCase()) {
      case "first":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "second":
        return "bg-green-100 text-green-800 border-green-200"
      case "summer":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course)
    setIsStudentsDialogOpen(true)
  }

  const handleCloseStudentsDialog = () => {
    setIsStudentsDialogOpen(false)
    setSelectedCourse(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading courses...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCourses} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Courses
          </CardTitle>
          <CardDescription>
            Courses assigned to you for teaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Assigned</h3>
              <p className="text-gray-600 mb-4">
                You haven't been assigned any courses yet. Contact your department administrator.
              </p>
              <Button onClick={fetchCourses} variant="outline">
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                  onClick={() => handleCourseClick(course)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {course.course_code} - {course.course_title}
                          </h3>
                          {getStatusBadge(course.is_active)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Capacity: {course.capacity} students</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{course.semester} Semester</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{course.academic_year}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getSemesterColor(course.semester)}>
                            {course.semester} Semester
                          </Badge>
                          <Badge variant="outline">
                            {course.credits} Credits
                          </Badge>
                          <Badge variant="outline">
                            {course.department}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>Click to view students</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-600">
                    {courses.filter(c => c.is_active).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {courses.reduce((sum, course) => sum + course.capacity, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Students Dialog */}
      {selectedCourse && (
        <CourseStudents
          courseId={selectedCourse.id}
          courseCode={selectedCourse.course_code}
          courseTitle={selectedCourse.course_title}
          isOpen={isStudentsDialogOpen}
          onClose={handleCloseStudentsDialog}
        />
      )}
    </div>
  )
} 