import React, { useState, useEffect } from 'react';
import { Bell, User, CheckCircle2, FileText, RefreshCw, KeyRound, Shield, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../utils/api';
export default function DoctorRemindersView({
  onSelectPatientForHistory,
  onWriteRx
}) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');

  // OTP Modal State
  const [otpModal, setOtpModal] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState('');
  const loadReminders = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorReminders();
      if (res.success && res.reminders) setReminders(res.reminders);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadReminders();
    const interval = setInterval(() => {
      api.getDoctorReminders().then(res => {
        if (res.success && res.reminders) {
          setReminders(res.reminders);
        }
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  const openMarkDoneModal = rem => {
    setOtpModal(rem);
    setMaskedEmail('');
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('Sending OTP to patient\'s registered email...');
  };
  const closeOtpModal = () => {
    setOtpModal(null);
    setMaskedEmail('');
    setOtpCode('');
    setOtpSent(false);
    setOtpMsg('');
  };

  // Auto-send OTP as soon as the modal opens
  useEffect(() => {
    if (!otpModal) return;
    const send = async () => {
      setOtpLoading(true);
      setOtpMsg('');
      try {
        const res = await api.sendFollowUpOtp({
          reminderId: otpModal._id,
          patientId: otpModal.patientId,
          patientName: otpModal.patientName
        });
        if (res.success) {
          setOtpSent(true);
          setMaskedEmail(res.maskedEmail || '');
          setOtpMsg('OTP sent! Ask the patient to share the OTP code with you.');
        } else {
          setOtpMsg(res.message || 'Failed to send OTP. Ensure patient has a registered email.');
        }
      } catch {
        setOtpMsg('Network error sending OTP. Please try again.');
      } finally {
        setOtpLoading(false);
      }
    };
    send();
  }, [otpModal]);
  const handleResendOtp = async () => {
    if (!otpModal || otpLoading) return;
    setOtpLoading(true);
    setOtpMsg('');
    setOtpCode('');
    try {
      const res = await api.sendFollowUpOtp({
        reminderId: otpModal._id,
        patientId: otpModal.patientId,
        patientName: otpModal.patientName
      });
      if (res.success) {
        setMaskedEmail(res.maskedEmail || '');
        setOtpMsg('New OTP sent! Ask the patient to share the new code.');
      } else {
        setOtpMsg(res.message || 'Failed to resend OTP.');
      }
    } catch {
      setOtpMsg('Network error. Please check connection.');
    } finally {
      setOtpLoading(false);
    }
  };
  const handleVerifyAndComplete = async e => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpMsg('Please enter the 6-digit OTP from the patient.');
      return;
    }
    setOtpLoading(true);
    setOtpMsg('');
    try {
      const res = await api.verifyFollowUpOtp({
        reminderId: otpModal._id,
        otp: otpCode.trim()
      });
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setReminders(prev => prev.map(r => r._id === otpModal._id ? {
          ...r,
          status: 'COMPLETED'
        } : r));
        setOtpMsg('Follow-up verified and marked as COMPLETED!');
        setTimeout(() => closeOtpModal(), 1800);
      } else {
        setOtpMsg(res.message || 'OTP verification failed.');
      }
    } catch {
      setOtpMsg('Verification failed. Check connection.');
    } finally {
      setOtpLoading(false);
    }
  };
  const today = new Date().toDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toDateString();
  const isToday = d => new Date(d).toDateString() === today;
  const isTomorrow = d => new Date(d).toDateString() === tomorrow;
  const filteredReminders = reminders.filter(r => {
    if (filter === 'TODAY') return isToday(r.dueDate) && r.status === 'PENDING';
    if (filter === 'TOMORROW') return isTomorrow(r.dueDate) && r.status === 'PENDING';
    if (filter === 'URGENT') return (r.priority === 'URGENT' || r.priority === 'CRITICAL') && r.status === 'PENDING';
    return true;
  });
  const todayCount = reminders.filter(r => isToday(r.dueDate) && r.status === 'PENDING').length;
  const tomorrowCount = reminders.filter(r => isTomorrow(r.dueDate) && r.status === 'PENDING').length;
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>

      {/* Banner */}
      <div style={{
      background: "#000000",
      padding: '22px 26px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
          <div style={{
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: "1px solid #000"
        }}>
            <Bell size={26} color="#fef08a" />
          </div>
          <div>
            <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            margin: 0
          }}>Doctor Follow-Up Reminders Queue</h2>
            <p style={{
            fontSize: '0.82rem',
            margin: '4px 0 0'
          }}>
              Scheduled Following Day Checkups • Clinical Surveillance • Post-Treatment Reviews
            </p>
          </div>
        </div>
        <button type="button" onClick={loadReminders} style={{
        border: "1px solid #000",
        padding: '8px 14px',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <RefreshCw size={14} /> <span>Refresh</span>
        </button>
      </div>

      {/* Filter pills */}
      <div style={{
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
        {[{
        id: 'ALL',
        label: `All (${reminders.length})`
      }, {
        id: 'TOMORROW',
        label: `⚡ Tomorrow (${tomorrowCount})`
      }, {
        id: 'TODAY',
        label: `🚨 Due Today (${todayCount})`
      }, {
        id: 'URGENT',
        label: '🔥 Urgent Only'
      }].map(flt => <button key={flt.id} type="button" onClick={() => setFilter(flt.id)} style={{
        padding: '8px 16px',
        border: `1.5px solid ${filter === flt.id ? '#d97706' : '#e5e7eb'}`,
        fontSize: '0.82rem',
        fontWeight: filter === flt.id ? 800 : 600,
        cursor: 'pointer'
      }}>
            {flt.label}
          </button>)}
      </div>

      {/* Cards */}
      {filteredReminders.length === 0 ? <div style={{
      border: "1.5px solid #000",
      padding: '40px 20px',
      textAlign: 'center'
    }}>
          <CheckCircle2 size={42} color="#10b981" style={{
        margin: '0 auto 10px'
      }} />
          <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 800,
        margin: 0
      }}>No Pending Reminders</h3>
          <p style={{
        fontSize: '0.82rem',
        marginTop: '4px'
      }}>Open patient history and click "Remind for Following Day Checkup" to add reminders.</p>
        </div> : <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: '16px'
    }}>
          {filteredReminders.map(rem => {
        const dueDayLabel = isTomorrow(rem.dueDate) ? '⚡ TOMORROW' : isToday(rem.dueDate) ? '🚨 DUE TODAY' : new Date(rem.dueDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const isCompleted = rem.status === 'COMPLETED';
        return <div key={rem._id} style={{
          border: `1.5px solid ${isTomorrow(rem.dueDate) ? '#fde68a' : isToday(rem.dueDate) ? '#fecaca' : '#e5e7eb'}`,
          padding: '18px 20px',
          opacity: isCompleted ? 0.7 : 1
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
                  <span style={{
              border: `1px solid ${isTomorrow(rem.dueDate) ? '#fde68a' : '#e5e7eb'}`,
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>{dueDayLabel}</span>
                  <span style={{
              padding: '2px 7px',
              fontSize: '0.68rem',
              fontWeight: 800
            }}>{rem.priority}</span>
                </div>
                <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            marginBottom: '4px'
          }}>{rem.patientName}</div>
                <div style={{
            fontSize: '0.76rem',
            marginBottom: '8px'
          }}>
                  ID: <strong style={{}}>{rem.patientId}</strong>
                  {rem.patientPhone && ` • 📞 ${rem.patientPhone}`}
                </div>
                <div style={{
            padding: '9px 12px',
            fontSize: '0.8rem',
            marginBottom: '14px',
            border: "1px solid #000",
            lineHeight: 1.4
          }}>
                  <strong>Checkup:</strong> {rem.reason}
                </div>
                <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
                  <button type="button" onClick={() => onSelectPatientForHistory && onSelectPatientForHistory(rem.patientId)} style={{
              padding: '6px 12px',
              border: "1px solid #000",
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                    <User size={13} /> Open History
                  </button>
                  <button type="button" onClick={() => onWriteRx && onWriteRx({
              id: rem.patientId,
              name: rem.patientName,
              phone: rem.patientPhone,
              chiefComplaint: rem.reason
            })} style={{
              padding: '6px 12px',
              border: "1px solid #000",
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                    <FileText size={13} /> Write Rx
                  </button>
                  {!isCompleted ? <button type="button" onClick={() => openMarkDoneModal(rem)} style={{
              padding: '6px 14px',
              border: 'none',
              background: "#000000",
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginLeft: 'auto'
            }}>
                      <Shield size={13} /> Mark Done (OTP)
                    </button> : <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                      <CheckCircle2 size={14} /> Verified & Done
                    </span>}
                </div>
              </div>;
      })}
        </div>}

      {/* OTP Verification Modal */}
      {otpModal && <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
          <div style={{
        padding: '32px',
        width: '100%',
        maxWidth: '460px',
        position: 'relative'
      }}>
            <button onClick={closeOtpModal} style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          border: 'none',
          cursor: 'pointer'
        }}><X size={20} /></button>

            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '18px'
        }}>
              <div style={{
            width: '50px',
            height: '50px',
            background: "#000000",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
                <Shield size={24} color="#fff" />
              </div>
              <div>
                <h3 style={{
              fontSize: '1.05rem',
              fontWeight: 900,
              margin: 0
            }}>Follow-Up OTP Verification</h3>
                <p style={{
              fontSize: '0.77rem',
              margin: '3px 0 0'
            }}>Patient: <strong style={{}}>{otpModal.patientName}</strong></p>
              </div>
            </div>

            {otpLoading && !otpSent ? <div style={{
          textAlign: 'center',
          padding: '28px 0',
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
                <div style={{
            width: '36px',
            height: '36px',
            border: "3px solid #000",
            borderTop: "3px solid #000",
            margin: '0 auto 14px'
          }} />
                Sending OTP to patient's registered email...
              </div> : <form onSubmit={handleVerifyAndComplete}>
                {otpSent && maskedEmail && <div style={{
            border: "1px solid #000",
            padding: '11px 14px',
            marginBottom: '18px',
            fontSize: '0.82rem',
            lineHeight: 1.5
          }}>
                    ✅ OTP sent to patient's registered email: <strong>{maskedEmail}</strong><br />
                    <span style={{
              fontSize: '0.77rem'
            }}>Ask the patient to check their email and share the 6-digit code with you.</span>
                  </div>}
                <label style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>Enter OTP shared by Patient *</label>
                <div style={{
            position: 'relative',
            marginBottom: '14px'
          }}>
                  <KeyRound size={16} color="#9ca3af" style={{
              position: 'absolute',
              left: '12px',
              top: '13px'
            }} />
                  <input type="text" maxLength={6} required placeholder="• • • • • •" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} style={{
              width: '100%',
              padding: '12px 14px 12px 36px',
              border: "1.5px solid #000",
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '8px',
              outline: 'none',
              boxSizing: 'border-box',
              textAlign: 'center'
            }} />
                </div>
                {otpMsg && <div style={{
            fontSize: '0.79rem',
            marginBottom: '10px',
            fontWeight: 600
          }}>{otpMsg}</div>}
                <div style={{
            display: 'flex',
            gap: '10px'
          }}>
                  <button type="button" onClick={handleResendOtp} disabled={otpLoading} style={{
              flex: 1,
              padding: '11px',
              border: "1.5px solid #000",
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: otpLoading ? 'not-allowed' : 'pointer',
              opacity: otpLoading ? 0.6 : 1
            }}>↺ Resend</button>
                  <button type="submit" disabled={otpLoading || otpCode.length < 4} style={{
              flex: 2,
              padding: '11px',
              border: 'none',
              background: "#000000",
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: otpLoading || otpCode.length < 4 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: otpLoading || otpCode.length < 4 ? 0.6 : 1
            }}>
                    <CheckCircle2 size={15} /> {otpLoading ? 'Verifying...' : 'Verify & Mark Done'}
                  </button>
                </div>
              </form>}
          </div>
        </div>}
    </div>;
}