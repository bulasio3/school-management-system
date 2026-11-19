const mongoose = require('mongoose');
const { uuid, applyJson } = require('./plugin');

const attendanceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    student_id: { type: String, ref: 'Student', required: true },
    class_id: { type: String, ref: 'Class', required: true },
    // Stored as 'YYYY-MM-DD' so a school day is the same day on every device/timezone
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: { type: String, required: true, enum: ['present', 'absent', 'late', 'excused'] },
    recorded_by: { type: String, ref: 'User' },
  },
  { timestamps: true }
);
// One attendance record per student per day (prevents duplicates, makes sync safe)
attendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class_id: 1, date: 1 });
applyJson(attendanceSchema);

module.exports = mongoose.model('Attendance', attendanceSchema);
