import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['donor', 'recipient', 'admin'],
    default: 'donor'
  },
  phone: {
    type: String,
    required: function() { return this.role !== 'admin'; }
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.role !== 'admin'; }
  },
  dateOfBirth: {
    type: Date,
    required: function() { return this.role !== 'admin'; }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() { return this.role !== 'admin'; }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  medicalHistory: {
    conditions: [String],
    medications: [String],
    allergies: [String]
  },
  lastDonation: {
    type: Date,
    default: null
  },
  isEligible: {
    type: Boolean,
    default: true
  },
  donationCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check donation eligibility
userSchema.methods.checkEligibility = function() {
  if (!this.lastDonation) return true;
  
  const daysSinceLastDonation = Math.floor((Date.now() - this.lastDonation) / (1000 * 60 * 60 * 24));
  return daysSinceLastDonation >= 56; // 8 weeks minimum between donations
};

export default mongoose.model('User', userSchema);