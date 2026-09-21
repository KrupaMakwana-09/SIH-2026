const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to user making the request
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsNeeded: { type: Number, default: 1 },
  hospitalName: { type: String, required: true },
  city: { type: String, required: true },
  contactPerson: { type: String },
  contactPhone: { type: String, required: true },
  urgency: { type: String, default: 'IMMEDIATE' },
  notes: { type: String },
  status: { type: String, default: 'ACTIVE_BROADCAST' }
}, { timestamps: true });

module.exports = mongoose.models.BloodRequest || mongoose.model('BloodRequest', BloodRequestSchema);
