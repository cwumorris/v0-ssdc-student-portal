"use client"

import { useEffect } from "react"
import { GoogleSignIn } from "@/components/auth/google-sign-in"
import { EmailSignIn } from "@/components/auth/email-sign-in"
import { VendorOTPLogin } from "@/components/auth/vendor-otp-login"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "sonner"
import Link from "next/link"

export default function LoginPage() {
  useEffect(() => {
    // Check for OAuth errors in URL
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    
    if (error) {
      let errorMessage = "Authentication failed. Please try again."
      
      switch (error) {
        case 'oauth_not_configured':
          errorMessage = "Google sign-in is not configured. Please contact support."
          break
        case 'oauth_failed':
          errorMessage = "Google authentication failed. Please try again."
          break
        case 'token_failed':
          errorMessage = "Failed to authenticate with Google. Please try again."
          break
        case 'userinfo_failed':
          errorMessage = "Failed to retrieve user information from Google. Please try again."
          break
        case 'callback_failed':
          errorMessage = "Authentication callback failed. Please try again."
          break
        case 'no_code':
          errorMessage = "No authorization code received. Please try signing in again."
          break
      }
      
      toast.error(errorMessage)
      
      // Clean up URL
      window.history.replaceState({}, '', '/login')
    }
  }, [])
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-yellow-100 p-4">
      <div className="absolute top-4 left-4">
        <BackButton href="/" label="Home" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Ghana Student Discount Hub</CardTitle>
          <CardDescription className="text-center">Student Verification System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
            </TabsList>

            <TabsContent value="student" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to get verified and access student discounts
                </p>

                <GoogleSignIn />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <EmailSignIn />
              </div>
            </TabsContent>

            <TabsContent value="vendor" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in with your business email to access student verification
                </p>
                
                <VendorOTPLogin />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    New vendor? Register your business
                  </p>
                  <Link href="/vendor/register">
                    <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2">
                      Register as Vendor
                    </button>
                  </Link>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <Link href="/admin/login" className="text-green-600 hover:underline">
              Admin Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
