"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const GHANA_UNIVERSITIES = [
  "University of Ghana",
  "Kwame Nkrumah University of Science and Technology",
  "University of Cape Coast",
  "University of Education, Winneba",
  "University for Development Studies",
  "Ghana Institute of Management and Public Administration",
  "Ashesi University",
  "Academic City University College",
  "Other",
]

interface ReuploadModalProps {
  isOpen: boolean
  onClose: () => void
  field: string
  currentValue: string
  userId: string
  onSuccess: () => void
}

export function ReuploadModal({ isOpen, onClose, field, currentValue, userId, onSuccess }: ReuploadModalProps) {
  const [value, setValue] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  if (!isOpen) return null

  const isFileField = field === "selfie" || field === "id_document"
  const isEmailField = field === "email"
  const isSelectField = field === "university" || field === "program" || field === "level"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFilePreview(URL.createObjectURL(selectedFile))
    }
  }

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

  const handleSendOtp = async () => {
    if (!value) {
      toast.error("Please enter your email first")
      return
    }

    setIsSendingOtp(true)
    try {
      const response = await fetch("/api/student/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, fullName: "" }),
      })

      const data = await response.json()
      if (response.ok) {
        setOtpSent(true)
        toast.success("OTP sent to your email")
      } else {
        toast.error(data.error || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("Failed to send OTP")
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      toast.error("Please enter OTP")
      return
    }

    setIsVerifyingOtp(true)
    try {
      const response = await fetch("/api/student/verify-otp-before-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, code: otpCode }),
      })

      const data = await response.json()
      if (response.ok && data.verified) {
        setOtpVerified(true)
        toast.success("OTP verified successfully")
      } else {
        toast.error(data.error || "Invalid OTP")
      }
    } catch (error) {
      toast.error("Failed to verify OTP")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isFileField) {
        if (!file) {
          toast.error(`Please upload ${field === "selfie" ? "a selfie" : "an ID document"}`)
          setIsSubmitting(false)
          return
        }

        const fileUrl = await uploadFile(file)
        const response = await fetch("/api/student/reupload-field", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, field, fileUrl }),
        })

        const data = await response.json()
        if (response.ok) {
          toast.success(data.message || "Reupload successful")
          onSuccess()
          onClose()
        } else {
          toast.error(data.error || "Reupload failed")
        }
      } else {
        let finalValue = value
        if (field === "phone" && !value.startsWith("+233")) {
          finalValue = "+233" + value.replace(/^\+233/, "")
        }
        if (field === "ghana_card" && !value.startsWith("GHA-")) {
          finalValue = "GHA-" + value.replace(/^GHA-/, "")
        }

        if (!finalValue) {
          toast.error("Please enter a value")
          setIsSubmitting(false)
          return
        }

        if (isEmailField && !otpVerified) {
          toast.error("Please verify OTP first")
          setIsSubmitting(false)
          return
        }

        const body: any = { userId, field, value: finalValue }
        if (isEmailField && otpVerified) {
          body.emailOtp = otpCode
        }

        const response = await fetch("/api/student/reupload-field", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        const data = await response.json()
        if (response.ok) {
          toast.success(data.message || "Reupload successful")
          onSuccess()
          onClose()
        } else {
          toast.error(data.error || "Reupload failed")
        }
      }
    } catch (error) {
      toast.error("Reupload failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldLabel = () => {
    const labels: Record<string, string> = {
      email: "Email",
      phone: "Phone Number",
      full_name: "Full Name",
      student_id: "Student ID",
      university: "University",
      program: "Program",
      level: "Level",
      ghana_card: "Ghana Card Number",
      selfie: "Selfie Photo",
      id_document: "ID Document",
    }
    return labels[field] || field
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reupload {getFieldLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isFileField ? (
              <div className="space-y-2">
                <Label>Upload {field === "selfie" ? "Selfie" : "ID Document"}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {filePreview && (
                  <div className="mt-2">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            ) : isSelectField ? (
              <div className="space-y-2">
                <Label>{getFieldLabel()}</Label>
                {field === "university" ? (
                  <Select value={value} onValueChange={setValue} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {GHANA_UNIVERSITIES.map((uni) => (
                        <SelectItem key={uni} value={uni}>
                          {uni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field === "program" ? (
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter program"
                    required
                  />
                ) : (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter level"
                    min="1"
                    max="4"
                    required
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{getFieldLabel()}</Label>
                {field === "phone" ? (
                  <div className="flex">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md text-gray-700">
                      +233
                    </span>
                    <Input
                      type="tel"
                      value={value.replace(/^\+233/, "")}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter phone number"
                      className="rounded-l-none"
                      required
                    />
                  </div>
                ) : field === "ghana_card" ? (
                  <div className="flex">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md text-gray-700">
                      GHA-
                    </span>
                    <Input
                      type="text"
                      value={value.replace(/^GHA-/, "")}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter Ghana Card number"
                      className="rounded-l-none"
                      required
                    />
                  </div>
                ) : field === "email" ? (
                  <>
                    <Input
                      type="email"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter email"
                      required
                    />
                    {!otpSent && (
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={!value || isSendingOtp}
                        variant="outline"
                        className="w-full"
                      >
                        {isSendingOtp ? "Sending..." : "Send Verification Code"}
                      </Button>
                    )}
                    {otpSent && !otpVerified && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={!otpCode || isVerifyingOtp}
                          variant="outline"
                          className="w-full"
                        >
                          {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                        </Button>
                      </div>
                    )}
                    {otpVerified && (
                      <div className="text-sm text-green-600 font-medium">✓ OTP Verified</div>
                    )}
                  </>
                ) : (
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`Enter ${getFieldLabel()}`}
                    required
                  />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Uploading..." : "Reupload"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

