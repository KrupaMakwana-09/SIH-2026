import React, { useState, useEffect } from 'react';
import { Lock, User, Phone, MapPin, Building, Shield, X, CheckCircle2, AlertCircle, Sparkles, ArrowRight, LocateFixed, Eye, EyeOff, Mail, KeyRound, Stethoscope, Award, Droplet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
import BloodFinderModal from './BloodFinderModal';
import { renderGoogleButtonSafely } from '../utils/googleAuth';

// Role config: what tab each role defaults to + what panel they need
const ROLE_CONFIG = {
  asha: {
    icon: '👩‍⚕️',
    label: 'ASHA Field Worker',
    color: '#059669',
    description: 'Field worker – Patient intake & vitals'
  },
  doctor: {
    icon: '🩺',
    label: 'Medical Officer / Doctor',
    color: '#0284c7',
    description: 'Doctor panel – Prescriptions & profile'
  },
  cmo: {
    icon: '📊',
    label: 'Chief Medical Officer',
    color: '#7c3aed',
    description: 'CMO – District intelligence & analytics'
  },
  citizen: {
    icon: '👤',
    label: 'Citizen / Patient',
    color: '#d97706',
    description: 'Public – View health services'
  }
};
export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  onOpenBlood
}) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showInternalBloodModal, setShowInternalBloodModal] = useState(false);
  const handleOpenBlood = () => {
    if (onOpenBlood) {
      onOpenBlood();
    } else {
      setShowInternalBloodModal(true);
    }
  };

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState('staff');
  const [regPhone, setRegPhone] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);

  // Doctor-specific registration fields
  const [regEmail, setRegEmail] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('');
  const [regQualification, setRegQualification] = useState('');
  const [regLicense, setRegLicense] = useState('');

  // Citizen/Patient-specific registration fields
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');
  const [regCitizenEmail, setRegCitizenEmail] = useState('');

  // Doctor OTP mode (for login as doctor via OTP instead of password)
  const [doctorLoginMode, setDoctorLoginMode] = useState('password'); // 'password' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const autoDetectGpsVillage = async () => {
    setGpsDetecting(true);
    try {
      const coords = await getLivePosition();
      const geo = await reverseGeocode(coords.lat, coords.lng);
      const parts = [geo.village || geo.shortAddress, geo.district && geo.district !== geo.village ? geo.district : null, geo.postcode ? `PIN ${geo.postcode}` : null].filter(Boolean);
      setRegVillage(parts.join(', ') || geo.village || geo.shortAddress);
    } catch (e) {
      console.warn('GPS detection note:', e);
    } finally {
      setGpsDetecting(false);
    }
  };
  useEffect(() => {
    if (isOpen && !isLoginTab && !regVillage) {
      autoDetectGpsVillage();
    }
  }, [isOpen, isLoginTab]);
  if (!isOpen) return null;

  // ─── Standard login ───────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login(loginUsername, loginPassword);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            y: 0.7
          }
        });
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Invalid credentials.');
      }
    } catch {
      setErrorMsg('Login failed. Please check network or try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Real Google OAuth login (GSI popup) ────────────────────────────────
  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const roleToUse = regRole || 'patient';
      const res = await api.googleAuth(credential, roleToUse);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 80,
          spread: 80,
          origin: {
            y: 0.6
          }
        });
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Google login failed.');
      }
    } catch {
      setErrorMsg('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Doctor Email OTP send ─────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!otpEmail || !otpEmail.includes('@')) {
      setOtpMsg('Please enter a valid email address.');
      return;
    }
    setOtpLoading(true);
    setOtpMsg('');
    setDevOtp('');
    try {
      const res = await api.sendDoctorEmailOtp(otpEmail);
      if (res.success) {
        setOtpSent(true);
        setOtpMsg(res.message || 'OTP sent! Check your email inbox.');
      } else {
        setOtpMsg(res.message || 'Failed to send OTP.');
      }
    } catch {
      setOtpMsg('Network error while sending OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Doctor Email OTP verify ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpMsg('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    setOtpMsg('');
    try {
      const res = await api.verifyDoctorEmailOtp(otpEmail, otpCode);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 70,
          spread: 80,
          origin: {
            y: 0.6
          }
        });
        onAuthSuccess(res.user);
        onClose();
      } else {
        setOtpMsg(res.message || 'Invalid OTP.');
      }
    } catch {
      setOtpMsg('Verification failed. Check network.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.register({
        name: regRole === 'doctor' ? regName.startsWith('Dr.') ? regName : `Dr. ${regName}` : regName,
        username: regUsername,
        password: regPassword,
        role: regRole,
        phone: regPhone,
        village: regVillage || '',
        designation: regRole === 'doctor' ? regSpecialization || regDesignation || 'Medical Officer' : regRole === 'patient' ? 'Registered Patient' : regDesignation,
        email: regRole === 'patient' ? regCitizenEmail || undefined : regEmail || undefined,
        qualification: regQualification || undefined,
        registrationNumber: regLicense || undefined,
        // Citizen/patient-specific fields
        dateOfBirth: regRole === 'patient' ? regDob || undefined : undefined,
        gender: regRole === 'patient' ? regGender || undefined : undefined,
        bloodGroup: regRole === 'patient' ? regBloodGroup || undefined : undefined,
        emergencyContact: regRole === 'patient' ? regEmergencyContact || undefined : undefined
      });
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));

        // If doctor, also create their doctor profile in DB
        if (regRole === 'doctor' && (regPhone || regEmail)) {
          try {
            await api.updateDoctorProfile({
              doctorName: res.user.name,
              specialization: regSpecialization || 'General Physician',
              qualification: regQualification || 'MBBS',
              phone: regPhone || '+91-00000-00000',
              email: regEmail || '',
              registrationNumber: regLicense || '',
              clinicName: `${res.user.name} Clinic`,
              branding: {
                headerTitle: `${res.user.name} – Healthcare Services`,
                headerSubtitle: regSpecialization || 'General Physician',
                headerContact: regPhone || regEmail || '',
                footerText: 'Valid for 7 days. Not valid for medico-legal purposes.'
              }
            });
          } catch (pe) {
            console.warn('Doctor profile auto-create note:', pe);
          }
        }
        confetti({
          particleCount: 60,
          spread: 70,
          origin: {
            y: 0.7
          }
        });
        onAuthSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch {
      setErrorMsg('Registration failed. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared style helpers ─────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '10px',
    border: '1.5px solid #d1fae5',
    fontSize: '0.88rem',
    outline: 'none',
    background: '#fafffe',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };
  const smallInputStyle = {
    ...inputStyle,
    padding: '8px 10px 8px 10px'
  };
  const labelStyle = {
    display: 'block',
    fontSize: '0.76rem',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '4px'
  };
  const eyeBtnStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    padding: '2px'
  };
  const isDoctorLogin = isLoginTab && doctorLoginMode !== 'password';
  return <div className="np-auth-overlay" style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  }}>
      <div className="np-auth-modal" style={{
      width: '100%',
      maxWidth: '520px',
      maxHeight: '92vh',
      overflowY: 'auto',
      padding: '28px 26px',
      position: 'relative',
      border: "1px solid #000"
    }}>
        {/* Header */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
            <div style={{
            background: "#000000",
            padding: '10px'
          }}>
              <Shield size={22} />
            </div>
            <div>
              <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              margin: 0
            }}>
                {isLoginTab ? 'GraminArogya Sign In' : 'Create New Account'}
              </h2>
              <div style={{
              fontSize: '0.75rem',
              marginTop: '2px'
            }}>
                National Rural Health Authentication Portal
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
          border: 'none',
          padding: '7px',
          cursor: 'pointer'
        }}>
            <X size={18} color="#4b5563" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        padding: '4px',
        marginBottom: '18px',
        border: "1px solid #000"
      }}>
          {['login', 'register'].map(t => {
          const active = t === 'login' === isLoginTab;
          return <button key={t} type="button" onClick={() => {
            setIsLoginTab(t === 'login');
            setErrorMsg('');
            setOtpSent(false);
            setDevOtp('');
            setOtpMsg('');
          }} style={{
            padding: '8px',
            border: 'none',
            fontWeight: active ? 800 : 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}>
                {t === 'login' ? '🔐 Sign In' : '✏️ Register'}
              </button>;
        })}
        </div>

        {/* 🩸 EMERGENCY BLOOD & NGO FINDER BANNER 🩸 */}
        <div style={{
        background: "#000000",
        border: "1.5px solid #000",
        padding: '11px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px'
        }}>
            <div style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
              <Droplet size={18} fill="#ffffff" color="#ffffff" />
            </div>
            <div>
              <div style={{
              fontSize: '0.82rem',
              fontWeight: 800
            }}>
                Need Blood Urgently? / रक्त की आवश्यकता?
              </div>
              <div style={{
              fontSize: '0.7rem'
            }}>
                Nearby Blood Banks, Donors & Red Cross/Rotary NGOs
              </div>
            </div>
          </div>
          <button type="button" onClick={handleOpenBlood} style={{
          padding: '6px 12px',
          border: 'none',
          background: "#000000",
          fontSize: '0.74rem',
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
            Find Blood NGO ➔
          </button>
        </div>

        {/* ══════ LOGIN FORM ══════ */}
        {isLoginTab ? <div>
            {/* Doctor login mode selector */}
            <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px'
        }}>
              {[{
            val: 'password',
            label: '🔑 Password'
          }, {
            val: 'otp',
            label: '📧 Email OTP'
          }, {
            val: 'google',
            label: '🌐 Google'
          }].map(({
            val,
            label
          }) => <button key={val} type="button" onClick={() => {
            setDoctorLoginMode(val);
            setErrorMsg('');
            setOtpMsg('');
            setOtpSent(false);
          }} style={{
            flex: 1,
            padding: '7px 4px',
            cursor: 'pointer',
            border: `2px solid ${doctorLoginMode === val ? '#10b981' : '#e5e7eb'}`,
            fontWeight: doctorLoginMode === val ? 800 : 500,
            fontSize: '0.75rem'
          }}>
                  {label}
                </button>)}
            </div>

            {/* Password login */}
            {doctorLoginMode === 'password' && <form onSubmit={handleLogin} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '13px'
        }}>
                <div>
                  <label style={labelStyle}>Username / Email:</label>
                  <div style={{
              position: 'relative'
            }}>
                    <User size={15} color="#9ca3af" style={{
                position: 'absolute',
                left: '11px',
                top: '11px'
              }} />
                    <input type="text" required placeholder="Enter username or email..." value={loginUsername} onChange={e => setLoginUsername(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Password:</label>
                  <div style={{
              position: 'relative'
            }}>
                    <Lock size={15} color="#9ca3af" style={{
                position: 'absolute',
                left: '11px',
                top: '11px'
              }} />
                    <input type={showLoginPassword ? 'text' : 'password'} required placeholder="Enter password..." value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{
                ...inputStyle,
                paddingRight: '40px'
              }} />
                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} style={eyeBtnStyle}>
                      {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {errorMsg && <ErrorBox msg={errorMsg} />}

                <button type="submit" disabled={loading} className="btn-primary" style={{
            padding: '12px',
            justifyContent: 'center',
            fontSize: '0.93rem',
            marginTop: '4px'
          }}>
                  <span>{loading ? 'Authenticating...' : 'Secure Sign In'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>}

            {/* Email OTP login */}
            {doctorLoginMode === 'otp' && <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '13px'
        }}>
                <div style={{
            border: "1px solid #000",
            padding: '10px 14px',
            fontSize: '0.78rem',
            lineHeight: 1.5
          }}>
                  <strong>📧 Email OTP Login —</strong> Enter your registered doctor email. An OTP code will be generated (shown instantly in demo mode).
                </div>
                <div>
                  <label style={labelStyle}>Doctor Email Address:</label>
                  <div style={{
              position: 'relative'
            }}>
                    <Mail size={15} color="#9ca3af" style={{
                position: 'absolute',
                left: '11px',
                top: '11px'
              }} />
                    <input type="email" placeholder="doctor@example.com" value={otpEmail} onChange={e => setOtpEmail(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                {!otpSent ? <button type="button" disabled={otpLoading} onClick={handleSendOtp} style={{
            width: '100%',
            padding: '11px',
            border: 'none',
            cursor: 'pointer',
            background: "#000000",
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
                    <Mail size={16} /> {otpLoading ? 'Sending OTP...' : 'Send OTP to Email'}
                  </button> : <>
                    <div>
                      <label style={labelStyle}>Enter 6-Digit OTP:</label>
                      <div style={{
                position: 'relative'
              }}>
                        <KeyRound size={15} color="#9ca3af" style={{
                  position: 'absolute',
                  left: '11px',
                  top: '11px'
                }} />
                        <input type="text" maxLength={6} placeholder="• • • • • •" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={{
                  ...inputStyle,
                  letterSpacing: '4px',
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }} />
                      </div>
                    </div>
                    <button type="button" disabled={otpLoading} onClick={handleVerifyOtp} style={{
              width: '100%',
              padding: '11px',
              border: 'none',
              cursor: 'pointer',
              background: "#000000",
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
                      <CheckCircle2 size={16} /> {otpLoading ? 'Verifying...' : 'Verify OTP & Login'}
                    </button>
                    <button type="button" onClick={() => {
              setOtpSent(false);
              setDevOtp('');
              setOtpCode('');
            }} style={{
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.78rem',
              textAlign: 'center'
            }}>
                      ↩ Resend / Change Email
                    </button>
                  </>}
                {otpMsg && <div style={{
            fontSize: '0.78rem',
            textAlign: 'center'
          }}>{otpMsg}</div>}
              </div>}

            {/* Google login */}
            {doctorLoginMode === 'google' && <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
                <div style={{
            border: "1px solid #000",
            padding: '10px 14px',
            fontSize: '0.78rem',
            lineHeight: 1.5
          }}>
                  <strong>🌐 Real Google Sign-In —</strong> A secure Google popup will open. Your account will be auto-created if you're new. No password needed.
                </div>

                {/* Role selector for new Google users */}
                <div>
                  <label style={labelStyle}>Sign in as:</label>
                  <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}>
                    {Object.entries(ROLE_CONFIG).map(([role, cfg]) => <button key={role} type="button" onClick={() => setRegRole(role)} style={{
                padding: '7px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                border: `2px solid ${regRole === role ? cfg.color : '#e5e7eb'}`,
                fontSize: '0.74rem',
                fontWeight: regRole === role ? 800 : 500
              }}>
                        {cfg.icon} {cfg.label}
                      </button>)}
                  </div>
                </div>

                {errorMsg && <ErrorBox msg={errorMsg} />}
                <GoogleBtn loading={loading} onClick={handleGoogleLogin} />
                <p style={{
            fontSize: '0.72rem',
            textAlign: 'center',
            margin: 0
          }}>
            By signing in you agree to the GraminArogya healthcare data policy (SIH 2026)
          </p>
        </div>}


            {/* Quick Google shortcut shown on password tab too */}
            {doctorLoginMode === 'password' && <>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '14px 0 10px'
          }}>
                  <div style={{
              flex: 1,
              height: '1px'
            }} />
                  <span style={{
              fontSize: '0.73rem',
              fontWeight: 600
            }}>OR</span>
                  <div style={{
              flex: 1,
              height: '1px'
            }} />
                </div>
                <GoogleBtn loading={loading} onClick={handleGoogleLogin} />
              </>}
          </div> : (/* ══════ REGISTER FORM ══════ */
      <form onSubmit={handleRegister} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '11px'
      }}>

            {/* Role selector – big visual cards */}
            <div>
              <label style={labelStyle}>Select Your Role *</label>
              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
                {Object.entries(ROLE_CONFIG).map(([role, cfg]) => <button key={role} type="button" onClick={() => setRegRole(role)} style={{
              padding: '10px 8px',
              cursor: 'pointer',
              textAlign: 'left',
              border: `2px solid ${regRole === role ? cfg.color : '#e5e7eb'}`
            }}>
                    <div style={{
                fontSize: '1.2rem',
                marginBottom: '2px'
              }}>{cfg.icon}</div>
                    <div style={{
                fontSize: '0.76rem',
                fontWeight: 800
              }}>{cfg.label}</div>
                    <div style={{
                fontSize: '0.68rem',
                marginTop: '2px',
                lineHeight: 1.3
              }}>{cfg.description}</div>
                  </button>)}
              </div>
            </div>

            {/* Doctor special banner */}
            {regRole === 'doctor' && <div style={{
          background: "#000000",
          border: "1.5px solid #000",
          padding: '10px 14px',
          fontSize: '0.77rem',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
                <Stethoscope size={16} color="#0284c7" style={{
            marginTop: '1px',
            flexShrink: 0
          }} />
                <span><strong>Doctor Registration</strong> — Fill your medical details below. Your Doctor Panel profile will be auto-created in the central database.</span>
              </div>}

            {/* Citizen / Patient special banner */}
            {regRole === 'patient' && <div style={{
          background: "#000000",
          border: "1.5px solid #000",
          padding: '10px 14px',
          fontSize: '0.77rem',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
                <span style={{
            fontSize: '1rem',
            flexShrink: 0
          }}>👤</span>
                <span><strong>Patient Registration</strong> — Aapki puri details database mein save hongi. Koi bhi dummy data nahi — sirf aapki real information.</span>
              </div>}

            {/* Full name */}
            <div>
              <label style={labelStyle}>Full Name * {regRole === 'doctor' && <span style={{
              fontSize: '0.7rem'
            }}>(e.g. Dr. Sharma)</span>}</label>
              <input type="text" required placeholder={regRole === 'doctor' ? 'Dr. Full Name...' : 'Enter full name...'} value={regName} onChange={e => setRegName(e.target.value)} style={smallInputStyle} />
            </div>

            {/* Doctor-specific fields */}
            {regRole === 'doctor' && <>
                <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '9px'
          }}>
                  <div>
                    <label style={labelStyle}>Specialization</label>
                    <input type="text" placeholder="e.g. General Physician" value={regSpecialization} onChange={e => setRegSpecialization(e.target.value)} style={smallInputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Qualification</label>
                    <input type="text" placeholder="e.g. MBBS, MD" value={regQualification} onChange={e => setRegQualification(e.target.value)} style={smallInputStyle} />
                  </div>
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '9px'
          }}>
                  <div>
                    <label style={labelStyle}><Award size={11} style={{
                  verticalAlign: 'middle'
                }} /> License / Reg. No.</label>
                    <input type="text" placeholder="e.g. NMC-2024-XXXXX" value={regLicense} onChange={e => setRegLicense(e.target.value)} style={smallInputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}><Mail size={11} style={{
                  verticalAlign: 'middle'
                }} /> Email (for OTP login)</label>
                    <input type="email" placeholder="doctor@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} style={smallInputStyle} />
                  </div>
                </div>
              </>}

            {/* Citizen/Patient-specific health fields */}
            {regRole === 'patient' && <>
                <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '9px'
          }}>
                  <div>
                    <label style={labelStyle}>📅 Date of Birth *</label>
                    <input type="date" required value={regDob} onChange={e => setRegDob(e.target.value)} style={{
                ...smallInputStyle,
                padding: '8px 10px'
              }} />
                  </div>
                  <div>
                    <label style={labelStyle}>⚧ Gender *</label>
                    <select required value={regGender} onChange={e => setRegGender(e.target.value)} style={{
                ...smallInputStyle,
                padding: '8px 10px'
              }}>
                      <option value="">Select gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '9px'
          }}>
                  <div>
                    <label style={labelStyle}>🩸 Blood Group</label>
                    <select value={regBloodGroup} onChange={e => setRegBloodGroup(e.target.value)} style={{
                ...smallInputStyle,
                padding: '8px 10px'
              }}>
                      <option value="">Select blood group...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}><Mail size={11} style={{
                  verticalAlign: 'middle'
                }} /> Email (optional)</label>
                    <input type="email" placeholder="your@email.com" value={regCitizenEmail} onChange={e => setRegCitizenEmail(e.target.value)} style={smallInputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>🆘 Emergency Contact Number</label>
                  <input type="text" placeholder="Emergency contact phone number..." value={regEmergencyContact} onChange={e => setRegEmergencyContact(e.target.value)} style={smallInputStyle} />
                </div>
              </>}

            {/* Username + Password */}
            <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '9px'
        }}>
              <div>
                <label style={labelStyle}>Username / ID *</label>
                <input type="text" required placeholder="Unique username..." value={regUsername} onChange={e => setRegUsername(e.target.value)} style={smallInputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <div style={{
              position: 'relative'
            }}>
                  <input type={showRegPassword ? 'text' : 'password'} required placeholder="Min 6 chars..." value={regPassword} onChange={e => setRegPassword(e.target.value)} style={{
                ...smallInputStyle,
                paddingRight: '32px'
              }} />
                  <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} style={{
                ...eyeBtnStyle,
                right: '8px'
              }}>
                    {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Phone + Village */}
            <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '9px'
        }}>
              <div>
                <label style={labelStyle}><Phone size={11} style={{
                verticalAlign: 'middle'
              }} /> Phone Number</label>
                <input type="text" placeholder="10-digit mobile..." value={regPhone} onChange={e => setRegPhone(e.target.value)} style={smallInputStyle} />
              </div>
              <div>
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
                  <label style={{
                ...labelStyle,
                marginBottom: 0
              }}>
                    <MapPin size={11} style={{
                  verticalAlign: 'middle'
                }} /> {regRole === 'doctor' ? 'Clinic City / Location' : 'Village / Location *'}
                  </label>
                  <button type="button" onClick={autoDetectGpsVillage} style={{
                border: 'none',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                    <LocateFixed size={10} />{gpsDetecting ? 'Detecting...' : 'GPS'}
                  </button>
                </div>
                <input type="text" required placeholder="Village / City..." value={regVillage} onChange={e => setRegVillage(e.target.value)} style={smallInputStyle} />
              </div>
            </div>

            {errorMsg && <ErrorBox msg={errorMsg} />}

            <button type="submit" disabled={loading} className="btn-primary" style={{
          padding: '11px',
          justifyContent: 'center',
          fontSize: '0.9rem',
          marginTop: '4px'
        }}>
              <span>{loading ? `Creating ${regRole === 'doctor' ? 'Doctor' : ''} Account...` : `Register ${ROLE_CONFIG[regRole]?.icon || ''}`}</span>
            </button>

            {regRole === 'doctor' && <>
                <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '2px 0'
          }}>
                  <div style={{
              flex: 1,
              height: '1px'
            }} />
                  <span style={{
              fontSize: '0.72rem',
              fontWeight: 600
            }}>OR SIGN UP WITH</span>
                  <div style={{
              flex: 1,
              height: '1px'
            }} />
                </div>
                <GoogleBtn loading={loading} onClick={handleGoogleLogin} label="Continue as Doctor with Google" />
              </>}
          </form>)}
      </div>

      {/* Fallback div for GSI renderButton if One Tap is blocked */}
      <div id="g-signin-btn-fallback" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }} />

      {showInternalBloodModal && <BloodFinderModal isOpen={showInternalBloodModal} onClose={() => setShowInternalBloodModal(false)} />}
    </div>;
}

/* ── Shared sub-components ── */
function ErrorBox({
  msg
}) {
  return <div style={{
    padding: '9px 12px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '7px'
  }}>
      <AlertCircle size={15} />
      <span>{msg}</span>
    </div>;
}
function GoogleOfficialButton({ onCredential }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const btnRef = React.useRef(null);
  const onCredentialRef = React.useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return;
    let isMounted = true;

    renderGoogleButtonSafely(
      btnRef.current,
      clientId,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 280
      },
      (credential, res) => {
        if (onCredentialRef.current) {
          onCredentialRef.current(credential, res);
        }
      }
    ).catch((e) => {
      if (isMounted) {
        console.warn('GSI render error:', e);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
        Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID).
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
      <div ref={btnRef} style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} />
    </div>
  );
}

function GoogleBtn({ loading, onClick, label = 'Continue with Google' }) {
  return <GoogleOfficialButton onCredential={onClick} />;
}

