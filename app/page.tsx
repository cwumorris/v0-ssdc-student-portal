import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Users, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Ghana Student Discount Hub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/vendor/register">
              <Button className="bg-green-600 hover:bg-green-700">Register as Vendor</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Ghana Student Discount Hub
          <span className="block text-green-600">Verification Portal</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-gray-600">
          Secure, automated student verification system for Ghanaian students. Get verified once, access discounts
          everywhere.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 bg-green-600 hover:bg-green-700">
              Get Verified
            </Button>
          </Link>
          <Link href="/vendor/register">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 bg-transparent border-green-600 text-green-600 hover:bg-green-50"
            >
              For Vendors
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-green-600" />
              <CardTitle>Fast Verification</CardTitle>
              <CardDescription>Automated face recognition technology verifies your identity in seconds</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your documents are encrypted and stored securely with industry-standard protection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-green-600" />
              <CardTitle>One-Time Setup</CardTitle>
              <CardDescription>Verify once and access student discounts from all partner vendors</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-green-600" />
              <CardTitle>Vendor API</CardTitle>
              <CardDescription>Businesses can instantly verify student status through our secure API</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-balance text-center text-3xl font-bold">How It Works</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
              1
            </div>
            <h3 className="mt-4 text-xl font-semibold">Sign Up</h3>
            <p className="mt-2 text-muted-foreground">Create an account using Google or email</p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
              2
            </div>
            <h3 className="mt-4 text-xl font-semibold">Submit Documents</h3>
            <p className="mt-2 text-muted-foreground">Upload your student ID, Ghana card, and take a selfie</p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
              3
            </div>
            <h3 className="mt-4 text-xl font-semibold">Get Verified</h3>
            <p className="mt-2 text-muted-foreground">Automated verification or admin review within 24 hours</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-green-600 text-white border-0">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <h2 className="text-balance text-3xl font-bold">Ready to Get Verified?</h2>
            <p className="max-w-2xl text-pretty text-lg opacity-90">
              Join thousands of verified students accessing exclusive discounts across Ghana
            </p>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="mt-4 h-12 px-8 bg-white text-green-600 hover:bg-gray-100"
              >
                Start Verification
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Partner Brands Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-balance text-center text-2xl font-bold mb-8">Our Partner Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/kfc-ghana-logo-red-and-white.jpg" alt="KFC Ghana" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/shoprite-logo-green-and-red.jpg" alt="Shoprite" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/game-stores-logo-blue-and-yellow.jpg" alt="Game Stores" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/edgars-fashion-logo-elegant.jpg" alt="Edgars" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/mr-biggs-restaurant-logo-orange.jpg" alt="Mr. Biggs" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md flex items-center justify-center border p-4">
              <img src="/woodin-african-fabric-logo-colorful.jpg" alt="Woodin" className="w-full h-full object-contain" />
            </div>
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
              <Link href="/about" className="hover:text-green-600">
                About Us
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
