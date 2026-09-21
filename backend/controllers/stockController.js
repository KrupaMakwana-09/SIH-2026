const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const MedicineDispensing = require('../models/MedicineDispensing');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const { logAudit } = require('../middleware/authMiddleware');

function getSafeQuery(id) {
  if (!id) return { id: 'invalid' };
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
    return { $or: [{ _id: id }, { id: id }] };
  }
  return { id: id };
}

// 1. Get Medicine Inventory (Calculated Real Statuses)
exports.getInventory = async (req, res) => {
  try {
    const list = await Inventory.find().sort({ status: 1, name: 1 });
    const now = new Date();

    // Dynamically ensure status accuracy for any modified records
    const enriched = list.map(med => {
      let calcStatus = 'In Stock';
      if (med.expiryDate && new Date(med.expiryDate) <= now) {
        calcStatus = 'Expired';
      } else if (med.stockQty <= 0) {
        calcStatus = 'Out of Stock';
      } else if (med.stockQty <= med.minThreshold) {
        calcStatus = 'Low Stock';
      }
      return {
        ...med.toObject(),
        status: calcStatus
      };
    });

    return res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('getInventory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Stock IN (New Supplies Arrival)
exports.stockIn = async (req, res) => {
  try {
    const {
      medicineId,
      name,
      genericName,
      category,
      batchNumber,
      quantity,
      expiryDate,
      supplier,
      minThreshold,
      dosageForm,
      strength,
      unit,
      facilityId,
      facilityName
    } = req.body;

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Stock IN quantity must be a positive number.' });
    }

    if (!batchNumber || !batchNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Batch number is required for Stock IN.' });
    }

    // Find medicine or create if new
    let med = null;
    if (medicineId) {
      med = await Inventory.findOne(getSafeQuery(medicineId));
    }
    if (!med && name) {
      med = await Inventory.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    }

    const previousQty = med ? med.stockQty : 0;
    const newQty = previousQty + qty;
    const now = new Date();
    const expDate = expiryDate ? new Date(expiryDate) : (med?.expiryDate || new Date(now.getFullYear() + 2, now.getMonth()));

    let status = 'In Stock';
    if (expDate <= now) status = 'Expired';
    else if (newQty <= 0) status = 'Out of Stock';
    else if (newQty <= (minThreshold || med?.minThreshold || 50)) status = 'Low Stock';

    if (med) {
      med.stockQty = newQty;
      med.batchNumber = batchNumber.trim();
      med.expiryDate = expDate;
      med.status = status;
      if (genericName) med.genericName = genericName;
      if (dosageForm) med.dosageForm = dosageForm;
      if (strength) med.strength = strength;
      if (minThreshold) med.minThreshold = Number(minThreshold);
      await med.save();
    } else {
      const generatedId = `MED-${Math.floor(100 + Math.random() * 900)}`;
      med = new Inventory({
        id: generatedId,
        name: name.trim(),
        genericName: genericName || '',
        category: category || 'General Medicine',
        dosageForm: dosageForm || 'Tablet',
        strength: strength || '',
        manufacturer: supplier || 'National Medical Depot',
        batchNumber: batchNumber.trim(),
        expiryDate: expDate,
        facilityId: facilityId || 'FAC-PHC-001',
        facilityName: facilityName || 'Primary Health Centre',
        stockQty: newQty,
        minThreshold: Number(minThreshold) || 50,
        status,
        unit: unit || 'Strips'
      });
      await med.save();
    }

    // Create Stock Transaction (IN)
    const transactionId = `TXN-IN-${Math.floor(100000 + Math.random() * 900000)}`;
    const txn = new StockTransaction({
      transactionId,
      type: 'IN',
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: batchNumber.trim(),
      quantity: qty,
      previousQty,
      newQty,
      expiryDate: expDate,
      supplier: supplier || 'Central Medical Stores Depot',
      userId: req.user?.id || 'pharmacist',
      userName: req.user?.name || 'Authorized Pharmacist',
      userRole: req.user?.role || 'pharmacist',
      facilityId: med.facilityId,
      facilityName: med.facilityName,
      timestamp: new Date()
    });
    await txn.save();

    await logAudit({
      action: 'STOCK_IN',
      req,
      resource: med.id,
      details: { quantity: qty, batch: batchNumber, previousQty, newQty },
      status: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: `Successfully received +${qty} units into stock for ${med.name}.`,
      medicine: med,
      transaction: txn
    });
  } catch (error) {
    console.error('stockIn error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Stock Adjustment (Corrections / Audit adjustments)
exports.stockAdjustment = async (req, res) => {
  try {
    const { medicineId, newQuantity, reason, batchNumber } = req.body;

    if (newQuantity === undefined || Number(newQuantity) < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative new quantity is required.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Audit reason is required for stock adjustment.' });
    }

    const med = await Inventory.findOne(getSafeQuery(medicineId));
    if (!med) {
      return res.status(404).json({ success: false, message: `Medicine (${medicineId}) not found.` });
    }

    const previousQty = med.stockQty;
    const targetQty = Number(newQuantity);
    const diff = targetQty - previousQty;

    med.stockQty = targetQty;
    if (batchNumber) med.batchNumber = batchNumber.trim();

    const now = new Date();
    if (med.expiryDate && new Date(med.expiryDate) <= now) {
      med.status = 'Expired';
    } else if (med.stockQty <= 0) {
      med.status = 'Out of Stock';
    } else if (med.stockQty <= med.minThreshold) {
      med.status = 'Low Stock';
    } else {
      med.status = 'In Stock';
    }
    await med.save();

    // Create Stock Transaction (ADJUSTMENT)
    const transactionId = `TXN-ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
    const txn = new StockTransaction({
      transactionId,
      type: 'ADJUSTMENT',
      medicineId: med.id,
      medicineName: med.name,
      batchNumber: med.batchNumber,
      quantity: Math.abs(diff),
      previousQty,
      newQty: targetQty,
      expiryDate: med.expiryDate,
      reason: reason.trim(),
      userId: req.user?.id || 'admin',
      userName: req.user?.name || 'Authorized User',
      userRole: req.user?.role || 'admin',
      timestamp: new Date()
    });
    await txn.save();

    await logAudit({
      action: 'STOCK_ADJUSTMENT',
      req,
      resource: med.id,
      details: { previousQty, newQty: targetQty, reason },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: `Stock quantity adjusted from ${previousQty} to ${targetQty} for ${med.name}.`,
      medicine: med,
      transaction: txn
    });
  } catch (error) {
    console.error('stockAdjustment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Dispense Prescription Medicines (Complete Flow with Atomic Concurrency Safety)
exports.dispensePrescription = async (req, res) => {
  try {
    const { id } = req.params; // prescriptionId
    const { items = [], notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify items and quantities to dispense.' });
    }

    const prescription = await Prescription.findOne({
      $or: [{ prescriptionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    if (prescription.status === 'Fully Dispensed') {
      return res.status(400).json({ success: false, message: 'Prescription has already been fully dispensed.' });
    }

    if (prescription.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot dispense a cancelled prescription.' });
    }

    const now = new Date();
    const pharmacistName = req.user?.name || 'Pharmacist In-charge';
    const pharmacistId = req.user?.id || 'pharmacist-current';

    // Step 1: Pre-validation of all items (Check Expiry & Stock Availability)
    const inventoryUpdates = [];

    for (const dispItem of items) {
      const qtyToDispense = Number(dispItem.quantity);
      if (qtyToDispense <= 0) continue;

      const medRecord = await Inventory.findOne({
        $or: [
          { id: dispItem.medicineId },
          { name: new RegExp(`^${(dispItem.medicineName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        ]
      });

      if (!medRecord) {
        return res.status(404).json({
          success: false,
          message: `Medicine "${dispItem.medicineName || dispItem.medicineId}" is not cataloged in inventory.`
        });
      }

      // Check Expiry Date
      if (medRecord.expiryDate && new Date(medRecord.expiryDate) <= now) {
        return res.status(400).json({
          success: false,
          message: `Medicine "${medRecord.name}" (Batch ${medRecord.batchNumber}) has EXPIRED on ${new Date(medRecord.expiryDate).toLocaleDateString('en-IN')}. Dispensing is prohibited!`
        });
      }

      // Check Stock Availability
      if (medRecord.stockQty < qtyToDispense) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock available for "${medRecord.name}". Requested: ${qtyToDispense}, Available: ${medRecord.stockQty}.`
        });
      }

      // Verify not exceeding remaining prescribed quantity
      const rxMed = prescription.medicines.find(m =>
        m.medicineId === dispItem.medicineId || m.medicineName.toLowerCase() === (dispItem.medicineName || '').toLowerCase()
      );

      if (rxMed) {
        const remaining = Math.max(0, rxMed.prescribedQty - rxMed.dispensedQty);
        if (qtyToDispense > remaining) {
          return res.status(400).json({
            success: false,
            message: `Dispense quantity (${qtyToDispense}) exceeds remaining prescribed quantity (${remaining}) for "${rxMed.medicineName}".`
          });
        }
      }

      inventoryUpdates.push({
        medRecord,
        qtyToDispense,
        dispItem,
        rxMed
      });
    }

    if (inventoryUpdates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid dispensing quantities provided.' });
    }

    // Step 2: Atomic Deduction & Transaction Creation
    const dispensedRecords = [];
    const transactionRecords = [];

    for (const update of inventoryUpdates) {
      const { medRecord, qtyToDispense, rxMed } = update;

      // Atomic deduction: { stockQty: { $gte: qtyToDispense } } guarantees stock NEVER drops below zero
      const updatedInv = await Inventory.findOneAndUpdate(
        { _id: medRecord._id, stockQty: { $gte: qtyToDispense } },
        { $inc: { stockQty: -qtyToDispense } },
        { new: true }
      );

      if (!updatedInv) {
        throw new Error(`Concurrency conflict: Stock for "${medRecord.name}" was modified concurrently. Please retry.`);
      }

      // Re-evaluate stock status post-deduction
      if (updatedInv.stockQty <= 0) {
        updatedInv.status = 'Out of Stock';
      } else if (updatedInv.stockQty <= updatedInv.minThreshold) {
        updatedInv.status = 'Low Stock';
      }
      await updatedInv.save();

      // Create Stock Transaction (OUT)
      const txn = new StockTransaction({
        transactionId: `TXN-OUT-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'OUT',
        medicineId: updatedInv.id,
        medicineName: updatedInv.name,
        batchNumber: updatedInv.batchNumber,
        quantity: qtyToDispense,
        previousQty: updatedInv.stockQty + qtyToDispense,
        newQty: updatedInv.stockQty,
        expiryDate: updatedInv.expiryDate,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        prescriptionId: prescription.prescriptionId,
        dispensedBy: pharmacistName,
        userId: pharmacistId,
        userName: pharmacistName,
        userRole: 'pharmacist',
        facilityId: updatedInv.facilityId,
        facilityName: updatedInv.facilityName,
        timestamp: new Date()
      });
      await txn.save();
      transactionRecords.push(txn);

      // Record for Dispensing Log
      dispensedRecords.push({
        medicineId: updatedInv.id,
        medicineName: updatedInv.name,
        genericName: updatedInv.genericName,
        batchNumber: updatedInv.batchNumber,
        quantity: qtyToDispense,
        dosage: rxMed?.dosage || '',
        frequency: rxMed?.frequency || '',
        duration: rxMed?.duration || '',
        instructions: rxMed?.instructions || ''
      });

      // Update item in prescription
      if (rxMed) {
        rxMed.dispensedQty += qtyToDispense;
        if (rxMed.dispensedQty >= rxMed.prescribedQty) {
          rxMed.status = 'Fully Dispensed';
        } else {
          rxMed.status = 'Partially Dispensed';
        }
        rxMed.batchHistory.push({
          batchNumber: updatedInv.batchNumber,
          quantity: qtyToDispense,
          dispensedAt: new Date(),
          dispensedBy: pharmacistName
        });
      }
    }

    // Step 3: Compute Overall Prescription Status (Partial vs Fully Dispensed)
    const allFullyDispensed = prescription.medicines.every(m => m.dispensedQty >= m.prescribedQty);
    const anyDispensed = prescription.medicines.some(m => m.dispensedQty > 0);

    if (allFullyDispensed) {
      prescription.status = 'Fully Dispensed';
    } else if (anyDispensed) {
      prescription.status = 'Partially Dispensed';
    }

    await prescription.save();

    // Step 4: Create Master MedicineDispensing Record
    const dispenseLog = new MedicineDispensing({
      dispenseId: `DISP-${Math.floor(100000 + Math.random() * 900000)}`,
      prescriptionId: prescription.prescriptionId,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      patientPhone: prescription.patientPhone,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      diagnosis: prescription.diagnosis,
      dispensedBy: pharmacistName,
      dispensedByUserId: pharmacistId,
      facilityId: prescription.facilityId,
      facilityName: prescription.facilityName,
      items: dispensedRecords,
      dispensedAt: new Date(),
      notes: notes || 'Prescription medicines verified and dispensed'
    });
    await dispenseLog.save();

    // Step 5: Audit Log
    await logAudit({
      action: 'MEDICINE_DISPENSE',
      req,
      patientId: prescription.patientId,
      resource: prescription.prescriptionId,
      details: {
        dispenseId: dispenseLog.dispenseId,
        itemsCount: dispensedRecords.length,
        prescriptionStatus: prescription.status
      },
      status: 'SUCCESS'
    });

    return res.json({
      success: true,
      message: prescription.status === 'Fully Dispensed'
        ? `Prescription #${prescription.prescriptionId} has been FULLY DISPENSED! Stock updated.`
        : `Prescription #${prescription.prescriptionId} PARTIALLY DISPENSED. Stock updated.`,
      prescription,
      dispenseLog,
      transactions: transactionRecords
    });
  } catch (error) {
    console.error('dispensePrescription error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Stock Dashboard Metrics (Dashboard Cards)
exports.getStockDashboardMetrics = async (req, res) => {
  try {
    const list = await Inventory.find();
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalMedicines = list.length;
    let totalStockQty = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    list.forEach(med => {
      totalStockQty += (med.stockQty || 0);

      const isExpired = med.expiryDate && new Date(med.expiryDate) <= now;
      const isExpiringSoon = med.expiryDate && new Date(med.expiryDate) > now && new Date(med.expiryDate) <= thirtyDaysAhead;

      if (isExpired) {
        expiredCount++;
      } else if (med.stockQty <= 0) {
        outOfStockCount++;
      } else if (med.stockQty <= med.minThreshold) {
        lowStockCount++;
      }

      if (isExpiringSoon) {
        expiringSoonCount++;
      }
    });

    // Today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayDispensing, todayTxnIn, todayTxnOut] = await Promise.all([
      MedicineDispensing.countDocuments({ dispensedAt: { $gte: startOfToday } }),
      StockTransaction.aggregate([
        { $match: { type: 'IN', timestamp: { $gte: startOfToday } } },
        { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
      ]),
      StockTransaction.aggregate([
        { $match: { type: 'OUT', timestamp: { $gte: startOfToday } } },
        { $group: { _id: null, totalQty: { $sum: '$quantity' }, count: { $sum: 1 } } }
      ])
    ]);

    return res.json({
      success: true,
      metrics: {
        totalMedicines,
        totalStockQty,
        lowStockCount,
        outOfStockCount,
        expiringSoonCount,
        expiredCount,
        todayDispensingCount: todayDispensing,
        todayStockInUnits: todayTxnIn[0]?.totalQty || 0,
        todayStockInCount: todayTxnIn[0]?.count || 0,
        todayStockOutUnits: todayTxnOut[0]?.totalQty || 0,
        todayStockOutCount: todayTxnOut[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('getStockDashboardMetrics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Stock Transaction History (Audit Trail)
exports.getStockTransactions = async (req, res) => {
  try {
    const { type, medicineId, limit = 100 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (medicineId) filter.medicineId = medicineId;

    const list = await StockTransaction.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('getStockTransactions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Get Medicine Usage & Dispensing History
exports.getMedicineUsage = async (req, res) => {
  try {
    const { patientId, doctorId, limit = 100 } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;

    const list = await MedicineDispensing.find(filter)
      .sort({ dispensedAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('getMedicineUsage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
