"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  LogOut,
  Crown,
  User,
  Home,
  ClipboardList,
  ShieldAlert,
  Database,
  ShieldCheck,
  Download,
  Edit,
  Trash,
  Upload,
  BarChart3,
  Target,
  Key,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ResultManagement } from "@/components/result-management"
import { BulkUpload } from "@/components/bulk-upload"
import { AuditLogs } from "@/components/audit-logs"
import { UserManagement } from "@/components/user-management"
import { SecurityMonitoring } from "@/components/security-monitoring"
import StudentList from "@/components/student-list"
import StudentResultSummary from "@/components/student-result-summary"
import { ResultApproval } from "@/components/result-approval"
import ApprovalLog from "@/components/pending-results"
import { DepartmentLecturers } from "@/components/department-lecturers"
import { RBACService } from "@/lib/rbac"
import { HeartbeatProvider } from "@/components/heartbeat-provider"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar'
import { DigitalSignatures } from '@/components/digital-signatures';
import { CourseRegistration } from '@/components/course-registration';
import { CourseManagement } from '@/components/course-management';
import { LecturerCourses } from '@/components/lecturer-courses';
import { ExamPass } from '@/components/exam-pass';
import { LecturerKeys } from '@/components/lecturer-keys';
import { FacultyKeys } from '@/components/faculty-keys';

interface DashboardUser {
  id: number
  email: string
  name: string
  role: string
  department: string
  lecturer_id?: string | null
  gender?: string | null
}

