const mongoose = require('mongoose');
const { uuid, applyJson } = require('./plugin');

const studentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    admission_no: { type: String, required: true, unique: true, trim: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ['M', 'F', null], default: null },
    class_id: { type: String, ref: 'Class', default: null, index: true },
    status: {
      type: String,
      enum: ['active', 'transferred', 'graduated', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);
applyJson(studentSchema);

module.exports = mongoose.model('Student', studentSchema);
