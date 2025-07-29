import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Key, Eye, EyeOff, Shield, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface LecturerKeysProps {
  user: any
}

export function LecturerKeys({ user }: LecturerKeysProps) {
  const [isKeysDialogOpen, setIsKeysDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isCreatePasswordDialogOpen, setIsCreatePasswordDialogOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const checkLecturerPassword = async () => {
    try {
      setIsPasswordLoading(true)
      const response = await fetch('/api/digital-signatures/check-lecturer-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.hasPassword) {
          // Lecturer has a password, show password input dialog
          setIsPasswordDialogOpen(true)
        } else {
          // First time, show create password dialog
          setIsCreatePasswordDialogOpen(true)
        }
      } else {
        toast.error("Failed to check password status")
      }
    } catch (error) {
      console.error('Error checking password status:', error)
      toast.error("Failed to check password status")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const verifyPassword = async (enteredPassword: string) => {
    try {
      setIsPasswordLoading(true)
      const response = await fetch('/api/digital-signatures/verify-lecturer-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: enteredPassword }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("Password verified successfully")
          setIsPasswordDialogOpen(false)
          setPassword('')
          setPasswordError('')
          // Now load and show the private key
          await loadAndShowPrivateKey()
        } else {
          setPasswordError(data.error || "Incorrect password")
        }
      } else {
        const errorData = await response.json()
        setPasswordError(errorData.error || "Failed to verify password")
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setPasswordError("Failed to verify password")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const createPassword = async (newPassword: string) => {
    try {
      setIsPasswordLoading(true)
      const response = await fetch('/api/digital-signatures/create-lecturer-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success("Password created successfully")
          setIsCreatePasswordDialogOpen(false)
          setNewPassword('')
          setConfirmNewPassword('')
          setPasswordError('')
          // Now load and show the private key
          await loadAndShowPrivateKey()
        } else {
          setPasswordError(data.error || "Failed to create password")
        }
      } else {
        const errorData = await response.json()
        setPasswordError(errorData.error || "Failed to create password")
      }
    } catch (error) {
      console.error('Error creating password:', error)
      setPasswordError("Failed to create password")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const loadAndShowPrivateKey = async () => {
    try {
      setIsLoading(true)
      
      // Fetch lecturer's private key from the API
      const response = await fetch('/api/digital-signatures/lecturer-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPrivateKey(data.data.privateKey || '')
          setIsKeysDialogOpen(true)
        } else {
          toast.error(data.error || "Failed to load your private key")
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to load your private key")
      }
    } catch (error) {
      console.error('Error loading lecturer private key:', error)
      toast.error("Failed to load your private key")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowKeys = async () => {
    await checkLecturerPassword()
  }

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError("Password is required")
      return
    }
    await verifyPassword(password)
  }

  const handleCreatePassword = async () => {
    if (!newPassword.trim()) {
      setPasswordError("Password is required")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }
    await createPassword(newPassword)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Private Key</span>
          </CardTitle>
          <CardDescription>
            View your private key generated by the administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleShowKeys} 
            variant="outline" 
            className="w-full"
            disabled={isLoading || isPasswordLoading}
          >
            {isLoading || isPasswordLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Show My Keys
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Password Verification Dialog */}
      {isPasswordDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Enter Password</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsPasswordDialogOpen(false)
                    setPassword('')
                    setPasswordError('')
                  }}
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Enter your password to view your private key.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false)
                      setPassword('')
                      setPasswordError('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordSubmit}
                    disabled={isPasswordLoading}
                  >
                    {isPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Password'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Password Dialog */}
      {isCreatePasswordDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Create Password</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreatePasswordDialogOpen(false)
                    setNewPassword('')
                    setConfirmNewPassword('')
                    setPasswordError('')
                  }}
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-600 mb-4">
                This is your first time accessing your private key. Please create a password to protect it.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmNewPassword">Confirm Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreatePassword()}
                  />
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreatePasswordDialogOpen(false)
                      setNewPassword('')
                      setConfirmNewPassword('')
                      setPasswordError('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePassword}
                    disabled={isPasswordLoading}
                  >
                    {isPasswordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Password'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Private Key Dialog */}
      {isKeysDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Your Private Key</span>
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsKeysDialogOpen(false)
                    setShowPrivateKey(false)
                  }}
                >
                  ×
                </Button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Your private key generated by the administrator. Keep it secure and never share it with anyone.
              </p>

              <div className="space-y-6">
                {/* Private Key Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Private Key (Keep Secure)</Label>
                    <Button
                      variant="outline"
                      size="sm"
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
                  <Textarea
                    value={privateKey}
                    readOnly
                    className={`font-mono text-xs ${showPrivateKey ? 'bg-gray-50' : 'bg-gray-100'}`}
                    rows={12}
                    style={{
                      filter: showPrivateKey ? 'none' : 'blur(3px)',
                      userSelect: showPrivateKey ? 'text' : 'none'
                    }}
                  />
                  <p className="text-xs text-gray-600">
                    This is your private key. Use it to sign documents and decrypt files. Never share this key with anyone.
                  </p>
                </div>

                {/* Security Notice */}
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Notice:</strong> Your private key is the most sensitive piece of information. 
                    Keep it secure and never share it with anyone. If you suspect your private key has been compromised, 
                    contact the administrator immediately to generate new keys.
                  </AlertDescription>
                </Alert>

                {/* Close Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setIsKeysDialogOpen(false)
                      setShowPrivateKey(false)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 