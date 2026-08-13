import express from 'express';
import FamilyRelationship from '../models/FamilyRelationship.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/family
 * Get all family relationships for the current user (both as patient and as family member).
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const relationships = await FamilyRelationship.find({
      $or: [{ patient: req.user._id }, { familyMember: req.user._id }]
    }).populate('patient', 'name email').populate('familyMember', 'name email');
    res.json({ success: true, relationships });
  } catch (error) { next(error); }
});

/**
 * POST /api/family/invite
 * Patient invites a family member by email.
 */
router.post('/invite', protect, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const familyUser = await User.findOne({ email: email.toLowerCase() });
    if (!familyUser) return res.status(404).json({ success: false, message: 'No user found with that email' });
    if (familyUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
    }

    const existing = await FamilyRelationship.findOne({ patient: req.user._id, familyMember: familyUser._id });
    if (existing) return res.status(409).json({ success: false, message: 'Relationship already exists' });

    const relationship = await FamilyRelationship.create({
      patient: req.user._id,
      familyMember: familyUser._id,
      status: 'pending'
    });

    await logActivity({ user: req.user._id, action: 'invite_family', resource: 'family' });

    const populated = await FamilyRelationship.findById(relationship._id)
      .populate('patient', 'name email')
      .populate('familyMember', 'name email');

    res.status(201).json({ success: true, relationship: populated });
  } catch (error) { next(error); }
});

/**
 * PUT /api/family/:id/accept
 * Family member accepts a pending invitation.
 */
router.put('/:id/accept', protect, async (req, res, next) => {
  try {
    const relationship = await FamilyRelationship.findOneAndUpdate(
      { _id: req.params.id, familyMember: req.user._id, status: 'pending' },
      { status: 'accepted', updatedAt: new Date() },
      { new: true }
    ).populate('patient', 'name email').populate('familyMember', 'name email');

    if (!relationship) return res.status(404).json({ success: false, message: 'Invitation not found' });

    await logActivity({ user: req.user._id, action: 'accept_family_invite', resource: 'family' });
    res.json({ success: true, relationship });
  } catch (error) { next(error); }
});

/**
 * PUT /api/family/:id/reject
 * Family member rejects a pending invitation.
 */
router.put('/:id/reject', protect, async (req, res, next) => {
  try {
    const relationship = await FamilyRelationship.findOneAndUpdate(
      { _id: req.params.id, familyMember: req.user._id, status: 'pending' },
      { status: 'rejected', updatedAt: new Date() },
      { new: true }
    );

    if (!relationship) return res.status(404).json({ success: false, message: 'Invitation not found' });

    res.json({ success: true, message: 'Invitation rejected' });
  } catch (error) { next(error); }
});

/**
 * PUT /api/family/:id/permissions
 * Patient updates permissions for a family member.
 */
router.put('/:id/permissions', protect, async (req, res, next) => {
  try {
    const { viewProfile, viewRecords, manageRecords, viewEmergency } = req.body;
    const relationship = await FamilyRelationship.findOneAndUpdate(
      { _id: req.params.id, patient: req.user._id },
      {
        permissions: { viewProfile, viewRecords, manageRecords, viewEmergency },
        updatedAt: new Date()
      },
      { new: true }
    ).populate('patient', 'name email').populate('familyMember', 'name email');

    if (!relationship) return res.status(404).json({ success: false, message: 'Relationship not found' });
    res.json({ success: true, relationship });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/family/:id
 * Patient removes a family member's access.
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const relationship = await FamilyRelationship.findOneAndDelete({
      _id: req.params.id,
      $or: [{ patient: req.user._id }, { familyMember: req.user._id }]
    });
    if (!relationship) return res.status(404).json({ success: false, message: 'Relationship not found' });
    await logActivity({ user: req.user._id, action: 'remove_family', resource: 'family' });
    res.json({ success: true, message: 'Family access removed' });
  } catch (error) { next(error); }
});

/**
 * GET /api/family/:id/vault
 * View connected family member's medical profile & shared records based on granted permissions.
 */
router.get('/:id/vault', protect, async (req, res, next) => {
  try {
    const relationship = await FamilyRelationship.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('familyMember', 'name email');

    if (!relationship || relationship.status !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Access denied or relationship not active' });
    }

    const isPatient = relationship.patient._id.toString() === req.user._id.toString();
    const isFamily = relationship.familyMember._id.toString() === req.user._id.toString();

    if (!isPatient && !isFamily) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const PatientProfile = (await import('../models/PatientProfile.js')).default;
    const EmergencyContact = (await import('../models/EmergencyContact.js')).default;
    const MedicalRecord = (await import('../models/MedicalRecord.js')).default;

    const targetPatientId = relationship.patient._id;
    const profile = await PatientProfile.findOne({ user: targetPatientId });
    const contacts = await EmergencyContact.find({ owner: targetPatientId });
    
    let records = [];
    if (relationship.permissions?.viewRecords || isPatient) {
      records = await MedicalRecord.find({ owner: targetPatientId }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      patient: relationship.patient,
      profile: relationship.permissions?.viewProfile || isPatient ? profile : null,
      contacts: relationship.permissions?.viewEmergency || isPatient ? contacts : [],
      records,
      permissions: relationship.permissions
    });
  } catch (error) { next(error); }
});

export default router;
