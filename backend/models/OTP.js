const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: false
  },
  purpose: {
    type: String,
    required: false
  },
  // Legacy & admin verification fields
  type: {
    type: String,
    required: false
  },
  target: {
    type: String,
    required: false
  },
  otp: {
    type: String,
    required: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    index: { expireAfterSeconds: 0 } // MongoDB TTL — auto-deletes expired docs
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

// Compound index for fast lookups
OtpSchema.index({ userId: 1, purpose: 1 });
OtpSchema.index({ target: 1, type: 1 });

module.exports = mongoose.models.OTP || mongoose.model('OTP', OtpSchema);
