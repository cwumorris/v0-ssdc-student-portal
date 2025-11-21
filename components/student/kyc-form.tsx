"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

export function KYCForm({ userId, userEmail, userName }: { userId: string; userEmail: string; userName: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: userName || "",
    email: userEmail || "",
    phone: "",
    ghanaCardNumber: "",
    studentId: "",
    university: "",
    program: "",
    level: "",
    verificationType: "email",
  })
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "selfie" | "id") => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === "selfie") {
        setSelfieFile(file)
        setSelfiePreview(URL.createObjectURL(file))
      } else {
        setIdDocumentFile(file)
        setIdDocumentPreview(URL.createObjectURL(file))
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload files
      if (!selfieFile || !idDocumentFile) {
        toast.error("Please upload both selfie and ID document")
        setIsSubmitting(false)
        return
      }

      // For email verification, OTP must be sent and verified before submission
      if (formData.verificationType === "email") {
        if (!otpSent) {
          toast.error("Please send OTP to your email first")
          setIsSubmitting(false)
          return
        }
        if (!otpVerified) {
          toast.error("Please verify your OTP first")
          setIsSubmitting(false)
          return
        }
        if (!otpCode || otpCode.length !== 6) {
          toast.error("Please enter the 6-digit OTP")
          setIsSubmitting(false)
          return
        }
      }

      const selfieUrl = await uploadFile(selfieFile)
      const idDocumentUrl = await uploadFile(idDocumentFile)

      // Prepare registration data - ensure phone has +233 prefix and Ghana Card has GHA- prefix
      const phoneNumber = formData.phone.startsWith('+233') 
        ? formData.phone 
        : `+233${formData.phone}`;
      
      const ghanaCardNumber = formData.ghanaCardNumber.startsWith('GHA-') 
        ? formData.ghanaCardNumber 
        : `GHA-${formData.ghanaCardNumber}`;
      
      const registerData: any = {
        userId,
        ...formData,
        phone: phoneNumber,
        ghanaCardNumber: ghanaCardNumber,
        selfieUrl,
        idDocumentUrl,
      }
      
      // Include OTP if email verification
      if (formData.verificationType === "email" && otpSent && otpCode) {
        registerData.emailOtp = otpCode
      }

      // Submit registration
      const response = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Registration failed")
      }

      const data = await response.json()

      // Store student ID
      localStorage.setItem("studentId", data.studentId)
      
      // If email verification, skip code verification step (already verified)
      if (formData.verificationType === "email" && otpSent) {
        toast.success("KYC documents submitted successfully! Email verified.")
        // Go directly to face verification or dashboard
        router.push("/student/dashboard")
      } else {
        // Phone verification - need to verify code
      localStorage.setItem("verificationCode", data.verificationCode) // For demo purposes
        toast.success("KYC documents submitted successfully! Please verify your code.")
      setStep(3)
      }
    } catch (error) {
      console.error("[v0] Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 3) {
    return <VerificationStep verificationType={formData.verificationType} />
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Student Verification - KYC Submission</CardTitle>
        <CardDescription>Complete your profile to get verified for student discounts</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm">
                    +233
                  </div>
                <Input
                  id="phone"
                  type="tel"
                    placeholder="XX XXX XXXX"
                  value={formData.phone}
                    onChange={(e) => {
                      // Only allow numbers and ensure format
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, phone: value });
                    }}
                    className="rounded-l-none flex-1"
                  required
                />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghanaCard">Ghana Card Number</Label>
                <div className="flex">
                  <div className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm">
                    GHA-
                  </div>
                <Input
                  id="ghanaCard"
                    placeholder="XXXXXXXXX-X"
                  value={formData.ghanaCardNumber}
                    onChange={(e) => {
                      // Remove GHA- if user tries to type it, only allow alphanumeric and dash
                      const value = e.target.value.replace(/^GHA-/i, "").replace(/[^0-9A-Za-z-]/g, "");
                      setFormData({ ...formData, ghanaCardNumber: value });
                    }}
                    className="rounded-l-none flex-1"
                  required
                />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verification Method</Label>
                <RadioGroup
                  value={formData.verificationType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, verificationType: value })
                    setOtpSent(false)
                    setOtpCode("")
                    setOtpVerified(false)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email-verify" />
                    <Label htmlFor="email-verify">Verify via Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="phone-verify" />
                    <Label htmlFor="phone-verify">Verify via Phone</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.verificationType === "email" && (
                <div className="space-y-2 mt-3">
                  {!otpSent ? (
                    <>
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!formData.email) {
                            toast.error("Please enter your email address first")
                            return
                          }
                          setIsSendingOtp(true)
                          try {
                            const response = await fetch("/api/student/send-otp", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                email: formData.email,
                                fullName: formData.fullName
                              }),
                            })
                            if (!response.ok) {
                              const error = await response.json()
                              throw new Error(error.error || "Failed to send OTP")
                            }
                            toast.success("OTP sent to your email!")
                            setOtpSent(true)
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to send OTP")
                          } finally {
                            setIsSendingOtp(false)
                          }
                        }}
                        disabled={isSendingOtp || !formData.email}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        {isSendingOtp ? "Sending..." : "Send Verification Code"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Label htmlFor="email-otp" className="text-sm">Enter OTP</Label>
                      <div className="relative">
                        <Input
                          id="email-otp"
                          placeholder="000000"
                          maxLength={6}
                          value={otpCode}
                          onChange={async (e) => {
                            const newCode = e.target.value.replace(/\D/g, "")
                            setOtpCode(newCode)
                            
                            // Auto-verify when 6 digits entered
                            if (newCode.length === 6 && !otpVerified) {
                              setIsVerifyingOtp(true)
                              try {
                                // Verify OTP with backend
                                const response = await fetch("/api/student/verify-otp-before-register", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    email: formData.email,
                                    code: newCode
                                  }),
                                })
                                
                                if (response.ok) {
                                  const data = await response.json()
                                  if (data.verified) {
                                    setOtpVerified(true)
                                    toast.success("✓ OTP verified successfully!")
                                  } else {
                                    setOtpVerified(false)
                                    toast.error("Invalid OTP code")
                                  }
                                } else {
                                  const error = await response.json()
                                  setOtpVerified(false)
                                  toast.error(error.error || "Invalid OTP code")
                                }
                              } catch (error) {
                                setOtpVerified(false)
                                toast.error("Failed to verify OTP")
                              } finally {
                                setIsVerifyingOtp(false)
                              }
                            } else if (newCode.length < 6) {
                              setOtpVerified(false)
                            }
                          }}
                          className={`text-center text-xl tracking-widest font-semibold ${
                            otpVerified ? "border-green-500 bg-green-50" : ""
                          }`}
                          disabled={isVerifyingOtp || otpVerified}
                        />
                        {otpVerified && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        {isVerifyingOtp && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      {otpVerified && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">OTP Verified Successfully!</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setOtpSent(false)
                            setOtpCode("")
                            setOtpVerified(false)
                          }}
                          className="flex-1 text-xs"
                        >
                          Change Email
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            if (!formData.email) {
                              toast.error("Email address is required")
                              return
                            }
                            setIsSendingOtp(true)
                            try {
                              const response = await fetch("/api/student/send-otp", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  email: formData.email,
                                  fullName: formData.fullName
                                }),
                              })
                              if (!response.ok) {
                                const error = await response.json()
                                throw new Error(error.error || "Failed to send OTP")
                              }
                              toast.success("New OTP sent!")
                              setOtpCode("")
                              setOtpVerified(false)
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Failed to resend OTP")
                            } finally {
                              setIsSendingOtp(false)
                            }
                          }}
                          disabled={isSendingOtp || !formData.email}
                          className="flex-1 text-xs"
                        >
                          {isSendingOtp ? "Sending..." : "Resend"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button 
                type="button" 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={formData.verificationType === "email" && (!otpSent || !otpVerified)}
              >
                Next: Academic Information
              </Button>
              {formData.verificationType === "email" && (!otpSent || !otpVerified) && (
                <p className="text-xs text-muted-foreground text-center">
                  {!otpSent ? "Please send and verify OTP before continuing" : "Please verify your OTP before continuing"}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information & Documents</h3>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="e.g., 10123456"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">University/Institution</Label>
                <Select
                  value={formData.university}
                  onValueChange={(value) => setFormData({ ...formData, university: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent>
                    {GHANA_UNIVERSITIES.map((uni) => (
                      <SelectItem key={uni} value={uni}>
                        {uni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Program/Course</Label>
                <Input
                  id="program"
                  placeholder="e.g., Computer Science"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 (First Year)</SelectItem>
                    <SelectItem value="200">200 (Second Year)</SelectItem>
                    <SelectItem value="300">300 (Third Year)</SelectItem>
                    <SelectItem value="400">400 (Fourth Year)</SelectItem>
                    <SelectItem value="500">500+ (Postgraduate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfie">Selfie Photo</Label>
                <Input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "selfie")}
                  required
                />
                {selfiePreview && (
                  <img
                    src={selfiePreview || "/placeholder.svg"}
                    alt="Selfie preview"
                    className="mt-2 h-32 w-32 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idDocument">ID Document (Ghana Card or Student ID)</Label>
                <Input
                  id="idDocument"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "id")}
                  required
                />
                {idDocumentPreview && (
                  <img
                    src={idDocumentPreview || "/placeholder.svg"}
                    alt="ID preview"
                    className="mt-2 h-32 w-auto rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Submitting..." : "Submit KYC"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function VerificationStep({ verificationType }: { verificationType: string }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isFaceProcessing, setIsFaceProcessing] = useState(false)

  const handleVerify = async () => {
    setIsVerifying(true)

    try {
      const studentId = localStorage.getItem("studentId")

      const response = await fetch("/api/student/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          code,
          verificationType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Verification failed")
      }

      setIsFaceProcessing(true)
      const faceResponse = await fetch("/api/student/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })

      if (faceResponse.ok) {
        const faceData = await faceResponse.json()
        toast.success(faceData.message || "Verification completed successfully!")
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push("/student/dashboard")
        }, 1500)
      } else {
      router.push("/student/dashboard")
      }
    } catch (error) {
      console.error("[v0] Verification error:", error)
      toast.error(error instanceof Error ? error.message : "Verification failed. Please try again.")
    } finally {
      setIsVerifying(false)
      setIsFaceProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verify Your {verificationType === "email" ? "Email" : "Phone"}</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your {verificationType === "email" ? "email address" : "phone number"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-xs text-muted-foreground">Demo code: {localStorage.getItem("verificationCode")}</p>
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || isFaceProcessing || code.length !== 6}
          className="w-full"
        >
          {isFaceProcessing ? "Processing face recognition..." : isVerifying ? "Verifying..." : "Verify"}
        </Button>
      </CardContent>
    </Card>
  )
}
