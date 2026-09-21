const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  referralCode: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true }, // Changed to ObjectId ref
  patientName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, default: 'Female' },
  village: { type: String, required: true },
  referringUnit: { type: String, required: true },
  referringFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }, // Added
  referringStaff: { type: String, default: 'ASHA Worker' },
  referredToFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true }, // Changed to ObjectId ref
  referredToFacilityName: { type: String, required: true },
  referralReason: { type: String, required: true },
  provisionalDiagnosis: { type: String, default: 'Under Observation' },
  priority: { type: String, enum: ['ROUTINE_GREEN', 'HIGH_YELLOW', 'EMERGENCY_RED'], default: 'HIGH_YELLOW' },
  status: { type: String, enum: ['Initiated', 'In-Transit', 'Received', 'Doctor_Attended', 'Admitted', 'Discharged', 'Completed'], default: 'Initiated' },
  initiatedAt: { type: Date, default: Date.now },
  transportArranged: { type: String, default: 'Local Assistance / Private' },
  vitalsSnapshot: {
    bp: { type: String, default: '120/80' },
    spo2: { type: Number, default: 98 },
    temp: { type: Number, default: 98.4 },
    pulse: { type: Number, default: 72 }
  },
  doctorHandoffNotes: { type: String, default: '' },
  timeline: [
    {
      time: { type: String, required: true },
      stage: { type: String, required: true },
      by: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
