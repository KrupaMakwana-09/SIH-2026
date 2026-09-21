const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Inventory = require('../models/Inventory');
const { logAudit } = require('../middleware/authMiddleware');

// 1. Create New Prescription (Doctor Panel)
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      diagnosis,
      diseaseId,
      clinicalNotes,
      medicines = [],
      followUpDate,
      facilityName
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({ success: false, message: 'Clinical diagnosis is required to prescribe medicines.' });
    }

    if (!medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Prescription must contain at least one medicine.' });
    }

    // Find the patient
    let patient = await Patient.findOne({
      $or: [{ id: patientId }, { phone: patientId }]
    });

    if (!patient && patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(patientId);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with ID "${patientId}" does not exist.` });
    }

    const doctorId = req.user?.id || req.body.doctorId || 'DOC-ATTENDING';
    const doctorName = req.user?.name || req.body.doctorName || 'Dr. Attending Physician';
    const facility = facilityName || req.user?.facilityName || 'Primary Health Centre';

    // Format and sanitize medicines
    const formattedMedicines = medicines.map(m => {
      const prescribedQty = Number(m.prescribedQty) || Number(m.quantity) || 10;
      return {
        medicineId: m.medicineId || `MED-${Math.floor(100 + Math.random() * 900)}`,
        medicineName: m.medicineName || m.name || 'Prescribed Medicine',
        genericName: m.genericName || '',
        dosageForm: m.dosageForm || 'Tablet',
        dosage: m.dosage || '1 tab',
        frequency: m.frequency || 'Twice daily',
        duration: m.duration || '5 days',
        instructions: m.instructions || 'After food',
        prescribedQty,
        dispensedQty: 0,
        status: 'Pending',
        batchHistory: []
      };
    });

    const prescriptionId = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const newPrescription = new Prescription({
      prescriptionId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      doctorId,
      doctorName,
      facilityId: req.user?.facilityId || 'FAC-PHC-001',
      facilityName: facility,
      diagnosis: diagnosis.trim(),
      diseaseId: diseaseId || '',
      clinicalNotes: clinicalNotes || '',
      medicines: formattedMedicines,
      status: 'Prescribed',
      prescribedAt: new Date(),
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    await newPrescription.save();

    // Automatically sync clinical visit into Patient's medical history
    const visitEntry = {
      visitDate: new Date(),
      visitType: 'OPD Clinical Consultation',
      facilityName: facility,
      doctorName,
      diagnosis: diagnosis.trim(),
      symptoms: patient.chiefComplaint,
      prescriptions: formattedMedicines.map(m => ({
        medicine: `${m.medicineName} (${m.dosage})`,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions
      })),
      treatments: ['Physical Examination', 'Prescription Formulated'],
      clinicalNotes: clinicalNotes || `Prescription #${prescriptionId} generated.`
    };

    if (!patient.medicalHistory) patient.medicalHistory = [];
    patient.medicalHistory.unshift(visitEntry);

    // Update patient current condition
    patient.currentHealthStatus = {
      condition: 'Under Active Treatment',
      summary: `Consultation with ${doctorName}: Diagnosed with ${diagnosis.trim()}. Prescribed ${formattedMedicines.length} medication(s).`,
      lastEvaluatedAt: new Date()
    };

    // If followUpDate provided, also add follow-up reminder
    if (followUpDate) {
      patient.followUpReminders.unshift({
        dueDate: new Date(followUpDate),
        doctorId,
        doctorName,
        reason: `Follow-up evaluation for ${diagnosis.trim()}`,
        priority: 'NORMAL',
        status: 'PENDING',
        createdAt: new Date()
      });
    }

    await patient.save();

    // Audit log
    await logAudit({
      action: 'PRESCRIPTION_CREATE',
      req,
      patientId: patient.id,
      resource: prescriptionId,
      details: { diagnosis, medicinesCount: formattedMedicines.length },
      status: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: `Prescription #${prescriptionId} created and synced with patient medical history!`,
      prescription: newPrescription,
      patient
    });
  } catch (error) {
    console.error('createPrescription error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Prescriptions (Search / Filter)
exports.getPrescriptions = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const list = await Prescription.find(filter).sort({ prescribedAt: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    console.error('getPrescriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Prescription by ID (with live stock status for each medicine)
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findOne({
      $or: [{ prescriptionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: `Prescription (${id}) not found.` });
    }

    // Check live inventory stock for each prescribed medicine
    const medicineIds = prescription.medicines.map(m => m.medicineId);
    const inventories = await Inventory.find({
      $or: [
        { id: { $in: medicineIds } },
        { name: { $in: prescription.medicines.map(m => m.medicineName) } }
      ]
    });

    const inventoryMap = new Map();
    inventories.forEach(inv => {
      inventoryMap.set(inv.id, inv);
      inventoryMap.set(inv.name.toLowerCase(), inv);
    });

    const enrichedMedicines = prescription.medicines.map(item => {
      const inv = inventoryMap.get(item.medicineId) || inventoryMap.get(item.medicineName.toLowerCase());
      const remainingQty = Math.max(0, item.prescribedQty - item.dispensedQty);
      const isExpired = inv?.expiryDate ? new Date(inv.expiryDate) <= new Date() : false;

      return {
        ...item.toObject(),
        remainingQty,
        availableStock: inv ? inv.stockQty : 0,
        batchNumber: inv ? inv.batchNumber : 'N/A',
        expiryDate: inv ? inv.expiryDate : null,
        isExpired,
        stockStatus: isExpired ? 'Expired' : (inv ? inv.status : 'Out of Stock')
      };
    });

    return res.json({
      success: true,
      prescription: {
        ...prescription.toObject(),
        medicines: enrichedMedicines
      }
    });
  } catch (error) {
    console.error('getPrescriptionById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get all prescriptions for a specific patient
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'doctor';

    // Role-based authorization: Citizen can only view their own prescriptions
    if (userRole === 'citizen') {
      const patient = await Patient.findOne({
        $or: [{ id: id }, { phone: req.user?.phone }]
      });
      const cleanUserPhone = (req.user?.phone || '').replace(/\D/g, '').slice(-10);
      const cleanPatientPhone = (patient?.phone || '').replace(/\D/g, '').slice(-10);
      
      const isOwner = patient && (
        patient.id === id ||
        (cleanUserPhone && cleanPatientPhone && cleanUserPhone === cleanPatientPhone) ||
        (req.user?.name && patient.name && req.user.name.toLowerCase() === patient.name.toLowerCase())
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own prescriptions.'
        });
      }
    }

    const prescriptions = await Prescription.find({ patientId: id }).sort({ prescribedAt: -1 });
    return res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    console.error('getPatientPrescriptions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
