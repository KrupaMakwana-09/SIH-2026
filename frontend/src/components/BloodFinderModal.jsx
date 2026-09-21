import React, { useState, useEffect, useRef } from 'react';
import { Droplet, Phone, MapPin, Clock, Search, LocateFixed, X, ExternalLink, Shield, Heart, Share2, AlertCircle, CheckCircle2, Send, MessageCircle, Building, RefreshCw, Award, Navigation, Map } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { getLivePosition, reverseGeocode, calculateDistanceKm, getGoogleMapsDirUrl, fetchRealNearbyBloodBanks, searchLocationByName } from '../utils/geolocation';
import LiveMap from './LiveMap';
const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export default function BloodFinderModal({
  isOpen,
  onClose
}) {
  const [activeView, setActiveView] = useState('find'); // 'find' | 'request'
  const [bloodBanks, setBloodBanks] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filters
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [locationDenied, setLocationDenied] = useState(false);
  const [selectedCenterForMap, setSelectedCenterForMap] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const mapSectionRef = useRef(null);

  // Emergency Request Form State
  const [patientName, setPatientName] = useState('');
  const [reqBloodGroup, setReqBloodGroup] = useState('O+');
  const [unitsNeeded, setUnitsNeeded] = useState('1');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalCity, setHospitalCity] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('IMMEDIATE');
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccessMsg, setReqSuccessMsg] = useState('');

  // Load Blood Banks from OpenStreetMap + Verified Registry + Backend
  const loadBloodBanks = async (coords = null, group = selectedGroup, type = selectedType, q = searchQuery) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const activeCoords = coords || userLocation || { lat: 22.8194, lng: 70.8370 };

      // 1. Fetch live centers from OpenStreetMap and verified state registry
      let results = await fetchRealNearbyBloodBanks(activeCoords.lat, activeCoords.lng, 35000);

      // 2. Query backend API if available to merge user-submitted requests or additional DB records
      try {
        const params = { lat: activeCoords.lat, lng: activeCoords.lng };
        if (group && group !== 'ALL') params.bloodGroup = group;
        if (type && type !== 'ALL') params.type = type;
        if (q && q.trim()) params.search = q.trim();
        const res = await api.getBloodBanks(params);
        if (res && res.success && Array.isArray(res.bloodBanks)) {
          res.bloodBanks.forEach(b => {
            if (!results.find(x => x.name.toLowerCase() === b.name.toLowerCase())) {
              results.push(b);
            }
          });
          if (res.activeRequests) {
            setActiveRequests(res.activeRequests);
          }
        }
      } catch (e) {
        console.warn('Backend blood banks API fallback:', e);
      }

      // 3. Apply blood group filter
      if (group && group !== 'ALL') {
        results = results.filter(bb => bb.stock && bb.stock[group] !== undefined && bb.stock[group] > 0);
      }

      // 4. Apply text search query
      if (q && q.trim()) {
        const qLower = q.trim().toLowerCase();
        results = results.filter(bb => 
          bb.name.toLowerCase().includes(qLower) ||
          bb.address.toLowerCase().includes(qLower) ||
          (bb.city && bb.city.toLowerCase().includes(qLower)) ||
          (bb.type && bb.type.toLowerCase().includes(qLower))
        );
      }

      // 5. Recalculate distance from current coordinates & sort
      results = results.map(bb => ({
        ...bb,
        distanceKm: calculateDistanceKm(activeCoords.lat, activeCoords.lng, bb.lat, bb.lng)
      })).sort((a, b) => a.distanceKm - b.distanceKm);

      setBloodBanks(results);
      if (results.length > 0) {
        setSelectedCenterForMap(results[0]);
      }
    } catch (err) {
      console.error('Error fetching blood banks:', err);
      setErrorMsg('Failed to load blood banks. Check network.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect GPS / Network Location on Modal Open
  const handleDetectLocation = async () => {
    setLocating(true);
    setLocationDenied(false);
    try {
      const pos = await getLivePosition();
      if (pos && pos.lat && pos.lng) {
        setUserLocation(pos);
        if (pos.permissionStatus === 'denied') {
          setLocationDenied(true);
        }
        try {
          const geo = await reverseGeocode(pos.lat, pos.lng);
          const name = geo.village || geo.district || geo.shortAddress || pos.city || 'Your Location';
          setLocationName(name);
        } catch {
          setLocationName(pos.city || 'Your Live Location');
        }
        await loadBloodBanks(pos);
      } else {
        setLocationDenied(true);
        await loadBloodBanks();
      }
    } catch (err) {
      console.warn('Geolocation notice:', err);
      setLocationDenied(true);
      setLocationName('Gujarat Region');
      await loadBloodBanks();
    } finally {
      setLocating(false);
    }
  };

  const handleViewOnMap = (bb) => {
    setSelectedCenterForMap(bb);
    setShowMap(true);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleDetectLocation();
    }
  }, [isOpen]);

  const handleGroupFilter = bg => {
    setSelectedGroup(bg);
    loadBloodBanks(userLocation, bg, selectedType, searchQuery);
  };

  // OpenStreetMap Nominatim City/Area Search
  const handleSearchSubmit = async e => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      loadBloodBanks(userLocation, selectedGroup, selectedType, '');
      return;
    }
    setLoading(true);
    try {
      // 1. Try finding city/village via OpenStreetMap Nominatim
      const geoFound = await searchLocationByName(searchQuery);
      if (geoFound && geoFound.lat && geoFound.lng) {
        const newCoords = { lat: geoFound.lat, lng: geoFound.lng, source: 'search' };
        setUserLocation(newCoords);
        setLocationName(geoFound.shortAddress || geoFound.displayName);
        setLocationDenied(false);
        await loadBloodBanks(newCoords, selectedGroup, selectedType, '');
        return;
      }
    } catch (searchErr) {
      console.warn('OSM location search note:', searchErr);
    }
    // 2. If not a specific city, filter centers by name
    loadBloodBanks(userLocation, selectedGroup, selectedType, searchQuery);
  };

  // Handle Emergency Request Submission
  const handleBroadcastRequest = async e => {
    e.preventDefault();
    if (!patientName || !contactPhone || !hospitalName) {
      setErrorMsg('Please fill in patient name, hospital name, and contact number.');
      return;
    }
    setSubmittingReq(true);
    setErrorMsg('');
    try {
      const res = await api.createBloodRequest({
        patientName,
        bloodGroup: reqBloodGroup,
        unitsNeeded,
        hospitalName,
        city: hospitalCity || locationName,
        contactPerson: contactPerson || patientName,
        contactPhone,
        urgency: urgencyLevel,
        notes: requestNotes
      });
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        setReqSuccessMsg(`🚨 Emergency Blood Request for ${patientName} (${reqBloodGroup}) Broadcasted! Contact: ${contactPhone}`);
        if (res.request) {
          setActiveRequests(prev => [res.request, ...prev]);
        }
        // Reset form
        setPatientName('');
        setHospitalName('');
        setContactPhone('');
        setRequestNotes('');
      } else {
        setErrorMsg(res.message || 'Failed to submit request.');
      }
    } catch {
      setErrorMsg('Failed to broadcast request. Please check connection.');
    } finally {
      setSubmittingReq(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="mobile-p-0" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(8, 63, 61, 0.5)',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="mobile-sheet" style={{
        width: '100%',
        maxWidth: '840px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#FFFFFF',
        borderRadius: '24px',
        boxShadow: '0 24px 60px rgba(8, 63, 61, 0.2)',
        position: 'relative'
      }}>

        {/* Absolute Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(0, 0, 0, 0.15)',
          border: 'none',
          color: '#FFFFFF',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.9,
          transition: 'all 0.2s',
          zIndex: 10
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)'; }}
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* ══════ MODAL HEADER ══════ */}
        <div style={{
          background: 'var(--primary)',
          color: '#FFFFFF',
          padding: '24px 32px',
          paddingRight: '72px', // Prevent overlap with absolute close button
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              flexShrink: 0
            }}>
              <Droplet size={26} color="#ffffff" fill="#ffffff" />
            </div>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: 'var(--font-body)'
                }}>
                  Emergency Blood Donors & Blood Help
                </h2>
                <span style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'var(--emergency)',
                  color: '#fff',
                  borderRadius: '100px',
                  fontFamily: 'var(--font-mono)'
                }}>
                  OpenMap Live
                </span>
              </div>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.875rem',
                opacity: 0.85,
                fontFamily: 'var(--font-body)'
              }}>
                Find verified Blood Donors, Red Cross/Rotary NGOs, and Live Blood Stock Availability
              </p>
            </div>
          </div>

          <button type="button" onClick={handleDetectLocation} disabled={locating} style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !locating && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => !locating && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          >
            <LocateFixed size={16} className={locating ? 'animate-spin' : ''} />
            <span>{locating ? 'Detecting...' : locationName}</span>
          </button>
        </div>

        {/* ══════ EMERGENCY HOTLINES TICKER ══════ */}
        <div style={{
          borderBottom: '1px solid var(--borderLight)',
          background: '#FAFAFA',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.875rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            color: 'var(--foreground)'
          }}>
            <AlertCircle size={16} color="var(--emergency)" />
            <span>24x7 Government & Emergency Blood Helplines:</span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <a href="tel:1910" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--emergency)',
              background: '#FEF2F2',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '0.75rem'
            }}>
              <Phone size={12} /> eRaktKosh: <strong>1910</strong>
            </a>
            <a href="tel:104" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'rgba(11, 107, 104, 0.08)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '0.75rem'
            }}>
              <Phone size={12} /> Health Helpline: <strong>104</strong>
            </a>
            <a href="tel:108" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--emergency)',
              background: '#FEF2F2',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '0.75rem'
            }}>
              <Phone size={12} /> Ambulance: <strong>108</strong>
            </a>
          </div>
        </div>

        {/* ══════ VIEW SWITCHER (FIND VS BROADCAST) ══════ */}
        <div style={{
          display: 'flex',
          gap: '32px',
          borderBottom: '1px solid var(--borderLight)',
          padding: '0 32px'
        }}>
          <button type="button" onClick={() => setActiveView('find')} style={{
            padding: '16px 0',
            border: 'none',
            background: 'transparent',
            color: activeView === 'find' ? 'var(--primary)' : 'var(--mutedForeground)',
            fontWeight: activeView === 'find' ? 700 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            borderBottom: `2.5px solid ${activeView === 'find' ? 'var(--primary)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}>
            <Building size={18} />
            <span>Nearby Blood Donors & Banks ({bloodBanks.length})</span>
          </button>

          <button type="button" onClick={() => setActiveView('request')} style={{
            padding: '16px 0',
            border: 'none',
            background: 'transparent',
            color: activeView === 'request' ? 'var(--emergency)' : 'var(--mutedForeground)',
            fontWeight: activeView === 'request' ? 700 : 500,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            borderBottom: `2.5px solid ${activeView === 'request' ? 'var(--emergency)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}>
            <AlertCircle size={18} />
            <span>Broadcast Urgent Blood Request</span>
          </button>
        </div>

        {/* ══════ CONTENT BODY ══════ */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1
        }}>

          {activeView === 'find' ? <div>
              {/* Blood Group Filter Badges */}
              <div style={{
                marginBottom: '24px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--mutedForeground)',
                  letterSpacing: '0.05em',
                  marginBottom: '12px'
                }}>
                  Select Required Blood Group:
                </div>
                <div className="mobile-scroll-x" style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {BLOOD_GROUPS.map(bg => {
                    const isSelected = selectedGroup === bg;
                    return (
                      <button key={bg} type="button" onClick={() => handleGroupFilter(bg)} style={{
                        padding: '8px 16px',
                        background: isSelected ? 'var(--emergency)' : '#F7FAF9',
                        color: isSelected ? '#FFFFFF' : 'var(--foreground)',
                        border: `1px solid ${isSelected ? 'var(--emergency)' : 'var(--borderLight)'}`,
                        borderRadius: '100px',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                        {bg === 'ALL' ? '🩸 All Groups' : bg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '32px'
              }}>
                <div style={{
                  position: 'relative',
                  flex: 1
                }}>
                  <Search size={18} color="var(--primary)" style={{
                    position: 'absolute',
                    left: '16px',
                    top: '14px'
                  }} />
                  <input type="text" placeholder="Search City, Area (via OpenMap) or Blood Bank / Donor Name (e.g. Morbi, Rajkot, Ahmedabad)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    border: '1px solid var(--borderLight)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#F7FAF9'
                  }} />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '0 24px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}>
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  <span>Search</span>
                </button>
              </form>

              {/* Location Denied Warning Notice */}
              {locationDenied && (
                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.85rem',
                  color: '#92400E'
                }}>
                  <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Location access disabled or unavailable.</strong> Showing authorized blood centers & NGOs across Gujarat. You can filter by blood group or search by city above.
                  </div>
                </div>
              )}

              {/* Interactive Live Map Section */}
              {showMap && selectedCenterForMap && (
                <div ref={mapSectionRef} style={{
                  marginBottom: '24px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--borderLight)',
                  background: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(8, 63, 61, 0.08)'
                }}>
                  <div style={{
                    padding: '12px 20px',
                    background: '#083F3D',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} color="#EF4444" />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                        Live Satellite Route: {selectedCenterForMap.name}
                      </span>
                      {selectedCenterForMap.distanceKm !== null && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 10px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '100px',
                          fontWeight: 600
                        }}>
                          {selectedCenterForMap.distanceKm} km away
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <a
                        href={getGoogleMapsDirUrl(userLocation?.lat, userLocation?.lng, selectedCenterForMap.lat, selectedCenterForMap.lng)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: '#FFFFFF',
                          background: 'rgba(255,255,255,0.2)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600
                        }}
                      >
                        <Navigation size={14} /> Live GPS Route
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowMap(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          opacity: 0.8
                        }}
                        title="Close Map View"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                  <LiveMap
                    patientCoords={userLocation || { lat: 22.8194, lng: 70.8370 }}
                    patientLabel={locationName || 'Your Location'}
                    hospitalCoords={{ lat: selectedCenterForMap.lat, lng: selectedCenterForMap.lng }}
                    hospitalName={selectedCenterForMap.name}
                    distanceKm={selectedCenterForMap.distanceKm || 2.5}
                    height="260px"
                  />
                </div>
              )}

              {/* Map Toggle & Results Count Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--mutedForeground)' }}>
                  Found <strong>{bloodBanks.length}</strong> nearby blood donors & blood banks
                </div>
                {bloodBanks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    style={{
                      background: showMap ? '#083F3D' : '#F7FAF9',
                      color: showMap ? '#FFFFFF' : 'var(--foreground)',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Map size={14} />
                    <span>{showMap ? 'Hide OpenMap' : 'View OpenMap Live'}</span>
                  </button>
                )}
              </div>

              {/* Blood Bank / NGO Cards List */}
              {loading ? <div style={{
            textAlign: 'center',
            padding: '40px 0'
          }}>
                  <div className="loading" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="64px" height="48px">
                      <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
                      <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
                    </svg>
                  </div>
                  <div style={{
              fontSize: '0.9rem',
              fontWeight: 700
            }}>Finding verified nearby Blood Banks & NGOs...</div>
                </div> : bloodBanks.length === 0 ? <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            border: "1px solid #000"
          }}>
                  <AlertCircle size={36} color="#94a3b8" style={{
              margin: '0 auto 10px'
            }} />
                  <h3 style={{
              fontSize: '1rem',
              fontWeight: 800,
              margin: '0 0 4px'
            }}>No Blood Banks Found</h3>
                  <p style={{
              fontSize: '0.82rem',
              margin: 0
            }}>Try clearing the search query or changing the blood group filter.</p>
                </div> : <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
                  {bloodBanks.map(bb => {
              const stockForSelected = selectedGroup !== 'ALL' ? bb.stock[selectedGroup] || 0 : null;
              const directionsUrl = getGoogleMapsDirUrl(userLocation?.lat, userLocation?.lng, bb.lat, bb.lng);
              const whatsappUrl = `https://wa.me/${bb.whatsapp}?text=${encodeURIComponent(`Urgent Blood Requirement: I need ${selectedGroup !== 'ALL' ? selectedGroup : 'Blood'} in ${bb.city}. Please confirm availability.`)}`;
              return (
                <div key={bb.id} style={{
                  border: '1px solid var(--borderLight)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(8, 63, 61, 0.04)'
                }}>
                  {/* Card Top */}
                  <div style={{
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
                        gap: '8px',
                        marginBottom: '6px'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          background: 'rgba(11, 107, 104, 0.08)',
                          color: 'var(--primary)',
                          borderRadius: '100px'
                        }}>
                          {bb.type}
                        </span>
                        {bb.verified && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--primary)'
                          }}>
                            <CheckCircle2 size={14} /> Verified Raktkosh Center
                          </span>
                        )}
                      </div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--foreground)'
                      }}>
                        {bb.name}
                      </h3>
                      <div style={{
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '6px',
                        color: 'var(--mutedForeground)'
                      }}>
                        <MapPin size={14} />
                        <span>{bb.address}</span>
                      </div>
                      {bb.operatingHours && (
                        <div style={{
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '4px',
                          color: '#059669',
                          fontWeight: 600
                        }}>
                          <Clock size={13} />
                          <span>{bb.operatingHours}</span>
                        </div>
                      )}
                    </div>

                    {bb.distanceKm !== null && (
                      <div style={{
                        background: '#F7FAF9',
                        border: '1px solid var(--borderLight)',
                        borderRadius: '12px',
                        padding: '8px 16px',
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--mutedForeground)'
                        }}>Distance</div>
                        <div style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--foreground)'
                        }}>{bb.distanceKm} km</div>
                      </div>
                    )}
                  </div>

                  {/* Stock Badges Pill Grid */}
                  <div style={{
                    background: '#F7FAF9',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--mutedForeground)'
                    }}>
                      <span>Live Stock Availability (Units):</span>
                      <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width: 6, height: 6, borderRadius: '50%', background: '#059669'}}></div> 24x7 Ready to Issue</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {Object.entries(bb.stock || {}).map(([grp, count]) => {
                        const isTarget = selectedGroup === grp;
                        return (
                          <div key={grp} style={{
                            background: isTarget ? '#FEF2F2' : '#FFFFFF',
                            border: `1px solid ${isTarget ? 'var(--emergency)' : 'var(--borderLight)'}`,
                            color: isTarget ? 'var(--emergency)' : 'var(--foreground)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>{grp}:</span>
                            <span>{count} U</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Services / Component Tags */}
                  {bb.services && bb.services.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {bb.services.map((srv, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.75rem',
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 500
                        }}>
                          ✓ {srv}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions: Call, Directions, View on Map, WhatsApp */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    paddingTop: '8px'
                  }}>
                    <a href={`tel:${bb.emergencyPhone || bb.phone}`} style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: 'var(--primary)',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}>
                      <Phone size={15} /> Call ({bb.emergencyPhone || bb.phone})
                    </a>

                    <a href={directionsUrl} target="_blank" rel="noreferrer" style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: '1px solid var(--borderLight)',
                      background: '#FFFFFF',
                      color: 'var(--foreground)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}>
                      <Navigation size={15} /> Directions
                    </a>

                    <button
                      type="button"
                      onClick={() => handleViewOnMap(bb)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--borderLight)',
                        background: '#F8FAFC',
                        color: '#083F3D',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                      }}
                    >
                      <MapPin size={15} color="#EF4444" /> View on Map
                    </button>

                    {bb.whatsapp && (
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--borderLight)',
                        background: '#FFFFFF',
                        color: 'var(--foreground)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginLeft: 'auto',
                        transition: 'background 0.2s'
                      }}>
                        <MessageCircle size={15} /> WhatsApp SOS
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
                </div>}
            </div> : (/* ══════ BROADCAST URGENT BLOOD REQUEST FORM ══════ */
            <div>
              <form onSubmit={handleBroadcastRequest} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{
                  background: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <AlertCircle size={24} color="var(--emergency)" style={{
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--foreground)'
                    }}>
                      Need Immediate Blood Donor or NGO Dispatch?
                    </h4>
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      color: 'var(--mutedForeground)'
                    }}>
                      Fill this emergency alert. It will immediately broadcast to voluntary blood donor networks, registered Red Cross NGOs, and nearby blood banks in your district.
                    </p>
                  </div>
                </div>

                {reqSuccessMsg && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(5, 150, 105, 0.08)',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <CheckCircle2 size={20} />
                    <span>{reqSuccessMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div style={{
                    padding: '16px 20px',
                    background: '#FEF2F2',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--emergency)'
                  }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Patient Full Name *
                    </label>
                    <input type="text" required placeholder="Enter patient name..." value={patientName} onChange={e => setPatientName(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }} />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Blood Group Needed *
                    </label>
                    <select value={reqBloodGroup} onChange={e => setReqBloodGroup(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Units Required *
                    </label>
                    <input type="number" min="1" max="10" value={unitsNeeded} onChange={e => setUnitsNeeded(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }} />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Urgency Level *
                    </label>
                    <select value={urgencyLevel} onChange={e => setUrgencyLevel(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }}>
                      <option value="IMMEDIATE">🚨 IMMEDIATE (Within 2 Hours / Surgery)</option>
                      <option value="URGENT">⚡ URGENT (Needed Today)</option>
                      <option value="NORMAL">📅 PLANNED (Within 24 Hours)</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Hospital / Clinic Name & Room/Bed *
                    </label>
                    <input type="text" required placeholder="e.g. Civil Hospital, ICU Bed 4, Morbi" value={hospitalName} onChange={e => setHospitalName(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }} />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                      color: 'var(--foreground)'
                    }}>
                      Contact Phone Number *
                    </label>
                    <input type="tel" required placeholder="Attendant / Relative 10-digit Mobile..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid var(--borderLight)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: '#F7FAF9',
                      outline: 'none'
                    }} />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'var(--foreground)'
                  }}>
                    Additional Clinical Notes / Reason (Optional)
                  </label>
                  <textarea rows={3} placeholder="e.g. Emergency trauma, Thalassemia patient, Platelet transfusion needed, etc..." value={requestNotes} onChange={e => setRequestNotes(e.target.value)} style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid var(--borderLight)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    background: '#F7FAF9',
                    outline: 'none',
                    resize: 'vertical'
                  }} />
                </div>

                <button type="submit" disabled={submittingReq} style={{
                  padding: '16px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'var(--emergency)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)'
                }}>
                  <Send size={18} />
                  <span>{submittingReq ? 'Broadcasting Urgent Alert...' : 'Broadcast Emergency Blood Request'}</span>
                </button>
              </form>
              
              {/* Active Requests List */}
              {activeRequests.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} color="var(--emergency)" />
                    Live Emergency Blood Requirements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activeRequests.map(req => (
                      <div key={req.id} style={{
                        border: '1px solid #FCA5A5',
                        borderRadius: '12px',
                        padding: '16px',
                        background: '#FEF2F2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18312F', marginBottom: '4px' }}>
                              {req.patientName} requires <span style={{ color: 'var(--emergency)' }}>{req.bloodGroup}</span> ({req.unitsNeeded} Units)
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--mutedForeground)' }}>
                              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                              {req.hospitalName}, {req.city}
                            </div>
                          </div>
                          <span style={{
                            background: 'var(--emergency)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '100px'
                          }}>
                            {req.urgency}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#18312F' }}>
                          <strong>Contact:</strong> {req.contactPerson} ({req.contactPhone})
                        </div>
                        {req.notes && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--mutedForeground)', fontStyle: 'italic' }}>
                            "{req.notes}"
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--mutedForeground)', marginTop: '4px' }}>
                          Broadcasted: {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}

        </div>
      </div>
    </div>
  );
}