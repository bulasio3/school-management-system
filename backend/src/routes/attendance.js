const express = require('express');
const crypto = require('crypto');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const VALID_STATUS = ['present', 'absent', 'late', 'excused'];
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/attendance?class_id=...&date=YYYY-MM-DD
// Every active student in the class, with their status for that date (null = not yet marked)
router.get('/', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date || !DATE_RX.test(date)) {
    return res.status(400).json({ error: 'class_id and date (YYYY-MM-DD) are required' });
  }

  const students = await Student.find({ class_id, status: 'active' })
    .sort({ last_name: 1, first_name: 1 });
  const records = await Attendance.find({ class_id, date });
  const byStudent = new Map(records.map((r) => [r.student_id, r]));

  res.json(
    students.map((s) => {
      const rec = byStudent.get(s._id);
      return {
        student_id: s._id,
        admission_no: s.admission_no,
        first_name: s.first_name,
        last_name: s.last_name,
        status: rec ? rec.status : null,
        updated_at: rec ? rec.updatedAt : null,
      };
    })
  );
}));

// POST /api/attendance/bulk
// Body: { class_id, date, records: [{ student_id, status }] }
// Upserts, so re-submitting (or syncing offline data twice) never creates duplicates.
router.post('/bulk', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, date, records } = req.body;
  if (!class_id || !date || !DATE_RX.test(date) || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'class_id, date (YYYY-MM-DD) and records are required' });
  }
  if (records.some((r) => !r || !r.student_id || !VALID_STATUS.includes(r.status))) {
    return res.status(400).json({
      error: `Each record needs student_id and status (${VALID_STATUS.join(', ')})`,
    });
  }

  // Every student must belong to this class
  const ids = [...new Set(records.map((r) => r.student_id))];
  const valid = await Student.countDocuments({ _id: { $in: ids }, class_id });
  if (valid !== ids.length) {
    return res.status(400).json({ error: 'Some students do not belong to this class' });
  }

  const ops = records.map((r) => ({
    updateOne: {
      filter: { student_id: r.student_id, date },
      update: {
        $set: { class_id, status: r.status, recorded_by: req.user.id },
        $setOnInsert: { _id: crypto.randomUUID() },
      },
      upsert: true,
    },
  }));
  await Attendance.bulkWrite(ops);

  res.json({ saved: records.length });
}));

// GET /api/attendance/summary?class_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, from, to } = req.query;
  if (!class_id || !DATE_RX.test(from || '') || !DATE_RX.test(to || '')) {
    return res.status(400).json({ error: 'class_id, from and to (YYYY-MM-DD) are required' });
  }

  const count = (status) => ({ $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } });
  const totals = await Attendance.aggregate([
    { $match: { class_id: String(class_id), date: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: '$student_id',
        present: count('present'),
        absent: count('absent'),
        late: count('late'),
        excused: count('excused'),
      },
    },
  ]);
  const byStudent = new Map(totals.map((t) => [t._id, t]));

  const students = await Student.find({ class_id, status: 'active' })
    .sort({ last_name: 1, first_name: 1 });

  res.json(
    students.map((s) => {
      const t = byStudent.get(s._id) || {};
      return {
        student_id: s._id,
        admission_no: s.admission_no,
        first_name: s.first_name,
        last_name: s.last_name,
        present: t.present || 0,
        absent: t.absent || 0,
        late: t.late || 0,
        excused: t.excused || 0,
      };
    })
  );
}));

module.exports = router;
