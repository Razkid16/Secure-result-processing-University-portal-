import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Key, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface FacultyKeysProps {
  user: any
}

export function FacultyKeys({ user }: FacultyKeysProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isCreatePasswordDialogOpen, setIsCreatePasswordDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [privateKey, setPrivateKey] = useState('')
  const [isKeysLoading, setIsKeysLoading] = useState(false)

  const checkFacultyPassword = async () => {
    try {
      setIsPasswordLoading(true)
      setPasswordError('')

      const response = await fetch('/api/digital-signatures/check-faculty-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        if (data.hasPassword) {
          // Faculty has a password, show password input dialog
          setIsPasswordDialogOpen(true)
        } else {
          // Faculty doesn't have a password, show create password dialog
          setIsCreatePasswordDialogOpen(true)
        }
      } else {
        toast.error(data.error || "Failed to check password status")
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
      setPasswordError('')

      const response = await fetch('/api/digital-signatures/verify-faculty-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: enteredPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Password verified successfully, load and show private key
        await loadAndShowPrivateKey()
      } else {
        setPasswordError(data.error || "Incorrect password")
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setPasswordError("Failed to verify password")
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const createPassword = async (newPassword: string) => {
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long")
      return
    }

    try {
      setIsPasswordLoading(true)
      setPasswordError('')

      const response = await fetch('/api/digital-signatures/create-faculty-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Password created successfully, load and show private key
        await loadAndShowPrivateKey()
      } else {
        setPasswordError(data.error || "Failed to create password")
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
      setIsKeysLoading(true)

      const response = await fetch('/api/digital-signatures/faculty-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success && data.data.privateKey) {
        setPrivateKey(data.data.privateKey)
        setShowPrivateKey(true)
        setIsPasswordDialogOpen(false)
        setIsCreatePasswordDialogOpen(false)
        setPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setPasswordError('')
        toast.success("Private key loaded successfully")
      } else {
        toast.error("Failed to retrieve your private key")
      }
    } catch (error) {
      console.error('Error loading private key:', error)
      toast.error("Failed to load private key")
    } finally {
      setIsKeysLoading(false)
    }
  }

  const handleShowKeys = async () => {
    await checkFacultyPassword()
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Private Key</span>
          </CardTitle>
          <CardDescription>
            View your assigned private key for secure operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleShowKeys}
            disabled={isPasswordLoading}
            className="w-full"
          >
            {isPasswordLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Show Private Key
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Display Private Key After Password Verification */}
      {showPrivateKey && privateKey && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Your Private Key (Password Protected)</span>
            </CardTitle>
            <CardDescription>
              Your private key is now visible after password verification. Keep it secure and don't share it with anyone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Password Verified - Key Visible
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPrivateKey(false);
                    setPrivateKey('');
                  }}
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide Key
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Your Private Key (Keep Secure)</Label>
                <Textarea
                  value={privateKey}
                  readOnly
                  className="font-mono text-xs bg-gray-50"
                  rows={12}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Input Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Enter Password</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter your private key password to view your assigned private key.
            </p>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={passwordError ? "border-red-500" : ""}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    verifyPassword(password)
                  }
                }}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyPassword(password)}
                disabled={isPasswordLoading}
                className="flex-1"
              >
                {isPasswordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Password'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setPassword('');
                  setPasswordError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Password Dialog */}
      <Dialog open={isCreatePasswordDialogOpen} onOpenChange={setIsCreatePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Create Password</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This is your first time accessing your private key. Please create a password to protect it.
            </p>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                className={passwordError ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={passwordError ? "border-red-500" : ""}
              />
            </div>
            {passwordError && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (newPassword !== confirmNewPassword) {
                    setPasswordError("Passwords do not match")
                    return
                  }
                  createPassword(newPassword)
                }}
                disabled={isPasswordLoading}
                className="flex-1"
              >
                {isPasswordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Password'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatePasswordDialogOpen(false);
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setPasswordError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 