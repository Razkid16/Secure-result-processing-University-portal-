"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface BulkUploadProps {
  user: any
}

interface UploadResult {
  created: number
  errors: number
  errorDetails: Array<{
    student_id: number
    course_code: string
    error: string
  }>
  total: number
}

export function BulkUpload({ user }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [semester, setSemester] = useState("")
  const [session, setSession] = useState("")
  const [status, setStatus] = useState<"Draft" | "Published" | "Under Review">("Draft")
  const [facultyId, setFacultyId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
        setError("Please select a CSV file")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleUpload = async () => {
    if (!file || !semester || !session) {
      setError("Please fill in all required fields and select a CSV file")
      return
    }

    setUploading(true)
    setError("")
    setUploadResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setError("CSV file must have at least a header row and one data row")
        setUploading(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredHeaders = ['student_id', 'course_code', 'course_title', 'ca_score', 'exam_score']
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(', ')}`)
        setUploading(false)
        return
      }

      const results = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length < headers.length) continue

        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        // Validate and convert data
        const studentId = parseInt(row.student_id)
        const caScore = parseFloat(row.ca_score)
        const examScore = parseFloat(row.exam_score)

        if (isNaN(studentId) || isNaN(caScore) || isNaN(examScore)) {
          continue // Skip invalid rows
        }

        results.push({
          student_id: studentId,
          course_code: row.course_code,
          course_title: row.course_title,
          ca_score: caScore,
          exam_score: examScore,
          faculty_id: facultyId ? parseInt(facultyId) : undefined,
        })
      }

      if (results.length === 0) {
        setError("No valid results found in the CSV file")
        setUploading(false)
        return
      }

      const response = await fetch('/api/results/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          faculty_id: facultyId ? parseInt(facultyId) : undefined,
          semester,
          session,
          status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to upload results")
        setUploading(false)
        return
      }

      setUploadResult(data.data)
    } catch (error) {
      console.error("Upload error:", error)
      setError("Failed to process the file")
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `student_id,course_code,course_title,ca_score,exam_score
1,CSC101,Introduction to Computer Science,25,65
2,CSC101,Introduction to Computer Science,28,72
3,CSC102,Programming Fundamentals,22,68`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'results_template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (user.role !== "Administrator") {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>Only administrators can perform bulk uploads.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Bulk Results Upload</span>
          </CardTitle>
          <CardDescription>
            Upload academic results for multiple students at once using a CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadResult && (
            <Alert className={uploadResult.errors > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
              {uploadResult.errors > 0 ? (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription>
                <div className="font-medium">
                  Upload completed: {uploadResult.created} created, {uploadResult.errors} errors
                </div>
                {uploadResult.errorDetails.length > 0 && (
                  <div className="mt-2 text-sm">
                    <div className="font-medium">Errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {uploadResult.errorDetails.slice(0, 5).map((error, index) => (
                        <li key={index}>
                          Student {error.student_id} - {error.course_code}: {error.error}
                        </li>
                      ))}
                      {uploadResult.errorDetails.length > 5 && (
                        <li>... and {uploadResult.errorDetails.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="semester">Semester *</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="session">Session *</Label>
              <Input
                id="session"
                placeholder="e.g., 2023/2024"
                value={session}
                onChange={(e) => setSession(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="faculty_id">Faculty ID (Optional)</Label>
              <Input
                id="faculty_id"
                placeholder="Leave empty to use your ID"
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="file">CSV File *</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              File must contain: student_id, course_code, course_title, ca_score, exam_score
            </p>
          </div>

          <div className="flex space-x-4">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !file || !semester || !session}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Results"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 