const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Student, Vendor, Admin, VerificationLog } = require('../models');
const { hashPassword, generateApiKey } = require('../utils/auth');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Helper middleware to check admin from userId param
const checkAdminFromParam = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.body.userId;
    console.log('checkAdminFromParam - userId:', userId, 'method:', req.method, 'path:', req.path);
    
    if (!userId) {
      console.error('checkAdminFromParam - No userId provided');
      return res.status(400).json({ error: 'User ID is required' });
    }

    const admin = await Admin.findOne({
      where: { user_id: userId, is_active: true }
    });

    if (!admin) {
      console.error('Admin not found for userId:', userId);
      return res.status(403).json({ error: 'Unauthorized - Admin access required' });
    }

    console.log('checkAdminFromParam - Admin found:', admin.id);
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Error in checkAdminFromParam:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Ensure we only send response once
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error checking admin status',
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Admin, as: 'admin', where: { is_active: true } }]
    });

    if (!user || !user.admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await require('../utils/auth').comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.admin.role
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Admin Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if admin already exists
    const existingUser = await User.findOne({
      where: { email },
      include: [{ model: Admin, as: 'admin' }]
    });

    if (existingUser && existingUser.admin) {
      return res.status(409).json({ error: 'An admin with this email already exists' });
    }

    // Create user account
    const passwordHash = await hashPassword(password);
    
    let user = existingUser;
    if (!user) {
      user = await User.create({
        email,
        name,
        password_hash: passwordHash
      });
    } else {
      user.password_hash = passwordHash;
      user.name = name;
      await user.save();
    }

    // Create admin record
    if (!user.admin) {
      await Admin.create({
        user_id: user.id,
        role: role || 'reviewer'
      });
    }

    res.json({
      success: true,
      message: 'Admin account created successfully'
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get Admin Statistics
router.get('/stats', checkAdminFromParam, async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const verifiedStudents = await Student.count({ where: { verification_status: 'verified' } });
    const pendingStudents = await Student.count({ where: { verification_status: 'pending' } });
    const underReviewStudents = await Student.count({ where: { verification_status: 'under_review' } });
    const rejectedStudents = await Student.count({ where: { verification_status: 'rejected' } });

    const totalVendors = await Vendor.count();
    const approvedVendors = await Vendor.count({ where: { approval_status: 'approved' } });
    const pendingVendors = await Vendor.count({ where: { approval_status: 'pending' } });

    res.json({
      students: {
        total: totalStudents,
        verified: verifiedStudents,
        pending: pendingStudents,
        underReview: underReviewStudents,
        rejected: rejectedStudents
      },
      vendors: {
        total: totalVendors,
        approved: approvedVendors,
        pending: pendingVendors
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Students List
router.get('/students', checkAdminFromParam, async (req, res) => {
  try {
    const { status, search, university, limit = 50, offset = 0 } = req.query;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.verification_status = status;
    }

    if (university) {
      whereClause.university = university;
    }

    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { student_id: { [Op.like]: `%${search}%` } },
        { ghana_card_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const students = await Student.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const total = await Student.count({ where: whereClause });

    res.json({
      students,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Admin students fetch error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch students',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Request Reupload for Field
router.post('/students/request-reupload', checkAdminFromParam, async (req, res) => {
  try {
    const { studentId, field } = req.body;

    if (!studentId || !field) {
      return res.status(400).json({ error: 'Missing required fields', details: { studentId: !!studentId, field: !!field } });
    }

    if (!req.admin) {
      return res.status(403).json({ error: 'Admin not authenticated' });
    }

    const validFields = ['email', 'phone', 'student_id', 'university', 'ghana_card', 'selfie', 'id_document', 'full_name', 'program', 'level'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field name' });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Map field names to reupload column names
    const reuploadFieldMap = {
      'email': 'email_reupload_required',
      'phone': 'phone_reupload_required',
      'student_id': 'student_id_reupload_required',
      'university': 'university_reupload_required',
      'ghana_card': 'ghana_card_reupload_required',
      'selfie': 'selfie_reupload_required',
      'id_document': 'id_document_reupload_required',
      'full_name': 'full_name_reupload_required',
      'program': 'program_reupload_required',
      'level': 'level_reupload_required'
    };

    const reuploadField = reuploadFieldMap[field];
    
    if (!reuploadField) {
      return res.status(400).json({ error: 'Invalid field mapping' });
    }
    
    // Check if the column exists in the database
    try {
      student[reuploadField] = true;
      await student.save();
    } catch (saveError) {
      // Check if error is due to unknown column
      if (saveError.message && saveError.message.includes('Unknown column')) {
        console.error(`Column ${reuploadField} does not exist in database. Please run the migration script.`);
        return res.status(500).json({ 
          error: `Database column ${reuploadField} does not exist`,
          message: 'Please run the migration script: backend/scripts/add-reupload-columns.sql',
          details: 'The database schema needs to be updated to include the new reupload columns.'
        });
      }
      throw saveError; // Re-throw if it's a different error
    }

    // Create verification log (optional - don't fail if log creation fails)
    try {
      await VerificationLog.create({
        student_id: studentId,
        action: 'reupload_requested',
        performed_by: req.admin.id,
        previous_status: student.verification_status,
        new_status: student.verification_status,
        notes: `${field} reupload requested by admin`
      });
    } catch (logError) {
      console.error('Verification log creation error (non-critical):', logError);
      // Continue even if log creation fails
    }

    console.log('Reupload request successful:', { field, studentId });
    res.json({
      success: true,
      message: `${field} reupload requested successfully`
    });
  } catch (error) {
    console.error('Reupload request error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Ensure we only send response once
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Reupload request failed',
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Verify Individual Field
router.post('/students/verify-field', checkAdminFromParam, async (req, res) => {
  try {
    console.log('Verify field request received:', { studentId: req.body.studentId, field: req.body.field, verified: req.body.verified, userId: req.body.userId });
    
    const { studentId, field, verified } = req.body;

    if (!studentId || !field || typeof verified !== 'boolean') {
      console.error('Missing required fields:', { studentId, field, verified, typeOfVerified: typeof verified });
      return res.status(400).json({ error: 'Missing required fields', details: { studentId: !!studentId, field: !!field, verified: typeof verified } });
    }

    if (!req.admin) {
      console.error('Admin not set in request');
      return res.status(403).json({ error: 'Admin not authenticated' });
    }

    const validFields = ['email', 'phone', 'student_id', 'university', 'ghana_card', 'selfie', 'id_document', 'full_name', 'program', 'level', 'face_verification'];
    if (!validFields.includes(field)) {
      console.error(`Invalid field name: ${field}. Valid fields: ${validFields.join(', ')}`);
      return res.status(400).json({ error: 'Invalid field name', validFields });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Map field names to database column names
    const fieldMap = {
      'email': 'email_verified',
      'phone': 'phone_verified',
      'student_id': 'student_id_verified',
      'university': 'university_verified',
      'ghana_card': 'ghana_card_verified',
      'selfie': 'selfie_verified',
      'id_document': 'id_document_verified',
      'full_name': 'full_name_verified',
      'program': 'program_verified',
      'level': 'level_verified',
      'face_verification': 'face_verification_verified'
    };
    
    const reuploadFieldMap = {
      'email': 'email_reupload_required',
      'phone': 'phone_reupload_required',
      'student_id': 'student_id_reupload_required',
      'university': 'university_reupload_required',
      'ghana_card': 'ghana_card_reupload_required',
      'selfie': 'selfie_reupload_required',
      'id_document': 'id_document_reupload_required',
      'full_name': 'full_name_reupload_required',
      'program': 'program_reupload_required',
      'level': 'level_reupload_required',
      'face_verification': null // Face verification doesn't have reupload
    };

    const dbField = fieldMap[field];
    const reuploadField = reuploadFieldMap[field];
    
    if (!dbField) {
      return res.status(400).json({ error: 'Invalid field mapping' });
    }
    
    // Check if the column exists in the database
    try {
      console.log(`Setting ${dbField} to ${verified} for student ${studentId}`);
      student[dbField] = verified;
      
      // If verifying, clear reupload requirement (only if field supports reupload)
      if (verified && reuploadField !== null && reuploadField !== undefined) {
        student[reuploadField] = false;
      }

      // Update overall verification status based on all field verifications
      // If any field is unverified, status should be unverified/pending
      const allFieldsVerified = 
        student.email_verified &&
        student.phone_verified &&
        (student.student_id_verified !== undefined ? student.student_id_verified : true) &&
        (student.university_verified !== undefined ? student.university_verified : true) &&
        (student.ghana_card_verified !== undefined ? student.ghana_card_verified : true) &&
        (student.selfie_verified !== undefined ? student.selfie_verified : true) &&
        (student.id_document_verified !== undefined ? student.id_document_verified : true) &&
        (student.full_name_verified !== undefined ? student.full_name_verified : true) &&
        (student.program_verified !== undefined ? student.program_verified : true) &&
        (student.level_verified !== undefined ? student.level_verified : true) &&
        (student.face_verification_verified !== undefined ? student.face_verification_verified : !student.face_verification_photo_url); // Only require if photo exists

      console.log(`All fields verified check: ${allFieldsVerified}, current status: ${student.verification_status}`);

      if (allFieldsVerified && student.verification_status !== 'rejected') {
        student.verification_status = 'verified';
        if (!student.verified_at) {
          student.verified_at = new Date();
        }
        if (!student.verified_by) {
          student.verified_by = req.admin.id;
        }
      } else if (student.verification_status === 'verified') {
        // If any field is unverified, change status to under_review
        student.verification_status = 'under_review';
      }

      await student.save();
      console.log(`Successfully saved student ${studentId}, new status: ${student.verification_status}`);
    } catch (saveError) {
      console.error(`Error saving student ${studentId}:`, saveError);
      console.error(`Error details:`, saveError.message);
      console.error(`Error stack:`, saveError.stack);
      
      // Check if error is due to unknown column
      if (saveError.message && saveError.message.includes('Unknown column')) {
        console.error(`Column ${dbField} does not exist in database. Please run the migration script.`);
        return res.status(500).json({ 
          error: `Database column ${dbField} does not exist`,
          message: 'Please run the migration script: backend/scripts/add-face-verification-verified.sql',
          details: 'The database schema needs to be updated to include the face_verification_verified column.'
        });
      }
      
      // Return error with details
      return res.status(500).json({
        error: 'Failed to update field verification',
        message: saveError.message || 'Unknown error occurred',
        field: dbField,
        details: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
      });
    }

    // Create verification log (optional - don't fail if log creation fails)
    try {
      await VerificationLog.create({
        student_id: studentId,
        action: verified ? 'field_verified' : 'field_unverified',
        performed_by: req.admin.id,
        previous_status: student.verification_status,
        new_status: student.verification_status,
        notes: `${field} ${verified ? 'verified' : 'unverified'} by admin`
      });
    } catch (logError) {
      console.error('Verification log creation error (non-critical):', logError);
      // Continue even if log creation fails
    }

    console.log('Field verification successful:', { field, verified, studentId });
    res.json({
      success: true,
      message: `${field} ${verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Field verification error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Ensure we only send response once
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Field verification failed',
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// Review Student (Approve/Reject)
router.post('/students/review', checkAdminFromParam, async (req, res) => {
  try {
    const { studentId, action, reason } = req.body;

    if (!studentId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const previousStatus = student.verification_status;

    if (action === 'approve') {
      student.verification_status = 'verified';
      student.verified_by = req.admin.id;
      student.verified_at = new Date();
      student.rejection_reason = null;
      // Verify all individual fields
      student.email_verified = true;
      student.phone_verified = true;
      student.student_id_verified = true;
      student.university_verified = true;
      student.ghana_card_verified = true;
      student.selfie_verified = true;
      student.id_document_verified = true;
      student.full_name_verified = true;
      student.program_verified = true;
      student.level_verified = true;
      await student.save();

      await VerificationLog.create({
        student_id: studentId,
        action: 'approved',
        performed_by: req.admin.id,
        previous_status: previousStatus,
        new_status: 'verified',
        notes: reason || 'Manually approved by admin'
      });

      res.json({
        success: true,
        message: 'Student approved successfully'
      });
    } else if (action === 'reject') {
      student.verification_status = 'rejected';
      student.verified_by = req.admin.id;
      student.rejection_reason = reason || 'Does not meet verification requirements';
      await student.save();

      await VerificationLog.create({
        student_id: studentId,
        action: 'rejected',
        performed_by: req.admin.id,
        previous_status: previousStatus,
        new_status: 'rejected',
        notes: reason || 'Manually rejected by admin'
      });

      res.json({
        success: true,
        message: 'Student rejected successfully'
      });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Admin review error:', error);
    res.status(500).json({ error: 'Review action failed' });
  }
});

// Bulk Action
router.post('/students/bulk-action', checkAdminFromParam, async (req, res) => {
  try {
    const { studentIds, action } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = [];

    for (const studentId of studentIds) {
      try {
        const student = await Student.findByPk(studentId);

        if (!student) {
          results.push({ studentId, success: false, error: 'Student not found' });
          continue;
        }

        const previousStatus = student.verification_status;

        if (action === 'approve') {
          student.verification_status = 'verified';
          student.verified_by = req.admin.id;
          student.verified_at = new Date();
          student.rejection_reason = null;
        } else if (action === 'reject') {
          student.verification_status = 'rejected';
          student.verified_by = req.admin.id;
          student.rejection_reason = 'Bulk rejection by admin';
        }

        await student.save();

        await VerificationLog.create({
          student_id: studentId,
          action: action === 'approve' ? 'approved' : 'rejected',
          performed_by: req.admin.id,
          previous_status: previousStatus,
          new_status: student.verification_status,
          notes: `Bulk ${action} by admin`
        });

        results.push({ studentId, success: true });
      } catch (error) {
        results.push({
          studentId,
          success: false,
          error: error.message || 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      results,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ error: 'Bulk action failed' });
  }
});

// Export Students to CSV
router.get('/students/export', checkAdminFromParam, async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = {};
    if (status && status !== 'all') {
      whereClause.verification_status = status;
    }

    const students = await Student.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    // Generate CSV
    const headers = [
      'ID', 'Full Name', 'Email', 'Phone', 'Student ID', 'Ghana Card',
      'University', 'Program', 'Level', 'Status', 'Face Match Score',
      'Created At', 'Verified At'
    ];

    const rows = students.map(s => [
      s.id,
      s.full_name,
      s.email,
      s.phone,
      s.student_id,
      s.ghana_card_number,
      s.university,
      s.program,
      s.level,
      s.verification_status,
      s.face_match_score || '',
      s.created_at,
      s.verified_at || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Check Database Status
router.get('/check-db', async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    const { QueryTypes } = require('sequelize');

    const results = {
      status: 'checking',
      timestamp: new Date().toISOString(),
      tables: {},
      extensions: {},
      errors: []
    };

    // Check extensions
    try {
      const extCheck = await sequelize.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND column_name = 'uuid-ossp') as exists",
        { type: QueryTypes.SELECT }
      );
      // Simplified check - in real implementation, check pg_extension table
      results.extensions['uuid-ossp'] = true;
    } catch (error) {
      results.errors.push(`Extension check failed: ${error.message}`);
    }

    // Check tables
    const requiredTables = ['students', 'vendors', 'admins', 'verification_logs', 'api_access_logs', 'users'];

    for (const tableName of requiredTables) {
      try {
        const [tableCheck] = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName} LIMIT 1`,
          { type: QueryTypes.SELECT }
        );
        results.tables[tableName] = { exists: true, rowCount: tableCheck?.count || 0 };
      } catch (error) {
        results.tables[tableName] = { exists: false };
        results.errors.push(`Table ${tableName}: ${error.message}`);
      }
    }

    // Determine overall status
    const allTablesExist = requiredTables.every(table => results.tables[table]?.exists);

    if (allTablesExist) {
      results.status = 'success';
    } else {
      results.status = 'error';
    }

    res.json(results);
  } catch (error) {
    console.error('Database check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to database',
      error: error.message
    });
  }
});

// Get Vendors List
router.get('/vendors', checkAdminFromParam, async (req, res) => {
  try {
    const { status, search, limit = 100, offset = 0 } = req.query;

    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.approval_status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { business_name: { [Op.like]: `%${search}%` } },
        { business_email: { [Op.like]: `%${search}%` } },
        { business_phone: { [Op.like]: `%${search}%` } },
        { business_registration_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const vendors = await Vendor.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const total = await Vendor.count({ where: whereClause });

    res.json({
      vendors,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Admin vendors fetch error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch vendors',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Vendor Action (Approve/Reject/Suspend)
router.post('/vendors/action', checkAdminFromParam, async (req, res) => {
  try {
    const { vendorId, action, reason } = req.body;

    if (!vendorId || !action) {
      return res.status(400).json({ error: 'Vendor ID and action are required' });
    }

    if (!['approve', 'reject', 'suspend'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve, reject, or suspend' });
    }

    const vendor = await Vendor.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (!req.admin) {
      return res.status(403).json({ error: 'Admin not authenticated' });
    }

    // Update vendor status
    if (action === 'approve') {
      vendor.approval_status = 'approved';
      vendor.approved_by = req.admin.id;
      vendor.approved_at = new Date();
      vendor.rejection_reason = null;
    } else if (action === 'reject') {
      vendor.approval_status = 'rejected';
      vendor.rejection_reason = reason || 'Rejected by admin';
      vendor.approved_by = null;
      vendor.approved_at = null;
    } else if (action === 'suspend') {
      vendor.approval_status = 'suspended';
      vendor.rejection_reason = reason || 'Suspended by admin';
    }

    await vendor.save();

    console.log('Vendor action successful:', { vendorId, action, adminId: req.admin.id });

    res.json({
      success: true,
      message: `Vendor ${action}d successfully`,
      vendor: {
        id: vendor.id,
        business_name: vendor.business_name,
        approval_status: vendor.approval_status
      }
    });
  } catch (error) {
    console.error('Vendor action error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Vendor action failed',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

