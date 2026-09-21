const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

function getSafeQuery(id) {
  if (!id) return { id: 'invalid' };
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return { $or: [{ _id: id }, { id: id }] };
  }
  return { id: id };
}

exports.getInventory = async (req, res) => {
  try {
    const list = await Inventory.find().sort({ status: 1, name: 1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, category, facilityId, facilityName, stockQty, minThreshold, unit } = req.body;

    const qty = Number(stockQty) || 0;
    const threshold = Number(minThreshold) || 50;

    let status = 'Adequate';
    if (qty === 0) status = 'Out of Stock';
    else if (qty < threshold * 0.5) status = 'Critical Low';
    else if (qty <= threshold) status = 'Low Stock';

    const id = `MED-${Math.floor(100 + Math.random() * 900)}`;

    const newMed = new Inventory({
      id,
      name,
      category: category || 'General Medicine',
      facilityId: facilityId || 'FAC-GEN',
      facilityName: facilityName || 'District Health HQ',
      stockQty: qty,
      minThreshold: threshold,
      status,
      unit: unit || 'Strips'
    });

    await newMed.save();

    return res.status(201).json({
      success: true,
      message: 'Medicine added to inventory database',
      data: newMed
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQty, addQty, name, category, minThreshold, unit } = req.body;

    const med = await Inventory.findOne(getSafeQuery(id));
    if (!med) {
      return res.status(404).json({ success: false, message: `Medicine record (${id}) not found` });
    }

    if (addQty) {
      med.stockQty += Number(addQty);
    } else if (stockQty !== undefined) {
      med.stockQty = Number(stockQty);
    }

    if (name) med.name = name;
    if (category) med.category = category;
    if (minThreshold !== undefined) med.minThreshold = Number(minThreshold);
    if (unit) med.unit = unit;

    if (med.stockQty === 0) med.status = 'Out of Stock';
    else if (med.stockQty < med.minThreshold * 0.5) med.status = 'Critical Low';
    else if (med.stockQty <= med.minThreshold) med.status = 'Low Stock';
    else med.status = 'Adequate';

    await med.save();

    return res.json({ success: true, message: 'Stock quantity updated in database', data: med });
  } catch (error) {
    console.error('Update stock error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await Inventory.findOneAndDelete(getSafeQuery(id));
    return res.json({ success: true, message: 'Medicine item deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
