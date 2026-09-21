import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Pill, Building2, Users, ShieldAlert, Activity, MapPin, RefreshCw, Bed, CheckCircle2, Download, Flame } from 'lucide-react';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode } from '../utils/geolocation';
export default function GovDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveDistrict, setLiveDistrict] = useState('');
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAnalytics();
    getLivePosition().then(async coords => {
      const geo = await reverseGeocode(coords.lat, coords.lng);
      if (geo.district || geo.state) {
        setLiveDistrict(`${geo.district || 'District Health Portal'} • ${geo.state || 'State Health Mission'}`);
      }
    });
  }, []);
  if (loading || !data) {
    return <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
        <div style={{
        fontSize: '1.1rem',
        fontWeight: 700
      }}>
          Loading District Public Health Intelligence Stream...
        </div>
      </div>;
  }
  const {
    summary,
    facilitiesCapacity,
    diseaseOutbreaks,
    inventoryAlerts,
    villageReferrals,
    referralStatusBreakdown
  } = data;
  return <div style={{
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 20px'
  }}>
      {/* Title */}
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
            <span className="badge badge-green">CMO & Health Administration</span>
            <span style={{
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
              {liveDistrict ? `📍 ${liveDistrict}` : 'District Public Health Mission'}
            </span>
          </div>
          <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          marginTop: '4px'
        }}>
            District Public Health Intelligence & Resource Command Center
          </h1>
          <p style={{
          fontSize: '0.88rem'
        }}>
            Real-time disease surveillance radar, supply chain stockout alerts, and facility referral load analytics.
          </p>
        </div>

        <div style={{
        display: 'flex',
        gap: '10px'
      }}>
          <button onClick={fetchAnalytics} className="btn-secondary" style={{
          padding: '8px 14px',
          fontSize: '0.82rem'
        }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
        
        <div className="glass-card" style={{
        padding: '18px',
        borderLeft: "4px solid #000"
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div>
              <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
                District Bed Occupancy
              </div>
              <div style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              marginTop: '2px'
            }}>
                {summary.occupiedBeds} / {summary.totalBeds} ({summary.bedOccupancyRate}%)
              </div>
            </div>
            <div style={{
            padding: '10px'
          }}>
              <Bed size={22} />
            </div>
          </div>
          <div style={{
          fontSize: '0.75rem',
          marginTop: '6px',
          fontWeight: 600
        }}>
            {summary.availableBeds} Available across PHCs/CHCs
          </div>
        </div>

        <div className="glass-card" style={{
        padding: '18px',
        borderLeft: "4px solid #000"
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div>
              <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
                Active Disease Outbreaks
              </div>
              <div style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              marginTop: '2px'
            }}>
                {diseaseOutbreaks.length} Clusters
              </div>
            </div>
            <div style={{
            padding: '10px'
          }}>
              <Flame size={22} />
            </div>
          </div>
          <div style={{
          fontSize: '0.75rem',
          marginTop: '6px',
          fontWeight: 600
        }}>
            Dengue & Waterborne clusters identified
          </div>
        </div>

        <div className="glass-card" style={{
        padding: '18px',
        borderLeft: "4px solid #000"
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div>
              <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
                Medicine Stockout Risk
              </div>
              <div style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              marginTop: '2px'
            }}>
                {summary.criticalStockoutsCount} Critical
              </div>
            </div>
            <div style={{
            padding: '10px'
          }}>
              <Pill size={22} />
            </div>
          </div>
          <div style={{
          fontSize: '0.75rem',
          marginTop: '6px',
          fontWeight: 600
        }}>
            ASV vials & Amoxicillin replenishment required
          </div>
        </div>

        <div className="glass-card" style={{
        padding: '18px',
        borderLeft: "4px solid #000"
      }}>
          <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
            <div>
              <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
                Active Digital Referrals
              </div>
              <div style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              marginTop: '2px'
            }}>
                {summary.activeReferrals} Active
              </div>
            </div>
            <div style={{
            padding: '10px'
          }}>
              <Activity size={22} />
            </div>
          </div>
          <div style={{
          fontSize: '0.75rem',
          marginTop: '6px',
          fontWeight: 600
        }}>
            {summary.emergencyAlertsCount} Critical 108 Emergency Handshakes
          </div>
        </div>

      </div>

      {/* Row 2: Disease Surveillance Radar & Medicine Inventory Alert Matrix */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
      gap: '20px',
      marginBottom: '24px'
    }}>
        
        {/* Left: Disease Outbreak Radar */}
        <div className="glass-panel" style={{
        padding: '22px'
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
              <ShieldAlert size={20} color="#dc2626" />
              <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800
            }}>
                Epidemiological Surveillance Radar
              </h3>
            </div>
            <span className="badge badge-red">Early Warning System</span>
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
            {diseaseOutbreaks.map((ob, idx) => <div key={idx} style={{
            padding: '14px',
            border: "1px solid #000"
          }}>
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
                  <div>
                    <strong style={{
                  fontSize: '0.92rem'
                }}>{ob.disease}</strong>
                    <div style={{
                  fontSize: '0.78rem'
                }}>
                      📍 Location: <strong>{ob.village}</strong> ({ob.block})
                    </div>
                  </div>
                  <div style={{
                textAlign: 'right'
              }}>
                    <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 800
                }}>
                      {ob.casesThisWeek} Cases
                    </span>
                    <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700
                }}>
                      {ob.trend}
                    </div>
                  </div>
                </div>

                <div style={{
              padding: '8px 12px',
              marginTop: '8px',
              fontSize: '0.76rem',
              border: "1px solid #000"
            }}>
                  🛡️ <strong>CMO Action Trigger:</strong> {ob.recommendedAction}
                </div>
              </div>)}
          </div>
        </div>

        {/* Right: Medicine Stockout Risk Matrix */}
        <div className="glass-panel" style={{
        padding: '22px'
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
              <Pill size={20} color="#d97706" />
              <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800
            }}>
                Medicine Supply & Stockout Alerts
              </h3>
            </div>
            <span className="badge badge-yellow">Warehouse Depletion</span>
          </div>

          <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '340px',
          overflowY: 'auto'
        }}>
            {inventoryAlerts.all.map(med => {
            const isCrit = med.status === 'Critical Low' || med.status === 'Out of Stock';
            return <div key={med.id} style={{
              padding: '12px 14px',
              border: isCrit ? '1px solid #fde68a' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
                  <div>
                    <strong style={{
                  fontSize: '0.88rem'
                }}>{med.name}</strong>
                    <div style={{
                  fontSize: '0.75rem'
                }}>
                      {med.facilityName} • Cat: {med.category}
                    </div>
                  </div>

                  <div style={{
                textAlign: 'right'
              }}>
                    <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 800
                }}>
                      {med.stockQty} {med.unit}
                    </div>
                    <span className={`badge ${isCrit ? 'badge-yellow' : 'badge-green'}`} style={{
                  fontSize: '0.62rem'
                }}>
                      {med.status} (Min: {med.minThreshold})
                    </span>
                  </div>
                </div>;
          })}
          </div>
        </div>

      </div>

      {/* Row 3: Facility Bed & Doctor Load Live Roster */}
      <div className="glass-panel" style={{
      padding: '22px',
      marginBottom: '24px'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
            <Building2 size={20} color="#059669" />
            <h3 style={{
            fontSize: '1.15rem',
            fontWeight: 800
          }}>
              Public Healthcare Facility Roster & Operational Load
            </h3>
          </div>
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
                padding: '10px 14px'
              }}>FACILITY NAME</th>
                <th style={{
                padding: '10px 14px'
              }}>TIER TYPE</th>
                <th style={{
                padding: '10px 14px'
              }}>LOCATION</th>
                <th style={{
                padding: '10px 14px'
              }}>DOCTORS ON DUTY</th>
                <th style={{
                padding: '10px 14px'
              }}>BED OCCUPANCY</th>
                <th style={{
                padding: '10px 14px'
              }}>OXYGEN</th>
                <th style={{
                padding: '10px 14px'
              }}>CURRENT WAIT TIME</th>
              </tr>
            </thead>
            <tbody>
              {facilitiesCapacity.map((f, i) => {
              const occPercent = f.beds?.total ? Math.round(f.beds.occupied / f.beds.total * 100) : 0;
              return <tr key={f.id || i} style={{
                borderBottom: "1px solid #000"
              }}>
                    <td style={{
                  padding: '12px 14px',
                  fontWeight: 700
                }}>{f.name}</td>
                    <td style={{
                  padding: '12px 14px'
                }}>
                      <span className="badge badge-green" style={{
                    fontSize: '0.68rem'
                  }}>{f.type}</span>
                    </td>
                    <td style={{
                  padding: '12px 14px'
                }}>{f.village}</td>
                    <td style={{
                  padding: '12px 14px'
                }}>
                      <strong style={{}}>
                        {f.doctorsAvailable} / {f.totalDoctors} Active
                      </strong>
                    </td>
                    <td style={{
                  padding: '12px 14px'
                }}>
                      <div>{f.beds?.occupied || 0} / {f.beds?.total || 0} ({occPercent}%)</div>
                      <div style={{
                    height: '6px',
                    width: '100px',
                    marginTop: '4px',
                    overflow: 'hidden'
                  }}>
                        <div style={{
                      height: '100%',
                      width: `${occPercent}%`
                    }} />
                      </div>
                    </td>
                    <td style={{
                  padding: '12px 14px',
                  fontWeight: 600
                }}>{f.oxygenCylinders} Cylinders</td>
                    <td style={{
                  padding: '12px 14px'
                }}>{f.waitTimeMins} mins</td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>

    </div>;
}