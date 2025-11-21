"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function VendorOTPLogin() {
  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your business email")
      return
    }

    setIsSendingOtp(true)
    try {
      const response = await fetch("/api/auth/vendor/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        toast.success("OTP sent to your email")
      } else {
        toast.error(data.error || "Failed to send OTP")
      }
    } catch (error) {
      console.error("[v0] Send OTP error:", error)
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode) {
      toast.error("Please enter OTP")
      return
    }

    setIsVerifyingOtp(true)
    try {
      const response = await fetch("/api/auth/vendor/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store vendor session
        localStorage.setItem("userId", data.userId)
        localStorage.setItem("userEmail", data.email)
        localStorage.setItem("userName", data.name)
        localStorage.setItem("userRole", "vendor")

        toast.success("Login successful!")
        router.push("/vendor/dashboard")
      } else {
        toast.error(data.error || "Invalid OTP")
      }
    } catch (error) {
      console.error("[v0] Verify OTP error:", error)
      toast.error("Failed to verify OTP. Please try again.")
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  if (!otpSent) {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vendor-email">Business Email</Label>
          <Input
            id="vendor-email"
            type="email"
            placeholder="business@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSendingOtp}>
          {isSendingOtp ? "Sending OTP..." : "Send OTP"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vendor-otp">Enter OTP</Label>
        <Input
          id="vendor-otp"
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          required
        />
        <p className="text-xs text-muted-foreground">Check your email for the verification code</p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            setOtpSent(false)
            setOtpCode("")
          }}
        >
          Change Email
        </Button>
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isVerifyingOtp}>
          {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
        </Button>
      </div>
    </form>
  )
}

