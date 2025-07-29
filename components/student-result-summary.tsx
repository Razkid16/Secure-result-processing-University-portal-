"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  GraduationCap,
  Target,
  BarChart3
} from "lucide-react"

interface AcademicResult {
  id: number
  student_id: number
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  grade_point: number
  faculty_id: number
  status: "Draft" | "Published" | "Under Review"
  created_at: string
  updated_at: string
  credits?: number
}

interface StudentResultSummaryProps {
  user: {
    id: number
    email: string
    name: string
    role: string
    department: string
  }
}

export default function StudentResultSummary({ user }: StudentResultSummaryProps) {
  const [results, setResults] = useState<AcademicResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({
    totalCourses: 0,
    publishedResults: 0,
    draftResults: 0,
    averageScore: 0,
    averageGradePoint: 0,
    highestScore: 0,
    lowestScore: 0,
    gradeDistribution: {} as Record<string, number>,
    semesterBreakdown: {} as Record<string, number>,
  })

  useEffect(() => {
    loadResults()
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      calculateSummary()
    }
  }, [results])

  const loadResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/results?student_id=${user.id}`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Extra safety: filter to only show published results for students
          const allResults = data.data || []
          const publishedResults = allResults.filter((result: AcademicResult) => result.status === "Published")
          setResults(publishedResults)
        } else {
          setError("Failed to load results")
        }
      } else {
        setError("Failed to load results")
      }
    } catch (error) {
      console.error("Failed to load results:", error)
      setError("Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = () => {
    const published = results.filter(r => r.status === "Published")
    const drafts = results.filter(r => r.status === "Draft")
    
    console.log('Raw results:', results);
    console.log('Published results:', published);
    
    // Calculate total_score if it's not present
    const processedPublished = published.map(r => {
      const total_score = r.total_score || (r.ca_score + r.exam_score);
      
      // Calculate grade point from grade if it's missing or incorrect
      let grade_point = r.grade_point;
      if (!grade_point || isNaN(grade_point) || grade_point === 0) {
        switch (r.grade) {
          case 'A': grade_point = 5.0; break;
          case 'B': grade_point = 4.0; break;
          case 'C': grade_point = 3.0; break;
          case 'D': grade_point = 2.0; break;
          case 'E': grade_point = 1.0; break;
          case 'F': grade_point = 0.0; break;
          default: grade_point = 0.0;
        }
      }
      
      return { ...r, total_score, grade_point };
    });
    
    // Filter out invalid scores and ensure they are numbers
    const scores = processedPublished
      .map(r => r.total_score)
      .filter(score => typeof score === 'number' && !isNaN(score) && score >= 0)
    
    const gradePoints = processedPublished
      .map(r => r.grade_point)
      .filter(point => typeof point === 'number' && !isNaN(point) && point >= 0)
    
    const gradeDistribution: Record<string, number> = {}
    const semesterBreakdown: Record<string, number> = {}
    
    processedPublished.forEach(result => {
      gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1
      semesterBreakdown[result.semester] = (semesterBreakdown[result.semester] || 0) + 1
    })

    // Calculate averages with proper error handling
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
    
    const averageGradePoint = gradePoints.length > 0 
      ? Math.round((gradePoints.reduce((a, b) => a + b, 0) / gradePoints.length) * 100) / 100
      : 0
    
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

    console.log('Summary calculation debug:');
    console.log('- Published results:', published.length);
    console.log('- Processed published:', processedPublished);
    console.log('- Valid scores:', scores.length);
    console.log('- Scores array:', scores);
    console.log('- Average score:', averageScore);
    console.log('- Grade points array:', gradePoints);
    console.log('- Average grade point:', averageGradePoint);
    console.log('- Grade distribution:', gradeDistribution);
    console.log('- Highest score:', highestScore);
    console.log('- Lowest score:', lowestScore);
    console.log('- Final summary object:', {
      totalCourses: results.length,
      publishedResults: published.length,
      draftResults: drafts.length,
      averageScore,
      averageGradePoint,
      highestScore,
      lowestScore,
      gradeDistribution,
      semesterBreakdown,
    });

    setSummary({
      totalCourses: results.length,
      publishedResults: published.length,
      draftResults: drafts.length,
      averageScore,
      averageGradePoint,
      highestScore,
      lowestScore,
      gradeDistribution,
      semesterBreakdown,
    })
  }

  const getGradeColor = (grade: string) => {
    const colors = {
      "A": "bg-green-100 text-green-800 border-green-200",
      "B": "bg-blue-100 text-blue-800 border-blue-200",
      "C": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "D": "bg-orange-100 text-orange-800 border-orange-200",
      "E": "bg-red-100 text-red-800 border-red-200",
      "F": "bg-red-100 text-red-800 border-red-200",
    }
    return colors[grade as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      "Published": "bg-green-100 text-green-800 border-green-200",
      "Draft": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Under Review": "bg-blue-100 text-blue-800 border-blue-200",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getPerformanceLevel = (averageScore: number) => {
    // Handle NaN and invalid values
    if (isNaN(averageScore) || averageScore === 0) {
      return { level: "No Data", color: "text-gray-600", icon: AlertCircle }
    }
    
    if (averageScore >= 80) return { level: "Excellent", color: "text-green-600", icon: Award }
    if (averageScore >= 70) return { level: "Good", color: "text-blue-600", icon: TrendingUp }
    if (averageScore >= 60) return { level: "Average", color: "text-yellow-600", icon: Target }
    return { level: "Needs Improvement", color: "text-red-600", icon: AlertCircle }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Academic Summary
          </CardTitle>
          <CardDescription>Loading your academic results...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Loading your results...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Academic Summary
          </CardTitle>
          <CardDescription>Error loading results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <button onClick={loadResults} className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const performanceLevel = getPerformanceLevel(summary.averageScore)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Academic Summary
        </CardTitle>
        <CardDescription>
          Your academic performance overview ({summary.totalCourses} courses)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                    <p className="text-2xl font-bold">{summary.totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold">{summary.publishedResults}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Draft</p>
                    <p className="text-2xl font-bold">{summary.draftResults}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold">
                      {isNaN(summary.averageScore) ? '0' : summary.averageScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Level */}
          {summary.publishedResults > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Performance Level</h3>
                    <p className={`text-2xl font-bold ${performanceLevel.color}`}>
                      {performanceLevel.level}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Average Score: {isNaN(summary.averageScore) ? '0' : summary.averageScore}% | GPA: {isNaN(summary.averageGradePoint) ? '0.0' : summary.averageGradePoint}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${performanceLevel.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <performanceLevel.icon className="h-8 w-8" />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Score Range</span>
                    <span>
                      {isNaN(summary.lowestScore) ? '0' : summary.lowestScore}% - {isNaN(summary.highestScore) ? '0' : summary.highestScore}%
                    </span>
                  </div>
                  <Progress value={isNaN(summary.averageScore) ? 0 : summary.averageScore} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grade Distribution */}
          {Object.keys(summary.gradeDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(summary.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="text-center">
                      <Badge className={getGradeColor(grade)}>
                        {grade}
                      </Badge>
                      <p className="text-2xl font-bold mt-1">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((count / summary.publishedResults) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(0, 5).map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{result.course_code}</p>
                              <p className="text-sm text-muted-foreground">{result.course_title}</p>
                            </div>
                          </TableCell>
                          <TableCell>{result.semester}</TableCell>
                          <TableCell>
                            <div className="text-right">
                              <p className="font-medium">{result.total_score}%</p>
                              <p className="text-xs text-muted-foreground">
                                CA: {result.ca_score} | Exam: {result.exam_score}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getGradeColor(result.grade)}>
                              {result.grade} ({result.grade_point})
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.credits !== undefined ? (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {result.credits}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No results available</p>
              <p className="text-sm">Your academic results will appear here once they are published</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 