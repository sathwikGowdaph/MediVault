import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isDbConnected } from '../utils/dbStatus.js';
import { findUserById } from '../utils/fallbackUserStore.js';

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'healthhub_access_secret_key_default_2026';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, getAccessSecret());
    let user = null;
    if (isDbConnected()) {
      user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ success: false, message: 'User account not found' });
      if (!user.isActive) return res.status(403).json({ success: false, message: 'User account has been disabled' });
    } else {
      // DB not available — use fallback user store
      user = await findUserById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User account not found (fallback)' });
      if (!user.isActive) return res.status(403).json({ success: false, message: 'User account has been disabled' });
      // normalize shape to resemble mongoose document
      user = { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
  }
  next();
};
