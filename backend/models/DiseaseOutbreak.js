const mongoose = require('mongoose');

const OutbreakSchema = new mongoose.Schema({
  disease: { type: String, required: true },
  village: { type: String, required: true },
  block: { type: String, required: true },
  casesThisWeek: { type: Number, default: 0 },
  trend: { type: String, default: 'Stable' },
  status: { type: String, enum: ['ACTIVE_WATCH', 'INTERVENTION_TRIGGERED', 'UNDER_SURVEILLANCE', 'RESOLVED'], default: 'ACTIVE_WATCH' },
  recommendedAction: { type: String, required: true },
  detectedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.DiseaseOutbreak || mongoose.model('DiseaseOutbreak', OutbreakSchema);
