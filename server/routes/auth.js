import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure default. Set JWT_SECRET in server/.env for production.');
}
const SECRET = JWT_SECRET || 'agrocare-dev-secret-change-in-production';

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, SECRET, { expiresIn: '7d', algorithm: 'HS256' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('[auth] POST /register headers:', req.headers && req.headers['content-type']);
    console.log('[auth] POST /register body:', JSON.stringify(req.body));

    // If MongoDB is not connected yet, return a clear 503 so frontend can retry or show message
    const ready = mongoose.connection && mongoose.connection.readyState;
    if (ready !== 1) {
      console.warn(`[auth] DB not ready (state=${ready}) - rejecting register request`);
      return res.status(503).json({ message: 'Database not connected. Please try again shortly.' });
    }
    const { name, email, password, role, phone, location } = req.body || {};

    // Basic server-side validation to return clear errors before touching Mongoose
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailVal = email.toLowerCase().trim();
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(emailVal)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!role || (role !== 'farmer' && role !== 'buyer')) {
      return res.status(400).json({ message: 'Please select a valid role: farmer or buyer' });
    }

    const existing = await User.findOne({ email: emailVal });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: emailVal,
      password: hashedPassword,
      role,
      phone: phone?.trim() || '',
      location: location?.trim() || '',
    });

    const token = signToken(user._id, user.role);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    // Mongoose duplicate key
    console.error('Register handler caught error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    // Validation errors (e.g. email pattern, password minlength)
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((e) => e.message).join('; ');
      console.error('Register validation error:', messages);
      return res.status(400).json({ message: messages });
    }

    // For debugging: include underlying message when not in production
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { name: err.name, message: err.message, stack: err.stack };
    return res.status(500).json({ message: 'Something went wrong. Please try again.', debug: devInfo });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id, user.role);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login handler caught error:', err);
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((e) => e.message).join('; ');
      console.error('Login validation error:', messages);
      return res.status(400).json({ message: messages });
    }
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { name: err.name, message: err.message, stack: err.stack };
    return res.status(500).json({ message: 'Something went wrong. Please try again.', debug: devInfo });
  }
});

export default router;
