const mongoose = require('mongoose');

const BloodBankSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String },
  address: { type: String },
  city: { type: String },
  district: { type: String },
  state: { type: String },
  pincode: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  phone: { type: String },
  emergencyPhone: { type: String },
  whatsapp: { type: String },
  email: { type: String },
  operatingHours: { type: String },
  verified: { type: Boolean, default: false },
  componentAvailable: [{ type: String }],
  stock: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 }
  },
  helpline: { type: String },
  services: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.models.BloodBank || mongoose.model('BloodBank', BloodBankSchema);
