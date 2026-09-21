const mongoose = require('mongoose');

const OfflineSyncSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    default: ''
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  recordType: {
    type: String,
    enum: ['PATIENT_REG', 'VITALS', 'TRIAGE', 'FOLLOW_UP'],
    required: true
  },
  status: {
    type: String,
    enum: ['QUEUED', 'SYNCING', 'SYNCED', 'CONFLICT', 'FAILED'],
    default: 'QUEUED',
    index: true
  },
  syncedAt: {
    type: Date
  },
  conflictDetails: {
    type: String,
    default: ''
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  }
}, { timestamps: true });

// Compound indexes for sync queue processing
OfflineSyncSchema.index({ userId: 1, status: 1 });
OfflineSyncSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.models.OfflineSync || mongoose.model('OfflineSync', OfflineSyncSchema);
