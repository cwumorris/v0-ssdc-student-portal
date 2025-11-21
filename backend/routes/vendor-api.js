const express = require('express');
const router = express.Router();
const { Student, Vendor, ApiAccessLog } = require('../models');
const { requireVendor } = require('../middleware/auth');

// Verify by Student ID
router.get('/verify/student-id', requireVendor, async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const student = await Student.findOne({
      where: { student_id: studentId }
    });

    // Log API access
    await ApiAccessLog.create({
      vendor_id: req.vendor.id,
      endpoint: '/api/v1/verify/student-id',
      method: 'GET',
      query_params: { studentId },
      response_status: student ? 200 : 404,
      student_id_queried: studentId
    });

    // Increment API call count
    req.vendor.api_calls_count += 1;
    await req.vendor.save();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      verified: student.verification_status === 'verified',
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id,
        university: student.university,
        program: student.program,
        level: student.level,
        verification_status: student.verification_status,
        face_match_score: student.face_match_score,
        verified_at: student.verified_at
      }
    });
  } catch (error) {
    console.error('API verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Verify by Ghana Card
router.get('/verify/ghana-card', requireVendor, async (req, res) => {
  try {
    const { ghanaCard } = req.query;

    if (!ghanaCard) {
      return res.status(400).json({ error: 'Ghana card number is required' });
    }

    const student = await Student.findOne({
      where: { ghana_card_number: ghanaCard }
    });

    // Log API access
    await ApiAccessLog.create({
      vendor_id: req.vendor.id,
      endpoint: '/api/v1/verify/ghana-card',
      method: 'GET',
      query_params: { ghanaCard },
      response_status: student ? 200 : 404,
      ghana_card_queried: ghanaCard
    });

    // Increment API call count
    req.vendor.api_calls_count += 1;
    await req.vendor.save();

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      verified: student.verification_status === 'verified',
      student: {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id,
        ghana_card_number: student.ghana_card_number,
        university: student.university,
        program: student.program,
        level: student.level,
        verification_status: student.verification_status,
        face_match_score: student.face_match_score,
        verified_at: student.verified_at
      }
    });
  } catch (error) {
    console.error('API verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;

