# SSDC Backend API

Backend API for Ghana Student Discount Hub built with Node.js, Express.js, Sequelize, and MySQL.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload handling

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ssdc_portal
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-here
```

### 3. Create MySQL Database

```sql
CREATE DATABASE ssdc_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Database Migrations

The models will automatically create tables on first run. Alternatively, you can use Sequelize CLI:

```bash
npm run migrate
```

### 5. Start the Server

**Development mode (with nodemon):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/email/signin` - Email sign in
- `POST /api/auth/email/signup` - Email sign up
- `GET /api/auth/google/callback` - Google OAuth callback

### File Upload
- `POST /api/upload` - Upload file (images/PDFs)

### Student
- `POST /api/student/register` - Student registration (KYC)
- `POST /api/student/profile` - Get student profile
- `POST /api/student/verify-code` - Verify email/phone code
- `POST /api/student/verify-face` - Face recognition verification

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/register` - Admin registration
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/students` - Get students list (with filters)
- `POST /api/admin/students/review` - Approve/reject student
- `POST /api/admin/students/bulk-action` - Bulk approve/reject
- `GET /api/admin/students/export` - Export to CSV
- `GET /api/admin/check-db` - Check database status

### Vendor
- `POST /api/vendor/register` - Vendor registration
- `POST /api/vendor/profile` - Get vendor profile
- `POST /api/vendor/generate-api-key` - Generate API key

### Vendor API (Public - Requires API Key)
- `GET /api/v1/verify/student-id` - Verify by student ID
- `GET /api/v1/verify/ghana-card` - Verify by Ghana card

## Database Models

- **User** - Base user accounts
- **Student** - Student KYC information
- **Vendor** - Vendor business information
- **Admin** - Admin user accounts
- **VerificationLog** - Audit trail for verifications
- **ApiAccessLog** - API usage tracking

## Project Structure

```
backend/
├── config/
│   ├── database.js       # Sequelize configuration
│   └── multer.js         # File upload configuration
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── index.js          # Model associations
│   ├── User.js
│   ├── Student.js
│   ├── Vendor.js
│   ├── Admin.js
│   ├── VerificationLog.js
│   └── ApiAccessLog.js
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── students.js       # Student routes
│   ├── admin.js          # Admin routes
│   ├── vendors.js        # Vendor routes
│   ├── vendor-api.js     # Public vendor API
│   └── upload.js         # File upload routes
├── utils/
│   ├── auth.js           # Auth utilities
│   └── face-recognition.js # Face recognition (simulated)
├── uploads/              # Uploaded files directory
├── server.js             # Express server
├── package.json
└── README.md
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `DB_NAME` - Database name
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `JWT_SECRET` - JWT secret key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `UPLOAD_DIR` - Upload directory (default: ./uploads)
- `MAX_FILE_SIZE` - Max file size in bytes (default: 10MB)

## Notes

- File uploads are stored in the `uploads/` directory
- JWT tokens are used for authentication (optional - can be extended)
- API keys are required for vendor API endpoints
- Face recognition is currently simulated (returns random scores 60-100%)
- All passwords are hashed using bcrypt

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists: `CREATE DATABASE ssdc_portal;`

### Port Already in Use
- Change `PORT` in `.env` or kill the process using port 5000

### Module Not Found
- Run `npm install` to install dependencies

