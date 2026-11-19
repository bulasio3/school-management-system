require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Database tables created.');
  await db.pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
