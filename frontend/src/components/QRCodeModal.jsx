import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShieldCheck, CheckCircle2, Clock, MapPin, UserCheck, Phone, FileText } from 'lucide-react';
export default function QRCodeModal({
  isOpen,
  onClose,
  referral
}) {
  const printRef = useRef(null);
  if (!isOpen || !referral) return null;
  const handlePrint = () => {
    window.print();
  };
  const qrDataString = JSON.stringify({
    refCode: referral.referralCode,
    patient: referral.patientName,
    age: referral.age,
    from: referral.referringUnit,
    to: referral.referredToFacilityName,
    priority: referral.priority,
    vitals: referral.vitalsSnapshot,
    verified: 'GRAMIN_AROGYA_NATIONAL_HEALTH'
  });
  return (
    <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <div className="glass-panel" style={{
      width: '100%',
      maxWidth: '680px',
      maxHeight: '92vh',
      overflowY: 'auto',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Header Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        borderBottom: "1px solid #000",
        paddingBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            padding: '6px'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 800
            }}>
              Digital Health Referral Slip
            </h3>
            <div style={{
              fontSize: '0.75rem'
            }}>
              Standard National Rural Health Continuity Format
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button onClick={handlePrint} className="btn-secondary" style={{
            padding: '6px 12px',
            fontSize: '0.8rem'
          }}>
            <Printer size={15} />
            <span>Print Slip</span>
          </button>
          <button onClick={onClose} style={{
            border: 'none',
            padding: '6px',
            cursor: 'pointer'
          }}>
            <X size={18} color="#4b5563" />
          </button>
        </div>
      </div>

      {/* Printable Slip Container */}
        <div ref={printRef} id="printable-referral-slip" style={{
          border: '2px dashed #059669',
          borderRadius: '16px',
          padding: '20px',
          background: '#fcfdfd'
        }}>
      {/* Slip Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Government of India • Ministry of Health & Family Welfare
          </div>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            marginTop: '2px'
          }}>
            {referral.patientName} ({referral.age} Y / {referral.gender || 'F'})
          </div>
          <div style={{
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '4px'
          }}>
            <MapPin size={14} color="#059669" />
            <span>Village: <strong>{referral.village}</strong> | Ref Code: <strong style={{}}>{referral.referralCode}</strong></span>
          </div>
        </div>

        {/* QR Code Container */}
        <div style={{
          padding: '10px',
          border: "1px solid #000",
          textAlign: 'center'
        }}>
          <QRCodeSVG value={qrDataString} size={110} level="M" fgColor="#064e3b" bgColor="#ffffff" />
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            marginTop: '4px'
          }}>
            SCAN FOR VITALS
          </div>
        </div>
      </div>

      {/* Referral Pathway */}
      <div style={{
        padding: '14px',
        border: "1px solid #000",
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}>
          Referral Routing Pathway
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            padding: '10px',
            border: "1px solid #000"
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600
            }}>REFERRED BY (ORIGIN)</div>
            <div style={{
              fontSize: '0.88rem',
              fontWeight: 700
            }}>{referral.referringUnit}</div>
            <div style={{
              fontSize: '0.75rem'
            }}>Staff: {referral.referringStaff}</div>
          </div>

          <div style={{
            fontWeight: 800,
            fontSize: '1.2rem'
          }}>➔</div>

          <div style={{
            padding: '10px',
            border: "1px solid #000"
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 600
            }}>REFERRED TO (DESTINATION)</div>
            <div style={{
              fontSize: '0.88rem',
              fontWeight: 800
            }}>{referral.referredToFacilityName}</div>
            <div style={{
              fontSize: '0.75rem'
            }}>Priority: {referral.priority}</div>
          </div>
        </div>
      </div>

      {/* Clinical Reason & Vitals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '12px',
          border: "1px solid #000"
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            Clinical Referral Justification
          </div>
          <div style={{
            fontSize: '0.85rem',
            marginTop: '4px',
            fontWeight: 500
          }}>
            {referral.referralReason}
          </div>
          <div style={{
            fontSize: '0.75rem',
            marginTop: '6px',
            fontWeight: 600
          }}>
            Provisional: {referral.provisionalDiagnosis}
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
            Initial Vitals Snapshot at Origin
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginTop: '6px',
            fontSize: '0.82rem'
          }}>
            <div><strong>BP:</strong> {referral.vitalsSnapshot?.bp || '120/80'}</div>
            <div><strong>SpO2:</strong> {referral.vitalsSnapshot?.spo2 || '98'}%</div>
            <div><strong>Temp:</strong> {referral.vitalsSnapshot?.temp || '98.4'}°F</div>
            <div><strong>Pulse:</strong> {referral.vitalsSnapshot?.pulse || '76'} bpm</div>
          </div>
          <div style={{
            fontSize: '0.72rem',
            marginTop: '6px'
          }}>
            Transport: <strong>{referral.transportArranged}</strong>
          </div>
        </div>
      </div>

      {/* Transfer Timeline & Continuity Log */}
      {referral.timeline && referral.timeline.length > 0 && <div style={{
        padding: '12px',
        border: "1px solid #000"
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: '8px'
        }}>
          Care Continuity Audit Trail
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {referral.timeline.map((st, i) => <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem'
          }}>
            <span style={{
              fontWeight: 700,
              minWidth: '65px'
            }}>{st.time}</span>
            <CheckCircle2 size={13} color="#059669" />
            <span style={{
              fontWeight: 600
            }}>{st.stage}</span>
            <span style={{}}>({st.by})</span>
          </div>)}
        </div>
      </div>}

      {/* Doctor Handoff Notes */}
      {referral.doctorHandoffNotes && <div style={{
        marginTop: '12px',
        padding: '10px',
        border: "1px solid #000",
        fontSize: '0.8rem'
      }}>
        <strong>Receiving Doctor Notes:</strong> {referral.doctorHandoffNotes}
      </div>}
    </div>

        {/* Print Styles for Referral Slip */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-referral-slip, #printable-referral-slip * {
              visibility: visible;
            }
            #printable-referral-slip {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              border: 2px solid #059669 !important;
              border-radius: 12px !important;
              background: #ffffff !important;
              box-shadow: none !important;
            }
            button {
              display: none !important;
            }
          }
        `}</style>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 20px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}