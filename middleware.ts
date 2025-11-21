import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Simple middleware for protected routes
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ["/student/dashboard", "/vendor/dashboard", "/admin"]

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    // In a real app, check for valid session token
    // For now, we'll allow access
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
