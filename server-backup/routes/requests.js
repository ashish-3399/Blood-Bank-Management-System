import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import BloodRequest from '../models/BloodRequest.js';
import BloodInventory from '../models/BloodInventory.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// Create blood request
router.post('/', authenticate, async (req, res) => {
  try {
    const bloodRequest = new BloodRequest({
      ...req.body,
      requester: req.user.id
    });

    await bloodRequest.save();
    await bloodRequest.populate('requester', 'name email phone');

    // Send notification email to admins
    // This would be implemented with your email service

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      request: bloodRequest
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blood request',
      error: error.message
    });
  }
});

// Get all requests (admin only)
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, bloodType, urgency, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (bloodType) filter.bloodType = bloodType;
    if (urgency) filter.urgency = urgency;

    const requests = await BloodRequest.find(filter)
      .populate('requester', 'name email phone')
      .populate('approvedBy', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(filter);

    res.json({
      success: true,
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get requests',
      error: error.message
    });
  }
});

// Get user's requests
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requester: req.user.id })
      .populate('approvedBy', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get your requests',
      error: error.message
    });
  }
});

// Update request status (admin only)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.status = status;
    request.notes = notes || request.notes;

    if (status === 'approved') {
      request.approvedBy = req.user.id;
      request.approvedDate = new Date();
    }

    if (status === 'fulfilled') {
      request.fulfilledDate = new Date();
      
      // Update inventory
      const inventory = await BloodInventory.findOne({ bloodType: request.bloodType });
      if (inventory && inventory.unitsAvailable >= request.unitsNeeded) {
        inventory.unitsAvailable -= request.unitsNeeded;
        inventory.lastUpdated = new Date();
        await inventory.save();
      }
    }

    await request.save();
    await request.populate('requester', 'name email phone');

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status',
      error: error.message
    });
  }
});

// Get request by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone')
      .populate('approvedBy', 'name');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user can access this request
    if (req.user.role !== 'admin' && request.requester._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get request',
      error: error.message
    });
  }
});

// Delete request
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user can delete this request
    if (req.user.role !== 'admin' && request.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow deletion if request is pending or cancelled
    if (!['pending', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete request with current status'
      });
    }

    await BloodRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete request',
      error: error.message
    });
  }
});

export default router;