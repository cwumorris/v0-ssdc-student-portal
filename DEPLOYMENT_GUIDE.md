# SSDC Student Verification Portal - Ubuntu Deployment Guide

## System Requirements
- Ubuntu 20.04 LTS or later
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Internet connection

## Prerequisites Installation

### Step 1: Update System Packages
\`\`\`bash
sudo apt-get update
sudo apt-get upgrade -y
\`\`\`

### Step 2: Install Docker and Docker Compose
\`\`\`bash
# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add current user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
\`\`\`

### Step 3: Install Git (if not already installed)
\`\`\`bash
sudo apt-get install -y git
\`\`\`

### Step 4: Install Python and pip (for local development, optional)
\`\`\`bash
sudo apt-get install -y python3 python3-pip python3-venv
\`\`\`

## Deployment Steps

### Step 1: Clone or Download the Project
\`\`\`bash
# Option A: Clone from GitHub (if you have a repo)
git clone <your-repo-url>
cd ssdc-student-portal

# Option B: Create project directory and add files
mkdir ssdc-student-portal
cd ssdc-student-portal
# Copy all project files here
\`\`\`

### Step 2: Verify Project Structure
Ensure you have these files in the project root:
\`\`\`
ssdc-student-portal/
├── app.py
├── models.py
├── tasks.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env (create this)
├── routes/
│   ├── auth.py
│   ├── students.py
│   ├── admin.py
│   └── vendors.py
├── templates/
│   ├── base.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── admin_dashboard.html
└── static/
    ├── css/
    └── js/
\`\`\`

### Step 3: Create Environment File
\`\`\`bash
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://ssdc_user:ssdc_password@db:5432/ssdc_portal

# Redis Configuration
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production-$(openssl rand -hex 32)

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# Google OAuth (optional, add if using OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Upload Configuration
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes
UPLOAD_FOLDER=uploads

# Email Configuration (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
EOF
\`\`\`

### Step 4: Build and Start Docker Containers
\`\`\`bash
# Build the Docker images
docker-compose build

# Start all services in the background
docker-compose up -d

# Verify all services are running
docker-compose ps
\`\`\`

Expected output:
\`\`\`
NAME                COMMAND                  SERVICE             STATUS              PORTS
ssdc-db             "docker-entrypoint.s…"   db                  Up (healthy)        0.0.0.0:5432->5432/tcp
ssdc-redis          "redis-server"           redis               Up (healthy)        0.0.0.0:6379->6379/tcp
ssdc-web            "gunicorn --bind 0.0…"   web                 Up                  0.0.0.0:5000->5000/tcp
ssdc-celery-worker  "celery -A tasks work…"  celery_worker       Up                  
\`\`\`

### Step 5: Initialize Database
\`\`\`bash
# Run database migrations
docker-compose exec web flask db upgrade

# Or create tables manually
docker-compose exec web python -c "from app import create_app, db; app = create_app(); db.create_all()"
\`\`\`

### Step 6: Verify Deployment
\`\`\`bash
# Check if the API is responding
curl http://localhost:5000/api/health

# View logs
docker-compose logs -f web

# Check specific service logs
docker-compose logs -f celery_worker
docker-compose logs -f db
\`\`\`

## Accessing the Application

- **Web Interface**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api
- **PostgreSQL**: localhost:5432 (user: ssdc_user, password: ssdc_password)
- **Redis**: localhost:6379

## Common Commands

### View Logs
\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f celery_worker
docker-compose logs -f db
\`\`\`

### Stop Services
\`\`\`bash
docker-compose down
\`\`\`

### Stop and Remove All Data
\`\`\`bash
docker-compose down -v
\`\`\`

### Restart Services
\`\`\`bash
docker-compose restart
\`\`\`

### Access Database Shell
\`\`\`bash
docker-compose exec db psql -U ssdc_user -d ssdc_portal
\`\`\`

### Access Redis CLI
\`\`\`bash
docker-compose exec redis redis-cli
\`\`\`

### View Running Processes
\`\`\`bash
docker-compose ps
\`\`\`

## Troubleshooting

### Issue: "Port 5000 already in use"
\`\`\`bash
# Find and kill the process using port 5000
sudo lsof -i :5000
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
# Change "5000:5000" to "8000:5000"
\`\`\`

### Issue: "Database connection refused"
\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
\`\`\`

### Issue: "Celery worker not processing tasks"
\`\`\`bash
# Check Celery logs
docker-compose logs celery_worker

# Restart Celery worker
docker-compose restart celery_worker

# Check Redis connection
docker-compose exec redis redis-cli ping
\`\`\`

### Issue: "Face recognition library errors"
\`\`\`bash
# The Dockerfile installs required system dependencies
# If you still get errors, rebuild the image
docker-compose build --no-cache
docker-compose up -d
\`\`\`

### Issue: "Permission denied" errors
\`\`\`bash
# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo for docker commands
sudo docker-compose up -d
\`\`\`

## Production Deployment Considerations

### 1. Security
- Change all default passwords in `.env`
- Use strong JWT_SECRET_KEY
- Enable HTTPS/SSL
- Set `FLASK_DEBUG=False`
- Use environment-specific secrets management

### 2. Performance
- Increase Gunicorn workers: `--workers 8` (in Dockerfile)
- Use a reverse proxy (Nginx)
- Enable caching headers
- Monitor resource usage

### 3. Monitoring
- Set up log aggregation (ELK Stack, Datadog)
- Monitor database performance
- Track Celery task execution
- Set up alerts for service failures

### 4. Backup
\`\`\`bash
# Backup PostgreSQL database
docker-compose exec db pg_dump -U ssdc_user ssdc_portal > backup.sql

# Restore from backup
docker-compose exec -T db psql -U ssdc_user ssdc_portal < backup.sql

# Backup uploads folder
tar -czf uploads_backup.tar.gz uploads/
\`\`\`

### 5. Updates
\`\`\`bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token

### Students
- `POST /api/students/register` - Student registration with KYC
- `GET /api/students/<id>` - Get student profile
- `PUT /api/students/<id>` - Update student profile
- `GET /api/students/<id>/status` - Get verification status

### Admin
- `GET /api/admin/students` - List all students (with filtering)
- `GET /api/admin/students/<id>` - Get student details
- `POST /api/admin/students/<id>/approve` - Approve student
- `POST /api/admin/students/<id>/reject` - Reject student
- `GET /api/admin/export` - Export students to CSV
- `POST /api/admin/bulk-action` - Bulk approve/reject

### Vendors
- `POST /api/vendors/verify` - Verify student by ID
- `GET /api/vendors/verify/<student_id>` - Get verification status
- `GET /api/vendors/stats` - Get verification statistics

## Support and Debugging

For detailed logs and debugging:
\`\`\`bash
# Enable verbose logging
docker-compose exec web python -c "import logging; logging.basicConfig(level=logging.DEBUG)"

# Check system resources
docker stats

# Inspect container
docker-compose exec web bash
\`\`\`

---

**Last Updated**: October 2025
**Version**: 1.0
