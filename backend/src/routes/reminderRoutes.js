import express from 'express';
import Reminder from '../models/Reminder.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/reminders
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ owner: req.user._id }).sort({ dueDate: 1 });
    res.json({ success: true, reminders });
  } catch (error) { next(error); }
});

/**
 * POST /api/reminders
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { type, title, details, dueDate, dueTime } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title and due date are required' });
    }

    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid due date' });
    }

    const reminder = await Reminder.create({
      owner: req.user._id,
      type: ['medicine', 'appointment', 'document'].includes(type) ? type : 'medicine',
      title: title.trim(),
      details: details ? details.trim() : '',
      dueDate: parsedDate,
      dueTime: dueTime || '',
      status: 'active'
    });

    await logActivity({ user: req.user._id, action: 'create_reminder', resource: 'reminder' });
    res.status(201).json({ success: true, reminder });
  } catch (error) { next(error); }
});

/**
 * PUT /api/reminders/:id
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.dueDate) {
      const parsedDate = new Date(updates.dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid due date' });
      }
      updates.dueDate = parsedDate;
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, reminder });
  } catch (error) { next(error); }
});

/**
 * DELETE /api/reminders/:id
 */
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, message: 'Reminder removed' });
  } catch (error) { next(error); }
});

export default router;
