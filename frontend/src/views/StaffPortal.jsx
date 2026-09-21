import React, { useState, useEffect } from 'react';
import { Mic, Activity, HeartPulse, UserPlus, ShieldAlert, CheckCircle2, AlertTriangle, Send, WifiOff, Phone, MessageSquare, Sparkles, RefreshCw, Clock, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { saveToOfflineQueue, getOfflineQueue, formatSmsPayload } from '../utils/offlineStorage';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
export default function StaffPortal({
  onOpenVoiceModal,
  onSelectPatientForRouting,
  isOnline,
  currentUser
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('Female');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('+91-');
  const [abhaId, setAbhaId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(98.6);
  const [pulse, setPulse] = useState(74);
  const [sugar, setSugar] = useState('Normal');
  const [currentRegion, setCurrentRegion] = useState('');

  // Auto-detect real live GPS village & district on load
  useEffect(() => {
    getLivePosition().then(async coords => {
      const geo = await reverseGeocode(coords.lat, coords.lng);
      if (geo.village) {
        setVillage(geo.village);
      }
      if (geo.district || geo.village) {
        setCurrentRegion(geo.shortAddress || `${geo.village || ''}, ${geo.district || ''}`);
      }
    });
  }, []);

  // AI Assessment & Risk preview
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [triageCategory, setTriageCategory] = useState('GREEN_ROUTINE');
  const [recommendedTier, setRecommendedTier] = useState('Local PHC');
  const [actionGuidance, setActionGuidance] = useState('Standard OPD consultation recommended.');
  const [smsPreview, setSmsPreview] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.getPatients();
      if (res.success) {
        setPatients(res.data);
      }
    } catch (e) {
      console.warn('Using local patients');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPatients();
  }, []);

  // Compute live triage risk preview as user fills vitals/symptoms
  useEffect(() => {
    const complaintLower = chiefComplaint.toLowerCase();
    let calculatedRisk = 'LOW';
    let category = 'GREEN_ROUTINE';
    let tier = 'Health & Wellness Sub-Centre / Local PHC';
    let guidance = 'Standard clinical evaluation with Medical Officer.';
    if (spo2 < 92 || complaintLower.includes('chest pain') || complaintLower.includes('heart') || complaintLower.includes('snake') || complaintLower.includes('behosh') || complaintLower.includes('saans')) {
      calculatedRisk = 'CRITICAL';
      category = 'RED_EMERGENCY';
      tier = 'District Hospital / Trauma & Cardiology Center';
      guidance = '🚨 Immediate emergency routing and 108 ambulance dispatch recommended.';
    } else if (spo2 < 95 || temp > 101 || complaintLower.includes('fever') || complaintLower.includes('pregnancy') || complaintLower.includes('bukhar') || complaintLower.includes('vomit') || complaintLower.includes('fracture')) {
      calculatedRisk = 'MODERATE';
      category = 'YELLOW_PRIORITY';
      tier = 'PHC or CHC with Active Diagnostics';
      guidance = 'Requires prompt doctor consultation, blood tests, or obstetric examination.';
    }
    setRiskLevel(calculatedRisk);
    setTriageCategory(category);
    setRecommendedTier(tier);
    setActionGuidance(guidance);

    // Update SMS format
    setSmsPreview(formatSmsPayload({
      name,
      age,
      gender,
      chiefComplaint,
      vitals: {
        bp,
        spo2,
        temp,
        pulse
      },
      riskLevel: calculatedRisk
    }));
  }, [chiefComplaint, bp, spo2, temp, pulse, name, age, gender]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!name || !chiefComplaint) return;
    const patientPayload = {
      name,
      age: Number(age),
      gender,
      village,
      phone,
      abhaId: abhaId || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      chiefComplaint,
      symptomTags: [chiefComplaint.slice(0, 30)],
      vitals: {
        bp,
        spo2: Number(spo2),
        temp: Number(temp),
        pulse: Number(pulse),
        sugar
      },
      riskLevel,
      triageCategory,
      recommendedFacilityType: recommendedTier,
      ashaWorkerName: currentUser?.name ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'ASHA Field Worker'
    };
    if (!isOnline) {
      // Save to offline storage queue
      saveToOfflineQueue(patientPayload);
      setSuccessNotice(`Saved in Offline Queue! Will auto-sync when network connects.`);
      setPatients(prev => [patientPayload, ...prev]);
    } else {
      try {
        const res = await api.registerPatient(patientPayload);
        if (res.success) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: {
              y: 0.8
            }
          });
          setSuccessNotice(`Patient registered & triaged as ${riskLevel} Priority!`);
          fetchPatients();
        }
      } catch (err) {
        saveToOfflineQueue(patientPayload);
        setSuccessNotice('Network error: Queued locally in Offline Store.');
      }
    }

    // Reset Form
    setName('');
    setChiefComplaint('');
    setSpo2(98);
    setTemp(98.6);
    setPulse(74);
    setTimeout(() => setSuccessNotice(''), 5000);
  };
  return <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      {/* View Title & Stats Banner */}
      <div style={{
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '14px'
    }}>
        <div>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <span className="badge badge-green">Village Field Companion</span>
            <span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
              {currentRegion ? `📍 ${currentRegion}` : '• National Rural Health Mission'}
            </span>
          </div>
          <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          marginTop: '4px'
        }}>
            ASHA Worker Patient Intake & AI Triage
          </h1>
          <p style={{
          fontSize: '0.88rem'
        }}>
            Offline-first clinical intake with multilingual voice-to-structured clinical triage.
          </p>
        </div>

        <button type="button" onClick={onOpenVoiceModal} className="btn-primary" style={{
        padding: '12px 24px',
        fontSize: '1rem'
      }}>
          <Mic size={20} />
          <span>Multilingual Voice AI Intake</span>
          <Sparkles size={16} />
        </button>
      </div>

      {successNotice && <div style={{
      marginBottom: '20px',
      padding: '14px 20px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.9rem',
      fontWeight: 700
    }}>
          <CheckCircle2 size={20} />
          <span>{successNotice}</span>
        </div>}

      {/* Main Grid: Left Intake Form, Right Live Triage Card & Patient Stream */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
      gap: '20px'
    }}>
        
        {/* Left: Patient Registration & Vitals Input */}
        <div className="glass-panel" style={{
        padding: '24px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
              <UserPlus size={20} color="#059669" />
              <h2 style={{
              fontSize: '1.2rem',
              fontWeight: 800
            }}>
                New Patient Consultation Form
              </h2>
            </div>
            {!isOnline && <span className="badge badge-yellow">
                <WifiOff size={12} /> Offline Mode
              </span>}
          </div>

          <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
            {/* Demographic row */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '10px'
          }}>
              <div>
                <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                  Patient Full Name *
                </label>
                <input type="text" required placeholder="Enter patient full name..." value={name} onChange={e => setName(e.target.value)} style={{
                width: '100%',
                padding: '9px 12px',
                border: "1px solid #000",
                fontSize: '0.9rem'
              }} />
              </div>

              <div>
                <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                  Age (Yrs) *
                </label>
                <input type="number" required value={age} onChange={e => setAge(e.target.value)} style={{
                width: '100%',
                padding: '9px 12px',
                border: "1px solid #000",
                fontSize: '0.9rem'
              }} />
              </div>

              <div>
                <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                  Gender
                </label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={{
                width: '100%',
                padding: '9px',
                border: "1px solid #000",
                fontSize: '0.9rem'
              }}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Village & Phone */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
              <div>
                <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                  <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                    Village / Habitation *
                  </label>
                  <button type="button" onClick={async () => {
                  const coords = await getLivePosition();
                  const geo = await reverseGeocode(coords.lat, coords.lng);
                  if (geo.village) setVillage(geo.village);
                  setSuccessNotice(`📍 Live GPS Detected: ${geo.shortAddress}`);
                }} style={{
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                    📍 Live GPS
                  </button>
                </div>
                <input type="text" required placeholder="Village or Live Location" value={village} onChange={e => setVillage(e.target.value)} style={{
                width: '100%',
                padding: '9px 12px',
                border: "1px solid #000",
                fontSize: '0.9rem'
              }} />
              </div>

              <div>
                <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                  ABHA ID (Ayushman Bharat)
                </label>
                <input type="text" placeholder="Enter ABHA ID (optional)..." value={abhaId} onChange={e => setAbhaId(e.target.value)} style={{
                width: '100%',
                padding: '9px 12px',
                border: "1px solid #000",
                fontSize: '0.85rem'
              }} />
              </div>
            </div>

            {/* Chief Complaint / Symptoms */}
            <div>
              <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
                <label style={{
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                  Chief Complaint & Symptoms *
                </label>
                <button type="button" onClick={onOpenVoiceModal} style={{
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                  <Mic size={12} /> Speak in Hindi
                </button>
              </div>
              <textarea rows={3} required placeholder="Describe patient symptoms, duration, and clinical history..." value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} style={{
              width: '100%',
              padding: '10px 12px',
              border: "1px solid #000",
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }} />
            </div>

            {/* Vitals Recording Section */}
            <div style={{
            padding: '14px',
            border: "1px solid #000"
          }}>
              <div style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                <HeartPulse size={16} color="#059669" />
                <span>Field Vitals Check (NCD & Maternal Screening)</span>
              </div>

              <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '10px'
            }}>
                <div>
                  <label style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>Blood Pressure (BP)</label>
                  <input type="text" value={bp} onChange={e => setBp(e.target.value)} style={{
                  width: '100%',
                  padding: '7px',
                  border: "1px solid #000",
                  fontSize: '0.85rem'
                }} />
                </div>

                <div>
                  <label style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>SpO2 (%)</label>
                  <input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} style={{
                  width: '100%',
                  padding: '7px',
                  border: spo2 < 92 ? '2px solid #ef4444' : '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: spo2 < 92 ? 800 : 500
                }} />
                </div>

                <div>
                  <label style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>Temp (°F)</label>
                  <input type="number" step="0.1" value={temp} onChange={e => setTemp(e.target.value)} style={{
                  width: '100%',
                  padding: '7px',
                  border: "1px solid #000",
                  fontSize: '0.85rem'
                }} />
                </div>

                <div>
                  <label style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}>Pulse (bpm)</label>
                  <input type="number" value={pulse} onChange={e => setPulse(e.target.value)} style={{
                  width: '100%',
                  padding: '7px',
                  border: "1px solid #000",
                  fontSize: '0.85rem'
                }} />
                </div>
              </div>
            </div>

            {/* Offline SMS/IVR Fallback Preview */}
            <div style={{
            padding: '10px 14px',
            border: "1px solid #000"
          }}>
              <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
                <MessageSquare size={13} />
                <span>Feature-Phone SMS / IVR Telemetry Payload:</span>
              </div>
              <code style={{
              fontSize: '0.75rem',
              wordBreak: 'break-all',
              display: 'block',
              marginTop: '4px'
            }}>
                {smsPreview}
              </code>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary" style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.95rem',
            justifyContent: 'center'
          }}>
              <Send size={16} />
              <span>{isOnline ? 'Save & Trigger Intelligent Triage' : 'Save Locally in Offline Queue'}</span>
            </button>
          </form>
        </div>

        {/* Right: Live AI Triage Decision Support & Patient Stream */}
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
          {/* Live AI Triage Decision Box */}
          <div className="glass-panel" style={{
          padding: '22px',
          border: `2px solid ${riskLevel === 'CRITICAL' ? '#ef4444' : riskLevel === 'MODERATE' ? '#f59e0b' : '#10b981'}`
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
              <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                <Activity size={20} color={riskLevel === 'CRITICAL' ? '#ef4444' : '#059669'} />
                <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 800
              }}>
                  Real-Time AI Clinical Triage Matrix
                </h3>
              </div>
              <span className={`badge ${riskLevel === 'CRITICAL' ? 'badge-red' : riskLevel === 'MODERATE' ? 'badge-yellow' : 'badge-green'}`}>
                {riskLevel} RISK ({triageCategory})
              </span>
            </div>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
              <div style={{
              padding: '12px'
            }}>
                <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                  Recommended Healthcare Facility Tier:
                </div>
                <div style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                marginTop: '2px'
              }}>
                  {recommendedTier}
                </div>
              </div>

              <div style={{
              padding: '12px',
              border: "1px solid #000"
            }}>
                <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                  ASHA Field Protocol Guidance:
                </div>
                <div style={{
                fontSize: '0.85rem',
                marginTop: '2px',
                fontWeight: 500
              }}>
                  {actionGuidance}
                </div>
              </div>

              <div style={{
              fontSize: '0.72rem',
              fontStyle: 'italic'
            }}>
                💡 <strong>Responsible AI:</strong> Designed for clinical triage & rapid referral routing only. Does not replace physician diagnosis.
              </div>
            </div>
          </div>

          {/* Recently Triaged Patients Stream */}
          <div className="glass-panel" style={{
          padding: '20px',
          flex: 1
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
              <h3 style={{
              fontSize: '1.05rem',
              fontWeight: 800
            }}>
                Recent Village Consultations ({patients.length})
              </h3>
              <button onClick={fetchPatients} style={{
              border: 'none',
              cursor: 'pointer'
            }}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
              {patients.map((p, idx) => <div key={p.id || idx} className="glass-card" style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
                  <div style={{
                flex: 1
              }}>
                    <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                      <strong style={{
                    fontSize: '0.9rem'
                  }}>{p.name}</strong>
                      <span style={{
                    fontSize: '0.75rem'
                  }}>({p.age}y / {p.gender})</span>
                      <span className={`badge ${p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH' ? 'badge-red' : p.riskLevel === 'MODERATE' ? 'badge-yellow' : 'badge-green'}`} style={{
                    fontSize: '0.65rem'
                  }}>
                        {p.riskLevel}
                      </span>
                    </div>
                    <div style={{
                  fontSize: '0.78rem',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                      {p.chiefComplaint}
                    </div>
                    <div style={{
                  fontSize: '0.7rem',
                  marginTop: '2px'
                }}>
                      📍 {p.village} | SpO2: {p.vitals?.spo2 || 98}% | BP: {p.vitals?.bp || '120/80'}
                    </div>
                  </div>

                  <button onClick={() => onSelectPatientForRouting(p)} className="btn-secondary" style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap'
              }}>
                    Route & Refer ➔
                  </button>
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>;
}
