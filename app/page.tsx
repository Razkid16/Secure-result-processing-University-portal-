"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Users, FileText, Activity, Lock, Eye, UserCheck, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SecureAcademicSystem() {
  const [currentUser] = useState({
    name: "Dr. Sarah Johnson",
    role: "Faculty",
    department: "Computer Science",
    permissions: ["view_results", "edit_results", "audit_access"],
  })

  const [auditLogs] = useState([
    {
      id: 1,
      timestamp: "2024-01-15 14:30:22",
      user: "Dr. Sarah Johnson",
      action: "VIEW_RESULT",
      resource: "CSC301_Final_Results",
      ip: "192.168.1.45",
      status: "SUCCESS",
      risk: "LOW",
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:28:15",
      user: "Prof. Michael Chen",
      action: "EDIT_RESULT",
      resource: "MAT201_Midterm_Results",
      ip: "192.168.1.67",
      status: "SUCCESS",
      risk: "MEDIUM",
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:25:08",
      user: "Admin User",
      action: "CREATE_USER",
      resource: "new_faculty_account",
      ip: "192.168.1.10",
      status: "SUCCESS",
      risk: "HIGH",
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:22:33",
      user: "Unknown",
      action: "FAILED_LOGIN",
      resource: "admin_portal",
      ip: "203.45.67.89",
      status: "FAILED",
      risk: "CRITICAL",
    },
  ])

  const [users] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      email: "s.johnson@tech-u.edu.ng",
      role: "Faculty",
      department: "Computer Science",
      status: "Active",
      lastLogin: "2024-01-15 14:30:22",
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      email: "m.chen@tech-u.edu.ng",
      role: "Faculty",
      department: "Mathematics",
      status: "Active",
      lastLogin: "2024-01-15 14:28:15",
    },
    {
      id: 3,
      name: "John Doe",
      email: "j.doe@tech-u.edu.ng",
      role: "Student",
      department: "Computer Science",
      status: "Active",
      lastLogin: "2024-01-15 13:45:10",
    },
    {
      id: 4,
      name: "Admin User",
      email: "admin@tech-u.edu.ng",
      role: "Administrator",
      department: "IT Services",
      status: "Active",
      lastLogin: "2024-01-15 14:22:33",
    },
  ])

  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    if (!currentUser.name) {
      router.push("/login")
    }
  }, [router, currentUser])

  const getRiskBadge = (risk: string) => {
    const colors = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[risk as keyof typeof colors]}>{risk}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === "SUCCESS" ? (
      <Badge className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tech-U Secure Portal</h1>
              <p className="text-sm text-gray-600">Secured Communication in Academic Environments</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-100 text-green-800">
              <Lock className="h-3 w-3 mr-1" />
              Encrypted Session
            </Badge>
            <Avatar>
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-gray-600">
                {currentUser.role} - {currentUser.department}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 from last hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">Blocked automatically</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Secure</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="audit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="rbac">Role Management</TabsTrigger>
            <TabsTrigger value="results">Result Processing</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>System Audit Logs</span>
                </CardTitle>
                <CardDescription>Real-time monitoring of all system activities and security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Input placeholder="Search logs..." className="max-w-sm" />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Resource</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Risk Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>{log.resource}</TableCell>
                            <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell>{getRiskBadge(log.risk)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role-Based Access Control Tab */}
          <TabsContent value="rbac">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription>Manage user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.role === "Administrator" ? "default" : "secondary"}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.department}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">{user.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role Permissions Matrix</CardTitle>
                  <CardDescription>Configure permissions for different user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2">
                      <div>Permission</div>
                      <div>Admin</div>
                      <div>Faculty</div>
                      <div>Student</div>
                    </div>

                    {[
                      { name: "View Results", admin: true, faculty: true, student: true },
                      { name: "Edit Results", admin: true, faculty: true, student: false },
                      { name: "Delete Results", admin: true, faculty: false, student: false },
                      { name: "Manage Users", admin: true, faculty: false, student: false },
                      { name: "View Audit Logs", admin: true, faculty: true, student: false },
                      { name: "System Config", admin: true, faculty: false, student: false },
                    ].map((perm, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 py-2 text-sm">
                        <div>{perm.name}</div>
                        <div>{perm.admin ? "✅" : "❌"}</div>
                        <div>{perm.faculty ? "✅" : "❌"}</div>
                        <div>{perm.student ? "✅" : "❌"}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Result Processing Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Secure Result Processing</span>
                </CardTitle>
                <CardDescription>Process and manage academic results with full audit trail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course Code</Label>
                      <Input id="course" placeholder="e.g., CSC301" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2023-1">2023/2024 First Semester</SelectItem>
                          <SelectItem value="2023-2">2023/2024 Second Semester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cs">Computer Science</SelectItem>
                          <SelectItem value="math">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Lock className="h-4 w-4 mr-2" />
                      Load Encrypted Results
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Security Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm">End-to-end encryption</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Digital signatures</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Complete audit trail</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Role-based access</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Encryption Settings</CardTitle>
                  <CardDescription>Configure cryptographic parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Encryption Algorithm</Label>
                    <Select defaultValue="aes256">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aes256">AES-256-GCM</SelectItem>
                        <SelectItem value="aes128">AES-128-GCM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hash Function</Label>
                    <Select defaultValue="sha256">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sha256">SHA-256</SelectItem>
                        <SelectItem value="sha512">SHA-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Rotation Interval</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Control</CardTitle>
                  <CardDescription>Configure authentication and authorization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Failed Login Threshold</Label>
                    <Select defaultValue="3">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                        <SelectItem value="10">10 attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>IP Whitelist</Label>
                    <Input placeholder="192.168.1.0/24" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
