const Disease = require('../models/Disease');
const DiseaseMedicine = require('../models/DiseaseMedicine');
const Inventory = require('../models/Inventory');

// 1. Get list of all diseases
exports.getDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find({ status: 'Active' }).sort({ diseaseName: 1 });
    return res.json({ success: true, count: diseases.length, data: diseases });
  } catch (error) {
    console.error('getDiseases error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get related medicines for a given disease
exports.getDiseaseMedicines = async (req, res) => {
  try {
    const { id } = req.params; // diseaseId or diseaseName
    const query = [
      { diseaseId: id },
      { diseaseName: new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    ];

    const relations = await DiseaseMedicine.find({
      $or: query,
      status: 'Active'
    }).sort({ isFirstLine: -1, medicineName: 1 });

    // Enhance each relation with current live stock info from Inventory
    const medicineIds = relations.map(r => r.medicineId);
    const inventories = await Inventory.find({
      $or: [
        { id: { $in: medicineIds } },
        { name: { $in: relations.map(r => r.medicineName) } }
      ]
    });

    const inventoryMap = new Map();
    inventories.forEach(inv => {
      inventoryMap.set(inv.id, inv);
      inventoryMap.set(inv.name.toLowerCase(), inv);
    });

    const enrichedMedicines = relations.map(rel => {
      const inv = inventoryMap.get(rel.medicineId) || inventoryMap.get(rel.medicineName.toLowerCase());
      return {
        diseaseId: rel.diseaseId,
        diseaseName: rel.diseaseName,
        medicineId: rel.medicineId,
        medicineName: rel.medicineName,
        dosageForm: rel.dosageForm || inv?.dosageForm || 'Tablet',
        standardDosage: rel.standardDosage || '500mg',
        standardFrequency: rel.standardFrequency || 'Twice daily',
        standardDuration: rel.standardDuration || '5 days',
        instructions: rel.instructions || 'After food',
        isFirstLine: rel.isFirstLine,
        notes: rel.notes,
        // Live inventory status
        availableStock: inv ? inv.stockQty : 0,
        stockStatus: inv ? inv.status : 'Out of Stock',
        batchNumber: inv ? inv.batchNumber : 'N/A',
        expiryDate: inv ? inv.expiryDate : null,
        unit: inv ? inv.unit : 'Strips'
      };
    });

    return res.json({
      success: true,
      count: enrichedMedicines.length,
      diseaseId: id,
      data: enrichedMedicines
    });
  } catch (error) {
    console.error('getDiseaseMedicines error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create a new disease entry
exports.createDisease = async (req, res) => {
  try {
    const { diseaseName, category, description, symptoms, icdCode, severityDefault } = req.body;
    if (!diseaseName) {
      return res.status(400).json({ success: false, message: 'Disease name is required.' });
    }

    const diseaseId = `DIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const disease = new Disease({
      diseaseId,
      diseaseName: diseaseName.trim(),
      category: category || 'General Infectious',
      description: description || '',
      symptoms: Array.isArray(symptoms) ? symptoms : (symptoms ? [symptoms] : []),
      icdCode: icdCode || '',
      severityDefault: severityDefault || 'Moderate'
    });

    await disease.save();
    return res.status(201).json({ success: true, message: 'Disease added successfully', data: disease });
  } catch (error) {
    console.error('createDisease error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Link a medicine to a disease
exports.linkDiseaseMedicine = async (req, res) => {
  try {
    const { id } = req.params; // diseaseId
    const {
      medicineId,
      medicineName,
      dosageForm,
      standardDosage,
      standardFrequency,
      standardDuration,
      instructions,
      isFirstLine,
      notes
    } = req.body;

    if (!medicineId || !medicineName) {
      return res.status(400).json({ success: false, message: 'Medicine ID and Medicine Name are required.' });
    }

    const disease = await Disease.findOne({ diseaseId: id });
    const diseaseName = disease ? disease.diseaseName : id;

    const link = await DiseaseMedicine.findOneAndUpdate(
      { diseaseId: id, medicineId },
      {
        $set: {
          diseaseName,
          medicineName,
          dosageForm: dosageForm || 'Tablet',
          standardDosage: standardDosage || '500mg',
          standardFrequency: standardFrequency || 'Twice daily',
          standardDuration: standardDuration || '5 days',
          instructions: instructions || 'After food',
          isFirstLine: isFirstLine !== undefined ? isFirstLine : true,
          notes: notes || 'Standard clinical recommendation',
          status: 'Active'
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'Medicine linked to disease', data: link });
  } catch (error) {
    console.error('linkDiseaseMedicine error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
