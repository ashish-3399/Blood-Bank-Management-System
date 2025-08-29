import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import BloodInventory from '../models/BloodInventory.js';

const router = express.Router();

// Schedule donation
router.post('/donate', authenticate, async (req, res) => {
  try {
    const donor = await User.findById(req.user.id);
    
    // Check eligibility
    if (!donor.checkEligibility()) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible to donate yet. Please wait at least 8 weeks since your last donation.'
      });
    }

    const donation = new Donation({
      ...req.body,
      donor: req.user.id,
      bloodType: donor.bloodType
    });

    await donation.save();
    await donation.populate('donor', 'name email phone bloodType');

    res.status(201).json({
      success: true,
      message: 'Donation scheduled successfully',
      donation
    });
  } catch (error) {
    console.error('Schedule donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule donation',
      error: error.message
    });
  }
});

// Get user's donations
router.get('/my-donations', authenticate, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id })
      .populate('staffMember', 'name')
      .sort('-donationDate');

    res.json({
      success: true,
      donations
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donations',
      error: error.message
    });
  }
});

// Get all donations (admin only)
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, bloodType, page = 1, limit = 10, sort = '-donationDate' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (bloodType) filter.bloodType = bloodType;

    const donations = await Donation.find(filter)
      .populate('donor', 'name email phone bloodType')
      .populate('staffMember', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(filter);

    res.json({
      success: true,
      donations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donations',
      error: error.message
    });
  }
});

// Update donation status (admin only)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, preScreening, postDonation, notes, unitsCollected } = req.body;
    
    const donation = await Donation.findById(req.params.id).populate('donor');
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    donation.status = status;
    donation.staffMember = req.user.id;
    donation.notes = notes || donation.notes;

    if (preScreening) donation.preScreening = preScreening;
    if (postDonation) donation.postDonation = postDonation;
    if (unitsCollected) donation.unitsCollected = unitsCollected;

    if (status === 'completed') {
      // Update donor's last donation date and count
      const donor = donation.donor;
      donor.lastDonation = donation.donationDate;
      donor.donationCount += 1;
      await donor.save();

      // Add to inventory
      const inventory = await BloodInventory.findOne({ bloodType: donation.bloodType });
      if (inventory) {
        inventory.unitsAvailable += donation.unitsCollected || 1;
        inventory.lastUpdated = new Date();
        await inventory.save();
      }
    }

    await donation.save();

    res.json({
      success: true,
      message: `Donation ${status} successfully`,
      donation
    });
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation status',
      error: error.message
    });
  }
});

// Get donation statistics
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await Donation.aggregate([
      {
        $group: {
          _id: '$bloodType',
          totalDonations: { $sum: 1 },
          totalUnits: { $sum: '$unitsCollected' },
          completedDonations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    const scheduledDonations = await Donation.countDocuments({ status: 'scheduled' });

    res.json({
      success: true,
      stats: {
        total: totalDonations,
        completed: completedDonations,
        scheduled: scheduledDonations,
        byBloodType: stats
      }
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get donation statistics',
      error: error.message
    });
  }
});

export default router;