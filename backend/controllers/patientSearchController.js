const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const Referral = require('../models/Referral');
const { logAudit } = require('../middleware/authMiddleware');

// Helper to normalize phone number to last 10 digits
function normalizePhone(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Mask phone for safe multiple selection lists (e.g., +91 ••••• •1234)
function maskPhone(phone) {
  if (!phone) return '—';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 4) return phone;
  const last4 = clean.slice(-4);
  return `+91 ••••• •${last4}`;
}

// Mask SSC code for display (e.g., SSC-••-••••-9812)
function maskSsc(ssc) {
  if (!ssc) return '—';
  const parts = String(ssc).split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-••-••••-${parts[parts.length - 1]}`;
  }
  return ssc.length > 4 ? `•••-${ssc.slice(-4)}` : ssc;
}

// Format patient response based on user role for data privacy
function formatPatientForRole(patient, role) {
  if (!patient) return null;

  if (role === 'pharmacist') {
    // Pharmacist gets only prescription-relevant details
    return {
      _id: patient._id,
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      village: patient.village,
      sscCode: patient.sscCode,
      maskedSsc: maskSsc(patient.sscCode),
      bloodGroup: patient.bloodGroup,
      knownAllergies: patient.knownAllergies || [],
      currentCondition: patient.currentHealthStatus?.condition || 'Stable'
    };
  }

  // Doctor / Admin / ASHA gets complete clinical profile
  return patient;
}

// 1. Search by Mobile Number
exports.searchByMobile = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile number to search.' });
    }

    const clean10 = normalizePhone(phone);
    if (!clean10 || clean10.length < 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid mobile number (at least 6-10 digits).' });
    }

    const regex = new RegExp(clean10);
    const patients = await Patient.find({
      $or: [
        { phone: { $regex: regex } },
        { ashaWorkerContact: { $regex: regex } },
        { emergencyContact: { $regex: regex } }
      ]
    }).sort({ createdAt: -1 });

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'Mobile Search',
      details: { query: clean10, matchesCount: patients.length },
      status: patients.length > 0 ? 'SUCCESS' : 'FAILURE'
    });

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No records linked to mobile number "${phone}".`
      });
    }

    const userRole = req.user?.role || 'doctor';

    // Multiple records with same mobile number: return safe selection list
    if (patients.length > 1) {
      const safeList = patients.map(p => ({
        id: p.id,
        _id: p._id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        village: p.village,
        maskedPhone: maskPhone(p.phone),
        maskedSsc: maskSsc(p.sscCode),
        chiefComplaint: p.chiefComplaint,
        registrationDate: p.registrationDate
      }));

      return res.json({
        success: true,
        multiple: true,
        count: patients.length,
        message: `Multiple patients found with this mobile number. Please select the correct patient.`,
        patients: safeList
      });
    }

    // Exactly one patient found
    const single = patients[0];
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: single.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      multiple: false,
      count: 1,
      patient: formatPatientForRole(single, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchByMobile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Search by SSC / Social Security Card Code
exports.searchBySsc = async (req, res) => {
  try {
    const { sscCode } = req.body;
    if (!sscCode || !sscCode.trim()) {
      return res.status(400).json({ success: false, message: 'SSC Code is required.' });
    }

    const cleanSsc = sscCode.trim();
    const regex = new RegExp(`^${cleanSsc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const patient = await Patient.findOne({
      $or: [{ sscCode: regex }, { sscCode: cleanSsc }]
    });

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'SSC Search',
      details: { sscCode: cleanSsc },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No record matches SSC Code "${cleanSsc}".`
      });
    }

    const userRole = req.user?.role || 'doctor';
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchBySsc error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Search by Patient ID / Client ID
exports.searchByClient = async (req, res) => {
  try {
    const { clientId, patientId } = req.body;
    const queryId = (clientId || patientId || '').trim();

    if (!queryId) {
      return res.status(400).json({ success: false, message: 'Patient ID / Client ID is required.' });
    }

    const escaped = queryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}$`, 'i');

    let patient = await Patient.findOne({
      $or: [{ id: regex }, { id: queryId }, { abhaId: regex }]
    });

    if (!patient && queryId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(queryId);
    }

    await logAudit({
      action: 'PATIENT_LOOKUP',
      req,
      resource: 'Client ID Search',
      details: { queryId },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found. No record matches Patient ID "${queryId}".`
      });
    }

    const userRole = req.user?.role || 'doctor';
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note:', rxErr.message);
    }

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('searchByClient error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Secure Patient QR Code Lookup
exports.lookupByQr = async (req, res) => {
  try {
    const { qrData, qrToken, patientId } = req.body;
    let targetToken = qrToken || '';
    let targetPatientId = patientId || '';
    let targetSsc = '';
    let targetPhone = '';
    let targetAbha = '';

    if (!targetToken && !targetPatientId && qrData) {
      // Try parsing JSON QR string
      try {
        const parsed = typeof qrData === 'object' ? qrData : JSON.parse(qrData);
        targetToken = parsed.qrToken || parsed.secureToken || parsed.token || '';
        targetPatientId = parsed.patientId || parsed.id || '';
        targetSsc = parsed.sscCode || parsed.ssc || '';
        targetPhone = parsed.phone || parsed.mobile || '';
        targetAbha = parsed.abhaId || '';
      } catch {
        // Plain text token or patient ID passed in qrData
        if (typeof qrData === 'string') {
          if (qrData.startsWith('SEC-QR-')) {
            targetToken = qrData.trim();
          } else {
            targetPatientId = qrData.trim();
          }
        }
      }
    }

    if (!targetToken && !targetPatientId && !targetSsc && !targetPhone && !targetAbha) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code. Safe patient token or identifier is missing.'
      });
    }

    const orConditions = [];
    if (targetToken) {
      orConditions.push({ qrToken: targetToken });
    }
    if (targetPatientId) {
      orConditions.push({ id: targetPatientId });
      if (targetPatientId.match(/^[0-9a-fA-F]{24}$/)) {
        orConditions.push({ _id: targetPatientId });
      }
    }
    if (targetSsc) {
      orConditions.push({ sscCode: targetSsc });
    }
    if (targetPhone) {
      orConditions.push({ phone: targetPhone });
    }
    if (targetAbha) {
      orConditions.push({ abhaId: targetAbha });
    }

    const patient = await Patient.findOne({ $or: orConditions });

    await logAudit({
      action: 'QR_LOOKUP',
      req,
      resource: 'Patient QR Lookup',
      patientId: patient?.id || targetPatientId,
      details: { qrToken: targetToken ? 'PROVIDED' : 'NONE' },
      status: patient ? 'SUCCESS' : 'FAILURE'
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or invalid QR code.'
      });
    }

    const userRole = req.user?.role || 'doctor';

    // Fetch prescriptions for authorized roles
    let activePrescriptions = [];
    try {
      activePrescriptions = await Prescription.find({
        patientId: patient.id,
        ...(userRole === 'pharmacist' ? { status: { $in: ['Prescribed', 'Partially Dispensed'] } } : {})
      }).sort({ prescribedAt: -1 }).limit(10);
    } catch (rxErr) {
      console.warn('activePrescriptions fetch note in lookupByQr:', rxErr.message);
    }

    return res.json({
      success: true,
      message: `Patient QR verified successfully for ${patient.name}`,
      patient: formatPatientForRole(patient, userRole),
      activePrescriptions
    });
  } catch (error) {
    console.error('lookupByQr error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Unified Patient Profile & History (Role-Authorized)
exports.getUnifiedPatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || 'doctor';
    const userId = req.user?.id;

    let patient = await Patient.findOne({
      $or: [{ id: id }, { phone: id }]
    });

    if (!patient && id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(id);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient (${id}) not found.` });
    }

    // Role-based authorization: Citizen can only view their own record
    if (userRole === 'citizen') {
      const userPhone = normalizePhone(req.user?.phone);
      const patientPhone = normalizePhone(patient.phone);
      if (userPhone && patientPhone && userPhone !== patientPhone && req.user?.name !== patient.name) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own health records.'
        });
      }
    }

    // Log patient record access
    await logAudit({
      action: 'PATIENT_RECORD_ACCESS',
      req,
      patientId: patient.id,
      resource: 'Unified Profile View',
      status: 'SUCCESS'
    });

    // Fetch related prescriptions and referrals
    const [prescriptions, referrals] = await Promise.all([
      Prescription.find({ patientId: patient.id }).sort({ prescribedAt: -1 }),
      Referral.find({ patientId: patient.id }).sort({ createdAt: -1 })
    ]);

    return res.json({
      success: true,
      patient: formatPatientForRole(patient, userRole),
      prescriptions,
      referrals
    });
  } catch (error) {
    console.error('getUnifiedPatientProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
