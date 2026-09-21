import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, UserCheck, Shield, Phone, Mail, Award, FileText, Printer, Sparkles, CheckCircle2, AlertCircle, Search, Building2, Clock, IndianRupee, Camera, Image as ImageIcon, PenTool, Save, RefreshCw, ExternalLink, ArrowRight, Heart, Plus, Trash2, QrCode, Share2, Bell, Calendar, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import PatientMedicalHistoryView from '../components/doctor/PatientMedicalHistoryView';
import DoctorLeaveScheduleView from '../components/doctor/DoctorLeaveScheduleView';
import DoctorRemindersView from '../components/doctor/DoctorRemindersView';
export default function DoctorPanel({
  currentUser,
  onAuthSuccess,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}) {
  // Tabs: 'history', 'reminders', 'leaveSchedule', 'profile', 'branding', 'prescriptions', 'phoneFetch'
  const [internalSubTab, setInternalSubTab] = useState(propActiveSubTab || 'history');
  useEffect(() => {
    if (propActiveSubTab) {
      setInternalSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab]);
  const activeSubTab = propActiveSubTab || internalSubTab;
  const setActiveSubTab = tab => {
    setInternalSubTab(tab);
    if (propSetActiveSubTab) {
      propSetActiveSubTab(tab);
    }
  };
  const [pendingReminderCount, setPendingReminderCount] = useState(0);
  const [selectedHistoryPatientId, setSelectedHistoryPatientId] = useState('');
  const [historyInitialTab, setHistoryInitialTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Doctor Profile Form State - Loaded from Database
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationHours, setConsultationHours] = useState('');
  const [consultationFee, setConsultationFee] = useState(0);
  const [bio, setBio] = useState('');

  // Custom Branding Settings - Loaded from Database
  const [brandingLogo, setBrandingLogo] = useState('');
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [headerContact, setHeaderContact] = useState('');
  const [headerBgColor, setHeaderBgColor] = useState('#064e3b');
  const [footerText, setFooterText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [themeColor, setThemeColor] = useState('#059669');

  // Authentication State (Google, Email OTP, Mobile Lookup)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('emailOtp'); // 'emailOtp' | 'google' | 'phone'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpPreview, setDevOtpPreview] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Mobile Number Data Fetching State ("Mobile no thi data fetch that joi")
  const [searchMobile, setSearchMobile] = useState('');
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [fetchedDoctorData, setFetchedDoctorData] = useState(null);
  const [fetchedPatientData, setFetchedPatientData] = useState(null);
  const [phoneSearchMsg, setPhoneSearchMsg] = useState('');

  // Interactive Prescription Pad State - Populated from Database when patient selected
  const [rxPatientName, setRxPatientName] = useState('');
  const [rxPatientAge, setRxPatientAge] = useState('');
  const [rxPatientGender, setRxPatientGender] = useState('');
  const [rxPatientPhone, setRxPatientPhone] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxVitals, setRxVitals] = useState('');
  const [rxMedicines, setRxMedicines] = useState([{
    name: '',
    dosage: '',
    duration: '',
    instruction: ''
  }]);
  const [rxAdvice, setRxAdvice] = useState('');

  // File upload refs
  const profilePhotoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  // Fetch Doctor Profile on mount & live reminder count poll
  useEffect(() => {
    loadDoctorProfile();
    refreshReminderCount();
    const interval = setInterval(() => {
      refreshReminderCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);
  const refreshReminderCount = async () => {
    try {
      const res = await api.getDoctorReminders();
      if (res.success && res.reminders) {
        setPendingReminderCount(res.reminders.filter(r => r.status === 'PENDING').length);
      }
    } catch {}
  };
  const loadDoctorProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getDoctorProfile();
      if (res.success && res.profile) {
        populateProfileFields(res.profile);
      } else if (currentUser) {
        // Load directly from current logged in user in database
        setDoctorName(currentUser.name || '');
        setPhone(currentUser.phone || '');
        setEmail(currentUser.username && currentUser.username.includes('@') ? currentUser.username : '');
        setSpecialization(currentUser.designation || '');
        setClinicName(currentUser.facilityName || '');
      }
    } catch (e) {
      console.warn('Could not load doctor profile from server:', e);
    } finally {
      setLoading(false);
    }
  };
  const populateProfileFields = p => {
    if (!p) return;
    setDoctorId(p.doctorId || '');
    setDoctorName(p.doctorName || currentUser?.name || '');
    setSpecialization(p.specialization || '');
    setQualification(p.qualification || '');
    setPhone(p.phone || currentUser?.phone || '');
    setEmail(p.email || (currentUser?.username?.includes('@') ? currentUser.username : ''));
    setRegistrationNumber(p.registrationNumber || '');
    setMedicalCouncil(p.medicalCouncil || '');
    setExperienceYears(p.experienceYears || 0);
    setProfilePhoto(p.profilePhoto || '');
    setClinicName(p.clinicName || currentUser?.facilityName || '');
    setClinicAddress(p.clinicAddress || '');
    setConsultationHours(p.consultationHours || '');
    setConsultationFee(p.consultationFee || 0);
    setBio(p.bio || '');
    if (p.branding) {
      setBrandingLogo(p.branding.logo || '');
      setHeaderTitle(p.branding.headerTitle || '');
      setHeaderSubtitle(p.branding.headerSubtitle || '');
      setHeaderContact(p.branding.headerContact || '');
      setHeaderBgColor(p.branding.headerBgColor || '#064e3b');
      setFooterText(p.branding.footerText || '');
      setSignatureImage(p.branding.signatureImage || '');
      setThemeColor(p.branding.themeColor || '#059669');
    }
  };

  // Save Doctor Profile & Branding
  const handleSaveProfile = async e => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSaveSuccess('');
    setLoading(true);
    try {
      const payload = {
        doctorId: doctorId || undefined,
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
        branding: {
          logo: brandingLogo,
          headerTitle,
          headerSubtitle,
          headerContact,
          headerBgColor,
          footerText,
          signatureImage,
          themeColor,
          showWatermark: true
        }
      };
      const res = await api.updateDoctorProfile(payload);
      if (res.success) {
        setSaveSuccess('Doctor Profile & Branding saved successfully to central database!');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        if (res.profile) populateProfileFields(res.profile);
        setTimeout(() => setSaveSuccess(''), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to save doctor profile.');
      }
    } catch (err) {
      setErrorMsg('Error saving profile. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Helpers (Converts file to Base64)
  const handleFileUpload = (e, setField) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('File size exceeds 2.5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setField(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Authentication: Send Email OTP
  const handleSendEmailOtp = async e => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes('@')) {
      setAuthStatusMsg('Please enter a valid email address.');
      return;
    }
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const res = await api.sendDoctorEmailOtp(otpEmail);
      if (res.success) {
        setOtpSent(true);
        setAuthStatusMsg(res.message || 'OTP sent to your email! Please check your inbox.');
      } else {
        setAuthStatusMsg(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setAuthStatusMsg('Network error while requesting OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. Authentication: Verify Email OTP
  const handleVerifyEmailOtp = async e => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setAuthStatusMsg('Please enter the OTP code received.');
      return;
    }
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const res = await api.verifyDoctorEmailOtp(otpEmail, otpCode);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 80,
          spread: 80,
          origin: {
            y: 0.5
          }
        });
        if (onAuthSuccess) onAuthSuccess(res.user);
        if (res.profile) populateProfileFields(res.profile);
        setShowAuthModal(false);
        setOtpSent(false);
        setOtpCode('');
        setSaveSuccess(`Welcome, ${res.user.name}! Logged in via Email OTP.`);
      } else {
        setAuthStatusMsg(res.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setAuthStatusMsg('Verification failed. Check network.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Authentication: Google Login Simulation / One-Tap
  const handleGoogleLogin = async (simulatedAccount = null) => {
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const payload = simulatedAccount || {
        email: email || currentUser?.username || 'doctor@graminarogya.in',
        name: doctorName || currentUser?.name || 'Doctor',
        googleId: 'goog_' + Date.now(),
        picture: profilePhoto || ''
      };
      const res = await api.doctorGoogleLogin(payload);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 90,
          spread: 90,
          origin: {
            y: 0.5
          }
        });
        if (onAuthSuccess) onAuthSuccess(res.user);
        if (res.profile) populateProfileFields(res.profile);
        setShowAuthModal(false);
        setSaveSuccess(`Google sign-in successful! Welcome, ${res.user.name}.`);
      } else {
        setAuthStatusMsg(res.message || 'Google authentication failed.');
      }
    } catch (err) {
      setAuthStatusMsg('Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Mobile Number Data Fetching ("Mobile no thi data fetch that joi")
  const handleFetchByMobile = async e => {
    if (e) e.preventDefault();
    if (!searchMobile || searchMobile.trim().length < 6) {
      setPhoneSearchMsg('Please enter a valid mobile number (e.g. 9876543210 or 9870011224)');
      return;
    }
    setPhoneSearchLoading(true);
    setPhoneSearchMsg('');
    setFetchedDoctorData(null);
    setFetchedPatientData(null);
    try {
      // 1. Try to fetch doctor profile by mobile number
      const docRes = await api.lookupDoctorByPhone(searchMobile);
      if (docRes.success && docRes.doctor) {
        setFetchedDoctorData(docRes.doctor);
      }

      // 2. Try to fetch patient & clinical records by mobile number
      const patRes = await api.lookupPatientByPhone(searchMobile);
      if (patRes.success) {
        setFetchedPatientData(patRes);
      }
      if ((!docRes || !docRes.success) && (!patRes || patRes.count === 0)) {
        setPhoneSearchMsg(`No records found for mobile number ${searchMobile}. You can use this number to create a new profile or register a patient.`);
      } else {
        setPhoneSearchMsg('Data successfully fetched for mobile number: ' + searchMobile);
      }
    } catch (err) {
      setPhoneSearchMsg('Error fetching data for mobile number. Please check connection.');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Load fetched doctor profile directly into editor
  const handleApplyFetchedDoctor = doc => {
    populateProfileFields(doc);
    setActiveSubTab('profile');
    setSaveSuccess(`Applied profile data for ${doc.doctorName} (Mobile: ${doc.phone})`);
  };

  // Load fetched patient details into Prescription Pad
  const handleLoadPatientToRx = patient => {
    setRxPatientName(patient.name);
    setRxPatientAge(patient.age ? String(patient.age) : '30');
    setRxPatientGender(patient.gender || 'Female');
    setRxPatientPhone(patient.phone || searchMobile);
    setRxDiagnosis(patient.chiefComplaint || 'Clinical Consultation');
    if (patient.vitals) {
      setRxVitals(`BP: ${patient.vitals.bp || '120/80'} | SpO2: ${patient.vitals.spo2 || 98}% | Pulse: ${patient.vitals.pulse || 72} bpm | Temp: ${patient.vitals.temp || 98.4}°F`);
    }
    setActiveSubTab('prescriptions');
    setSaveSuccess(`Patient ${patient.name} details loaded into Prescription Pad!`);
  };

  // Add a new medicine row in Rx Pad
  const handleAddMedicine = () => {
    setRxMedicines([...rxMedicines, {
      name: '',
      dosage: '1 tablet once daily',
      duration: '3 days',
      instruction: 'After food'
    }]);
  };

  // Remove medicine row
  const handleRemoveMedicine = idx => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== idx));
  };

  // Print Prescription
  const handlePrintPrescription = () => {
    window.print();
  };
  return <div className="doctor-portal-container" style={{
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: "'Inter', sans-serif"
  }}>

      {/* Top Banner & Doctor Credentials Header */}
      <div style={{
      background: "#000000",
      padding: '28px 32px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      marginBottom: '28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
        {/* Subtle decorative background circles */}
        <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '220px',
        height: '220px',
        pointerEvents: 'none'
      }} />
        <div style={{
        position: 'absolute',
        bottom: '-40px',
        right: '140px',
        width: '160px',
        height: '160px',
        pointerEvents: 'none'
      }} />

        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flex: 1,
        minWidth: '280px',
        zIndex: 1
      }}>
          <div style={{
          position: 'relative'
        }}>
            {profilePhoto ? <img src={profilePhoto} alt={doctorName || 'Doctor'} style={{
            width: '88px',
            height: '88px',
            objectFit: 'cover',
            border: "3px solid #000"
          }} /> : <div style={{
            width: '88px',
            height: '88px',
            border: "3px solid #000",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
                <Stethoscope size={40} color="#a7f3d0" />
              </div>}
            <div style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
              <CheckCircle2 size={15} />
            </div>
          </div>

          <div>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
              <h1 style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
                {doctorName || currentUser?.name || 'Doctor Panel'}
              </h1>
              <span style={{
              border: "1px solid #000",
              padding: '3px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
                <Shield size={12} /> VERIFIED MEDICAL OFFICER
              </span>
            </div>

            <div style={{
            fontSize: '0.92rem',
            marginTop: '4px',
            fontWeight: 600
          }}>
              {specialization ? <>{specialization} {qualification ? `• ${qualification}` : ''}</> : <span style={{
              opacity: 0.85
            }}>Profile loaded from central database</span>}
            </div>

            <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '8px',
            fontSize: '0.78rem',
            flexWrap: 'wrap'
          }}>
              {registrationNumber && <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                  <Award size={14} color="#34d399" /> Reg: <strong>{registrationNumber}</strong>
                </span>}
              {phone && <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                  <Phone size={14} color="#34d399" /> {phone}
                </span>}
              {clinicName && <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                  <Building2 size={14} color="#34d399" /> {clinicName}
                </span>}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        zIndex: 1
      }}>
          <button onClick={() => setActiveSubTab('phoneFetch')} style={{
          border: "1px solid #000",
          padding: '10px 18px',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <Search size={16} />
            Fetch Data by Mobile
          </button>
        </div>
      </div>

      {/* Global Success / Error notifications */}
      {saveSuccess && <div style={{
      border: "1px solid #000",
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.88rem',
      fontWeight: 600
    }}>
          <CheckCircle2 size={18} /> {saveSuccess}
        </div>}

      {errorMsg && <div style={{
      border: "1px solid #000",
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.88rem',
      fontWeight: 600
    }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>}

      {/* ═══════════════════ PROFESSIONAL PILL NAV BAR ═══════════════════ */}
      <div style={{
      background: "#000000",
      padding: '8px',
      marginBottom: '28px',
      border: "1.5px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      overflowX: 'auto',
      flexWrap: 'nowrap'
    }}>
        {/* Tab definitions */}
        {[{
        id: 'history',
        label: 'Patient History',
        icon: <Stethoscope size={16} />,
        activeColor: '#059669',
        activeBg: 'linear-gradient(135deg, #059669, #047857)',
        badge: null
      }, {
        id: 'reminders',
        label: 'Reminders',
        icon: <Bell size={16} />,
        activeColor: '#d97706',
        activeBg: 'linear-gradient(135deg, #d97706, #b45309)',
        badge: pendingReminderCount > 0 ? pendingReminderCount : null
      }, {
        id: 'leaveSchedule',
        label: 'Leave & Schedule',
        icon: <Calendar size={16} />,
        activeColor: '#7c3aed',
        activeBg: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        badge: null
      }, {
        id: 'prescriptions',
        label: 'Rx Pad & Print',
        icon: <FileText size={16} />,
        activeColor: '#0ea5e9',
        activeBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        badge: null
      }, {
        id: 'profile',
        label: 'My Profile',
        icon: <UserCheck size={16} />,
        activeColor: '#059669',
        activeBg: 'linear-gradient(135deg, #059669, #064e3b)',
        badge: null
      }, {
        id: 'branding',
        label: 'Custom Branding',
        icon: <Sparkles size={16} />,
        activeColor: '#ec4899',
        activeBg: 'linear-gradient(135deg, #ec4899, #db2777)',
        badge: null
      }, {
        id: 'phoneFetch',
        label: 'Mobile Lookup',
        icon: <Phone size={16} />,
        activeColor: '#64748b',
        activeBg: 'linear-gradient(135deg, #475569, #334155)',
        badge: null
      }].map(tab => {
        const isActive = activeSubTab === tab.id;
        return <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '9px 16px',
          border: 'none',
          fontWeight: isActive ? 700 : 600,
          fontSize: '0.83rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
          position: 'relative',
          letterSpacing: isActive ? '-0.01em' : '0'
        }}>
              <span style={{
            opacity: isActive ? 1 : 0.65,
            display: 'flex',
            alignItems: 'center'
          }}>
                {tab.icon}
              </span>
              {tab.label}
              {tab.badge && <span style={{
            padding: '1px 7px',
            fontSize: '0.67rem',
            fontWeight: 800,
            minWidth: '18px',
            textAlign: 'center',
            lineHeight: '18px'
          }}>
                  {tab.badge}
                </span>}
            </button>;
      })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 2: PATIENT MEDICAL HISTORY & COMPLETE PROFILE                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && <PatientMedicalHistoryView currentUser={currentUser} initialPatientId={selectedHistoryPatientId} initialTab={historyInitialTab} onLoadPatientToRx={handleLoadPatientToRx} onSetReminderSuccess={() => refreshReminderCount()} />}

      {/* ========================================================================= */}
      {/* TAB: DOCTOR FOLLOW-UP REMINDERS QUEUE                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'reminders' && <DoctorRemindersView onSelectPatientForHistory={patientId => {
      setSelectedHistoryPatientId(patientId);
      setHistoryInitialTab('history');
      setActiveSubTab('history');
    }} onWriteRx={patient => {
      handleLoadPatientToRx(patient);
    }} />}

      {/* ========================================================================= */}
      {/* TAB: DOCTOR LEAVE APPLICATION & OPD SCHEDULE                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'leaveSchedule' && <DoctorLeaveScheduleView currentUser={currentUser} />}

      {/* ========================================================================= */}
      {/* TAB 1: DOCTOR PROFILE MANAGEMENT                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && <form onSubmit={handleSaveProfile}>
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>

            {/* Column 1: Basic Doctor Identity & Registration */}
            <div style={{
          padding: '24px',
          border: "1px solid #000"
        }}>
              <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Stethoscope size={20} color="#059669" /> Doctor Professional Credentials
              </h3>

              {/* Profile Photo Upload */}
              <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
                <img src={profilePhoto || 'https://via.placeholder.com/100'} alt="Doctor avatar" style={{
              width: '72px',
              height: '72px',
              objectFit: 'cover',
              border: "2px solid #000"
            }} />
                <div>
                  <input type="file" ref={profilePhotoInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setProfilePhoto)} />
                  <button type="button" onClick={() => profilePhotoInputRef.current?.click()} style={{
                border: "1px solid #000",
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                    <Camera size={14} /> Upload Profile Photo
                  </button>
                  <div style={{
                fontSize: '0.72rem',
                marginTop: '4px'
              }}>Max 2.5MB (PNG, JPG, WebP)</div>
                </div>
              </div>

              {/* Doctor Name */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Doctor Full Name *
                </label>
                <input type="text" required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Enter Doctor Full Name (e.g. Dr. Name)..." style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Specialization */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Medical Specialization *
                </label>
                <select value={specialization} onChange={e => setSpecialization(e.target.value)} style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '8px'
            }}>
                  <option value="General Medicine & Family Health">General Medicine & Family Health (MBBS/MD)</option>
                  <option value="Cardiology & Critical Care">Cardiology & Critical Care</option>
                  <option value="Obstetrics & Gynecology (Maternity)">Obstetrics & Gynecology (Maternity)</option>
                  <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                  <option value="General Surgery">General Surgery (MS)</option>
                  <option value="Orthopedics & Trauma Surgery">Orthopedics & Trauma Surgery</option>
                  <option value="Pulmonology & Respiratory Care">Pulmonology & Respiratory Care</option>
                  <option value="Dermatology & Venereology">Dermatology & Venereology</option>
                  <option value="Ayush / Public Health Officer">Ayush / Public Health Officer</option>
                </select>
                <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Or enter custom specialization..." style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.82rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Qualifications */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Degrees & Qualifications *
                </label>
                <input type="text" required value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. MBBS, MD (Medicine), CCEBDM, DNB" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* License Number & Medical Council */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Registration / License No. *
                  </label>
                  <input type="text" required value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. GMC-2018-84729" style={{
                width: '100%',
                padding: '10px 12px',
                border: "1px solid #000",
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>

                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Experience (Years)
                  </label>
                  <input type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} style={{
                width: '100%',
                padding: '10px 12px',
                border: "1px solid #000",
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Medical Council / Registering Authority
                </label>
                <input type="text" value={medicalCouncil} onChange={e => setMedicalCouncil(e.target.value)} placeholder="e.g. Gujarat Medical Council / National Medical Commission" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>
            </div>

            {/* Column 2: Contact Info, Clinic Details & Consultation */}
            <div style={{
          padding: '24px',
          border: "1px solid #000"
        }}>
              <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Building2 size={20} color="#059669" /> Contact Information & Practice
              </h3>

              {/* Mobile Number  */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Mobile / Contact Number * (Used for Fast Data Fetch)
                </label>
                <div style={{
              position: 'relative'
            }}>
                  <Phone size={16} color="#9ca3af" style={{
                position: 'absolute',
                left: '12px',
                top: '12px'
              }} />
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-98765-43210" style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: "1px solid #000",
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }} />
                </div>
                <div style={{
              fontSize: '0.72rem',
              marginTop: '4px',
              fontWeight: 600
            }}>
                  💡 Mobile number is indexed so data can be fetched instantly via mobile lookup.
                </div>
              </div>

              {/* Email Address */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Email Address * (For OTP Login & Reports)
                </label>
                <div style={{
              position: 'relative'
            }}>
                  <Mail size={16} color="#9ca3af" style={{
                position: 'absolute',
                left: '12px',
                top: '12px'
              }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com" style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: "1px solid #000",
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              {/* Clinic / Hospital Name */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Clinic / Hospital Name
                </label>
                <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Rampur Primary Health Centre & Care Clinic" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Clinic Address */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Clinic / Facility Physical Address
                </label>
                <input type="text" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} placeholder="e.g. Main Hospital Road, Block HQ" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Consultation Hours & Fee */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Consultation Timings / OPD Hours
                  </label>
                  <input type="text" value={consultationHours} onChange={e => setConsultationHours(e.target.value)} placeholder="e.g. Mon-Sat: 9AM - 1PM, 5PM - 8:30PM" style={{
                width: '100%',
                padding: '10px 12px',
                border: "1px solid #000",
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }} />
                </div>

                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    OPD Fee (₹)
                  </label>
                  <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder="200" style={{
                width: '100%',
                padding: '10px 12px',
                border: "1px solid #000",
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              {/* Clinical Bio */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Professional Summary / Bio
                </label>
                <textarea rows="3" value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief clinical background or service focus..." style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }} />
              </div>

            </div>
          </div>

          {/* Bottom Save Bar */}
          <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
            <button type="button" onClick={loadDoctorProfile} style={{
          border: "1px solid #000",
          padding: '12px 20px',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
              Reset to Saved
            </button>

            <button type="submit" disabled={loading} style={{
          background: "#000000",
          border: 'none',
          padding: '12px 28px',
          fontSize: '0.92rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
              <Save size={18} />
              {loading ? 'Saving Profile...' : 'Save & Update Doctor Profile'}
            </button>
          </div>
        </form>}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOM BRANDING (LOGO, HEADER, FOOTER, SIGNATURE)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && <div>
          <div style={{
        border: "1px solid #000",
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
            <div>
              <h3 style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 800
          }}>
                🏥 Custom Clinic / Hospital Branding Settings
              </h3>
              <p style={{
            margin: '4px 0 0',
            fontSize: '0.82rem'
          }}>
                Set your custom clinic logo, header title, contact bar, and footer legal disclaimer for digital prescriptions and patient slips.
              </p>
            </div>

            <button onClick={() => setActiveSubTab('prescriptions')} style={{
          border: 'none',
          padding: '9px 18px',
          fontSize: '0.82rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
              <FileText size={16} /> Preview Prescription Pad
            </button>
          </div>

          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>

            {/* Left: Logo & Header Settings */}
            <div style={{
          padding: '24px',
          border: "1px solid #000"
        }}>
              <h4 style={{
            margin: '0 0 16px',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <ImageIcon size={18} color="#059669" /> 1. Clinic / Doctor Logo
              </h4>

              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px'
          }}>
                <div style={{
              width: '90px',
              height: '90px',
              border: "2px dashed #000",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
                  {brandingLogo ? <img src={brandingLogo} alt="Clinic Logo" style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }} /> : <span style={{
                fontSize: '0.75rem',
                textAlign: 'center',
                padding: '6px'
              }}>No Logo</span>}
                </div>

                <div>
                  <input type="file" ref={logoInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setBrandingLogo)} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} style={{
                border: "1px solid #000",
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                    <Camera size={14} /> Upload Custom Logo
                  </button>
                  <button type="button" onClick={() => setBrandingLogo('https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=80')} style={{
                border: 'none',
                padding: '6px 0',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'block',
                marginTop: '4px'
              }}>
                    Use Standard Medical Caduceus Logo
                  </button>
                </div>
              </div>

              <h4 style={{
            margin: '24px 0 16px',
            fontSize: '1rem',
            fontWeight: 800
          }}>
                2. Header Configuration
              </h4>

              {/* Header Title */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Prescription Header Title *
                </label>
                <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} placeholder="e.g. Rampur Primary Health Centre (PHC)" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Subtitle */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Subtitle / Affiliation
                </label>
                <input type="text" value={headerSubtitle} onChange={e => setHeaderSubtitle(e.target.value)} placeholder="e.g. Government of Uttar Pradesh • National Rural Health Mission" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Contact bar */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Contact / Hotline Bar
                </label>
                <input type="text" value={headerContact} onChange={e => setHeaderContact(e.target.value)} placeholder="e.g. Emergency: 108 | OPD: +91-98765-43210 | Reg: GMC-2018-84729" style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Color Theme */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Accent Color
                </label>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
                  {['#064e3b', '#047857', '#1e3a8a', '#1e293b', '#831843'].map(c => <button key={c} type="button" onClick={() => setHeaderBgColor(c)} style={{
                width: '32px',
                height: '32px',
                border: headerBgColor === c ? '3px solid #10b981' : '2px solid #ffffff',
                cursor: 'pointer'
              }} />)}
                  <input type="color" value={headerBgColor} onChange={e => setHeaderBgColor(e.target.value)} style={{
                width: '40px',
                height: '34px',
                cursor: 'pointer',
                border: 'none'
              }} />
                </div>
              </div>
            </div>

            {/* Right: Footer, Signature & Disclaimer */}
            <div style={{
          padding: '24px',
          border: "1px solid #000"
        }}>
              <h4 style={{
            margin: '0 0 16px',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <PenTool size={18} color="#059669" /> 3. Footer & Digital Signature
              </h4>

              {/* Footer Text / Disclaimer */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Prescription Footer Disclaimer / Instructions *
                </label>
                <textarea rows="4" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Enter standard disclaimer, validity period, emergency phone numbers, or notes for patients..." style={{
              width: '100%',
              padding: '10px 14px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }} />
              </div>

              {/* Digital Signature */}
              <div style={{
            marginBottom: '20px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Doctor's Digital Signature / Medical Stamp
                </label>
                <div style={{
              border: "2px dashed #000",
              padding: '16px',
              textAlign: 'center'
            }}>
                  {signatureImage ? <div style={{
                marginBottom: '10px'
              }}>
                      <img src={signatureImage} alt="Digital Signature" style={{
                  maxHeight: '60px',
                  objectFit: 'contain'
                }} />
                    </div> : <div style={{
                fontSize: '0.82rem',
                marginBottom: '10px'
              }}>
                      No signature image uploaded yet. (Doctor's name & GMC license will be printed as sign-off).
                    </div>}

                  <input type="file" ref={signatureInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setSignatureImage)} />

                  <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px'
              }}>
                    <button type="button" onClick={() => signatureInputRef.current?.click()} style={{
                  border: "1px solid #000",
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                      <Camera size={14} /> Upload Signature
                    </button>
                    {signatureImage && <button type="button" onClick={() => setSignatureImage('')} style={{
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}>
                        Remove
                      </button>}
                  </div>
                </div>
              </div>

              {/* Live Mini Preview Card */}
              <div style={{
            border: "1px solid #000",
            padding: '16px',
            marginTop: '20px'
          }}>
                <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
                  Live Header/Footer Preview Snippet
                </div>
                <div style={{
              padding: '10px 14px'
            }}>
                  <div style={{
                fontWeight: 800,
                fontSize: '0.95rem'
              }}>{headerTitle || 'Clinic Header Title'}</div>
                  <div style={{
                fontSize: '0.72rem',
                opacity: 0.85
              }}>{headerSubtitle}</div>
                </div>
                <div style={{
              padding: '10px 14px',
              border: "1px solid #000",
              borderTop: 'none'
            }}>
                  <div style={{
                fontSize: '0.72rem',
                fontStyle: 'italic'
              }}>
                    {footerText || 'Footer disclaimer will appear here...'}
                  </div>
                </div>
              </div>

              <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
                <button type="button" onClick={handleSaveProfile} disabled={loading} style={{
              background: "#000000",
              border: 'none',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                  <Save size={16} /> Save Branding Settings
                </button>
              </div>

            </div>

          </div>
        </div>}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE BRANDED PRESCRIPTION PAD & PRINT                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'prescriptions' && <div>
          {/* Controls Bar */}
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
            <div>
              <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800
          }}>
                📄 Digital Prescription Pad
              </h3>
              <p style={{
            margin: '4px 0 0',
            fontSize: '0.82rem'
          }}>
                Interactive A4 layout rendering real-time branding, patient history, medication advice, and verification QR.
              </p>
            </div>

            <div style={{
          display: 'flex',
          gap: '10px'
        }}>
              <button type="button" onClick={handleAddMedicine} style={{
            border: "1px solid #000",
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                <Plus size={16} /> Add Medicine
              </button>

              <button type="button" onClick={handlePrintPrescription} style={{
            background: "#000000",
            border: 'none',
            padding: '9px 20px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Printer size={16} /> Print / Export PDF Prescription
              </button>
            </div>
          </div>

          {/* Real A4 Prescription Paper Simulation */}
          <div id="printable-prescription" style={{
        border: "1px solid #000",
        padding: '0',
        overflow: 'hidden',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
            {/* Custom Branded Header */}
            <div style={{
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
                {brandingLogo && <img src={brandingLogo} alt="Logo" style={{
              width: '68px',
              height: '68px',
              objectFit: 'contain',
              padding: '4px'
            }} />}
                <div>
                  <h2 style={{
                margin: 0,
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.02em'
              }}>
                    {headerTitle || 'GraminArogya Rural Clinic'}
                  </h2>
                  <div style={{
                fontSize: '0.84rem',
                marginTop: '3px',
                fontWeight: 500
              }}>
                    {headerSubtitle || 'Department of Health & Family Welfare'}
                  </div>
                  <div style={{
                fontSize: '0.74rem',
                marginTop: '6px'
              }}>
                    {headerContact || `Phone: ${phone} | Reg: ${registrationNumber}`}
                  </div>
                </div>
              </div>

              <div style={{
            textAlign: 'right',
            display: 'none',
            md: 'block'
          }}>
                <div style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>CONSULTATION SLIP</div>
                <div style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              marginTop: '2px'
            }}>{new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</div>
              </div>
            </div>

            {/* Doctor Info Subheader */}
            <div style={{
          borderBottom: "2px solid #000",
          padding: '14px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
              <div>
                <strong style={{
              fontSize: '1.05rem'
            }}>{doctorName}</strong>
                <span style={{
              fontSize: '0.82rem',
              marginLeft: '8px'
            }}>({qualification})</span>
                <div style={{
              fontSize: '0.78rem',
              marginTop: '2px'
            }}>
                  {specialization} • Reg No: <strong style={{}}>{registrationNumber}</strong> ({medicalCouncil})
                </div>
              </div>

              <div style={{
            fontSize: '0.78rem',
            textAlign: 'right'
          }}>
                <div><strong>Facility:</strong> {clinicName}</div>
                <div style={{}}>{clinicAddress}</div>
              </div>
            </div>

            {/* Patient Metadata Section */}
            <div style={{
          padding: '20px 32px',
          borderBottom: "1px dashed #000"
        }}>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            fontSize: '0.85rem'
          }}>
                <div>
                  <span style={{
                display: 'block',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Patient Name</span>
                  <input type="text" value={rxPatientName} onChange={e => setRxPatientName(e.target.value)} style={{
                fontWeight: 700,
                border: 'none',
                borderBottom: "1px solid #000",
                width: '100%',
                outline: 'none',
                padding: '2px 0'
              }} />
                </div>

                <div>
                  <span style={{
                display: 'block',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Age / Gender</span>
                  <div style={{
                display: 'flex',
                gap: '6px'
              }}>
                    <input type="text" value={rxPatientAge} onChange={e => setRxPatientAge(e.target.value)} placeholder="Age" style={{
                  width: '40px',
                  border: 'none',
                  borderBottom: "1px solid #000",
                  outline: 'none',
                  fontWeight: 600
                }} />
                    <span>Yrs /</span>
                    <input type="text" value={rxPatientGender} onChange={e => setRxPatientGender(e.target.value)} placeholder="Gender" style={{
                  width: '65px',
                  border: 'none',
                  borderBottom: "1px solid #000",
                  outline: 'none',
                  fontWeight: 600
                }} />
                  </div>
                </div>

                <div>
                  <span style={{
                display: 'block',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Mobile Number</span>
                  <input type="text" value={rxPatientPhone} onChange={e => setRxPatientPhone(e.target.value)} style={{
                fontWeight: 600,
                border: 'none',
                borderBottom: "1px solid #000",
                width: '100%',
                outline: 'none',
                padding: '2px 0'
              }} />
                </div>

                <div>
                  <span style={{
                display: 'block',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Prescription Date</span>
                  <span style={{
                fontWeight: 600
              }}>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Vitals Snapshot */}
              <div style={{
            marginTop: '14px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem'
          }}>
                <strong>Vitals:</strong>
                <input type="text" value={rxVitals} onChange={e => setRxVitals(e.target.value)} style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontWeight: 600
            }} />
              </div>
            </div>

            {/* Clinical Diagnosis & Rx Symbol */}
            <div style={{
          padding: '24px 32px'
        }}>
              <div style={{
            marginBottom: '16px'
          }}>
                <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>Provisional Clinical Diagnosis</span>
                <input type="text" value={rxDiagnosis} onChange={e => setRxDiagnosis(e.target.value)} style={{
              width: '100%',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              borderBottom: "1px solid #000",
              outline: 'none',
              marginTop: '4px',
              padding: '4px 0'
            }} />
              </div>

              {/* Rx Stethoscope Header */}
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
                <span style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              fontFamily: 'serif'
            }}>℞</span>
                <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>MEDICATIONS & DOSAGE SCHEDULE</span>
              </div>

              {/* Medicines Table */}
              <div style={{
            border: "1px solid #000",
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
                <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.84rem'
            }}>
                  <thead>
                    <tr style={{
                  borderBottom: "1px solid #000",
                  fontSize: '0.74rem',
                  textTransform: 'uppercase'
                }}>
                      <th style={{
                    padding: '10px 14px',
                    width: '38%'
                  }}>Medicine Name & Strength</th>
                      <th style={{
                    padding: '10px 14px',
                    width: '26%'
                  }}>Dosage Schedule</th>
                      <th style={{
                    padding: '10px 14px',
                    width: '18%'
                  }}>Duration</th>
                      <th style={{
                    padding: '10px 14px',
                    width: '18%'
                  }}>Instruction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rxMedicines.map((med, idx) => <tr key={idx} style={{
                  borderBottom: "1px solid #000"
                }}>
                        <td style={{
                    padding: '10px 14px'
                  }}>
                          <input type="text" value={med.name} onChange={e => {
                      const updated = [...rxMedicines];
                      updated[idx].name = e.target.value;
                      setRxMedicines(updated);
                    }} placeholder="Enter medicine..." style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontWeight: 700
                    }} />
                        </td>
                        <td style={{
                    padding: '10px 14px'
                  }}>
                          <input type="text" value={med.dosage} onChange={e => {
                      const updated = [...rxMedicines];
                      updated[idx].dosage = e.target.value;
                      setRxMedicines(updated);
                    }} placeholder="e.g. 1 tab thrice daily" style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none'
                    }} />
                        </td>
                        <td style={{
                    padding: '10px 14px'
                  }}>
                          <input type="text" value={med.duration} onChange={e => {
                      const updated = [...rxMedicines];
                      updated[idx].duration = e.target.value;
                      setRxMedicines(updated);
                    }} placeholder="e.g. 5 days" style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none'
                    }} />
                        </td>
                        <td style={{
                    padding: '10px 14px'
                  }}>
                          <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                            <input type="text" value={med.instruction} onChange={e => {
                        const updated = [...rxMedicines];
                        updated[idx].instruction = e.target.value;
                        setRxMedicines(updated);
                      }} placeholder="After food" style={{
                        width: '80%',
                        border: 'none',
                        outline: 'none'
                      }} />
                            {rxMedicines.length > 1 && <button type="button" onClick={() => handleRemoveMedicine(idx)} style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px'
                      }}>
                                <Trash2 size={13} />
                              </button>}
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Special Advice / Clinical Notes */}
              <div style={{
            marginBottom: '24px'
          }}>
                <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>Doctor Advice & Precautions</span>
                <textarea rows="2" value={rxAdvice} onChange={e => setRxAdvice(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              outline: 'none',
              marginTop: '4px',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }} />
              </div>

              {/* Signature & Stamp Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px dashed #cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    padding: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <QRCodeSVG
                      value={JSON.stringify({
                        type: 'SITH_PRESCRIPTION_VERIFICATION',
                        patient: patientName,
                        phone: phone || '',
                        doctor: doctorName,
                        reg: registrationNumber,
                        verified: true
                      })}
                      size={64}
                      level="M"
                    />
                    <span style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Scan to Verify</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <div>Security Key: <strong>GA-DOC-VERIFIED-{phone ? phone.slice(-4) : '7890'}</strong></div>
                    <div>Digitally Generated on GraminArogya Medical Platform</div>
                    <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>Authorized Digital Prescription • NHA Compliant</div>
                  </div>
                </div>

                <div style={{
              textAlign: 'center',
              minWidth: '180px'
            }}>
                  {signatureImage ? <img src={signatureImage} alt="Doctor Signature" style={{
                maxHeight: '50px',
                marginBottom: '6px'
              }} /> : <div style={{
                fontFamily: 'cursive',
                fontSize: '1.2rem',
                marginBottom: '4px'
              }}>
                      {doctorName}
                    </div>}
                  <div style={{
                borderTop: "1px solid #000",
                paddingTop: '4px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                    {doctorName}
                  </div>
                  <div style={{
                fontSize: '0.72rem'
              }}>
                    {qualification} • Reg: {registrationNumber}
                  </div>
                </div>
              </div>

            </div>

            {/* Custom Branded Footer */}
            <div style={{
          borderTop: "2px solid #000",
          padding: '16px 32px',
          fontSize: '0.72rem',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
              {footerText || 'Notice: Valid for 7 days. Not valid for medico-legal purposes. In case of emergency, visit nearest CHC / District Hospital or call 108.'}
            </div>

          </div>
        </div>}

      {/* ========================================================================= */}
      {/* TAB 4: MOBILE DATA FETCH ("Mobile no thi data fetch that joi")             */}
      {/* ========================================================================= */}
      {activeSubTab === 'phoneFetch' && <div>
          <div style={{
        padding: '28px',
        border: "1px solid #000",
        marginBottom: '24px'
      }}>
            <h3 style={{
          margin: '0 0 8px',
          fontSize: '1.25rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
              <Search size={22} color="#059669" />
              Mobile Number Data Fetch
            </h3>
            <p style={{
          margin: '0 0 20px',
          fontSize: '0.85rem',
          lineHeight: 1.5
        }}>
              Enter any 10-digit mobile number to automatically fetch the matching <strong>Doctor Profile</strong> or <strong>Patient Clinical History, Vitals & Referral Records</strong> directly from the central database.
            </p>

            {/* Mobile Input & Fetch Button */}
            <form onSubmit={handleFetchByMobile} style={{
          display: 'flex',
          gap: '12px',
          maxWidth: '600px',
          flexWrap: 'wrap'
        }}>
              <div style={{
            flex: 1,
            minWidth: '240px',
            position: 'relative'
          }}>
                <Phone size={18} color="#9ca3af" style={{
              position: 'absolute',
              left: '14px',
              top: '13px'
            }} />
                <input type="text" value={searchMobile} onChange={e => setSearchMobile(e.target.value)} placeholder="Enter 10-digit mobile (e.g. 9876543210 or 9870011224)" style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              border: "1px solid #000",
              fontSize: '0.92rem',
              outline: 'none',
              boxSizing: 'border-box'
            }} />
              </div>

              <button type="submit" disabled={phoneSearchLoading} style={{
            background: "#000000",
            border: 'none',
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Search size={16} />
                {phoneSearchLoading ? 'Fetching...' : 'Fetch Data by Mobile'}
              </button>
            </form>

            <div style={{
          marginTop: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.8rem'
        }}>
              <span>💡 Enter any registered doctor mobile or patient phone number to fetch records directly from the database.</span>
            </div>

            {phoneSearchMsg && <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          fontSize: '0.84rem',
          fontWeight: 600
        }}>
                {phoneSearchMsg}
              </div>}
          </div>

          {/* Results Display */}
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>

            {/* Fetched Doctor Profile Card */}
            {fetchedDoctorData && <div style={{
          padding: '24px',
          border: "2px solid #000"
        }}>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
                  <span style={{
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
                    DOCTOR PROFILE FOUND
                  </span>
                  <span style={{
              fontSize: '0.78rem'
            }}>ID: {fetchedDoctorData.doctorId}</span>
                </div>

                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px'
          }}>
                  <img src={fetchedDoctorData.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'} alt="Doctor" style={{
              width: '60px',
              height: '60px',
              objectFit: 'cover',
              border: "2px solid #000"
            }} />
                  <div>
                    <h4 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 800
              }}>{fetchedDoctorData.doctorName}</h4>
                    <div style={{
                fontSize: '0.82rem',
                fontWeight: 600
              }}>{fetchedDoctorData.specialization}</div>
                    <div style={{
                fontSize: '0.76rem'
              }}>{fetchedDoctorData.qualification}</div>
                  </div>
                </div>

                <div style={{
            fontSize: '0.82rem',
            lineHeight: 1.6,
            marginBottom: '16px'
          }}>
                  <div>📞 <strong>Phone:</strong> {fetchedDoctorData.phone}</div>
                  <div>✉️ <strong>Email:</strong> {fetchedDoctorData.email || 'N/A'}</div>
                  <div>🛡️ <strong>Reg/License:</strong> {fetchedDoctorData.registrationNumber}</div>
                  <div>🏥 <strong>Clinic:</strong> {fetchedDoctorData.clinicName}</div>
                </div>

                <button type="button" onClick={() => handleApplyFetchedDoctor(fetchedDoctorData)} style={{
            width: '100%',
            border: 'none',
            padding: '10px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
                  <UserCheck size={16} /> Load this Doctor Profile in Editor
                </button>
              </div>}

            {/* Fetched Patient Clinical History */}
            {fetchedPatientData && fetchedPatientData.patients && fetchedPatientData.patients.length > 0 && <div style={{
          padding: '24px',
          border: "1px solid #000",
          gridColumn: fetchedDoctorData ? 'span 1' : 'span 2'
        }}>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
                  <h4 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                    <Heart size={18} color="#dc2626" /> Patient Records Found ({fetchedPatientData?.patients?.length || 0})
                  </h4>
                  <span style={{
              fontSize: '0.75rem'
            }}>Mobile: {fetchedPatientData.cleanPhone}</span>
                </div>

                <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
                  {(fetchedPatientData?.patients || []).map(p => <div key={p.id || p._id} style={{
              border: "1px solid #000",
              padding: '16px'
            }}>
                      <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                        <div>
                          <strong style={{
                    fontSize: '0.98rem'
                  }}>{p.name}</strong>
                          <span style={{
                    fontSize: '0.82rem',
                    marginLeft: '6px'
                  }}>({p.age} Yrs • {p.gender})</span>
                          <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginTop: '2px'
                  }}>
                            📍 Village: {p.village} • ASHA: {p.ashaWorkerName}
                          </div>
                        </div>

                        <span style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                          {p.riskLevel || 'LOW'} RISK
                        </span>
                      </div>

                      <div style={{
                fontSize: '0.82rem',
                marginTop: '10px'
              }}>
                        <strong>Chief Complaint:</strong> {p.chiefComplaint}
                      </div>

                      {p.vitals && <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px',
                fontSize: '0.74rem',
                flexWrap: 'wrap'
              }}>
                          <span>BP: <strong>{p.vitals.bp}</strong></span>
                          <span>SpO2: <strong>{p.vitals.spo2}%</strong></span>
                          <span>Pulse: <strong>{p.vitals.pulse} bpm</strong></span>
                          <span>Temp: <strong>{p.vitals.temp}°F</strong></span>
                        </div>}

                      <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                        <button type="button" onClick={() => {
                  setSelectedHistoryPatientId(p.id || p.phone || p._id);
                  setHistoryInitialTab('profile');
                  setActiveSubTab('history');
                }} style={{
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                          <Edit3 size={14} /> ✏️ Edit Profile
                        </button>

                        <button type="button" onClick={() => {
                  setSelectedHistoryPatientId(p.id || p.phone || p._id);
                  setHistoryInitialTab('history');
                  setActiveSubTab('history');
                }} style={{
                  border: "1px solid #000",
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                          <FileText size={14} /> 📋 History
                        </button>

                        <button type="button" onClick={() => handleLoadPatientToRx(p)} style={{
                  border: 'none',
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                          <FileText size={14} /> Write Prescription
                        </button>
                      </div>
                    </div>)}
                </div>
              </div>}

          </div>
        </div>}

      {/* ========================================================================= */}
      {/* AUTH MODAL FOR DOCTOR: GOOGLE LOGIN & EMAIL OTP LOGIN                     */}
      {/* ========================================================================= */}
      {showAuthModal && <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
          <div style={{
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden'
      }}>
            {/* Modal Header */}
            <div style={{
          background: "#000000",
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
                <Stethoscope size={22} color="#34d399" />
                <div>
                  <h3 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800
              }}>Doctor Authentication</h3>
                  <div style={{
                fontSize: '0.75rem'
              }}>Login via Google or Email OTP Verification</div>
                </div>
              </div>

              <button type="button" onClick={() => setShowAuthModal(false)} style={{
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}>
                ✕
              </button>
            </div>

            {/* Auth Switcher Tabs */}
            <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: "1px solid #000"
        }}>
              <button type="button" onClick={() => {
            setAuthMode('emailOtp');
            setAuthStatusMsg('');
          }} style={{
            padding: '12px',
            border: 'none',
            borderBottom: authMode === 'emailOtp' ? '2px solid #059669' : 'none',
            fontWeight: authMode === 'emailOtp' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}>
                ✉️ Email OTP Login
              </button>

              <button type="button" onClick={() => {
            setAuthMode('google');
            setAuthStatusMsg('');
          }} style={{
            padding: '12px',
            border: 'none',
            borderBottom: authMode === 'google' ? '2px solid #059669' : 'none',
            fontWeight: authMode === 'google' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}>
                🌐 Google Login
              </button>
            </div>

            <div style={{
          padding: '24px'
        }}>
              {authStatusMsg && <div style={{
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
                  {authStatusMsg}
                </div>}

              {/* 1. EMAIL OTP LOGIN */}
              {authMode === 'emailOtp' && <div>
                  {!otpSent ? <form onSubmit={handleSendEmailOtp}>
                      <div style={{
                marginBottom: '16px'
              }}>
                        <label style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}>
                          Enter Registered Doctor Email
                        </label>
                        <input type="email" required value={otpEmail} onChange={e => setOtpEmail(e.target.value)} placeholder="doctor@graminarogya.in" style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: "1px solid #000",
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }} />
                      </div>

                      <button type="submit" disabled={authLoading} style={{
                width: '100%',
                background: "#000000",
                border: 'none',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                        {authLoading ? 'Generating & Sending OTP...' : 'Send OTP to Mail for Authentication'}
                      </button>
                    </form> : <form onSubmit={handleVerifyEmailOtp}>
                      <div style={{
                marginBottom: '16px'
              }}>
                        <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                          <label style={{
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                            Enter 6-Digit OTP Code
                          </label>
                          <button type="button" onClick={() => setOtpSent(false)} style={{
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}>
                            Change Email
                          </button>
                        </div>
                        <input type="text" required maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="e.g. 123456" style={{
                  width: '100%',
                  padding: '12px',
                  border: "2px solid #000",
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 800,
                  boxSizing: 'border-box'
                }} />
                      </div>


                      <button type="submit" disabled={authLoading} style={{
                width: '100%',
                background: "#000000",
                border: 'none',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                        {authLoading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                      </button>
                    </form>}
                </div>}

              {/* 2. GOOGLE LOGIN */}
              {authMode === 'google' && <div style={{
            textAlign: 'center'
          }}>
                  <p style={{
              fontSize: '0.85rem',
              marginBottom: '20px',
              lineHeight: 1.5
            }}>
                    Sign in with your Google Medical Practitioner account to sync your verified credentials, registration license, and hospital schedule.
                  </p>

                  <button type="button" onClick={() => handleGoogleLogin()} disabled={authLoading} style={{
              width: '100%',
              border: "1px solid #000",
              padding: '12px 16px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div style={{
              marginTop: '16px',
              fontSize: '0.74rem'
            }}>
                    Secured by Google Identity Services • SIH 2026
                  </div>
                </div>}

            </div>
          </div>
        </div>}

      {/* Print Styles for clean A4 printing without UI elements */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>

    </div>;
}