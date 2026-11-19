// Creates the first admin account. Run once:  npm run db:seed
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../src/db');
const User = require('../src/models/User');

(async () => {
  await connectDB();
  const email = (process.env.ADMIN_EMAIL || 'admin@school.test').toLowerCase();

  if (await User.findOne({ email })) {
    console.log(`Admin ${email} already exists. Nothing changed.`);
  } else {
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    await User.create({
      name: 'System Admin',
      email,
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
    });
    console.log('Admin created.');
    console.log(`  email:    ${email}`);
    console.log(`  password: ${password}   <- save it now, it is not shown again`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
