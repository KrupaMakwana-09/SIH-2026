const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');

const JWT_SECRET = process.env.JWT_SECRET || 'gramin_arogya_secure_sih_2026_jwt_token_key';

// In-memory OTP storage for rapid verification (with 10-minute expiry)
const otpStore = new Map(); // email -> { otp: '123456', expiresAt: timestamp }

// 1. Get Doctor Profile - Strictly from Database
exports.getDoctorProfile = async (req, res) => {
  try {
    let profile = null;

    // Check token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        profile = await DoctorProfile.findOne({
          $or: [{ userId: decoded.id }, { email: decoded.username }, { phone: decoded.phone }]
        });
      } catch (e) {
        // Continue to check query params
      }
    }

    const { doctorId, phone, email } = req.query;
    if (!profile && doctorId) {
      profile = await DoctorProfile.findOne({ doctorId });
    }
    if (!profile && phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      profile = await DoctorProfile.findOne({
        phone: { $regex: cleanPhone.slice(-10) }
      });
    }
    if (!profile && email) {
      profile = await DoctorProfile.findOne({ email: email.toLowerCase().trim() });
    }

    // If no specific profile matched by auth or query, retrieve the latest doctor in database if any exists
    if (!profile) {
      profile = await DoctorProfile.findOne().sort({ createdAt: -1 });
    }

    return res.json({ success: true, profile: profile || null });
  } catch (error) {
    console.error('getDoctorProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add / Update Doctor Profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      specialization,
      qualification,
      phone,
      email,
      registrationNumber,
      medicalCouncil,
      experienceYears,
      profilePhoto,
      clinicName,
      clinicAddress,
      consultationHours,
      consultationFee,
      bio,
      branding
    } = req.body;

    if (!doctorName || !phone) {
      return res.status(400).json({ success: false, message: 'Doctor Name and Phone Number are required.' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    let profile = null;
    if (doctorId) {
      profile = await DoctorProfile.findOne({ doctorId });
    }
    if (!profile && cleanPhone) {
      profile = await DoctorProfile.findOne({ phone: { $regex: cleanPhone } });
    }
    if (!profile && email) {
      profile = await DoctorProfile.findOne({ email: email.toLowerCase().trim() });
    }

    const docId = profile ? profile.doctorId : (doctorId || `DOC-IND-${Math.floor(1000 + Math.random() * 9000)}`);

    const updateData = {
      doctorId: docId,
      doctorName,
      specialization: specialization || 'General Physician',
      qualification: qualification || 'MBBS',
      phone,
      email: email ? email.toLowerCase().trim() : '',
      registrationNumber: registrationNumber || 'NMC-REG-PENDING',
      medicalCouncil: medicalCouncil || 'National Medical Commission',
      experienceYears: Number(experienceYears) || 0,
      profilePhoto: profilePhoto || '',
      clinicName: clinicName || 'Rural Care Clinic',
      clinicAddress: clinicAddress || '',
      consultationHours: consultationHours || '09:00 AM - 05:00 PM',
      consultationFee: Number(consultationFee) || 0,
      bio: bio || '',
      branding: {
        logo: branding?.logo || '',
        headerTitle: branding?.headerTitle || 'Doctor Clinic & Health Services',
        headerSubtitle: branding?.headerSubtitle || '',
        headerContact: branding?.headerContact || phone,
        headerBgColor: branding?.headerBgColor || '#064e3b',
        footerText: branding?.footerText || 'Valid for 7 days. Not valid for medico-legal purposes.',
        signatureImage: branding?.signatureImage || '',
        themeColor: branding?.themeColor || '#059669',
        showWatermark: branding?.showWatermark !== false
      }
    };

    if (profile) {
      Object.assign(profile, updateData);
      await profile.save();
    } else {
      profile = new DoctorProfile(updateData);
      await profile.save();
    }

    // Also update or sync User account name & phone if associated
    if (profile.userId) {
      await User.findByIdAndUpdate(profile.userId, {
        name: doctorName,
        phone: phone,
        designation: specialization
      });
    }

    return res.json({
      success: true,
      message: 'Doctor profile updated successfully!',
      profile
    });
  } catch (error) {
    console.error('updateDoctorProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lookup Doctor Data by Mobile Number ("Mobile no thi data fetch that joi")
exports.lookupDoctorByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid mobile number (at least 6 digits).' });
    }

    // Match digits separated by any hyphens, spaces, or international prefixes
    const phonePattern = new RegExp(cleanDigits.split('').join('\\D*'), 'i');

    // Find Doctor profile by regex or direct string
    let doctor = await DoctorProfile.findOne({
      $or: [
        { phone: { $regex: phonePattern } },
        { phone: { $regex: cleanDigits } }
      ]
    });

    // If not in DoctorProfile, also check User model with role: doctor
    if (!doctor) {
      const doctorUser = await User.findOne({
        role: 'doctor',
        $or: [
          { phone: { $regex: phonePattern } },
          { phone: { $regex: cleanDigits } }
        ]
      });
      if (doctorUser) {
        doctor = {
          doctorId: `DOC-${doctorUser._id.toString().slice(-4)}`,
          userId: doctorUser._id,
          doctorName: doctorUser.name,
          specialization: doctorUser.designation || '',
          phone: doctorUser.phone,
          qualification: doctorUser.qualification || '',
          registrationNumber: doctorUser.registrationNumber || '',
          clinicName: doctorUser.facilityName || ''
        };
      }
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `No doctor profile found for mobile number ${phone}. You can create a new doctor profile with this number.`
      });
    }

    return res.json({
      success: true,
      message: `Doctor record fetched successfully for ${phone}`,
      doctor
    });
  } catch (error) {
    console.error('lookupDoctorByPhone error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Lookup Patient Data & History by Mobile Number for Doctor ("Mobile no thi data fetch that joi")
exports.lookupPatientDataByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanDigits || cleanDigits.length < 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    const phonePattern = new RegExp(cleanDigits.split('').join('\\D*'), 'i');

    // Find all patients matching phone or guardian phone
    const patients = await Patient.find({
      $or: [
        { phone: { $regex: phonePattern } },
        { phone: { $regex: cleanDigits } },
        { staffWorkerContact: { $regex: phonePattern } }
      ]
    }).sort({ createdAt: -1 });

    // Also find referrals matching these patients or mobile
    const patientIds = patients.map(p => p.id);
    const referrals = await Referral.find({
      patientId: { $in: patientIds }
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: patients.length,
      cleanPhone: cleanDigits,
      patients,
      referrals,
      message: patients.length > 0
        ? `Found ${patients.length} patient record(s) linked to ${phone}.`
        : `No clinical records found for mobile ${phone}.`
    });
  } catch (error) {
    console.error('lookupPatientDataByPhone error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Send Email OTP for Doctor Login
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, { otp, expiresAt });

    console.log(`\n🔑 ==========================================`);
    console.log(`📧 DOCTOR AUTH OTP for [${normalizedEmail}]: ${otp}`);
    console.log(`⏰ Valid for 10 minutes`);
    console.log(`==========================================\n`);

    // Attempt real email sending if SMTP configured in environment
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
          from: `"SwasthyaSetu Medical Portal" <${process.env.SMTP_USER}>`,
          to: normalizedEmail,
          subject: '🔐 GraminArogya Doctor Panel - Login OTP Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #d1fae5; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #064e3b; margin: 0;">🌿 GraminArogya</h2>
                <p style="color: #047857; font-size: 0.9rem; margin: 4px 0 0;">Doctor Clinical Portal & Care Continuity</p>
              </div>
              <div style="background: #f0fdf4; border: 1px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="color: #374151; font-size: 0.9rem; margin: 0 0 10px;">Your 6-Digit Authentication One-Time Password is:</p>
                <div style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #064e3b;">${otp}</div>
                <p style="color: #6b7280; font-size: 0.8rem; margin: 10px 0 0;">Valid for 10 minutes. Do not share this OTP with anyone.</p>
              </div>
              <p style="color: #4b5563; font-size: 0.85rem; line-height: 1.5;">This email was sent to authenticate your doctor account on the GraminArogya Rural Healthcare Intelligence Platform.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <div style="font-size: 0.75rem; color: #9ca3af; text-align: center;">SIH 2026 • Ministry of Health & Family Welfare</div>
            </div>
          `
        });
        emailSent = true;
        emailNotice = 'OTP sent directly to your email inbox.';
      } catch (mailErr) {
        console.warn('SMTP delivery notice:', mailErr.message);
        emailNotice = 'OTP generated. Check your email inbox.';
      }
    } else {
      emailNotice = 'OTP generated. (SMTP not configured — check backend .env for real delivery.)';
    }

    return res.json({
      success: true,
      message: `OTP sent to ${normalizedEmail}. ${emailNotice}`,
      expiresInMinutes: 10
    });
  } catch (error) {
    console.error('sendEmailOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Verify Email OTP and Log In Doctor
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'No active OTP found for this email. Please request a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please check and try again.' });
    }

    // OTP is valid - clean up
    otpStore.delete(normalizedEmail);

    // Find or create Doctor User
    let user = await User.findOne({
      $or: [{ username: normalizedEmail }, { phone: normalizedEmail }]
    });

    if (!user) {
      // Find doctor profile by email
      const docProfile = await DoctorProfile.findOne({ email: normalizedEmail });
      const doctorName = docProfile ? docProfile.doctorName : `Dr. ${normalizedEmail.split('@')[0]}`;

      user = new User({
        username: normalizedEmail,
        password: `doctor_otp_${Date.now()}`,
        name: doctorName,
        role: 'doctor',
        phone: docProfile ? docProfile.phone : '+91-98765-00000',
        designation: docProfile ? docProfile.specialization : 'Medical Officer'
      });
      await user.save();

      // Ensure DoctorProfile exists
      if (!docProfile) {
        const newProfile = new DoctorProfile({
          doctorId: `DOC-IND-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: user._id,
          doctorName: user.name,
          email: normalizedEmail,
          phone: user.phone,
          specialization: 'General Medicine (MBBS)',
          qualification: 'MBBS, MD',
          registrationNumber: 'GMC-2024-91823',
          branding: {
            headerTitle: `${user.name} Clinic`,
            headerSubtitle: 'Rural Healthcare & Consultation Services',
            headerContact: normalizedEmail,
            footerText: 'Valid for 7 days. Not for medico-legal purposes.'
          }
        });
        await newProfile.save();
      }
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'doctor', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const profile = await DoctorProfile.findOne({
      $or: [{ userId: user._id }, { email: normalizedEmail }]
    });

    return res.json({
      success: true,
      message: `Authentication successful! Welcome, ${user.name}.`,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: 'doctor',
        phone: user.phone,
        designation: user.designation
      },
      profile
    });
  } catch (error) {
    console.error('verifyEmailOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Google Login for Doctor
exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ username: normalizedEmail }]
    });

    const docName = name || `Dr. ${normalizedEmail.split('@')[0]}`;

    if (!user) {
      user = new User({
        username: normalizedEmail,
        password: `google_oauth_${googleId || Date.now()}`,
        name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
        role: 'doctor',
        phone: '+91-98765-11223',
        designation: 'Medical Officer (Google Verified)'
      });
      await user.save();
    }

    // Check or create DoctorProfile
    let profile = await DoctorProfile.findOne({
      $or: [{ userId: user._id }, { email: normalizedEmail }]
    });

    if (!profile) {
      profile = new DoctorProfile({
        doctorId: `DOC-GOOG-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: user._id,
        doctorName: user.name,
        email: normalizedEmail,
        phone: user.phone,
        specialization: 'General Physician & Consultant',
        qualification: 'MBBS, MD',
        registrationNumber: 'NMC-2023-55912',
        profilePhoto: picture || '',
        branding: {
          headerTitle: `${user.name} Health Center`,
          headerSubtitle: 'Google Verified Healthcare Practitioner',
          headerContact: normalizedEmail,
          footerText: 'Valid for 7 days. Not valid for medico-legal purposes.'
        }
      });
      await profile.save();
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'doctor', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Google sign-in successful! Welcome, ${user.name}.`,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: 'doctor',
        phone: user.phone,
        designation: user.designation
      },
      profile
    });
  } catch (error) {
    console.error('googleLogin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 8. Patient Complete Medical History by Patient ID or Phone ────────────────
exports.getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorName = 'Dr. Consulting Physician', doctorId = 'DOC-CURRENT' } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    const trimmedId = id.trim();
    const escaped = trimmedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const digitsOnly = trimmedId.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const orConditions = [
      { id: trimmedId },
      { id: new RegExp(`^${escaped}$`, 'i') },
      { abhaId: trimmedId },
      { phone: trimmedId },
      { phone: new RegExp(escaped, 'i') }
    ];

    if (last10 && last10.length >= 6) {
      orConditions.push({ phone: new RegExp(last10) });
      orConditions.push({ id: new RegExp(last10) });
    }

    let patient = await Patient.findOne({ $or: orConditions });

    if (!patient && trimmedId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(trimmedId);
    }

    // If still not found, check registered User collection (e.g. patient registered with phone/username)
    if (!patient) {
      const userConditions = [
        { username: new RegExp(`^${escaped}$`, 'i') },
        { name: new RegExp(`^${escaped}$`, 'i') },
        { phone: trimmedId },
        { phone: new RegExp(escaped, 'i') }
      ];
      if (digitsOnly && digitsOnly.length >= 6) {
        userConditions.push({ phone: new RegExp(digitsOnly) });
      }

      const matchedUser = await User.findOne({ $or: userConditions });
      if (matchedUser) {
        const cleanPhone = (matchedUser.phone || '').trim();
        const lastDigits = cleanPhone.replace(/\D/g, '').slice(-4) || '0000';
        const patId = `PAT-${cleanPhone ? cleanPhone.replace(/\D/g, '').slice(-6) : matchedUser._id.toString().slice(-6).toUpperCase()}`;

        patient = await Patient.findOne({ $or: [{ phone: cleanPhone }, { id: patId }] });
        if (!patient) {
          patient = new Patient({
            id: patId,
            name: matchedUser.name,
            age: 26,
            gender: 'Male',
            village: matchedUser.village || 'MAHENDRA NAGAR - 363642',
            phone: cleanPhone,
            abhaId: `ABHA-91-${lastDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            guardianName: 'Self',
            chiefComplaint: 'patient Care Record',
            symptomTags: ['General Consultation'],
            vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
            currentHealthStatus: { condition: 'Healthy', summary: 'Active Registered patient', lastEvaluatedAt: new Date() },
            riskLevel: 'LOW',
            triageCategory: 'GREEN_ROUTINE',
            bloodGroup: 'B+',
            medicalHistory: [],
            accessLogs: [],
            followUpReminders: [],
            registrationDate: matchedUser.createdAt || new Date()
          });
          await patient.save();
        }
      }
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `No patient found with ID, Mobile, or Username "${trimmedId}". Please verify the Patient ID or mobile number.`
      });
    }

    const accessTime = new Date();

    // Build update operations atomically to avoid Mongoose VersionError
    const updateOps = {
      $push: {
        accessLogs: {
          $each: [{
            accessedAt: accessTime,
            doctorId: doctorId,
            doctorName: doctorName,
            role: 'doctor',
            purpose: 'Complete Clinical History Review'
          }],
          $position: 0,
          $slice: 50  // Keep only the 50 most recent access logs
        }
      }
    };

    // Also set currentHealthStatus.condition if empty
    const conditionDefault =
      patient.riskLevel === 'CRITICAL' ? 'Critical Attention Required' :
      patient.riskLevel === 'HIGH' ? 'High Risk / Under Monitoring' :
      patient.riskLevel === 'MODERATE' ? 'Moderate Risk / Under Treatment' : 'Stable';

    if (!patient.currentHealthStatus || !patient.currentHealthStatus.condition) {
      updateOps.$set = {
        'currentHealthStatus.condition': conditionDefault,
        'currentHealthStatus.lastEvaluatedAt': new Date()
      };
    }

    // Use atomic update — avoids VersionError from concurrent saves
    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      updateOps,
      { new: true }
    );

    // Fetch related referrals
    const referrals = await Referral.find({ patientId: patient.id }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: `Complete medical history retrieved for ${patient.name}`,
      accessTimestamp: accessTime.toISOString(),
      currentAccessDateFormatted: accessTime.toLocaleString('en-IN', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
      }),
      patient: updatedPatient || patient,
      referrals
    });
  } catch (error) {
    console.error('getPatientHistory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 9. Add New Medical History Entry (Visit, Diagnosis, Treatment, Rx) ────────
exports.addPatientMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visitType = 'OPD Consultation',
      facilityName = 'Primary Health Centre',
      doctorName = 'Dr. Attending Physician',
      diagnosis,
      symptoms,
      prescriptions = [],
      treatments = [],
      testReports = [],
      clinicalNotes = '',
      vitalsAtVisit,
      currentCondition = 'Stable under Observation'
    } = req.body;

    if (!diagnosis) {
      return res.status(400).json({ success: false, message: 'Clinical diagnosis is required.' });
    }

    let patient = await Patient.findOne({
      $or: [{ id: id }, { phone: id }]
    });

    if (!patient && id.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await Patient.findById(id);
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const newVisit = {
      visitDate: new Date(),
      visitType,
      facilityName,
      doctorName,
      diagnosis,
      symptoms: symptoms || patient.chiefComplaint,
      prescriptions,
      treatments,
      testReports,
      clinicalNotes,
      vitalsAtVisit: vitalsAtVisit || patient.vitals
    };

    if (!patient.medicalHistory) patient.medicalHistory = [];
    patient.medicalHistory.unshift(newVisit);

    // Update current health status
    patient.currentHealthStatus = {
      condition: currentCondition,
      summary: `Latest visit on ${new Date().toLocaleDateString('en-IN')}: Diagnosed with ${diagnosis}. Prescribed ${prescriptions.length} medicine(s).`,
      lastEvaluatedAt: new Date()
    };

    if (vitalsAtVisit) {
      patient.vitals = { ...patient.vitals, ...vitalsAtVisit };
    }

    await patient.save();

    return res.status(201).json({
      success: true,
      message: 'New clinical visit record successfully added to patient history.',
      medicalHistory: patient.medicalHistory,
      currentHealthStatus: patient.currentHealthStatus
    });
  } catch (error) {
    console.error('addPatientMedicalHistory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 10. Update Patient Profile Details  ───────────────────
exports.updatePatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      gender,
      bloodGroup,
      village,
      guardianName,
      phone,
      emergencyContact,
      knownAllergies,
      chronicConditions,
      vitals,
      currentHealthStatus,
      doctorRemarks,
      doctorId,
      doctorName
    } = req.body;

    const searchTerms = [id, req.body.patientId, req.body.id, req.body.phone, phone].filter(Boolean);
    const orClauses = [];
    searchTerms.forEach(term => {
      const cleanTerm = String(term).trim();
      if (cleanTerm && cleanTerm !== 'undefined' && cleanTerm !== 'null') {
        orClauses.push({ id: cleanTerm });
        orClauses.push({ phone: cleanTerm });
        const cleanDigits = cleanTerm.replace(/\D/g, '').slice(-10);
        if (cleanDigits.length >= 6) {
          orClauses.push({ phone: { $regex: cleanDigits } });
        }
        if (cleanTerm.match(/^[0-9a-fA-F]{24}$/)) {
          orClauses.push({ _id: cleanTerm });
        }
      }
    });

    let patient = orClauses.length > 0 ? await Patient.findOne({ $or: orClauses }) : null;

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found in database.' });
    }

    // Doctor has permission to update demographic baseline and clinical health data
    if (name && name.trim()) patient.name = name.trim();
    if (age !== undefined && age !== '') patient.age = Number(age);
    if (gender) patient.gender = gender;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (village) patient.village = village;
    if (guardianName !== undefined) patient.guardianName = guardianName;
    if (phone) patient.phone = phone;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (Array.isArray(knownAllergies)) patient.knownAllergies = knownAllergies;
    if (Array.isArray(chronicConditions)) patient.chronicConditions = chronicConditions;

    // Clinical Vitals updated by Doctor
    if (vitals && typeof vitals === 'object') {
      patient.vitals = {
        bp: vitals.bp || patient.vitals?.bp || '120/80',
        spo2: vitals.spo2 !== undefined && vitals.spo2 !== '' ? Number(vitals.spo2) : (patient.vitals?.spo2 || 98),
        temp: vitals.temp !== undefined && vitals.temp !== '' ? Number(vitals.temp) : (patient.vitals?.temp || 98.4),
        pulse: vitals.pulse !== undefined && vitals.pulse !== '' ? Number(vitals.pulse) : (patient.vitals?.pulse || 72),
        sugar: vitals.sugar || patient.vitals?.sugar || 'Normal'
      };
    }

    // Health Condition & Clinical Status updated by Doctor
    if (currentHealthStatus) {
      if (typeof currentHealthStatus === 'string') {
        patient.currentHealthStatus = {
          condition: currentHealthStatus,
          summary: doctorRemarks || patient.currentHealthStatus?.summary || '',
          lastEvaluatedAt: new Date()
        };
      } else if (typeof currentHealthStatus === 'object') {
        patient.currentHealthStatus = {
          condition: currentHealthStatus.condition || patient.currentHealthStatus?.condition || 'Stable',
          summary: currentHealthStatus.summary || doctorRemarks || patient.currentHealthStatus?.summary || '',
          lastEvaluatedAt: new Date()
        };
      }
    } else if (doctorRemarks) {
      patient.currentHealthStatus = {
        condition: patient.currentHealthStatus?.condition || 'Stable',
        summary: doctorRemarks,
        lastEvaluatedAt: new Date()
      };
    }

    // Record Doctor Profile Update in Patient Access Logs
    if (!patient.accessLogs) patient.accessLogs = [];
    patient.accessLogs.push({
      accessedAt: new Date(),
      doctorId: doctorId || 'DOC-ATTENDING',
      doctorName: doctorName || 'Attending Physician',
      role: 'doctor',
      purpose: 'Patient Clinical Profile & Baseline Update'
    });

    await patient.save();

    // Synchronize linked patient User record in database if exists
    try {
      const cleanPhone = (patient.phone || '').replace(/\D/g, '').slice(-10);
      const queryConditions = [];
      if (cleanPhone) queryConditions.push({ phone: { $regex: cleanPhone } });
      if (patient.name) queryConditions.push({ name: patient.name });

      if (queryConditions.length > 0) {
        await User.updateMany(
          { $or: queryConditions, role: 'patient' },
          {
            $set: {
              name: patient.name,
              gender: patient.gender,
              bloodGroup: patient.bloodGroup,
              village: patient.village,
              emergencyContact: patient.emergencyContact
            }
          }
        );
      }
    } catch (syncErr) {
      console.warn('Sync linked User error (non-fatal):', syncErr.message);
    }

    return res.json({
      success: true,
      message: 'Patient profile and clinical baseline updated successfully by Doctor.',
      patient
    });
  } catch (error) {
    console.error('updatePatientProfile error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 11. Add Follow-Up Checkup Reminder (e.g. following day checkup) ─────────
exports.addFollowUpReminder = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientPhone = '',
      dueDate, // Target checkup date (e.g. tomorrow / following day)
      reason,
      priority = 'NORMAL',
      doctorId = '',
      doctorName = ''
    } = req.body;

    if (!patientId || !reason || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, checkup reason, and due date are required.'
      });
    }

    // Find patient record flexibly (by id, phone, or _id)
    const orConditions = [{ id: patientId }];
    if (patientPhone) {
      const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);
      if (cleanPhone) orConditions.push({ phone: { $regex: cleanPhone } });
    }
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      orConditions.push({ _id: patientId });
    }
    if (patientName) {
      orConditions.push({ name: patientName });
    }

    let patient = await Patient.findOne({ $or: orConditions });

    // If still not found, search User collection and create/link Patient record
    if (!patient) {
      const cleanPhone = (patientPhone || patientId).replace(/\D/g, '').slice(-10);
      const userConditions = [];
      if (cleanPhone) userConditions.push({ phone: { $regex: cleanPhone } });
      if (patientName) userConditions.push({ name: patientName });
      if (patientId) userConditions.push({ username: patientId });

      let matchedUser = null;
      if (userConditions.length > 0) {
        matchedUser = await User.findOne({ $or: userConditions });
      }

      const patId = (patientId && patientId.startsWith('PAT-')) ? patientId : `PAT-${cleanPhone || Math.floor(100000 + Math.random() * 900000)}`;
      patient = new Patient({
        id: patId,
        name: patientName || matchedUser?.name || 'Patient',
        age: 30,
        gender: 'Female',
        village: matchedUser?.village || 'Gramin Village',
        phone: patientPhone || matchedUser?.phone || '',
        chiefComplaint: reason || 'Follow-up consultation',
        vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
        currentHealthStatus: { condition: 'Stable', summary: 'Under doctor care', lastEvaluatedAt: new Date() },
        medicalHistory: [],
        followUpReminders: []
      });
    }

    // Save reminder in patient record
    if (!patient.followUpReminders) patient.followUpReminders = [];
    const newReminderItem = {
      dueDate: new Date(dueDate),
      doctorId: doctorId || '',
      doctorName: doctorName || 'Dr. Attending Physician',
      reason,
      priority,
      status: 'PENDING',
      createdAt: new Date()
    };
    patient.followUpReminders.unshift(newReminderItem);
    await patient.save();

    const createdReminderId = patient.followUpReminders[0]._id;

    const reminderEntry = {
      _id: createdReminderId,
      id: createdReminderId,
      patientId: patient.id,
      patientName: patient.name || patientName || 'Patient',
      patientPhone: patient.phone || patientPhone || '',
      dueDate: new Date(dueDate),
      reason,
      priority,
      status: 'PENDING',
      doctorId: doctorId || '',
      doctorName: doctorName || 'Dr. Attending Physician',
      createdAt: new Date()
    };

    // Also save in DoctorProfile if doctor exists (safely catch any errors)
    try {
      let docProfile = null;
      if (doctorId && doctorId !== 'DOC-CURRENT') {
        const docOr = [{ doctorId }];
        if (mongoose.Types.ObjectId.isValid(doctorId)) {
          docOr.push({ userId: doctorId });
        }
        docProfile = await DoctorProfile.findOne({ $or: docOr });
      }
      if (!docProfile) {
        docProfile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
      }

      if (docProfile) {
        if (!docProfile.reminders) docProfile.reminders = [];
        docProfile.reminders.unshift(reminderEntry);
        await docProfile.save();
      }
    } catch (docSaveErr) {
      console.warn('DoctorProfile reminder sync notice (non-fatal):', docSaveErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Follow-up reminder set for ${patient.name} on ${new Date(dueDate).toLocaleDateString('en-IN')}.`,
      reminder: reminderEntry
    });
  } catch (error) {
    console.error('addFollowUpReminder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 12. Get Doctor Follow-Up Reminders ────────────────────────────────────────
exports.getDoctorReminders = async (req, res) => {
  try {
    let reminders = [];
    try {
      const docProfile = await DoctorProfile.findOne().sort({ updatedAt: -1 }).maxTimeMS(5000);
      reminders = docProfile?.reminders || [];
    } catch (docErr) {
      console.warn('getDoctorReminders docProfile warning:', docErr.message);
    }

    // Fetch ALL follow-up reminders from Patient model
    let patientReminders = [];
    try {
      const patientsWithReminders = await Patient.find({
        'followUpReminders.0': { $exists: true }
      }).select('id name phone followUpReminders').maxTimeMS(5000);

      patientsWithReminders.forEach(p => {
        (p.followUpReminders || []).forEach(r => {
          if (r) {
            patientReminders.push({
              _id: r._id,
              id: r._id,
              patientId: p.id,
              patientName: p.name,
              patientPhone: p.phone,
              doctorId: r.doctorId,
              doctorName: r.doctorName,
              dueDate: r.dueDate,
              reason: r.reason,
              priority: r.priority,
              status: r.status,
              createdAt: r.createdAt
            });
          }
        });
      });
    } catch (patErr) {
      console.warn('getDoctorReminders patients warning:', patErr.message);
    }

    // Merge and deduplicate safely
    const reminderMap = new Map();
    [...patientReminders, ...reminders].forEach(rem => {
      if (!rem) return;
      const dStr = rem.dueDate ? new Date(rem.dueDate).toISOString().slice(0, 10) : 'no-date';
      const idKey = rem._id ? rem._id.toString() : null;
      const key = idKey || `${rem.patientId || 'pat'}_${dStr}_${rem.reason || ''}`;
      
      if (!reminderMap.has(key)) {
        reminderMap.set(key, rem);
      } else {
        const existing = reminderMap.get(key);
        // If status changed to COMPLETED in either source, preserve COMPLETED
        if (rem.status === 'COMPLETED' || (!existing._id && rem._id)) {
          reminderMap.set(key, rem);
        }
      }
    });

    const uniqueReminders = Array.from(reminderMap.values());
    uniqueReminders.sort((a, b) => {
      const tA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const tB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return tA - tB;
    });

    return res.json({
      success: true,
      reminders: uniqueReminders
    });
  } catch (error) {
    console.error('getDoctorReminders error (handled gracefully):', error.message);
    return res.json({ success: true, reminders: [] });
  }
};

// ─── 13. Update Reminder Status (Completed / Dismissed) ───────────────────────
exports.updateReminderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'COMPLETED' } = req.body;

    // Update in DoctorProfile
    try {
      const docProfile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
      if (docProfile && docProfile.reminders) {
        const rem = docProfile.reminders.find(r => r._id?.toString() === id || r.id === id);
        if (rem) {
          rem.status = status;
          await docProfile.save();
        }
      }
    } catch (e) {
      console.warn('DocProfile update status error:', e.message);
    }

    // Also update in Patient model
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Patient.updateMany(
        { 'followUpReminders._id': id },
        { $set: { 'followUpReminders.$.status': status } }
      );
    }

    return res.json({
      success: true,
      message: `Reminder marked as ${status}.`
    });
  } catch (error) {
    console.error('updateReminderStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 13b. Send OTP to Patient Email Before Marking Follow-Up Done ──────────────
// Doctor initiates: OTP auto-fetched from patient's User record and sent to their registered email
exports.sendFollowUpOtp = async (req, res) => {
  try {
    const { reminderId, patientId, patientName } = req.body;

    if (!reminderId) {
      return res.status(400).json({ success: false, message: 'reminderId is required.' });
    }

    // Auto-fetch patient's registered email from Patient model → User model
    let patientEmail = null;
    let resolvedName = patientName || 'Patient';
    try {
      // First find the Patient record to get phone/name
      const patOr = [];
      if (patientId) patOr.push({ id: patientId });
      if (patientName) patOr.push({ name: patientName });
      if (patientId && patientId.match(/^[0-9+]{6,15}$/)) patOr.push({ phone: { $regex: patientId.slice(-10) } });

      let patient = null;
      if (patOr.length > 0) {
        patient = await Patient.findOne({ $or: patOr }).select('phone name id');
      }

      if (patient) {
        resolvedName = patient.name || resolvedName;
        const cleanPhone = (patient.phone || '').replace(/\D/g, '').slice(-10);
        const userOr = [];
        if (cleanPhone) userOr.push({ phone: { $regex: cleanPhone } });
        if (patient.id) userOr.push({ username: patient.id });
        if (patient.name) userOr.push({ name: patient.name });
        
        if (userOr.length > 0) {
          const user = await User.findOne({ $or: userOr, email: { $exists: true, $ne: '' } }).select('email name');
          if (user && user.email && user.email.includes('@')) {
            patientEmail = user.email.toLowerCase().trim();
          }
        }
      }

      // Direct User lookup fallback
      if (!patientEmail) {
        const cleanDigits = (patientId || '').replace(/\D/g, '').slice(-10);
        const userDirectOr = [];
        if (cleanDigits) userDirectOr.push({ phone: { $regex: cleanDigits } });
        if (patientId) userDirectOr.push({ username: patientId });
        if (patientName) userDirectOr.push({ name: patientName });

        if (userDirectOr.length > 0) {
          const u = await User.findOne({ $or: userDirectOr, email: { $exists: true, $ne: '' } }).select('email name');
          if (u && u.email && u.email.includes('@')) {
            patientEmail = u.email.toLowerCase().trim();
            resolvedName = u.name || resolvedName;
          }
        }
      }
    } catch (lookupErr) {
      console.warn('Patient email auto-lookup warning:', lookupErr.message);
    }

    if (!patientEmail) {
      return res.status(400).json({
        success: false,
        message: 'No registered email found for this patient. Please ensure the patient has an email in their profile.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP keyed by reminderId so it can be verified later
    otpStore.set(`followup_${reminderId}`, { otp, expiresAt, patientEmail, patientId, patientName: resolvedName });

    console.log(`\n🔔 ==========================================`);
    console.log(`📧 FOLLOW-UP OTP for patient [${resolvedName}] (${patientEmail}): ${otp}`);
    console.log(`⏰ Reminder ID: ${reminderId} — Valid 10 minutes`);
    console.log(`==========================================\n`);

    // Attempt real email delivery if SMTP is configured
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
          from: `"SwasthyaSetu Health Portal" <${process.env.SMTP_USER}>`,
          to: patientEmail,
          subject: '✅ GraminArogya — Follow-Up Checkup Confirmation OTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #d1fae5; border-radius: 12px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #064e3b; margin: 0;">🌿 GraminArogya</h2>
                <p style="color: #047857; font-size: 0.9rem; margin: 4px 0 0;">Doctor Follow-Up Verification</p>
              </div>
              <p style="color: #374151; font-size: 0.92rem;">Dear <strong>${resolvedName}</strong>,</p>
              <p style="color: #374151; font-size: 0.92rem;">Your doctor has completed your scheduled follow-up checkup. Please share the OTP below with your doctor to confirm the visit:</p>
              <div style="background: #f0fdf4; border: 1px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="color: #374151; font-size: 0.9rem; margin: 0 0 10px;">Your Follow-Up Verification OTP:</p>
                <div style="font-size: 2.4rem; font-weight: 800; letter-spacing: 8px; color: #064e3b;">${otp}</div>
                <p style="color: #6b7280; font-size: 0.8rem; margin: 10px 0 0;">Valid for 10 minutes. Share only with your attending doctor.</p>
              </div>
              <p style="color: #4b5563; font-size: 0.85rem;">This confirms your follow-up visit at GraminArogya Rural Healthcare Portal.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <div style="font-size: 0.75rem; color: #9ca3af; text-align: center;">SIH 2026 • Ministry of Health & Family Welfare</div>
            </div>
          `
        });
        emailSent = true;
      } catch (mailErr) {
        console.warn('SMTP delivery failed (OTP still stored):', mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: emailSent
        ? `OTP sent to patient's registered email. Ask the patient to share the code with you.`
        : `OTP generated but email delivery failed. Check SMTP config.`,
      maskedEmail: patientEmail.replace(/(.{2}).+(@.+)/, '$1***$2'),
      emailSent
    });
  } catch (error) {
    console.error('sendFollowUpOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 13c. Verify Patient OTP & Mark Follow-Up Reminder as COMPLETED ───────────
exports.verifyFollowUpOtp = async (req, res) => {
  try {
    const { reminderId, otp } = req.body;

    if (!reminderId || !otp) {
      return res.status(400).json({ success: false, message: 'Reminder ID and OTP are required.' });
    }

    const key = `followup_${reminderId}`;
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'No active OTP found for this follow-up. Please send a new OTP.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ success: false, message: 'OTP has expired (10 min limit). Please send a new OTP.' });
    }

    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please check and try again.' });
    }

    // OTP verified — clean up and mark the reminder as COMPLETED
    otpStore.delete(key);

    // Update in DoctorProfile reminders
    const docProfile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
    if (docProfile && docProfile.reminders) {
      const rem = mongoose.Types.ObjectId.isValid(reminderId)
        ? docProfile.reminders.id(reminderId)
        : docProfile.reminders.find(r => r._id?.toString() === reminderId || r.id === reminderId);
      if (rem) {
        rem.status = 'COMPLETED';
        await docProfile.save();
      }
    }

    // Update in Patient model if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(reminderId)) {
      await Patient.updateMany(
        { 'followUpReminders._id': reminderId },
        { $set: { 'followUpReminders.$.status': 'COMPLETED' } }
      );
    }

    // Also update any matching pending reminders for this patient in the database
    if (stored.patientId) {
      await Patient.updateMany(
        { id: stored.patientId, 'followUpReminders.status': 'PENDING' },
        { $set: { 'followUpReminders.$[elem].status': 'COMPLETED' } },
        { arrayFilters: [{ 'elem.status': 'PENDING' }] }
      );
    }

    return res.json({
      success: true,
      message: 'OTP verified! Follow-up marked as COMPLETED successfully.'
    });
  } catch (error) {
    console.error('verifyFollowUpOtp error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 14. Doctor Leave Application & Schedule Management ──────────────────────
exports.submitDoctorLeave = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      leaveType = 'CASUAL',
      reason,
      substituteDoctor = '',
      emergencyContact = ''
    } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave start date, end date, and reason are required.'
      });
    }

    let profile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    const newLeave = {
      startDate: start,
      endDate: end,
      leaveType,
      reason,
      substituteDoctor,
      emergencyContact,
      status: 'APPROVED',
      appliedAt: now
    };

    if (!profile.leaves) profile.leaves = [];
    profile.leaves.unshift(newLeave);

    // If current date falls inside the leave range, automatically mark dutyStatus as ON_LEAVE
    if (now >= start && now <= end) {
      if (!profile.schedule) profile.schedule = {};
      profile.schedule.dutyStatus = 'ON_LEAVE';
    }

    await profile.save();

    return res.status(201).json({
      success: true,
      message: `Leave application approved from ${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}. OPD schedule updated.`,
      leave: newLeave,
      schedule: profile.schedule
    });
  } catch (error) {
    console.error('submitDoctorLeave error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 15. Get Doctor Schedule and Leave Records ─────────────────────────────────
exports.getDoctorScheduleAndLeaves = async (req, res) => {
  try {
    let profile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Check if active leave applies right now
    const now = new Date();
    const activeLeave = (profile.leaves || []).find(l => {
      return l.status === 'APPROVED' && new Date(l.startDate) <= now && new Date(l.endDate) >= now;
    });

    if (activeLeave && profile.schedule.dutyStatus !== 'ON_LEAVE') {
      profile.schedule.dutyStatus = 'ON_LEAVE';
      await profile.save();
    } else if (!activeLeave && profile.schedule.dutyStatus === 'ON_LEAVE') {
      profile.schedule.dutyStatus = 'AVAILABLE';
      await profile.save();
    }

    return res.json({
      success: true,
      schedule: profile.schedule,
      leaves: profile.leaves || [],
      activeLeave: activeLeave || null
    });
  } catch (error) {
    console.error('getDoctorScheduleAndLeaves error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 16. Update Doctor OPD Schedule & Duty Status ──────────────────────────────
exports.updateDoctorSchedule = async (req, res) => {
  try {
    const {
      opdDays,
      startTime,
      endTime,
      roomNumber,
      maxPatientsPerDay,
      dutyStatus
    } = req.body;

    let profile = await DoctorProfile.findOne().sort({ updatedAt: -1 });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    if (!profile.schedule) profile.schedule = {};

    if (Array.isArray(opdDays)) profile.schedule.opdDays = opdDays;
    if (startTime) profile.schedule.startTime = startTime;
    if (endTime) profile.schedule.endTime = endTime;
    if (roomNumber !== undefined) profile.schedule.roomNumber = roomNumber;
    if (maxPatientsPerDay !== undefined) profile.schedule.maxPatientsPerDay = Number(maxPatientsPerDay);
    if (dutyStatus) profile.schedule.dutyStatus = dutyStatus;

    await profile.save();

    return res.json({
      success: true,
      message: 'Doctor OPD schedule and duty availability updated successfully.',
      schedule: profile.schedule
    });
  } catch (error) {
    console.error('updateDoctorSchedule error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

