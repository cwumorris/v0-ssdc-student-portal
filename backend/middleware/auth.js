const jwt = require('jsonwebtoken');
const { User, Admin, Vendor } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const admin = await Admin.findOne({
      where: { user_id: req.userId, is_active: true }
    });

    if (!admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking admin status' });
  }
};

const requireVendor = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    const vendor = await Vendor.findOne({
      where: {
        api_key: apiKey,
        approval_status: 'approved'
      }
    });

    if (!vendor) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check API call limit
    if (vendor.api_calls_count >= vendor.api_calls_limit) {
      return res.status(429).json({ error: 'API call limit exceeded' });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error verifying API key' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireVendor
};

