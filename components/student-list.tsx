"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Users, GraduationCap, Mail, Phone } from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  matric_number?: string
  department: string
  level?: string
  phone?: string
  courses_enrolled?: string[]
}

interface StudentListProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export default function StudentList({ user }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.matric_number && student.matric_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchTerm, students])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading students for faculty user:", user.id)
      
      const response = await fetch('/api/users?role=Student', {
        credentials: "include",
      })
      
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Response data:", data)
        
        if (data.success && data.data) {
          console.log("Setting students:", data.data.length, "students")
          setStudents(data.data)
        } else {
          console.error("API returned success=false or no data:", data)
          setError(data.error || "Failed to load students")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Response not ok:", response.status, errorData)
        setError(errorData.error || `Failed to load students (${response.status})`)
      }
    } catch (error) {
      console.error("Failed to load students:", error)
      setError("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getLevelBadge = (level?: string) => {
    const colors = {
      "100": "bg-blue-100 text-blue-800 border-blue-200",
      "200": "bg-green-100 text-green-800 border-green-200",
      "300": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "400": "bg-purple-100 text-purple-800 border-purple-200",
      "500": "bg-red-100 text-red-800 border-red-200",
    }
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student List
          </CardTitle>
          <CardDescription>Loading students...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Loading students...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student List
          </CardTitle>
          <CardDescription>Error loading students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button onClick={loadStudents} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student List
        </CardTitle>
        <CardDescription>
          Manage and view students in your department ({filteredStudents.length} students)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, matric number, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={loadStudents}>
              Refresh
            </Button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm">
                {searchTerm ? "Try adjusting your search terms" : "No students are currently enrolled"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Matric Number</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                                             <TableCell>
                         <code className="text-sm bg-muted px-2 py-1 rounded">
                           {student.matric_number || "N/A"}
                         </code>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {student.department}
                        </div>
                      </TableCell>
                                             <TableCell>
                         <Badge className={getLevelBadge(student.level)}>
                           Level {student.level || "N/A"}
                         </Badge>
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {student.email}
                          {student.phone && (
                            <>
                              <Phone className="h-3 w-3 ml-2" />
                              {student.phone}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 