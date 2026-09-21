const mongoose = require('mongoose');

const DispensedItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  medicineName: { type: String, required: true },
  genericName: { type: String, default: '' },
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true },
  dosage: { type: String, default: '' },
  frequency: { type: String, default: '' },
  duration: { type: String, default: '' },
  instructions: { type: String, default: '' }
}, { _id: false });

const MedicineDispensingSchema = new mongoose.Schema({
  dispenseId: { type: String, required: true, unique: true, index: true },
  prescriptionId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String, default: '' },
  doctorId: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  dispensedBy: { type: String, required: true },
  dispensedByUserId: { type: String, default: '' },
  facilityId: { type: String, default: 'FAC-PHC-001' },
  facilityName: { type: String, default: 'Primary Health Centre Pharmacy' },
  items: [DispensedItemSchema],
  dispensedAt: { type: Date, default: Date.now, index: true },
  notes: { type: String, default: 'Dispensed as per prescription' }
}, { timestamps: true });

module.exports = mongoose.models.MedicineDispensing || mongoose.model('MedicineDispensing', MedicineDispensingSchema);
