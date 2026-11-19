const express = require('express');
const db = require('../db');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/classes
router.get('/', authorize('admin', 'teacher', 'bursar'), wrap(async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM classes ORDER BY year DESC, name, stream');
  res.json(rows);
}));

// POST /api/classes
router.post('/', authorize('admin'), wrap(async (req, res) => {
  const { name, stream, year } = req.body;
  if (!name || !year) return res.status(400).json({ error: 'name and year are required' });

  try {
    const { rows } = await db.query(
      'INSERT INTO classes (name, stream, year) VALUES ($1,$2,$3) RETURNING *',
      [name, stream || null, year]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Class already exists' });
    throw err;
  }
}));

module.exports = router;
