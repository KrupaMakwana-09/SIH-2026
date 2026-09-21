const mongoose = require('mongoose');

const DiseaseMedicineSchema = new mongoose.Schema({
  diseaseId: { type: String, required: true, index: true },
  medicineId: { type: String, required: true, index: true },
  diseaseName: { type: String, default: '' },
  medicineName: { type: String, default: '' },
  dosageForm: { type: String, default: 'Tablet' },
  standardDosage: { type: String, default: '500mg' },
  standardFrequency: { type: String, default: 'Twice daily (BD)' },
  standardDuration: { type: String, default: '5 days' },
  instructions: { type: String, default: 'After food with water' },
  isFirstLine: { type: Boolean, default: true },
  notes: { type: String, default: 'Standard recommended regimen' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Compound index to ensure uniqueness of disease + medicine pair
DiseaseMedicineSchema.index({ diseaseId: 1, medicineId: 1 }, { unique: true });

module.exports = mongoose.models.DiseaseMedicine || mongoose.model('DiseaseMedicine', DiseaseMedicineSchema);
