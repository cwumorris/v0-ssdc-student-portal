import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle, Users, Lock, Zap, Globe } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Ghana Student Discount Hub</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            About Ghana Student Discount Hub
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-gray-600">
            Empowering Ghanaian students with verified access to exclusive discounts while providing businesses with a
            secure, reliable student verification system.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              Ghana Student Discount Hub is a comprehensive student verification platform designed to bridge the gap
              between Ghanaian students and businesses offering student discounts. We understand that students face
              financial challenges, and businesses want to support education while ensuring their discounts reach
              genuine students.
            </p>
            <p className="leading-relaxed">
              Our platform solves this problem by providing a secure, automated verification system that confirms
              student status using advanced face recognition technology and document verification. Students verify once
              and gain access to discounts from all our partner vendors across Ghana.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-balance text-center text-3xl font-bold mb-12">How We Verify Students</h2>
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle>Student Registration</CardTitle>
              <CardDescription>
                Students create an account using Google OAuth or email, then submit their personal information,
                university details, and academic program.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle>Document Submission</CardTitle>
              <CardDescription>
                Students upload a selfie photo and their student ID or Ghana card. All documents are securely stored and
                encrypted for privacy protection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Zap className="h-6 w-6" />
              </div>
              <CardTitle>Automated Verification</CardTitle>
              <CardDescription>
                Our face recognition system compares the selfie with the ID photo, generating a match score. High scores
                (85%+) are auto-verified instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <CardTitle>Manual Review</CardTitle>
              <CardDescription>
                Cases with moderate match scores (70-85%) are reviewed by our admin team to ensure accuracy and prevent
                false rejections.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Lock className="h-6 w-6" />
              </div>
              <CardTitle>Secure API Access</CardTitle>
              <CardDescription>
                Verified vendors receive API keys to query student verification status in real-time, ensuring only
                genuine students receive discounts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Globe className="h-6 w-6" />
              </div>
              <CardTitle>Nationwide Access</CardTitle>
              <CardDescription>
                Once verified, students can access discounts from all partner vendors across Ghana without repeated
                verification processes.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* For Vendors Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-4xl bg-green-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl">For Vendors & Businesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed opacity-90">
              Are you a business looking to offer student discounts? Ghana Student Discount Hub provides you with the
              tools to verify student status instantly and securely.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90">
                  <strong>API Integration:</strong> Query student verification status via our REST API with your unique
                  API key
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90">
                  <strong>Dashboard Access:</strong> Search and verify students through our web dashboard interface
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90">
                  <strong>Usage Analytics:</strong> Track your API usage and monitor verification requests
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed opacity-90">
                  <strong>Fraud Prevention:</strong> Ensure only verified students receive your discounts
                </p>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/vendor/register">
                <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                  Register Your Business
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Security & Privacy Section */}
      <section className="container mx-auto px-4 py-12">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p className="leading-relaxed">
              We take data security and student privacy seriously. All uploaded documents are encrypted and stored
              securely using industry-standard protocols. Face recognition processing happens in real-time and no
              biometric data is permanently stored.
            </p>
            <p className="leading-relaxed">
              Vendors only receive verification status information - they never have access to student documents or
              personal photos. Our API logs all verification requests for audit purposes and fraud prevention.
            </p>
            <p className="leading-relaxed">
              Students maintain full control over their data and can request deletion at any time through their
              dashboard.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-pretty text-lg text-muted-foreground mb-8">
            Join thousands of verified students accessing exclusive discounts across Ghana
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Verify as Student
              </Button>
            </Link>
            <Link href="/vendor/register">
              <Button
                size="lg"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
              >
                Register as Vendor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Ghana Student Discount Hub</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-green-600">
                Home
              </Link>
              <Link href="/admin/login" className="hover:text-green-600">
                Admin Login
              </Link>
              <Link href="/vendor/register" className="hover:text-green-600">
                Vendor Registration
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
