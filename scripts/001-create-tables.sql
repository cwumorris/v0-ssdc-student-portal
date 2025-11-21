-- Ghana Student Discount Hub Database Schema
-- Run this script in your Neon SQL Editor to create all required tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table with extended KYC information
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  ghana_card_number TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- for email/password auth
  
  -- Academic Information
  student_id TEXT NOT NULL UNIQUE,
  university TEXT NOT NULL,
  program TEXT NOT NULL,
  level TEXT NOT NULL, -- e.g., 100, 200, 300, 400
  
  -- KYC Documents (Vercel Blob URLs)
  selfie_url TEXT,
  id_document_url TEXT,
  
  -- Verification Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'under_review')),
  face_match_score DECIMAL(5,2), -- 0-100 percentage
  verification_method TEXT CHECK (verification_method IN ('automated', 'manual', 'hybrid')),
  
  -- Verification Details
  verified_by UUID, -- admin id who verified manually
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Email/Phone Verification
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- OAuth
  google_id TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Business Information
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL UNIQUE,
  business_phone TEXT NOT NULL,
  business_registration_number TEXT,
  business_address TEXT,
  password_hash TEXT NOT NULL,
  
  -- Business Documents (Vercel Blob URLs)
  business_certificate_url TEXT NOT NULL,
  business_license_url TEXT,
  
  -- API Access
  api_key TEXT UNIQUE,
  api_key_created_at TIMESTAMP WITH TIME ZONE,
  api_calls_count INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000, -- monthly limit
  
  -- Approval Status
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID, -- admin id
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users table (for role management)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Admin Details
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'reviewer' CHECK (role IN ('super_admin', 'admin', 'reviewer')),
  permissions JSONB DEFAULT '{"can_approve": true, "can_reject": true, "can_export": false, "can_manage_vendors": false}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Logs (for audit trail)
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Log Details
  action TEXT NOT NULL, -- 'submitted', 'auto_verified', 'auto_rejected', 'manual_review', 'approved', 'rejected'
  performed_by UUID, -- admin id or NULL for system
  previous_status TEXT,
  new_status TEXT,
  face_match_score DECIMAL(5,2),
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Access Logs (for vendor API usage tracking)
CREATE TABLE IF NOT EXISTS api_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Request Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  query_params JSONB,
  response_status INTEGER,
  
  -- Student Queried
  student_id_queried TEXT,
  ghana_card_queried TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_ghana_card ON students(ghana_card_number);
CREATE INDEX IF NOT EXISTS idx_students_verification_status ON students(verification_status);
CREATE INDEX IF NOT EXISTS idx_students_google_id ON students(google_id);

CREATE INDEX IF NOT EXISTS idx_vendors_business_email ON vendors(business_email);
CREATE INDEX IF NOT EXISTS idx_vendors_api_key ON vendors(api_key);
CREATE INDEX IF NOT EXISTS idx_vendors_approval_status ON vendors(approval_status);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

CREATE INDEX IF NOT EXISTS idx_verification_logs_student_id ON verification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_api_access_logs_vendor_id ON api_access_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_api_access_logs_created_at ON api_access_logs(created_at);
