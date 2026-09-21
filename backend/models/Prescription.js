const mongoose = require('mongoose');

const PrescriptionMedicineSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  medicineName: { type: String, required: true },
  genericName: { type: String, default: '' },
  dosageForm: { type: String, default: 'Tablet' },
  dosage: { type: String, default: '1 tab' },
  frequency: { type: String, default: 'Twice daily' },
  duration: { type: String, default: '5 days' },
  instructions: { type: String, default: 'After food' },
  prescribedQty: { type: Number, required: true, default: 10 },
  dispensedQty: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Partially Dispensed', 'Fully Dispensed'],
    default: 'Pending'
  },
  batchHistory: [{
    batchNumber: String,
    quantity: Number,
    dispensedAt: { type: Date, default: Date.now },
    dispensedBy: String
  }]
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, default: '' },
  patientAge: { type: Number },
  patientGender: { type: String, default: 'Female' },
  patientPhone: { type: String, default: '' },
  doctorId: { type: String, default: 'DOC-ATTENDING' },
  doctorName: { type: String, required: true },
  facilityId: { type: String, default: 'FAC-PHC-001' },
  facilityName: { type: String, default: 'Primary Health Centre' },
  visitId: { type: String, default: '' },
  diagnosis: { type: String, required: true },
  diseaseId: { type: String, default: '' },
  clinicalNotes: { type: String, default: '' },
  medicines: [PrescriptionMedicineSchema],
  status: {
    type: String,
    enum: ['Prescribed', 'Partially Dispensed', 'Fully Dispensed', 'Cancelled'],
    default: 'Prescribed',
    index: true
  },
  prescribedAt: { type: Date, default: Date.now, index: true },
  followUpDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
