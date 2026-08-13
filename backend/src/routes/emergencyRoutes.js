import express from 'express';
import crypto from 'crypto';
import EmergencyAccess from '../models/EmergencyAccess.js';
import PatientProfile from '../models/PatientProfile.js';
import EmergencyContact from '../models/EmergencyContact.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ user: req.user._id });
    const contacts = await EmergencyContact.find({ owner: req.user._id });
    const latestAccess = await EmergencyAccess.findOne({
      patient: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    res.json({ success: true, profile, contacts, activeQrToken: latestAccess?.token || null });
  } catch (error) { next(error); }
});

router.post('/qr', protect, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const access = await EmergencyAccess.create({ token, patient: req.user._id, expiresAt });
    await logActivity({ user: req.user._id, action: 'generate_qr', resource: 'emergency_access' });
    res.status(201).json({ success: true, token: access.token, expiresAt });
  } catch (error) { next(error); }
});

router.post('/qr/regenerate', protect, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const access = await EmergencyAccess.create({ token, patient: req.user._id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    res.status(201).json({ success: true, token: access.token });
  } catch (error) { next(error); }
});

router.post('/qr/revoke', protect, async (req, res, next) => {
  try {
    await EmergencyAccess.updateMany({ patient: req.user._id, status: 'active' }, { status: 'revoked' });
    res.json({ success: true, message: 'QR access revoked' });
  } catch (error) { next(error); }
});

router.get('/access/:token', async (req, res, next) => {
  try {
    const access = await EmergencyAccess.findOne({ token: req.params.token, status: 'active' }).populate('patient');
    if (!access || access.expiresAt < new Date()) return res.status(404).json({ success: false, message: 'Access not found' });
    const profile = await PatientProfile.findOne({ user: access.patient._id });
    const contacts = await EmergencyContact.find({ owner: access.patient._id });
    access.lastAccessedAt = new Date();
    await access.save();
    await logActivity({ user: access.patient._id, action: 'emergency_access', resource: 'emergency_access' });
    res.json({ success: true, patient: { name: access.patient.name, email: access.patient.email }, profile, contacts, readOnly: true });
  } catch (error) { next(error); }
});

export default router;
