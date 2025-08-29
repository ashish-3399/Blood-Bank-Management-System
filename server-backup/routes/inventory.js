import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import BloodInventory from '../models/BloodInventory.js';

const router = express.Router();

// Get all blood inventory
router.get('/', authenticate, async (req, res) => {
  try {
    const inventory = await BloodInventory.find().sort('bloodType');
    
    // If no inventory exists, create default entries
    if (inventory.length === 0) {
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const defaultInventory = bloodTypes.map(type => ({
        bloodType: type,
        unitsAvailable: 0,
        minimumThreshold: 10,
        maxCapacity: 100
      }));
      
      await BloodInventory.insertMany(defaultInventory);
      const newInventory = await BloodInventory.find().sort('bloodType');
      
      return res.json({
        success: true,
        inventory: newInventory
      });
    }

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory',
      error: error.message
    });
  }
});

// Update blood inventory (admin only)
router.patch('/:bloodType', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { bloodType } = req.params;
    const { unitsAvailable, minimumThreshold, maxCapacity } = req.body;

    let inventory = await BloodInventory.findOne({ bloodType });
    
    if (!inventory) {
      inventory = new BloodInventory({ bloodType });
    }

    if (unitsAvailable !== undefined) inventory.unitsAvailable = unitsAvailable;
    if (minimumThreshold !== undefined) inventory.minimumThreshold = minimumThreshold;
    if (maxCapacity !== undefined) inventory.maxCapacity = maxCapacity;
    
    inventory.lastUpdated = new Date();
    await inventory.save();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

// Add blood units (admin only)
router.post('/add-units', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { bloodType, units, expiryDate } = req.body;

    let inventory = await BloodInventory.findOne({ bloodType });
    
    if (!inventory) {
      inventory = new BloodInventory({ bloodType });
    }

    inventory.unitsAvailable += units;
    
    if (expiryDate) {
      inventory.expiringUnits.push({
        expiryDate: new Date(expiryDate),
        units
      });
    }
    
    inventory.lastUpdated = new Date();
    await inventory.save();

    res.json({
      success: true,
      message: `Added ${units} units of ${bloodType} blood`,
      inventory
    });
  } catch (error) {
    console.error('Add units error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add blood units',
      error: error.message
    });
  }
});

// Get low stock alerts
router.get('/alerts', authenticate, authorize('admin'), async (req, res) => {
  try {
    const inventory = await BloodInventory.find();
    const lowStockItems = inventory.filter(item => item.isLowStock());
    
    // Get expiring units (within 7 days)
    const expiringItems = inventory.filter(item => 
      item.expiringUnits.some(unit => {
        const daysUntilExpiry = Math.ceil((unit.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      })
    );

    res.json({
      success: true,
      alerts: {
        lowStock: lowStockItems,
        expiring: expiringItems
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
      error: error.message
    });
  }
});

// Get inventory statistics
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const inventory = await BloodInventory.find();
    
    const stats = {
      totalUnits: inventory.reduce((sum, item) => sum + item.unitsAvailable, 0),
      lowStockCount: inventory.filter(item => item.isLowStock()).length,
      bloodTypeDistribution: inventory.map(item => ({
        bloodType: item.bloodType,
        units: item.unitsAvailable,
        isLowStock: item.isLowStock()
      }))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

export default router;