import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationDate: {
    type: Date,
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsCollected: {
    type: Number,
    required: true,
    min: 1,
    max: 2,
    default: 1
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rejected'],
    default: 'scheduled'
  },
  location: {
    name: String,
    address: String,
    city: String,
    state: String
  },
  preScreening: {
    weight: Number,
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    hemoglobin: Number,
    eligible: Boolean
  },
  postDonation: {
    complications: Boolean,
    notes: String
  },
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying
donationSchema.index({ donor: 1, donationDate: -1 });
donationSchema.index({ status: 1, donationDate: -1 });

export default mongoose.model('Donation', donationSchema);