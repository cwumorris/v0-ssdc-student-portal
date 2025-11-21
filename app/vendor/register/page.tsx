"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "sonner"

export default function VendorRegister() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessRegistrationNumber: "",
    businessAddress: "",
    contactName: "",
  })
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("File upload failed")
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!certificateFile) {
        toast.error("Business certificate is required")
        setIsSubmitting(false)
        return
      }

      toast.info("Uploading files...")
      let certificateUrl = ""
      let licenseUrl = ""

      if (certificateFile) {
        certificateUrl = await uploadFile(certificateFile)
        console.log("[v0] Certificate uploaded:", certificateUrl)
      }

      if (licenseFile) {
        licenseUrl = await uploadFile(licenseFile)
        console.log("[v0] License uploaded:", licenseUrl)
      }

      const submitFormData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value)
      })
      submitFormData.append("businessCertificateUrl", certificateUrl)
      submitFormData.append("businessLicenseUrl", licenseUrl || "")

      console.log("[v0] Submitting vendor registration:", {
        businessName: formData.businessName,
        businessEmail: formData.businessEmail,
        hasCertificate: !!certificateUrl,
        hasLicense: !!licenseUrl
      })

      const response = await fetch("/api/auth/vendor/register", {
        method: "POST",
        body: submitFormData,
      })

      // Read response as text first, then parse as JSON
      const responseText = await response.text()
      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("[v0] Failed to parse response as JSON:", parseError)
        console.error("[v0] Raw response:", responseText)
        toast.error(`Registration failed: ${response.status} ${response.statusText}`)
        if (responseText) {
          toast.error(`Server response: ${responseText.substring(0, 100)}`)
        }
        return
      }

      if (!response.ok) {
        console.error("[v0] Vendor registration error response:", data)
        throw new Error(data.error || data.message || "Registration failed")
      }

      toast.success(data.message || "Vendor registration submitted successfully! Awaiting admin approval.")
      router.push("/login")
    } catch (error) {
      console.error("[v0] Vendor registration error:", error)
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 py-8">
      <div className="mb-4 max-w-2xl mx-auto">
        <BackButton href="/login" label="Back to Login" />
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Vendor Registration</CardTitle>
          <CardDescription>Register your business to access student verification API</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
              <Input
                id="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate">
                Business Certificate <span className="text-red-500">*</span>
              </Label>
              <Input
                id="certificate"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">Required: Upload your business registration certificate</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">Business License (Optional)</Label>
              <Input
                id="license"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
