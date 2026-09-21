const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Patient = require('../models/Patient');
const DoctorProfile = require('../models/DoctorProfile');

const JWT_SECRET = process.env.JWT_SECRET || 'gramin_arogya_secure_sih_2026_jwt_token_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


// Initialize and ensure Admin user exists in DB
const ensureAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: '27012005',
        name: 'Chief Health Administrator (National/State admin)',
        role: 'admin',
        phone: '+91-99999-00001',
        village: 'District Health HQ',
        designation: 'System Super Administrator'
      });
      await admin.save();
      console.log('✅ Default Administrator account verified (admin / 27012005)');
    }
  } catch (err) {
    console.error('Error verifying admin user:', err.message);
  }
};

// Call on startup
ensureAdminUser();

exports.ensureAdminUser = ensureAdminUser;

exports.register = async (req, res) => {
  try {
    const {
      username, password, name, role = 'patient',
      phone, email, village, facilityId, facilityName, designation,
      // Patient/patient-specific fields
      dateOfBirth, gender, bloodGroup, emergencyContact
    } = req.body;

    if (role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Public registration is only allowed for Patients.' });
    }

    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Username, password, and full name are required.' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already exists. Please pick another username or login.' });
    }

    const newUser = new User({
      username: username.toLowerCase().trim(),
      password,
      name,
      role,
      phone: phone || '',
      email: email || '',
      village: village || '',
      facilityId: facilityId || '',
      facilityName: facilityName || '',
      designation: designation || (role === 'admin' ? 'Administrator' : role === 'doctor' ? 'Medical Officer' : role === 'admin' ? 'Chief Medical Officer' : role === 'patient' ? 'Registered Patient' : 'staff Health Worker'),
      dateOfBirth: dateOfBirth || '',
      gender: gender || '',
      bloodGroup: bloodGroup || '',
      emergencyContact: emergencyContact || ''
    });

    await newUser.save();

    // Auto-create/sync real patient clinical record in MongoDB for patient/patient users
    if (newUser.role === 'patient' || (newUser.phone && newUser.phone.trim().length >= 4)) {
      try {
        const cleanPhone = (newUser.phone || '').trim();
        const patId = `PAT-${cleanPhone ? cleanPhone.replace(/\D/g, '').slice(-6) : newUser._id.toString().slice(-6).toUpperCase()}`;

        let pat = await Patient.findOne({
          $or: [{ phone: cleanPhone }, { id: patId }, { name: newUser.name }]
        });

        // Compute age from dateOfBirth if provided
        let computedAge = 25;
        if (dateOfBirth) {
          const dob = new Date(dateOfBirth);
          const today = new Date();
          computedAge = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) computedAge--;
        }

        if (!pat) {
          const abhaDigits = cleanPhone.replace(/\D/g, '').slice(-4) || '0000';
          pat = new Patient({
            id: patId,
            name: newUser.name,
            age: computedAge,
            gender: gender || 'Not Specified',
            village: village || '',
            phone: cleanPhone,
            abhaId: `ABHA-91-${abhaDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            guardianName: emergencyContact ? `Emergency: ${emergencyContact}` : 'Self',
            chiefComplaint: 'patient Health Record',
            symptomTags: ['General Health', 'Preventive Care'],
            vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
            currentHealthStatus: { condition: 'Healthy', summary: 'Newly Registered patient – Profile to be completed', lastEvaluatedAt: new Date() },
            riskLevel: 'LOW',
            triageCategory: 'GREEN_ROUTINE',
            bloodGroup: bloodGroup || '',
            emergencyContact: emergencyContact || '',
            medicalHistory: [],
            accessLogs: [],
            followUpReminders: [],
            registrationDate: new Date()
          });
          await pat.save();
        } else {
          // Update existing Patient record with new real values if they were dummy
          const updateFields = {};
          if (gender && (!pat.gender || pat.gender === 'Not Specified')) updateFields.gender = gender;
          if (bloodGroup && !pat.bloodGroup) updateFields.bloodGroup = bloodGroup;
          if (emergencyContact && !pat.emergencyContact) updateFields.emergencyContact = emergencyContact;
          if (village && (!pat.village || pat.village === 'MAHENDRA NAGAR - 363642')) updateFields.village = village;
          if (computedAge !== 25 && pat.age === 25) updateFields.age = computedAge;
          if (Object.keys(updateFields).length > 0) {
            await Patient.findByIdAndUpdate(pat._id, { $set: updateFields });
          }
        }
      } catch (patErr) {
        console.warn('Auto-sync patient record note:', patErr.message);
      }
    }

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        email: newUser.email,
        village: newUser.village,
        facilityName: newUser.facilityName,
        designation: newUser.designation,
        dateOfBirth: newUser.dateOfBirth,
        gender: newUser.gender,
        bloodGroup: newUser.bloodGroup,
        emergencyContact: newUser.emergencyContact
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Credentials required.' });

    const normalizedUsername = username.toLowerCase().trim();
    const escapedLoginId = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const loginIdPattern = new RegExp(`^${escapedLoginId}$`, 'i');

    // 1. Admin Intercept (Bypass role check)
    if (normalizedUsername === 'admin' || normalizedUsername === 'admin@graminarogya.gov.in') {
      let adminUser = await User.findOne({
        $or: [
          { username: 'admin' },
          { email: 'admin@graminarogya.gov.in' }
        ]
      });
      if (!adminUser && password === '27012005') {
        await exports.ensureAdminUser();
        adminUser = await User.findOne({ username: 'admin' });
      }
      if (!adminUser || !(await adminUser.comparePassword(password))) {
        if (password !== '27012005') return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }
      
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const OTP = require('../models/OTP');
      const newOtp = new OTP({
        type: 'admin_login',
        target: 'admin',
        otp: otpCode,
        code: otpCode,
        userId: adminUser?._id,
        email: adminUser?.email || 'admin@graminarogya.gov.in',
        purpose: 'ADMIN_LOGIN',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      await newOtp.save();
      
      console.log(`[ADMIN OTP GENERATED]: ${otpCode}`);
      return res.json({
        success: true,
        requireOtp: true,
        message: 'OTP required for Admin login. Check server console or use preview.',
        devOtpPreview: otpCode
      });
    }

    // 2. Role-specific login
    let user;
    if (role === 'doctor') {
      user = await User.findOne({ doctorId: loginIdPattern, role: 'doctor' });
    } else if (role === 'staff') {
      user = await User.findOne({ staffId: loginIdPattern, role: 'staff' });
    } else {
      user = await User.findOne({ 
        role: 'patient', 
        $or: [{ username: normalizedUsername }, { email: normalizedUsername }, { phone: normalizedUsername }] 
      });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or incorrect role.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id, username: user.username, name: user.name, role: user.role, 
        phone: user.phone, email: user.email, facilityName: user.facilityName
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyAdminOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });
    
    const OTP = require('../models/OTP');
    const cleanOtp = String(otp).trim();
    const otpRecord = await OTP.findOne({
      $or: [
        { type: 'admin_login', target: 'admin', otp: cleanOtp },
        { target: 'admin', code: cleanOtp },
        { purpose: 'DOCTOR_LOGIN', code: cleanOtp },
        { otp: cleanOtp },
        { code: cleanOtp }
      ]
    });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    
    const adminUser = await User.findOne({ username: 'admin' });
    await OTP.deleteOne({ _id: otpRecord._id });
    
    const token = jwt.sign(
      { id: adminUser._id, username: adminUser.username, role: adminUser.role, name: adminUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ success: true, message: 'Admin verified successfully.', token, user: { id: adminUser._id, username: adminUser.username, name: adminUser.name, role: adminUser.role } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Google OAuth Login / Register ───────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on this server. Add GOOGLE_CLIENT_ID to backend/.env'
      });
    }

    const { credential, role = 'patient' } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required.' });
    }

    // Verify the ID token with Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
    } catch (verifyErr) {
      console.error('Google token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired Google token. Please try again.' });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: 'Could not retrieve profile from Google.' });
    }

    // 1. Try to find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    const assignedRole = user ? user.role : (role || 'patient');

    if (!user) {
      // 2. Create a new user from Google profile
      const baseUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      const displayName = assignedRole === 'doctor'
        ? (name.startsWith('Dr.') ? name : `Dr. ${name}`)
        : name;

      user = new User({
        username,
        password: '',   // no password for Google users
        googleId,
        name: displayName,
        role: assignedRole,
        email: email.toLowerCase(),
        designation: assignedRole === 'doctor'
          ? 'Medical Officer'
          : assignedRole === 'patient'
          ? 'Registered Patient'
          : assignedRole === 'admin'
          ? 'Chief Medical Officer'
          : 'staff Health Worker',
        village: '',
        phone: ''
      });
      await user.save();

      // Auto-create Patient record for patients
      if (assignedRole === 'patient') {
        try {
          const patId = `PAT-GOOG-${googleId.slice(-6).toUpperCase()}`;
          const patExists = await Patient.findOne({ $or: [{ email: email.toLowerCase() }, { id: patId }] });
          if (!patExists) {
            await Patient.create({
              id: patId,
              userId: user._id,
              name: displayName,
              age: 25,
              gender: 'Female',
              village: 'Village Registered',
              phone: '',
              email: email.toLowerCase(),
              abhaId: `ABHA-GOOG-${googleId.slice(-8).toUpperCase()}`,
              guardianName: 'Self',
              chiefComplaint: 'patient Health Record (Google)',
              symptomTags: ['General Health', 'Preventive Care'],
              vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
              currentHealthStatus: { condition: 'Healthy', summary: 'Registered via Google – Profile to be completed', lastEvaluatedAt: new Date() },
              riskLevel: 'LOW',
              triageCategory: 'GREEN_ROUTINE',
              medicalHistory: [],
              accessLogs: [],
              followUpReminders: [],
              registrationDate: new Date()
            });
          }
        } catch (patErr) {
          console.warn('Google patient auto-create patient note:', patErr.message);
        }
      }

      // Auto-create DoctorProfile for doctors
      if (assignedRole === 'doctor') {
        try {
          const DoctorProfile = require('../models/DoctorProfile');
          const dpExists = await DoctorProfile.findOne({ email: email.toLowerCase() });
          if (!dpExists) {
            await DoctorProfile.create({
              doctorName: displayName,
              specialization: 'General Physician',
              qualification: 'MBBS',
              email: email.toLowerCase(),
              phone: '',
              registrationNumber: '',
              clinicName: `${displayName} Clinic`,
              branding: {
                headerTitle: `${displayName} – Healthcare Services`,
                headerSubtitle: 'General Physician',
                headerContact: email.toLowerCase(),
                footerText: 'Valid for 7 days. Not valid for medico-legal purposes.'
              }
            });
          }
        } catch (dpErr) {
          console.warn('Google doctor profile auto-create note:', dpErr.message);
        }
      }

    } else {
      // 3. Update googleId if user exists via email but never logged in with Google before
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // Issue our own JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: `Welcome, ${user.name}! Signed in with Google.`,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        village: user.village,
        facilityName: user.facilityName,
        designation: user.designation,
        picture: picture || '',
        loginMethod: 'google'
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDoctor = async (req, res) => {
  try {
    const { name, password, email, phone } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password required.' });
    
    const docId = 'DOC-' + Math.floor(1000 + Math.random() * 9000);
    const User = require('../models/User');
    const newUser = new User({
      username: docId,
      doctorId: docId,
      password,
      name,
      role: 'doctor',
      email: email || '',
      phone: phone || '',
      designation: 'Medical Officer'
    });
    await newUser.save();
    return res.json({ success: true, message: 'Doctor created successfully.', doctorId: docId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { name, password, email, phone, associatedDoctor } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Name and password required.' });
    
    const stfId = 'STF-' + Math.floor(1000 + Math.random() * 9000);
    const User = require('../models/User');
    const newUser = new User({
      username: stfId,
      staffId: stfId,
      password,
      name,
      role: 'staff',
      email: email || '',
      phone: phone || '',
      associatedDoctor: associatedDoctor || null,
      designation: 'Health Staff'
    });
    await newUser.save();
    return res.json({ success: true, message: 'Staff created successfully.', staffId: stfId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
