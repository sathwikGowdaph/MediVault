import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { isDbConnected } from '../utils/dbStatus.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import * as refreshStore from '../utils/refreshTokenStore.js';
import { protect } from '../middleware/authMiddleware.js';
import { createFallbackUser, validateFallbackUser, findUserById } from '../utils/fallbackUserStore.js';
import { recordFailedAttempt, resetAttemptTracker, applyThrottleDelay, beginAttempt, endAttempt } from '../utils/authAttemptTracker.js';

const router = express.Router();

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'healthhub_access_secret_key_default_2026';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'healthhub_refresh_secret_key_default_2026';

const createAccessToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  getAccessSecret(),
  { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
);

const createRefreshToken = (user) => jwt.sign(
  { id: user._id },
  getRefreshSecret(),
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
);

const isMongoAvailable = () => isDbConnected() && mongoose.connection.readyState === 1;

const getUserModel = async (email) => {
  if (isMongoAvailable()) {
    const existing = await User.findOne({ email });
    if (existing) return { model: 'mongo', user: existing };
  }
  return { model: 'fallback', user: null };
};

/**
 * POST /api/auth/register
 * Registers a new user (Patient, Doctor, or Family member).
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoAvailable()) {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Account with this email already exists' });
      }

      const validRoles = ['patient', 'doctor', 'family', 'admin'];
      const userRole = validRoles.includes(role) ? role : 'patient';

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: userRole
      });

      if (userRole === 'patient') {
        try {
          await PatientProfile.create({ user: user._id, fullName: user.name });
        } catch (profileErr) {
          console.error('Initial PatientProfile creation warning:', profileErr.message);
        }
      }

      await logActivity({ user: user._id, action: 'register', resource: 'auth' });

      return res.status(201).json({
        success: true,
        message: 'Registration successful! You can now log in.',
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    }

    const validRoles = ['patient', 'doctor', 'family', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'patient';
    const user = await createFallbackUser({ name, email: normalizedEmail, password, role: userRole });

    if (userRole === 'patient' && isMongoAvailable()) {
      try {
        const safeUserId = user._id && typeof user._id === 'object' ? user._id.toString() : user._id;
        await PatientProfile.create({ user: safeUserId, fullName: user.name });
      } catch (profileErr) {
        console.error('Initial PatientProfile creation warning:', profileErr.message);
      }
    }

    await logActivity({ user: user._id, action: 'register', resource: 'auth' });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT access token + HTTP-only refresh token cookie.
 */
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  // Prevent duplicate concurrent login attempts for same identifier
  const began = beginAttempt(normalizedEmail);
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Apply progressive throttle delay for repeated rapid failures
    await applyThrottleDelay(normalizedEmail);

    let user;

    if (isMongoAvailable()) {
      user = await User.findOne({ email: normalizedEmail });
      if (!user || !user.isActive) {
        recordFailedAttempt(normalizedEmail);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const valid = await user.comparePassword(password);
      if (!valid) {
        recordFailedAttempt(normalizedEmail);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } else {
      user = await validateFallbackUser({ email: normalizedEmail, password });
      if (!user) {
        recordFailedAttempt(normalizedEmail);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // Reset failed attempt tracking on successful login
    resetAttemptTracker(normalizedEmail);

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (isMongoAvailable() && mongoose.isValidObjectId(user._id)) {
      try {
        await RefreshToken.create({
          user: user._id,
          token: refreshToken,
          expiresAt: refreshTokenExpiry
        });
      } catch (err) {
        console.warn('[Auth] Could not create RefreshToken in DB:', err.message);
      }
    } else {
      // fallback store (use plain string id)
      try {
        await refreshStore.createToken({ user: user._id, token: refreshToken, expiresAt: refreshTokenExpiry });
      } catch (err) { console.warn('[Auth] Could not create fallback refresh token:', err.message); }
    }

    await logActivity({ user: user._id, action: 'login', resource: 'auth' });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    const responsePayload = {
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.refreshToken = refreshToken;
    }

    res.json(responsePayload);
  } catch (error) { next(error); }
  finally {
    // Ensure we clear the in-progress flag so further attempts are allowed
    try { endAttempt(normalizedEmail); } catch (e) { /* ignore */ }
  }
});

/**
 * POST /api/auth/refresh
 * Refresh expired access token using refresh token from cookie or header.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.headers['x-refresh-token'];
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token missing' });

    const decoded = jwt.verify(token, getRefreshSecret());

    let stored = null;
    if (isMongoAvailable() && mongoose.isValidObjectId(decoded.id)) {
      stored = await RefreshToken.findOne({ token, user: decoded.id, revoked: false });
    } else {
      // try fallback store
      stored = await refreshStore.findToken(token);
    }

    if (!stored || stored.expiresAt < new Date() || stored.revoked) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = isMongoAvailable()
      ? await User.findById(decoded.id)
      : await findUserById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account disabled or not found' });
    }

    const accessToken = createAccessToken(user);
    res.json({ success: true, accessToken });
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/logout
 * Revokes refresh token and clears cookie.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.headers['x-refresh-token'];
    if (token) {
      if (isMongoAvailable()) {
        try { await RefreshToken.updateMany({ token }, { revoked: true }); } catch (err) { console.warn('[Auth] Could not revoke refresh token in DB:', err.message); }
      }
      try { await refreshStore.revokeToken(token); } catch (err) { /* ignore */ }
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/forgot-password
 * Generates password reset token.
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email address' });

    const token = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      user: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    res.json({ success: true, message: 'Password reset token created', token });
  } catch (error) { next(error); }
});

/**
 * POST /api/auth/reset-password
 * Resets user password using reset token.
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password are required' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const resetToken = await PasswordResetToken.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!resetToken) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    const user = await User.findById(resetToken.user);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = password;
    await user.save();

    resetToken.used = true;
    await resetToken.save();

    res.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (error) { next(error); }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user data.
 */
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
  });
});

export default router;
