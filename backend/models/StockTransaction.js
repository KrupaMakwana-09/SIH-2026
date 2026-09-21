const mongoose = require('mongoose');

const StockTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: true,
    index: true
  },
  medicineId: { type: String, required: true, index: true },
  medicineName: { type: String, required: true },
  batchNumber: { type: String, required: true, index: true },
  quantity: { type: Number, required: true }, // positive number
  previousQty: { type: Number, default: 0 },
  newQty: { type: Number, default: 0 },
  expiryDate: { type: Date },
  supplier: { type: String, default: 'Government Central Medical Stores Depot (CMSD)' },
  patientId: { type: String, default: '', index: true },
  patientName: { type: String, default: '' },
  prescriptionId: { type: String, default: '', index: true },
  dispensedBy: { type: String, default: '' },
  userId: { type: String, default: '' },
  userName: { type: String, default: 'Pharmacist' },
  userRole: { type: String, default: 'pharmacist' },
  reason: { type: String, default: '' },
  facilityId: { type: String, default: 'FAC-PHC-001' },
  facilityName: { type: String, default: 'Primary Health Centre' },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);
