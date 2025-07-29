"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Eye, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Users,
  Lock,
  Globe,
  Server,
  Database,
  Network,
  Clock,
  Zap,
  Target,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Activity as ActivityIcon,
  Key,
  UserX,
  Settings,
  ShieldX,
  Unlock,
  Ban
} from "lucide-react"

interface SecurityEvent {
  id: number
  timestamp: string
  type: "THREAT" | "ALERT" | "WARNING" | "INFO"
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  source: string
  ipAddress?: string
  userAgent?: string
  resolved: boolean
  details?: any
}

interface SecurityStats {
  totalThreats: number
  activeThreats: number
  resolvedThreats: number
  systemHealth: number
  networkSecurity: number
  dataIntegrity: number
  userActivity: number
  recentIncidents: number
  threatTrend: "increasing" | "decreasing" | "stable"
  lastScan: string
}

interface ThreatPattern {
  id: number
  name: string
  description: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  pattern: string
  occurrences: number
  lastSeen: string
  status: "ACTIVE" | "INACTIVE" | "RESOLVED"
}

interface EncryptionSetting {
  id: number
  name: string
  description: string
  status: "ENABLED" | "DISABLED" | "PENDING"
  algorithm: string
  keyStrength: number
  lastUpdated: string
  enabled: boolean
}

interface AccessControlRule {
  id: number
  name: string
  description: string
  resource: string
  action: "ALLOW" | "DENY"
  roles: string[]
  ipRanges: string[]
  status: "ACTIVE" | "INACTIVE"
  priority: number
  createdAt: string
}

interface BlockedUser {
  id: number
  userId: number
  userEmail: string
  userName: string
  reason: string
  blockedBy: string
  blockedAt: string
  expiresAt?: string
  status: "ACTIVE" | "EXPIRED" | "MANUAL_UNBLOCK"
  ipAddress?: string
  attempts: number
}

