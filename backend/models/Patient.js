const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to Citizen User Account
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Female' },
  village: { type: String, required: true },
  ashaWorkerName: { type: String, default: 'ASHA Worker' },
  ashaWorkerContact: { type: String, default: '' },
  guardianName: { type: String, default: '' },
  phone: { type: String, default: '', index: true },
  abhaId: { type: String, default: '', index: true },
  sscCode: { type: String, default: '', trim: true, index: true },
  qrToken: { type: String, trim: true, sparse: true, index: true },
  chiefComplaint: { type: String, required: true },
  symptomTags: [{ type: String }],
  vitals: {
    bp: { type: String, default: '120/80' },
    spo2: { type: Number, default: 98 },
    temp: { type: Number, default: 98.4 },
    pulse: { type: Number, default: 72 },
    sugar: { type: String, default: 'Normal' }
  },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
  triageCategory: { type: String, default: 'GREEN_ROUTINE' },
  recommendedFacilityType: { type: String, default: 'PHC' },
  registrationDate: { type: Date, default: Date.now },

  // Patient Profile Extended Fields
  bloodGroup: { type: String, default: 'B+' },
  knownAllergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  emergencyContact: { type: String, default: '' },
  currentHealthStatus: {
    condition: { type: String, default: 'Stable' },
    summary: { type: String, default: '' },
    lastEvaluatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

PatientSchema.pre('save', function (next) {
  if (!this.qrToken) {
    const cleanId = (this.id || '').replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
    this.qrToken = `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.sscCode) {
    const stateCode = 'GJ';
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.sscCode = `SSC-${stateCode}-2026-${randomSuffix}`;
  }
  next();
});

module.exports = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
