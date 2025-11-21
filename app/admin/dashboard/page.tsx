"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Student } from "@/lib/types"

export default function AdminDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    university: "",
  })

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (!storedUserId) {
      router.push("/admin/login")
      return
    }
    setUserId(storedUserId)
    fetchStats(storedUserId)
    fetchStudents(storedUserId)
  }, [router])

  const fetchStats = async (uid: string) => {
    try {
      const response = await fetch(`/api/admin/stats?userId=${uid}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }

  const fetchStudents = async (uid: string, filterOverride?: any) => {
    setIsLoading(true)
    try {
      const currentFilters = filterOverride || filters
      const params = new URLSearchParams({ userId: uid })
      if (currentFilters.status !== "all") params.append("status", currentFilters.status) // Updated condition to exclude "all"
      if (currentFilters.search) params.append("search", currentFilters.search)
      if (currentFilters.university) params.append("university", currentFilters.university)

      const response = await fetch(`/api/admin/students?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (studentId: string, action: "approve" | "reject", reason?: string) => {
    if (!userId) return

    try {
      const response = await fetch("/api/admin/students/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, studentId, action, reason }),
      })

      if (response.ok) {
        alert(`Student ${action === "approve" ? "approved" : "rejected"} successfully`)
        fetchStudents(userId)
        fetchStats(userId)
      } else {
        const error = await response.json()
        alert(error.error || "Action failed")
      }
    } catch (error) {
      console.error("[v0] Review error:", error)
      alert("Action failed")
    }
  }

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (!userId || selectedStudents.size === 0) return

    const confirmed = confirm(`Are you sure you want to ${action} ${selectedStudents.size} students?`)
    if (!confirmed) return

    try {
      const response = await fetch("/api/admin/students/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          studentIds: Array.from(selectedStudents),
          action,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Bulk action completed: ${data.successful} successful, ${data.failed} failed`)
        setSelectedStudents(new Set())
        fetchStudents(userId)
        fetchStats(userId)
      }
    } catch (error) {
      console.error("[v0] Bulk action error:", error)
      alert("Bulk action failed")
    }
  }

  const handleExport = async () => {
    if (!userId) return

    try {
      const params = new URLSearchParams({ userId })
      if (filters.status !== "all") params.append("status", filters.status) // Updated condition to exclude "all"

      window.open(`/api/admin/students/export?${params}`, "_blank")
    } catch (error) {
      console.error("[v0] Export error:", error)
      alert("Export failed")
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (userId) {
      fetchStudents(userId, newFilters)
    }
  }

  if (isLoading && !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <p className="text-muted-foreground">Quick overview of student verifications</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="text-3xl">{stats.students.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Verified</CardDescription>
                <CardTitle className="text-3xl text-green-600">{stats.students.verified}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Review</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">
                  {stats.students.pending + stats.students.underReview}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rejected</CardDescription>
                <CardTitle className="text-3xl text-red-600">{stats.students.rejected}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Student Verifications</CardTitle>
            <CardDescription>Review and manage student KYC submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search by name, email, student ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="max-w-xs"
              />
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem> // Updated value to "all"
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStudents.size > 0 && (
              <div className="flex gap-2">
                <Button onClick={() => handleBulkAction("approve")} variant="default">
                  Approve Selected ({selectedStudents.size})
                </Button>
                <Button onClick={() => handleBulkAction("reject")} variant="destructive">
                  Reject Selected ({selectedStudents.size})
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedStudents)
                        if (checked) {
                          newSelected.add(student.id)
                        } else {
                          newSelected.delete(student.id)
                        }
                        setSelectedStudents(newSelected)
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{student.full_name}</p>
                        <Badge
                          variant={
                            student.verification_status === "verified"
                              ? "default"
                              : student.verification_status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {student.verification_status}
                        </Badge>
                        {student.face_match_score && (
                          <Badge variant="outline">Score: {student.face_match_score}%</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.email} • {student.student_id} • {student.university}
                      </p>
                    </div>
                    {(student.verification_status === "pending" || student.verification_status === "under_review") && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleReview(student.id, "approve")}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt("Rejection reason:")
                            if (reason) handleReview(student.id, "reject", reason)
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
