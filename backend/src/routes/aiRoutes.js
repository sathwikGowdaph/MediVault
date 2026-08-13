import express from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientProfile from '../models/PatientProfile.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';
import aiService from '../services/aiService.js';

const router = express.Router();

/**
 * POST /api/ai/ocr/:recordId
 * Trigger OCR + AI analysis on an uploaded medical document.
 * Updates the MedicalRecord with extractedText, aiSummary, and aiStatus.
 */
router.post('/ocr/:recordId', protect, async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.recordId, owner: req.user._id });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });

    // Mark as processing
    record.aiStatus = 'processing';
    await record.save();

    // Run OCR
    const extractedText = await aiService.extractText(record.filePath, record.mimeType);
    const analysis = await aiService.analyzeDocument(extractedText);

    // Store results
    record.extractedText = extractedText;
    record.aiSummary = analysis.summary || '';
    record.aiStatus = 'completed';
    await record.save();

    await logActivity({ user: req.user._id, action: 'ai_ocr', resource: 'medical_record' });

    res.json({
      success: true,
      record: {
        _id: record._id,
        aiStatus: record.aiStatus,
        aiSummary: record.aiSummary,
        extractedText: record.extractedText
      },
      analysis
    });
  } catch (error) {
    // Mark as failed if OCR errored
    try {
      await MedicalRecord.findOneAndUpdate(
        { _id: req.params.recordId, owner: req.user._id },
        { aiStatus: 'failed' }
      );
    } catch (_) { /* ignore secondary error */ }
    next(error);
  }
});

/**
 * GET /api/ai/summary
 * Generate a full medical summary for the logged-in patient.
 */
router.get('/summary', protect, async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ user: req.user._id });
    const records = await MedicalRecord.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(10);

    const summary = await aiService.generateMedicalSummary(profile, records);

    res.json({ success: true, summary });
  } catch (error) { next(error); }
});

/**
 * GET /api/ai/emergency-summary
 * Generate a concise emergency risk summary for first responders.
 */
router.get('/emergency-summary', protect, async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ user: req.user._id });
    const summary = await aiService.generateEmergencySummary(profile);
    res.json({ success: true, summary });
  } catch (error) { next(error); }
});

export default router;
