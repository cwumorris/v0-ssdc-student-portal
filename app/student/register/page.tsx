"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KYCForm } from "@/components/student/kyc-form"

export default function StudentRegister() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

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
        
        // Clear query params from URL
        window.history.replaceState({}, '', '/student/register')
        
        setUserId(userId)
        setUserEmail(email)
        setUserName(name)
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
  }, [router])

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <KYCForm userId={userId} userEmail={userEmail || ""} userName={userName || ""} />
    </div>
  )
}

