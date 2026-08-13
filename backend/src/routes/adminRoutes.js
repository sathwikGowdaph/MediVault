import express from 'express';
import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/activityLogger.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/admin/users
 * List all users with optional search and role filter.
 */
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) { next(error); }
});

/**
 * PUT /api/admin/users/:id/toggle
 * Toggle user active/inactive status.
 */
router.put('/users/:id/toggle', protect, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot toggle admin accounts' });

    user.isActive = !user.isActive;
    user.updatedAt = new Date();
    await user.save();

    await logActivity({
      user: req.user._id,
      action: user.isActive ? 'enable_user' : 'disable_user',
      resource: 'user',
      details: { targetUser: user._id }
    });

    res.json({ success: true, user });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/statistics
 * Return system-wide statistics.
 */
router.get('/statistics', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, totalFamilyMembers, totalRecords, totalActivityLogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'family' }),
      MedicalRecord.countDocuments(),
      ActivityLog.countDocuments()
    ]);

    // Recent registrations per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentRecords = await MedicalRecord.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalFamilyMembers,
        totalRecords,
        totalActivityLogs,
        recentUsers,
        recentRecords
      }
    });
  } catch (error) { next(error); }
});

/**
 * GET /api/admin/activity-logs
 * List recent activity logs with pagination.
 */
router.get('/activity-logs', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const query = action ? { action } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) { next(error); }
});

export default router;
