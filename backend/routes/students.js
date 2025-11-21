const express = require('express');
const router = express.Router();
const { Student, VerificationLog } = require('../models');
const { generateVerificationCode } = require('../utils/auth');
const { compareFaces } = require('../utils/face-recognition');
const { sendVerificationEmail } = require('../utils/email');
const { storeOtp, verifyOtp } = require('../utils/otp-cache');

// Student Registration (KYC Submission)
router.post('/register', async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      ghanaCardNumber,
      studentId,
      university,
      program,
      level,
      selfieUrl,
      idDocumentUrl,
      verificationType,
      emailOtp
    } = req.body;

    // Validate required fields
    if (!userId || !fullName || !email || !phone || !ghanaCardNumber || 
        !studentId || !university || !program || !level || !selfieUrl || !idDocumentUrl) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for duplicates
    const { Op } = require('sequelize');
    const existingStudent = await Student.findOne({
      where: {
        [Op.or]: [
          { email },
          { student_id: studentId },
          { ghana_card_number: ghanaCardNumber }
        ]
      }
    });

    if (existingStudent) {
      return res.status(409).json({
        error: 'A student with this email, student ID, or Ghana card number already exists'
      });
    }

    // If email verification, check OTP from cache (remove after verification since registration is complete)
    if (verificationType === 'email' && emailOtp) {
      const otpValidation = verifyOtp(email, emailOtp, true); // true = remove after verify
      
      if (!otpValidation.valid) {
        return res.status(400).json({ error: otpValidation.error });
      }
    }

    // Generate verification code for phone or if email OTP not provided
    const verificationCode = verificationType === 'email' && emailOtp ? null : generateVerificationCode();
    const verificationCodeExpiresAt = verificationType === 'email' && emailOtp ? null : new Date(Date.now() + 15 * 60 * 1000);

    // Create student record
    const student = await Student.create({
      user_id: userId,
      full_name: fullName,
      email,
      phone,
      ghana_card_number: ghanaCardNumber,
      student_id: studentId,
      university,
      program,
      level,
      selfie_url: selfieUrl,
      id_document_url: idDocumentUrl,
      verification_status: 'pending',
      verification_code: verificationCode,
      verification_code_expires_at: verificationCodeExpiresAt,
      email_verified: verificationType === 'email' && emailOtp ? true : (verificationType === 'phone'),
      phone_verified: verificationType === 'phone'
    });

    // Create verification log
    await VerificationLog.create({
      student_id: student.id,
      action: 'submitted',
      performed_by: userId,
      new_status: 'pending',
      notes: 'KYC documents submitted'
    });

    if (verificationType === 'email' && emailOtp) {
      // Email already verified during registration
      res.json({
        success: true,
        studentId: student.id,
        message: 'Registration successful! Email verified.'
      });
    } else {
      // Phone verification - code sent
      console.log(`Verification code for ${verificationType}: ${verificationCode}`);
      res.json({
        success: true,
        studentId: student.id,
        verificationCode, // Remove in production - only for demo
        message: `Verification code sent to your ${verificationType}`
      });
    }
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify OTP before registration (for email verification flow)
// This only checks OTP without removing it - OTP will be removed during registration
router.post('/verify-otp-before-register', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Verify without removing - OTP will be removed only during final registration
    const otpValidation = verifyOtp(email, code, false); // false = don't remove after verify

    if (otpValidation.valid) {
      res.json({ verified: true, message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ verified: false, error: otpValidation.error });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ verified: false, error: 'Verification failed' });
  }
});

