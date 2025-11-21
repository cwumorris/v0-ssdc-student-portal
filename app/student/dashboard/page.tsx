"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Student } from "@/lib/types"
import { ReuploadModal } from "@/components/student/reupload-modal"
import { CameraCapture } from "@/components/student/camera-capture"

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [reuploadModal, setReuploadModal] = useState<{ field: string; isOpen: boolean }>({ field: "", isOpen: false })
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isVerifyingFace, setIsVerifyingFace] = useState(false)

  useEffect(() => {
    // Check for Google OAuth redirect with query params
    const urlParams = new URLSearchParams(window.location.search)
    const fromGoogle = urlParams.get('from')
    
    if (fromGoogle === 'google') {
      const userId = urlParams.get('userId')
      const email = urlParams.get('email')
      const name = urlParams.get('name')
      
      if (userId && email && name) {
        // Store in localStorage
        localStorage.setItem('userId', userId)
        localStorage.setItem('userEmail', email)
        localStorage.setItem('userName', name)
        
        // Check if we should go to register or dashboard (based on URL)
        const currentPath = window.location.pathname
        window.history.replaceState({}, '', currentPath)
        
        setUserId(userId)
        setUserEmail(email)
        setUserName(name)
        
        // If already on dashboard, fetch student data
        if (currentPath === '/student/dashboard') {
          fetch("/api/student/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.student) {
                setStudent(data.student)
              } else {
                // No KYC done - redirect to registration page
                router.push("/student/register")
                return
              }
              setIsLoading(false)
            })
            .catch((error) => {
              console.error("[v0] Error fetching student:", error)
              setIsLoading(false)
            })
        } else {
          // Already redirected to register or other page
          setIsLoading(false)
        }
        return
      }
    }

    // Normal flow - check localStorage
    const storedUserId = localStorage.getItem("userId")
    const storedEmail = localStorage.getItem("userEmail")
    const storedName = localStorage.getItem("userName")

    if (!storedUserId) {
      router.push("/login")
      return
    }

    setUserId(storedUserId)
    setUserEmail(storedEmail)
    setUserName(storedName)

    // Fetch student data
    fetch("/api/student/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: storedUserId }),
    })
      .then((res) => res.json())
            .then((data) => {
              console.log("[v0] Dashboard profile data:", data)
              if (data.student && data.student.id) {
                setStudent(data.student)
              } else {
                // No KYC done - redirect to registration page
                console.log("[v0] No student found in dashboard, redirecting to register")
                router.push("/student/register")
                return
              }
              setIsLoading(false)
            })
      .catch((error) => {
        console.error("[v0] Error fetching student:", error)
        setIsLoading(false)
      })
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // If no student data, redirect should have happened already
  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting to registration...</p>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    toast.success("Logged out successfully")
    router.push("/login")
  }

  const handleReuploadSuccess = () => {
    // Refresh student data
    if (userId) {
      fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.student) {
            setStudent(data.student)
          }
        })
        .catch((error) => {
          console.error("[v0] Error fetching student:", error)
        })
    }
  }

  const getFieldValue = (field: string): string => {
    const fieldMap: Record<string, string> = {
      email: student?.email || "",
      phone: student?.phone || "",
      full_name: student?.full_name || "",
      student_id: student?.student_id || "",
      university: student?.university || "",
      program: student?.program || "",
      level: student?.level || "",
      ghana_card: student?.ghana_card_number || "",
      selfie: student?.selfie_url || "",
      id_document: student?.id_document_url || "",
    }
    return fieldMap[field] || ""
  }

  const handleFaceVerification = async (imageUrl: string) => {
    if (!userId) return

    setIsVerifyingFace(true)
    try {
      const response = await fetch("/api/student/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verificationPhotoUrl: imageUrl }),
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || "Face verification submitted successfully")
        if (data.requiresAdminReview) {
          toast.info("Your photo is under admin review. You'll be notified once verified.")
        }
        // Refresh student data
        handleReuploadSuccess()
        setIsCameraOpen(false)
      } else {
        toast.error(data.error || "Face verification failed")
      }
    } catch (error) {
      console.error("[v0] Face verification error:", error)
      toast.error("Face verification failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsVerifyingFace(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {student?.full_name?.split(' ')[0] || 'Student'}!</h1>
              <p className="mt-2 text-blue-100">Student Verification Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <div className={`px-4 py-2 rounded-full ${
                  student?.verification_status === "verified"
                    ? "bg-green-500"
                    : student?.verification_status === "rejected"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}>
                  <Badge
                    variant={
                      student?.verification_status === "verified"
                        ? "default"
                        : student?.verification_status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-white bg-transparent border-0"
                  >
                    {student?.verification_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
              {student?.selfie_url && student?.id_document_url && (
                <Button
                  onClick={() => setIsCameraOpen(true)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Verify Face
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
                  <div className="mt-2">
                    <Badge
                      variant={
                        student?.verification_status === "verified"
                          ? "default"
                          : student?.verification_status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-base px-3 py-1"
                    >
                      {student?.verification_status === "verified" ? "✓ Verified" :
                       student?.verification_status === "rejected" ? "✗ Rejected" :
                       "⏳ Pending"}
                    </Badge>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  student?.verification_status === "verified"
                    ? "bg-green-100 text-green-600"
                    : student?.verification_status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                }`}>
                  {student?.verification_status === "verified" ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : student?.verification_status === "rejected" ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {student?.face_match_score && (
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Face Match Score</p>
                    <p className="text-3xl font-bold mt-2 text-indigo-600">{student.face_match_score}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                  <p className="text-xl font-bold mt-2 text-gray-900">{student?.student_id}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={(student as any)?.student_id_verified ? "default" : "secondary"}>
                      {(student as any)?.student_id_verified ? "✓ Verified" : "Unverified"}
                    </Badge>
                    {(student as any)?.student_id_reupload_required && (
                      <>
                        <Badge variant="destructive">Reupload Required</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReuploadModal({ field: "student_id", isOpen: true })}
                        >
                          Reupload
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Information Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</p>
                <p className="text-base font-semibold text-gray-900">{student?.full_name}</p>
                <div className="flex gap-2">
                  <Badge variant={(student as any)?.full_name_verified ? "default" : "secondary"}>
                    {(student as any)?.full_name_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.full_name_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "full_name", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                <p className="text-base font-semibold text-gray-900">{student?.email}</p>
                <div className="flex gap-2">
                  <Badge variant={student?.email_verified ? "default" : "secondary"}>
                    {student?.email_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.email_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "email", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</p>
                <p className="text-base font-semibold text-gray-900">{student?.phone}</p>
                <div className="flex gap-2">
                  <Badge variant={student?.phone_verified ? "default" : "secondary"}>
                    {student?.phone_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.phone_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "phone", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ghana Card</p>
                <p className="text-base font-semibold text-gray-900">{student?.ghana_card_number}</p>
                <div className="flex gap-2">
                  <Badge variant={(student as any)?.ghana_card_verified ? "default" : "secondary"}>
                    {(student as any)?.ghana_card_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.ghana_card_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "ghana_card", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">University</p>
                <p className="text-base font-semibold text-gray-900">{student?.university}</p>
                <div className="flex gap-2">
                  <Badge variant={(student as any)?.university_verified ? "default" : "secondary"}>
                    {(student as any)?.university_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.university_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "university", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Program</p>
                <p className="text-base font-semibold text-gray-900">{student?.program}</p>
                <div className="flex gap-2">
                  <Badge variant={(student as any)?.program_verified ? "default" : "secondary"}>
                    {(student as any)?.program_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.program_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "program", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</p>
                <p className="text-base font-semibold text-gray-900">Level {student?.level}</p>
                <div className="flex gap-2">
                  <Badge variant={(student as any)?.level_verified ? "default" : "secondary"}>
                    {(student as any)?.level_verified ? "✓ Verified" : "Unverified"}
                  </Badge>
                  {(student as any)?.level_reupload_required && (
                    <>
                      <Badge variant="destructive">Reupload Required</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReuploadModal({ field: "level", isOpen: true })}
                      >
                        Reupload
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Documents Card */}
        {(student?.selfie_url || student?.id_document_url || (student as any)?.face_verification_photo_url) && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Selfie Document */}
                {student?.selfie_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Selfie Photo
                      </p>
                      <div className="flex gap-2">
                        <Badge variant={(student as any)?.selfie_verified ? "default" : "secondary"}>
                          {(student as any)?.selfie_verified ? "✓ Verified" : "Unverified"}
                        </Badge>
                        {(student as any)?.selfie_reupload_required && (
                          <>
                            <Badge variant="destructive">Reupload Required</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReuploadModal({ field: "selfie", isOpen: true })}
                            >
                              Reupload
                            </Button>
                          </>
                        )}
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <a
                          href={student.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-4 py-2 rounded-md text-sm font-medium shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Full Size
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Selfie Photo
                      </p>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Not Uploaded
                      </Badge>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 h-64 flex items-center justify-center">
                      <p className="text-sm text-gray-500">No selfie uploaded</p>
                    </div>
                  </div>
                )}

                {/* ID Document */}
                {student?.id_document_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        ID Document
                      </p>
                      <div className="flex gap-2">
                        <Badge variant={(student as any)?.id_document_verified ? "default" : "secondary"}>
                          {(student as any)?.id_document_verified ? "✓ Verified" : "Unverified"}
                        </Badge>
                        {(student as any)?.id_document_reupload_required && (
                          <>
                            <Badge variant="destructive">Reupload Required</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReuploadModal({ field: "id_document", isOpen: true })}
                            >
                              Reupload
                            </Button>
                          </>
                        )}
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <a
                          href={student.id_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-4 py-2 rounded-md text-sm font-medium shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Full Size
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        ID Document
                      </p>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Not Uploaded
                      </Badge>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 h-64 flex items-center justify-center">
                      <p className="text-sm text-gray-500">No ID document uploaded</p>
                    </div>
                  </div>
                )}

                {/* Face Verification Photo */}
                {(student as any)?.face_verification_photo_url ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Face Verification Photo
                      </p>
                      <Badge variant="default" className="bg-green-600">
                        ✓ Verified
                      </Badge>
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <a
                          href={(student as any).face_verification_photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white px-4 py-2 rounded-md text-sm font-medium shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Full Size
                        </a>
                      </div>
                    </div>
                    {student?.face_match_score && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Face Match Score: </span>
                        <span className="text-blue-600 font-bold">{student.face_match_score}%</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejection Reason (if exists) */}
        {student?.rejection_reason && (
          <Card className="border-2 border-red-200 shadow-lg bg-red-50">
            <CardHeader className="border-b border-red-200">
              <CardTitle className="text-xl font-bold text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rejection Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-red-800 font-medium">{student.rejection_reason}</p>
              <p className="text-xs text-red-600 mt-2">Please review your documents and resubmit your KYC application.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reupload Modal */}
      {reuploadModal.isOpen && userId && (
        <ReuploadModal
          isOpen={reuploadModal.isOpen}
          onClose={() => setReuploadModal({ field: "", isOpen: false })}
          field={reuploadModal.field}
          currentValue={getFieldValue(reuploadModal.field)}
          userId={userId}
          onSuccess={handleReuploadSuccess}
        />
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFaceVerification}
        title="Face Verification"
      />
    </div>
  )
}
