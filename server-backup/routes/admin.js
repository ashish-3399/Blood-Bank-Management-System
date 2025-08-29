import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import Donation from '../models/Donation.js';
import BloodInventory from '../models/BloodInventory.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalRecipients,
      pendingRequests,
      completedDonations,
      scheduledDonations,
      inventory
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'donor', isActive: true }),
      User.countDocuments({ role: 'recipient', isActive: true }),
      BloodRequest.countDocuments({ status: 'pending' }),
      Donation.countDocuments({ status: 'completed' }),
      Donation.countDocuments({ status: 'scheduled' }),
      BloodInventory.find()
    ]);

    const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
    const lowStockCount = inventory.filter(item => item.isLowStock()).length;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          recipients: totalRecipients
        },
        requests: {
          pending: pendingRequests
        },
        donations: {
          completed: completedDonations,
          scheduled: scheduledDonations
        },
        inventory: {
          totalUnits,
          lowStockCount,
          bloodTypes: inventory.length
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: error.message
    });
  }
});

// Get recent activities
router.get('/activities', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [recentRequests, recentDonations, recentUsers] = await Promise.all([
      BloodRequest.find()
        .populate('requester', 'name')
        .sort('-createdAt')
        .limit(5),
      Donation.find()
        .populate('donor', 'name')
        .sort('-createdAt')
        .limit(5),
      User.find({ role: { $ne: 'admin' } })
        .select('name email role createdAt')
        .sort('-createdAt')
        .limit(5)
    ]);

    res.json({
      success: true,
      activities: {
        requests: recentRequests,
        donations: recentDonations,
        users: recentUsers
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activities',
      error: error.message
    });
  }
});

// Get analytics data
router.get('/analytics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [donationTrends, requestTrends, bloodTypeDistribution] = await Promise.all([
      Donation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      BloodRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      BloodInventory.find().select('bloodType unitsAvailable')
    ]);

    res.json({
      success: true,
      analytics: {
        donationTrends,
        requestTrends,
        bloodTypeDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data',
      error: error.message
    });
  }
});

export default router;