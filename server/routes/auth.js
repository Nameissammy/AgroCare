import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure default. Set JWT_SECRET in server/.env for production.');
}
const SECRET = JWT_SECRET || 'agrocare-dev-secret-change-in-production';
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const RESET_TOKEN_EXPIRY_MINUTES = Number.parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || '15', 10);
const RESET_EXPIRY_MS = (Number.isFinite(RESET_TOKEN_EXPIRY_MINUTES) && RESET_TOKEN_EXPIRY_MINUTES > 0
  ? RESET_TOKEN_EXPIRY_MINUTES
  : 15) * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const rateLimitMap = new Map();

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

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const isRateLimited = (key) => {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }

  rateLimitMap.set(key, bucket);
  return false;
};

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const clientKey = `forgot:${req.ip || 'unknown'}`;
    if (isRateLimited(clientKey)) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const { email } = req.body || {};
    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim().toLowerCase())) {
      return res.status(200).json({ message: genericMessage });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordTokenHash = hashResetToken(rawToken);
      user.resetPasswordExpiresAt = new Date(Date.now() + RESET_EXPIRY_MS);
      await user.save();

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
      const resetLink = `${appUrl}/?token=${encodeURIComponent(rawToken)}`;
      console.log(`[auth] Password reset link for ${normalizedEmail}: ${resetLink}`);
    }

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    console.error('Forgot password handler caught error:', err);
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { name: err.name, message: err.message, stack: err.stack };
    return res.status(500).json({ message: 'Something went wrong. Please try again.', debug: devInfo });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const clientKey = `reset:${req.ip || 'unknown'}`;
    if (isRateLimited(clientKey)) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    const { token, newPassword } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Reset token is required.' });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err) {
    console.error('Reset password handler caught error:', err);
    const devInfo = process.env.NODE_ENV === 'production' ? undefined : { name: err.name, message: err.message, stack: err.stack };
    return res.status(500).json({ message: 'Something went wrong. Please try again.', debug: devInfo });
  }
});

export default router;
