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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { Student } from "@/lib/types"

export default function StudentsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("unverified")
  const [filters, setFilters] = useState({
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
    fetchStudents(storedUserId)
  }, [router])

  const fetchStudents = async (uid: string, filterOverride?: any) => {
    setIsLoading(true)
    try {
      const currentFilters = filterOverride || filters
      const params = new URLSearchParams({ userId: uid })
      // Fetch all students, we'll filter by tab - increase limit to get all
      params.append("limit", "1000") // Get all students
      if (currentFilters.search) params.append("search", currentFilters.search)
      if (currentFilters.university) params.append("university", currentFilters.university)

      const response = await fetch(`/api/admin/students?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched students from API:", data.students?.length || 0)
        if (data.students && data.students.length > 0) {
          console.log("Sample student statuses:", data.students.slice(0, 3).map(s => ({
            name: s.full_name,
            status: s.verification_status
          })))
        }
        setStudents(data.students || [])
      } else {
        console.error("Failed to fetch students:", response.status)
      }
    } catch (error) {
      console.error("[v0] Error fetching students:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestReupload = async (studentId: string, field: "email" | "phone" | "student_id" | "university" | "ghana_card" | "selfie" | "id_document" | "full_name" | "program" | "level" | "face_verification", event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!userId) return

    try {
      const response = await fetch("/api/admin/students/request-reupload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, studentId, field }),
      })

      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] Failed to parse response as JSON:", parseError)
        console.error("[v0] Raw response:", responseText)
        toast.error(`Request reupload failed: ${response.status} ${response.statusText}`)
        return
      }

      if (response.ok) {
        toast.success(responseData.message || `${field.replace('_', ' ')} reupload requested successfully`)
        fetchStudents(userId)
      } else {
        console.error("[v0] Request reupload error response:", responseData)
        toast.error(responseData.error || responseData.message || `Request reupload failed (${response.status})`)
      }
    } catch (error) {
      console.error("[v0] Request reupload error:", error)
      toast.error("Request reupload failed: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleFieldVerification = async (studentId: string, field: "email" | "phone" | "student_id" | "university" | "ghana_card" | "selfie" | "id_document" | "full_name" | "program" | "level" | "face_verification", verified: boolean, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!userId) return

    try {
      const response = await fetch("/api/admin/students/verify-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, studentId, field, verified }),
      })

      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("[v0] Failed to parse response as JSON:", parseError)
        console.error("[v0] Raw response:", responseText)
        toast.error(`Verification failed: ${response.status} ${response.statusText}`)
        if (responseText) {
          toast.error(`Server response: ${responseText.substring(0, 100)}`)
        }
        return
      }

      if (response.ok) {
        toast.success(responseData.message || `${field.replace('_', ' ')} ${verified ? "verified" : "unverified"} successfully`)
        fetchStudents(userId)
      } else {
        console.error("[v0] Field verification error response:", responseData)
        console.error("[v0] Response status:", response.status)
        console.error("[v0] Response statusText:", response.statusText)
        console.error("[v0] Raw response text:", responseText)
        const errorMsg = responseData.error || responseData.message || `Verification failed (${response.status})`
        toast.error(errorMsg)
        if (responseData.details) {
          console.error("[v0] Error details:", responseData.details)
        }
      }
    } catch (error) {
      console.error("[v0] Field verification error:", error)
      toast.error("Verification failed: " + (error instanceof Error ? error.message : "Unknown error"))
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
        toast.success(`Student ${action === "approve" ? "approved" : "rejected"} successfully`)
        fetchStudents(userId)
        setExpandedStudent(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Action failed")
      }
    } catch (error) {
      console.error("[v0] Review error:", error)
      toast.error("Action failed")
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
      if (filters.status !== "all") params.append("status", filters.status)

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

          // Filter students by verification status
          const verifiedStudents = students.filter(
            (s) => s.verification_status === "verified"
          )
          // Include pending, under_review - anything that's not verified or rejected
          const unverifiedStudents = students.filter(
            (s) => {
              const status = s.verification_status
              // Debug: log status to check
              if (status === "pending") {
                console.log("Found pending student:", s.full_name, s.email, status)
              }
              return status === "pending" || status === "under_review"
            }
          )
          // Blocked/Rejected students
          const blockedStudents = students.filter(
            (s) => s.verification_status === "rejected"
          )
  
  // Debug info
  useEffect(() => {
    if (students.length > 0) {
      console.log("Total students:", students.length)
      console.log("By status:", {
        pending: students.filter(s => s.verification_status === "pending").length,
        verified: students.filter(s => s.verification_status === "verified").length,
        rejected: students.filter(s => s.verification_status === "rejected").length,
        under_review: students.filter(s => s.verification_status === "under_review").length,
      })
      console.log("Unverified count:", unverifiedStudents.length)
    }
  }, [students, unverifiedStudents.length])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Management</h2>
            <p className="text-muted-foreground">Review and manage student verifications</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Filter and search student verifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search by name, email, student ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="max-w-xs"
              />
            </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList>
                        <TabsTrigger value="unverified">
                          Unverified ({unverifiedStudents.length})
                        </TabsTrigger>
                        <TabsTrigger value="verified">
                          Verified ({verifiedStudents.length})
                        </TabsTrigger>
                        <TabsTrigger value="blocked">
                          Blocked ({blockedStudents.length})
                        </TabsTrigger>
                      </TabsList>

              {/* Unverified Tab */}
              <TabsContent value="unverified" className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p>Loading students...</p>
                  </div>
                ) : unverifiedStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No unverified students found</p>
                    <p className="text-xs mt-2">Total students loaded: {students.length}</p>
                    <p className="text-xs">Pending: {students.filter(s => s.verification_status === "pending").length}</p>
                    <p className="text-xs">Under Review: {students.filter(s => s.verification_status === "under_review").length}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unverifiedStudents.map((student) => (
                      <Card key={student.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{student.full_name}</h3>
                                    <Badge variant="secondary">{student.verification_status}</Badge>
                                    {student.face_match_score && (
                                      <Badge variant="outline">Face Match: {student.face_match_score}%</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {student.email} • {student.student_id} • {student.university}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setExpandedStudent(
                                    expandedStudent === student.id ? null : student.id
                                  )}
                                >
                                  {expandedStudent === student.id ? "Hide Details" : "View Details"}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(student.id, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Please provide a reason for blocking/rejecting this student:")
                                    if (reason && reason.trim()) {
                                      handleReview(student.id, "reject", reason.trim())
                                    } else if (reason !== null) {
                                      alert("Please provide a reason for blocking the student.")
                                    }
                                  }}
                                >
                                  Block/Reject
                                </Button>
                              </div>
                            </div>
                          </div>

                          {expandedStudent === student.id && (
                            <div className="p-6 space-y-6 bg-white">
                              {/* Personal Information */}
                              <div>
                                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                  Personal Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Full Name</p>
                                        <p className="font-medium">{student.full_name}</p>
                                        <Badge variant={(student as any).full_name_verified ? "default" : "secondary"} className="mt-1">
                                          {(student as any).full_name_verified ? "✓ Verified" : "Unverified"}
                                        </Badge>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={(student as any).full_name_verified ? "outline" : "default"}
                                        onClick={(e) => handleFieldVerification(student.id, "full_name", !(student as any).full_name_verified, e)}
                                        className="ml-2"
                                      >
                                        {(student as any).full_name_verified ? "Unverify" : "Verify"}
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{student.email}</p>
                                        <Badge variant={student.email_verified ? "default" : "secondary"} className="mt-1">
                                          {student.email_verified ? "✓ Verified" : "Unverified"}
                                        </Badge>
                                      </div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={student.email_verified ? "outline" : "default"}
                                        onClick={(e) => handleFieldVerification(student.id, "email", !student.email_verified, e)}
                                        className="ml-2"
                                      >
                                        {student.email_verified ? "Unverify" : "Verify"}
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{student.phone}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={student.phone_verified ? "default" : "secondary"}>
                                            {student.phone_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).phone_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={student.phone_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "phone", !student.phone_verified, e)}
                                        >
                                          {student.phone_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "phone", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Ghana Card Number</p>
                                        <p className="font-medium">{student.ghana_card_number}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={(student as any).ghana_card_verified ? "default" : "secondary"}>
                                            {(student as any).ghana_card_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).ghana_card_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={(student as any).ghana_card_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "ghana_card", !(student as any).ghana_card_verified, e)}
                                        >
                                          {(student as any).ghana_card_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "ghana_card", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Academic Information */}
                              <div>
                                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                  Academic Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Student ID</p>
                                        <p className="font-medium">{student.student_id}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={(student as any).student_id_verified ? "default" : "secondary"}>
                                            {(student as any).student_id_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).student_id_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={(student as any).student_id_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "student_id", !(student as any).student_id_verified, e)}
                                        >
                                          {(student as any).student_id_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "student_id", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">University</p>
                                        <p className="font-medium">{student.university}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={(student as any).university_verified ? "default" : "secondary"}>
                                            {(student as any).university_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).university_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={(student as any).university_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "university", !(student as any).university_verified, e)}
                                        >
                                          {(student as any).university_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "university", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Program</p>
                                        <p className="font-medium">{student.program}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={(student as any).program_verified ? "default" : "secondary"}>
                                            {(student as any).program_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).program_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={(student as any).program_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "program", !(student as any).program_verified, e)}
                                        >
                                          {(student as any).program_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "program", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Level</p>
                                        <p className="font-medium">Level {student.level}</p>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant={(student as any).level_verified ? "default" : "secondary"}>
                                            {(student as any).level_verified ? "✓ Verified" : "Unverified"}
                                          </Badge>
                                          {(student as any).level_reupload_required && (
                                            <Badge variant="destructive">Reupload Required</Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={(student as any).level_verified ? "outline" : "default"}
                                          onClick={(e) => handleFieldVerification(student.id, "level", !(student as any).level_verified, e)}
                                        >
                                          {(student as any).level_verified ? "Unverify" : "Verify"}
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => handleRequestReupload(student.id, "level", e)}
                                          title="Request student to reupload/update this field"
                                        >
                                          Request Reupload
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Uploaded Documents */}
                              <div>
                                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                  Uploaded Documents
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {student.selfie_url && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium">Selfie Photo</p>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant={(student as any).selfie_verified ? "default" : "secondary"}>
                                              {(student as any).selfie_verified ? "✓ Verified" : "Unverified"}
                                            </Badge>
                                            {(student as any).selfie_reupload_required && (
                                              <Badge variant="destructive">Reupload Required</Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(student as any).selfie_verified ? "outline" : "default"}
                                            onClick={(e) => handleFieldVerification(student.id, "selfie", !(student as any).selfie_verified, e)}
                                          >
                                            {(student as any).selfie_verified ? "Unverify" : "Verify"}
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={(e) => handleRequestReupload(student.id, "selfie", e)}
                                            title="Request student to reupload this document"
                                          >
                                            Request Reupload
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                        <img
                                          src={student.selfie_url}
                                          alt="Selfie"
                                          className="w-full h-64 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder-user.jpg";
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <a
                                          href={student.selfie_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          View Full Size
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  {student.id_document_url && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium">ID Document</p>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant={(student as any).id_document_verified ? "default" : "secondary"}>
                                              {(student as any).id_document_verified ? "✓ Verified" : "Unverified"}
                                            </Badge>
                                            {(student as any).id_document_reupload_required && (
                                              <Badge variant="destructive">Reupload Required</Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(student as any).id_document_verified ? "outline" : "default"}
                                            onClick={(e) => handleFieldVerification(student.id, "id_document", !(student as any).id_document_verified, e)}
                                          >
                                            {(student as any).id_document_verified ? "Unverify" : "Verify"}
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={(e) => handleRequestReupload(student.id, "id_document", e)}
                                            title="Request student to reupload this document"
                                          >
                                            Request Reupload
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                        <img
                                          src={student.id_document_url}
                                          alt="ID Document"
                                          className="w-full h-64 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder.jpg";
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Badge variant={(student as any).id_document_verified ? "default" : "secondary"}>
                                          {(student as any).id_document_verified ? "✓ Verified" : "Unverified"}
                                        </Badge>
                                        <a
                                          href={student.id_document_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          View Full Size
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                  {(student as any)?.face_verification_photo_url && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium">Face Verification Photo</p>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant={(student as any).face_verification_verified ? "default" : "secondary"}>
                                              {(student as any).face_verification_verified ? "✓ Verified" : "Unverified"}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={(student as any).face_verification_verified ? "outline" : "default"}
                                            onClick={(e) => handleFieldVerification(student.id, "face_verification", !(student as any).face_verification_verified, e)}
                                          >
                                            {(student as any).face_verification_verified ? "Unverify" : "Verify"}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                        <img
                                          src={(student as any).face_verification_photo_url}
                                          alt="Face Verification"
                                          className="w-full h-64 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder-user.jpg";
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        {student.face_match_score && (
                                          <div className="text-xs text-gray-600">
                                            <span className="font-semibold">Face Match Score: </span>
                                            <span className="text-blue-600 font-bold">{student.face_match_score}%</span>
                                          </div>
                                        )}
                                        <a
                                          href={(student as any).face_verification_photo_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          View Full Size
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

                      {/* Verified Tab */}
                      <TabsContent value="verified" className="space-y-4 mt-4">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <p>Loading students...</p>
                          </div>
                        ) : verifiedStudents.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No verified students found
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {verifiedStudents.map((student) => (
                              <Card key={student.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                  <div className="p-4 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{student.full_name}</h3>
                                            <Badge variant="default">Verified</Badge>
                                            {student.face_match_score && (
                                              <Badge variant="outline">Face Match: {student.face_match_score}%</Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {student.email} • {student.student_id} • {student.university}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => setExpandedStudent(
                                            expandedStudent === student.id ? null : student.id
                                          )}
                                        >
                                          {expandedStudent === student.id ? "Hide Details" : "View Details"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            const reason = prompt("Please provide a reason for blocking/rejecting this student:")
                                            if (reason && reason.trim()) {
                                              handleReview(student.id, "reject", reason.trim())
                                            } else if (reason !== null) {
                                              alert("Please provide a reason for blocking the student.")
                                            }
                                          }}
                                        >
                                          Block/Reject
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {expandedStudent === student.id && (
                                    <div className="p-6 space-y-6 bg-white">
                                      {/* Personal Information */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Personal Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Full Name</p>
                                                <p className="font-medium">{student.full_name}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).full_name_verified ? "default" : "secondary"}>
                                                    {(student as any).full_name_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).full_name_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).full_name_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "full_name", !(student as any).full_name_verified, e)}
                                                >
                                                  {(student as any).full_name_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "full_name", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Email</p>
                                                <p className="font-medium">{student.email}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={student.email_verified ? "default" : "secondary"}>
                                                    {student.email_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).email_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={student.email_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "email", !student.email_verified, e)}
                                                >
                                                  {student.email_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "email", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Phone</p>
                                                <p className="font-medium">{student.phone}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={student.phone_verified ? "default" : "secondary"}>
                                                    {student.phone_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).phone_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={student.phone_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "phone", !student.phone_verified, e)}
                                                >
                                                  {student.phone_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "phone", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Ghana Card Number</p>
                                                <p className="font-medium">{student.ghana_card_number}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).ghana_card_verified ? "default" : "secondary"}>
                                                    {(student as any).ghana_card_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).ghana_card_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).ghana_card_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "ghana_card", !(student as any).ghana_card_verified, e)}
                                                >
                                                  {(student as any).ghana_card_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "ghana_card", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Academic Information */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Academic Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Student ID</p>
                                                <p className="font-medium">{student.student_id}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).student_id_verified ? "default" : "secondary"}>
                                                    {(student as any).student_id_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).student_id_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).student_id_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "student_id", !(student as any).student_id_verified, e)}
                                                >
                                                  {(student as any).student_id_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "student_id", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">University</p>
                                                <p className="font-medium">{student.university}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).university_verified ? "default" : "secondary"}>
                                                    {(student as any).university_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).university_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).university_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "university", !(student as any).university_verified, e)}
                                                >
                                                  {(student as any).university_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "university", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Program</p>
                                                <p className="font-medium">{student.program}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).program_verified ? "default" : "secondary"}>
                                                    {(student as any).program_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).program_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).program_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "program", !(student as any).program_verified, e)}
                                                >
                                                  {(student as any).program_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "program", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-muted-foreground">Level</p>
                                                <p className="font-medium">Level {student.level}</p>
                                                <div className="flex gap-2 mt-1">
                                                  <Badge variant={(student as any).level_verified ? "default" : "secondary"}>
                                                    {(student as any).level_verified ? "✓ Verified" : "Unverified"}
                                                  </Badge>
                                                  {(student as any).level_reupload_required && (
                                                    <Badge variant="destructive">Reupload Required</Badge>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant={(student as any).level_verified ? "outline" : "default"}
                                                  onClick={(e) => handleFieldVerification(student.id, "level", !(student as any).level_verified, e)}
                                                >
                                                  {(student as any).level_verified ? "Unverify" : "Verify"}
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={(e) => handleRequestReupload(student.id, "level", e)}
                                                  title="Request student to reupload/update this field"
                                                >
                                                  Request Reupload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Uploaded Documents */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Uploaded Documents
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          {student.selfie_url && (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="text-sm font-medium">Selfie Photo</p>
                                                  <div className="flex gap-2 mt-1">
                                                    <Badge variant={(student as any).selfie_verified ? "default" : "secondary"}>
                                                      {(student as any).selfie_verified ? "✓ Verified" : "Unverified"}
                                                    </Badge>
                                                    {(student as any).selfie_reupload_required && (
                                                      <Badge variant="destructive">Reupload Required</Badge>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={(student as any).selfie_verified ? "outline" : "default"}
                                                    onClick={(e) => handleFieldVerification(student.id, "selfie", !(student as any).selfie_verified, e)}
                                                  >
                                                    {(student as any).selfie_verified ? "Unverify" : "Verify"}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => handleRequestReupload(student.id, "selfie", e)}
                                                    title="Request student to reupload this document"
                                                  >
                                                    Request Reupload
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                                <img
                                                  src={student.selfie_url}
                                                  alt="Selfie"
                                                  className="w-full h-64 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder-user.jpg";
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <a
                                                  href={student.selfie_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                  View Full Size
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                          {student.id_document_url && (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="text-sm font-medium">ID Document</p>
                                                  <div className="flex gap-2 mt-1">
                                                    <Badge variant={(student as any).id_document_verified ? "default" : "secondary"}>
                                                      {(student as any).id_document_verified ? "✓ Verified" : "Unverified"}
                                                    </Badge>
                                                    {(student as any).id_document_reupload_required && (
                                                      <Badge variant="destructive">Reupload Required</Badge>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={(student as any).id_document_verified ? "outline" : "default"}
                                                    onClick={(e) => handleFieldVerification(student.id, "id_document", !(student as any).id_document_verified, e)}
                                                  >
                                                    {(student as any).id_document_verified ? "Unverify" : "Verify"}
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={(e) => handleRequestReupload(student.id, "id_document", e)}
                                                    title="Request student to reupload this document"
                                                  >
                                                    Request Reupload
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                                <img
                                                  src={student.id_document_url}
                                                  alt="ID Document"
                                                  className="w-full h-64 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder.jpg";
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <a
                                                  href={student.id_document_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                  View Full Size
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                          {(student as any)?.face_verification_photo_url && (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="text-sm font-medium">Face Verification Photo</p>
                                                  <div className="flex gap-2 mt-1">
                                                    <Badge variant={(student as any).face_verification_verified ? "default" : "secondary"}>
                                                      {(student as any).face_verification_verified ? "✓ Verified" : "Unverified"}
                                                    </Badge>
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={(student as any).face_verification_verified ? "outline" : "default"}
                                                    onClick={(e) => handleFieldVerification(student.id, "face_verification", !(student as any).face_verification_verified, e)}
                                                  >
                                                    {(student as any).face_verification_verified ? "Unverify" : "Verify"}
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                                <img
                                                  src={(student as any).face_verification_photo_url}
                                                  alt="Face Verification"
                                                  className="w-full h-64 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder-user.jpg";
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center justify-between">
                                                {student.face_match_score && (
                                                  <div className="text-xs text-gray-600">
                                                    <span className="font-semibold">Face Match Score: </span>
                                                    <span className="text-blue-600 font-bold">{student.face_match_score}%</span>
                                                  </div>
                                                )}
                                                <a
                                                  href={(student as any).face_verification_photo_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                  View Full Size
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* Blocked Tab */}
                      <TabsContent value="blocked" className="space-y-4 mt-4">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <p>Loading students...</p>
                          </div>
                        ) : blockedStudents.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No blocked students found
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {blockedStudents.map((student) => (
                              <Card key={student.id} className="overflow-hidden border-red-200">
                                <CardContent className="p-0">
                                  <div className="p-4 border-b bg-red-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{student.full_name}</h3>
                                            <Badge variant="destructive">Blocked/Rejected</Badge>
                                            {student.face_match_score && (
                                              <Badge variant="outline">Face Match: {student.face_match_score}%</Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {student.email} • {student.student_id} • {student.university}
                                          </p>
                                          {student.rejection_reason && (
                                            <p className="text-sm text-red-600 mt-2 font-medium">
                                              Reason: {student.rejection_reason}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => setExpandedStudent(
                                            expandedStudent === student.id ? null : student.id
                                          )}
                                        >
                                          {expandedStudent === student.id ? "Hide Details" : "View Details"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => handleReview(student.id, "approve")}
                                        >
                                          Unblock/Approve
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {expandedStudent === student.id && (
                                    <div className="p-6 space-y-6 bg-white">
                                      {/* Personal Information */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Personal Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-muted-foreground">Full Name</p>
                                            <p className="font-medium">{student.full_name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{student.email}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{student.phone}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Ghana Card Number</p>
                                            <p className="font-medium">{student.ghana_card_number}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Academic Information */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Academic Information
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-muted-foreground">Student ID</p>
                                            <p className="font-medium">{student.student_id}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">University</p>
                                            <p className="font-medium">{student.university}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Program</p>
                                            <p className="font-medium">{student.program}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">Level</p>
                                            <p className="font-medium">Level {student.level}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Rejection Reason */}
                                      {student.rejection_reason && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                          <h4 className="font-semibold mb-2 text-sm text-red-800">Rejection Reason</h4>
                                          <p className="text-sm text-red-700">{student.rejection_reason}</p>
                                        </div>
                                      )}

                                      {/* Uploaded Documents */}
                                      <div>
                                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">
                                          Uploaded Documents
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                          {student.selfie_url && (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium">Selfie Photo</p>
                                              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                                <img
                                                  src={student.selfie_url}
                                                  alt="Selfie"
                                                  className="w-full h-64 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder-user.jpg";
                                                  }}
                                                />
                                              </div>
                                              <a
                                                href={student.selfie_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                              >
                                                View Full Size
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                              </a>
                                            </div>
                                          )}
                                          {student.id_document_url && (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium">ID Document</p>
                                              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all bg-gray-100 flex items-center justify-center">
                                                <img
                                                  src={student.id_document_url}
                                                  alt="ID Document"
                                                  className="w-full h-64 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "/placeholder.jpg";
                                                  }}
                                                />
                                              </div>
                                              <a
                                                href={student.id_document_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                              >
                                                View Full Size
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

