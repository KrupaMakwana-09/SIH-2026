const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Sub-Centre', 'PHC', 'CHC', 'District Hospital', 'Specialist Centre'], required: true },
  level: { type: Number, default: 1 },
  village: { type: String, required: true },
  block: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, default: 'Uttar Pradesh' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distanceKm: { type: Number, default: 5 },
  contactNumber: { type: String, default: '' },
  doctors: [
    {
      name: { type: String, required: true },
      specialty: { type: String, required: true },
      available: { type: Boolean, default: true },
      onDutyHours: { type: String, default: '24x7' }
    }
  ],
  nursesCount: { type: Number, default: 4 },
  ashaWorkersCount: { type: Number, default: 10 },
  beds: {
    total: { type: Number, default: 10 },
    occupied: { type: Number, default: 0 },
    available: { type: Number, default: 10 }
  },
  oxygenCylinders: { type: Number, default: 2 },
  diagnosticsAvailable: [{ type: String }],
  diagnosticsMissing: [{ type: String }],
  operatingStatus: { type: String, default: 'Open' },
  currentWaitTimeMins: { type: Number, default: 15 },
  emergencyCapable: { type: Boolean, default: false },
  rating: { type: Number, default: 4.0 }
}, { timestamps: true });

module.exports = mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
