export interface Student {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string
  ghana_card_number: string
  student_id: string
  university: string
  program: string
  level: string
  selfie_url: string | null
  id_document_url: string | null
  verification_status: "pending" | "verified" | "rejected" | "under_review"
  face_match_score: number | null
  verification_method: "automated" | "manual" | "hybrid" | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  email_verified: boolean
  phone_verified: boolean
  student_id_verified: boolean
  university_verified: boolean
  ghana_card_verified: boolean
  selfie_verified: boolean
  id_document_verified: boolean
  full_name_verified: boolean
  program_verified: boolean
  level_verified: boolean
  email_reupload_required: boolean
  phone_reupload_required: boolean
  selfie_reupload_required: boolean
  id_document_reupload_required: boolean
  student_id_reupload_required: boolean
  university_reupload_required: boolean
  ghana_card_reupload_required: boolean
  full_name_reupload_required: boolean
  program_reupload_required: boolean
  level_reupload_required: boolean
  verification_code: string | null
  verification_code_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  user_id: string | null
  business_name: string
  business_email: string
  business_phone: string
  business_registration_number: string | null
  business_address: string | null
  business_certificate_url: string | null
  business_license_url: string | null
  api_key: string | null
  api_key_created_at: string | null
  api_calls_count: number
  api_calls_limit: number
  approval_status: "pending" | "approved" | "rejected" | "suspended"
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface VerificationLog {
  id: string
  student_id: string
  action: string
  performed_by: string
  previous_status: string | null
  new_status: string | null
  face_match_score: number | null
  notes: string | null
  created_at: string
}

export interface ApiAccessLog {
  id: string
  vendor_id: string
  endpoint: string
  method: string
  query_params: any
  response_status: number
  student_id_queried: string | null
  ghana_card_queried: string | null
  created_at: string
}

export interface AdminUser {
  id: string
  user_id: string
  role: "super_admin" | "admin" | "reviewer"
  permissions: {
    can_approve: boolean
    can_reject: boolean
    can_export: boolean
    can_manage_vendors: boolean
  }
  created_at: string
  updated_at: string
}