interface DashboardStats {
  totalResults: number
  publishedResults: number
  draftResults: number
  totalStudents: number
  totalFaculty: number
  recentActivity: number
  securityAlerts: number
  systemHealth: "Good" | "Warning" | "Critical"
}

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalResults: 0,
    publishedResults: 0,
    draftResults: 0,
    totalStudents: 0,
    totalFaculty: 0,
    recentActivity: 0,
    securityAlerts: 0,
    systemHealth: "Good",
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [activeSection, setActiveSection] = useState('overview')
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [permissions, setPermissions] = useState({
    canViewResults: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewSecurityEvents: false,
    canSystemConfig: false,
  })
  const router = useRouter()

  useEffect(() => {
    const loadUserAndPermissions = async () => {
      try {
        console.log("Starting to load user and permissions...")
        
        // Get current user
        const userResponse = await fetch("/api/auth/me", {
          credentials: "include",
        })

        console.log("User response status:", userResponse.status)

        if (!userResponse.ok) {
          console.log("User response not ok, redirecting to login")
          router.push("/login")
          return
        }

        const userData = await userResponse.json()
        console.log("User data received:", userData)
        setUser(userData.user)

        console.log("User loaded:", userData.user.role)

        console.log("Loading permissions for role:", userData.user.role)
        
        // Load permissions with proper role differentiation
        const [canViewResults, canManageUsers, canViewAuditLogs, canViewSecurityEvents, canSystemConfig] =
          await Promise.all([
            RBACService.canViewResults(userData.user.role),
            RBACService.canManageUsers(userData.user.role),
            RBACService.canViewAuditLogs(userData.user.role),
            RBACService.canViewSecurityEvents(userData.user.role),
            RBACService.canConfigureSystem(userData.user.role),
          ])

        console.log("Permissions loaded:", {
          role: userData.user.role,
          canViewResults,
          canManageUsers,
          canViewAuditLogs,
          canViewSecurityEvents,
          canSystemConfig,
        })

        setPermissions({
          canViewResults,
          canManageUsers,
          canViewAuditLogs,
          canViewSecurityEvents,
          canSystemConfig,
        })

        // Load dashboard stats from API
        const statsResponse = await fetch("/api/dashboard/stats", {
          credentials: "include",
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data)
        } else {
          // Fallback to role-based demo stats
          const roleBasedStats = {
            Administrator: {
              totalResults: 1247,
              publishedResults: 1156,
              draftResults: 91,
              totalStudents: 2834,
              totalFaculty: 156,
              recentActivity: 23,
              securityAlerts: 2,
              systemHealth: "Good" as const,
            },
            Faculty: {
              totalResults: 89,
              publishedResults: 82,
              draftResults: 7,
              totalStudents: 145,
              totalFaculty: 1,
              recentActivity: 5,
              securityAlerts: 0,
              systemHealth: "Good" as const,
            },
            Lecturer: {
              totalResults: 89,
              publishedResults: 82,
              draftResults: 7,
              totalStudents: 145,
              totalFaculty: 1,
              recentActivity: 5,
              securityAlerts: 0,
              systemHealth: "Good" as const,
            },
            Student: {
              totalResults: 12,
              publishedResults: 10,
              draftResults: 2,
              totalStudents: 1,
              totalFaculty: 0,
              recentActivity: 2,
              securityAlerts: 0,
              systemHealth: "Good" as const,
            },
          }
          setStats(roleBasedStats[userData.user.role as keyof typeof roleBasedStats] || roleBasedStats.Student)
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadUserAndPermissions()
    if (user?.role === "Administrator") {
      loadRecentActivities()
    }
  }, [router, user?.role])

  const loadRecentActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/recent-activity', {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecentActivities(data.data)
        }
      }
    } catch (error) {
      console.error("Failed to load recent activities:", error)
    }
  }

  const handleLogout = async () => {
    try {
      setLogoutLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    } finally {
      setLogoutLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Administrator":
        return <Crown className="h-4 w-4 text-purple-600" />
      case "Faculty":
        return <GraduationCap className="h-4 w-4 text-blue-600" />
      case "Lecturer":
        return <GraduationCap className="h-4 w-4 text-blue-600" />
      case "Student":
        return <BookOpen className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      Administrator: "bg-purple-100 text-purple-800 border-purple-200",
      Faculty: "bg-blue-100 text-blue-800 border-blue-200",
      Lecturer: "bg-blue-100 text-blue-800 border-blue-200",
      Student: "bg-green-100 text-green-800 border-green-200",
      Staff: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return <Badge className={colors[role as keyof typeof colors] || colors.Staff}>{role}</Badge>
  }

  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      CheckCircle,
      XCircle,
      LogOut,
      FileText,
      Edit,
      Trash,
      Upload,
      Eye,
      ClipboardList,
      Shield,
      BarChart3,
      Target,
      AlertTriangle,
      Home,
      Users,
      Database,
      ShieldCheck,
      Download,
      Activity,
    }
    return iconMap[iconName] || Activity
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500"
      case "error": return "bg-red-500"
      case "warning": return "bg-yellow-500"
      default: return "bg-blue-500"
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return `${Math.floor(diffInMinutes / 1440)} days ago`
  }

  const getAvailableTabs = () => {
    const tabs = [{ id: "overview", label: "Overview", available: true }]

    if (permissions.canViewResults) {
      tabs.push({ id: "results", label: "Results", available: true })
    }

    // Add department lecturers tab for faculty only
    if (user && user.role === "Faculty") {
      tabs.push({ id: "lecturers", label: "Department Lecturers", available: true })
    }

    if (permissions.canManageUsers) {
      tabs.push({ id: "users", label: "Users", available: true })
    }

    if (permissions.canViewAuditLogs) {
      tabs.push({ id: "audit", label: "Audit Logs", available: true })
    }

    if (permissions.canViewSecurityEvents) {
      tabs.push({ id: "security", label: "Security", available: true })
    }

    return tabs.filter((tab) => tab.available)
  }

    const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'results', label: 'Results', icon: FileText },
    { id: 'exam-pass', label: 'Exam Pass', icon: FileText },
    { id: 'pending-approval', label: 'Approval Log', icon: Clock },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'course-registration', label: 'Course Registration', icon: BookOpen },
    { id: 'course-management', label: 'Course Management', icon: BookOpen },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'lecturers', label: 'Department Lecturers', icon: BookOpen },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    // Add Hashing for admin only
    ...(user && user.role === 'Administrator' ? [
      { id: 'hashing', label: 'Hashing', icon: ShieldCheck },
      { id: 'digital-signatures', label: 'Digital Signatures', icon: Key },
    ] : []),
  ].filter(item => {
    if (item.id === 'results') return permissions.canViewResults
    if (item.id === 'exam-pass') return user && user.role === "Student"
    if (item.id === 'pending-approval') return user && (user.role === "Faculty" || user.role === "Lecturer")
    if (item.id === 'courses') return user && user.role === "Lecturer"
    if (item.id === 'course-registration') return user && (user.role === "Student" || user.role === "Administrator" || user.role === "Faculty")
    if (item.id === 'course-management') return user && (user.role === "Administrator" || user.role === "Faculty")
    if (item.id === 'students') return user && (user.role === "Faculty" || user.role === "Lecturer")
    if (item.id === 'lecturers') return user && user.role === "Faculty"
    if (item.id === 'users') return permissions.canManageUsers
    if (item.id === 'audit') return permissions.canViewAuditLogs
    if (item.id === 'security') return permissions.canViewSecurityEvents
    if (item.id === 'hashing') return user && user.role === 'Administrator'
    if (item.id === 'digital-signatures') return user && user.role === 'Administrator'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading dashboard... {error && `Error: ${error}`}</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load user data"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const availableTabs = getAvailableTabs()

  return (
    <HeartbeatProvider>
      <SidebarProvider>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader>
          <div className="p-4 flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-bold">Tech-U</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <a>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
          <SidebarTrigger />
          <div className="flex items-center space-x-4">
            <span className="font-medium">Welcome, {user.name}!</span>
            {getRoleBadge(user.role)}
          </div>
        </header>
        <main className="p-6">
          {activeSection === 'overview' && (
            // Overview content from previous TabsContent value="overview"
            <div className="space-y-6">
              {/* Welcome Card */}
                              <Card className={`border-l-4 ${user.role === 'Administrator' ? 'border-l-purple-500' : user.role === 'Faculty' || user.role === 'Lecturer' ? 'border-l-blue-500' : 'border-l-green-500'}`}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h2>
                    <p className="text-gray-600 mb-4">
                      {user.role === 'Administrator' && 'You have full administrative access to the system.'}
                      {user.role === 'Faculty' && 'You can manage results for your courses and view audit logs.'}
                      {user.role === 'Lecturer' && 'You can manage results for your courses and view audit logs.'}
                      {user.role === 'Student' && 'You can view your academic results and course information.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Cards - Role-specific */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user.role === "Student" ? "Your Results" : "Total Results"}
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalResults.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {user.role === "Administrator" && "System-wide results"}
                      {(user.role === "Faculty" || user.role === "Lecturer") && "Your course results"}
                      {user.role === "Student" && "Your academic records"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.publishedResults.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {((stats.publishedResults / stats.totalResults) * 100).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {user.role === "Student" ? "Pending" : "Draft Results"}
                    </CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.draftResults}</div>
                    <p className="text-xs text-muted-foreground">
                      {user.role === "Student" ? "Awaiting publication" : "Pending review"}
                    </p>
                  </CardContent>
                </Card>

                {/* Show different 4th card based on role */}
                {user.role === "Administrator" && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats.securityAlerts}</div>
                      <p className="text-xs text-muted-foreground">Requires attention</p>
                    </CardContent>
                  </Card>
                )}

                {(user.role === "Faculty" || user.role === "Lecturer") && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Your Students</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">In your courses</p>
                    </CardContent>
                  </Card>
                )}

                {user.role === "Student" && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Health</CardTitle>
                      <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.systemHealth}</div>
                      <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Role-specific Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Access Level</CardTitle>
                    <CardDescription>Permissions granted to your role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View Results</span>
                        {permissions.canViewResults ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Manage Users</span>
                        {permissions.canManageUsers ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View Audit Logs</span>
                        {permissions.canViewAuditLogs ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Security Events</span>
                        {permissions.canViewSecurityEvents ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Configuration</span>
                        {permissions.canSystemConfig ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lecturer Details Card - Only show for Lecturers */}
                {user.role === "Lecturer" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Lecturer Details</CardTitle>
                      <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Name:</span>
                          <span className="text-sm text-gray-600">{user.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Lecturer ID:</span>
                          <span className="text-sm text-gray-600">
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {user.lecturer_id || "Not assigned"}
                            </code>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Department:</span>
                          <span className="text-sm text-gray-600">{user.department}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Email:</span>
                          <span className="text-sm text-gray-600">{user.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Gender:</span>
                          <span className="text-sm text-gray-600">
                            {user.gender || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user.role === "Administrator" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentActivities.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm">No recent activity</p>
                          </div>
                        ) : (
                          recentActivities.slice(0, 5).map((activity) => {
                            const IconComponent = getActivityIcon(activity.icon)
                            return (
                              <div key={activity.id} className="flex items-center space-x-3">
                                <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`}></div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <IconComponent className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">{activity.description}</p>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {activity.user} • {formatTimeAgo(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user.role === "Student" && <StudentResultSummary user={user} />}
                {user.role === "Lecturer" && <LecturerKeys user={user} />}
                {user.role === "Faculty" && <FacultyKeys user={user} />}
              </div>
            </div>
          )}
          {activeSection === 'results' && permissions.canViewResults && (
            <div className="space-y-6">
              <ResultManagement user={user} />
              {user.role === "Administrator" && (
                <BulkUpload user={user} />
              )}
              {/* Show approval components for lecturers and faculty */}
              {user && (user.role === "Lecturer" || user.role === "Faculty") && (
                <ResultApproval user={user} />
              )}

            </div>
          )}

          {activeSection === 'exam-pass' && user && user.role === "Student" && (
            <div className="space-y-6">
              <ExamPass user={user} />
            </div>
          )}

          {activeSection === 'pending-approval' && user && (user.role === "Faculty" || user.role === "Lecturer") && (
            <div className="space-y-6">
              <ApprovalLog />
            </div>
          )}
          {activeSection === 'courses' && user && user.role === "Lecturer" && (
            <div className="space-y-6">
              <LecturerCourses user={user} />
            </div>
          )}
          {activeSection === 'course-registration' && user && (user.role === "Student" || user.role === "Administrator" || user.role === "Faculty") && (
            <div className="space-y-6">
              <CourseRegistration user={user} />
            </div>
          )}

          {activeSection === 'course-management' && user && (user.role === "Administrator" || user.role === "Faculty") && (
            <div className="space-y-6">
              <CourseManagement user={user} />
            </div>
          )}

          {activeSection === 'students' && user && (user.role === "Faculty" || user.role === "Lecturer") && (
            <div className="space-y-6">
              <StudentList user={user} />
            </div>
          )}
                  {activeSection === 'users' && permissions.canManageUsers && <UserManagement user={user} />}
            {activeSection === 'lecturers' && user && user.role === "Faculty" && <DepartmentLecturers user={user} />}
        {activeSection === 'audit' && permissions.canViewAuditLogs && <AuditLogs user={user} />}
          {activeSection === 'security' && permissions.canViewSecurityEvents && (
            <SecurityMonitoring user={user} />
          )}
          {activeSection === 'hashing' && user.role === 'Administrator' && (
            <Card>
              <CardHeader>
                <CardTitle>Hashing</CardTitle>
                <CardDescription>Hashes of results forwarded from lecturers (SHA-256)</CardDescription>
              </CardHeader>
              <CardContent>
                <HashingTable />
              </CardContent>
            </Card>
          )}
          {activeSection === 'digital-signatures' && user.role === 'Administrator' && (
            <div className="col-span-full">
              <DigitalSignatures user={user} />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </HeartbeatProvider>
  )
}

function HashingTable() {
  const [hashes, setHashes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedHash, setSelectedHash] = useState<any>(null)
  const [liveNetworkInfo, setLiveNetworkInfo] = useState<any>(null)
  const [networkLoading, setNetworkLoading] = useState(false)

  useEffect(() => {
    fetch("/api/hashing")
      .then(res => res.json())
      .then(data => {
        setHashes(data.data || [])
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to load hashes")
        setLoading(false)
      })
  }, [])

  const openDetailsDialog = async (hash: any) => {
    setSelectedHash(hash)
    setIsDetailsDialogOpen(true)
    
    // Fetch live network information
    setNetworkLoading(true)
    try {
      const response = await fetch('/api/network/status')
      const data = await response.json()
      if (data.success) {
        setLiveNetworkInfo(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch network info:', error)
    } finally {
      setNetworkLoading(false)
    }
  }

  if (loading) return <div>Loading hashes...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!hashes.length) return <div>No hashes found.</div>

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border">Hash</th>
            <th className="px-2 py-1 border">Course</th>
            <th className="px-2 py-1 border">Student</th>
            <th className="px-2 py-1 border">Forwarded By</th>
            <th className="px-2 py-1 border">Faculty Approval</th>
            <th className="px-2 py-1 border">Status</th>
            <th className="px-2 py-1 border">Created At</th>
            <th className="px-2 py-1 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {hashes.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="px-2 py-1 font-mono break-all max-w-xs">{row.hash}</td>
              <td className="px-2 py-1">{row.course_code} - {row.course_title}</td>
              <td className="px-2 py-1">
                <div>
                  <div className="font-medium">{row.student_name || `Student ${row.student_id}`}</div>
                  {row.student_email && (
                    <div className="text-xs text-gray-500">{row.student_email}</div>
                  )}
                </div>
              </td>
              <td className="px-2 py-1">
                <div>
                  <div className="font-medium">{row.lecturer_name || 'Unknown'}</div>
                  {row.lecturer_email && (
                    <div className="text-xs text-gray-500">{row.lecturer_email}</div>
                  )}
                  <div className="text-xs text-blue-600">Lecturer</div>
                </div>
              </td>
              <td className="px-2 py-1">
                {row.approved_by ? (
                  <div>
                    <div className="font-medium text-green-700">{row.approver_name || `Faculty ${row.approved_by}`}</div>
                    {row.approver_email && (
                      <div className="text-xs text-gray-500">{row.approver_email}</div>
                    )}
                    <div className="text-xs text-green-600 font-semibold">Faculty</div>
                    {row.approved_at && (
                      <div className="text-xs text-gray-400">Approved: {new Date(row.approved_at).toLocaleDateString()}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">Awaiting Faculty Approval</div>
                )}
              </td>
              <td className="px-2 py-1">{row.status}</td>
              <td className="px-2 py-1">{new Date(row.created_at).toLocaleString()}</td>
              <td className="px-2 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDetailsDialog(row)}
                  title="View details"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hash Details</DialogTitle>
            <DialogDescription>Complete information about this hashed result</DialogDescription>
          </DialogHeader>
          {selectedHash && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Hash (SHA-256)</Label>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                    {selectedHash.hash}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{selectedHash.status}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Course Information</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div><strong>Code:</strong> {selectedHash.course_code}</div>
                    <div><strong>Title:</strong> {selectedHash.course_title}</div>
                    <div><strong>Semester:</strong> {selectedHash.semester}</div>
                    <div><strong>Session:</strong> {selectedHash.session}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Student Information</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div><strong>Student ID:</strong> {selectedHash.student_id}</div>
                    <div><strong>CA Score:</strong> {selectedHash.ca_score}%</div>
                    <div><strong>Exam Score:</strong> {selectedHash.exam_score}%</div>
                    <div><strong>Total Score:</strong> {selectedHash.total_score}%</div>
                    <div><strong>Grade:</strong> {selectedHash.grade} ({selectedHash.grade_point} points)</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Lecturer Information</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedHash.lecturer_name || 'Unknown'}</div>
                    <div><strong>Email:</strong> {selectedHash.lecturer_email || 'Unknown'}</div>
                    <div><strong>ID:</strong> {selectedHash.lecturer_id || 'Unknown'}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Faculty Approval</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    {selectedHash.approved_by ? (
                      <>
                        <div><strong>Approved By:</strong> {selectedHash.approver_name || `Faculty ${selectedHash.approved_by}`}</div>
                        <div><strong>Faculty Email:</strong> {selectedHash.approver_email || 'Unknown'}</div>
                        <div><strong>Approval Date:</strong> {selectedHash.approved_at ? new Date(selectedHash.approved_at).toLocaleString() : 'Unknown'}</div>
                        <div><strong>Faculty Note:</strong> {selectedHash.faculty_note || 'None'}</div>
                      </>
                    ) : (
                      <div className="text-gray-500 italic">Awaiting Faculty Approval</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamps</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div><strong>Created:</strong> {new Date(selectedHash.created_at).toLocaleString()}</div>
                    <div><strong>Updated:</strong> {new Date(selectedHash.updated_at).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location & Network</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    {networkLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-xs text-gray-500">Loading live network info...</span>
                      </div>
                    ) : liveNetworkInfo ? (
                      <>
                        <div><strong>Current IP:</strong> {liveNetworkInfo.ip_address}</div>
                        <div><strong>Browser:</strong> {liveNetworkInfo.browser}</div>
                        <div><strong>Operating System:</strong> {liveNetworkInfo.os}</div>
                        <div><strong>Device Type:</strong> {
                          liveNetworkInfo.is_mobile ? 'Mobile' : 
                          liveNetworkInfo.is_tablet ? 'Tablet' : 
                          liveNetworkInfo.is_desktop ? 'Desktop' : 'Unknown'
                        }</div>
                        <div><strong>Timestamp:</strong> {new Date(liveNetworkInfo.timestamp).toLocaleString()}</div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500 font-medium">Original Recorded Data:</div>
                          <div><strong>Recorded IP:</strong> {selectedHash.ip_address || 'Not recorded'}</div>
                          <div><strong>Recorded Location:</strong> {selectedHash.location || 'Not recorded'}</div>
                          <div><strong>Recorded User Agent:</strong> {selectedHash.user_agent || 'Not recorded'}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div><strong>IP Address:</strong> {selectedHash.ip_address || 'Not recorded'}</div>
                        <div><strong>Location:</strong> {selectedHash.location || 'Not recorded'}</div>
                        <div><strong>User Agent:</strong> {selectedHash.user_agent || 'Not recorded'}</div>
                        <div className="text-xs text-gray-500 mt-1">Live network info unavailable</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedHash.approval_notes && (
                <div>
                  <Label className="text-sm font-medium">Approval Information</Label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div><strong>Approval Notes:</strong> {selectedHash.approval_notes}</div>
                    <div><strong>Approved By:</strong> {selectedHash.approved_by || 'Not approved'}</div>
                    <div><strong>Approved At:</strong> {selectedHash.approved_at ? new Date(selectedHash.approved_at).toLocaleString() : 'Not approved'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
