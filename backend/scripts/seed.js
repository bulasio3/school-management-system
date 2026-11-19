require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

(async () => {
  const hash = await bcrypt.hash('Admin@12345', 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('System Admin', 'admin@school.test', $1, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  console.log('Admin ready -> admin@school.test / Admin@12345  (change this password!)');
  await db.pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
