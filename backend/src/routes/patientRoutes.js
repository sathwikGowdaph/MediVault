import express from 'express';
import PatientProfile from '../models/PatientProfile.js';
import EmergencyContact from '../models/EmergencyContact.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/** Clean helper to sanitize profile numbers/dates from empty strings */
function sanitizeProfileUpdates(updates) {
  const clean = { ...updates };

  // Remove empty string numbers so Mongoose casting doesn't fail
  if (clean.height === '' || clean.height === null || clean.height === undefined || Number.isNaN(Number(clean.height))) {
    delete clean.height;
  } else {
    clean.height = Number(clean.height);
  }

  if (clean.weight === '' || clean.weight === null || clean.weight === undefined || Number.isNaN(Number(clean.weight))) {
    delete clean.weight;
  } else {
    clean.weight = Number(clean.weight);
  }

  if (clean.dateOfBirth === '' || clean.dateOfBirth === null || clean.dateOfBirth === undefined) {
    delete clean.dateOfBirth;
  } else {
    const d = new Date(clean.dateOfBirth);
    if (!isNaN(d.getTime())) {
      clean.dateOfBirth = d;
    } else {
      delete clean.dateOfBirth;
    }
  }

  // Ensure array fields are arrays
  ['allergies', 'chronicDiseases', 'currentMedications', 'surgeries', 'vaccinations', 'medicalConditions', 'familyHistory'].forEach(field => {
    if (clean[field] !== undefined) {
      if (typeof clean[field] === 'string') {
        clean[field] = clean[field].split(',').map(s => s.trim()).filter(Boolean);
      } else if (!Array.isArray(clean[field])) {
        clean[field] = [];
      }
    }
  });

  clean.updatedAt = new Date();
  return clean;
}

/**
 * GET /api/patient/profile
 * Get patient profile and emergency contacts.
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    let profile = await PatientProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await PatientProfile.create({ user: req.user._id, fullName: req.user.name });
    }
    const contacts = await EmergencyContact.find({ owner: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
    res.json({ success: true, profile, contacts });
  } catch (error) { next(error); }
});

/**
 * PUT /api/patient/profile
 * Update patient profile with sanitized data.
 */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const cleanUpdates = sanitizeProfileUpdates(req.body);

    let profile = await PatientProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await PatientProfile.create({ user: req.user._id, fullName: req.user.name, ...cleanUpdates });
    } else {
      Object.assign(profile, cleanUpdates);
      await profile.save();
    }

    await logActivity({ user: req.user._id, action: 'update_profile', resource: 'patient_profile' });
    res.json({ success: true, profile });
  } catch (error) { next(error); }
});

/**
 * POST /api/patient/contacts
 * Add emergency contact.
 */
router.post('/contacts', protect, async (req, res, next) => {
  try {
    const { name, relationship, phone, email, priority } = req.body;
    if (!name || !relationship || !phone) {
      return res.status(400).json({ success: false, message: 'Name, relationship, and phone are required' });
    }

    const contact = await EmergencyContact.create({
      owner: req.user._id,
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      priority: ['Primary', 'Secondary', 'Other'].includes(priority) ? priority : 'Secondary',
      isPrimary: priority === 'Primary'
    });

    await logActivity({ user: req.user._id, action: 'create_contact', resource: 'contact' });
    res.status(201).json({ success: true, contact });
  } catch (error) { next(error); }
});

/**
 * PUT /api/patient/contacts/:id
 * Update emergency contact.
 */
router.put('/contacts/:id', protect, async (req, res, next) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.priority) {
      updates.isPrimary = updates.priority === 'Primary';
    }

    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, contact });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/patient/contacts/:id
 * Delete emergency contact.
 */
router.delete('/contacts/:id', protect, async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, message: 'Contact removed' });
  } catch (error) { next(error); }
});

export default router;
