import mongoose from 'mongoose';

const bloodInventorySchema = new mongoose.Schema({
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    unique: true
  },
  unitsAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  minimumThreshold: {
    type: Number,
    default: 10
  },
  maxCapacity: {
    type: Number,
    default: 100
  },
  expiringUnits: [{
    expiryDate: Date,
    units: Number
  }],
  reservedUnits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to check if blood type is low in stock
bloodInventorySchema.methods.isLowStock = function() {
  return this.unitsAvailable <= this.minimumThreshold;
};

// Method to get available units (total - reserved)
bloodInventorySchema.methods.getAvailableUnits = function() {
  return Math.max(0, this.unitsAvailable - this.reservedUnits);
};

export default mongoose.model('BloodInventory', bloodInventorySchema);