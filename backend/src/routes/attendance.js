const express = require('express');
const db = require('../db');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const VALID_STATUS = ['present', 'absent', 'late', 'excused'];

// GET /api/attendance?class_id=...&date=YYYY-MM-DD
// Returns every active student in the class with their status for that date
router.get('/', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date) {
    return res.status(400).json({ error: 'class_id and date are required' });
  }

  const { rows } = await db.query(
    `SELECT s.id AS student_id, s.admission_no, s.first_name, s.last_name,
            a.status, a.updated_at
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2
     WHERE s.class_id = $1 AND s.status = 'active'
     ORDER BY s.last_name, s.first_name`,
    [class_id, date]
  );
  res.json(rows);
}));

// POST /api/attendance/bulk
// Body: { class_id, date, records: [{ student_id, status }] }
// Upserts, so re-submitting (or syncing offline data twice) never creates duplicates.
router.post('/bulk', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, date, records } = req.body;
  if (!class_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'class_id, date and records are required' });
  }
  if (records.some((r) => !r.student_id || !VALID_STATUS.includes(r.status))) {
    return res.status(400).json({ error: `Each record needs student_id and status (${VALID_STATUS.join(', ')})` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance (student_id, class_id, date, status, recorded_by)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (student_id, date)
         DO UPDATE SET status = EXCLUDED.status,
                       recorded_by = EXCLUDED.recorded_by,
                       updated_at = NOW()`,
        [r.student_id, class_id, date, r.status, req.user.id]
      );
    }
    await client.query('COMMIT');
    res.json({ saved: records.length });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// GET /api/attendance/summary?class_id=...&from=...&to=...
router.get('/summary', authorize('admin', 'teacher'), wrap(async (req, res) => {
  const { class_id, from, to } = req.query;
  if (!class_id || !from || !to) {
    return res.status(400).json({ error: 'class_id, from and to are required' });
  }

  const { rows } = await db.query(
    `SELECT s.id AS student_id, s.admission_no, s.first_name, s.last_name,
            COUNT(a.id) FILTER (WHERE a.status = 'present') AS present,
            COUNT(a.id) FILTER (WHERE a.status = 'absent')  AS absent,
            COUNT(a.id) FILTER (WHERE a.status = 'late')    AS late,
            COUNT(a.id) FILTER (WHERE a.status = 'excused') AS excused
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.date BETWEEN $2 AND $3
     WHERE s.class_id = $1 AND s.status = 'active'
     GROUP BY s.id ORDER BY s.last_name, s.first_name`,
    [class_id, from, to]
  );
  res.json(rows);
}));

module.exports = router;
