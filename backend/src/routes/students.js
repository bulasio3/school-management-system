const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const wrap = require('../asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../audit');

const router = express.Router();
router.use(authenticate);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/students?class_id=...&search=...
router.get('/', authorize('admin', 'teacher', 'bursar'), wrap(async (req, res) => {
  const { class_id, search } = req.query;
  const filter = {};
  if (class_id) filter.class_id = String(class_id);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ first_name: rx }, { last_name: rx }, { admission_no: rx }];
  }

  const students = await Student.find(filter).sort({ last_name: 1, first_name: 1 });
  const classIds = [...new Set(students.map((s) => s.class_id).filter(Boolean))];
  const classes = await Class.find({ _id: { $in: classIds } });
  const byId = Object.fromEntries(classes.map((c) => [c._id, c]));

  res.json(
    students.map((s) => {
      const out = s.toJSON();
      const c = byId[s.class_id];
      out.class_name = c ? c.name : null;
      out.stream = c ? c.stream : null;
      return out;
    })
  );
}));

// GET /api/students/:id
router.get('/:id', authorize('admin', 'teacher', 'bursar'), wrap(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
}));

// POST /api/students
router.post('/', authorize('admin'), wrap(async (req, res) => {
  const { admission_no, first_name, last_name, dob, gender, class_id } = req.body;
  if (!admission_no || !first_name || !last_name) {
    return res.status(400).json({ error: 'admission_no, first_name and last_name are required' });
  }

  const student = await Student.create({
    admission_no, first_name, last_name,
    dob: dob || null, gender: gender || null, class_id: class_id || null,
  });
  await logAudit({
    userId: req.user.id, action: 'CREATE', table: 'students',
    recordId: student._id, newValue: student.toJSON(),
  });
  res.status(201).json(student);
}));

// PUT /api/students/:id
router.put('/:id', authorize('admin'), wrap(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const old = student.toJSON();
  for (const field of ['first_name', 'last_name', 'dob', 'gender', 'class_id', 'status']) {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  }
  await student.save();

  await logAudit({
    userId: req.user.id, action: 'UPDATE', table: 'students',
    recordId: student._id, oldValue: old, newValue: student.toJSON(),
  });
  res.json(student);
}));

module.exports = router;
