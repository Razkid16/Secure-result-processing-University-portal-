"use client"

import React, { useEffect, useState } from "react"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"

interface ApprovalLogResult {
  id: number
  student_id: number
  student_name?: string
  student_email?: string
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  grade_point: number
  status: "Published" | "Denied" | "Under Review" | "Draft"
  approval_notes?: string | null
  approved_by?: number | null
  approved_at?: string | null
  created_at: string
  updated_at: string
}

export default function ApprovalLog() {
  const [results, setResults] = useState<ApprovalLogResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/results/approval?history=1")
        const data = await res.json()
        if (data.success) {
          setResults(data.data)
        } else {
          setError(data.error || "Failed to load approval log")
        }
      } catch (err) {
        setError("Failed to load approval log")
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
  }, [])

  const getStatusBadge = (status: string) => {
    if (status === "Published") {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    }
    if (status === "Denied") {
      return <Badge className="bg-red-100 text-red-800">Denied</Badge>
    }
    if (status === "Under Review") {
      return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
    }
    if (status === "Draft") {
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
    }
    return <Badge>{status}</Badge>
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleString()
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Approval Log</CardTitle>
        <CardDescription>
          This table shows all results you have approved, denied, or modified as faculty.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : results.length === 0 ? (
          <div>No approved, denied, or modified results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Course</th>
                  <th className="px-4 py-2 text-left">Semester</th>
                  <th className="px-4 py-2 text-left">Session</th>
                  <th className="px-4 py-2 text-left">CA</th>
                  <th className="px-4 py-2 text-left">Exam</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Grade</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Decision Date</th>
                  <th className="px-4 py-2 text-left">Notes/Reason</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{r.student_name || `Student ${r.student_id}`}</div>
                        {r.student_email && (
                          <div className="text-sm text-gray-500">{r.student_email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{r.course_code} - {r.course_title}</td>
                    <td className="px-4 py-2">{r.semester}</td>
                    <td className="px-4 py-2">{r.session}</td>
                    <td className="px-4 py-2">{r.ca_score}</td>
                    <td className="px-4 py-2">{r.exam_score}</td>
                    <td className="px-4 py-2">{r.total_score}</td>
                    <td className="px-4 py-2">{r.grade} ({r.grade_point})</td>
                    <td className="px-4 py-2">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-2">{formatDate(r.approved_at)}</td>
                    <td className="px-4 py-2">{r.approval_notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 