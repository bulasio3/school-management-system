const db = require('./db');

// Records who changed what. Call after important writes.
async function logAudit({ userId, action, table, recordId, oldValue = null, newValue = null }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, action, table, String(recordId), oldValue, newValue]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { logAudit };
