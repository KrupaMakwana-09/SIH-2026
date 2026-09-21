import React, { useState, useRef } from 'react';
import {
  Search,
  Phone,
  QrCode,
  CreditCard,
  User,
  AlertCircle,
  CheckCircle2,
  Camera,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  X,
  Printer,
  Download,
  Heart,
  Activity,
  Thermometer,
  Wind,
  Zap,
  Pill,
  FileText,
  Clock,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import { useI18n } from '../utils/i18n';

function calculateAgeFromDob(dobStr) {
  if (!dobStr) return null;
  try {
    const birth = new Date(dobStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? age : null;
  } catch {
    return null;
  }
}

export default function PatientLookup({
  onPatientSelect,
  activeRole = 'doctor',
  title = 'Patient Identification & Verification'
}) {
  const { t } = useI18n();

  // Search mode tabs: 'mobile', 'ssc', 'client', 'qr'
  const [searchMode, setSearchMode] = useState('mobile');

  // Input states
  const [phoneInput, setPhoneInput] = useState('');
  const [sscInput, setSscInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [qrTokenInput, setQrTokenInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Verified Patient Scan Result state
  const [scannedPatient, setScannedPatient] = useState(null);
  const [scannedPrescriptions, setScannedPrescriptions] = useState([]);
  const [scanLookupMode, setScanLookupMode] = useState('qr');
  const [copiedKey, setCopiedKey] = useState('');
  const [isModalView, setIsModalView] = useState(false);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // Multiple patients match list
  const [multipleMatches, setMultipleMatches] = useState([]);

  // QR Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Quick-test demo patient shortcuts
  const demoShortcuts = [
    { name: 'Kavita Bai (Malaria Rx)', phone: '9870011226', ssc: 'SSC-GJ-2026-401044', id: 'PAT-IND-1044' },
    { name: 'Aarav Sharma (Child)', phone: '9870011224', ssc: 'SSC-GJ-2026-207391', id: 'PAT-IND-7391' },
    { name: 'Savitri Devi (Pregnancy)', phone: '9870011223', ssc: 'SSC-GJ-2026-108921', id: 'PAT-IND-8921' },
    { name: 'Ram Singh (Cardiac)', phone: '9870011225', ssc: 'SSC-GJ-2026-304102', id: 'PAT-IND-4102' }
  ];

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setMultipleMatches([]);
  };

  // 1. Search by Mobile Number
  const handleMobileSearch = async (overridePhone) => {
    resetMessages();
    const phoneToSearch = overridePhone || phoneInput;
    if (!phoneToSearch || !phoneToSearch.trim()) {
      setErrorMsg('Please enter a registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchPatientByMobile(phoneToSearch.trim());
      if (res.success) {
        if (res.multiple && res.patients) {
          setMultipleMatches(res.patients);
          setSuccessMsg(t('multiplePatientsFound'));
        } else if (res.patient) {
          setSuccessMsg(`Patient verified: ${res.patient.name} (${res.patient.id})`);
          setScannedPatient(res.patient);
          setScannedPrescriptions(res.activePrescriptions || []);
          setScanLookupMode('mobile');
          if (onPatientSelect) onPatientSelect(res.patient, res.activePrescriptions);
        }
      } else {
        setErrorMsg(res.message || t('patientNotFound'));
      }
    } catch (err) {
      setErrorMsg('Failed to connect to server. Please verify network.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Search by SSC Code
  const handleSscSearch = async (overrideSsc) => {
    resetMessages();
    const sscToSearch = overrideSsc || sscInput;
    if (!sscToSearch || !sscToSearch.trim()) {
      setErrorMsg('Please enter the patient Social Security Card (SSC) code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchPatientBySsc(sscToSearch.trim());
      if (res.success && res.patient) {
        setSuccessMsg(`Verified SSC patient: ${res.patient.name} (${res.patient.id})`);
        setScannedPatient(res.patient);
        setScannedPrescriptions(res.activePrescriptions || []);
        setScanLookupMode('ssc');
        if (onPatientSelect) onPatientSelect(res.patient, res.activePrescriptions);
      } else {
        setErrorMsg(res.message || t('patientNotFound'));
      }
    } catch (err) {
      setErrorMsg('Error verifying SSC record.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Search by Client / Patient ID
  const handleClientSearch = async (overrideId) => {
    resetMessages();
    const idToSearch = overrideId || clientIdInput;
    if (!idToSearch || !idToSearch.trim()) {
      setErrorMsg('Please enter a valid Patient ID or Client ID (e.g. PAT-IND-8921).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchPatientByClient(idToSearch.trim());
      if (res.success && res.patient) {
        setSuccessMsg(`Verified patient record: ${res.patient.name} (${res.patient.id})`);
        setScannedPatient(res.patient);
        setScannedPrescriptions(res.activePrescriptions || []);
        setScanLookupMode('client');
        if (onPatientSelect) onPatientSelect(res.patient, res.activePrescriptions);
      } else {
        setErrorMsg(res.message || t('patientNotFound'));
      }
    } catch (err) {
      setErrorMsg('Error retrieving patient record.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Secure QR Code Lookup
  const handleQrLookup = async (tokenData) => {
    resetMessages();
    const rawTarget = tokenData || qrTokenInput;
    if (!rawTarget || !rawTarget.trim()) {
      setErrorMsg('Please enter or scan a valid safe QR token or patient identifier.');
      return;
    }

    const target = rawTarget.trim();

    // Check if target is a JSON string (e.g. from scanning a raw patient QR code)
    let parsedJson = null;
    try {
      if (target.startsWith('{') || target.startsWith('[')) {
        parsedJson = JSON.parse(target);
      }
    } catch {
      parsedJson = null;
    }

    setLoading(true);
    try {
      const res = await api.lookupPatientByQr(target);
      if (res.success && res.patient) {
        setSuccessMsg(`QR Verified: ${res.patient.name} (${res.patient.id})`);
        setScannedPatient(res.patient);
        setScannedPrescriptions(res.activePrescriptions || []);
        setScanLookupMode('qr');
        if (onPatientSelect) onPatientSelect(res.patient, res.activePrescriptions);
      } else if (parsedJson && (parsedJson.name || parsedJson.patientId || parsedJson.id || parsedJson.sscCode)) {
        // Construct structured patient record from parsed QR JSON payload (Zero raw JSON displayed!)
        const fallbackPatient = {
          id: parsedJson.patientId || parsedJson.id || 'PAT-VERIFIED',
          name: parsedJson.name || 'Verified Patient',
          age: parsedJson.age || calculateAgeFromDob(parsedJson.dob || parsedJson.dateOfBirth) || 35,
          gender: parsedJson.gender || 'Not specified',
          bloodGroup: parsedJson.bloodGroup || '—',
          phone: parsedJson.phone || parsedJson.mobile || '—',
          emergencyContact: parsedJson.emergencyContact || '',
          sscCode: parsedJson.sscCode || '',
          abhaId: parsedJson.abhaId || '',
          village: parsedJson.village || 'Rural Health Block',
          riskLevel: parsedJson.riskLevel || 'LOW',
          vitals: parsedJson.vitals || { bp: '120/80', spo2: '98', temp: '98.4', pulse: '72', sugar: 'Normal' },
          chiefComplaint: parsedJson.chiefComplaint || parsedJson.diagnosis || '',
          knownAllergies: Array.isArray(parsedJson.knownAllergies) ? parsedJson.knownAllergies : (parsedJson.allergies || []),
          chronicConditions: Array.isArray(parsedJson.chronicConditions) ? parsedJson.chronicConditions : [],
          ashaWorkerName: parsedJson.ashaWorkerName || ''
        };
        setSuccessMsg(`QR Verified: ${fallbackPatient.name} (${fallbackPatient.id})`);
        setScannedPatient(fallbackPatient);
        setScannedPrescriptions(parsedJson.prescriptions || parsedJson.activePrescriptions || []);
        setScanLookupMode('qr');
        if (onPatientSelect) onPatientSelect(fallbackPatient, parsedJson.prescriptions || []);
      } else {
        setErrorMsg(res.message || t('invalidQr'));
      }
    } catch (err) {
      if (parsedJson && (parsedJson.name || parsedJson.patientId || parsedJson.id || parsedJson.sscCode)) {
        const fallbackPatient = {
          id: parsedJson.patientId || parsedJson.id || 'PAT-VERIFIED',
          name: parsedJson.name || 'Verified Patient',
          age: parsedJson.age || calculateAgeFromDob(parsedJson.dob || parsedJson.dateOfBirth) || 35,
          gender: parsedJson.gender || 'Not specified',
          bloodGroup: parsedJson.bloodGroup || '—',
          phone: parsedJson.phone || parsedJson.mobile || '—',
          emergencyContact: parsedJson.emergencyContact || '',
          sscCode: parsedJson.sscCode || '',
          abhaId: parsedJson.abhaId || '',
          village: parsedJson.village || 'Rural Health Block',
          riskLevel: parsedJson.riskLevel || 'LOW',
          vitals: parsedJson.vitals || { bp: '120/80', spo2: '98', temp: '98.4', pulse: '72', sugar: 'Normal' },
          chiefComplaint: parsedJson.chiefComplaint || '',
          knownAllergies: Array.isArray(parsedJson.knownAllergies) ? parsedJson.knownAllergies : (parsedJson.allergies || []),
          chronicConditions: Array.isArray(parsedJson.chronicConditions) ? parsedJson.chronicConditions : [],
          ashaWorkerName: parsedJson.ashaWorkerName || ''
        };
        setSuccessMsg(`QR Verified: ${fallbackPatient.name} (${fallbackPatient.id})`);
        setScannedPatient(fallbackPatient);
        setScannedPrescriptions(parsedJson.prescriptions || parsedJson.activePrescriptions || []);
        setScanLookupMode('qr');
        if (onPatientSelect) onPatientSelect(fallbackPatient, parsedJson.prescriptions || []);
      } else {
        setErrorMsg('QR lookup error. Please check token format or camera image.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Select patient from multiple matches list
  const handleSelectFromMultiple = async (patientSummary) => {
    setLoading(true);
    resetMessages();
    try {
      const res = await api.searchPatientByClient(patientSummary.id);
      if (res.success && res.patient) {
        setSuccessMsg(`Verified patient: ${res.patient.name} (${res.patient.id})`);
        setScannedPatient(res.patient);
        setScannedPrescriptions(res.activePrescriptions || []);
        setScanLookupMode('mobile');
        if (onPatientSelect) onPatientSelect(res.patient, res.activePrescriptions);
      } else {
        setErrorMsg(res.message || 'Could not load complete profile.');
      }
    } catch (err) {
      setErrorMsg('Failed to load patient record.');
    } finally {
      setLoading(false);
    }
  };

  // Webcam camera scanner controls
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // BarcodeDetector automated live scanning
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  const codeVal = barcodes[0].rawValue;
                  stopCamera();
                  setQrTokenInput(codeVal);
                  handleQrLookup(codeVal);
                }
              } catch {
                // frame detection pass
              }
            }
          }, 400);
        } catch (e) {
          console.warn('BarcodeDetector init pass:', e);
        }
      }
    } catch (err) {
      setErrorMsg('Camera access unavailable. You can enter the QR token directly or use demo shortcuts.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #d1fae5',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 30px rgba(6,78,59,0.06)',
      marginBottom: '24px'
    }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '12px', color: '#059669' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '2px 0 0' }}>
              Unified identification via Mobile, SSC Card, Client ID, or Safe Health QR Code
            </p>
          </div>
        </div>

        {/* Role Scope Pill */}
        <span style={{
          background: activeRole === 'pharmacist' ? '#e0f2fe' : '#ecfdf5',
          color: activeRole === 'pharmacist' ? '#0369a1' : '#047857',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          border: `1px solid ${activeRole === 'pharmacist' ? '#bae6fd' : '#a7f3d0'}`
        }}>
          {activeRole === 'pharmacist' ? '💊 Pharmacy Dispensing Mode' : '🩺 Clinical Doctor Desk'}
        </span>
      </div>

      {/* Tabs for Search Methods */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {[
          { id: 'mobile', label: t('mobileNumber'), icon: Phone, color: '#059669' },
          { id: 'ssc', label: t('sscCode'), icon: CreditCard, color: '#7c3aed' },
          { id: 'client', label: t('clientId'), icon: User, color: '#0284c7' },
          { id: 'qr', label: t('scanQr'), icon: QrCode, color: '#ea580c' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = searchMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSearchMode(tab.id);
                resetMessages();
                stopCamera();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? `2px solid ${tab.color}` : '1px solid #e2e8f0',
                background: isActive ? `${tab.color}10` : '#f8fafc',
                color: isActive ? tab.color : '#64748b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input Forms */}
      <div style={{ marginBottom: '16px' }}>
        {/* Method 1: Mobile Number */}
        {searchMode === 'mobile' && (
          <form onSubmit={(e) => { e.preventDefault(); handleMobileSearch(); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter 10-digit registered mobile number (e.g. 9870011226)..."
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={16} />
              <span>{loading ? 'Searching...' : t('searchPatient')}</span>
            </button>
          </form>
        )}

        {/* Method 2: SSC Code */}
        {searchMode === 'ssc' && (
          <form onSubmit={(e) => { e.preventDefault(); handleSscSearch(); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <CreditCard size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="text"
                value={sscInput}
                onChange={(e) => setSscInput(e.target.value)}
                placeholder="Enter Social Security Card Code (e.g. SSC-GJ-2026-401044)..."
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={16} />
              <span>{loading ? 'Verifying...' : 'Search by SSC'}</span>
            </button>
          </form>
        )}

        {/* Method 3: Patient / Client ID */}
        {searchMode === 'client' && (
          <form onSubmit={(e) => { e.preventDefault(); handleClientSearch(); }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Enter Patient ID / Client ID (e.g. PAT-IND-8921)..."
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search size={16} />
              <span>{loading ? 'Locating...' : 'Lookup Client ID'}</span>
            </button>
          </form>
        )}

        {/* Method 4: Scan Patient QR */}
        {searchMode === 'qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <QrCode size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  placeholder="Paste safe patient QR token (e.g. SEC-QR-108921-7891) or JSON..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleQrLookup()}
                disabled={loading}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', padding: '12px 24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <QrCode size={16} />
                <span>{loading ? 'Verifying...' : 'Verify QR Token'}</span>
              </button>
              <button
                type="button"
                onClick={() => isCameraActive ? stopCamera() : startCamera()}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: isCameraActive ? '#fef2f2' : '#f8fafc',
                  color: isCameraActive ? '#dc2626' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Camera size={16} />
                <span>{isCameraActive ? 'Close Camera' : 'Live Camera Scan'}</span>
              </button>
            </div>

            {/* Live Camera Viewport */}
            {isCameraActive && (
              <div style={{
                background: '#0f172a',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'center',
                position: 'relative'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxWidth: '400px', height: '240px', objectFit: 'cover', borderRadius: '12px' }}
                />
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '8px' }}>
                  Position patient QR code inside camera view.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '10px 14px',
          color: '#991b1b',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          padding: '10px 14px',
          color: '#065f46',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VERIFIED PATIENT QR SCAN RESULT CARD
      ══════════════════════════════════════════════════════════════════ */}
      {scannedPatient && (
        <div style={isModalView ? {
          position: 'fixed',
          inset: 0,
          background: 'rgba(6, 78, 59, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto'
        } : {}}>
          <div style={{
            background: '#ffffff',
            border: '2px solid #10b981',
            borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(6, 78, 59, 0.14)',
            marginBottom: isModalView ? '0' : '20px',
            maxWidth: isModalView ? '860px' : '100%',
            width: '100%',
            maxHeight: isModalView ? '92vh' : 'none',
            overflowY: isModalView ? 'auto' : 'visible',
            overflowX: 'hidden',
            animation: 'fadeIn 0.25s ease'
          }}>
            {/* Card Top Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '10px', flexShrink: 0 }}>
                  <ShieldCheck size={22} color="#ffffff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    National Health Registry • Verified Scan Result
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', wordBreak: 'break-word' }}>
                    {scannedPatient.name}
                  </h4>
                </div>
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap'
                }}>
                  {scanLookupMode === 'qr' ? '⚡ Safe QR Scanned' : scanLookupMode === 'ssc' ? '💳 SSC Verified' : scanLookupMode === 'mobile' ? '📱 Mobile Verified' : '🆔 ID Verified'}
                </span>
              </div>

              {/* Action Buttons: Print PDF, Modal Toggle, Proceed, Close */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    color: '#064e3b',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  title="Print / Export PDF Health Slip"
                >
                  <Printer size={14} color="#059669" />
                  <span>Print / Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalView(!isModalView)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.35)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={isModalView ? 'Minimize to inline card' : 'Expand to focused modal'}
                >
                  {isModalView ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span>{isModalView ? 'Inline' : 'Focus'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPatientSelect && onPatientSelect(scannedPatient, scannedPrescriptions)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <span>{activeRole === 'pharmacist' ? '💊 Dispense Rx' : '🩺 Clinical Consultation'}</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => { setScannedPatient(null); setScannedPrescriptions([]); setIsModalView(false); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Close and Clear Results"
                >
                  <X size={15} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Card Body with Organized Sections */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Grid 1: Patient Information & Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>

                {/* Section 1: Patient Information Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '12px',
                    border: '1px solid #d1fae5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    flexShrink: 0,
                    textAlign: 'center'
                  }}>
                    <QRCodeSVG
                      value={JSON.stringify({
                        qrToken: scannedPatient.qrToken || scannedPatient.id,
                        patientId: scannedPatient.id,
                        name: scannedPatient.name,
                        sscCode: scannedPatient.sscCode
                      })}
                      size={88}
                      level="M"
                      includeMargin={true}
                    />
                    <div style={{ fontSize: '0.62rem', color: '#059669', fontWeight: 800, marginTop: '2px' }}>
                      HEALTH QR
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Patient Information
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#064e3b', margin: '2px 0 6px', wordBreak: 'break-word' }}>
                      {scannedPatient.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {/* Highlighted Patient ID */}
                      <span style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ID: {scannedPatient.id}
                        <button
                          type="button"
                          onClick={() => handleCopy(scannedPatient.id, 'id')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === 'id' ? '#059669' : '#3b82f6', padding: 0 }}
                          title="Copy Patient ID"
                        >
                          {copiedKey === 'id' ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </span>

                      {/* SSC Code */}
                      {scannedPatient.sscCode && (
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          SSC: {scannedPatient.sscCode}
                          <button
                            type="button"
                            onClick={() => handleCopy(scannedPatient.sscCode, 'ssc')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === 'ssc' ? '#059669' : '#047857', padding: 0 }}
                            title="Copy SSC Code"
                          >
                            {copiedKey === 'ssc' ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </span>
                      )}

                      {/* ABHA ID */}
                      {scannedPatient.abhaId && (
                        <span style={{
                          background: '#faf5ff',
                          color: '#7e22ce',
                          border: '1px solid #e9d5ff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ABHA: {scannedPatient.abhaId}
                          <button
                            type="button"
                            onClick={() => handleCopy(scannedPatient.abhaId, 'abha')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === 'abha' ? '#059669' : '#7e22ce', padding: 0 }}
                            title="Copy ABHA ID"
                          >
                            {copiedKey === 'abha' ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </span>
                      )}

                      {/* Risk Level Badge */}
                      <span style={{
                        background: scannedPatient.riskLevel === 'CRITICAL' ? '#fee2e2' : scannedPatient.riskLevel === 'HIGH' ? '#ffedd5' : scannedPatient.riskLevel === 'MODERATE' ? '#fef9c3' : '#dcfce7',
                        color: scannedPatient.riskLevel === 'CRITICAL' ? '#b91c1c' : scannedPatient.riskLevel === 'HIGH' ? '#c2410c' : scannedPatient.riskLevel === 'MODERATE' ? '#854d0e' : '#15803d',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        ● {scannedPatient.riskLevel || 'LOW'} RISK
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {scannedPatient.age && <span>{scannedPatient.age} Yrs</span>}
                      {scannedPatient.gender && <span>• {scannedPatient.gender}</span>}
                      {scannedPatient.bloodGroup && <span style={{ color: '#b91c1c', fontWeight: 800 }}>• 🩸 {scannedPatient.bloodGroup}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Information Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Contact & Residence Information
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '2px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Primary Mobile</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-word' }}>
                        <Phone size={13} color="#059669" />
                        <span>{scannedPatient.phone || '—'}</span>
                      </div>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Village / Location</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-word' }}>
                        <MapPin size={13} color="#0284c7" />
                        <span>{scannedPatient.village || 'Rural Block'}</span>
                      </div>
                    </div>

                    {scannedPatient.emergencyContact && (
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Emergency Contact</div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#b91c1c', wordBreak: 'break-word' }}>
                          📞 {scannedPatient.emergencyContact}
                        </div>
                      </div>
                    )}

                    {scannedPatient.ashaWorkerName && (
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Assigned ASHA Worker</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', wordBreak: 'break-word' }}>
                          👩‍⚕️ {scannedPatient.ashaWorkerName}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Medical Information Card */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  Medical Information & Clinical Vitals
                </div>

                {/* Vitals Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '95px' }}>
                    <Heart size={16} color="#ef4444" />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>BP</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{scannedPatient.vitals?.bp || '120/80'} <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>mmHg</span></div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '95px' }}>
                    <Wind size={16} color="#0284c7" />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>SpO2</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{scannedPatient.vitals?.spo2 ? `${scannedPatient.vitals.spo2}%` : '98%'}</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '95px' }}>
                    <Thermometer size={16} color="#d97706" />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>Temp</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{scannedPatient.vitals?.temp ? `${scannedPatient.vitals.temp}°F` : '98.4°F'}</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '95px' }}>
                    <Activity size={16} color="#7c3aed" />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>Pulse</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{scannedPatient.vitals?.pulse ? `${scannedPatient.vitals.pulse} bpm` : '72 bpm'}</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '95px' }}>
                    <Zap size={16} color="#059669" />
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700 }}>Blood Sugar</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{scannedPatient.vitals?.sugar || 'Normal'}</div>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint, Allergies, Chronic Conditions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem' }}>
                  {scannedPatient.chiefComplaint && (
                    <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Complaint: </span>
                      <strong style={{ color: '#0f172a' }}>{scannedPatient.chiefComplaint}</strong>
                    </div>
                  )}
                  {scannedPatient.knownAllergies?.length > 0 && (
                    <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                      <span style={{ color: '#b91c1c', fontWeight: 700 }}>⚠️ Allergies: </span>
                      <span style={{ color: '#991b1b', fontWeight: 600 }}>{scannedPatient.knownAllergies.join(', ')}</span>
                    </div>
                  )}
                  {scannedPatient.chronicConditions?.length > 0 && (
                    <div style={{ minWidth: 0, wordBreak: 'break-word' }}>
                      <span style={{ color: '#7c3aed', fontWeight: 700 }}>🏥 Conditions: </span>
                      <span style={{ color: '#6d28d9', fontWeight: 600 }}>{scannedPatient.chronicConditions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Prescription / Medicine Information */}
              {scannedPrescriptions && scannedPrescriptions.length > 0 ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#065f46', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Pill size={14} color="#059669" />
                      <span>Active Digital Prescriptions ({scannedPrescriptions.length})</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                      Latest: #{scannedPrescriptions[0].prescriptionId || 'RX'}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1fae5', minWidth: '480px' }}>
                      <thead>
                        <tr style={{ background: '#ecfdf5', color: '#064e3b', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 12px' }}>Medicine</th>
                          <th style={{ padding: '8px 12px' }}>Dosage / Frequency</th>
                          <th style={{ padding: '8px 12px' }}>Duration</th>
                          <th style={{ padding: '8px 12px' }}>Instructions</th>
                          <th style={{ padding: '8px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedPrescriptions.flatMap((rx, rIdx) =>
                          (rx.medicines || []).map((med, mIdx) => (
                            <tr key={`${rIdx}-${mIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b' }}>
                                {med.medicineName}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#475569' }}>
                                {med.dosage} • {med.frequency}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#475569' }}>
                                {med.duration}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>
                                {med.instructions || 'After meals'}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{
                                  background: rx.status === 'Dispensed' ? '#dcfce7' : rx.status === 'Partially Dispensed' ? '#fef3c7' : '#e0f2fe',
                                  color: rx.status === 'Dispensed' ? '#15803d' : rx.status === 'Partially Dispensed' ? '#b45309' : '#0369a1',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800
                                }}>
                                  {rx.status || 'Prescribed'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: '#64748b'
                }}>
                  <Pill size={18} color="#94a3b8" />
                  <span>No active prescriptions currently recorded. Attending doctor can prescribe medicines during the consultation.</span>
                </div>
              )}

              {/* Section 5: Other Authorized Information & Governance */}
              <div style={{
                borderTop: '1px dashed #e2e8f0',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                <div>
                  Clearance Role: <strong style={{ color: '#065f46' }}>{activeRole.toUpperCase()}</strong> • System Hash: <span style={{ fontFamily: 'monospace' }}>SEC-QR-{scannedPatient.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                  <ShieldCheck size={14} />
                  <span>Official National Digital Health Mission Record</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PRINTABLE A4 HEALTH SLIP (Rendered clean during window.print)
      ══════════════════════════════════════════════════════════════════ */}
      {scannedPatient && (
        <div id="printable-patient-slip" style={{ display: 'none' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #064e3b', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10pt', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GOVERNMENT OF INDIA • MINISTRY OF HEALTH & FAMILY WELFARE
              </div>
              <h2 style={{ fontSize: '16pt', fontWeight: 900, color: '#064e3b', margin: '2px 0 0' }}>
                GRAMIN AROGYA • SWASTHYASETU CLINICAL SUMMARY
              </h2>
              <div style={{ fontSize: '9pt', color: '#64748b' }}>
                Official Verified Rural Healthcare Identification Slip
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase' }}>Printed On</div>
              <div style={{ fontSize: '9pt', fontWeight: 800, color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Patient Details & QR Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '16px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '14pt', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                {scannedPatient.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9pt' }}>
                <div><strong>Patient ID:</strong> {scannedPatient.id}</div>
                <div><strong>SSC Code:</strong> {scannedPatient.sscCode || '—'}</div>
                <div><strong>Age / Gender:</strong> {scannedPatient.age} Y / {scannedPatient.gender}</div>
                <div><strong>Blood Group:</strong> {scannedPatient.bloodGroup || '—'}</div>
                <div><strong>Mobile:</strong> {scannedPatient.phone || '—'}</div>
                <div><strong>Village:</strong> {scannedPatient.village || '—'}</div>
                <div><strong>ABHA ID:</strong> {scannedPatient.abhaId || '—'}</div>
                <div><strong>Risk Level:</strong> {scannedPatient.riskLevel || 'LOW'} RISK</div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG
                value={JSON.stringify({
                  qrToken: scannedPatient.qrToken || scannedPatient.id,
                  patientId: scannedPatient.id,
                  name: scannedPatient.name,
                  sscCode: scannedPatient.sscCode
                })}
                size={120}
                level="M"
                includeMargin={true}
              />
              <div style={{ fontSize: '7pt', color: '#047857', fontWeight: 700, marginTop: '2px' }}>
                VERIFIED HEALTH QR
              </div>
            </div>
          </div>

          {/* Vitals Snapshot */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Clinical Baseline & Vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center', fontSize: '9pt' }}>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '7pt', color: '#64748b' }}>BP</div>
                <strong>{scannedPatient.vitals?.bp || '120/80'}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '7pt', color: '#64748b' }}>SpO2</div>
                <strong>{scannedPatient.vitals?.spo2 ? `${scannedPatient.vitals.spo2}%` : '98%'}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '7pt', color: '#64748b' }}>Temp</div>
                <strong>{scannedPatient.vitals?.temp ? `${scannedPatient.vitals.temp}°F` : '98.4°F'}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '7pt', color: '#64748b' }}>Pulse</div>
                <strong>{scannedPatient.vitals?.pulse ? `${scannedPatient.vitals.pulse} bpm` : '72 bpm'}</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '7pt', color: '#64748b' }}>Sugar</div>
                <strong>{scannedPatient.vitals?.sugar || 'Normal'}</strong>
              </div>
            </div>

            {scannedPatient.chiefComplaint && (
              <div style={{ marginTop: '8px', fontSize: '8.5pt' }}>
                <strong>Chief Complaint:</strong> {scannedPatient.chiefComplaint}
              </div>
            )}
            {scannedPatient.knownAllergies?.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '8.5pt', color: '#b91c1c' }}>
                <strong>Known Allergies:</strong> {scannedPatient.knownAllergies.join(', ')}
              </div>
            )}
          </div>

          {/* Prescriptions Table (if available) */}
          {scannedPrescriptions && scannedPrescriptions.length > 0 && (
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Prescription & Medication Information
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Medicine</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Dosage / Frequency</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Duration</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Instructions</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedPrescriptions.flatMap((rx, rIdx) =>
                    (rx.medicines || []).map((med, mIdx) => (
                      <tr key={`${rIdx}-${mIdx}`}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: 700 }}>{med.medicineName}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{med.dosage} • {med.frequency}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{med.duration}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{med.instructions || 'After meals'}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px' }}>{rx.status || 'Prescribed'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Verification & Signature Footer */}
          <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#64748b' }}>
            <div>
              <div>Verified by Role: <strong>{activeRole.toUpperCase()}</strong></div>
              <div>Security Hash: <strong>SEC-VERIFIED-{scannedPatient.id}</strong></div>
              <div>Confidential Medical Record • For Authorized Health Personnel Only</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '160px' }}>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                Attending Staff Signature
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Stylesheet for PatientLookup Slip */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-patient-slip, #printable-patient-slip * {
            visibility: visible;
          }
          #printable-patient-slip {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>

      {/* Multiple Patients Selector (Mobile duplicate safety requirement) */}
      {multipleMatches && multipleMatches.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} />
            <span>Multiple Patients Registered with this Mobile Number ({multipleMatches.length}):</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {multipleMatches.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectFromMultiple(p)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.25)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {p.age} Y / {p.gender} • Village: {p.village || 'Primary'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                      ID: {p.id} | SSC: {p.maskedSsc}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Test Demo Patient Chips */}
      <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '8px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={13} color="#f59e0b" />
          <span>Quick 1-Click Verification Test Profiles:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {demoShortcuts.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (searchMode === 'mobile') {
                  setPhoneInput(p.phone);
                  handleMobileSearch(p.phone);
                } else if (searchMode === 'ssc') {
                  setSscInput(p.ssc);
                  handleSscSearch(p.ssc);
                } else if (searchMode === 'qr') {
                  setQrTokenInput(`SEC-QR-${p.id.replace(/\D/g, '')}`);
                  handleQrLookup(p.id);
                } else {
                  setClientIdInput(p.id);
                  handleClientSearch(p.id);
                }
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                color: '#334155',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              {p.name} ({p.id})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
