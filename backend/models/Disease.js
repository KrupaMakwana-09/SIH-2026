const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  diseaseId: { type: String, required: true, unique: true, index: true },
  diseaseName: { type: String, required: true, index: true },
  category: { type: String, default: 'General Infectious', index: true },
  description: { type: String, default: '' },
  symptoms: [{ type: String }],
  icdCode: { type: String, default: '' },
  severityDefault: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Critical'], default: 'Moderate' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.models.Disease || mongoose.model('Disease', DiseaseSchema);
