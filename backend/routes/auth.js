const express = require('express');
const router = express.Router();
const { User, Student } = require('../models');
const { hashPassword, comparePassword, generateToken, generateVerificationCode } = require('../utils/auth');

// Email Sign In
router.post('/email/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Users without password_hash (Google OAuth users) cannot login with email/password
    if (!user.password_hash) {
      return res.status(401).json({ 
        error: 'This account was created with Google. Please sign in with Google.' 
      });
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      token
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Email Sign Up
router.post('/email/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      name,
      password_hash: passwordHash
    });

    const token = generateToken(user.id);

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      token
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    // Exchange code for tokens (simplified - in production, implement full OAuth flow)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured');
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    
    // Use FRONTEND_URL for redirect URI since Next.js proxies /api/* to backend
    // The redirect URI must match exactly what's configured in Google Console
    const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUri = `${frontendOrigin}/api/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${frontendUrl}/login?error=token_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      return res.redirect(`${frontendUrl}/login?error=userinfo_failed`);
    }

    const userInfo = await userInfoResponse.json();

    // Create or update user
    let user = await User.findOne({ where: { email: userInfo.email } });

    if (!user) {
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        google_id: userInfo.id
      });
    } else if (!user.google_id) {
      user.google_id = userInfo.id;
      user.name = userInfo.name;
      await user.save();
    }

    // Check if student has KYC done
    const student = await Student.findOne({
      where: { user_id: user.id }
    });

    // Redirect to frontend with user info in query params
    // Frontend will extract these and store in localStorage
    let redirectPath = student ? '/student/dashboard' : '/student/register';
    const redirectUrl = new URL(`${frontendUrl}${redirectPath}`);
    redirectUrl.searchParams.set('userId', user.id);
    redirectUrl.searchParams.set('email', user.email);
    redirectUrl.searchParams.set('name', user.name);
    redirectUrl.searchParams.set('from', 'google');
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=callback_failed`);
  }
});

module.exports = router;

