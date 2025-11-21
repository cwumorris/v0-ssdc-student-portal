"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Vendor } from "@/lib/types"

export default function VendorDashboard() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [studentIdQuery, setStudentIdQuery] = useState("")
  const [ghanaCardQuery, setGhanaCardQuery] = useState("")
  const [queryResult, setQueryResult] = useState<any>(null)
  const [isQuerying, setIsQuerying] = useState(false)

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")

    if (!storedUserId) {
      router.push("/login")
      return
    }

    setUserId(storedUserId)

    fetch("/api/vendor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: storedUserId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.vendor) {
          setVendor(data.vendor)
        }
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("[v0] Error fetching vendor:", error)
        setIsLoading(false)
      })
  }, [router])

  const handleGenerateApiKey = async () => {
    if (!vendor) return

    try {
      const response = await fetch("/api/vendor/generate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`API Key generated: ${data.apiKey}`)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to generate API key")
      }
    } catch (error) {
      console.error("[v0] API key generation error:", error)
      alert("Failed to generate API key")
    }
  }

  const handleQuery = async (type: "studentId" | "ghanaCard") => {
    if (!vendor?.api_key) {
      alert("API key not available")
      return
    }

    setIsQuerying(true)
    setQueryResult(null)

    try {
      const endpoint =
        type === "studentId"
          ? `/api/v1/verify/student-id?studentId=${studentIdQuery}`
          : `/api/v1/verify/ghana-card?ghanaCard=${ghanaCardQuery}`

      const response = await fetch(endpoint, {
        headers: {
          "x-api-key": vendor.api_key,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setQueryResult(data)
      } else {
        setQueryResult({ error: data.error || "Query failed" })
      }
    } catch (error) {
      console.error("[v0] Query error:", error)
      setQueryResult({ error: "Query failed" })
    } finally {
      setIsQuerying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Vendor Profile</CardTitle>
            <CardDescription>You need to register as a vendor first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/vendor/register")}>Register as Vendor</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your API access and verify students</p>
        </div>

        {/* Status Alert */}
        {vendor.approval_status !== "approved" && (
          <Card className={`border-l-4 ${
            vendor.approval_status === "rejected"
              ? "border-destructive"
              : vendor.approval_status === "suspended"
                ? "border-orange-500"
                : "border-yellow-500"
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge
                  variant={
                    vendor.approval_status === "rejected"
                      ? "destructive"
                      : vendor.approval_status === "suspended"
                        ? "secondary"
                        : "secondary"
                  }
                >
                  {vendor.approval_status.toUpperCase()}
                </Badge>
                {vendor.approval_status === "pending" && (
                  <span className="text-sm text-muted-foreground">
                    Waiting for admin approval
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {vendor.approval_status === "pending" && (
                  "Your vendor account is pending review. You can view your profile, but API access will be available after approval."
                )}
                {vendor.approval_status === "rejected" && vendor.rejection_reason && (
                  <div className="mt-2">
                    <p className="font-semibold text-destructive">Rejection Reason:</p>
                    <p>{vendor.rejection_reason}</p>
                  </div>
                )}
                {vendor.approval_status === "suspended" && (
                  "Your vendor account has been suspended. Please contact support for more information."
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approval Status</CardDescription>
              <Badge
                variant={
                  vendor.approval_status === "approved"
                    ? "default"
                    : vendor.approval_status === "rejected"
                      ? "destructive"
                      : vendor.approval_status === "suspended"
                        ? "secondary"
                        : "secondary"
                }
              >
                {vendor.approval_status.toUpperCase()}
              </Badge>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>API Calls Used</CardDescription>
              <CardTitle className="text-3xl">
                {vendor.api_calls_count} / {vendor.api_calls_limit}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Business Name</CardDescription>
              <CardTitle className="text-xl">{vendor.business_name}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
            <TabsTrigger value="docs">API Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Vendor Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Profile</CardTitle>
                <CardDescription>Your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{vendor.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Business Email</Label>
                    <p className="font-medium">{vendor.business_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Business Phone</Label>
                    <p className="font-medium">{vendor.business_phone}</p>
                  </div>
                  {vendor.business_registration_number && (
                    <div>
                      <Label className="text-muted-foreground">Registration Number</Label>
                      <p className="font-medium">{vendor.business_registration_number}</p>
                    </div>
                  )}
                  {vendor.business_address && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Business Address</Label>
                      <p className="font-medium">{vendor.business_address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>Documents you submitted during registration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {vendor.business_certificate_url ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Business Certificate</Label>
                      <div className="border rounded-lg overflow-hidden bg-muted">
                        <img
                          src={vendor.business_certificate_url}
                          alt="Business Certificate"
                          className="w-full h-64 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex items-center justify-center h-64 p-4">
                                  <a href="${vendor.business_certificate_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                                    View Certificate (Click to open)
                                  </a>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                      <a
                        href={vendor.business_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Full Size →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Business Certificate</Label>
                      <div className="border rounded-lg p-8 text-center bg-muted">
                        <p className="text-sm text-muted-foreground">No certificate uploaded</p>
                      </div>
                    </div>
                  )}

                  {vendor.business_license_url ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Business License</Label>
                      <div className="border rounded-lg overflow-hidden bg-muted">
                        <img
                          src={vendor.business_license_url}
                          alt="Business License"
                          className="w-full h-64 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && vendor.business_license_url) {
                              parent.innerHTML = `
                                <div class="flex items-center justify-center h-64 p-4">
                                  <a href="${vendor.business_license_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                                    View License (Click to open)
                                  </a>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                      <a
                        href={vendor.business_license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Full Size →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Business License</Label>
                      <div className="border rounded-lg p-8 text-center bg-muted">
                        <p className="text-sm text-muted-foreground">No license uploaded (optional)</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Students</CardTitle>
                <CardDescription>
                  {vendor.approval_status !== "approved" || !vendor.api_key
                    ? "You need to be approved and have an API key to search students"
                    : "Query student verification status"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.approval_status !== "approved" && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Your account must be approved before you can use the student search feature.
                    </p>
                  </div>
                )}
                {vendor.approval_status === "approved" && !vendor.api_key && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Please generate an API key first to use the student search feature.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="studentId">Search by Student ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="studentId"
                      placeholder="Enter student ID"
                      value={studentIdQuery}
                      onChange={(e) => setStudentIdQuery(e.target.value)}
                      disabled={vendor.approval_status !== "approved" || !vendor.api_key}
                    />
                    <Button 
                      onClick={() => handleQuery("studentId")} 
                      disabled={isQuerying || !vendor.api_key || vendor.approval_status !== "approved"}
                    >
                      {isQuerying ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ghanaCard">Search by Ghana Card Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ghanaCard"
                      placeholder="Enter Ghana card number"
                      value={ghanaCardQuery}
                      onChange={(e) => setGhanaCardQuery(e.target.value)}
                      disabled={vendor.approval_status !== "approved" || !vendor.api_key}
                    />
                    <Button 
                      onClick={() => handleQuery("ghanaCard")} 
                      disabled={isQuerying || !vendor.api_key || vendor.approval_status !== "approved"}
                    >
                      {isQuerying ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                {queryResult && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Query Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {queryResult.error ? (
                        <p className="text-destructive">{queryResult.error}</p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={queryResult.verified ? "default" : "secondary"}>
                              {queryResult.verified ? "VERIFIED" : "NOT VERIFIED"}
                            </Badge>
                            {queryResult.student.face_match_score && (
                              <Badge variant="outline">Score: {queryResult.student.face_match_score}%</Badge>
                            )}
                          </div>
                          <div className="grid gap-2 text-sm">
                            <p>
                              <strong>Name:</strong> {queryResult.student.full_name}
                            </p>
                            <p>
                              <strong>Email:</strong> {queryResult.student.email}
                            </p>
                            <p>
                              <strong>Student ID:</strong> {queryResult.student.student_id}
                            </p>
                            <p>
                              <strong>University:</strong> {queryResult.student.university}
                            </p>
                            <p>
                              <strong>Program:</strong> {queryResult.student.program}
                            </p>
                            <p>
                              <strong>Level:</strong> {queryResult.student.level}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>Generate and manage your API key</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.approval_status !== "approved" ? (
                  <p className="text-muted-foreground">
                    Your vendor account must be approved before generating an API key.
                  </p>
                ) : vendor.api_key ? (
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input value={vendor.api_key} readOnly className="font-mono" />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(vendor.api_key!)
                          alert("API key copied to clipboard")
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(vendor.api_key_created_at!).toLocaleDateString()}
                    </p>
                    <Button onClick={handleGenerateApiKey} variant="outline">
                      Regenerate API Key
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleGenerateApiKey}>Generate API Key</Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>How to integrate with the SSDC Student Verification API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">Include your API key in the request header:</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`x-api-key: your_api_key_here`}</pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Verify by Student ID</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {`GET /api/v1/verify/student-id?studentId=10123456
Headers:
  x-api-key: your_api_key_here

Response:
{
  "verified": true,
  "student": {
    "id": "...",
    "full_name": "John Doe",
    "email": "john@example.com",
    "student_id": "10123456",
    "university": "University of Ghana",
    "program": "Computer Science",
    "level": "300",
    "verification_status": "verified",
    "face_match_score": 92.5,
    "verified_at": "2024-01-15T10:30:00Z"
  }
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Verify by Ghana Card</h3>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {`GET /api/v1/verify/ghana-card?ghanaCard=GHA-123456789-1
Headers:
  x-api-key: your_api_key_here

Response: (same as above)`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
