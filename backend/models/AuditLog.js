const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      'PATIENT_LOOKUP',
      'QR_LOOKUP',
      'PATIENT_RECORD_ACCESS',
      'DIAGNOSIS_CREATE',
      'DIAGNOSIS_UPDATE',
      'PRESCRIPTION_CREATE',
      'PRESCRIPTION_UPDATE',
      'STOCK_IN',
      'STOCK_OUT',
      'STOCK_ADJUSTMENT',
      'MEDICINE_DISPENSE'
    ]
  },
  userId: { type: String, default: 'anonymous', index: true },
  userName: { type: String, default: 'System User' },
  userRole: { type: String, default: 'unspecified', index: true },
  patientId: { type: String, default: '', index: true },
  resource: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], default: 'SUCCESS', index: true },
  ip: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