// Send OTP via Email
router.post('/send-otp', async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in cache for validation during registration
    storeOtp(email, verificationCode, verificationCodeExpiresAt);

    // Send email
    try {
      await sendVerificationEmail(email, verificationCode, fullName || 'Student');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send email. Please check your email configuration.' 
      });
    }

    // Return code (for development - remove in production)
    res.json({
      success: true,
      message: 'OTP sent to email successfully',
      // Remove this in production:
      code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Get Student Profile
router.post('/profile', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching profile for userId:', userId, 'Type:', typeof userId);

    // Try to find student with user_id - Sequelize handles UUID conversion automatically
    const student = await Student.findOne({
      where: { user_id: userId }
    });

    if (student) {
      console.log('Student found:', { 
        id: student.id, 
        email: student.email, 
        verification_status: student.verification_status,
        full_name: student.full_name,
        user_id: student.user_id,
        user_id_type: typeof student.user_id
      });
    } else {
      console.log('No student found for userId:', userId);
      // Debug: Check if any students exist and show their user_ids
      try {
        const allStudents = await Student.findAll({ 
          limit: 5,
          attributes: ['id', 'email', 'user_id']
        });
        console.log('Total students checked:', allStudents.length);
        if (allStudents.length > 0) {
          allStudents.forEach((s, idx) => {
            console.log(`Student ${idx + 1}: user_id=${s.user_id} (type: ${typeof s.user_id}), email=${s.email}`);
          });
        }
      } catch (debugError) {
        console.error('Error fetching students for debug:', debugError.message);
      }
    }

    res.json({
      student: student ? student.toJSON() : null
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

// Verify Code (Email/Phone)
router.post('/verify-code', async (req, res) => {
  try {
    const { studentId, code, verificationType } = req.body;

    if (!studentId || !code || !verificationType) {
      return res.status(400).json({
        error: 'Student ID, code, and verification type are required'
      });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if code is expired
    if (student.verification_code_expires_at && 
        new Date() > new Date(student.verification_code_expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify code
    if (student.verification_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update verification status
    if (verificationType === 'email') {
      student.email_verified = true;
    } else if (verificationType === 'phone') {
      student.phone_verified = true;
    }

    student.verification_code = null;
    student.verification_code_expires_at = null;
    await student.save();

    res.json({
      success: true,
      message: `${verificationType === 'email' ? 'Email' : 'Phone'} verified successfully`
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Verify Face
router.post('/verify-face', async (req, res) => {
  try {
    const { userId, verificationPhotoUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find student by user_id
    const student = await Student.findOne({
      where: { user_id: userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.selfie_url || !student.id_document_url) {
      return res.status(400).json({ error: 'Missing required documents' });
    }

    // If verification photo is provided (new live capture), compare with existing photos
    // Otherwise, compare existing selfie with ID document
    let photo1 = student.selfie_url;
    let photo2 = student.id_document_url;
    
    if (verificationPhotoUrl) {
      // Compare new verification photo with selfie and ID document
      // Use the better match score
      const match1 = await compareFaces(verificationPhotoUrl, student.selfie_url);
      const match2 = await compareFaces(verificationPhotoUrl, student.id_document_url);
      
      // Use the higher score
      const faceMatchResult = match1.score >= match2.score ? match1 : match2;
      
      // Store verification photo URL if provided (field may not exist in DB yet)
      try {
        student.face_verification_photo_url = verificationPhotoUrl;
      } catch (error) {
        // Field might not exist in database - log but continue
        console.warn('face_verification_photo_url field may not exist in database:', error.message);
      }
      
      // Update student record
      student.face_match_score = faceMatchResult.score;
      student.verification_method = faceMatchResult.method;
      
      // If score is high enough, auto-verify, otherwise send for admin review
      if (faceMatchResult.status === 'verified') {
        student.verification_status = 'verified';
        student.verified_at = new Date();
        student.email_verified = true;
        student.phone_verified = true;
        student.selfie_verified = true;
      } else {
        // Send for admin review
        student.verification_status = 'under_review';
      }

      await student.save();

      // Create verification log
      await VerificationLog.create({
        student_id: student.id,
        action: faceMatchResult.status === 'verified' ? 'auto_verified' :
                faceMatchResult.status === 'rejected' ? 'auto_rejected' : 'manual_review',
        performed_by: userId,
        previous_status: student.verification_status || 'pending',
        new_status: faceMatchResult.status === 'verified' ? 'verified' : 'under_review',
        face_match_score: faceMatchResult.score,
        notes: `Face verification: ${faceMatchResult.score}% match, Confidence: ${faceMatchResult.confidence}. Photo submitted for review.`
      });

      const message = faceMatchResult.status === 'verified' 
        ? 'Verification successful! Your face matches your documents.'
        : faceMatchResult.status === 'under_review'
        ? 'Your photo has been submitted for admin review. We will notify you once verified.'
        : 'Verification failed. Please try again with a clearer photo.';

      res.json({
        success: true,
        faceMatchResult,
        message,
        requiresAdminReview: faceMatchResult.status !== 'verified'
      });
    } else {
      // Original flow: compare selfie with ID document
      const faceMatchResult = await compareFaces(student.selfie_url, student.id_document_url);

      // Update student record
      student.face_match_score = faceMatchResult.score;
      student.verification_status = faceMatchResult.status;
      student.verification_method = faceMatchResult.method;

      if (faceMatchResult.status === 'verified') {
        student.verified_at = new Date();
      }

      await student.save();

      // Create verification log
      await VerificationLog.create({
        student_id: student.id,
        action: faceMatchResult.status === 'verified' ? 'auto_verified' :
                faceMatchResult.status === 'rejected' ? 'auto_rejected' : 'manual_review',
        performed_by: null, // system
        previous_status: 'pending',
        new_status: faceMatchResult.status,
        face_match_score: faceMatchResult.score,
        notes: `Face match score: ${faceMatchResult.score}%, Confidence: ${faceMatchResult.confidence}`
      });

      const message = faceMatchResult.status === 'verified' 
        ? 'Verification successful!'
        : faceMatchResult.status === 'under_review'
        ? 'Your submission is under manual review'
        : 'Verification failed. Please resubmit with clearer photos.';

      res.json({
        success: true,
        faceMatchResult,
        message
      });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ error: 'Verification failed', message: error.message });
  }
});

// Reupload Field
router.post('/reupload-field', async (req, res) => {
  try {
    const { userId, field, value, fileUrl } = req.body;

    if (!userId || !field) {
      return res.status(400).json({ error: 'User ID and field are required' });
    }

    // Validate field
    const validFields = ['email', 'phone', 'student_id', 'university', 'ghana_card', 'selfie', 'id_document', 'full_name', 'program', 'level'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field name' });
    }

    // Find student
    const student = await Student.findOne({
      where: { user_id: userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Map field names to database columns
    const fieldMap = {
      'email': 'email',
      'phone': 'phone',
      'student_id': 'student_id',
      'university': 'university',
      'ghana_card': 'ghana_card_number',
      'selfie': 'selfie_url',
      'id_document': 'id_document_url',
      'full_name': 'full_name',
      'program': 'program',
      'level': 'level'
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
      'level': 'level_reupload_required'
    };

    const verificationFieldMap = {
      'email': 'email_verified',
      'phone': 'phone_verified',
      'student_id': 'student_id_verified',
      'university': 'university_verified',
      'ghana_card': 'ghana_card_verified',
      'selfie': 'selfie_verified',
      'id_document': 'id_document_verified',
      'full_name': 'full_name_verified',
      'program': 'program_verified',
      'level': 'level_verified'
    };

    const dbField = fieldMap[field];
    const reuploadField = reuploadFieldMap[field];
    const verificationField = verificationFieldMap[field];

    if (!dbField || !reuploadField) {
      return res.status(400).json({ error: 'Invalid field mapping' });
    }

    // Check if reupload is actually required
    if (!student[reuploadField]) {
      return res.status(400).json({ error: 'Reupload not required for this field' });
    }

    // Handle file uploads (selfie, id_document)
    if (field === 'selfie' || field === 'id_document') {
      if (!fileUrl) {
        return res.status(400).json({ error: 'File URL is required for document uploads' });
      }
      student[dbField] = fileUrl;
    } else {
      // Handle text fields
      if (!value) {
        return res.status(400).json({ error: 'Value is required for text fields' });
      }
      student[dbField] = value;
    }

    // Clear reupload requirement
    student[reuploadField] = false;
    
    // Reset verification status for this field
    if (verificationField) {
      student[verificationField] = false;
    }

    // If email is reuploaded, handle OTP verification
    if (field === 'email' && value) {
      const { emailOtp } = req.body;
      if (emailOtp) {
        const otpValidation = verifyOtp(value, emailOtp, true);
        if (otpValidation.valid) {
          student.email_verified = true;
        } else {
          return res.status(400).json({ error: otpValidation.error });
        }
      }
    }

    await student.save();

    // Create verification log
    try {
      await VerificationLog.create({
        student_id: student.id,
        action: 'field_reuploaded',
        performed_by: userId,
        previous_status: student.verification_status,
        new_status: student.verification_status,
        notes: `${field} reuploaded by student`
      });
    } catch (logError) {
      console.error('Verification log creation error (non-critical):', logError);
    }

    res.json({
      success: true,
      message: `${field} reuploaded successfully`
    });
  } catch (error) {
    console.error('Reupload error:', error);
    res.status(500).json({ error: 'Reupload failed', message: error.message });
  }
});

module.exports = router;

