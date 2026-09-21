/**
 * Digital Referral & Care Continuity Controller
 * Directly queries and stores to MongoDB Atlas database.
 */

const QRCode = require('qrcode');
const Referral = require('../models/Referral');

exports.createReferral = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age,
      gender,
      village,
      referringUnit,
      referringStaff = 'staff Worker',
      referredToFacilityId,
      referredToFacilityName,
      referralReason,
      provisionalDiagnosis = 'Under Evaluation',
      priority = 'HIGH_YELLOW',
      vitalsSnapshot = {},
      transportArranged = 'Local Arranged Transport'
    } = req.body;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const referralCode = `GA-REF-${randomNum}`;
    const id = `REF-${new Date().getFullYear()}-${randomNum}`;

    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReferralData = {
      id,
      referralCode,
      patientId: patientId || `PAT-${Date.now()}`,
      patientName: patientName || 'Patient',
      age: Number(age) || 30,
      gender: gender || 'Female',
      village: village || 'Shivpuri',
      referringUnit: referringUnit || 'Village Sub-Centre',
      referringStaff,
      referredToFacilityId,
      referredToFacilityName,
      referralReason: referralReason || 'Clinical referral required',
      provisionalDiagnosis,
      priority,
      status: 'Initiated',
      initiatedAt: new Date(),
      transportArranged,
      vitalsSnapshot,
      doctorHandoffNotes: '',
      timeline: [
        { time: currentTimeStr, stage: 'Referral Initiated & Digital Record Created', by: referringStaff },
        { time: currentTimeStr, stage: `Notification sent to ${referredToFacilityName}`, by: 'Automated Routing' }
      ]
    };

    const qrPayload = JSON.stringify({
      code: referralCode,
      patId: newReferralData.patientId,
      name: patientName,
      priority: priority,
      dest: referredToFacilityName,
      vitals: vitalsSnapshot,
      auth: 'GRAMIN_AROGYA_VERIFIED'
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    });

    const ref = new Referral(newReferralData);
    await ref.save();

    return res.status(201).json({
      success: true,
      message: 'Digital referral record generated and saved to database.',
      referral: ref,
      qrDataUrl
    });
  } catch (error) {
    console.error('Create referral error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const list = await Referral.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReferralByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const ref = await Referral.findOne({
      $or: [
        { referralCode: code.toUpperCase() },
        { referralCode: code },
        { id: code }
      ]
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: `Referral code ${code} not found in database.` });
    }

    const qrPayload = JSON.stringify({
      code: ref.referralCode,
      patId: ref.patientId,
      name: ref.patientName,
      dest: ref.referredToFacilityName,
      auth: 'GRAMIN_AROGYA_VERIFIED'
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: { dark: '#064e3b', light: '#ffffff' }
    });

    return res.json({ success: true, data: ref, qrDataUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorNotes, stageName, staffName = 'Receiving Doctor' } = req.body;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const ref = await Referral.findOne({
      $or: [{ id }, { referralCode: id }, { _id: id }]
    });

    if (!ref) {
      return res.status(404).json({ success: false, message: 'Referral record not found in database' });
    }

    if (status) ref.status = status;
    if (doctorNotes) ref.doctorHandoffNotes = doctorNotes;
    ref.timeline.push({
      time: timeStr,
      stage: stageName || `Status updated to ${status}`,
      by: staffName
    });

    const updated = await ref.save();

    return res.json({ success: true, message: 'Referral status updated in database', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
