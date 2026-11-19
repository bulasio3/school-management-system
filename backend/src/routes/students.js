const express = require('express');
const db = require('../db');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../audit');

const router = express.Router();
router.use(authenticate);

// GET /api/students?class_id=...&search=...
router.get('/', authorize('admin', 'teacher', 'bursar'), wrap(async (req, res) => {
  const { class_id, search } = req.query;
  const conditions = [];
  const params = [];

  if (class_id) {
    params.push(class_id);
    conditions.push(`s.class_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(s.first_name ILIKE $${params.length} OR s.last_name ILIKE $${params.length} OR s.admission_no ILIKE $${params.length})`
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT s.*, c.name AS class_name, c.stream
     FROM students s LEFT JOIN classes c ON c.id = s.class_id
     ${where} ORDER BY s.last_name, s.first_name`,
    params
  );
  res.json(rows);
}));

// GET /api/students/:id
router.get('/:id', authorize('admin', 'teacher', 'bursar'), wrap(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Student not found' });
  res.json(rows[0]);
}));

// POST /api/students
router.post('/', authorize('admin'), wrap(async (req, res) => {
  const { admission_no, first_name, last_name, dob, gender, class_id } = req.body;
  if (!admission_no || !first_name || !last_name) {
    return res.status(400).json({ error: 'admission_no, first_name and last_name are required' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO students (admission_no, first_name, last_name, dob, gender, class_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [admission_no, first_name, last_name, dob || null, gender || null, class_id || null]
    );
    await logAudit({
      userId: req.user.id, action: 'CREATE', table: 'students',
      recordId: rows[0].id, newValue: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Admission number already exists' });
    throw err;
  }
}));

// PUT /api/students/:id
router.put('/:id', authorize('admin'), wrap(async (req, res) => {
  const existing = await db.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Student not found' });

  const old = existing.rows[0];
  const { first_name, last_name, dob, gender, class_id, status } = req.body;

  const { rows } = await db.query(
    `UPDATE students SET
       first_name = COALESCE($1, first_name),
       last_name  = COALESCE($2, last_name),
       dob        = COALESCE($3, dob),
       gender     = COALESCE($4, gender),
       class_id   = COALESCE($5, class_id),
       status     = COALESCE($6, status),
       updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [first_name, last_name, dob, gender, class_id, status, req.params.id]
  );
  await logAudit({
    userId: req.user.id, action: 'UPDATE', table: 'students',
    recordId: req.params.id, oldValue: old, newValue: rows[0],
  });
  res.json(rows[0]);
}));

module.exports = router;
