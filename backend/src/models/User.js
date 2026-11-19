const mongoose = require('mongoose');
const { uuid, applyJson } = require('./plugin');

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'teacher', 'bursar', 'parent', 'student'],
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
applyJson(userSchema);

module.exports = mongoose.model('User', userSchema);
