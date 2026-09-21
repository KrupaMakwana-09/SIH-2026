const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  accessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['doctor', 'asha', 'cmo', 'admin'],
    required: true
  },
  action: {
    type: String,
    enum: [
      'VIEW_PROFILE',
      'VIEW_HISTORY',
      'ADD_RECORD',
      'UPDATE_VITALS',
      'WRITE_PRESCRIPTION',
      'REFERRAL',
      'DOWNLOAD_QR',
      'EXPORT_DATA'
    ],
    required: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },

  // Snapshot fields for quick display without populate
  accessedByName: { type: String, default: '' },
  patientName: { type: String, default: '' }

}, { timestamps: true });

// Compound indexes for audit queries
AccessLogSchema.index({ patientId: 1, createdAt: -1 });
AccessLogSchema.index({ accessedBy: 1, createdAt: -1 });
AccessLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.models.AccessLog || mongoose.model('AccessLog', AccessLogSchema);
