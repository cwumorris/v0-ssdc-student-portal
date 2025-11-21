const express = require('express');
const router = express.Router();
const multer = require('multer');
const { User, Vendor } = require('../models');
const { generateApiKey, generateVerificationCode } = require('../utils/auth');
const { storeOtp, verifyOtp } = require('../utils/otp-cache');
const { sendVerificationEmail } = require('../utils/email');

// Middleware to handle FormData (without file upload)
const upload = multer();

// Helper to get vendor from userId
const getVendorFromUserId = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const vendor = await Vendor.findOne({
      where: { user_id: userId }
    });

    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vendor' });
  }
};

// Vendor Registration (handles FormData from frontend)
router.post('/register', upload.none(), async (req, res) => {
  try {
    console.log('Vendor registration request received');
    console.log('Request body:', req.body);
    
    // Handle FormData or JSON
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessRegistrationNumber,
      businessAddress,
      businessCertificateUrl,
      businessLicenseUrl,
      contactName
    } = req.body;

    console.log('Parsed fields:', {
      businessName,
      businessEmail,
      businessPhone,
      hasCertificate: !!businessCertificateUrl,
      hasLicense: !!businessLicenseUrl,
      contactName
    });

    if (!businessName || !businessEmail || !businessPhone) {
      console.error('Missing required fields:', { businessName: !!businessName, businessEmail: !!businessEmail, businessPhone: !!businessPhone });
      return res.status(400).json({
        error: 'Business name, email, and phone are required'
      });
    }

    if (!businessCertificateUrl) {
      console.error('Business certificate URL is missing');
      return res.status(400).json({ error: 'Business certificate is required' });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      where: { business_email: businessEmail }
    });

    if (existingVendor) {
      return res.status(409).json({
        error: 'A vendor with this email already exists'
      });
    }

    // Create user account for vendor
    let user = await User.findOne({ where: { email: businessEmail } });

    if (!user) {
      user = await User.create({
        email: businessEmail,
        name: contactName || businessName
      });
    }

    // Create vendor record
    const vendor = await Vendor.create({
      user_id: user.id,
      business_name: businessName,
      business_email: businessEmail,
      business_phone: businessPhone,
      business_registration_number: businessRegistrationNumber || null,
      business_address: businessAddress || null,
      business_certificate_url: businessCertificateUrl,
      business_license_url: businessLicenseUrl || null,
      approval_status: 'pending'
    });

    console.log('Vendor created successfully:', { vendorId: vendor.id, businessEmail });

    res.json({
      success: true,
      vendorId: vendor.id,
      message: 'Vendor registration submitted. Awaiting admin approval.'
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get Vendor Profile
router.post('/profile', getVendorFromUserId, async (req, res) => {
  try {
    res.json({
      vendor: req.vendor || null
    });
  } catch (error) {
    console.error('Vendor profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Generate API Key
router.post('/generate-api-key', async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const vendor = await Vendor.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.approval_status !== 'approved') {
      return res.status(403).json({ error: 'Vendor not approved yet' });
    }

    // Generate new API key
    const apiKey = generateApiKey();

    vendor.api_key = apiKey;
    vendor.api_key_created_at = new Date();
    await vendor.save();

    res.json({
      success: true,
      apiKey,
      message: 'API key generated successfully'
    });
  } catch (error) {
    console.error('API key generation error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Send OTP for Vendor Login
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if vendor exists (allow all statuses to login)
    const vendor = await Vendor.findOne({
      where: { business_email: email }
    });

    if (!vendor) {
      return res.status(404).json({ 
        error: 'No vendor account found with this email. Please register first.' 
      });
    }

    // Allow vendors with any status to login (pending, approved, rejected, suspended)
    // They can view their status on the dashboard

    // Generate and store OTP
    const otp = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    storeOtp(email, otp, expiresAt);

    // Send email
    try {
      await sendVerificationEmail(email, otp, vendor.business_name || 'Vendor');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send email. Please check your email configuration.' 
      });
    }

    // Return OTP for development (remove in production)
    res.json({
      success: true,
      message: 'OTP sent to email successfully',
      // Remove this in production:
      code: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP for Vendor Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Verify OTP
    const otpValidation = verifyOtp(email, otp, true); // Remove OTP after verification

    if (!otpValidation.valid) {
      return res.status(400).json({ error: otpValidation.error });
    }

    // Get vendor
    const vendor = await Vendor.findOne({
      where: { business_email: email }
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Allow vendors with any status to login (pending, approved, rejected, suspended)
    // They can view their status on the dashboard

    // Get user if needed (optional, since we have business_name as fallback)
    let userName = vendor.business_name;
    try {
      const user = await User.findByPk(vendor.user_id);
      if (user && user.name) {
        userName = user.name;
      }
    } catch (userError) {
      // Fallback to business_name if user lookup fails
      console.log('User lookup failed, using business_name');
    }

    // Return user info for session (include approval status so frontend can display it)
    res.json({
      success: true,
      userId: vendor.user_id,
      email: vendor.business_email,
      name: userName,
      vendorId: vendor.id,
      approvalStatus: vendor.approval_status,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;

