// Database functions stubbed out - UI only mode
// All database operations return empty/mock responses

// Stubbed SQL function - returns empty array
export const sql = async (strings: TemplateStringsArray, ...values: any[]): Promise<any[]> => {
  console.log("[v0] Database call stubbed (UI only mode):", strings[0])
  return []
}

export function getSql() {
  return sql as any
}

// Database helper functions - all stubbed
export async function getStudentByEmail(email: string) {
  console.log("[v0] getStudentByEmail stubbed:", email)
  return null
}

export async function getStudentByStudentId(studentId: string) {
  console.log("[v0] getStudentByStudentId stubbed:", studentId)
  return null
}

export async function getStudentByGhanaCard(ghanaCard: string) {
  console.log("[v0] getStudentByGhanaCard stubbed:", ghanaCard)
  return null
}

export async function getVendorByApiKey(apiKey: string) {
  console.log("[v0] getVendorByApiKey stubbed:", apiKey)
  return null
}

export async function getVendorByUserId(userId: string) {
  console.log("[v0] getVendorByUserId stubbed:", userId)
  return null
}

export async function isAdmin(userId: string) {
  console.log("[v0] isAdmin stubbed:", userId)
  return null
}

export async function createVerificationLog(data: {
  studentId: string
  action: string
  performedBy: string
  previousStatus?: string
  newStatus?: string
  faceMatchScore?: number
  notes?: string
}) {
  console.log("[v0] createVerificationLog stubbed:", data)
  return Promise.resolve()
}

export async function logApiAccess(data: {
  vendorId: string
  endpoint: string
  method: string
  queryParams?: any
  responseStatus: number
  studentIdQueried?: string
  ghanaCardQueried?: string
}) {
  console.log("[v0] logApiAccess stubbed:", data)
  return Promise.resolve()
}
