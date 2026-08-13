import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import MedicalRecord from '../models/MedicalRecord.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  isCloudinaryConfigured
} from '../services/cloudinaryService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Allowed MIME types and their corresponding extensions
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp']
};

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const mimeAllowed = Object.keys(ALLOWED_MIME_TYPES).includes(file.mimetype);
  const ext = path.extname(file.originalname).toLowerCase();
  const extAllowed = ALLOWED_EXTENSIONS.has(ext);

  if (!mimeAllowed || !extAllowed) {
    return cb(new Error('Only PDF and image files (PNG, JPG, WEBP) are allowed'));
  }

  const allowedExts = ALLOWED_MIME_TYPES[file.mimetype] || [];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('File extension does not match file type'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

/**
 * POST /api/files/upload
 * Upload a medical document to Cloudinary and create a MedicalRecord entry.
 */
router.post('/upload', protect, upload.single('file'), async (req, res, next) => {
  let tempFilePath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    tempFilePath = req.file.path;
    const { title, description, category, doctor, hospital, recordDate } = req.body;

    // Verify path traversal
    const resolvedPath = path.resolve(tempFilePath);
    if (!resolvedPath.startsWith(uploadDir)) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return res.status(400).json({ success: false, message: 'Invalid file path' });
    }

    let cloudData = null;
    let storageProvider = 'local';

    // Attempt Cloudinary Upload
    if (isCloudinaryConfigured()) {
      try {
        cloudData = await uploadToCloudinary(tempFilePath, {
          folder: process.env.CLOUDINARY_FOLDER || 'medivault_records',
          mimeType: req.file.mimetype
        });
        storageProvider = 'cloudinary';
      } catch (cloudError) {
        console.warn('[Cloudinary Service]: Direct Cloudinary upload failed, falling back to local file path:', cloudError.message);
      }
    }

    // Clean up temporary local upload file if successfully uploaded to Cloudinary
    if (cloudData && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) { /* ignore */ }
    }

    const record = await MedicalRecord.create({
      owner: req.user._id,
      title: title || req.file.originalname,
      description: description || '',
      category: category || 'Other',
      doctor: doctor || '',
      hospital: hospital || '',
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      fileName: req.file.filename,
      filePath: cloudData?.secureUrl || req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryPublicId: cloudData?.publicId || null,
      cloudinaryUrl: cloudData?.secureUrl || null,
      cloudinaryResourceType: cloudData?.resourceType || 'image',
      cloudinaryFormat: cloudData?.format || null,
      storageProvider,
      aiStatus: 'pending'
    });

    await logActivity({ user: req.user._id, action: 'upload_file', resource: 'medical_record' });
    res.status(201).json({ success: true, record });
  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
    next(error);
  }
});

/**
 * GET /api/files/:id
 * Stream/download a medical document — authenticated.
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Handle Cloudinary Stored Record
    if (record.cloudinaryUrl || record.storageProvider === 'cloudinary') {
      const fileUrl = record.cloudinaryUrl || record.filePath;
      
      res.setHeader('Content-Type', record.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${record.fileName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Proxy request from Cloudinary CDN to maintain authenticated headers
      return https.get(fileUrl, (cloudinaryStream) => {
        cloudinaryStream.pipe(res);
      }).on('error', (err) => {
        console.error('[Cloudinary Proxy Stream Error]:', err.message);
        // Fallback to direct redirect
        return res.redirect(fileUrl);
      });
    }

    // Local Fallback Stored Record
    if (!fs.existsSync(record.filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${record.fileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(record.filePath).pipe(res);
  } catch (error) { next(error); }
});

/**
 * DELETE /api/files/:id
 * Delete a file resource from Cloudinary and database — authenticated.
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Purge from Cloudinary if stored in Cloudinary
    if (record.cloudinaryPublicId) {
      await deleteFromCloudinary(record.cloudinaryPublicId, record.cloudinaryResourceType);
    }

    // Delete local file if it exists
    if (record.filePath && fs.existsSync(record.filePath)) {
      try { fs.unlinkSync(record.filePath); } catch (_) {}
    }

    await MedicalRecord.deleteOne({ _id: req.params.id });
    await logActivity({ user: req.user._id, action: 'delete_file', resource: 'medical_record' });
    res.json({ success: true, message: 'File and record removed successfully' });
  } catch (error) { next(error); }
});

export default router;
