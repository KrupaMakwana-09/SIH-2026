const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile'
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility'
  },
  visitDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  visitType: {
    type: String,
    enum: ['OPD', 'Emergency', 'Follow-up', 'IPD', 'Teleconsult'],
    default: 'OPD'
  },

  // Clinical diagnosis
  diagnosis: {
    type: String,
    required: true
  },
  symptoms: [{ type: String }],
  clinicalNotes: {
    type: String,
    default: ''
  },

  // Prescriptions (Digital Rx)
  prescriptions: [{
    medicine: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    duration: { type: String, default: '' },
    instructions: { type: String, default: '' }
  }],

  // Treatments administered
  treatments: [{ type: String }],

  // Lab / diagnostic test reports
  testReports: [{
    testName: { type: String, required: true },
    result: { type: String, required: true },
    normalRange: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical'],
      default: 'Normal'
    },
    testDate: { type: Date, default: Date.now }
  }],

  // Vitals captured during this visit
  vitalsAtVisit: {
    bp: { type: String },
    spo2: { type: Number },
    temp: { type: Number },
    pulse: { type: Number },
    sugar: { type: String }
  },

  // Optional link to the referral that triggered this visit
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },

  // Snapshot fields for quick display without populate
  doctorName: { type: String, default: '' },
  facilityName: { type: String, default: '' }

}, { timestamps: true });

// Compound indexes for common query patterns
MedicalRecordSchema.index({ patientId: 1, visitDate: -1 });
MedicalRecordSchema.index({ doctorId: 1, visitDate: -1 });

module.exports = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', MedicalRecordSchema);
