"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Users, AlertCircle, ChevronDown, ChevronRight, Crown, GraduationCap, BookOpen, User } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  email: string
  name: string
  role: string
  department: string
  faculty_id?: number | null
  level?: string | null
  matric_number?: string | null
  lecturer_id?: string | null
  gender?: string | null
  created_at: string
  last_login: string | null
  is_active: boolean
}

interface UserFormData {
  email: string
  name: string
  password: string
  role: string
  department: string
  faculty_id?: number
  is_active?: boolean
  level?: string
  matric_number?: string
  lecturer_id?: string
  gender?: string
}

export function UserManagement({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([])
  const [facultyUsers, setFacultyUsers] = useState<User[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [updateLoading, setUpdateLoading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    password: "",
    role: "Student",
    department: "",
    faculty_id: undefined,
    is_active: true,
    level: "",
    matric_number: ""
  })

  // Store student-specific data when role changes
  const [studentData, setStudentData] = useState({
    level: "",
    matric_number: ""
  })

  // Track if form has been initialized
  const [formInitialized, setFormInitialized] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch users")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchFacultyUsers = async () => {
    try {
      // Fetch both Faculty and Lecturer users
      const facultyResponse = await fetch("/api/users?role=Faculty")
      const lecturerResponse = await fetch("/api/users?role=Lecturer")
      
      let allFacultyUsers: User[] = []
      
      if (facultyResponse.ok) {
        const facultyResult = await facultyResponse.json()
        if (facultyResult.success) {
          allFacultyUsers = [...allFacultyUsers, ...facultyResult.data]
        }
      }
      
      if (lecturerResponse.ok) {
        const lecturerResult = await lecturerResponse.json()
        if (lecturerResult.success) {
          allFacultyUsers = [...allFacultyUsers, ...lecturerResult.data]
        }
      }
      
      setFacultyUsers(allFacultyUsers)
    } catch (err) {
      console.error("Failed to fetch faculty users:", err)
    }
  }

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch("/api/users/online")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setOnlineUsers(new Set(result.data.map((user: any) => user.id)))
        }
      }
    } catch (err) {
      console.error("Failed to fetch online users:", err)
    }
  }

  const isUserOnline = (userId: number) => {
    return onlineUsers.has(userId)
  }

  const resetForm = () => {
    console.log("Resetting form...")
    setFormData({
      email: "",
      name: "",
      password: "",
      role: "Student",
      department: "",
      faculty_id: undefined,
      is_active: true,
      level: "",
      matric_number: "",
      lecturer_id: "",
      gender: ""
    })
    setStudentData({
      level: "",
      matric_number: ""
    })
    setFormInitialized(false)
  }

  useEffect(() => {
    fetchUsers()
    fetchFacultyUsers()
    fetchOnlineUsers()
    
    // Poll for online users every 5 seconds
    const interval = setInterval(() => {
      fetchOnlineUsers()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])



  // Reset form when create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "Student",
        department: "",
        faculty_id: undefined,
        is_active: true,
        level: "",
        matric_number: "",
        lecturer_id: "",
        gender: ""
      })
      setStudentData({
        level: "",
        matric_number: ""
      })
    }
  }, [isCreateDialogOpen])

  const handleCreateUser = async () => {
    try {
      console.log("=== FORM SUBMISSION DEBUG ===")
      console.log("Form data being submitted:", formData)
      console.log("Student data state:", studentData)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`User created successfully and added to ${formData.role}s group`)
        setIsCreateDialogOpen(false)
        resetForm()
        fetchUsers()
        // Auto-expand the group for the newly created user
        setCollapsedGroups(prev => {
          const newSet = new Set(prev)
          newSet.delete(formData.role)
          return newSet
        })
      } else {
        throw new Error(result.error || "Failed to create user")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setUpdateLoading(true)
    
    try {
      // Optimistic update - update the local state immediately
      const updatedUser: User = {
        ...editingUser,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        faculty_id: formData.faculty_id,
        level: formData.level || null,
        matric_number: formData.matric_number || null,
        lecturer_id: formData.lecturer_id || null,
        gender: formData.gender || null,
        is_active: formData.is_active !== undefined ? formData.is_active : editingUser.is_active,
      }

      // Update the users array optimistically
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id ? updatedUser : user
        )
      )

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          department: formData.department,
          faculty_id: formData.faculty_id,
          level: formData.level,
          matric_number: formData.matric_number,
          lecturer_id: formData.lecturer_id,
          gender: formData.gender,
          is_active: formData.is_active,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      const result = await response.json()
      if (result.success) {
        toast.success("User updated successfully")
        setIsEditDialogOpen(false)
        setEditingUser(null)
        resetForm()
        // No need to fetchUsers() since we already updated the state optimistically
      } else {
        throw new Error(result.error || "Failed to update user")
      }
    } catch (err) {
      // Revert optimistic update on error
      fetchUsers()
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setUpdateLoading(false)
    }
  }



  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      const result = await response.json()
      if (result.success) {
        toast.success("User deleted successfully")
        fetchUsers()
      } else {
        throw new Error(result.error || "Failed to delete user")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
      department: user.department,
      faculty_id: user.faculty_id || undefined,
      is_active: user.is_active,
      level: user.level || "",
      matric_number: user.matric_number || "",
      lecturer_id: user.lecturer_id || "",
      gender: user.gender || ""
    })
    // Initialize student data for editing
    setStudentData({
      level: user.level || "",
      matric_number: user.matric_number || ""
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Administrator":
        return "destructive"
      case "Faculty":
        return "default"
      case "Lecturer":
        return "default" // Same as Faculty
      case "Student":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getDepartmentsForFaculty = (facultyId: string | number) => {
    const facultyDepartments: { [key: string]: string[] } = {
      "1": ["English Literature", "History", "Philosophy", "Fine Arts", "Music"],
      "2": ["Business Administration", "Economics", "Accounting", "Finance", "Marketing"],
      "3": ["Education", "Educational Psychology", "Curriculum Studies"],
      "4": ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Computer Engineering"],
      "5": ["Nursing", "Public Health", "Health Administration"],
      "6": ["Law", "Criminal Justice", "International Law"],
      "7": ["Medicine", "Surgery", "Pediatrics", "Psychiatry"],
      "8": ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"],
      "9": ["Psychology", "Sociology", "Political Science", "Anthropology"],
      "10": ["Information Technology", "Software Engineering", "Data Science"],
      "11": ["Veterinary Medicine", "Animal Science"],
      "12": ["Agriculture", "Agricultural Economics", "Crop Science"],
      "13": ["Architecture", "Urban Planning", "Interior Design"],
      "14": ["Dentistry", "Dental Hygiene", "Orthodontics"],
      "15": ["Pharmacy", "Pharmaceutical Sciences", "Clinical Pharmacy"],
      "16": ["Fine Arts", "Graphic Design", "Sculpture", "Painting"],
      "17": ["Music", "Music Education", "Music Performance"],
      "18": ["Theology", "Religious Studies", "Biblical Studies"],
      "19": ["Environmental Science", "Environmental Policy", "Sustainability"]
    }
    
    return facultyDepartments[facultyId.toString()] || []
  }

  // Group users by role
  const groupedUsers = users.reduce((groups, user) => {
    const role = user.role
    if (!groups[role]) {
      groups[role] = []
    }
    groups[role].push(user)
    return groups
  }, {} as { [key: string]: User[] })

  // Role configuration with icons and colors
  const roleConfig = {
    Administrator: {
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Full system access and control"
    },
    Faculty: {
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Course management and result approval"
    },
    Lecturer: {
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Course teaching and result upload"
    },
    Student: {
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "View academic results and course information"
    }
  }

  const toggleGroup = (role: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(role)) {
      newCollapsed.delete(role)
    } else {
      newCollapsed.add(role)
    }
    setCollapsedGroups(newCollapsed)
  }

  const getRoleIcon = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig]
    if (config) {
      const IconComponent = config.icon
      return <IconComponent className={`h-4 w-4 ${config.color}`} />
    }
    return <User className="h-4 w-4 text-gray-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
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
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage system users, roles, and permissions
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (open && !formInitialized) {
              resetForm()
              setFormInitialized(true)
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with appropriate role and permissions.
                  {formData.role && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(formData.role)}
                        <span className="font-medium">Will be added to: {formData.role}s group</span>
                      </div>
                      <p className="text-gray-600 mt-1">{roleConfig[formData.role as keyof typeof roleConfig]?.description}</p>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => {
                    console.log("Role changing from", formData.role, "to", value)
                    console.log("Current matric number:", formData.matric_number)
                    
                    // Store current student data before role change
                    if (formData.role === "Student") {
                      console.log("Storing student data:", { level: formData.level, matric_number: formData.matric_number })
                      setStudentData({
                        level: formData.level || "",
                        matric_number: formData.matric_number || ""
                      })
                    }
                    
                    // Update role and restore student data if switching back to student
                    const newFormData = { ...formData, role: value }
                    if (value === "Student") {
                      console.log("Restoring student data:", studentData)
                      newFormData.level = studentData.level
                      newFormData.matric_number = studentData.matric_number
                    } else {
                      // Clear student-specific fields for non-student roles
                      newFormData.level = ""
                      newFormData.matric_number = ""
                    }
                    
                    console.log("New form data:", newFormData)
                    setFormData(newFormData)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Lecturer">Lecturer</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData.role === "Student" || formData.role === "Faculty" || formData.role === "Lecturer") && (
                  <div className="grid gap-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select 
                      value={formData.faculty_id?.toString() || "none"} 
                      onValueChange={(value) => setFormData({ ...formData, faculty_id: value === "none" ? undefined : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a faculty member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No faculty assigned</SelectItem>
                        <SelectItem value="1">Faculty of Arts</SelectItem>
                        <SelectItem value="2">Faculty of Business and Economics</SelectItem>
                        <SelectItem value="3">Faculty of Education</SelectItem>
                        <SelectItem value="4">Faculty of Engineering</SelectItem>
                        <SelectItem value="5">Faculty of Health Sciences</SelectItem>
                        <SelectItem value="6">Faculty of Law</SelectItem>
                        <SelectItem value="7">Faculty of Medicine</SelectItem>
                        <SelectItem value="8">Faculty of Science</SelectItem>
                        <SelectItem value="9">Faculty of Social Sciences</SelectItem>
                        <SelectItem value="10">Faculty of Technology</SelectItem>
                        <SelectItem value="11">Faculty of Veterinary Medicine</SelectItem>
                        <SelectItem value="12">Faculty of Agriculture</SelectItem>
                        <SelectItem value="13">Faculty of Architecture</SelectItem>
                        <SelectItem value="14">Faculty of Dentistry</SelectItem>
                        <SelectItem value="15">Faculty of Pharmacy</SelectItem>
                        <SelectItem value="16">Faculty of Fine Arts</SelectItem>
                        <SelectItem value="17">Faculty of Music</SelectItem>
                        <SelectItem value="18">Faculty of Theology</SelectItem>
                        <SelectItem value="19">Faculty of Environmental Studies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                      {(formData.role === "Student" || formData.role === "Faculty" || formData.role === "Lecturer") && (
        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Select 
            value={formData.department} 
            onValueChange={(value) => setFormData({ ...formData, department: value })}
            disabled={formData.role === "Student" && !formData.faculty_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                formData.role === "Student" && !formData.faculty_id 
                  ? "Select a faculty first" 
                  : "Select a department"
              } />
            </SelectTrigger>
            <SelectContent>
              {formData.role === "Student" && formData.faculty_id 
                ? getDepartmentsForFaculty(formData.faculty_id).map((dept: string) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))
                : [
                    "Computer Science",
                    "Mathematics",
                    "Physics",
                    "Chemistry",
                    "Biology",
                    "Engineering",
                    "Business Administration",
                    "Economics",
                    "Law",
                    "Medicine",
                    "Education",
                    "Arts",
                    "Social Sciences"
                  ].map((dept: string) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Lecturer-specific fields */}
      {formData.role === "Lecturer" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="lecturer_id">Lecturer ID</Label>
            <Input
              id="lecturer_id"
              value={formData.lecturer_id || ""}
              onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
              placeholder="e.g., LEC001, LEC2023/001"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender || ""} 
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {/* Student-specific fields */}
      {formData.role === "Student" && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="matric_number">Matric Number</Label>
            <Input
              id="matric_number"
              value={formData.matric_number || ""}
              onChange={(e) => {
                console.log("Matric number changed:", e.target.value)
                setFormData({ ...formData, matric_number: e.target.value })
              }}
              placeholder="e.g., 2023/123456"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="level">Level</Label>
            <Select 
              value={formData.level || ""} 
              onValueChange={(value) => setFormData({ ...formData, level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
                <SelectItem value="500">500 Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(groupedUsers).map(([role, roleUsers]) => {
            const config = roleConfig[role as keyof typeof roleConfig]
            const onlineCount = roleUsers.filter(user => isUserOnline(user.id)).length
            
            return (
              <div key={role} className={`p-4 rounded-lg border ${config?.borderColor || 'border-gray-200'} ${config?.bgColor || 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {getRoleIcon(role)}
                  <div>
                    <div className="text-2xl font-bold">{roleUsers.length}</div>
                    <div className="text-sm text-gray-600">{role}s</div>
                    <div className="text-xs text-green-600">{onlineCount} online</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          {/* Role Groups */}
          {Object.entries(groupedUsers).map(([role, roleUsers]) => {
            const config = roleConfig[role as keyof typeof roleConfig]
            const isCollapsed = collapsedGroups.has(role)
            const onlineCount = roleUsers.filter(user => isUserOnline(user.id)).length
            
            return (
              <div key={role} className={`border rounded-lg ${config?.borderColor || 'border-gray-200'}`}>
                {/* Group Header */}
                <div 
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${config?.bgColor || 'bg-gray-50'}`}
                  onClick={() => toggleGroup(role)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(role)}
                      <div>
                        <h3 className="font-semibold text-lg">{role}s</h3>
                        <p className="text-sm text-gray-600">{config?.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Users</div>
                        <div className="font-semibold">{roleUsers.length}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Online</div>
                        <div className="font-semibold text-green-600">{onlineCount}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                {!isCollapsed && (
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          {role === "Student" && (
                            <>
                              <TableHead>Matric Number</TableHead>
                              <TableHead>Level</TableHead>
                            </>
                          )}
                          {role === "Lecturer" && (
                            <TableHead>Lecturer ID</TableHead>
                          )}
                          <TableHead>Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.department}</TableCell>
                            {role === "Student" && (
                              <>
                                <TableCell>
                                  <code className="text-sm bg-muted px-2 py-1 rounded">
                                    {user.matric_number || "N/A"}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    Level {user.level || "N/A"}
                                  </Badge>
                                </TableCell>
                              </>
                            )}
                            {role === "Lecturer" && (
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {user.lecturer_id || "N/A"}
                                </code>
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant={isUserOnline(user.id) ? "default" : "secondary"}>
                                {isUserOnline(user.id) ? "Online" : "Offline"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={user.id === 1} // Prevent deleting the main admin
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )
          })}

          {/* Empty State */}
          {Object.keys(groupedUsers).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found. Create your first user to get started.</p>
            </div>
          )}
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => {
                  // Store current student data before role change
                  if (formData.role === "Student") {
                    setStudentData({
                      level: formData.level || "",
                      matric_number: formData.matric_number || ""
                    })
                  }
                  
                  // Update role and restore student data if switching back to student
                  const newFormData = { ...formData, role: value }
                  if (value === "Student") {
                    newFormData.level = studentData.level
                    newFormData.matric_number = studentData.matric_number
                  } else {
                    // Clear student-specific fields for non-student roles
                    newFormData.level = ""
                    newFormData.matric_number = ""
                  }
                  
                  setFormData(newFormData)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Lecturer">Lecturer</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.role === "Student" || formData.role === "Faculty" || formData.role === "Lecturer") && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-faculty">Faculty</Label>
                  <Select 
                    value={formData.faculty_id?.toString() || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, faculty_id: value === "none" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a faculty member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No faculty assigned</SelectItem>
                      <SelectItem value="1">Faculty of Arts</SelectItem>
                      <SelectItem value="2">Faculty of Business and Economics</SelectItem>
                      <SelectItem value="3">Faculty of Education</SelectItem>
                      <SelectItem value="4">Faculty of Engineering</SelectItem>
                      <SelectItem value="5">Faculty of Health Sciences</SelectItem>
                      <SelectItem value="6">Faculty of Law</SelectItem>
                      <SelectItem value="7">Faculty of Medicine</SelectItem>
                      <SelectItem value="8">Faculty of Science</SelectItem>
                      <SelectItem value="9">Faculty of Social Sciences</SelectItem>
                      <SelectItem value="10">Faculty of Technology</SelectItem>
                      <SelectItem value="11">Faculty of Veterinary Medicine</SelectItem>
                      <SelectItem value="12">Faculty of Agriculture</SelectItem>
                      <SelectItem value="13">Faculty of Architecture</SelectItem>
                      <SelectItem value="14">Faculty of Dentistry</SelectItem>
                      <SelectItem value="15">Faculty of Pharmacy</SelectItem>
                      <SelectItem value="16">Faculty of Fine Arts</SelectItem>
                      <SelectItem value="17">Faculty of Music</SelectItem>
                      <SelectItem value="18">Faculty of Theology</SelectItem>
                      <SelectItem value="19">Faculty of Environmental Studies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formData.role === "Student" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    disabled={!formData.faculty_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!formData.faculty_id ? "Select a faculty first" : "Select a department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.faculty_id && getDepartmentsForFaculty(formData.faculty_id).map((dept: string) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Lecturer-specific fields in edit dialog */}
              {formData.role === "Lecturer" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lecturer-id">Lecturer ID</Label>
                    <Input
                      id="edit-lecturer-id"
                      value={formData.lecturer_id || ""}
                      onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                      placeholder="e.g., LEC001, LEC2023/001"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select 
                      value={formData.gender || ""} 
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* Student-specific fields in edit dialog */}
              {formData.role === "Student" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-matric-number">Matric Number</Label>
                    <Input
                      id="edit-matric-number"
                      value={formData.matric_number || ""}
                      onChange={(e) => setFormData({ ...formData, matric_number: e.target.value })}
                      placeholder="e.g., 2023/123456"
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-level">Level</Label>
                    <Select 
                      value={formData.level || ""} 
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 Level</SelectItem>
                        <SelectItem value="200">200 Level</SelectItem>
                        <SelectItem value="300">300 Level</SelectItem>
                        <SelectItem value="400">400 Level</SelectItem>
                        <SelectItem value="500">500 Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active-status"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-active-status">Active Status</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
                              <Button onClick={handleUpdateUser} disabled={updateLoading}>
                  {updateLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 