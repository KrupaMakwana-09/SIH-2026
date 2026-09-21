import React, { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, CheckCircle2, AlertTriangle, FileText, Send, Coffee, Shield, Save, RefreshCw, Award, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../utils/api';
export default function DoctorLeaveScheduleView({
  currentUser
}) {
  const [loading, setLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [leavesList, setLeavesList] = useState([]);
  const [activeLeave, setActiveLeave] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // ─── Leave Form State ───────────────────────────────────────────────────
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [leaveStart, setLeaveStart] = useState(getTodayStr());
  const [leaveEnd, setLeaveEnd] = useState(getTodayStr());
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');
  const [substituteDoc, setSubstituteDoc] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState('');

  // ─── Schedule Form State ────────────────────────────────────────────────
  const [opdDays, setOpdDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [roomNumber, setRoomNumber] = useState('Room 104, OPD Block');
  const [maxPatients, setMaxPatients] = useState(40);
  const [dutyStatus, setDutyStatus] = useState('AVAILABLE');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load current schedule & leaves from DB
  const loadScheduleAndLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorScheduleAndLeaves();
      if (res.success) {
        if (res.schedule) {
          setScheduleData(res.schedule);
          if (res.schedule.opdDays) setOpdDays(res.schedule.opdDays);
          if (res.schedule.startTime) setStartTime(res.schedule.startTime);
          if (res.schedule.endTime) setEndTime(res.schedule.endTime);
          if (res.schedule.roomNumber) setRoomNumber(res.schedule.roomNumber);
          if (res.schedule.maxPatientsPerDay) setMaxPatients(res.schedule.maxPatientsPerDay);
          if (res.schedule.dutyStatus) setDutyStatus(res.schedule.dutyStatus);
        }
        setLeavesList(res.leaves || []);
        setActiveLeave(res.activeLeave || null);
      }
    } catch {
      setStatusMsg('Could not load doctor schedule. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadScheduleAndLeaves();
  }, []);

  // Submit Leave Application
  const handleSubmitLeave = async e => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      setLeaveMsg('Please provide a reason for the leave application.');
      return;
    }
    setSubmittingLeave(true);
    setLeaveMsg('');
    try {
      const res = await api.submitDoctorLeave({
        startDate: leaveStart,
        endDate: leaveEnd,
        leaveType,
        reason: leaveReason,
        substituteDoctor: substituteDoc,
        emergencyContact: emergencyPhone
      });
      if (res.success) {
        setLeaveMsg(res.message);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setLeaveReason('');
        loadScheduleAndLeaves();
      } else {
        setLeaveMsg(res.message || 'Failed to submit leave application.');
      }
    } catch {
      setLeaveMsg('Network error submitting leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Update OPD Schedule
  const handleSaveSchedule = async e => {
    e.preventDefault();
    setSavingSchedule(true);
    setScheduleMsg('');
    try {
      const res = await api.updateDoctorSchedule({
        opdDays,
        startTime,
        endTime,
        roomNumber,
        maxPatientsPerDay: Number(maxPatients),
        dutyStatus
      });
      if (res.success) {
        setScheduleMsg('OPD schedule and duty availability updated successfully!');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            y: 0.6
          }
        });
        setScheduleData(res.schedule);
      } else {
        setScheduleMsg(res.message || 'Failed to update schedule.');
      }
    } catch {
      setScheduleMsg('Network error updating schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };
  const toggleDay = day => {
    if (opdDays.includes(day)) {
      setOpdDays(opdDays.filter(d => d !== day));
    } else {
      setOpdDays([...opdDays, day]);
    }
  };
  const getStatusBadge = status => {
    switch (status) {
      case 'ON_LEAVE':
        return {
          label: 'ON LEAVE (OFF DUTY)',
          bg: '#fef2f2',
          color: '#b91c1c',
          border: '#fca5a5'
        };
      case 'EMERGENCY_DUTY':
        return {
          label: 'ON EMERGENCY CALL',
          bg: '#fff7ed',
          color: '#c2410c',
          border: '#fdba74'
        };
      case 'IN_SURGERY':
        return {
          label: 'IN OPERATION THEATER',
          bg: '#faf5ff',
          color: '#7e22ce',
          border: '#d8b4fe'
        };
      case 'AVAILABLE':
      default:
        return {
          label: 'AVAILABLE ON OPD DUTY',
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0'
        };
    }
  };
  const badge = getStatusBadge(dutyStatus);
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '22px'
  }}>

      {/* ══════ HEADER BANNER & CURRENT DUTY STATUS ══════ */}
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
            <Coffee size={26} color="#6ee7b7" />
          </div>
          <div>
            <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
              Doctor Leave Management & OPD Duty Schedule
            </h2>
            <p style={{
            fontSize: '0.82rem',
            margin: '4px 0 0'
          }}>
              Submit Official Leaves • Schedule Work Days • Set Emergency Substitutes • Live Duty Status
            </p>
          </div>
        </div>

        {/* Live Duty Badge */}
        <div style={{
        border: `1.5px solid ${badge.border}`,
        padding: '10px 18px',
        textAlign: 'right'
      }}>
          <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
            Current System Availability
          </div>
          <div style={{
          fontSize: '0.95rem',
          fontWeight: 900,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'flex-end'
        }}>
            <span style={{
            width: '9px',
            height: '9px'
          }} />
            <span>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* Active Leave Notice if doctor is currently on leave */}
      {activeLeave && <div style={{
      border: "1.5px solid #000",
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
          <AlertTriangle size={24} color="#dc2626" style={{
        flexShrink: 0
      }} />
          <div style={{
        flex: 1
      }}>
            <div style={{
          fontSize: '0.9rem',
          fontWeight: 800
        }}>
              Active Leave Period in Progress
            </div>
            <div style={{
          fontSize: '0.8rem',
          marginTop: '2px'
        }}>
              You are currently on <strong>{activeLeave.leaveType} LEAVE</strong> from{' '}
              {new Date(activeLeave.startDate).toLocaleDateString('en-IN')} to{' '}
              {new Date(activeLeave.endDate).toLocaleDateString('en-IN')} (Reason: {activeLeave.reason}).
              {activeLeave.substituteDoctor && ` On-call substitute: ${activeLeave.substituteDoctor}.`}
            </div>
          </div>
        </div>}

      {/* ══════ TWO-COLUMN GRID: LEAVE FORM (LEFT) + OPD SCHEDULE (RIGHT) ══════ */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '20px'
    }}>

        {/* ─── COLUMN 1: DOCTOR LEAVE APPLICATION FORM ─── */}
        <form onSubmit={handleSubmitLeave} style={{
        border: "1.5px solid #000",
        padding: '24px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: "1.5px solid #000",
          paddingBottom: '12px'
        }}>
            <Calendar size={20} color="#ea580c" />
            <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            margin: 0
          }}>
              Doctor Leave Application Form
            </h3>
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '14px'
        }}>
            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                Leave Start Date *
              </label>
              <input type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>

            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                Leave End Date *
              </label>
              <input type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>
          </div>

          <div style={{
          marginBottom: '14px'
        }}>
            <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
              Type of Leave
            </label>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={{
            width: '100%',
            padding: '9px 12px',
            border: "1.5px solid #000",
            fontSize: '0.86rem'
          }}>
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="MEDICAL">Medical / Sick Leave</option>
              <option value="CONFERENCE">CME / Medical Conference</option>
              <option value="DUTY_OFF">Official Duty Off</option>
              <option value="EMERGENCY">Emergency Family Leave</option>
            </select>
          </div>

          <div style={{
          marginBottom: '14px'
        }}>
            <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '4px'
          }}>
              Reason for Leave *
            </label>
            <textarea rows={3} required placeholder="Detailed clinical or personal reason for absence..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} style={{
            width: '100%',
            padding: '9px 12px',
            border: "1.5px solid #000",
            fontSize: '0.86rem',
            boxSizing: 'border-box'
          }} />
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px'
        }}>
            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                Substitute / On-Call Doctor
              </label>
              <input type="text" placeholder="e.g. Dr. R. K. Patel" value={substituteDoc} onChange={e => setSubstituteDoc(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>

            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                Emergency Contact Phone
              </label>
              <input type="text" placeholder="+91-98765-00000" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>
          </div>

          {leaveMsg && <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
              {leaveMsg}
            </div>}

          <button type="submit" disabled={submittingLeave} style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          background: "#000000",
          fontWeight: 800,
          fontSize: '0.92rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
            <Send size={16} />
            <span>{submittingLeave ? 'Submitting Application...' : 'Apply for Leave & Update Schedule'}</span>
          </button>
        </form>

        {/* ─── COLUMN 2: OPD SCHEDULE & DUTY AVAILABILITY ─── */}
        <form onSubmit={handleSaveSchedule} style={{
        border: "1.5px solid #000",
        padding: '24px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: "1.5px solid #000",
          paddingBottom: '12px'
        }}>
            <Clock size={20} color="#059669" />
            <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            margin: 0
          }}>
              OPD Consultation Schedule & Availability
            </h3>
          </div>

          {/* Duty Status Selector */}
          <div style={{
          marginBottom: '16px'
        }}>
            <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
              Live Duty Status (Manual Override)
            </label>
            <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}>
              {[{
              val: 'AVAILABLE',
              label: '🟢 Available on Duty',
              color: '#059669'
            }, {
              val: 'ON_LEAVE',
              label: '🔴 On Leave (Off Duty)',
              color: '#dc2626'
            }, {
              val: 'EMERGENCY_DUTY',
              label: '🟠 Emergency Call',
              color: '#ea580c'
            }, {
              val: 'IN_SURGERY',
              label: '🟣 In OT / Surgery',
              color: '#9333ea'
            }].map(st => <button key={st.val} type="button" onClick={() => setDutyStatus(st.val)} style={{
              padding: '9px 10px',
              border: `2px solid ${dutyStatus === st.val ? st.color : '#e5e7eb'}`,
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'left'
            }}>
                  {st.label}
                </button>)}
            </div>
          </div>

          {/* Working Days of Week Toggle */}
          <div style={{
          marginBottom: '16px'
        }}>
            <label style={{
            display: 'block',
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '6px'
          }}>
              OPD Consultation Days
            </label>
            <div style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap'
          }}>
              {daysOfWeek.map(day => {
              const isSelected = opdDays.includes(day);
              return <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                padding: '6px 12px',
                border: `1.5px solid ${isSelected ? '#059669' : '#e5e7eb'}`,
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                    {day.slice(0, 3)}
                  </button>;
            })}
            </div>
          </div>

          {/* Consultation Timings */}
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '14px'
        }}>
            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                OPD Start Time
              </label>
              <input type="text" placeholder="09:00 AM" value={startTime} onChange={e => setStartTime(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>

            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                OPD End Time
              </label>
              <input type="text" placeholder="05:00 PM" value={endTime} onChange={e => setEndTime(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>
          </div>

          {/* Room Number & Daily Quota */}
          <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '12px',
          marginBottom: '18px'
        }}>
            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                OPD Room / Chamber
              </label>
              <input type="text" placeholder="Room 104, OPD Block" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>

            <div>
              <label style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                Max Patients/Day
              </label>
              <input type="number" min="1" max="100" value={maxPatients} onChange={e => setMaxPatients(e.target.value)} style={{
              width: '100%',
              padding: '9px 12px',
              border: "1.5px solid #000",
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }} />
            </div>
          </div>

          {scheduleMsg && <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
              {scheduleMsg}
            </div>}

          <button type="submit" disabled={savingSchedule} className="btn-primary" style={{
          width: '100%',
          padding: '12px',
          fontSize: '0.92rem',
          justifyContent: 'center'
        }}>
            <Save size={16} />
            <span>{savingSchedule ? 'Updating Schedule...' : 'Save OPD Schedule Settings'}</span>
          </button>
        </form>
      </div>

      {/* ══════ PREVIOUS LEAVE RECORDS TABLE ══════ */}
      <div style={{
      border: "1.5px solid #000",
      padding: '22px 26px'
    }}>
        <h4 style={{
        fontSize: '1rem',
        fontWeight: 800,
        margin: '0 0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <FileText size={18} color="#6b7280" />
          <span>Doctor Leave History & Record Book ({leavesList.length})</span>
        </h4>

        {leavesList.length === 0 ? <div style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
            No leave records found.
          </div> : <div style={{
        overflowX: 'auto'
      }}>
            <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem'
        }}>
              <thead>
                <tr style={{
              textAlign: 'left'
            }}>
                  <th style={{
                padding: '10px 12px'
              }}>Leave Period</th>
                  <th style={{
                padding: '10px 12px'
              }}>Leave Type</th>
                  <th style={{
                padding: '10px 12px'
              }}>Reason</th>
                  <th style={{
                padding: '10px 12px'
              }}>Substitute Doctor</th>
                  <th style={{
                padding: '10px 12px'
              }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leavesList.map((l, i) => <tr key={l._id || i} style={{
              borderBottom: "1px solid #000"
            }}>
                    <td style={{
                padding: '10px 12px',
                fontWeight: 700
              }}>
                      {new Date(l.startDate).toLocaleDateString('en-IN')} → {new Date(l.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{
                padding: '10px 12px'
              }}>{l.leaveType}</td>
                    <td style={{
                padding: '10px 12px'
              }}>{l.reason}</td>
                    <td style={{
                padding: '10px 12px'
              }}>{l.substituteDoctor || '—'}</td>
                    <td style={{
                padding: '10px 12px'
              }}>
                      <span style={{
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>

    </div>;
}