interface SecurityMonitoringProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export function SecurityMonitoring({ user }: SecurityMonitoringProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalThreats: 0,
    activeThreats: 0,
    resolvedThreats: 0,
    systemHealth: 85,
    networkSecurity: 92,
    dataIntegrity: 98,
    userActivity: 75,
    recentIncidents: 0,
    threatTrend: "stable",
    lastScan: new Date().toISOString(),
  })
  const [threatPatterns, setThreatPatterns] = useState<ThreatPattern[]>([])
  const [encryptionSettings, setEncryptionSettings] = useState<EncryptionSetting[]>([])
  const [accessControlRules, setAccessControlRules] = useState<AccessControlRule[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadSecurityData()
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Load security events
      const eventsResponse = await fetch('/api/security/events', {
        credentials: "include",
      })
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        if (eventsData.success) {
          setEvents(eventsData.data)
        }
      }

      // Load security stats
      const statsResponse = await fetch('/api/security/stats', {
        credentials: "include",
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
        }
      }

      // Load threat patterns
      const patternsResponse = await fetch('/api/security/patterns', {
        credentials: "include",
      })
      
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json()
        if (patternsData.success) {
          setThreatPatterns(patternsData.data)
        }
      }

      // Load mock encryption settings
      const mockEncryptionSettings: EncryptionSetting[] = [
        {
          id: 1,
          name: "Database Encryption",
          description: "AES-256 encryption for sensitive data storage",
          status: "ENABLED",
          algorithm: "AES-256-GCM",
          keyStrength: 256,
          lastUpdated: new Date().toISOString(),
          enabled: true
        },
        {
          id: 2,
          name: "Session Encryption",
          description: "TLS 1.3 encryption for user sessions",
          status: "ENABLED",
          algorithm: "TLS 1.3",
          keyStrength: 256,
          lastUpdated: new Date(Date.now() - 86400000).toISOString(),
          enabled: true
        },
        {
          id: 3,
          name: "Password Hashing",
          description: "bcrypt hashing for user passwords",
          status: "ENABLED",
          algorithm: "bcrypt",
          keyStrength: 12,
          lastUpdated: new Date(Date.now() - 172800000).toISOString(),
          enabled: true
        },
        {
          id: 4,
          name: "API Encryption",
          description: "JWT token encryption for API requests",
          status: "PENDING",
          algorithm: "RSA-2048",
          keyStrength: 2048,
          lastUpdated: new Date(Date.now() - 259200000).toISOString(),
          enabled: false
        }
      ]
      setEncryptionSettings(mockEncryptionSettings)

      // Load mock access control rules
      const mockAccessControlRules: AccessControlRule[] = [
        {
          id: 1,
          name: "Admin Full Access",
          description: "Full system access for administrators",
          resource: "/*",
          action: "ALLOW",
          roles: ["Administrator"],
          ipRanges: ["0.0.0.0/0"],
          status: "ACTIVE",
          priority: 1,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Faculty Results Access",
          description: "Faculty can access student results",
          resource: "/api/results",
          action: "ALLOW",
          roles: ["Faculty", "Administrator"],
          ipRanges: ["192.168.1.0/24"],
          status: "ACTIVE",
          priority: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          name: "Student Self Access",
          description: "Students can only access their own data",
          resource: "/api/results/*",
          action: "ALLOW",
          roles: ["Student"],
          ipRanges: ["192.168.1.0/24"],
          status: "ACTIVE",
          priority: 3,
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 4,
          name: "Block Suspicious IPs",
          description: "Block access from suspicious IP addresses",
          resource: "/*",
          action: "DENY",
          roles: ["*"],
          ipRanges: ["10.0.0.0/8", "172.16.0.0/12"],
          status: "ACTIVE",
          priority: 0,
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ]
      setAccessControlRules(mockAccessControlRules)

      // Load mock blocked users
      const mockBlockedUsers: BlockedUser[] = [
        {
          id: 1,
          userId: 101,
          userEmail: "suspicious@example.com",
          userName: "Suspicious User",
          reason: "Multiple failed login attempts",
          blockedBy: "System",
          blockedAt: new Date(Date.now() - 3600000).toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          status: "ACTIVE",
          ipAddress: "192.168.1.100",
          attempts: 5
        },
        {
          id: 2,
          userId: 102,
          userEmail: "malicious@example.com",
          userName: "Malicious User",
          reason: "Suspicious activity detected",
          blockedBy: "Security System",
          blockedAt: new Date(Date.now() - 7200000).toISOString(),
          status: "ACTIVE",
          ipAddress: "10.0.0.50",
          attempts: 3
        },
        {
          id: 3,
          userId: 103,
          userEmail: "expired@example.com",
          userName: "Expired User",
          reason: "Account compromised",
          blockedBy: "Administrator",
          blockedAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() - 3600000).toISOString(),
          status: "EXPIRED",
          ipAddress: "172.16.0.25",
          attempts: 1
        }
      ]
      setBlockedUsers(mockBlockedUsers)
    } catch (error) {
      console.error("Failed to load security data:", error)
      setError("Failed to load security data")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200"
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "THREAT": return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "ALERT": return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "WARNING": return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "INFO": return <CheckCircle className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getHealthColor = (value: number) => {
    if (value >= 90) return "text-green-600"
    if (value >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing": return <TrendingUp className="h-4 w-4 text-red-600" />
      case "decreasing": return <TrendingDown className="h-4 w-4 text-green-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading security data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.activeThreats}</div>
                <p className="text-xs text-muted-foreground">Active Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.resolvedThreats}</div>
                <p className="text-xs text-muted-foreground">Resolved Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.recentIncidents}</div>
                <p className="text-xs text-muted-foreground">Recent Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {getTrendIcon(stats.threatTrend)}
              <div>
                <div className="text-2xl font-bold">Threat Trend</div>
                <p className="text-xs text-muted-foreground capitalize">{stats.threatTrend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.systemHealth)}`}>
              {stats.systemHealth}%
            </div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>Network Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.networkSecurity)}`}>
              {stats.networkSecurity}%
            </div>
            <Progress value={stats.networkSecurity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Data Integrity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.dataIntegrity)}`}>
              {stats.dataIntegrity}%
            </div>
            <Progress value={stats.dataIntegrity} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(stats.userActivity)}`}>
              {stats.userActivity}%
            </div>
            <Progress value={stats.userActivity} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="patterns">Threat Patterns</TabsTrigger>
            <TabsTrigger value="analytics">Security Analytics</TabsTrigger>
            <TabsTrigger value="encryption">Encryption</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="blocked">Blocked Users</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSecurityData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Auto Refresh
            </Button>
          </div>
        </div>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Real-time security events and threat alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security events found
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 10).map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        event.severity === "CRITICAL" ? "border-red-200 bg-red-50" :
                        event.severity === "HIGH" ? "border-orange-200 bg-orange-50" :
                        event.severity === "MEDIUM" ? "border-yellow-200 bg-yellow-50" :
                        "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getTypeIcon(event.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity}
                              </Badge>
                              {event.resolved && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>Source: {event.source}</span>
                              {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                              <span>{formatDate(event.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Patterns</CardTitle>
              <CardDescription>
                Identified threat patterns and attack signatures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threatPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No threat patterns detected
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pattern Name</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Occurrences</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threatPatterns.map((pattern) => (
                      <TableRow key={pattern.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pattern.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {pattern.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(pattern.severity)}>
                            {pattern.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{pattern.occurrences}</TableCell>
                        <TableCell>{formatDate(pattern.lastSeen)}</TableCell>
                        <TableCell>
                          <Badge className={
                            pattern.status === "ACTIVE" ? "bg-red-100 text-red-800 border-red-200" :
                            pattern.status === "RESOLVED" ? "bg-green-100 text-green-800 border-green-200" :
                            "bg-gray-100 text-gray-800 border-gray-200"
                          }>
                            {pattern.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Security Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Total Threats</span>
                    <span className="font-medium">{stats.totalThreats}</span>
                  </div>
                  <Progress value={(stats.activeThreats / Math.max(stats.totalThreats, 1)) * 100} className="mt-1" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Resolution Rate</span>
                    <span className="font-medium">
                      {stats.totalThreats > 0 ? Math.round((stats.resolvedThreats / stats.totalThreats) * 100) : 0}%
                    </span>
                  </div>
                  <Progress value={stats.totalThreats > 0 ? (stats.resolvedThreats / stats.totalThreats) * 100 : 0} className="mt-1" />
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>System Health</span>
                    <span className="font-medium">{stats.systemHealth}%</span>
                  </div>
                  <Progress value={stats.systemHealth} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Security Scan</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(stats.lastScan)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threat Trend</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(stats.threatTrend)}
                      <span className="text-sm capitalize">{stats.threatTrend}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Security</span>
                    <span className="text-sm font-medium">{stats.networkSecurity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Integrity</span>
                    <span className="text-sm font-medium">{stats.dataIntegrity}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Encryption Settings Tab */}
        <TabsContent value="encryption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Encryption Settings</span>
              </CardTitle>
              <CardDescription>
                Manage encryption algorithms and security keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {encryptionSettings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No encryption settings configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setting</TableHead>
                      <TableHead>Algorithm</TableHead>
                      <TableHead>Key Strength</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encryptionSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{setting.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {setting.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{setting.algorithm}</TableCell>
                        <TableCell>{setting.keyStrength} bits</TableCell>
                        <TableCell>
                          <Badge className={
                            setting.status === "ENABLED" ? "bg-green-100 text-green-800 border-green-200" :
                            setting.status === "DISABLED" ? "bg-red-100 text-red-800 border-red-200" :
                            "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }>
                            {setting.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(setting.lastUpdated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5" />
                <span>Access Control Rules</span>
              </CardTitle>
              <CardDescription>
                Manage access control policies and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessControlRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No access control rules configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessControlRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {rule.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{rule.resource}</TableCell>
                        <TableCell>
                          <Badge className={
                            rule.action === "ALLOW" ? "bg-green-100 text-green-800 border-green-200" :
                            "bg-red-100 text-red-800 border-red-200"
                          }>
                            {rule.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rule.roles.map((role, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Badge className={
                            rule.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" :
                            "bg-gray-100 text-gray-800 border-gray-200"
                          }>
                            {rule.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Users Tab */}
        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserX className="h-5 w-5" />
                <span>Blocked Users</span>
              </CardTitle>
              <CardDescription>
                Monitor and manage blocked user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No blocked users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked By</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.userEmail}
                            </div>
                            {user.ipAddress && (
                              <div className="text-xs text-muted-foreground font-mono">
                                IP: {user.ipAddress}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <span className="text-sm">{user.reason}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.blockedBy}</TableCell>
                        <TableCell>{formatDate(user.blockedAt)}</TableCell>
                        <TableCell>
                          <Badge className={
                            user.status === "ACTIVE" ? "bg-red-100 text-red-800 border-red-200" :
                            user.status === "EXPIRED" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                            "bg-green-100 text-green-800 border-green-200"
                          }>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium">{user.attempts}</span>
                            <span className="text-xs text-muted-foreground">attempts</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 