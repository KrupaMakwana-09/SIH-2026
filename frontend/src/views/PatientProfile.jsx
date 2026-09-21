import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Phone, Mail, MapPin, Calendar, Heart, Shield, Activity, Edit3, Save, X, Loader, AlertCircle, CheckCircle2, Clock, Droplets, Stethoscope, FileText, LocateFixed, ChevronDown, ChevronUp, Thermometer, Wind, Zap, Plus, Check, Bell, QrCode, Download, Printer, Maximize2, Minimize2, Pill } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
function computeAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || m === 0 && today.getDate() < birth.getDate()) age--;
  return age;
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
function formatDateForInput(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
function VitalPill({
  icon: Icon,
  label,
  value,
  unit,
  color = '#059669'
}) {
  return <div style={{
    border: `1.5px solid ${color}22`,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textAlign: 'center',
    minWidth: '90px'
  }}>
      <Icon size={18} color={color} />
      <div style={{
      fontSize: '1.1rem',
      fontWeight: 900
    }}>{value || '—'}</div>
      {unit && <div style={{
      fontSize: '0.6rem',
      fontWeight: 600
    }}>{unit}</div>}
      <div style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }}>{label}</div>
    </div>;
}
function SectionCard({
  id,
  title,
  icon: Icon,
  color = '#059669',
  action,
  children
}) {
  return <div id={id} style={{
    border: "1px solid #000",
    padding: '20px',
    marginBottom: '20px',
    scrollMarginTop: '80px'
  }}>
      <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      paddingBottom: '12px',
      borderBottom: "1px solid #000"
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <div style={{
          padding: '6px'
        }}><Icon size={18} color={color} /></div>
          <h3 style={{
          fontSize: '1rem',
          fontWeight: 800,
          margin: 0
        }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>;
}
export default function PatientProfile({
  currentUser,
  onProfileUpdated
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userData, setUserData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const qrCanvasRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    village: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    vitals: {
      bp: '',
      spo2: '',
      temp: '',
      pulse: '',
      sugar: ''
    },
    knownAllergies: [],
    chronicConditions: []
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState(null);

  // OTP Verification state (auto-fetches email from profile — no manual input)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [devOtpPreview, setDevOtpPreview] = useState('');
  const [pendingFormData, setPendingFormData] = useState(null);
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getMyPatientProfile();
      if (res.success && res.user) {
        setUserData(res.user);
        setPatientData(res.patient || null);
        setPrescriptions(Array.isArray(res.prescriptions) ? res.prescriptions : []);
        setForm({
          name: res.user?.name || '',
          phone: res.user?.phone || '',
          email: res.user?.email || '',
          village: res.user?.village || res.patient?.village || '',
          dateOfBirth: formatDateForInput(res.user?.dateOfBirth || res.patient?.dateOfBirth),
          gender: res.user?.gender || res.patient?.gender || '',
          bloodGroup: res.user?.bloodGroup || res.patient?.bloodGroup || '',
          emergencyContact: res.user?.emergencyContact || res.patient?.emergencyContact || '',
          vitals: res.patient?.vitals || {
            bp: '',
            spo2: '',
            temp: '',
            pulse: '',
            sugar: ''
          },
          knownAllergies: Array.isArray(res.patient?.knownAllergies) ? res.patient.knownAllergies : [],
          chronicConditions: Array.isArray(res.patient?.chronicConditions) ? res.patient.chronicConditions : []
        });
      } else {
        setError(res?.message || 'Could not load profile from database.');
      }
    } catch (e) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadProfile();
    // Live polling for patient profile & follow-ups (every 10 seconds)
    const interval = setInterval(() => {
      if (!isEditing) {
        api.getMyPatientProfile().then(res => {
          if (res.success && res.patient) {
            setPatientData(res.patient);
            if (Array.isArray(res.prescriptions)) setPrescriptions(res.prescriptions);
          }
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadProfile, isEditing]);
  const handleStartEditing = targetSectionId => {
    setForm({
      name: userData?.name || currentUser?.name || '',
      phone: userData?.phone || currentUser?.phone || '',
      email: userData?.email || currentUser?.email || '',
      village: userData?.village || patientData?.village || currentUser?.village || '',
      dateOfBirth: formatDateForInput(userData?.dateOfBirth || patientData?.dateOfBirth || currentUser?.dateOfBirth),
      gender: userData?.gender || patientData?.gender || currentUser?.gender || '',
      bloodGroup: userData?.bloodGroup || patientData?.bloodGroup || currentUser?.bloodGroup || '',
      emergencyContact: userData?.emergencyContact || patientData?.emergencyContact || currentUser?.emergencyContact || '',
      vitals: patientData?.vitals || {
        bp: '',
        spo2: '',
        temp: '',
        pulse: '',
        sugar: ''
      },
      knownAllergies: Array.isArray(patientData?.knownAllergies) ? patientData.knownAllergies : [],
      chronicConditions: Array.isArray(patientData?.chronicConditions) ? patientData.chronicConditions : []
    });
    setError('');
    setSuccessMsg('');
    setIsEditing(true);
    if (targetSectionId && typeof targetSectionId === 'string') {
      setTimeout(() => {
        const el = document.getElementById(targetSectionId);
        if (el) {
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 60);
    }
  };
  const handleGpsDetect = async () => {
    setGpsDetecting(true);
    try {
      const coords = await getLivePosition();
      const geo = await reverseGeocode(coords.lat, coords.lng);
      const parts = [geo.village || geo.shortAddress, geo.district && geo.district !== geo.village ? geo.district : null, geo.postcode ? `PIN ${geo.postcode}` : null].filter(Boolean);
      setForm(f => ({
        ...f,
        village: parts.join(', ') || geo.shortAddress
      }));
    } catch (e) {
      console.warn('GPS:', e);
    } finally {
      setGpsDetecting(false);
    }
  };

  // Step 1: User clicks "Save" — trigger OTP send to registered email
  const handleSave = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Store form data and open OTP modal
    const cleanVitals = {
      bp: form.vitals?.bp || '',
      spo2: form.vitals?.spo2 !== undefined && form.vitals?.spo2 !== '' ? Number(form.vitals.spo2) : undefined,
      temp: form.vitals?.temp !== undefined && form.vitals?.temp !== '' ? Number(form.vitals.temp) : undefined,
      pulse: form.vitals?.pulse !== undefined && form.vitals?.pulse !== '' ? Number(form.vitals.pulse) : undefined,
      sugar: form.vitals?.sugar || ''
    };
    setPendingFormData({
      ...form,
      userId: userData?.id || userData?._id || currentUser?.id || currentUser?._id,
      vitals: cleanVitals
    });
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('');
    setShowOtpModal(true);

    // Auto-trigger OTP send immediately
    setOtpSending(true);
    try {
      const res = await api.sendPatientProfileOtp();
      if (res.success) {
        setOtpSent(true);
        setOtpMaskedEmail(res.maskedEmail || '');
        setOtpMsg(res.message || 'OTP sent to your registered email.');
      } else {
        setOtpMsg(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setOtpMsg('Network error. Could not send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: User submits OTP — verify then save profile
  const handleOtpVerifyAndSave = async e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpVerifying(true);
    setOtpMsg('');
    try {
      const verifyRes = await api.verifyPatientProfileOtp(otpCode.trim());
      if (!verifyRes.success) {
        setOtpMsg(verifyRes.message || 'Invalid OTP. Please try again.');
        setOtpVerifying(false);
        return;
      }
      // OTP verified — now save profile
      setSaving(true);
      const res = await api.updateMyPatientProfile(pendingFormData);
      if (res.success) {
        setUserData(res.user);
        setPatientData(res.patient);
        const stored = localStorage.getItem('gramin_arogya_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem('gramin_arogya_user', JSON.stringify({
              ...parsed,
              ...res.user
            }));
          } catch {}
        }
        if (onProfileUpdated) onProfileUpdated(res.user);
        setSuccessMsg('Profile updated successfully in database! ✅');
        setIsEditing(false);
        setShowOtpModal(false);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            y: 0.6
          }
        });
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setOtpMsg(res.message || 'Failed to save profile.');
      }
    } catch {
      setOtpMsg('Network error. Failed to save.');
    } finally {
      setOtpVerifying(false);
      setSaving(false);
    }
  };
  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setForm(f => ({
      ...f,
      knownAllergies: [...f.knownAllergies, newAllergy.trim()]
    }));
    setNewAllergy('');
  };
  const removeAllergy = idx => setForm(f => ({
    ...f,
    knownAllergies: f.knownAllergies.filter((_, i) => i !== idx)
  }));
  const addCondition = () => {
    if (!newCondition.trim()) return;
    setForm(f => ({
      ...f,
      chronicConditions: [...f.chronicConditions, newCondition.trim()]
    }));
    setNewCondition('');
  };
  const removeCondition = idx => setForm(f => ({
    ...f,
    chronicConditions: f.chronicConditions.filter((_, i) => i !== idx)
  }));
  const displayAge = computeAge(userData?.dateOfBirth || form.dateOfBirth);
  const medicalHistory = patientData?.medicalHistory || [];
  const followUpReminders = patientData?.followUpReminders || [];
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1.5px solid #d1fae5',
    fontSize: '0.88rem',
    outline: 'none',
    background: '#fafffe',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };
  const labelStyle = {
    fontSize: '0.73rem',
    fontWeight: 700,
    color: '#64748b',
    display: 'block',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  };
  if (loading) {
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px'
    }}>
        <div style={{
        width: '56px',
        height: '56px',
        border: "4px solid #000",
        borderTopColor: "#000"
      }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
        fontWeight: 700
      }}>Loading your health profile from database...</div>
      </div>;
  }
  return <div style={{
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      {/* Header */}
      <div style={{
      background: "#000000",
      padding: '28px 28px 24px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
        <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '200px',
        height: '200px'
      }} />
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
            <div style={{
            width: '64px',
            height: '64px',
            background: "#000000",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            border: "3px solid #000"
          }}>👤</div>
            <div>
              <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>Registered Patient • GraminArogya</div>
              <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              margin: '4px 0 2px',
              letterSpacing: '-0.5px'
            }}>{userData?.name || currentUser?.name || 'Patient'}</h1>
              <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
                {userData?.phone && <span style={{
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}><Phone size={12} /> {userData.phone}</span>}
                {displayAge && <span style={{
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}><Calendar size={12} /> {displayAge} years</span>}
                {(userData?.gender || patientData?.gender) && <span style={{
                fontSize: '0.8rem'
              }}>{userData?.gender || patientData?.gender}</span>}
                {(userData?.bloodGroup || patientData?.bloodGroup) && <span style={{
                fontSize: '0.75rem',
                padding: '1px 8px',
                fontWeight: 800
              }}>🩸 {userData?.bloodGroup || patientData?.bloodGroup}</span>}
              </div>
            </div>
          </div>
          <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
            {isEditing ? <>
                <button type="button" onClick={handleSave} disabled={saving} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}>
                  {saving ? <Loader size={14} style={{}} /> : <Save size={14} />}
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
                <button type="button" onClick={() => {
              setIsEditing(false);
              loadProfile();
            }} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              border: "1px solid #000",
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}>
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </> : <button type="button" onClick={handleStartEditing} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: "2px solid #000",
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}>
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>}
          </div>
        </div>
        {patientData?.abhaId && <div style={{
        marginTop: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <Shield size={14} color="#a7f3d0" />
            <span style={{
          fontSize: '0.77rem',
          fontFamily: 'monospace',
          fontWeight: 700
        }}>ABHA: {patientData.abhaId}</span>
          </div>}
      </div>

      {/* Banners */}
      {successMsg && <div style={{
      marginBottom: '16px',
      padding: '12px 18px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700
    }}><CheckCircle2 size={18} /> {successMsg}</div>}
      {error && <div style={{
      marginBottom: '16px',
      padding: '12px 18px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700
    }}><AlertCircle size={18} /> {error}</div>}

      {/* Permissions Scope Banner */}
      <div style={{
      background: "#000000",
      border: "1.5px solid #000",
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
        <div style={{
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
          <Shield size={18} />
        </div>
        <div style={{
        flex: 1,
        fontSize: '0.82rem',
        lineHeight: 1.45
      }}>
          <div style={{
          fontWeight: 800,
          fontSize: '0.88rem',
          marginBottom: '2px'
        }}>
            Patient Self-Service Access & Attending Doctor Permissions
          </div>
          <div>
            <strong>You can edit:</strong> Your personal demographics, mobile number, email, residence location, emergency contact, and self-reported health notes.
          </div>
          <div style={{
          marginTop: '2px'
        }}>
            <strong>Doctor permissions:</strong> Your attending physician is authorized to verify and update your clinical baselines (Blood Group, Vitals, Diagnosed Conditions, Allergies, Clinical Health Status & Remarks).
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <SectionCard id="sec-personal" title="Personal Information" icon={User} color="#059669" action={!isEditing && <button type="button" onClick={() => handleStartEditing('sec-personal')} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Edit3 size={12} /> Edit Details
          </button>}>
        {isEditing ? <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
            {[['Full Name *', 'name', 'text', 'Your full name'], ['📱 Mobile', 'phone', 'text', '+91-XXXXX-XXXXX'], ['✉️ Email', 'email', 'email', 'your@email.com']].map(([lbl, key, type, ph]) => <div key={key}><label style={labelStyle}>{lbl}</label><input type={type} style={inputStyle} value={form[key]} onChange={e => setForm(f => ({
            ...f,
            [key]: e.target.value
          }))} placeholder={ph} /></div>)}
            <div><label style={labelStyle}>📅 Date of Birth</label><input type="date" style={inputStyle} value={form.dateOfBirth} onChange={e => setForm(f => ({
            ...f,
            dateOfBirth: e.target.value
          }))} /></div>
            <div><label style={labelStyle}>⚧ Gender</label><select style={{
            ...inputStyle
          }} value={form.gender} onChange={e => setForm(f => ({
            ...f,
            gender: e.target.value
          }))}><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div><label style={labelStyle}>🩸 Blood Group</label><select style={{
            ...inputStyle
          }} value={form.bloodGroup} onChange={e => setForm(f => ({
            ...f,
            bloodGroup: e.target.value
          }))}><option value="">Select...</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}</select></div>
            <div style={{
          gridColumn: '1 / -1'
        }}>
              <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
                <label style={labelStyle}>📍 Village / Location</label>
                <button type="button" onClick={handleGpsDetect} disabled={gpsDetecting} style={{
              border: 'none',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}><LocateFixed size={11} /> {gpsDetecting ? 'Detecting...' : 'Auto GPS'}</button>
              </div>
              <input style={inputStyle} value={form.village} onChange={e => setForm(f => ({
            ...f,
            village: e.target.value
          }))} placeholder="Village, District, PIN..." />
            </div>
          </div> : <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px 24px'
          }}>
            {[{
              label: 'Email',
              value: userData?.email,
              icon: Mail
            }, {
              label: 'Mobile',
              value: userData?.phone,
              icon: Phone
            }, {
              label: 'Date of Birth',
              value: formatDate(userData?.dateOfBirth),
              icon: Calendar
            }, {
              label: 'Age',
              value: displayAge ? `${displayAge} years` : null,
              icon: User
            }, {
              label: 'Gender',
              value: userData?.gender || patientData?.gender,
              icon: User
            }, {
              label: 'Blood Group',
              value: userData?.bloodGroup || patientData?.bloodGroup,
              icon: Droplets
            }, {
              label: 'Location',
              value: userData?.village || patientData?.village,
              icon: MapPin
            }, {
              label: 'Username',
              value: userData?.username,
              icon: User
            }].map(({
              label,
              value,
              icon: Icon
            }) => value ? <div key={label} style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}><Icon size={11} /> {label}</div>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: 1.4
                }}>{value}</div>
              </div> : null)}
          </div>}
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard id="sec-emergency" title="Emergency Contact" icon={AlertCircle} color="#dc2626" action={!isEditing && <button type="button" onClick={() => handleStartEditing('sec-emergency')} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Edit3 size={12} /> Edit Contact
          </button>}>
        {isEditing ? <input style={inputStyle} value={form.emergencyContact} onChange={e => setForm(f => ({
        ...f,
        emergencyContact: e.target.value
      }))} placeholder="Emergency contact phone number..." /> : <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
            <Phone size={18} color="#dc2626" />
            <span style={{
          fontSize: '1rem',
          fontWeight: 700
        }}>{userData?.emergencyContact || patientData?.emergencyContact || '—'}</span>
            {!(userData?.emergencyContact || patientData?.emergencyContact) && <button type="button" onClick={handleStartEditing} style={{
          border: 'none',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          textDecoration: 'underline'
        }}>+ Add Emergency Contact</button>}
          </div>}
      </SectionCard>

      {/* Vitals */}
      <SectionCard id="sec-vitals" title="Current Vitals & Health Status" icon={Activity} color="#0ea5e9" action={!isEditing && <button type="button" onClick={() => handleStartEditing('sec-vitals')} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Edit3 size={12} /> Update Vitals
          </button>}>
        {isEditing ? <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
            {[['bp', 'Blood Pressure', '120/80'], ['spo2', 'SpO2 (%)', '98'], ['temp', 'Temp (°F)', '98.4'], ['pulse', 'Pulse (bpm)', '72'], ['sugar', 'Blood Sugar', 'Normal']].map(([key, lbl, ph]) => <div key={key}><label style={labelStyle}>{lbl}</label><input style={inputStyle} value={form.vitals[key] || ''} placeholder={ph} onChange={e => setForm(f => ({
            ...f,
            vitals: {
              ...f.vitals,
              [key]: e.target.value
            }
          }))} /></div>)}
          </div> : <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
            <VitalPill icon={Heart} label="BP" value={patientData?.vitals?.bp} unit="mmHg" color="#ef4444" />
            <VitalPill icon={Wind} label="SpO2" value={patientData?.vitals?.spo2 ? `${patientData.vitals.spo2}%` : null} color="#0ea5e9" />
            <VitalPill icon={Thermometer} label="Temp" value={patientData?.vitals?.temp ? `${patientData.vitals.temp}°F` : null} color="#f59e0b" />
            <VitalPill icon={Activity} label="Pulse" value={patientData?.vitals?.pulse} unit="bpm" color="#8b5cf6" />
            <VitalPill icon={Zap} label="Sugar" value={patientData?.vitals?.sugar} color="#059669" />
          </div>}
        {patientData?.currentHealthStatus?.summary && <div style={{
        marginTop: '14px',
        padding: '10px 14px',
        fontSize: '0.85rem',
        border: "1px solid #000"
      }}>
            <strong>Status:</strong> {patientData.currentHealthStatus.condition} — {patientData.currentHealthStatus.summary}
          </div>}
      </SectionCard>

      {/* Allergies & Conditions */}
      <SectionCard id="sec-allergies" title="Allergies & Chronic Conditions" icon={Shield} color="#7c3aed" action={!isEditing && <button type="button" onClick={() => handleStartEditing('sec-allergies')} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Edit3 size={12} /> Update Notes
          </button>}>
        <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
          <div>
            <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '8px'
          }}>⚠️ Known Allergies</div>
            <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '8px',
            minHeight: '28px'
          }}>
              {(!form.knownAllergies || form.knownAllergies.length === 0) ? <span style={{
              fontSize: '0.78rem'
            }}>None recorded.</span> : (form.knownAllergies || []).map((a, i) => <span key={i} style={{
              padding: '3px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                  {a} {isEditing && <button type="button" onClick={() => removeAllergy(i)} style={{
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}><X size={10} /></button>}
                </span>)}
            </div>
            {isEditing && <div style={{
            display: 'flex',
            gap: '6px'
          }}>
                <input style={{
              ...inputStyle,
              padding: '6px 10px',
              fontSize: '0.8rem'
            }} value={newAllergy} onChange={e => setNewAllergy(e.target.value)} placeholder="e.g. Penicillin, Sulfa..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())} />
                <button type="button" onClick={addAllergy} style={{
              border: "1px solid #000",
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              flexShrink: 0
            }}>+ Add</button>
              </div>}
          </div>
          <div>
            <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '8px'
          }}>🏥 Chronic Conditions</div>
            <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '8px',
            minHeight: '28px'
          }}>
              {(!form.chronicConditions || form.chronicConditions.length === 0) ? <span style={{
              fontSize: '0.78rem'
            }}>None recorded.</span> : (form.chronicConditions || []).map((c, i) => <span key={i} style={{
              padding: '3px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                  {c} {isEditing && <button type="button" onClick={() => removeCondition(i)} style={{
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}><X size={10} /></button>}
                </span>)}
            </div>
            {isEditing && <div style={{
            display: 'flex',
            gap: '6px'
          }}><input style={{
              ...inputStyle,
              flex: 1
            }} value={newCondition} onChange={e => setNewCondition(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCondition()} placeholder="Add condition..." /><button type="button" onClick={addCondition} style={{
              border: 'none',
              padding: '6px 10px',
              cursor: 'pointer'
            }}><Plus size={14} color="#7c3aed" /></button></div>}
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════ MY HEALTH QR SECTION ═══════════════════════ */}
      <SectionCard id="sec-qr" title="My Health QR Code" icon={QrCode} color="#7c3aed">
        {/* Print CSS */}
        <style>{`
          @media print {
            body > *:not(#printable-patient-profile) { display: none !important; }
            #printable-patient-profile { display: block !important; position: static !important; }
            .no-print { display: none !important; }
          }
          @keyframes qrPulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.15)} 50%{box-shadow:0 0 0 12px rgba(124,58,237,0)} }
        `}</style>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          {/* QR Code Block */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#ffffff',
              border: '2px solid #7c3aed22',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(124,58,237,0.10)',
              animation: 'qrPulse 3s infinite'
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
                  patientId: patientData?.id || '',
                  name: userData?.name || '',
                  sscCode: patientData?.sscCode || '',
                  abhaId: patientData?.abhaId || ''
                })}
                size={140}
                level="M"
                includeMargin={true}
                fgColor="#1e1b4b"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🔒 Secure Health QR
              </div>
              <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '2px', maxWidth: '160px' }}>
                Safe token only — no medical data stored inside
              </div>
            </div>
          </div>

          {/* Info + Actions */}
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* ID Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {patientData?.id && (
                <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Patient ID</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'monospace' }}>{patientData.id}</div>
                </div>
              )}
              {patientData?.sscCode && (
                <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>SSC Code</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>{patientData.sscCode}</div>
                </div>
              )}
              {patientData?.abhaId && (
                <div style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '8px 14px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#7c3aed', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>ABHA ID</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6b21a8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{patientData.abhaId}</div>
                </div>
              )}
            </div>

            {/* QR Token (safe token display) */}
            {patientData?.qrToken && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>QR Token (Safe — show to doctor/clinic)</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>{patientData.qrToken}</div>
              </div>
            )}

            {/* Actions */}
            <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setQrEnlarged(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #7c3aed', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', cursor: 'pointer', background: '#faf5ff' }}
              >
                <Maximize2 size={14} /> View / Enlarge
              </button>
              <button
                type="button"
                onClick={() => {
                  // Download QR as PNG via canvas
                  const canvas = document.getElementById('patient-qr-canvas-hidden');
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `GraminArogya_QR_${patientData?.id || 'patient'}.png`;
                    a.click();
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #059669', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#059669', cursor: 'pointer', background: '#ecfdf5' }}
              >
                <Download size={14} /> Download QR
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #0369a1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer', background: '#eff6ff' }}
              >
                <Printer size={14} /> Print QR / PDF
              </button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for download (QRCodeCanvas renders to actual canvas element) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} aria-hidden="true">
          <QRCodeCanvas
            id="patient-qr-canvas-hidden"
            value={JSON.stringify({
              qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
              patientId: patientData?.id || '',
              name: userData?.name || '',
              sscCode: patientData?.sscCode || '',
              abhaId: patientData?.abhaId || ''
            })}
            size={400}
            level="M"
            includeMargin={true}
          />
        </div>
      </SectionCard>

      {/* ═══════════════════════ PRESCRIPTIONS SECTION ═══════════════════════ */}
      {prescriptions.length > 0 && (
        <SectionCard id="sec-prescriptions" title={`My Prescriptions (${prescriptions.length})`} icon={Pill} color="#ea580c">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prescriptions.map((rx, idx) => (
              <div key={idx} style={{
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff7ed'
              }}>
                {/* Rx Header */}
                <div style={{
                  background: 'linear-gradient(90deg, #ea580c, #c2410c)',
                  color: '#fff',
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill size={15} />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                      {rx.patientName || userData?.name} — Rx #{idx + 1}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#fed7aa' }}>
                    {rx.prescribedAt && <span>📅 {new Date(rx.prescribedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    {rx.doctorName && <span>👨‍⚕️ {rx.doctorName}</span>}
                    {rx.status && (
                      <span style={{
                        background: rx.status === 'Dispensed' ? '#dcfce7' : rx.status === 'Prescribed' ? '#fef9c3' : '#f1f5f9',
                        color: rx.status === 'Dispensed' ? '#15803d' : rx.status === 'Prescribed' ? '#854d0e' : '#475569',
                        padding: '1px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}>
                        {rx.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rx Medicines */}
                <div style={{ padding: '14px 16px' }}>
                  {rx.diagnosis && (
                    <div style={{ marginBottom: '10px', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>Diagnosis: </span>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{rx.diagnosis}</span>
                    </div>
                  )}
                  {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        💊 Medicines Prescribed
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {rx.medicines.map((med, mIdx) => (
                          <div key={mIdx} style={{
                            background: '#ffffff',
                            border: '1px solid #fdba74',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '0.82rem'
                          }}>
                            <div>
                              <strong style={{ color: '#1e293b' }}>{med.name || med.medicine}</strong>
                              {med.dosage && <span style={{ color: '#64748b', marginLeft: '6px' }}>{med.dosage}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: '#64748b' }}>
                              {med.frequency && <span>🔁 {med.frequency}</span>}
                              {med.duration && <span>⏱ {med.duration}</span>}
                              {med.instructions && <span style={{ color: '#0369a1' }}>ℹ️ {med.instructions}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {rx.notes && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <strong>Doctor Notes:</strong> {rx.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Follow-Up Reminders & Doctor Appointments */}

      <SectionCard id="sec-reminders" title={`Doctor Follow-Up Checkups (${followUpReminders.length})`} icon={Bell} color="#d97706" action={<button type="button" onClick={loadProfile} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      border: "1px solid #000",
      padding: '5px 12px',
      fontSize: '0.76rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}>
            <Clock size={12} /> Refresh
          </button>}>
        {followUpReminders.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '24px 0'
      }}>
            <Bell size={32} color="#cbd5e1" style={{
          marginBottom: '8px',
          display: 'block',
          margin: '0 auto 8px'
        }} />
            <div style={{
          fontSize: '0.9rem',
          fontWeight: 700
        }}>No pending doctor checkup reminders.</div>
            <div style={{
          fontSize: '0.78rem',
          marginTop: '4px'
        }}>Jab bhi doctor aapke liye follow-up checkup schedule karega, yahan real-time appear hoga.</div>
          </div> : <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
            {followUpReminders.map((rem, idx) => {
          const isDone = rem.status === 'COMPLETED';
          const dueDateObj = new Date(rem.dueDate);
          const isToday = dueDateObj.toDateString() === new Date().toDateString();
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = dueDateObj.toDateString() === tomorrow.toDateString();
          const dayBadge = isToday ? '🚨 Due Today' : isTomorrow ? '⚡ Due Tomorrow' : formatDate(rem.dueDate);
          return <div key={idx} style={{
            border: `1.5px solid ${isDone ? '#86efac' : isToday ? '#fca5a5' : '#fde68a'}`,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
                  <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
                    <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                      <span style={{
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                        {isDone ? <Check size={12} /> : <Clock size={12} />}
                        {isDone ? 'COMPLETED' : dayBadge}
                      </span>
                      <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 800
                }}>
                        👨‍⚕️ {rem.doctorName || 'Doctor Consulting Physician'}
                      </span>
                    </div>
                    <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px'
              }}>
                      {rem.priority} Priority
                    </span>
                  </div>

                  <div style={{
              fontSize: '0.88rem',
              lineHeight: 1.5,
              padding: '10px 14px',
              border: "1px solid #000"
            }}>
                    <strong>Doctor's Checkup Reason:</strong> {rem.reason}
                  </div>

                  <div style={{
              fontSize: '0.74rem',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
                    <span>📅 Target Checkup Date: <strong>{formatDate(rem.dueDate)}</strong></span>
                    <span>Scheduled on: {formatDate(rem.createdAt || rem.dueDate)}</span>
                  </div>

                  {!isDone && <div style={{
              fontSize: '0.72rem',
              padding: '6px 10px',
              border: "1px solid #000"
            }}>
                      ℹ️ Doctor checkup complete hone par aapke registered email par OTP verification ke liye code aayega.
                    </div>}
                </div>;
        })}
          </div>}
      </SectionCard>

      {/* Medical History */}
      <SectionCard title={`Medical History (${medicalHistory.length} Visit${medicalHistory.length !== 1 ? 's' : ''})`} icon={FileText} color="#0369a1">
        {medicalHistory.length === 0 ? <div style={{
        textAlign: 'center',
        padding: '24px 0'
      }}>
            <Stethoscope size={32} color="#cbd5e1" style={{
          marginBottom: '8px',
          display: 'block',
          margin: '0 auto 8px'
        }} />
            <div style={{
          fontSize: '0.9rem',
          fontWeight: 700
        }}>No medical visits recorded yet.</div>
            <div style={{
          fontSize: '0.78rem',
          marginTop: '4px'
        }}>Doctor se milne ke baad aapka record yahan appear hoga.</div>
          </div> : <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
            {medicalHistory.map((visit, idx) => <div key={idx} style={{
          border: "1px solid #000",
          overflow: 'hidden'
        }}>
                <div onClick={() => setExpandedHistoryIdx(expandedHistoryIdx === idx ? null : idx)} style={{
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
                  <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
                    <div style={{
                width: '8px',
                height: '8px',
                flexShrink: 0
              }} />
                    <div>
                      <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 800
                }}>{visit.diagnosis}</div>
                      <div style={{
                  fontSize: '0.75rem',
                  display: 'flex',
                  gap: '10px',
                  marginTop: '2px',
                  flexWrap: 'wrap'
                }}>
                        <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}><Clock size={11} /> {formatDate(visit.visitDate)}</span>
                        <span>🏥 {visit.facilityName}</span>
                        <span>👨‍⚕️ {visit.doctorName}</span>
                      </div>
                    </div>
                  </div>
                  {expandedHistoryIdx === idx ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                </div>
                {expandedHistoryIdx === idx && <div style={{
            padding: '14px 16px',
            borderTop: "1px solid #000"
          }}>
                    {visit.symptoms && <div style={{
              marginBottom: '10px'
            }}><div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>Symptoms</div><div style={{
                fontSize: '0.85rem'
              }}>{visit.symptoms}</div></div>}
                    {Array.isArray(visit.prescriptions) && visit.prescriptions.length > 0 && <div style={{
              marginBottom: '10px'
            }}><div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>💊 Prescriptions</div>{visit.prescriptions.map((rx, rxIdx) => <div key={rxIdx} style={{
                padding: '8px 12px',
                marginBottom: '6px',
                fontSize: '0.82rem',
                border: "1px solid #000"
              }}><strong>{rx.medicine}</strong> — {rx.dosage} | {rx.frequency} × {rx.duration}{rx.instructions && <span style={{}}> ({rx.instructions})</span>}</div>)}</div>}
                    {Array.isArray(visit.testReports) && visit.testReports.length > 0 && <div style={{
              marginBottom: '10px'
            }}><div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>🧪 Lab Reports</div>{visit.testReports.map((rep, rIdx) => <div key={rIdx} style={{
                padding: '8px 12px',
                marginBottom: '6px',
                fontSize: '0.82rem',
                border: "1px solid #000",
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}><span><strong>{rep.testName}</strong>: {rep.result}</span><span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px'
                }}>{rep.status}</span></div>)}</div>}
                    {visit.clinicalNotes && <div style={{
              padding: '8px 12px',
              fontSize: '0.82rem',
              border: "1px solid #000"
            }}><strong>Doctor Notes:</strong> {visit.clinicalNotes}</div>}
                  </div>}
              </div>)}
          </div>}
      </SectionCard>

      {/* Bottom Action Bar */}
      {isEditing ? <div style={{
      position: 'sticky',
      bottom: '24px',
      zIndex: 40,
      border: "1.5px solid #000",
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '24px',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
          <div style={{
        fontSize: '0.85rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <Edit3 size={16} color="#34d399" />
            <span>Profile Editing Active • Make your changes and click Save</span>
          </div>
          <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
            <button type="button" onClick={() => {
          setIsEditing(false);
          loadProfile();
        }} style={{
          padding: '9px 18px',
          border: "1px solid #000",
          fontWeight: 700,
          fontSize: '0.84rem',
          cursor: 'pointer'
        }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} style={{
          padding: '9px 22px',
          border: 'none',
          background: "#000000",
          fontWeight: 800,
          fontSize: '0.86rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
              {saving ? <Loader size={15} style={{}} /> : <Save size={15} />}
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div> : <div style={{
      textAlign: 'center',
      margin: '20px 0 40px'
    }}>
          <button type="button" onClick={handleStartEditing} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 28px',
        border: 'none',
        background: "#000000",
        fontWeight: 800,
        fontSize: '0.92rem',
        cursor: 'pointer'
      }}>
            <Edit3 size={16} />
            <span>Edit My Health Profile</span>
          </button>
        </div>}

      {/* OTP Verification Modal */}
      {showOtpModal && <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
          <div style={{
        padding: '32px 28px',
        maxWidth: '420px',
        width: '100%',
        position: 'relative'
      }}>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }`}</style>

            <button onClick={() => setShowOtpModal(false)} style={{
          position: 'absolute',
          top: '14px',
          right: '16px',
          border: 'none',
          fontSize: '1.4rem',
          cursor: 'pointer'
        }}>×</button>

            <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
              <div style={{
            fontSize: '2.2rem',
            marginBottom: '6px'
          }}>🔐</div>
              <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            margin: '0 0 6px'
          }}>Verify to Save Changes</h2>
              {otpSending ? <p style={{
            fontSize: '0.85rem',
            margin: 0
          }}>Sending OTP to your registered email…</p> : otpSent ? <p style={{
            fontSize: '0.85rem',
            margin: 0
          }}>
                  OTP sent to <strong>{otpMaskedEmail}</strong>
                  <br /><span style={{
              fontSize: '0.78rem'
            }}>Enter the 6-digit code below to confirm and save your profile</span>
                </p> : <p style={{
            fontSize: '0.85rem',
            margin: 0
          }}>{otpMsg || 'Could not send OTP.'}</p>}
            </div>

            {otpSending && <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 0'
        }}>
                <div style={{
            width: '36px',
            height: '36px',
            border: "3px solid #000",
            borderTopColor: "#000"
          }} />
              </div>}

            {!otpSending && <form onSubmit={handleOtpVerifyAndSave}>
                <input type="text" inputMode="numeric" maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="— — — — — —" style={{
            width: '100%',
            padding: '14px',
            border: "2px solid #000",
            fontSize: '1.8rem',
            textAlign: 'center',
            letterSpacing: '10px',
            fontWeight: 900,
            boxSizing: 'border-box',
            marginBottom: '14px'
          }} />


                {otpMsg && <div style={{
            border: `1px solid ${otpMsg.includes('sent') || otpMsg.includes('verified') ? '#6ee7b7' : '#fca5a5'}`,
            padding: '8px 12px',
            marginBottom: '12px',
            fontSize: '0.82rem'
          }}>
                    {otpMsg}
                  </div>}

                <button type="submit" disabled={otpVerifying || saving} style={{
            width: '100%',
            background: "#000000",
            border: 'none',
            padding: '13px',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: '10px'
          }}>
                  {otpVerifying || saving ? '⏳ Verifying & Saving…' : '✅ Verify OTP & Save Profile'}
                </button>

                <button type="button" onClick={handleSave} disabled={otpSending} style={{
            width: '100%',
            border: "1.5px solid #000",
            padding: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
                  🔄 Resend OTP
                </button>
              </form>}
          </div>
        </div>}

      {/* ═══════════ QR ENLARGED MODAL ═══════════ */}
      {qrEnlarged && (
        <div
          className="no-print"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(30,27,75,0.80)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setQrEnlarged(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setQrEnlarged(false)}
              style={{ position: 'absolute', top: '14px', right: '16px', background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#64748b' }}
              title="Close"
            >×</button>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                🔒 My Health QR Code
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b' }}>
                {userData?.name || 'Patient'}
              </div>
              {patientData?.id && (
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#3730a3', marginTop: '2px' }}>
                  {patientData.id}
                </div>
              )}
            </div>

            <div style={{
              display: 'inline-block',
              background: '#f8fafc',
              border: '3px solid #7c3aed22',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <QRCodeSVG
                value={JSON.stringify({
                  qrToken: patientData?.qrToken || patientData?.id || 'GRAMIN_HEALTH',
                  patientId: patientData?.id || '',
                  name: userData?.name || '',
                  sscCode: patientData?.sscCode || '',
                  abhaId: patientData?.abhaId || ''
                })}
                size={220}
                level="M"
                includeMargin={true}
                fgColor="#1e1b4b"
              />
            </div>

            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Show this QR to your doctor, ASHA worker, or clinic staff.<br />
              <strong style={{ color: '#7c3aed' }}>Safe — no medical data is stored inside.</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const canvas = document.getElementById('patient-qr-canvas-hidden');
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `GraminArogya_QR_${patientData?.id || 'patient'}.png`;
                    a.click();
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1.5px solid #059669', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#059669', cursor: 'pointer', background: '#ecfdf5' }}
              >
                <Download size={15} /> Download PNG
              </button>
              <button
                type="button"
                onClick={() => { setQrEnlarged(false); setTimeout(() => window.print(), 100); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', border: '1.5px solid #0369a1', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer', background: '#eff6ff' }}
              >
                <Printer size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PRINTABLE PATIENT HEALTH CARD (visible only on print) ═══════════ */}
      <div id="printable-patient-profile" style={{ display: 'none' }}>
        <style>{`
          @media print {
            @page { margin: 18mm; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif !important; background: #fff !important; color: #000 !important; }
            #printable-patient-profile { display: block !important; max-width: 100%; padding: 0; }
            .no-print, nav, header, footer, button { display: none !important; }
            .print-section { border: 1.5px solid #000; border-radius: 0; padding: 12px; margin-bottom: 14px; break-inside: avoid; }
            .print-header { background: #1e1b4b !important; color: #fff !important; padding: 16px; margin-bottom: 16px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .print-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #555; letter-spacing: 0.06em; margin-bottom: 2px; }
            .print-value { font-size: 12px; font-weight: 600; color: #000; }
            .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .print-vitals { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
            .vital-box { border: 1px solid #e0e0e0; padding: 6px 10px; min-width: 80px; text-align: center; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
            th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-weight: 700; font-size: 10px; }
            td { padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
            .print-footer { text-align: center; font-size: 9px; color: #888; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 16px; }
          }
        `}</style>

        {/* Print Header */}
        <div className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', opacity: 0.75, marginBottom: '4px' }}>
                NATIONAL RURAL HEALTH MISSION — GRAMIN AROGYA
              </div>
              <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>
                {userData?.name || 'Patient'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>
                {patientData?.id} &nbsp;|&nbsp; {patientData?.abhaId}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <QRCodeSVG
                value={JSON.stringify({ qrToken: patientData?.qrToken || patientData?.id, patientId: patientData?.id })}
                size={80} level="M" includeMargin={false} fgColor="#ffffff" bgColor="#1e1b4b"
              />
              <div style={{ fontSize: '9px', marginTop: '4px', opacity: 0.8 }}>Health QR</div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            👤 Personal Information
          </div>
          <div className="print-grid">
            {[
              ['Full Name', userData?.name || '—'],
              ['Date of Birth', userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('en-IN') : '—'],
              ['Age', patientData?.age || '—'],
              ['Gender', userData?.gender || patientData?.gender || '—'],
              ['Blood Group', userData?.bloodGroup || patientData?.bloodGroup || '—'],
              ['Mobile', userData?.phone || '—'],
              ['Email', userData?.email || '—'],
              ['Village / Location', userData?.village || patientData?.village || '—'],
              ['Emergency Contact', userData?.emergencyContact || patientData?.emergencyContact || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="print-label">{label}</div>
                <div className="print-value">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* IDs */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            🆔 Health Identifiers
          </div>
          <div className="print-grid">
            <div><div className="print-label">Patient ID</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.id || '—'}</div></div>
            <div><div className="print-label">SSC Code</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.sscCode || '—'}</div></div>
            <div><div className="print-label">ABHA ID</div><div className="print-value" style={{ fontFamily: 'monospace' }}>{patientData?.abhaId || '—'}</div></div>
          </div>
        </div>

        {/* Medical */}
        <div className="print-section">
          <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
            🩺 Medical Information
          </div>
          <div className="print-vitals">
            {[['BP', patientData?.vitals?.bp, 'mmHg'], ['SpO2', patientData?.vitals?.spo2, '%'], ['Temp', patientData?.vitals?.temp, '°F'], ['Pulse', patientData?.vitals?.pulse, 'bpm'], ['Sugar', patientData?.vitals?.sugar, '']].map(([l, v, u]) => (
              <div className="vital-box" key={l}>
                <div className="print-label">{l}</div>
                <div style={{ fontWeight: 800, fontSize: '12px' }}>{v || '—'}{u && v ? u : ''}</div>
              </div>
            ))}
          </div>
          {((patientData?.knownAllergies && patientData.knownAllergies.length > 0) || (patientData?.chronicConditions && patientData.chronicConditions.length > 0)) && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {patientData?.knownAllergies && patientData.knownAllergies.length > 0 && (
                <div><div className="print-label">⚠️ Allergies</div><div className="print-value">{Array.isArray(patientData.knownAllergies) ? patientData.knownAllergies.join(', ') : String(patientData.knownAllergies)}</div></div>
              )}
              {patientData?.chronicConditions && patientData.chronicConditions.length > 0 && (
                <div><div className="print-label">🏥 Chronic Conditions</div><div className="print-value">{Array.isArray(patientData.chronicConditions) ? patientData.chronicConditions.join(', ') : String(patientData.chronicConditions)}</div></div>
              )}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        {Array.isArray(prescriptions) && prescriptions.length > 0 && (
          <div className="print-section">
            <div style={{ fontWeight: 800, fontSize: '11px', marginBottom: '10px', textTransform: 'uppercase' }}>
              💊 Prescriptions
            </div>
            {prescriptions.slice(0, 3).map((rx, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                  Rx #{i + 1} — {rx.doctorName || 'Dr.'} — {rx.prescribedAt ? new Date(rx.prescribedAt).toLocaleDateString('en-IN') : ''} — Status: {rx.status || ''}
                </div>
                {rx.diagnosis && <div style={{ fontSize: '10px', color: '#444', marginBottom: '4px' }}>Diagnosis: {rx.diagnosis}</div>}
                {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                  <table>
                    <thead>
                      <tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>
                    </thead>
                    <tbody>
                      {rx.medicines.map((m, mi) => (
                        <tr key={mi}>
                          <td>{m.name || m.medicine || '—'}</td>
                          <td>{m.dosage || '—'}</td>
                          <td>{m.frequency || '—'}</td>
                          <td>{m.duration || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          Printed from GraminArogya — National Rural Health Platform &nbsp;|&nbsp; Generated: {new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; This document is for authorized use only.
        </div>
      </div>

    </div>;
}
