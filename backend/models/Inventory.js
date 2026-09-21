const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  genericName: { type: String, default: '', index: true },
  category: { type: String, required: true, index: true },
  dosageForm: { type: String, default: 'Tablet' }, // Tablet, Capsule, Syrup, Injection, Ointment, Solution, Vials
  strength: { type: String, default: '' }, // e.g. 500mg, 250mg, 100ml
  manufacturer: { type: String, default: 'National Medical Depot' },
  supplier: { type: String, default: '' },
  batchNumber: { type: String, default: 'BATCH-2026-A1', index: true },
  expiryDate: { type: Date, index: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true }, // Changed to ObjectId ref
  facilityName: { type: String, required: true, default: 'Primary Health Centre' },
  stockQty: { type: Number, required: true, default: 0 },
  minThreshold: { type: Number, required: true, default: 50 },
  status: {
    type: String,
    enum: ['In Stock', 'Adequate', 'Low Stock', 'Critical Low', 'Out of Stock', 'Expired'],
    default: 'In Stock'
  },
  unit: { type: String, default: 'Strips' },
  lastRestockedAt: { type: Date },
  description: { type: String, default: '' }
}, { timestamps: true });

// Pre-save calculate status accurately based on stockQty and expiryDate
InventorySchema.pre('save', function (next) {
  const now = new Date();
  if (this.expiryDate && new Date(this.expiryDate) <= now) {
    this.status = 'Expired';
  } else if (this.stockQty <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stockQty <= this.minThreshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);