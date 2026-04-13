import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET = JWT_SECRET || 'agrocare-dev-secret-change-in-production';

const extractBearerToken = (authHeader = '') => {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const payload = jwt.verify(token, SECRET);
    const user = await User.findById(payload.userId).select('-password -resetPasswordTokenHash -resetPasswordExpiresAt');
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
};
