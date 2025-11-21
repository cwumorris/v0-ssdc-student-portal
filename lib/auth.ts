// Auth functions - UI only mode (database calls removed)
import { randomUUID } from "crypto"

export async function createSession(userId: string, userType: "student" | "vendor" | "admin") {
  // Simple session management - in production, use proper session tokens
  return {
    userId,
    userType,
    createdAt: new Date().toISOString(),
  }
}

export async function getUserFromEmail(email: string) {
  console.log("[v0] getUserFromEmail stubbed:", email)
  return null
}

export async function createUser(data: { email: string; name: string; id?: string }) {
  // Return a mock user ID for UI testing
  const userId = data.id || randomUUID()
  console.log("[v0] createUser stubbed, returning mock ID:", userId)
  return userId
}

export function generateApiKey(): string {
  // Generate a secure API key
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let apiKey = "ssdc_"
  for (let i = 0; i < 32; i++) {
    apiKey += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return apiKey
}

export function generateVerificationCode(): string {
  // Generate 6-digit verification code
  return Math.floor(100000 + Math.random() * 900000).toString()
}
