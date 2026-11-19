const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];

  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}));

// POST /api/auth/users  (admin creates accounts)
router.post('/users', authenticate, authorize('admin'), wrap(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password and role are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role`,
      [name, email.toLowerCase(), phone || null, hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    if (err.code === '23514') return res.status(400).json({ error: 'Invalid role' });
    throw err;
  }
}));

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json(req.user));

module.exports = router;
