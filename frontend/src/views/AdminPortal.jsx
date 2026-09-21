import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Pill, AlertTriangle, Users, Plus, Trash2, CheckCircle2, Edit2, RefreshCw, Sparkles, Bed, Stethoscope, Activity, X, Save, Check, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
export default function AdminPortal({
  currentUser,
  onLogout
}) {
  const [subTab, setSubTab] = useState('facilities');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Data states
  const [facilities, setFacilities] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [users, setUsers] = useState([]);

  // Analytics & Audit state
  const [stockAnalytics, setStockAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  // Forms / Modals
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showAddOutbreak, setShowAddOutbreak] = useState(false);

  // Edit Facility State
  const [editingFacility, setEditingFacility] = useState(null);

  // New Facility Form
  const [facName, setFacName] = useState('');
  const [facType, setFacType] = useState('PHC');
  const [facVillage, setFacVillage] = useState('');
  const [facBeds, setFacBeds] = useState(12);
  const [facOxygen, setFacOxygen] = useState(6);
  const [facDistance, setFacDistance] = useState(4.5);
  const [facDoctorName, setFacDoctorName] = useState('Dr. Rajesh Verma');
  const [facDoctorSpec, setFacDoctorSpec] = useState('General Physician (MBBS)');
  const [facEmergency, setFacEmergency] = useState(false);

  // New Medicine Form
  const [medName, setMedName] = useState('');
  const [medCategory, setMedCategory] = useState('Antibiotic');
  const [medFacility, setMedFacility] = useState('');
  const [medQty, setMedQty] = useState(150);
  const [medThreshold, setMedThreshold] = useState(50);
  const [medUnit, setMedUnit] = useState('Strips');

  // New Outbreak Form
  const [obDisease, setObDisease] = useState('');
  const [obVillage, setObVillage] = useState('');
  const [obCases, setObCases] = useState(14);
  const [obAction, setObAction] = useState('Larvicide spraying & rapid testing survey initiated.');
  useEffect(() => {
    // Auto-detect real live location on load for admin forms
    (async () => {
      try {
        const coords = await getLivePosition();
        const geo = await reverseGeocode(coords.lat, coords.lng);
        if (geo.village) {
          setFacVillage(geo.village);
          setObVillage(geo.village);
        }
      } catch (e) {}
    })();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [facRes, medRes, obRes, userRes] = await Promise.all([api.getFacilities(), api.getInventory(), api.getOutbreaks(), api.getUsers()]);
      if (facRes && facRes.success) setFacilities(facRes.data || []);
      if (medRes && medRes.success) setMedicines(medRes.data || []);
      if (obRes && obRes.success) setOutbreaks(obRes.data || []);
      if (userRes && userRes.success) setUsers(userRes.users || []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);
  const showNotification = msg => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  // 1. Facility CRUD Handlers
  const handleCreateFacility = async e => {
    e.preventDefault();
    if (!facName) return;
    try {
      const res = await api.createFacility({
        name: facName,
        type: facType,
        village: facVillage,
        distanceKm: Number(facDistance) || 5,
        beds: {
          total: Number(facBeds) || 10,
          occupied: 1,
          available: Math.max(0, (Number(facBeds) || 10) - 1)
        },
        oxygenCylinders: Number(facOxygen) || 0,
        emergencyCapable: facEmergency,
        doctors: [{
          name: facDoctorName || 'Dr. Medical Officer',
          specialty: facDoctorSpec,
          available: true,
          onDutyHours: '08:00 - 17:00'
        }],
        diagnosticsAvailable: ['Blood Glucose', 'Rapid Malaria Test', 'Hemoglobin (Hb)', 'Basic ECG']
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`✅ Facility "${facName}" added to live MongoDB Atlas database!`);
        setShowAddFacility(false);
        setFacName('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
      showNotification('❌ Failed to add facility');
    }
  };
  const handleUpdateFacility = async e => {
    e.preventDefault();
    if (!editingFacility) return;
    try {
      const targetId = editingFacility.id || editingFacility._id;
      const res = await api.updateFacility(targetId, {
        name: editingFacility.name,
        type: editingFacility.type,
        village: editingFacility.village,
        beds: editingFacility.beds,
        oxygenCylinders: Number(editingFacility.oxygenCylinders) || 0,
        currentWaitTimeMins: Number(editingFacility.currentWaitTimeMins) || 15,
        emergencyCapable: editingFacility.emergencyCapable
      });
      if (res.success) {
        showNotification(`✅ Facility "${editingFacility.name}" updated successfully!`);
        setEditingFacility(null);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteFacility = async fac => {
    const id = fac.id || fac._id;
    if (!window.confirm(`Are you sure you want to delete "${fac.name}" from database?`)) return;
    try {
      const res = await api.deleteFacility(id);
      if (res.success) {
        showNotification(`🗑️ Facility deleted from database.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Medicine CRUD Handlers
  const handleCreateMedicine = async e => {
    e.preventDefault();
    if (!medName) return;
    try {
      const res = await api.createMedicine({
        name: medName,
        category: medCategory,
        facilityName: medFacility,
        stockQty: Number(medQty) || 100,
        minThreshold: Number(medThreshold) || 40,
        unit: medUnit
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`✅ Medicine "${medName}" registered in supply database!`);
        setShowAddMedicine(false);
        setMedName('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleRestockMedicine = async (med, addAmount) => {
    const id = med.id || med._id;
    try {
      const res = await api.updateMedicineStock(id, {
        addQty: addAmount
      });
      if (res.success) {
        showNotification(`📦 Restocked +${addAmount} ${med.unit} for ${med.name}!`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteMedicine = async med => {
    const id = med.id || med._id;
    if (!window.confirm(`Delete "${med.name}" from inventory?`)) return;
    try {
      const res = await api.deleteMedicine(id);
      if (res.success) {
        showNotification(`🗑️ Medicine item deleted.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Outbreak CRUD Handlers
  const handleCreateOutbreak = async e => {
    e.preventDefault();
    if (!obDisease) return;
    try {
      const res = await api.createOutbreak({
        disease: obDisease,
        village: obVillage,
        casesThisWeek: Number(obCases) || 1,
        trend: '+25% this week',
        status: 'ACTIVE_WATCH',
        recommendedAction: obAction
      });
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60
        });
        showNotification(`🚨 Disease surveillance cluster broadcasted to field ASHAs!`);
        setShowAddOutbreak(false);
        setObDisease('');
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteOutbreak = async ob => {
    const id = ob._id || ob.id;
    try {
      const res = await api.deleteOutbreak(id);
      if (res.success) {
        showNotification(`✅ Outbreak cluster marked resolved.`);
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };
  return <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      {/* Page Title */}
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
            <span className="badge badge-green">Super Administrator Command</span>
            <span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
              Live MongoDB Atlas Database Master Control
            </span>
          </div>
          <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          marginTop: '4px'
        }}>
            National Health Administration Master Portal
          </h1>
          <p style={{
          fontSize: '0.88rem'
        }}>
            Complete CRUD management over Public Healthcare Facilities, Medicine Warehouses, and Epidemic Alerts.
          </p>
        </div>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <button onClick={onLogout} className="np-btn" style={{
          padding: '8px 14px',
          fontSize: '0.82rem',
          backgroundColor: '#000',
          color: '#fff',
          border: '1px solid #000'
        }}>
            <span>Logout Admin</span>
          </button>
          <button onClick={fetchAll} className="btn-secondary" style={{
          padding: '8px 14px',
          fontSize: '0.82rem'
        }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Database</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notice && <div style={{
      marginBottom: '18px',
      padding: '12px 18px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 700,
      fontSize: '0.88rem'
    }}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>}

      {/* Sub-Navigation Tabs */}
      <div style={{
      display: 'flex',
      gap: '8px',
      borderBottom: "2px solid #000",
      paddingBottom: '12px',
      marginBottom: '22px',
      overflowX: 'auto'
    }}>
        <button onClick={() => {
        setSubTab('facilities');
        setEditingFacility(null);
      }} style={{
        padding: '9px 16px',
        border: 'none',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <Building2 size={16} />
          <span>Healthcare Facilities ({facilities.length})</span>
        </button>

        <button onClick={() => {
        setSubTab('medicines');
        setEditingFacility(null);
      }} style={{
        padding: '9px 16px',
        border: 'none',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <Pill size={16} />
          <span>Medicine & Supply Warehouse ({medicines.length})</span>
        </button>

        <button onClick={() => {
        setSubTab('outbreaks');
        setEditingFacility(null);
      }} style={{
        padding: '9px 16px',
        border: 'none',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <AlertTriangle size={16} />
          <span>Epidemic Outbreaks ({outbreaks.length})</span>
        </button>

        <button onClick={() => {
        setSubTab('users');
        setEditingFacility(null);
      }} style={{
        padding: '9px 16px',
        border: 'none',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
          <Users size={16} />
          <span>Registered Health Staff ({users.length})</span>
        </button>

        <button
          onClick={() => {
            setSubTab('analytics');
            setEditingFacility(null);
            if (!stockAnalytics) {
              setAnalyticsLoading(true);
              Promise.all([
                api.getDistrictStockAnalytics(),
                api.getAuditLogs({ limit: 100 })
              ]).then(([analyticsRes, auditRes]) => {
                if (analyticsRes.success) setStockAnalytics(analyticsRes.analytics);
                if (auditRes.success) setAuditLogs(auditRes.data || []);
              }).catch(console.error)
                .finally(() => setAnalyticsLoading(false));
            }
          }}
          style={{
            padding: '9px 16px',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'analytics' ? '#7c3aed' : '#f3f4f6',
            color: subTab === 'analytics' ? '#ffffff' : '#374151',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <BarChart3 size={16} />
          <span>Stock Analytics & Audit</span>
        </button>
      </div>

      {/* 1. FACILITIES MASTER VIEW */}
      {subTab === 'facilities' && <div>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
            <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 800
        }}>
              Public Health Facility Infrastructure ({facilities.length} Active in Database)
            </h3>
            <button onClick={() => {
          setShowAddFacility(!showAddFacility);
          setEditingFacility(null);
        }} className="btn-primary" style={{
          padding: '8px 16px',
          fontSize: '0.85rem'
        }}>
              <Plus size={16} />
              <span>{showAddFacility ? 'Close Form' : 'Add New Facility'}</span>
            </button>
          </div>

          {/* Add Facility Form */}
          {showAddFacility && <form onSubmit={handleCreateFacility} className="glass-panel" style={{
        padding: '22px',
        marginBottom: '22px',
        border: "2px solid #000"
      }}>
              <h4 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          marginBottom: '14px'
        }}>
                Add New Healthcare Facility to MongoDB Atlas Database
              </h4>
              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Facility Name *</label>
                  <input type="text" required placeholder="Enter healthcare facility name..." value={facName} onChange={e => setFacName(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Tier / Type *</label>
                  <select value={facType} onChange={e => setFacType(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }}>
                    <option value="Sub-Centre">Sub-Centre (Level 0)</option>
                    <option value="PHC">Primary Health Centre (PHC - Level 1)</option>
                    <option value="CHC">Community Health Centre (CHC - Level 2)</option>
                    <option value="District Hospital">District Civil Hospital (Level 3)</option>
                  </select>
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Village / Location *</label>
                  <input type="text" required value={facVillage} onChange={e => setFacVillage(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Total Inpatient Beds *</label>
                  <input type="number" required value={facBeds} onChange={e => setFacBeds(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Oxygen Cylinders</label>
                  <input type="number" value={facOxygen} onChange={e => setFacOxygen(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Duty Doctor Name</label>
                  <input type="text" placeholder="Enter doctor / in-charge name..." value={facDoctorName} onChange={e => setFacDoctorName(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
              </div>
              <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
                <button type="button" onClick={() => setShowAddFacility(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save to MongoDB Atlas</button>
              </div>
            </form>}

          {/* Edit Facility Modal / Inline Form */}
          {editingFacility && <form onSubmit={handleUpdateFacility} className="glass-panel" style={{
        padding: '22px',
        marginBottom: '22px',
        border: "2px solid #000"
      }}>
              <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
                <h4 style={{
            fontSize: '1.05rem',
            fontWeight: 800
          }}>
                  Edit Facility: {editingFacility.name}
                </h4>
                <button type="button" onClick={() => setEditingFacility(null)} style={{
            border: 'none',
            cursor: 'pointer'
          }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Facility Name</label>
                  <input type="text" value={editingFacility.name} onChange={e => setEditingFacility({
              ...editingFacility,
              name: e.target.value
            })} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Available Beds</label>
                  <input type="number" value={editingFacility.beds?.available || 0} onChange={e => setEditingFacility({
              ...editingFacility,
              beds: {
                ...editingFacility.beds,
                available: Number(e.target.value)
              }
            })} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Oxygen Cylinders</label>
                  <input type="number" value={editingFacility.oxygenCylinders || 0} onChange={e => setEditingFacility({
              ...editingFacility,
              oxygenCylinders: Number(e.target.value)
            })} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Wait Time (Mins)</label>
                  <input type="number" value={editingFacility.currentWaitTimeMins || 15} onChange={e => setEditingFacility({
              ...editingFacility,
              currentWaitTimeMins: Number(e.target.value)
            })} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
              </div>

              <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
                <button type="button" onClick={() => setEditingFacility(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{}}>
                  <Save size={15} />
                  <span>Update Facility in Database</span>
                </button>
              </div>
            </form>}

          {/* Facility Cards Grid */}
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '16px'
      }}>
            {facilities.map(fac => <div key={fac.id || fac._id} className="glass-card" style={{
          padding: '20px'
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px'
          }}>
                  <div>
                    <span className="badge badge-green" style={{
                fontSize: '0.68rem'
              }}>{fac.type} • Level {fac.level}</span>
                    <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                marginTop: '2px'
              }}>{fac.name}</h4>
                    <div style={{
                fontSize: '0.78rem'
              }}>📍 {fac.village}, {fac.district} • <strong>{fac.distanceKm} km</strong></div>
                  </div>

                  <div style={{
              display: 'flex',
              gap: '6px'
            }}>
                    <button onClick={() => setEditingFacility(fac)} style={{
                border: "1px solid #000",
                padding: '6px',
                cursor: 'pointer'
              }} title="Edit Facility">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteFacility(fac)} style={{
                border: "1px solid #000",
                padding: '6px',
                cursor: 'pointer'
              }} title="Delete Facility">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            margin: '12px 0',
            textAlign: 'center',
            fontSize: '0.8rem'
          }}>
                  <div style={{
              padding: '6px'
            }}>
                    <div style={{
                fontSize: '0.68rem',
                fontWeight: 700
              }}>FREE BEDS</div>
                    <div style={{
                fontWeight: 800
              }}>{fac.beds?.available || 0} / {fac.beds?.total || 0}</div>
                  </div>
                  <div style={{
              padding: '6px'
            }}>
                    <div style={{
                fontSize: '0.68rem',
                fontWeight: 700
              }}>OXYGEN</div>
                    <div style={{
                fontWeight: 800
              }}>{fac.oxygenCylinders} Cylinders</div>
                  </div>
                  <div style={{
              padding: '6px'
            }}>
                    <div style={{
                fontSize: '0.68rem',
                fontWeight: 700
              }}>DOCTORS</div>
                    <div style={{
                fontWeight: 800
              }}>{(fac.doctors || []).length} Available</div>
                  </div>
                </div>

                <div style={{
            fontSize: '0.75rem'
          }}>
                  <strong>Diagnostics:</strong> {(fac.diagnosticsAvailable || []).join(', ') || 'Basic OPD'}
                </div>
              </div>)}
          </div>
        </div>}

      {/* 2. MEDICINE INVENTORY MASTER VIEW */}
      {subTab === 'medicines' && <div>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
            <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 800
        }}>
              Medicine & Medical Supplies Inventory ({medicines.length} Items)
            </h3>
            <button onClick={() => setShowAddMedicine(!showAddMedicine)} className="btn-primary" style={{
          padding: '8px 16px',
          fontSize: '0.85rem'
        }}>
              <Plus size={16} />
              <span>{showAddMedicine ? 'Close Form' : 'Register New Medicine'}</span>
            </button>
          </div>

          {/* Add Medicine Form */}
          {showAddMedicine && <form onSubmit={handleCreateMedicine} className="glass-panel" style={{
        padding: '22px',
        marginBottom: '22px',
        border: "2px solid #000"
      }}>
              <h4 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          marginBottom: '14px'
        }}>
                Register New Medicine / Vaccine in Database
              </h4>
              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Medicine Name *</label>
                  <input type="text" required placeholder="Enter medicine / vaccine name..." value={medName} onChange={e => setMedName(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Category *</label>
                  <select value={medCategory} onChange={e => setMedCategory(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }}>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                    <option value="Emergency Antidote">Emergency Antidote (Snake Venom)</option>
                    <option value="Maternal Health">Maternal Health (IFA / Oxytocin)</option>
                    <option value="Cardiovascular">Cardiovascular / Emergency</option>
                    <option value="Vaccine">Vaccine</option>
                  </select>
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Allocated Facility</label>
                  <input type="text" value={medFacility} onChange={e => setMedFacility(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Initial Stock Qty</label>
                  <input type="number" value={medQty} onChange={e => setMedQty(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Min Threshold Alert</label>
                  <input type="number" value={medThreshold} onChange={e => setMedThreshold(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
              </div>
              <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
                <button type="button" onClick={() => setShowAddMedicine(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save to Medicine DB</button>
              </div>
            </form>}

          {/* Medicine Table */}
          <div className="glass-panel" style={{
        padding: '16px',
        overflowX: 'auto'
      }}>
            <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem'
        }}>
              <thead>
                <tr style={{
              textAlign: 'left',
              borderBottom: "2px solid #000"
            }}>
                  <th style={{
                padding: '10px 12px'
              }}>MEDICINE NAME</th>
                  <th style={{
                padding: '10px 12px'
              }}>CATEGORY</th>
                  <th style={{
                padding: '10px 12px'
              }}>FACILITY</th>
                  <th style={{
                padding: '10px 12px'
              }}>STOCK QUANTITY</th>
                  <th style={{
                padding: '10px 12px'
              }}>STATUS</th>
                  <th style={{
                padding: '10px 12px'
              }}>QUICK RESTOCK</th>
                  <th style={{
                padding: '10px 12px'
              }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(med => {
              const isCrit = med.status === 'Critical Low' || med.status === 'Out of Stock';
              return <tr key={med.id || med._id} style={{
                borderBottom: "1px solid #000"
              }}>
                      <td style={{
                  padding: '10px 12px',
                  fontWeight: 700
                }}>{med.name}</td>
                      <td style={{
                  padding: '10px 12px'
                }}>{med.category}</td>
                      <td style={{
                  padding: '10px 12px'
                }}>{med.facilityName}</td>
                      <td style={{
                  padding: '10px 12px',
                  fontWeight: 800
                }}>
                        {med.stockQty} {med.unit}
                      </td>
                      <td style={{
                  padding: '10px 12px'
                }}>
                        <span className={`badge ${isCrit ? 'badge-yellow' : 'badge-green'}`} style={{
                    fontSize: '0.65rem'
                  }}>
                          {med.status}
                        </span>
                      </td>
                      <td style={{
                  padding: '10px 12px'
                }}>
                        <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                          <button type="button" onClick={() => handleRestockMedicine(med, 50)} className="btn-secondary" style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem'
                    }}>
                            +50
                          </button>
                          <button type="button" onClick={() => handleRestockMedicine(med, 200)} className="btn-secondary" style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem'
                    }}>
                            +200
                          </button>
                        </div>
                      </td>
                      <td style={{
                  padding: '10px 12px'
                }}>
                        <button type="button" onClick={() => handleDeleteMedicine(med)} style={{
                    border: 'none',
                    padding: '5px 8px',
                    cursor: 'pointer'
                  }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>
        </div>}

      {/* 3. OUTBREAKS VIEW */}
      {subTab === 'outbreaks' && <div>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
            <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 800
        }}>
              Active Disease Outbreak Surveillance Radar ({outbreaks.length} Active)
            </h3>
            <button onClick={() => setShowAddOutbreak(!showAddOutbreak)} className="btn-primary" style={{
          padding: '8px 16px',
          fontSize: '0.85rem'
        }}>
              <Plus size={16} />
              <span>{showAddOutbreak ? 'Close Form' : 'Broadcast Outbreak Alert'}</span>
            </button>
          </div>

          {showAddOutbreak && <form onSubmit={handleCreateOutbreak} className="glass-panel" style={{
        padding: '22px',
        marginBottom: '22px',
        border: "2px solid #000"
      }}>
              <h4 style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          marginBottom: '14px'
        }}>
                Broadcast Epidemiological Outbreak Alert to Field ASHAs
              </h4>
              <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '14px'
        }}>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Disease Syndrome *</label>
                  <input type="text" required placeholder="Enter disease syndrome / condition..." value={obDisease} onChange={e => setObDisease(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Village Cluster *</label>
                  <input type="text" required value={obVillage} onChange={e => setObVillage(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Reported Cases This Week</label>
                  <input type="number" value={obCases} onChange={e => setObCases(e.target.value)} style={{
              width: '100%',
              padding: '8px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
                <div>
                  <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '4px'
            }}>Medical Protocol Action</label>
                  <input type="text" value={obAction} onChange={e => setObAction(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: "1px solid #000",
              fontSize: '0.85rem'
            }} />
                </div>
              </div>
              <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
                <button type="button" onClick={() => setShowAddOutbreak(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-emergency" style={{
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}>Broadcast Alert to District</button>
              </div>
            </form>}

          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '16px'
      }}>
            {outbreaks.map(ob => <div key={ob._id || ob.id} className="glass-card" style={{
          padding: '18px',
          borderLeft: "4px solid #000"
        }}>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
                  <div>
                    <h4 style={{
                fontSize: '1.05rem',
                fontWeight: 800
              }}>{ob.disease}</h4>
                    <div style={{
                fontSize: '0.78rem'
              }}>📍 {ob.village} ({ob.block})</div>
                  </div>
                  <span className="badge badge-red" style={{
              fontSize: '0.65rem'
            }}>{ob.casesThisWeek} Cases</span>
                </div>
                <div style={{
            padding: '10px',
            margin: '10px 0',
            fontSize: '0.78rem',
            border: "1px solid #000"
          }}>
                  🛡️ <strong>Protocol:</strong> {ob.recommendedAction}
                </div>
                <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem'
          }}>
                  <span style={{
              fontWeight: 600
            }}>Status: {ob.status}</span>
                  <button onClick={() => handleDeleteOutbreak(ob)} style={{
              border: "1px solid #000",
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: 700
            }}>
                    ✓ Mark Resolved
                  </button>
                </div>
              </div>)}
          </div>
        </div>}

      {/* 4. REGISTERED STAFF DIRECTORY */}
      {subTab === 'users' && <div className="glass-panel" style={{
      padding: '20px'
    }}>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
            <h3 style={{
          fontSize: '1.15rem',
          fontWeight: 800
        }}>
              Registered Public Health Staff & Administrators ({users.length})
            </h3>
          </div>

          <div style={{
        overflowX: 'auto'
      }}>
            <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem'
        }}>
              <thead>
                <tr style={{
              textAlign: 'left',
              borderBottom: "2px solid #000"
            }}>
                  <th style={{
                padding: '10px 12px'
              }}>NAME</th>
                  <th style={{
                padding: '10px 12px'
              }}>USERNAME / ID</th>
                  <th style={{
                padding: '10px 12px'
              }}>ROLE</th>
                  <th style={{
                padding: '10px 12px'
              }}>VILLAGE / STATION</th>
                  <th style={{
                padding: '10px 12px'
              }}>DESIGNATION</th>
                  <th style={{
                padding: '10px 12px'
              }}>CONTACT</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => <tr key={u._id || u.username} style={{
              borderBottom: "1px solid #000"
            }}>
                    <td style={{
                padding: '10px 12px',
                fontWeight: 700
              }}>{u.name}</td>
                    <td style={{
                padding: '10px 12px',
                fontWeight: 600
              }}>{u.username}</td>
                    <td style={{
                padding: '10px 12px'
              }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'doctor' ? 'badge-green' : 'badge-yellow'}`} style={{
                  fontSize: '0.65rem'
                }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{
                padding: '10px 12px'
              }}>{u.village || 'N/A'}</td>
                    <td style={{
                padding: '10px 12px'
              }}>{u.designation}</td>
                    <td style={{
                padding: '10px 12px'
              }}>{u.phone || 'N/A'}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}
    </div>;
}
