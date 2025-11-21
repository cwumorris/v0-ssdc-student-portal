# Ghana Student Discount Hub
#commit
A comprehensive Next.js student verification platform that enables Ghanaian students to get verified and access exclusive discounts from partner vendors.

## Features

- **Student Registration**: Students sign up with Google OAuth or email/password
- **KYC Verification**: Submit selfie + ID document for automated face recognition
- **Email/Phone Verification**: Verify contact information
- **Automated Face Recognition**: Browser-based face matching for instant verification
- **Manual Admin Review**: Admin review for borderline verification cases
- **Vendor Dashboard**: Vendors can search students and access verification API
- **Vendor API**: RESTful API for third-party integration
- **Admin Dashboard**: Bulk operations, search, filtering, CSV export, and statistics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Database**: Neon PostgreSQL (serverless)
- **Storage**: Vercel Blob (for images/documents)
- **Authentication**: Google OAuth + Email/Password
- **Face Recognition**: Browser-based face-api.js
- **Deployment**: Vercel

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Neon PostgreSQL database
- Vercel Blob storage (optional, for file uploads)
- Google OAuth credentials (optional, for Google sign-in)

### Database Setup (IMPORTANT - Do This First!)

**Before running the application, you MUST create the database tables:**

1. Go to your Neon database console
2. Open the SQL Editor
3. Copy the contents of `scripts/001-create-tables.sql`
4. Execute the SQL script to create all tables

This creates the following tables:
- `students` - Student KYC information
- `vendors` - Vendor business information
- `admin_users` - Admin user management
- `verification_logs` - Audit trail
- `api_access_logs` - Vendor API usage tracking

### Environment Variables

Set these in your Vercel project or `.env.local`:

\`\`\`bash
# Neon Database (Required)
NEON_NEON_DATABASE_URL=your_neon_connection_string

# Vercel Blob (Required for file uploads)
BLOB_READ_WRITE_TOKEN=your_blob_token

# Google OAuth (Required if using Google sign-in)
# Both frontend and backend must use these environment variables (no hardcoded values)
GOOGLE_CLIENT_ID=323603411941-qo0jjuj5qs4vblaf7eno2ivj40mnftpp.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=323603411941-qo0jjuj5qs4vblaf7eno2ivj40mnftpp.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://v0-ssdc-student-portal.vercel.app/api/auth/google/callback
FRONTEND_URL=https://v0-ssdc-student-portal.vercel.app
\`\`\`

### Local Development

1. Install dependencies:
\`\`\`bash
npm install
# or
bun install
\`\`\`

2. Set up environment variables in `.env.local`

3. **Run the database migration script** (see Database Setup above)

4. Start the development server:
\`\`\`bash
npm run dev
# or
bun dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

### Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. **Run the database migration script** in your Neon console
5. Deploy!

## Application Structure

### User Roles

1. **Students**
   - Sign up with Google OAuth or email/password
   - Submit KYC documents (selfie + ID)
   - Verify email or phone number
   - View verification status
   - Access student dashboard

2. **Vendors**
   - Register with business information
   - Upload business documents
   - Wait for admin approval
   - Generate API keys
   - Search students via dashboard
   - Query verification API

3. **Admins**
   - Register admin accounts
   - Review pending verifications
   - Approve/reject students manually
   - Bulk operations
   - Export data to CSV
   - View statistics
   - Manage vendor approvals

## API Endpoints

### Student Authentication
- `POST /api/auth/email/signup` - Email/password signup
- `POST /api/auth/email/signin` - Email/password signin
- `GET /api/auth/google/callback` - Google OAuth callback

### Student Registration & KYC
- `POST /api/student/register` - Submit KYC documents
- `POST /api/student/verify-code` - Verify email/phone code
- `POST /api/student/verify-face` - Trigger face verification
- `GET /api/student/profile` - Get student profile

### Admin
- `POST /api/admin/register` - Register admin account
- `POST /api/admin/login` - Admin login
- `GET /api/admin/students` - List/search students
- `POST /api/admin/students/review` - Approve/reject student
- `POST /api/admin/students/bulk-action` - Bulk approve/reject
- `GET /api/admin/students/export` - Export to CSV
- `GET /api/admin/stats` - Get statistics

### Vendor
- `POST /api/auth/vendor/register` - Register vendor
- `POST /api/vendor/generate-api-key` - Generate API key
- `GET /api/vendor/profile` - Get vendor profile

### Vendor API (Requires API Key)
- `GET /api/v1/verify/student-id?studentId=xxx` - Verify by student ID
- `GET /api/v1/verify/ghana-card?ghanaCard=xxx` - Verify by Ghana card

**API Authentication**: Include `X-API-Key` header with your API key

## Verification Flow

1. **Student Registration**
   - Student signs up with Google or email/password
   - Submits personal and academic information
   - Uploads selfie and ID document
   - Verifies email OR phone number

2. **Automated Verification**
   - Face recognition compares selfie with ID photo
   - System calculates match score (0-100)
   - **Score >= 85%**: Auto-verified ✅
   - **Score 70-85%**: Manual review required 👀
   - **Score < 70%**: Auto-rejected ❌

3. **Manual Review** (if needed)
   - Admin reviews borderline cases
   - Can approve or reject with notes
   - Verification log tracks all actions

4. **Vendor Access**
   - Approved vendors query API
   - Get full student profile + verification status
   - Usage tracked in access logs

## Troubleshooting

### "Registration failed" Error
**Cause**: Database tables don't exist yet

**Solution**: Run the SQL migration script in `scripts/001-create-tables.sql` in your Neon database console

### "Cannot read properties of undefined (reading 'randomUUID')"
**Cause**: Crypto module import issue (already fixed)

**Solution**: Update to latest code version

### Google OAuth Not Working
**Cause**: OAuth credentials not configured or redirect URI mismatch

**Solution**: 
1. Add your Google OAuth credentials to environment variables (see above)
2. In Google Cloud Console, ensure the authorized redirect URI is set to: `https://v0-ssdc-student-portal.vercel.app/api/auth/google/callback`
3. For local development, use: `http://localhost:3000/api/auth/google/callback` (add this to Google Console as well)

### File Upload Failed
**Cause**: Vercel Blob token not configured

**Solution**: Add `BLOB_READ_WRITE_TOKEN` to your environment variables

### Database Connection Error
**Cause**: Neon database URL not set

**Solution**: Add `NEON_DATABASE_URL` to your environment variables

## Database Schema

See `scripts/001-create-tables.sql` for the complete schema including:
- Students table with KYC fields
- Vendors table with business information
- Admin users with role-based access
- Verification logs for audit trail
- API access logs for usage tracking

## Security Notes

- Passwords should be hashed with bcrypt (TODO: implement)
- API keys are generated securely
- File uploads are validated for size and type
- SQL injection protected by parameterized queries
- CORS configured for API endpoints

## Partner Brands

Current partner brands offering student discounts:
- KFC Ghana
- Shoprite
- Game Stores
- Edgars
- Mr. Biggs
- Woodin

## License

MIT License
