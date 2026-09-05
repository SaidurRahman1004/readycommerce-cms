require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email || !email.includes('@')) { console.error('Usage: node make-admin.js user@email.com'); process.exit(1); }

(async () => {
  try {
    await connectDB();
    const user = await User.findOneAndUpdate({ email }, { role: 'admin', isActive: true }, { new: true }).select('email role isActive');
    if (!user) { console.error(`No user found for ${email}`); process.exitCode = 1; return; }
    console.log(`Admin access granted: ${user.email} (${user.role})`);
    process.exitCode = 0;
  } catch (error) { console.error(`Could not grant admin access: ${error.message}`); process.exitCode = 1; }
  finally { await mongoose.disconnect(); console.log('Database connection closed.'); }
})();
