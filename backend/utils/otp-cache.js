// Simple in-memory OTP cache
// In production, use Redis or a database for distributed systems

const otpCache = new Map();

// Store OTP
const storeOtp = (email, code, expiresAt) => {
  otpCache.set(email, {
    code,
    expiresAt,
    createdAt: new Date()
  });
  
  // Auto-cleanup expired entries after expiration
  setTimeout(() => {
    if (otpCache.has(email)) {
      const entry = otpCache.get(email);
      if (new Date() > new Date(entry.expiresAt)) {
        otpCache.delete(email);
      }
    }
  }, new Date(expiresAt) - new Date());
};

// Get and verify OTP (without deleting - for pre-registration check)
const verifyOtp = (email, code, removeAfterVerify = false) => {
  const entry = otpCache.get(email);
  
  if (!entry) {
    return { valid: false, error: 'OTP not found. Please request a new one.' };
  }
  
  if (new Date() > new Date(entry.expiresAt)) {
    otpCache.delete(email);
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }
  
  if (entry.code !== code) {
    return { valid: false, error: 'Invalid OTP code.' };
  }
  
  // OTP verified - only remove if explicitly requested (during registration)
  if (removeAfterVerify) {
    otpCache.delete(email);
  }
  return { valid: true };
};

// Remove OTP
const removeOtp = (email) => {
  otpCache.delete(email);
};

module.exports = {
  storeOtp,
  verifyOtp,
  removeOtp
};

