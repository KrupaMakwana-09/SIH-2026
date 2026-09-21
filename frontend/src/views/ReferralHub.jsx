import React, { useState, useEffect } from 'react';
import { Share2, QrCode, Search, CheckCircle2, Clock, MapPin, Stethoscope, Activity, FileText, UserCheck, Phone, Printer, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
export default function ReferralHub({
  onOpenQRModal
}) {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [activeReferral, setActiveReferral] = useState(null);

  // Receiving Doctor handoff state
  const [handoffNotes, setHandoffNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.getReferrals();
      if (res.success) {
        setReferrals(res.data);
        if (!activeReferral && res.data.length > 0) {
          setActiveReferral(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReferrals();
  }, []);
  const handleSearch = async e => {
    e.preventDefault();
    if (!searchCode) return;
    try {
      const res = await api.getReferralByCode(searchCode);
      if (res.success) {
        setActiveReferral(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleStatusUpdate = async newStatus => {
    if (!activeReferral) return;
    setUpdatingStatus(true);
    try {
      const res = await api.updateReferralStatus(activeReferral.referralCode, {
        status: newStatus,
        doctorNotes: handoffNotes,
        stageName: `Referral status updated to ${newStatus}`,
        staffName: 'Dr. Priya Saxena (Receiving Specialist)'
      });
      if (res.success) {
        setActiveReferral(res.data);
        fetchReferrals();
        setHandoffNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };
  return <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      {/* Header */}
      <div style={{
      marginBottom: '22px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
        <div>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <span className="badge badge-green">Care Continuity Engine</span>
            <span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
              Zero Data Loss Referral Architecture
            </span>
          </div>
          <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          marginTop: '4px'
        }}>
            Digital Referral & Patient Continuity Hub
          </h1>
          <p style={{
          fontSize: '0.88rem'
        }}>
            Seamless electronic transfer from Village ASHA to Primary Health Centre (PHC) to District Civil Hospital.
          </p>
        </div>

        {/* Quick Search by QR Code / Referral ID */}
        <form onSubmit={handleSearch} style={{
        display: 'flex',
        gap: '8px'
      }}>
          <input type="text" placeholder="Search referral code or patient ID..." value={searchCode} onChange={e => setSearchCode(e.target.value)} style={{
          padding: '9px 14px',
          border: "1px solid #000",
          fontSize: '0.85rem',
          width: '280px',
          outline: 'none'
        }} />
          <button type="submit" className="btn-primary" style={{
          padding: '8px 16px',
          fontSize: '0.85rem'
        }}>
            <Search size={15} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Main 2-Column Split: Referral Pipeline Left, Active Referral Slip & Handoff Right */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
      gap: '24px'
    }}>
        
        {/* Left Column: Active Referrals List */}
        <div className="glass-panel" style={{
        padding: '20px',
        height: 'fit-content'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
            <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800
          }}>
              Active Referral Queue ({referrals.length})
            </h3>
            <span className="badge badge-green" style={{
            fontSize: '0.68rem'
          }}>Live Stream</span>
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '680px',
          overflowY: 'auto'
        }}>
            {referrals.map(ref => {
            const isSelected = activeReferral?.id === ref.id || activeReferral?.referralCode === ref.referralCode;
            return <div key={ref.id} onClick={() => setActiveReferral(ref)} className="glass-card" style={{
              padding: '14px',
              cursor: 'pointer',
              border: isSelected ? '2px solid #059669' : '1px solid rgba(16, 185, 129, 0.15)'
            }}>
                  <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                    <strong style={{
                  fontSize: '0.92rem'
                }}>{ref.patientName}</strong>
                    <span className={`badge ${ref.priority === 'EMERGENCY_RED' ? 'badge-red' : 'badge-yellow'}`} style={{
                  fontSize: '0.62rem'
                }}>
                      {ref.referralCode}
                    </span>
                  </div>

                  <div style={{
                fontSize: '0.78rem',
                marginBottom: '6px'
              }}>
                    {ref.referringUnit} ➔ <strong>{ref.referredToFacilityName.split(' ')[0]}</strong>
                  </div>

                  <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.72rem'
              }}>
                    <span style={{
                  fontWeight: 700
                }}>
                      Status: {ref.status}
                    </span>
                    <span style={{}}>
                      {ref.village}
                    </span>
                  </div>
                </div>;
          })}
          </div>
        </div>

        {/* Right Column: Detailed Continuity Slip & Doctor Evaluation Workspace */}
        {activeReferral ? <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
            
            {/* Top Slip Overview Card */}
            <div className="glass-panel" style={{
          padding: '24px'
        }}>
              <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px'
          }}>
                <div>
                  <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                    <span className="badge badge-green">Referral Slip Verified</span>
                    <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>#{activeReferral.referralCode}</span>
                  </div>
                  <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                marginTop: '4px'
              }}>
                    {activeReferral.patientName}
                  </h2>
                  <div style={{
                fontSize: '0.82rem'
              }}>
                    Age: {activeReferral.age} Yrs • Gender: {activeReferral.gender || 'Female'} • Village: {activeReferral.village}
                  </div>
                </div>

                <div style={{
              display: 'flex',
              gap: '10px'
            }}>
                  <button onClick={() => onOpenQRModal(activeReferral)} className="btn-primary" style={{
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}>
                    <QrCode size={16} />
                    <span>View QR Slip & Print</span>
                  </button>
                </div>
              </div>

              {/* Pathway Diagram */}
              <div style={{
            padding: '16px',
            border: "1px solid #000",
            marginBottom: '18px'
          }}>
                <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
                  Handoff Trajectory (Village ➔ Facility)
                </div>
                <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '12px'
            }}>
                  <div style={{
                padding: '12px',
                border: "1px solid #000"
              }}>
                    <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>ORIGIN POINT</div>
                    <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}>{activeReferral.referringUnit}</div>
                    <div style={{
                  fontSize: '0.75rem'
                }}>Staff: {activeReferral.referringStaff}</div>
                  </div>

                  <div style={{
                textAlign: 'center',
                fontWeight: 900,
                fontSize: '1.4rem'
              }}>
                    ➔
                  </div>

                  <div style={{
                padding: '12px',
                border: "1px solid #000"
              }}>
                    <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>RECEIVING DESTINATION</div>
                    <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 800
                }}>{activeReferral.referredToFacilityName}</div>
                    <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>Priority: {activeReferral.priority}</div>
                  </div>
                </div>
              </div>

              {/* Clinical Justification & Vitals */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '18px'
          }}>
                <div style={{
              padding: '14px',
              border: "1px solid #000"
            }}>
                  <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                    Clinical Referral Justification
                  </div>
                  <div style={{
                fontSize: '0.88rem',
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                    {activeReferral.referralReason}
                  </div>
                  <div style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                marginTop: '8px'
              }}>
                    Provisional Diagnosis: {activeReferral.provisionalDiagnosis}
                  </div>
                </div>

                <div style={{
              padding: '14px',
              border: "1px solid #000"
            }}>
                  <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                    Baseline Vitals Captured at Origin
                  </div>
                  <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '6px',
                fontSize: '0.85rem'
              }}>
                    <div><strong>BP:</strong> {activeReferral.vitalsSnapshot?.bp || '120/80'}</div>
                    <div><strong>SpO2:</strong> {activeReferral.vitalsSnapshot?.spo2 || '98'}%</div>
                    <div><strong>Temp:</strong> {activeReferral.vitalsSnapshot?.temp || '98.4'}°F</div>
                    <div><strong>Pulse:</strong> {activeReferral.vitalsSnapshot?.pulse || '76'} bpm</div>
                  </div>
                  <div style={{
                fontSize: '0.75rem',
                marginTop: '8px'
              }}>
                    Transport: <strong>{activeReferral.transportArranged}</strong>
                  </div>
                </div>
              </div>

              {/* Continuity Audit Log Timeline */}
              {activeReferral.timeline && <div style={{
            padding: '14px',
            border: "1px solid #000"
          }}>
                  <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
                    Care Continuity Handover Trail
                  </div>
                  <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
                    {activeReferral.timeline.map((item, idx) => <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.82rem'
              }}>
                        <span style={{
                  fontWeight: 700,
                  minWidth: '70px'
                }}>{item.time}</span>
                        <CheckCircle2 size={15} color="#059669" />
                        <span style={{
                  fontWeight: 600
                }}>{item.stage}</span>
                        <span style={{}}>({item.by})</span>
                      </div>)}
                  </div>
                </div>}
            </div>

            {/* Receiving Doctor Desk: Status Actions & Handoff Notes */}
            <div className="glass-panel" style={{
          padding: '22px',
          border: "1px solid #000"
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
                <Stethoscope size={20} color="#059669" />
                <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800
            }}>
                  Receiving Doctor / Specialist Handoff Desk
                </h3>
              </div>

              <p style={{
            fontSize: '0.82rem',
            marginBottom: '14px'
          }}>
                When patient arrives at the receiving facility, the duty doctor scans the referral QR code, updates the status, and enters physician evaluation notes.
              </p>

              {/* Status Action Buttons */}
              <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
                <button type="button" onClick={() => handleStatusUpdate('Received')} disabled={updatingStatus} className="btn-secondary" style={{}}>
                  Mark as 'Patient Arrived / Received'
                </button>
                <button type="button" onClick={() => handleStatusUpdate('Doctor_Attended')} disabled={updatingStatus} className="btn-secondary" style={{}}>
                  Doctor Consultation Commenced
                </button>
                <button type="button" onClick={() => handleStatusUpdate('Admitted')} disabled={updatingStatus} className="btn-secondary" style={{}}>
                  Admit into Inpatient Ward
                </button>
                <button type="button" onClick={() => handleStatusUpdate('Discharged')} disabled={updatingStatus} className="btn-secondary" style={{}}>
                  Completed & Discharged
                </button>
              </div>

              {/* Add Clinical Notes */}
              <div>
                <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>
                  Physician Handoff & Treatment Notes:
                </label>
                <textarea rows={3} placeholder="Enter clinical examination findings, administered treatment, and disposition notes..." value={handoffNotes} onChange={e => setHandoffNotes(e.target.value)} style={{
              width: '100%',
              padding: '10px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              marginBottom: '10px'
            }} />
                <button onClick={() => handleStatusUpdate(activeReferral.status)} disabled={updatingStatus || !handoffNotes} className="btn-primary" style={{
              padding: '7px 16px',
              fontSize: '0.82rem'
            }}>
                  Save Physician Notes
                </button>
              </div>
            </div>
          </div> : <div className="glass-panel" style={{
        padding: '40px',
        textAlign: 'center'
      }}>
            <FileText size={40} color="#059669" style={{
          margin: '0 auto 10px auto'
        }} />
            <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 700
        }}>Select a Referral Record</h3>
            <p style={{
          fontSize: '0.85rem'
        }}>
              Click any active referral from the left queue to view referral details and history.
            </p>
          </div>}
      </div>
    </div>;
}