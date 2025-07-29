"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Clock, AlertCircle, FileText, Eye, Shield, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface PendingResult {
  id: number
  student_name: string
  matric_number: string
  course_code: string
  course_title: string
  level: string
  semester: string
  session: string
  score: number
  grade: string
  status: "Pending" | "Published" | "Denied"
  faculty_id: number
  created_by: number
  created_at: string
  approval_notes?: string
  approved_by?: number
  approved_at?: string
  faculty_note?: string
}

export function ResultApproval({ user }: { user: any }) {
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<PendingResult | null>(null)
  const [action, setAction] = useState<"approve" | "deny">("approve")
  const [reason, setReason] = useState("")
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [selectedNoteResult, setSelectedNoteResult] = useState<PendingResult | null>(null)
  
  // Private key verification states
  const [isPrivateKeyDialogOpen, setIsPrivateKeyDialogOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [privateKeyError, setPrivateKeyError] = useState("")
  const [isPrivateKeyLoading, setIsPrivateKeyLoading] = useState(false)
  const [pendingApprovalAction, setPendingApprovalAction] = useState<{result: PendingResult, action: "approve" | "deny"} | null>(null)

  const fetchPendingResults = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/results/approval")
      if (!response.ok) {
        throw new Error("Failed to fetch pending results")
      }
      const result = await response.json()
      if (result.success) {
        setPendingResults(result.data)
      } else {
        throw new Error(result.error || "Failed to fetch pending results")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedResult) return

    try {
      const response = await fetch("/api/results/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultId: selectedResult.id,
          action,
          reason: action === "deny" ? reason : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process result")
      }

      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setIsActionDialogOpen(false)
        setSelectedResult(null)
        setAction("approve")
        setReason("")
        fetchPendingResults()
      } else {
        throw new Error(result.error || "Failed to process result")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process result")
    }
  }

  const openActionDialog = (result: PendingResult, actionType: "approve" | "deny") => {
    // For faculty actions, require private key verification
    if (user.role === "Faculty") {
      setPendingApprovalAction({ result, action: actionType })
      setIsPrivateKeyDialogOpen(true)
      // Try to auto-fill private key if password is already verified
      setTimeout(() => checkAndAutoFillPrivateKeyForApproval(), 100)
    } else {
      // For other roles, proceed directly
      setSelectedResult(result)
      setAction(actionType)
      setIsActionDialogOpen(true)
    }
  }

  const openNoteDialog = (result: PendingResult) => {
    setSelectedNoteResult(result)
    setIsNoteDialogOpen(true)
  }

  const verifyPrivateKeyForApproval = async () => {
    if (!privateKey.trim()) {
      setPrivateKeyError("Private key is required")
      return
    }

    try {
      setIsPrivateKeyLoading(true)
      setPrivateKeyError("")

      // Fetch faculty's actual private key from the API to compare
      const response = await fetch('/api/digital-signatures/faculty-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.data.privateKey) {
        // Compare the entered private key with the stored one
        if (privateKey.trim() === data.data.privateKey.trim()) {
          // Private key verified successfully, proceed with approval action
          if (pendingApprovalAction) {
            setSelectedResult(pendingApprovalAction.result)
            setAction(pendingApprovalAction.action)
            setIsActionDialogOpen(true)
          }
          
          // Reset private key dialog
          setIsPrivateKeyDialogOpen(false)
          setPrivateKey("")
          setPendingApprovalAction(null)
          toast.success("Private key verified - proceeding with approval")
        } else {
          setPrivateKeyError("Incorrect private key")
        }
      } else {
        setPrivateKeyError("Failed to retrieve your private key")
      }
    } catch (error) {
      console.error('Error verifying private key:', error)
      setPrivateKeyError("Failed to verify private key")
    } finally {
      setIsPrivateKeyLoading(false)
    }
  }

  const checkAndAutoFillPrivateKeyForApproval = async () => {
    try {
      // First check if faculty has already verified their password
      const passwordCheckResponse = await fetch('/api/digital-signatures/check-faculty-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const passwordCheckData = await passwordCheckResponse.json()

      if (passwordCheckResponse.ok && passwordCheckData.hasPassword) {
        // Faculty has a password set, now try to auto-fill the private key
        const keysResponse = await fetch('/api/digital-signatures/faculty-keys', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        const keysData = await keysResponse.json()

        if (keysResponse.ok && keysData.success && keysData.data.privateKey) {
          // Auto-fill the private key field
          setPrivateKey(keysData.data.privateKey)
          setShowPrivateKey(true)
          toast.success("Private key auto-filled from verified session")
        }
      }
    } catch (error) {
      console.error('Error checking password status:', error)
      // Don't show error toast here as this is just an auto-fill attempt
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "Published":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>
      case "Denied":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  useEffect(() => {
    fetchPendingResults()
  }, [user.role])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Result Approval</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Result Approval</CardTitle>
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
              <FileText className="h-5 w-5" />
              {user.role === "Lecturer" ? "My Pending Results" : "Pending Results for Approval"}
            </CardTitle>
            <CardDescription>
              {user.role === "Lecturer" 
                ? "Results you've uploaded that are awaiting faculty approval"
                : "Results from lecturers in your department awaiting your approval"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pendingResults.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {user.role === "Lecturer" ? "No Pending Results" : "No Results Pending Approval"}
            </h3>
            <p className="text-gray-500">
              {user.role === "Lecturer" 
                ? "When you upload results, they will appear here for faculty approval."
                : "Results from lecturers in your department will appear here for approval."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-medium">{result.student_name}</h4>
                      <p className="text-sm text-gray-500">{result.matric_number}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p><strong>Course:</strong> {result.course_code} - {result.course_title}</p>
                      <p><strong>Level:</strong> {result.level} | <strong>Semester:</strong> {result.semester} | <strong>Session:</strong> {result.session}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.faculty_note && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNoteDialog(result)}
                        title="View lecturer's note"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {getStatusBadge(result.status)}
                    {user.role === "Faculty" && result.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openActionDialog(result, "approve")}
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionDialog(result, "deny")}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span><strong>Score:</strong> {result.score}%</span>
                    <span><strong>Grade:</strong> {result.grade}</span>
                  </div>
                  <span>Uploaded: {formatDate(result.created_at)}</span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve" ? "Approve Result" : "Deny Result"}
              </DialogTitle>
              <DialogDescription>
                {action === "approve" 
                  ? "Are you sure you want to approve this result? It will be published immediately."
                  : "Are you sure you want to deny this result? Please provide a reason."
                }
              </DialogDescription>
            </DialogHeader>
            {action === "deny" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Denial</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for denying this result..."
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction}
                className={action === "approve" 
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                  : "bg-red-600 hover:bg-red-700 text-white border-red-600"
                }
              >
                {action === "approve" ? "Approve" : "Deny"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Note Dialog */}
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lecturer's Note</DialogTitle>
              <DialogDescription>Note from the lecturer regarding this result</DialogDescription>
            </DialogHeader>
            {selectedNoteResult && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Result Information</Label>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div><strong>Student:</strong> {selectedNoteResult.student_name}</div>
                    <div><strong>Course:</strong> {selectedNoteResult.course_code} - {selectedNoteResult.course_title}</div>
                    <div><strong>Semester:</strong> {selectedNoteResult.semester} | <strong>Session:</strong> {selectedNoteResult.session}</div>
                    <div><strong>Score:</strong> {selectedNoteResult.score}% | <strong>Grade:</strong> {selectedNoteResult.grade}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lecturer's Note</Label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">{selectedNoteResult.faculty_note}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted On</Label>
                  <div className="mt-2 text-sm text-gray-600">
                    {formatDate(selectedNoteResult.created_at)}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Private Key Verification Dialog for Approval */}
        {isPrivateKeyDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Verify Private Key for Action</span>
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsPrivateKeyDialogOpen(false)
                      setPrivateKey("")
                      setPendingApprovalAction(null)
                      setPrivateKeyError("")
                    }}
                  >
                    ×
                  </Button>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Enter your assigned private key to {pendingApprovalAction?.action === "approve" ? "approve" : "deny"} this result.
                  {privateKey && showPrivateKey && (
                    <span className="text-green-600 font-medium"> Your private key has been auto-filled from your verified session.</span>
                  )}
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="approvalPrivateKey">Private Key</Label>
                    <div className="relative">
                      <Textarea
                        id="approvalPrivateKey"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="Enter your assigned private key"
                        className={`font-mono text-xs ${privateKeyError ? "border-red-500" : ""}`}
                        rows={6}
                        style={{
                          filter: showPrivateKey ? 'none' : 'blur(3px)',
                          userSelect: showPrivateKey ? 'text' : 'none'
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    {privateKeyError && (
                      <p className="text-red-500 text-sm mt-1">{privateKeyError}</p>
                    )}
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Notice:</strong> Your assigned private key is required to verify your identity before {pendingApprovalAction?.action === "approve" ? "approving" : "denying"} results. 
                      This ensures only authorized faculty can perform these actions.
                      {privateKey && showPrivateKey && (
                        <span className="block mt-2 text-green-700">
                          <strong>✓ Auto-filled:</strong> Your private key has been automatically filled from your previously verified session.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPrivateKeyDialogOpen(false)
                        setPrivateKey("")
                        setPendingApprovalAction(null)
                        setPrivateKeyError("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={verifyPrivateKeyForApproval}
                      disabled={isPrivateKeyLoading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isPrivateKeyLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Verifying...
                        </>
                      ) : (
                        'Verify & Proceed'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 