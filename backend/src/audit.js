const AuditLog = require('./models/AuditLog');

// Records who changed what. Call after important writes.
async function logAudit({ userId, action, table, recordId, oldValue = null, newValue = null }) {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      table_name: table,
      record_id: String(recordId),
      old_value: oldValue,
      new_value: newValue,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };
