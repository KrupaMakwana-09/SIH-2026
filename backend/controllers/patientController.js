const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Patient = require('../models/Patient');

const Prescription = require('../models/Prescription');

const JWT_SECRET = process.env.JWT_SECRET || 'gramin_arogya_secure_sih_2026_jwt_token_key';

// In-memory OTP store for patient profile verification (10-minute expiry)
const patientOtpStore = new Map(); // userId -> { otp, expiresAt, email }

/**
 * Helper: Decode auth token and return userId + username
 */
const decodeToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const verified = jwt.verify(token, JWT_SECRET);
      if (verified && verified.id) return verified;
    } catch {}
  }
  // Fallback: check custom header or query/body user ID
  const fallbackId = req.headers['x-user-id'] || req.query?.userId || req.body?.userId;
  if (fallbackId) {
    return { id: fallbackId };
  }
  return null;
};

/**
 * GET /api/patient/profile
 * patient fetches their own Patient profile from DB.
 * Returns both User record fields AND Patient clinical record.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Find linked Patient record by phone, name, or id
    const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase()}`;

    const orConditions = [{ id: patId }];
    if (cleanPhone && cleanPhone.length >= 6) {
      orConditions.push({ phone: { $regex: cleanPhone } });
    }
    if (user.name) {
      orConditions.push({ name: user.name });
    }

    let patient = await Patient.findOne({ $or: orConditions });

    if (!patient) {
      // Auto-initialize a linked Patient record for this registered citizen so they immediately have an ID, SSC, ABHA, and QR
      const cleanId = cleanPhone.slice(-6) || user._id.toString().slice(-6).toUpperCase();
      const abhaDigits = cleanPhone.slice(-4) || '1044';
      let computedAge = 28;
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        const today = new Date();
        computedAge = today.getFullYear() - dob.getFullYear();
      }

      patient = new Patient({
        id: patId,
        name: user.name || 'Citizen Patient',
        age: computedAge,
        gender: user.gender || 'Female',
        village: user.village || 'Rural Health Block',
        phone: user.phone || cleanPhone,
        bloodGroup: user.bloodGroup || 'B+',
        emergencyContact: user.emergencyContact || '',
        abhaId: `91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        chiefComplaint: 'Routine Healthcare Continuity',
        riskLevel: 'LOW',
        qrToken: `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`,
        sscCode: `SSC-GJ-2026-${Math.floor(100000 + Math.random() * 900000)}`
      });
      await patient.save();
    } else {
      let needsSave = false;
      if (!patient.qrToken) {
        const cleanId = (patient.id || '').replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
        patient.qrToken = `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`;
        needsSave = true;
      }
      if (!patient.sscCode) {
        patient.sscCode = `SSC-GJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        needsSave = true;
      }
      if (!patient.abhaId) {
        const abhaDigits = (patient.phone || '').slice(-4) || '1044';
        patient.abhaId = `91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        needsSave = true;
      }
      if (!patient.bloodGroup && user.bloodGroup) {
        patient.bloodGroup = user.bloodGroup;
        needsSave = true;
      }
      if (needsSave) {
        await patient.save();
      }
    }

    // Fetch prescriptions for this patient
    let prescriptions = [];
    try {
      prescriptions = await Prescription.find({ patientId: patient.id }).sort({ prescribedAt: -1 });
    } catch (rxErr) {
      console.warn('Prescriptions fetch note in getMyProfile:', rxErr.message);
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        village: user.village,
        designation: user.designation,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        emergencyContact: user.emergencyContact,
        createdAt: user.createdAt
      },
      patient: patient || null,
      prescriptions
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/patient/profile
 * patient updates their own profile — both User fields AND Patient clinical record.
 */
/**
 * POST /api/patient/send-otp
 * Auto-fetch the logged-in patient's email from their User record
 * and send a 6-digit OTP to that email — no manual email entry needed.
 */
exports.sendProfileOtp = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findById(decoded.id).select('email name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.email || !user.email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'No registered email found on your profile. Please contact support or add an email first.'
      });
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    patientOtpStore.set(decoded.id.toString(), { otp, expiresAt, email: normalizedEmail });

    console.log(`\n🔑 ==========================================`);
    console.log(`📧 patient PROFILE OTP for [${normalizedEmail}] (User: ${user.name}): ${otp}`);
    console.log(`⏰ Valid for 10 minutes`);
    console.log(`==========================================\n`);

    // Attempt real email sending if SMTP configured
    let emailSent = false;
    let emailNotice = '';
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"SwasthyaSetu Health Portal" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: '🔐 GraminArogya — Profile Update Verification OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #d1fae5; border-radius: 14px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #064e3b; margin: 0;">🌿 GraminArogya</h2>
                <p style="color: #047857; font-size: 0.88rem; margin: 4px 0 0;">Rural Healthcare & patient Health Records</p>
              </div>
              <p style="color: #374151; font-size: 0.9rem;">Dear <strong>${user.name}</strong>,</p>
              <p style="color: #374151; font-size: 0.9rem;">You requested to update your health profile. Please use the OTP below to verify and save your changes:</p>
              <div style="background: #f0fdf4; border: 1px dashed #10b981; border-radius: 10px; padding: 22px; text-align: center; margin: 22px 0;">
                <p style="color: #374151; font-size: 0.88rem; margin: 0 0 10px;">Your 6-Digit Profile Update OTP:</p>
                <div style="font-size: 2.4rem; font-weight: 900; letter-spacing: 8px; color: #064e3b;">${otp}</div>
                <p style="color: #6b7280; font-size: 0.78rem; margin: 12px 0 0;">Valid for 10 minutes. Do not share this OTP with anyone.</p>
              </div>
              <p style="color: #6b7280; font-size: 0.82rem;">If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <div style="font-size: 0.72rem; color: #9ca3af; text-align: center;">SIH 2026 • Ministry of Health & Family Welfare • GraminArogya Platform</div>
            </div>
          `
        });
        emailSent = true;
        emailNotice = `OTP sent to your registered email: ${normalizedEmail}`;
      } catch (mailErr) {
        console.warn('SMTP error (using dev-OTP fallback):', mailErr.message);
        emailNotice = 'OTP generated. (Check server log or use preview code below for testing.)';
      }
    } else {
      emailNotice = 'OTP generated. (Configure SMTP in .env for real delivery — use preview code below for demo.)';
    }

    return res.json({
      success: true,
      message: emailSent
        ? `OTP sent to your registered email: ${normalizedEmail}`
        : `OTP generated. Check server log or SMTP configuration.`,
      maskedEmail: normalizedEmail.replace(/(.{2}).+(@.+)/, '$1***$2'),
      expiresInMinutes: 10
    });
  } catch (error) {
    console.error('sendProfileOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/patient/verify-otp
 * Verify the OTP that was sent to the patient's registered email.
 */
exports.verifyProfileOtp = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { otp } = req.body;
    if (!otp || otp.toString().trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Please provide a valid OTP code.' });
    }

    const stored = patientOtpStore.get(decoded.id.toString());
    if (!stored) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      patientOtpStore.delete(decoded.id.toString());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
    }

    patientOtpStore.delete(decoded.id.toString());

    return res.json({
      success: true,
      message: 'OTP verified successfully. You may now save your profile changes.'
    });
  } catch (error) {
    console.error('verifyProfileOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      name, email, phone, village,
      dateOfBirth, gender, bloodGroup, emergencyContact,
      // Patient-specific health fields
      vitals, knownAllergies, chronicConditions,
      currentHealthStatus
    } = req.body;

    // Update User record
    const userUpdate = {};
    if (name) userUpdate.name = name.trim();
    if (email !== undefined) userUpdate.email = email.trim();
    if (phone !== undefined) userUpdate.phone = phone.trim();
    if (village !== undefined) userUpdate.village = village.trim();
    if (dateOfBirth !== undefined) userUpdate.dateOfBirth = dateOfBirth;
    if (gender !== undefined) userUpdate.gender = gender;
    if (bloodGroup !== undefined) userUpdate.bloodGroup = bloodGroup.trim();
    if (emergencyContact !== undefined) userUpdate.emergencyContact = emergencyContact.trim();

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: userUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Compute updated age from dateOfBirth
    let computedAge = null;
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      computedAge = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
    }

    // Find + update linked Patient record
    const cleanPhone = (updatedUser.phone || '').replace(/\D/g, '').slice(-10);
    const patId = `PAT-${cleanPhone.slice(-6) || decoded.id.toString().slice(-6).toUpperCase()}`;

    const patOrConditions = [{ id: patId }];
    if (cleanPhone && cleanPhone.length >= 6) {
      patOrConditions.push({ phone: { $regex: cleanPhone } });
    }
    if (updatedUser.name) {
      patOrConditions.push({ name: updatedUser.name });
    }

    let patient = await Patient.findOne({ $or: patOrConditions });

    const patientUpdate = {};
    if (name) patientUpdate.name = name.trim();
    if (village !== undefined) patientUpdate.village = village.trim();
    if (gender !== undefined) patientUpdate.gender = gender;
    if (bloodGroup !== undefined) patientUpdate.bloodGroup = bloodGroup.trim();
    if (emergencyContact !== undefined) patientUpdate.emergencyContact = emergencyContact.trim();
    if (computedAge !== null) patientUpdate.age = computedAge;
    if (vitals) patientUpdate.vitals = vitals;
    if (knownAllergies !== undefined) patientUpdate.knownAllergies = knownAllergies;
    if (chronicConditions !== undefined) patientUpdate.chronicConditions = chronicConditions;
    if (currentHealthStatus) patientUpdate.currentHealthStatus = {
      ...currentHealthStatus,
      lastEvaluatedAt: new Date()
    };

    if (patient) {
      patient = await Patient.findByIdAndUpdate(
        patient._id,
        { $set: patientUpdate },
        { new: true }
      );
    } else if (cleanPhone) {
      // Create a new Patient record if none exists yet
      const abhaDigits = cleanPhone.slice(-4) || '0000';
      patient = new Patient({
        id: patId,
        name: updatedUser.name,
        age: computedAge || 25,
        gender: gender || 'Not Specified',
        village: village || updatedUser.village || '',
        phone: cleanPhone,
        abhaId: `ABHA-91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        guardianName: emergencyContact ? `Emergency: ${emergencyContact}` : 'Self',
        chiefComplaint: 'patient Health Record',
        symptomTags: ['General Health', 'Preventive Care'],
        vitals: vitals || { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
        currentHealthStatus: currentHealthStatus || { condition: 'Healthy', summary: '', lastEvaluatedAt: new Date() },
        riskLevel: 'LOW',
        triageCategory: 'GREEN_ROUTINE',
        bloodGroup: bloodGroup || '',
        emergencyContact: emergencyContact || '',
        knownAllergies: knownAllergies || [],
        chronicConditions: chronicConditions || [],
        medicalHistory: [],
        accessLogs: [],
        followUpReminders: [],
        registrationDate: new Date()
      });
      await patient.save();
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully in database!',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        email: updatedUser.email,
        village: updatedUser.village,
        designation: updatedUser.designation,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        bloodGroup: updatedUser.bloodGroup,
        emergencyContact: updatedUser.emergencyContact
      },
      patient: patient || null
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Phone/Email';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already associated with another registered account.`
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

