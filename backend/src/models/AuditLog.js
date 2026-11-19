const mongoose = require('mongoose');
const { uuid, applyJson } = require('./plugin');

const auditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuid },
    user_id: { type: String, ref: 'User' },
    action: { type: String, required: true },
    table_name: { type: String, required: true },
    record_id: { type: String },
    old_value: { type: mongoose.Schema.Types.Mixed, default: null },
    new_value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);
applyJson(auditLogSchema);

module.exports = mongoose.model('AuditLog', auditLogSchema);
