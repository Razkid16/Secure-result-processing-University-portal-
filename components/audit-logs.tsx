"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Filter, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Trash2, Download } from "lucide-react"

interface AuditLog {
  id: number
  user_id: number | null
  user_email: string
  user_name: string | null
  action: string
  resource: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  status: "SUCCESS" | "FAILED" | "BLOCKED"
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  details: string | null
  created_at: string
}

interface AuditLogsProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export function AuditLogs({ user }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: "",
    status: "",
    riskLevel: "",
    userEmail: "",
  })
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    blocked: 0,
    highRisk: 0,
    critical: 0,
    medium: 0,
    low: 0,
    recentActivity: 0,
    successRate: "0",
    failureRate: "0",
  })
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [clearingLogs, setClearingLogs] = useState(false)
  const [clearError, setClearError] = useState("")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportPassword, setExportPassword] = useState("")
  const [exportingLogs, setExportingLogs] = useState(false)
  const [exportError, setExportError] = useState("")

  const itemsPerPage = 20

  useEffect(() => {
    loadAuditLogs()
  }, [currentPage])

  useEffect(() => {
    loadAuditStats()
  }, [])

  // Debounced filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when filters change
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters])

  const loadAuditStats = async () => {
    try {
      const response = await fetch('/api/audit/stats', {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats({
            total: data.data.total || 0,
            success: data.data.success || 0,
            failed: data.data.failed || 0,
            blocked: data.data.blocked || 0,
            highRisk: data.data.highRisk || 0,
            critical: data.data.critical || 0,
            medium: data.data.medium || 0,
            low: data.data.low || 0,
            recentActivity: data.data.recentActivity || 0,
            successRate: data.data.successRate || "0",
            failureRate: data.data.failureRate || "0",
          })
        }
      }
    } catch (error) {
      console.error("Failed to load audit stats:", error)
    }
  }

  const [allLogs, setAllLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      
      // Load all logs for client-side filtering
      const response = await fetch(`/api/audit/logs?limit=10000&offset=0`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to load audit logs")
      }

      const data = await response.json()
      
      if (data.success) {
        setAllLogs(data.data)
        applyFilters(data.data)
      } else {
        setError("Failed to load audit logs")
      }
    } catch (error) {
      console.error("Error loading audit logs:", error)
      setError("Failed to load audit logs")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (logs: AuditLog[]) => {
    setFiltering(true)
    const filtered = logs.filter((log) => {
      if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) return false
      if (filters.status && filters.status !== "all" && log.status !== filters.status) return false
      if (filters.riskLevel && filters.riskLevel !== "all" && log.risk_level !== filters.riskLevel) return false
      if (filters.userEmail && !log.user_email.toLowerCase().includes(filters.userEmail.toLowerCase())) return false
      return true
    })

    setFilteredLogs(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setFiltering(false)
  }

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters(allLogs)
  }, [filters, allLogs])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "BLOCKED":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    const colors = {
      LOW: "bg-green-100 text-green-800 border-green-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
      HIGH: "bg-orange-100 text-orange-800 border-orange-200",
      CRITICAL: "bg-red-100 text-red-800 border-red-200",
    }
    return <Badge className={colors[riskLevel as keyof typeof colors] || colors.LOW}>{riskLevel}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const openDetailModal = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailModalOpen(true)
  }

  const closeDetailModal = () => {
    setSelectedLog(null)
    setIsDetailModalOpen(false)
  }

  const handleClearLogs = async () => {
    if (!adminPassword.trim()) {
      setClearError("Please enter your password")
      return
    }

    setClearingLogs(true)
    setClearError("")

    try {
      const response = await fetch('/api/audit/logs/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Clear the logs from state
        setLogs([])
        setStats({
          total: 0,
          success: 0,
          failed: 0,
          blocked: 0,
          highRisk: 0,
          critical: 0,
          medium: 0,
          low: 0,
          recentActivity: 0,
          successRate: "0",
          failureRate: "0",
        })
        setCurrentPage(1)
        setTotalPages(1)
        
        // Close dialog and reset form
        setIsClearDialogOpen(false)
        setAdminPassword("")
        
        // Show success message (you could add a toast here)
        console.log("All audit logs cleared successfully")
      } else {
        setClearError(data.error || "Failed to clear logs")
      }
    } catch (error) {
      console.error("Error clearing logs:", error)
      setClearError("An error occurred while clearing logs")
    } finally {
      setClearingLogs(false)
    }
  }

  const openClearDialog = () => {
    setAdminPassword("")
    setClearError("")
    setIsClearDialogOpen(true)
  }

  const exportLogsToCSV = async () => {
    if (!exportPassword.trim()) {
      setExportError("Please enter your password")
      return
    }

    setExportingLogs(true)
    setExportError("")

    try {
      // Build query parameters from current filters
      const params = new URLSearchParams()
      if (filters.action && filters.action !== 'all') params.append('action', filters.action)
      if (filters.status && filters.status !== 'all') params.append('status', filters.status)
      if (filters.riskLevel && filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel)
      if (filters.userEmail) params.append('userEmail', filters.userEmail)

      // Call the API endpoint with password
      const response = await fetch(`/api/audit/logs/export?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: exportPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Close dialog and reset form
      setIsExportDialogOpen(false)
      setExportPassword("")
      
      console.log('Audit logs exported successfully')
    } catch (error) {
      console.error('Error exporting logs:', error)
      setExportError(error instanceof Error ? error.message : 'Failed to export logs')
    } finally {
      setExportingLogs(false)
    }
  }

  const openExportDialog = () => {
    setExportPassword("")
    setExportError("")
    setIsExportDialogOpen(true)
  }

  // Get paginated logs for display
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading audit logs...</span>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xs text-green-600">Success Rate: {stats.successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.success.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successful</p>
            <p className="text-xs text-red-600">Failed: {stats.failed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.blocked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Blocked</p>
            <p className="text-xs text-muted-foreground">Failure Rate: {stats.failureRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.highRisk.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-xs text-red-600">Critical: {stats.critical.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold text-blue-600">{stats.recentActivity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold text-yellow-600">{stats.medium.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Medium Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold text-green-600">{stats.low.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Action</label>
              <Input
                placeholder="Filter by action..."
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Risk Level</label>
              <Select value={filters.riskLevel} onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">User Email</label>
              <Input
                placeholder="Filter by user..."
                value={filters.userEmail}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                {user.role === "Administrator"
                  ? "System-wide activity and security audit trail"
                  : "Your course activity audit trail"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => { loadAuditLogs(); loadAuditStats(); }} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={openExportDialog} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {user.role === "Administrator" && (
                <Button onClick={openClearDialog} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Logs
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtering ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-muted-foreground">Filtering...</span>
              </div>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_name || log.user_email}</div>
                          <div className="text-xs text-muted-foreground">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.action}</div>
                      </TableCell>
                      <TableCell>
                        {log.resource && (
                          <div>
                            <div className="font-medium">{log.resource}</div>
                            {log.resource_id && (
                              <div className="text-xs text-muted-foreground">ID: {log.resource_id}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskLevelBadge(log.risk_level)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.ip_address ? truncateText(log.ip_address, 15) : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDetailModal(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  <p className="text-sm">{selectedLog.user_name || selectedLog.user_email}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <p className="text-sm font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="text-sm font-medium">{selectedLog.status}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
                  <div className="mt-1">
                    {getRiskLevelBadge(selectedLog.risk_level)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="text-sm font-mono">{selectedLog.ip_address || "N/A"}</p>
                </div>
              </div>
              
              {selectedLog.resource && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource</label>
                  <p className="text-sm">{selectedLog.resource}</p>
                  {selectedLog.resource_id && (
                    <p className="text-xs text-muted-foreground">ID: {selectedLog.resource_id}</p>
                  )}
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <p className="text-sm font-mono text-xs break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Details</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedLog.details ? (
                    <pre className="text-sm whitespace-pre-wrap break-words">
                      {typeof selectedLog.details === 'object' 
                        ? JSON.stringify(selectedLog.details, null, 2)
                        : selectedLog.details
                      }
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">No additional details available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Logs Confirmation Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>Export Audit Logs</span>
            </DialogTitle>
            <DialogDescription>
              This will export all audit logs to a CSV file. 
              Please enter your password to confirm the export.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="export-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="export-password"
                type="password"
                placeholder="Enter your password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    exportLogsToCSV()
                  }
                }}
              />
            </div>
            
            {exportError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsExportDialogOpen(false)
                  setExportPassword("")
                  setExportError("")
                }}
                disabled={exportingLogs}
              >
                Cancel
              </Button>
              <Button
                onClick={exportLogsToCSV}
                disabled={exportingLogs || !exportPassword.trim()}
              >
                {exportingLogs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Logs Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <span>Clear All Audit Logs</span>
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete all audit logs from the system. 
              This action cannot be undone. Please enter your admin password to confirm.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium">
                Admin Password
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleClearLogs()
                  }
                }}
              />
            </div>
            
            {clearError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{clearError}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsClearDialogOpen(false)
                  setAdminPassword("")
                  setClearError("")
                }}
                disabled={clearingLogs}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearLogs}
                disabled={clearingLogs || !adminPassword.trim()}
              >
                {clearingLogs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Logs
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 