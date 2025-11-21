const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const path = require('path');

// Single file upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Return URL - use backend URL for file access
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed: ' + (error.message || 'Unknown error')
    });
  }
});

module.exports = router;

