"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Users, AlertCircle, Eye } from "lucide-react"

interface Lecturer {
  id: number
  email: string
  name: string
  role: string
  department: string
  faculty_id: number | null
  lecturer_id: string | null
  created_at: string
  updated_at: string
  last_login: string | null
  is_active: boolean
}

export function DepartmentLecturers({ user }: { user: any }) {
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLecturers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users/lecturers")
      if (!response.ok) {
        throw new Error("Failed to fetch lecturers")
      }
      const result = await response.json()
      if (result.success) {
        setLecturers(result.lecturers || [])
      } else {
        throw new Error(result.error || "Failed to fetch lecturers")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (isActive: boolean, lastLogin: string | null) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    
    if (!lastLogin) {
      return <Badge variant="secondary">Never Logged In</Badge>
    }

    const lastLoginDate = new Date(lastLogin)
    const now = new Date()
    const diffInMinutes = (now.getTime() - lastLoginDate.getTime()) / (1000 * 60)

    if (diffInMinutes < 5) {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>
    } else if (diffInMinutes < 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Recently Active</Badge>
    } else {
      return <Badge variant="outline">Offline</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never"
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  useEffect(() => {
    fetchLecturers()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Lecturers</CardTitle>
          <CardDescription>Loading lecturers...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department Lecturers</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Department Lecturers
            </CardTitle>
            <CardDescription>
              View all lecturers in your department ({user.department})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">{lecturers?.length || 0} lecturers</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!lecturers || lecturers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No lecturers found in your department.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lecturer ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lecturers || []).map((lecturer) => (
                <TableRow key={lecturer.id}>
                  <TableCell className="font-medium">{lecturer.name}</TableCell>
                  <TableCell>{lecturer.email}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {lecturer.lecturer_id || "N/A"}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(lecturer.is_active, lecturer.last_login)}</TableCell>
                  <TableCell>{formatLastLogin(lecturer.last_login)}</TableCell>
                  <TableCell>{formatDate(lecturer.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Read Only
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 