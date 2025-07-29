'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: number
  course_code: string
  course_title: string
  department: string
  credits: number
  semester: string
  academic_year: string
  lecturer_id?: number
  lecturer_name?: string
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: number
}

interface User {
  id: number
  email: string
  name: string
  role: string
  department: string
}

interface CourseManagementProps {
  user: User
}

export function CourseManagement({ user }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [lecturers, setLecturers] = useState<Array<{id: number, name: string, department: string}>>([])
  const [filteredLecturers, setFilteredLecturers] = useState<Array<{id: number, name: string, department: string}>>([])

  // Form state for create/edit
  const [formData, setFormData] = useState({
    course_code: '',
    course_title: '',
    department: '',
    credits: '',
    semester: '',
    academic_year: '',
    lecturer_id: '',
    capacity: '',
    is_active: true,
  })

  const departments = ['Law', 'Engineering', 'Medicine', 'Arts', 'Science', 'Business', 'Education']
  const semesters = ['First', 'Second', 'Summer']
  const academicYears = ['2023/2024', '2024/2025', '2025/2026']

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Insufficient permissions to view courses')
        }
        throw new Error('Failed to load courses')
      }

      const data = await response.json()
      setCourses(data.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchLecturers()
  }, [])

  // Fetch lecturers
  const fetchLecturers = async () => {
    try {
      const response = await fetch('/api/users/lecturers')
      if (response.ok) {
        const data = await response.json()
        setLecturers(data.lecturers || [])
      }
    } catch (error) {
      console.error('Failed to fetch lecturers:', error)
    }
  }

  // Filter lecturers based on selected department
  useEffect(() => {
    if (formData.department) {
      const filtered = lecturers.filter(lecturer => lecturer.department === formData.department)
      setFilteredLecturers(filtered)
    } else {
      setFilteredLecturers([])
    }
  }, [formData.department, lecturers])

  // Get lecturer name by ID
  const getLecturerName = (lecturerId: number | null) => {
    if (!lecturerId) return null
    const lecturer = lecturers.find(l => l.id === lecturerId)
    return lecturer ? lecturer.name : null
  }

  // Create course
  const handleCreateCourse = async () => {
    try {
      console.log('Creating course with data:', formData)
      
      // Validate required fields
      if (!formData.course_code || !formData.course_title || !formData.department || 
          !formData.credits || !formData.semester || !formData.academic_year || !formData.capacity) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to create course')
      }

      const data = await response.json()
      console.log('Created course:', data)
      setCourses(prev => [...prev, data.course])
      // Refresh the courses list to ensure persistence
      await fetchCourses()
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Course created successfully')
    } catch (err) {
      console.error('Create course error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create course')
    }
  }

  // Update course
  const handleUpdateCourse = async () => {
    if (!selectedCourse) return

    try {
      console.log('Updating course with data:', formData)
      console.log('Selected course ID:', selectedCourse.id)
      
      // Validate required fields
      if (!formData.course_code || !formData.course_title || !formData.department || 
          !formData.credits || !formData.semester || !formData.academic_year || !formData.capacity) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Update response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update API Error:', errorData)
        throw new Error(errorData.error || 'Failed to update course')
      }

      const data = await response.json()
      console.log('Updated course:', data)
      // Refresh the courses list to ensure persistence
      await fetchCourses()
      setIsEditDialogOpen(false)
      setSelectedCourse(null)
      resetForm()
      toast.success('Course updated successfully')
    } catch (err) {
      console.error('Update course error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update course')
    }
  }

  // Delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      const response = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete course')
      }

      // Refresh the courses list to ensure persistence
      await fetchCourses()
      setCourseToDelete(null)
      toast.success('Course deleted successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      course_code: '',
      course_title: '',
      department: '',
      credits: '',
      semester: '',
      academic_year: '',
      lecturer_id: '',
      capacity: '',
      is_active: true,
    })
  }

  // Open edit dialog
  const openEditDialog = (course: Course) => {
    setSelectedCourse(course)
    setFormData({
      course_code: course.course_code,
      course_title: course.course_title,
      department: course.department,
      credits: course.credits.toString(),
      semester: course.semester,
      academic_year: course.academic_year,
      lecturer_id: course.lecturer_id?.toString() || '',
      capacity: course.capacity?.toString() || '',
      is_active: course.is_active,
    })
    setIsEditDialogOpen(true)
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || course.department === departmentFilter
    const matchesSemester = !semesterFilter || semesterFilter === 'all' || course.semester === semesterFilter
    
    return matchesSearch && matchesDepartment && matchesSemester
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Courses</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchCourses} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">
            Manage academic courses and their details
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to the academic system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="course_code">Course Code *</Label>
                  <Input
                    id="course_code"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="e.g., LAW101"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course_title">Course Title *</Label>
                  <Input
                    id="course_title"
                    value={formData.course_title}
                    onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                    placeholder="e.g., Introduction to Law"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credits">Credits *</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    placeholder="3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData({ ...formData, semester: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((sem) => (
                        <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Select
                  value={formData.academic_year}
                  onValueChange={(value) => setFormData({ ...formData, academic_year: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lecturer">Department Lecturer</Label>
                <Select 
                  value={formData.lecturer_id} 
                  onValueChange={(value) => setFormData({ ...formData, lecturer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lecturer assigned</SelectItem>
                    {filteredLecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity">Class Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Course Status</Label>
                <Select
                  value={formData.is_active ? "active" : "inactive"}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse}>
                Create Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department-filter">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semester-filter">Semester</Label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Courses ({filteredCourses.length})</CardTitle>
          <CardDescription>
            All courses in the academic system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No courses found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {course.course_code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{course.course_title}</TableCell>
                    <TableCell>{course.department}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>{course.capacity || '-'}</TableCell>
                    <TableCell>{course.lecturer_name || 'Not assigned'}</TableCell>
                    <TableCell>{course.semester}</TableCell>
                    <TableCell>{course.academic_year}</TableCell>
                    <TableCell>
                      <Badge variant={course.is_active ? "default" : "secondary"}>
                        {course.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCourseToDelete(course)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{course.course_title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setCourseToDelete(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteCourse}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_course_code">Course Code *</Label>
                <Input
                  id="edit_course_code"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  placeholder="e.g., LAW101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_course_title">Course Title *</Label>
                <Input
                  id="edit_course_title"
                  value={formData.course_title}
                  onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                  placeholder="e.g., Introduction to Law"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_credits">Credits *</Label>
                <Input
                  id="edit_credits"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_semester">Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_academic_year">Academic Year *</Label>
              <Select
                value={formData.academic_year}
                onValueChange={(value) => setFormData({ ...formData, academic_year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_lecturer">Department Lecturer</Label>
              <Select 
                value={formData.lecturer_id} 
                onValueChange={(value) => setFormData({ ...formData, lecturer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No lecturer assigned</SelectItem>
                  {filteredLecturers.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                      {lecturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_capacity">Class Capacity</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                max="200"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_status">Course Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse}>
              Update Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 