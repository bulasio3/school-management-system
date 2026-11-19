const express = require('express');
const Class = require('../models/Class');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/classes
router.get('/', authorize('admin', 'teacher', 'bursar'), wrap(async (_req, res) => {
  const classes = await Class.find().sort({ year: -1, name: 1, stream: 1 });
  res.json(classes);
}));

// POST /api/classes
router.post('/', authorize('admin'), wrap(async (req, res) => {
  const { name, stream, year } = req.body;
  if (!name || !year) return res.status(400).json({ error: 'name and year are required' });

  const created = await Class.create({ name, stream: stream || null, year });
  res.status(201).json(created);
}));

module.exports = router;
