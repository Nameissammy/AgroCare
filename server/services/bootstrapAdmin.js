import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

export const bootstrapAdmin = async () => {
  const email = (normalize(process.env.BOOTSTRAP_ADMIN_EMAIL) || 'admin@agrocare.local').toLowerCase();
  const password = normalize(process.env.BOOTSTRAP_ADMIN_PASSWORD) || 'Admin@12345';
  const name = normalize(process.env.BOOTSTRAP_ADMIN_NAME) || 'AgroCare Admin';

  if (password.length < 8) {
    console.warn('[bootstrap-admin] BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters. Skipping admin bootstrap.');
    return;
  }

  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    if (existingByEmail.role !== 'admin') {
      existingByEmail.role = 'admin';
      await existingByEmail.save();
      console.log('[bootstrap-admin] Existing user promoted to admin:', email);
      return;
    }
    console.log('[bootstrap-admin] Admin already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    name,
    email,
    password: passwordHash,
    role: 'admin',
    phone: '',
    location: '',
  });

  console.log('[bootstrap-admin] Default admin created:', email);
  if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    console.warn('[bootstrap-admin] Using fallback credentials admin@agrocare.local / Admin@12345. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env and rotate immediately.');
  }
};
