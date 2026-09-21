import React, { useState, useEffect } from 'react';
import { User, Search, Calendar, Clock, Activity, Heart, AlertTriangle, CheckCircle2, FileText, Plus, Trash2, Send, Phone, Shield, Edit3, Save, Bell, Stethoscope, Sparkles, ArrowRight, Eye, RefreshCw, Award, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../utils/api';
import PatientLookup from '../PatientLookup';
import DiagnosisPrescriptionForm from './DiagnosisPrescriptionForm';

export default function PatientMedicalHistoryView({
  currentUser,
  onLoadPatientToRx,
  onSetReminderSuccess,
  initialPatientId,
  initialTab = 'history'
}) {
  const [searchQuery, setSearchQuery] = useState(initialPatientId || '');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [accessTimestamp, setAccessTimestamp] = useState('');
  const [accessFormatted, setAccessFormatted] = useState('');
  const [activeInnerTab, setActiveInnerTab] = useState(initialTab || 'history'); // 'history' | 'profile' | 'addVisit' | 'reminder'

  // Doctor Dashboard metrics
  const [docMetrics, setDocMetrics] = useState({
    todayPatients: 0,
    pendingConsultations: 0,
    recentDiagnosesCount: 0,
    recentRxCount: 0,
    followUpsCount: 0,
    stockAdequateCount: 0
  });

  useEffect(() => {
    const fetchDocMetrics = async () => {
      try {
        const [patientsRes, rxRes, invRes] = await Promise.all([
          api.getPatients(),
          api.getPrescriptions(),
          api.getStock()
        ]);
        const pList = patientsRes.data || [];
        const rList = rxRes.data || [];
        const mList = invRes.data || [];

        const adequateMeds = mList.filter(m => m.status === 'In Stock' || m.status === 'Adequate').length;
        setDocMetrics({
          todayPatients: pList.length,
          pendingConsultations: pList.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length,
          recentDiagnosesCount: pList.reduce((acc, p) => acc + (p.medicalHistory?.length || 0), 0) || pList.length,
          recentRxCount: rList.length,
          followUpsCount: pList.reduce((acc, p) => acc + (p.followUpReminders?.length || 0), 0),
          stockAdequateCount: adequateMeds
        });
      } catch (e) {
        console.warn('Doc metrics load note:', e);
      }
    };
    fetchDocMetrics();
  }, []);

  // Live Access Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-search and tab switch when initialPatientId or initialTab changes
  useEffect(() => {
    if (initialPatientId) {
      setSearchQuery(initialPatientId);
      handleSearchPatient(initialPatientId);
      if (initialTab) {
        setActiveInnerTab(initialTab);
      }
    }
  }, [initialPatientId, initialTab]);
  const handleSearchPatient = async targetId => {
    const idToSearch = targetId || searchQuery;
    if (!idToSearch || !idToSearch.trim()) {
      setSearchMsg('Please enter a registered Patient ID (e.g. PAT-456787) or Mobile Number (e.g. 123456787).');
      return;
    }
    setSearchLoading(true);
    setSearchMsg('');
    try {
      const doctorName = currentUser?.name || 'Dr. Attending Physician';
      const doctorId = currentUser?.id || 'DOC-CURRENT';
      const res = await api.getPatientHistory(idToSearch.trim(), doctorName, doctorId);
      if (res.success && res.patient) {
        setPatientData(res.patient);
        setAccessTimestamp(res.accessTimestamp || new Date().toISOString());
        setAccessFormatted(res.currentAccessDateFormatted || new Date().toLocaleString('en-IN'));
        setSearchMsg(`✅ Patient record verified: ${res.patient.name} (${res.patient.id})`);
      } else {
        setSearchMsg(res.message || 'No patient record found for this ID.');
      }
    } catch (err) {
      setSearchMsg('Error fetching patient medical history. Please check connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // ─── Edit Patient Profile State  ─────────────────────
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('Female');
  const [editBloodGroup, setEditBloodGroup] = useState('B+');
  const [editVillage, setEditVillage] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editGuardian, setEditGuardian] = useState('');
  const [allergiesList, setAllergiesList] = useState([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [chronicList, setChronicList] = useState([]);
  const [newChronicInput, setNewChronicInput] = useState('');

  // Doctor-specific clinical parameters
  const [editVitalsBp, setEditVitalsBp] = useState('120/80');
  const [editVitalsSpo2, setEditVitalsSpo2] = useState('98');
  const [editVitalsTemp, setEditVitalsTemp] = useState('98.4');
  const [editVitalsPulse, setEditVitalsPulse] = useState('72');
  const [editVitalsSugar, setEditVitalsSugar] = useState('Normal');
  const [editHealthCondition, setEditHealthCondition] = useState('Stable under Treatment');
  const [editDoctorRemarks, setEditDoctorRemarks] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Sync profile form state when patient data changes
  useEffect(() => {
    if (patientData) {
      setEditName(patientData.name || '');
      setEditAge(patientData.age ? String(patientData.age) : '');
      setEditGender(patientData.gender || 'Female');
      setEditBloodGroup(patientData.bloodGroup || 'B+');
      setEditVillage(patientData.village || '');
      setEditPhone(patientData.phone || '');
      setEditEmergency(patientData.emergencyContact || '');
      setEditGuardian(patientData.guardianName || '');
      setAllergiesList(patientData.knownAllergies || []);
      setChronicList(patientData.chronicConditions || []);

      // Vitals sync
      if (patientData.vitals) {
        setEditVitalsBp(patientData.vitals.bp || '120/80');
        setEditVitalsSpo2(patientData.vitals.spo2 ? String(patientData.vitals.spo2) : '98');
        setEditVitalsTemp(patientData.vitals.temp ? String(patientData.vitals.temp) : '98.4');
        setEditVitalsPulse(patientData.vitals.pulse ? String(patientData.vitals.pulse) : '72');
        setEditVitalsSugar(patientData.vitals.sugar || 'Normal');
      }

      // Health status sync
      setEditHealthCondition(patientData.currentHealthStatus?.condition || 'Stable under Treatment');
      setEditDoctorRemarks(patientData.currentHealthStatus?.summary || '');
    }
  }, [patientData]);
  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!patientData) return;
    setProfileSaving(true);
    setProfileSuccessMsg('');
    try {
      const targetId = patientData.id || patientData._id || patientData.phone || editPhone || 'patient';
      const res = await api.updatePatientProfile(targetId, {
        patientId: patientData.id,
        id: patientData.id,
        _id: patientData._id,
        name: editName,
        age: editAge,
        gender: editGender,
        bloodGroup: editBloodGroup,
        village: editVillage,
        phone: editPhone,
        emergencyContact: editEmergency,
        guardianName: editGuardian,
        knownAllergies: allergiesList,
        chronicConditions: chronicList,
        vitals: {
          bp: editVitalsBp,
          spo2: editVitalsSpo2,
          temp: editVitalsTemp,
          pulse: editVitalsPulse,
          sugar: editVitalsSugar
        },
        currentHealthStatus: editHealthCondition,
        doctorRemarks: editDoctorRemarks,
        doctorId: currentUser?.id || 'DOC-ATTENDING',
        doctorName: currentUser?.name || 'Attending Physician'
      });
      if (res.success) {
        setPatientData(res.patient);
        setProfileSuccessMsg('Patient profile & clinical baseline updated successfully in database! ✅');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            y: 0.6
          }
        });
      } else {
        setProfileSuccessMsg(res.message || 'Failed to update patient profile.');
      }
    } catch {
      setProfileSuccessMsg('Failed to update patient profile. Please check connection.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Add New Visit Record Form State ─────────────────────────────────────
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newVisitType, setNewVisitType] = useState('OPD Consultation');
  const [newFacility, setNewFacility] = useState('Primary Health Centre (PHC)');
  const [newNotes, setNewNotes] = useState('');
  const [newCondition, setNewCondition] = useState('Stable under Treatment');
  const [newVitalsBp, setNewVitalsBp] = useState('120/80');
  const [newVitalsSpo2, setNewVitalsSpo2] = useState('98');
  const [newVitalsTemp, setNewVitalsTemp] = useState('98.4');
  const [newVitalsPulse, setNewVitalsPulse] = useState('72');
  const [newVitalsSugar, setNewVitalsSugar] = useState('Normal');

  // Prescriptions list for this visit
  const [visitRx, setVisitRx] = useState([{
    medicine: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }]);

  // Test Reports list for this visit
  const [visitTests, setVisitTests] = useState([{
    testName: '',
    result: '',
    normalRange: '',
    status: 'Normal'
  }]);
  const [visitSaving, setVisitSaving] = useState(false);
  const [visitSuccessMsg, setVisitSuccessMsg] = useState('');
  const handleAddVisitRecord = async e => {
    e.preventDefault();
    if (!patientData || !newDiagnosis) return;
    setVisitSaving(true);
    setVisitSuccessMsg('');
    try {
      const payload = {
        visitType: newVisitType,
        facilityName: newFacility,
        doctorName: currentUser?.name || 'Dr. Attending Physician',
        diagnosis: newDiagnosis,
        symptoms: newSymptoms || patientData.chiefComplaint,
        prescriptions: visitRx.filter(r => r.medicine.trim() !== ''),
        treatments: ['Physical Examination', 'Vitals Assessment', 'Oral Pharmacotherapy'],
        testReports: visitTests.filter(t => t.testName.trim() !== ''),
        clinicalNotes: newNotes,
        currentCondition: newCondition,
        vitalsAtVisit: {
          bp: newVitalsBp,
          spo2: Number(newVitalsSpo2),
          temp: Number(newVitalsTemp),
          pulse: Number(newVitalsPulse),
          sugar: newVitalsSugar
        }
      };
      const res = await api.addPatientMedicalHistory(patientData.id, payload);
      if (res.success) {
        setPatientData(prev => ({
          ...prev,
          medicalHistory: res.medicalHistory,
          currentHealthStatus: res.currentHealthStatus,
          vitals: payload.vitalsAtVisit
        }));
        setVisitSuccessMsg('Clinical visit and diagnosis successfully saved to patient medical history!');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setNewDiagnosis('');
        setNewSymptoms('');
        setNewNotes('');
        setActiveInnerTab('history');
      }
    } catch {
      setVisitSuccessMsg('Failed to save visit record. Please check connection.');
    } finally {
      setVisitSaving(false);
    }
  };

  // ─── Set Follow-Up Reminder (Tomorrow / Following Day) ────────────────────
  const getTomorrowDateStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [reminderDueDate, setReminderDueDate] = useState(getTomorrowDateStr());
  const [reminderReason, setReminderReason] = useState('Following day clinical review & vitals checkup');
  const [reminderPriority, setReminderPriority] = useState('NORMAL');
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState('');
  const handleCreateReminder = async (isFollowingDayQuick = false) => {
    if (!patientData) return;
    setReminderSaving(true);
    setReminderSuccessMsg('');
    const targetDate = isFollowingDayQuick ? getTomorrowDateStr() : reminderDueDate;
    const targetReason = isFollowingDayQuick ? `Follow-up checkup on following day (${patientData.chiefComplaint})` : reminderReason;
    try {
      const res = await api.addFollowUpReminder({
        patientId: patientData.id,
        patientName: patientData.name,
        patientPhone: patientData.phone,
        dueDate: targetDate,
        reason: targetReason,
        priority: reminderPriority,
        doctorId: currentUser?.id || 'DOC-CURRENT',
        doctorName: currentUser?.name || 'Dr. Attending Physician'
      });
      if (res.success) {
        setReminderSuccessMsg(`✅ Reminder set! Follow-up scheduled for ${patientData.name} on ${new Date(targetDate).toLocaleDateString('en-IN')}`);
        confetti({
          particleCount: 70,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setPatientData(prev => {
          if (!prev) return prev;
          const currentList = prev.followUpReminders || [];
          return {
            ...prev,
            followUpReminders: [res.reminder, ...currentList]
          };
        });
        if (onSetReminderSuccess) onSetReminderSuccess(res.reminder);
      } else {
        setReminderSuccessMsg(`❌ ${res.message || 'Failed to create reminder.'}`);
      }
    } catch {
      setReminderSuccessMsg('Failed to create reminder. Please try again.');
    } finally {
      setReminderSaving(false);
    }
  };
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>

      {/* ══════ TOP ACCESS BANNER WITH REAL-TIME TIMESTAMP ══════ */}
      <div style={{
      background: "#000000",
      padding: '24px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
        {/* Decorative glowing orbs */}
        <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '140px',
        height: '140px',
        pointerEvents: 'none'
      }} />
        <div style={{
        position: 'absolute',
        bottom: '-20px',
        left: '60px',
        width: '100px',
        height: '100px',
        pointerEvents: 'none'
      }} />

        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        zIndex: 1
      }}>
          <div style={{
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: "1.5px solid #000"
        }}>
            <Stethoscope size={28} color="#34d399" />
          </div>
          <div>
            <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 900,
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
              Patient Complete Medical History & Clinical Profile
            </h2>
            <p style={{
            fontSize: '0.82rem',
            margin: '5px 0 0',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
              <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>📋 Central Rural EHR</span>
              <span style={{}}>•</span>
              <span>🔬 Diagnostics & Investigations</span>
              <span style={{}}>•</span>
              <span>💊 Prescriptions</span>
              <span style={{}}>•</span>
              <span>🔔 Follow-up Automation</span>
            </p>
          </div>
        </div>

        {/* Live Doctor Access Timestamp Indicator */}
        <div style={{
        border: "1px solid #000",
        padding: '12px 20px',
        textAlign: 'right',
        zIndex: 1
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          justifyContent: 'flex-end',
          marginBottom: '4px'
        }}>
            <span style={{
            width: '9px',
            height: '9px',
            display: 'inline-block'
          }} />
            <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
              Doctor Access Audit Timestamp
            </span>
          </div>
          <div style={{
          fontSize: '1rem',
          fontWeight: 800,
          fontFamily: 'monospace',
          letterSpacing: '0.01em'
        }}>
            {currentTime.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })} • {currentTime.toLocaleTimeString('en-IN')}
          </div>
          {accessFormatted && <div style={{
          fontSize: '0.68rem',
          marginTop: '3px',
          opacity: 0.85
        }}>
              Last Verified from DB: {accessFormatted}
            </div>}
        </div>
      </div>

      {/* ══════ DOCTOR DASHBOARD CARDS (Prompt Section 16) ══════ */}
      <div style={{
      padding: '18px 22px',
      border: "1.5px solid #000"
    }}>
        <div style={{
        fontSize: '0.82rem',
        fontWeight: 700,
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <Search size={15} color="#059669" />
          <span>Access Patient Records by Patient ID or Mobile Number </span>
        </div>

        <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
          <div style={{
          flex: 1,
          minWidth: '260px',
          position: 'relative'
        }}>
            <User size={17} color="#9ca3af" style={{
            position: 'absolute',
            left: '12px',
            top: '12px'
          }} />
            <input type="text" placeholder="Enter Patient ID (e.g. PAT-456787) or Mobile (123456787)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchPatient()} style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            border: "1.5px solid #000",
            fontSize: '0.9rem',
            outline: 'none',
            boxSizing: 'border-box'
          }} />
          </div>

          <button type="button" disabled={searchLoading} onClick={() => handleSearchPatient()} className="btn-primary" style={{
          padding: '10px 20px',
          fontSize: '0.88rem'
        }}>
            {searchLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{searchLoading ? 'Searching DB...' : 'Fetch Medical History'}</span>
          </button>
        </div>

        {/* Search Tip */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        flexWrap: 'wrap'
      }}>
          <span style={{
          fontSize: '0.72rem',
          fontWeight: 600
        }}>💡 Tip:</span>
          <span style={{
          fontSize: '0.72rem'
        }}>Enter the patient's registered mobile number (e.g. <strong>123456787</strong>) or Patient ID (e.g. <strong>PAT-456787</strong>) and press <strong>Fetch Medical History</strong>.</span>
        </div>

        {searchMsg && <div style={{
        marginTop: '10px',
        fontSize: '0.78rem',
        fontWeight: 600
      }}>
            {searchMsg}
          </div>}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '18px'
      }}>
        {[
          { label: "Today's Patients", value: docMetrics.todayPatients, color: '#059669', bg: '#ecfdf5', icon: '👥' },
          { label: 'Pending Consultations', value: docMetrics.pendingConsultations, color: '#d97706', bg: '#fffbeb', icon: '⏳' },
          { label: 'Recent Diagnoses', value: docMetrics.recentDiagnosesCount, color: '#0284c7', bg: '#f0f9ff', icon: '🩺' },
          { label: 'Recent Prescriptions', value: docMetrics.recentRxCount, color: '#7c3aed', bg: '#f5f3ff', icon: '📄' },
          { label: 'Pending Follow-ups', value: docMetrics.followUpsCount, color: '#ea580c', bg: '#fff7ed', icon: '⏰' },
          { label: 'Medicine Availability', value: `${docMetrics.stockAdequateCount} In Stock`, color: '#16a34a', bg: '#f0fdf4', icon: '💊' }
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: card.bg,
              border: `1.5px solid ${card.color}25`,
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{card.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginTop: '2px', textTransform: 'uppercase' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* ══════ UNIFIED PATIENT LOOKUP (Mobile, SSC, ID, QR) ══════ */}
      <PatientLookup
        activeRole="doctor"
        title="Doctor Desk – Patient Lookup (Mobile, SSC, ID, QR)"
        onPatientSelect={(p) => {
          setPatientData(p);
          handleSearchPatient(p.id);
        }}
      />

      {/* ══════ EMPTY STATE: No patient searched yet ══════ */}
      {!patientData && !searchLoading && <div style={{
      padding: '48px 32px',
      border: "2px dashed #000",
      textAlign: 'center'
    }}>
          <div style={{
        width: '72px',
        height: '72px',
        background: "#000000",
        border: "2px solid #000",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
            <Search size={32} color="#10b981" />
          </div>
          <h3 style={{
        fontSize: '1.15rem',
        fontWeight: 800,
        margin: '0 0 8px'
      }}>
            Search for a Patient
          </h3>
          <p style={{
        fontSize: '0.85rem',
        margin: '0 0 4px'
      }}>
            Enter a <strong>Patient ID</strong> (e.g. PAT-IND-XXXX) or the patient's <strong>registered mobile number</strong> above.
          </p>
          <p style={{
        fontSize: '0.78rem',
        margin: 0
      }}>
            All data is fetched live from the central GraminArogya database — no demo data.
          </p>
        </div>}

      {patientData && <>
          {/* ══════ PATIENT PROFILE SNAPSHOT & CURRENT HEALTH STATUS ══════ */}
          <div style={{
        padding: '22px 24px',
        border: "1.5px solid #000"
      }}>
            <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
                <div style={{
              width: '54px',
              height: '54px',
              background: "#000000",
              border: "2px solid #000",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800
            }}>
                  {patientData.name ? patientData.name.charAt(0) : 'P'}
                </div>
                <div>
                  <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                    <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  margin: 0
                }}>
                      {patientData.name}
                    </h3>
                    <span style={{
                  border: "1px solid #000",
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                      {patientData.id}
                    </span>
                    <span style={{
                  border: `1px solid ${patientData.riskLevel === 'CRITICAL' ? '#fecaca' : '#fed7aa'}`,
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                      {patientData.riskLevel || 'LOW'} RISK
                    </span>
                  </div>
                  <div style={{
                fontSize: '0.8rem',
                marginTop: '3px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                    {patientData.age && <span>{patientData.age} Years</span>}
                    {patientData.gender && <span>• {patientData.gender}</span>}
                    {patientData.bloodGroup && <span>• Blood Group: <strong style={{}}>{patientData.bloodGroup}</strong></span>}
                    {patientData.village && <span>• Village: <strong>{patientData.village}</strong></span>}
                    {patientData.phone && <span>• 📞 <strong>{patientData.phone}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons: 1-Click Following Day Checkup & Rx */}
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
                <button type="button" disabled={reminderSaving} onClick={() => handleCreateReminder(true)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: "1.5px solid #000",
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }} title="Schedule a follow-up checkup for tomorrow">
                  <Bell size={14} color="#d97706" />
                  <span>{reminderSaving ? 'Setting...' : '🔔 Remind for Following Day Checkup'}</span>
                </button>

                <button type="button" onClick={() => setActiveInnerTab(prev => prev === 'profile' ? 'history' : 'profile')} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: "1.5px solid #000",
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }} title="Edit patient demographic and clinical baseline">
                  <Edit3 size={14} />
                  <span>{activeInnerTab === 'profile' ? '📋 Back to History' : '✏️ Edit Profile (Doctor)'}</span>
                </button>

                <button type="button" onClick={() => onLoadPatientToRx && onLoadPatientToRx(patientData)} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              background: "#000000",
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}>
                  <FileText size={14} />
                  <span>Write Branded Rx</span>
                </button>
              </div>
            </div>

            {reminderSuccessMsg && <div style={{
          border: "1px solid #000",
          padding: '8px 12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '12px'
        }}>
                {reminderSuccessMsg}
              </div>}

            {/* Current Health Status Comparison Card */}
            <div style={{
          border: "1px solid #000",
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
              <div>
                <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>Current Condition</span>
                <div style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              marginTop: '2px'
            }}>
                  {patientData.currentHealthStatus?.condition || 'Stable under Treatment'}
                </div>
              </div>
              <div>
                <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>Current Vitals</span>
                <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              marginTop: '2px'
            }}>
                  {patientData.vitals?.bp ? `BP: ${patientData.vitals.bp}` : ''}
                  {patientData.vitals?.spo2 ? ` • SpO2: ${patientData.vitals.spo2}%` : ''}
                  {patientData.vitals?.temp ? ` • Temp: ${patientData.vitals.temp}°F` : ''}
                  {!patientData.vitals?.bp && !patientData.vitals?.spo2 && !patientData.vitals?.temp && <span style={{}}>Not recorded yet</span>}
                </div>
              </div>
              <div>
                <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>Chief Complaint</span>
                <div style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              marginTop: '2px'
            }}>
                  {patientData.chiefComplaint || 'None recorded'}
                </div>
              </div>
              <div>
                <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>Known Allergies</span>
                <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              marginTop: '2px'
            }}>
                  {(patientData.knownAllergies || []).join(', ') || 'No known allergies'}
                </div>
              </div>
            </div>

            {/* Sub-Navigation: History Timeline vs Full Profile vs Add Visit Record */}
            <div style={{
              display: 'flex',
              gap: '6px',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '2px'
            }}>
              {[
                { id: 'history', label: `📋 Medical History (${(patientData.medicalHistory || []).length} Visits)` },
                { id: 'diagnosisRx', label: '💊 Diagnosis & Prescription' },
                { id: 'profile', label: '✏️ Edit Patient Profile ' },
                { id: 'addVisit', label: '➕ Add Consultation / Visit Entry' },
                { id: 'reminder', label: '⏰ Follow-up Reminders' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveInnerTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: activeInnerTab === tab.id ? '#059669' : 'transparent',
                    color: activeInnerTab === tab.id ? '#ffffff' : '#4b5563',
                    fontWeight: activeInnerTab === tab.id ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══════ SUB-TAB 0: DIAGNOSIS & PRESCRIPTION (Formulary & Related Meds) ══════ */}
          {activeInnerTab === 'diagnosisRx' && (
            <DiagnosisPrescriptionForm
              patient={patientData}
              currentUser={currentUser}
              onPrescriptionSaved={(newRx, updatedPatient) => {
                if (updatedPatient) {
                  setPatientData(updatedPatient);
                } else {
                  handleSearchPatient(patientData.id);
                }
                setActiveInnerTab('history');
              }}
            />
          )}

          {/* ══════ SUB-TAB 1: COMPLETE MEDICAL HISTORY TIMELINE ══════ */}
          {activeInnerTab === 'history' && <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
              <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
                <h4 style={{
            fontSize: '1rem',
            fontWeight: 800,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                  <FileText size={18} color="#059669" />
                  <span>Chronological Medical History & Previous Consultations</span>
                </h4>
                <button type="button" onClick={() => setActiveInnerTab('addVisit')} style={{
            padding: '6px 12px',
            border: "1px solid #000",
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                  <Plus size={13} /> Add Clinical Visit
                </button>
              </div>

              {!patientData.medicalHistory || patientData.medicalHistory.length === 0 ? <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          border: "2px dashed #000"
        }}>
                  <div style={{
            fontSize: '2.5rem',
            marginBottom: '12px'
          }}>📋</div>
                  <div style={{
            fontSize: '1rem',
            fontWeight: 800,
            marginBottom: '6px'
          }}>No Clinical Visits Recorded Yet</div>
                  <div style={{
            fontSize: '0.83rem',
            marginBottom: '16px'
          }}>This patient has no past visit history in the database. Add their first consultation entry below.</div>
                  <button type="button" onClick={() => setActiveInnerTab('addVisit')} style={{
            padding: '9px 20px',
            border: 'none',
            background: "#000000",
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                    <Plus size={15} /> Add First Clinical Visit
                  </button>
                </div> : patientData.medicalHistory.map((visit, index) => <div key={visit._id || index} style={{
          border: "1.5px solid #000",
          padding: '20px',
          position: 'relative'
        }}>
                    {/* Visit Header */}
                    <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px'
          }}>
                      <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
                        <div style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}>
                          #{patientData.medicalHistory.length - index}
                        </div>
                        <div>
                          <div style={{
                  fontSize: '0.98rem',
                  fontWeight: 800
                }}>
                            {visit.diagnosis}
                          </div>
                          <div style={{
                  fontSize: '0.76rem'
                }}>
                            {visit.visitType} • {visit.facilityName} • Attended by: <strong>{visit.doctorName}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{
              textAlign: 'right'
            }}>
                        <div style={{
                border: "1px solid #000",
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                          <Calendar size={12} />
                          {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
                        </div>
                      </div>
                    </div>

                    {/* Vitals snapshot at this visit */}
                    {visit.vitalsAtVisit && <div style={{
            padding: '8px 12px',
            fontSize: '0.76rem',
            marginBottom: '12px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
                        <span><strong>BP:</strong> {visit.vitalsAtVisit.bp || '120/80'}</span>
                        <span><strong>SpO2:</strong> {visit.vitalsAtVisit.spo2 || 98}%</span>
                        <span><strong>Temp:</strong> {visit.vitalsAtVisit.temp || 98.4}°F</span>
                        <span><strong>Pulse:</strong> {visit.vitalsAtVisit.pulse || 72} bpm</span>
                        <span><strong>Sugar:</strong> {visit.vitalsAtVisit.sugar || 'Normal'}</span>
                      </div>}

                    {/* Symptoms & Clinical Notes */}
                    {visit.symptoms && <div style={{
            fontSize: '0.8rem',
            marginBottom: '10px'
          }}>
                        <strong>Symptoms & Observations:</strong> {visit.symptoms}
                      </div>}

                    {/* Prescriptions Table */}
                    {visit.prescriptions && visit.prescriptions.length > 0 && <div style={{
            marginBottom: '12px'
          }}>
                        <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                          💊 Prescriptions Given:
                        </div>
                        <div style={{
              overflowX: 'auto'
            }}>
                          <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem'
              }}>
                            <thead>
                              <tr style={{
                    textAlign: 'left'
                  }}>
                                <th style={{
                      padding: '6px 10px'
                    }}>Medicine</th>
                                <th style={{
                      padding: '6px 10px'
                    }}>Dosage</th>
                                <th style={{
                      padding: '6px 10px'
                    }}>Frequency</th>
                                <th style={{
                      padding: '6px 10px'
                    }}>Duration</th>
                                <th style={{
                      padding: '6px 10px'
                    }}>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visit.prescriptions.map((rx, rIdx) => <tr key={rIdx} style={{
                    borderBottom: "1px solid #000"
                  }}>
                                  <td style={{
                      padding: '6px 10px',
                      fontWeight: 700
                    }}>{rx.medicine}</td>
                                  <td style={{
                      padding: '6px 10px'
                    }}>{rx.dosage}</td>
                                  <td style={{
                      padding: '6px 10px'
                    }}>{rx.frequency}</td>
                                  <td style={{
                      padding: '6px 10px'
                    }}>{rx.duration}</td>
                                  <td style={{
                      padding: '6px 10px'
                    }}>{rx.instructions}</td>
                                </tr>)}
                            </tbody>
                          </table>
                        </div>
                      </div>}

                    {/* Diagnostic Test Reports */}
                    {visit.testReports && visit.testReports.length > 0 && <div style={{
            marginBottom: '10px'
          }}>
                        <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                          🔬 Diagnostic Test Reports:
                        </div>
                        <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '8px'
            }}>
                          {visit.testReports.map((test, tIdx) => <div key={tIdx} style={{
                border: `1px solid ${test.status === 'Abnormal' ? '#fed7aa' : '#bbf7d0'}`,
                padding: '8px 10px',
                fontSize: '0.75rem'
              }}>
                              <div style={{
                  fontWeight: 700
                }}>
                                {test.testName}
                              </div>
                              <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginTop: '2px'
                }}>
                                {test.result}
                              </div>
                              <div style={{
                  fontSize: '0.68rem',
                  marginTop: '2px'
                }}>
                                Ref Range: {test.normalRange} • Status: <strong>{test.status}</strong>
                              </div>
                            </div>)}
                        </div>
                      </div>}

                    {/* Treatments Done */}
                    {visit.treatments && visit.treatments.length > 0 && <div style={{
            fontSize: '0.76rem'
          }}>
                        <strong>Procedures / Treatments:</strong> {visit.treatments.join(' • ')}
                      </div>}
                  </div>)}
            </div>}

          {/* ══════ SUB-TAB 2: COMPLETE PATIENT PROFILE & MANAGEMENT  ══════ */}
          {activeInnerTab === 'profile' && <form onSubmit={handleSaveProfile} style={{
        border: "1.5px solid #000",
        padding: '24px'
      }}>
              {/* Doctor Permissions & Scope Banner */}
              <div style={{
          background: "#000000",
          border: "1.5px solid #000",
          padding: '14px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
                <div style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
                  <Stethoscope size={20} />
                </div>
                <div style={{
            flex: 1
          }}>
                  <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
                    <strong style={{
                fontSize: '0.92rem'
              }}>
                      Doctor Clinical Authority & Profile Editing Permissions
                    </strong>
                    <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 8px',
                letterSpacing: '0.04em'
              }}>
                      AUTHORIZED CLINICIAN
                    </span>
                  </div>
                  <div style={{
              fontSize: '0.78rem',
              marginTop: '4px',
              lineHeight: 1.45
            }}>
                    As an attending doctor, you have medical authority to update the patient's <strong>Clinical Baseline</strong> (Blood Group, Medical Vitals, Diagnosed Conditions, Allergies, Health Status, and Clinical Advice) and verify demographic records in the database.
                    <span style={{
                display: 'block',
                fontSize: '0.72rem',
                marginTop: '2px'
              }}>
                      🔒 Patient authentication credentials (passwords/logins) are strictly private to the patient.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1: Demographics & Identity */}
              <div style={{
          marginBottom: '22px'
        }}>
                <div style={{
            fontSize: '0.86rem',
            fontWeight: 800,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                  <User size={16} color="#059669" />
                  <span>1. Patient Demographics & Contact Baseline</span>
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Full Name *</label>
                    <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Age (Years)</label>
                    <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Gender</label>
                    <select value={editGender} onChange={e => setEditGender(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }}>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                      Blood Group (Doctor Verified) 🩸
                    </label>
                    <select value={editBloodGroup} onChange={e => setEditBloodGroup(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem',
                fontWeight: 700
              }}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Village / Settlement</label>
                    <input type="text" value={editVillage} onChange={e => setEditVillage(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Mobile Phone</label>
                    <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Emergency Contact Phone</label>
                    <input type="text" value={editEmergency} onChange={e => setEditEmergency(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Guardian / Family Head</label>
                    <input type="text" value={editGuardian} onChange={e => setEditGuardian(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Vitals Baseline */}
              <div style={{
          marginBottom: '22px',
          padding: '16px',
          border: "1px solid #000"
        }}>
                <div style={{
            fontSize: '0.86rem',
            fontWeight: 800,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                  <Activity size={16} color="#0284c7" />
                  <span>2. Clinical Vitals Baseline (Doctor Examined)</span>
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.73rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>BP (mmHg)</label>
                    <input type="text" placeholder="120/80" value={editVitalsBp} onChange={e => setEditVitalsBp(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                border: "1.5px solid #000",
                fontSize: '0.86rem',
                fontWeight: 600
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.73rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>SpO2 (%)</label>
                    <input type="number" placeholder="98" value={editVitalsSpo2} onChange={e => setEditVitalsSpo2(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                border: "1.5px solid #000",
                fontSize: '0.86rem',
                fontWeight: 600
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.73rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Temp (°F)</label>
                    <input type="text" placeholder="98.4" value={editVitalsTemp} onChange={e => setEditVitalsTemp(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                border: "1.5px solid #000",
                fontSize: '0.86rem',
                fontWeight: 600
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.73rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Pulse (bpm)</label>
                    <input type="number" placeholder="72" value={editVitalsPulse} onChange={e => setEditVitalsPulse(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                border: "1.5px solid #000",
                fontSize: '0.86rem',
                fontWeight: 600
              }} />
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.73rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>Blood Sugar</label>
                    <input type="text" placeholder="Normal / 110 mg/dL" value={editVitalsSugar} onChange={e => setEditVitalsSugar(e.target.value)} style={{
                width: '100%',
                padding: '8px 10px',
                border: "1.5px solid #000",
                fontSize: '0.86rem',
                fontWeight: 600
              }} />
                  </div>
                </div>
              </div>

              {/* Section 3: Clinical Health Condition & Physician Advice */}
              <div style={{
          marginBottom: '22px'
        }}>
                <div style={{
            fontSize: '0.86rem',
            fontWeight: 800,
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
                  <Shield size={16} color="#7c3aed" />
                  <span>3. Clinical Status & Physician Advice</span>
                </div>
                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px'
          }}>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                      Current Clinical Condition
                    </label>
                    <select value={editHealthCondition} onChange={e => setEditHealthCondition(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem',
                fontWeight: 700
              }}>
                      <option value="Stable under Treatment">Stable under Treatment</option>
                      <option value="Chronic Care Management">Chronic Care Management</option>
                      <option value="High Risk / Clinical Observation">High Risk / Clinical Observation</option>
                      <option value="Critical Monitoring">Critical Monitoring</option>
                      <option value="Post-Op / Treatment Recovery">Post-Op / Treatment Recovery</option>
                      <option value="Recovered / Routine Care">Recovered / Routine Care</option>
                    </select>
                  </div>
                  <div>
                    <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                      Doctor Clinical Advice / Baseline Summary
                    </label>
                    <input type="text" placeholder="e.g. Regular BP monitoring, low salt diet, review in 2 weeks..." value={editDoctorRemarks} onChange={e => setEditDoctorRemarks(e.target.value)} style={{
                width: '100%',
                padding: '8px 12px',
                border: "1.5px solid #000",
                fontSize: '0.88rem'
              }} />
                  </div>
                </div>
              </div>

              {/* Section 4: Known Allergies Tags */}
              <div style={{
          marginBottom: '18px'
        }}>
                <label style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
                  ⚠️ Known Drug / Food Allergies (Doctor Verified)
                </label>
                <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '8px',
            minHeight: '30px'
          }}>
                  {allergiesList.length === 0 ? <span style={{
              fontSize: '0.78rem'
            }}>No allergies recorded yet.</span> : allergiesList.map((alg, i) => <span key={i} style={{
              border: "1px solid #000",
              padding: '4px 10px',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                      {alg}
                      <button type="button" onClick={() => setAllergiesList(allergiesList.filter((_, idx) => idx !== i))} style={{
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 900
              }}>×</button>
                    </span>)}
                </div>
                <div style={{
            display: 'flex',
            gap: '8px'
          }}>
                  <input type="text" placeholder="Add allergy (e.g. Penicillin, Sulfa, NSAIDs, Peanuts)..." value={newAllergyInput} onChange={e => setNewAllergyInput(e.target.value)} style={{
              flex: 1,
              padding: '7px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                  <button type="button" onClick={() => {
              if (newAllergyInput.trim()) {
                setAllergiesList([...allergiesList, newAllergyInput.trim()]);
                setNewAllergyInput('');
              }
            }} style={{
              padding: '7px 14px',
              border: "1px solid #000",
              fontWeight: 700,
              cursor: 'pointer'
            }}>
                    + Add Allergy
                  </button>
                </div>
              </div>

              {/* Section 5: Chronic Conditions Tags */}
              <div style={{
          marginBottom: '22px'
        }}>
                <label style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
                  🩺 Chronic Diagnosed Conditions (Doctor Verified)
                </label>
                <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '8px',
            minHeight: '30px'
          }}>
                  {chronicList.length === 0 ? <span style={{
              fontSize: '0.78rem'
            }}>No chronic conditions recorded yet.</span> : chronicList.map((chr, i) => <span key={i} style={{
              border: "1px solid #000",
              padding: '4px 10px',
              fontSize: '0.76rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                      {chr}
                      <button type="button" onClick={() => setChronicList(chronicList.filter((_, idx) => idx !== i))} style={{
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 900
              }}>×</button>
                    </span>)}
                </div>
                <div style={{
            display: 'flex',
            gap: '8px'
          }}>
                  <input type="text" placeholder="Add chronic condition (e.g. Hypertension, Type-2 Diabetes, Asthma, CAD)..." value={newChronicInput} onChange={e => setNewChronicInput(e.target.value)} style={{
              flex: 1,
              padding: '7px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                  <button type="button" onClick={() => {
              if (newChronicInput.trim()) {
                setChronicList([...chronicList, newChronicInput.trim()]);
                setNewChronicInput('');
              }
            }} style={{
              padding: '7px 14px',
              border: "1px solid #000",
              fontWeight: 700,
              cursor: 'pointer'
            }}>
                    + Add Condition
                  </button>
                </div>
              </div>

              {profileSuccessMsg && <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
                  <CheckCircle2 size={16} />
                  <span>{profileSuccessMsg}</span>
                </div>}

              <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
                <button type="submit" disabled={profileSaving} className="btn-primary" style={{
            padding: '12px 28px',
            fontSize: '0.92rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}>
                  <Save size={18} />
                  <span>{profileSaving ? 'Saving Profile to Database...' : 'Save Patient Profile & Clinical Baseline (Doctor Verified)'}</span>
                </button>

                <button type="button" onClick={() => setActiveInnerTab('history')} style={{
            padding: '12px 20px',
            border: "1.5px solid #000",
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
                  Cancel / Back to History
                </button>
              </div>
            </form>}

          {/* ══════ SUB-TAB 3: ADD NEW CLINICAL VISIT / DIAGNOSIS ENTRY ══════ */}
          {activeInnerTab === 'addVisit' && <form onSubmit={handleAddVisitRecord} style={{
        border: "1.5px solid #000",
        padding: '24px'
      }}>
              <h4 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          margin: '0 0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
                <Edit3 size={18} color="#059669" />
                <span>Add New Clinical Visit & Prescription Entry to Patient History</span>
              </h4>

              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Visit Type</label>
                  <select value={newVisitType} onChange={e => setNewVisitType(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1.5px solid #000",
              fontSize: '0.88rem'
            }}>
                    <option value="OPD Consultation">OPD Consultation</option>
                    <option value="Emergency Care">Emergency Care</option>
                    <option value="Follow-up Review">Follow-up Review</option>
                    <option value="Teleconsultation">Teleconsultation</option>
                  </select>
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Facility / Clinic Name</label>
                  <input type="text" value={newFacility} onChange={e => setNewFacility(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1.5px solid #000",
              fontSize: '0.88rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Clinical Diagnosis *</label>
                  <input type="text" required placeholder="e.g. Acute Gastroenteritis, Type 2 Diabetes..." value={newDiagnosis} onChange={e => setNewDiagnosis(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1.5px solid #000",
              fontSize: '0.88rem',
              fontWeight: 700
            }} />
                </div>
              </div>

              {/* Vitals Recorded during this visit */}
              <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          border: "1px solid #000"
        }}>
                <span style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            display: 'block',
            marginBottom: '8px'
          }}>
                  🩺 Record Vitals at this Consultation:
                </span>
                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '8px'
          }}>
                  <div>
                    <span style={{
                fontSize: '0.7rem'
              }}>BP (mmHg)</span>
                    <input type="text" value={newVitalsBp} onChange={e => setNewVitalsBp(e.target.value)} style={{
                width: '100%',
                padding: '6px',
                border: "1px solid #000",
                fontSize: '0.82rem'
              }} />
                  </div>
                  <div>
                    <span style={{
                fontSize: '0.7rem'
              }}>SpO2 (%)</span>
                    <input type="number" value={newVitalsSpo2} onChange={e => setNewVitalsSpo2(e.target.value)} style={{
                width: '100%',
                padding: '6px',
                border: "1px solid #000",
                fontSize: '0.82rem'
              }} />
                  </div>
                  <div>
                    <span style={{
                fontSize: '0.7rem'
              }}>Temp (°F)</span>
                    <input type="number" step="0.1" value={newVitalsTemp} onChange={e => setNewVitalsTemp(e.target.value)} style={{
                width: '100%',
                padding: '6px',
                border: "1px solid #000",
                fontSize: '0.82rem'
              }} />
                  </div>
                  <div>
                    <span style={{
                fontSize: '0.7rem'
              }}>Pulse (bpm)</span>
                    <input type="number" value={newVitalsPulse} onChange={e => setNewVitalsPulse(e.target.value)} style={{
                width: '100%',
                padding: '6px',
                border: "1px solid #000",
                fontSize: '0.82rem'
              }} />
                  </div>
                  <div>
                    <span style={{
                fontSize: '0.7rem'
              }}>Sugar (mg/dL)</span>
                    <input type="text" value={newVitalsSugar} onChange={e => setNewVitalsSugar(e.target.value)} style={{
                width: '100%',
                padding: '6px',
                border: "1px solid #000",
                fontSize: '0.82rem'
              }} />
                  </div>
                </div>
              </div>

              {/* Prescriptions rows */}
              <div style={{
          marginBottom: '16px'
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
                  <span style={{
              fontSize: '0.78rem',
              fontWeight: 800
            }}>💊 Prescribed Medications:</span>
                  <button type="button" onClick={() => setVisitRx([...visitRx, {
              medicine: '',
              dosage: '500mg',
              frequency: 'BD',
              duration: '5 days',
              instructions: 'After food'
            }])} style={{
              padding: '4px 10px',
              border: "1px solid #000",
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
                    + Add Medicine
                  </button>
                </div>

                {visitRx.map((rx, idx) => <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto',
            gap: '6px',
            marginBottom: '6px',
            alignItems: 'center'
          }}>
                    <input type="text" placeholder="Medicine Name..." value={rx.medicine} onChange={e => {
              const n = [...visitRx];
              n[idx].medicine = e.target.value;
              setVisitRx(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Dosage..." value={rx.dosage} onChange={e => {
              const n = [...visitRx];
              n[idx].dosage = e.target.value;
              setVisitRx(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Frequency..." value={rx.frequency} onChange={e => {
              const n = [...visitRx];
              n[idx].frequency = e.target.value;
              setVisitRx(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Duration..." value={rx.duration} onChange={e => {
              const n = [...visitRx];
              n[idx].duration = e.target.value;
              setVisitRx(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Instructions..." value={rx.instructions} onChange={e => {
              const n = [...visitRx];
              n[idx].instructions = e.target.value;
              setVisitRx(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <button type="button" onClick={() => setVisitRx(visitRx.filter((_, i) => i !== idx))} style={{
              border: 'none',
              padding: '6px 8px',
              cursor: 'pointer'
            }}>
                      <Trash2 size={13} />
                    </button>
                  </div>)}
              </div>

              {/* Test Reports rows */}
              <div style={{
          marginBottom: '16px'
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
                  <span style={{
              fontSize: '0.78rem',
              fontWeight: 800
            }}>🔬 Diagnostic Tests & Findings:</span>
                  <button type="button" onClick={() => setVisitTests([...visitTests, {
              testName: '',
              result: '',
              normalRange: 'Normal',
              status: 'Normal'
            }])} style={{
              padding: '4px 10px',
              border: "1px solid #000",
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
                    + Add Test Report
                  </button>
                </div>

                {visitTests.map((tst, idx) => <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1.5fr 1fr auto',
            gap: '6px',
            marginBottom: '6px',
            alignItems: 'center'
          }}>
                    <input type="text" placeholder="Test Name (e.g. CBC, HbA1c)..." value={tst.testName} onChange={e => {
              const n = [...visitTests];
              n[idx].testName = e.target.value;
              setVisitTests(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Test Result / Finding..." value={tst.result} onChange={e => {
              const n = [...visitTests];
              n[idx].result = e.target.value;
              setVisitTests(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <input type="text" placeholder="Ref Range..." value={tst.normalRange} onChange={e => {
              const n = [...visitTests];
              n[idx].normalRange = e.target.value;
              setVisitTests(n);
            }} style={{
              padding: '6px 8px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }} />
                    <select value={tst.status} onChange={e => {
              const n = [...visitTests];
              n[idx].status = e.target.value;
              setVisitTests(n);
            }} style={{
              padding: '6px',
              border: "1px solid #000",
              fontSize: '0.82rem'
            }}>
                      <option value="Normal">Normal</option>
                      <option value="Abnormal">Abnormal</option>
                      <option value="Critical">Critical</option>
                    </select>
                    <button type="button" onClick={() => setVisitTests(visitTests.filter((_, i) => i !== idx))} style={{
              border: 'none',
              padding: '6px 8px',
              cursor: 'pointer'
            }}>
                      <Trash2 size={13} />
                    </button>
                  </div>)}
              </div>

              {visitSuccessMsg && <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          fontWeight: 700,
          fontSize: '0.8rem'
        }}>
                  {visitSuccessMsg}
                </div>}

              <button type="submit" disabled={visitSaving} className="btn-primary" style={{
          padding: '10px 22px',
          fontSize: '0.9rem'
        }}>
                <Save size={16} />
                <span>{visitSaving ? 'Adding Visit Record...' : 'Save Consultation Record to History'}</span>
              </button>
            </form>}

          {/* ══════ SUB-TAB 4: SCHEDULE FOLLOW-UP REMINDER ══════ */}
          {activeInnerTab === 'reminder' && <div style={{
        border: "1.5px solid #000",
        padding: '24px'
      }}>
              <h4 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          margin: '0 0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
                <Bell size={18} color="#d97706" />
                <span>Doctor Follow-up Reminder ("Remainder for doctor that this patient has to check on the following day")</span>
              </h4>

              <div style={{
          border: "1px solid #000",
          padding: '12px 16px',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          marginBottom: '18px'
        }}>
                <strong>Following Day Checkup Alert —</strong> Set a high-priority alert for this patient. The reminder will appear prominently in your Doctor Reminders Queue when you check the panel tomorrow!
              </div>

              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                    Follow-Up Checkup Date *
                  </label>
                  <input type="date" value={reminderDueDate} onChange={e => setReminderDueDate(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.88rem'
            }} />
                  <div style={{
              fontSize: '0.7rem',
              marginTop: '3px'
            }}>
                    Tomorrow / Following Day: <strong>{getTomorrowDateStr()}</strong>
                  </div>
                </div>

                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                    Priority Level
                  </label>
                  <select value={reminderPriority} onChange={e => setReminderPriority(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.88rem'
            }}>
                    <option value="NORMAL">Normal Follow-up</option>
                    <option value="URGENT">Urgent Review</option>
                    <option value="CRITICAL">Critical Follow-up</option>
                  </select>
                </div>
              </div>

              <div style={{
          marginBottom: '18px'
        }}>
                <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
                  Specific Checkup Reason / Clinical Instructions *
                </label>
                <textarea rows={3} value={reminderReason} onChange={e => setReminderReason(e.target.value)} placeholder="e.g. Check temperature response to antibiotics, inspect wound healing, verify blood pressure..." style={{
            width: '100%',
            padding: '9px 12px',
            border: "1.5px solid #000",
            fontSize: '0.88rem',
            boxSizing: 'border-box'
          }} />
              </div>

              {reminderSuccessMsg && <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          fontWeight: 700,
          fontSize: '0.8rem'
        }}>
                  {reminderSuccessMsg}
                </div>}

              <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
                <button type="button" disabled={reminderSaving} onClick={() => handleCreateReminder(false)} style={{
            padding: '11px 22px',
            border: 'none',
            background: "#000000",
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px'
          }}>
                  <Bell size={16} />
                  <span>{reminderSaving ? 'Setting...' : 'Set Reminder for Selected Date'}</span>
                </button>

                <button type="button" disabled={reminderSaving} onClick={() => handleCreateReminder(true)} style={{
            padding: '11px 22px',
            border: "1.5px solid #000",
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px'
          }}>
                  <Clock size={16} color="#059669" />
                  <span>⚡ Quick 1-Click: Check on Tomorrow (Following Day)</span>
                </button>
              </div>

              {/* Real-time Follow-Ups List for this Patient */}
              {patientData.followUpReminders && patientData.followUpReminders.length > 0 && <div style={{
          marginTop: '24px',
          borderTop: "1.5px dashed #000",
          paddingTop: '18px'
        }}>
                  <div style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                    <Bell size={16} color="#d97706" />
                    <span>Scheduled Follow-ups for {patientData.name} ({patientData.followUpReminders.length})</span>
                  </div>
                  <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
                    {patientData.followUpReminders.map((rem, idx) => {
              const isDone = rem.status === 'COMPLETED';
              return <div key={idx} style={{
                border: `1.5px solid ${isDone ? '#86efac' : '#fde68a'}`,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                          <div>
                            <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                              <span style={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '2px 8px'
                    }}>
                                {isDone ? '✅ COMPLETED' : '⏳ PENDING'}
                              </span>
                              <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800
                    }}>
                                📅 {new Date(rem.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                              </span>
                              <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 6px'
                    }}>
                                {rem.priority}
                              </span>
                            </div>
                            <div style={{
                    fontSize: '0.82rem'
                  }}>
                              <strong>Reason:</strong> {rem.reason}
                            </div>
                            <div style={{
                    fontSize: '0.72rem',
                    marginTop: '2px'
                  }}>
                              Scheduled: {new Date(rem.createdAt || rem.dueDate).toLocaleDateString('en-IN')} by {rem.doctorName || 'Doctor'}
                            </div>
                          </div>
                        </div>;
            })}
                  </div>
                </div>}
            </div>}
        </>}

    </div>;
}