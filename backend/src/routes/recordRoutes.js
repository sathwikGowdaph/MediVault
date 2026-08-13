import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MedicalRecord from '../models/MedicalRecord.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';
import { deleteFromCloudinary } from '../services/cloudinaryService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

/**
 * GET /api/records
 * List medical records with search, filter, sort, and pagination.
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, search, sort = 'newest', page = 1, limit = 10 } = req.query;
    const query = { owner: req.user._id };

    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { doctor: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } }
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      recent: { updatedAt: -1 },
      alpha: { title: 1 }
    };
    const sortObj = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      MedicalRecord.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
      MedicalRecord.countDocuments(query)
    ]);

    res.json({
      success: true,
      records,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/records/:id
 * Get a single medical record by ID.
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, record });
  } catch (error) { next(error); }
});

/**
 * POST /api/records
 * Create a record without a file (metadata only).
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.create({ owner: req.user._id, ...req.body });
    await logActivity({ user: req.user._id, action: 'create_record', resource: 'medical_record' });
    res.status(201).json({ success: true, record });
  } catch (error) { next(error); }
});

/**
 * PUT /api/records/:id
 * Update medical record metadata.
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    // Prevent overwriting file fields
    const { fileName, filePath, mimeType, size, owner, ...updates } = req.body;
    updates.updatedAt = new Date();

    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    await logActivity({ user: req.user._id, action: 'update_record', resource: 'medical_record' });
    res.json({ success: true, record });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/records/:id
 * Delete a medical record and its associated Cloudinary/local file.
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Purge from Cloudinary if stored in Cloudinary
    if (record.cloudinaryPublicId) {
      await deleteFromCloudinary(record.cloudinaryPublicId, record.cloudinaryResourceType);
    }

    // Delete local file if present
    if (record.filePath && fs.existsSync(record.filePath)) {
      try { fs.unlinkSync(record.filePath); } catch (_) {}
    }

    await MedicalRecord.deleteOne({ _id: req.params.id });
    await logActivity({ user: req.user._id, action: 'delete_record', resource: 'medical_record' });
    res.json({ success: true, message: 'Record removed' });
  } catch (error) { next(error); }
});

export default router;
