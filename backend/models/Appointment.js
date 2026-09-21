const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile',
    required: true,
    index: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility'
  },
  type: {
    type: String,
    enum: ['FOLLOW_UP', 'OPD', 'EMERGENCY', 'TELECONSULT'],
    default: 'FOLLOW_UP'
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['NORMAL', 'URGENT', 'CRITICAL'],
    default: 'NORMAL'
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  tokenNumber: {
    type: Number
  },

  // Snapshot fields for quick display without populate
  patientName: { type: String, default: '' },
  patientPhone: { type: String, default: '' },
  doctorName: { type: String, default: '' }

}, { timestamps: true });

// Compound indexes for common query patterns
AppointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
