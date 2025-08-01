import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsNeeded: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  hospitalName: {
    type: String,
    required: true
  },
  hospitalAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  medicalReason: {
    type: String,
    required: true
  },
  requiredDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedDate: {
    type: Date,
    default: null
  },
  fulfilledDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: Date
  }]
}, {
  timestamps: true
});

// Index for efficient querying
bloodRequestSchema.index({ bloodType: 1, status: 1, urgency: 1 });
bloodRequestSchema.index({ requiredDate: 1 });

export default mongoose.model('BloodRequest', bloodRequestSchema);