"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Lock, User, AlertCircle, Crown, GraduationCap, BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setDebugInfo("")

    console.log("Submitting login form...")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      console.log("Response status:", response.status)

      let data: any
      try {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("Non-JSON response:", text.slice(0, 200))
          data = { error: "Unexpected server error." }
        }
      } catch (err) {
        console.error("Failed to parse response:", err)
        data = { error: "Malformed server response." }
      }

      console.log("Response data:", data)

      if (data.success) {
        console.log("Login successful, session token received:", !!data.sessionToken)
        setDebugInfo(`Login successful! Welcome ${data.user.name}`)

        setTimeout(async () => {
          try {
            const testResponse = await fetch("/api/auth/me", {
              credentials: "include",
            })
            console.log("Test auth check status:", testResponse.status)

            if (testResponse.ok) {
              console.log("Cookie verified, redirecting to dashboard")
              router.push("/dashboard")
            } else {
              console.log("Cookie not set properly, trying manual redirect")
              document.cookie = `secure_session=${data.sessionToken}; path=/; max-age=1800; samesite=lax`
              setTimeout(() => {
                window.location.href = "/dashboard"
              }, 500)
            }
          } catch (error) {
            console.error("Auth check failed:", error)
            setError("Session verification failed")
          }
        }, 100)
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (userType: string) => {
    const credentials = {
      admin: { email: "admin@example.com", password: "Admin@123" },
      faculty: { email: "john.faculty@example.com", password: "Faculty@123" },
      student: { email: "jane.student@example.com", password: "Student@123" },
    }

    const cred = credentials[userType as keyof typeof credentials]
    if (cred) {
      setEmail(cred.email)
      setPassword(cred.password)
    }
  }

  const rolePermissions = {
    Administrator: {
      icon: Crown,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      permissions: [
        "✅ Full system access",
        "✅ Manage all users",
        "✅ View/Edit/Delete all results",
        "✅ System configuration",
        "✅ View audit logs",
        "✅ Export all data",
        "✅ Bulk operations",
      ],
    },
    Faculty: {
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      permissions: [
        "✅ View/Edit results for their courses",
        "✅ Add new results",
        "✅ Export course data",
        "✅ View audit logs",
        "❌ Delete results",
        "❌ Manage users",
        "❌ System configuration",
      ],
    },
    Student: {
      icon: BookOpen,
      color: "bg-green-100 text-green-800 border-green-200",
      permissions: [
        "✅ View own results only",
        "✅ View course information",
        "❌ Edit any results",
        "❌ View other students' data",
        "❌ Export data",
        "❌ Administrative functions",
        "❌ Audit logs access",
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tech-U Secure Portal</h1>
          <p className="text-gray-600 mt-2">Secured Communication in Academic Environments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Secure Login</span>
              </CardTitle>
              <CardDescription>Enter your credentials to access the secure academic portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {debugInfo && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{debugInfo}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@tech-u.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : "Secure Login"}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-sm mb-3">Demo Credentials:</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-transparent justify-start"
                    onClick={() => fillDemoCredentials("admin")}
                    type="button"
                  >
                    <Crown className="h-3 w-3 mr-2 text-purple-600" />
                    <strong>Administrator:</strong> admin@tech-u.edu.ng
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-transparent justify-start"
                    onClick={() => fillDemoCredentials("faculty")}
                    type="button"
                  >
                    <GraduationCap className="h-3 w-3 mr-2 text-blue-600" />
                    <strong>Faculty:</strong> s.johnson@tech-u.edu.ng
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-transparent justify-start"
                    onClick={() => fillDemoCredentials("student")}
                    type="button"
                  >
                    <BookOpen className="h-3 w-3 mr-2 text-green-600" />
                    <strong>Student:</strong> j.doe@tech-u.edu.ng
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Password for all: <code className="bg-gray-200 px-1 rounded">SecureAdmin123!</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Role-Based Access Control</h2>

            {Object.entries(rolePermissions).map(([role, config]) => {
              const IconComponent = config.icon
              return (
                <Card key={role} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <IconComponent className="h-5 w-5" />
                      <span>{role}</span>
                      <Badge className={config.color}>{role}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {config.permissions.map((permission, index) => (
                        <div key={index} className="text-sm flex items-center">
                          <span className={permission.startsWith("✅") ? "text-green-700" : "text-red-600"}>
                            {permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Role-Based Security</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Audit Trail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
