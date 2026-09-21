import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MapPin, Phone, Navigation, ExternalLink, Clock, RefreshCw, AlertCircle, LocateFixed, Search, Loader, ChevronDown, ChevronUp, Stethoscope, Globe, Radio, CheckCircle2 } from 'lucide-react';
import { getLivePosition, reverseGeocode, calculateDistanceKm, fetchRealNearbyHospitals, searchLocationByName } from '../utils/geolocation';

/* ─── Amenity label mapping ───────────────────────────────────────────────── */
function getAmenityLabel(amenity) {
  const map = {
    hospital: {
      text: 'Hospital',
      color: '#b91c1c',
      bg: '#fee2e2'
    },
    clinic: {
      text: 'Clinic',
      color: '#047857',
      bg: '#d1fae5'
    },
    doctors: {
      text: 'Doctor / GP',
      color: '#7c3aed',
      bg: '#ede9fe'
    },
    health_centre: {
      text: 'Health Centre',
      color: '#0369a1',
      bg: '#e0f2fe'
    },
    health: {
      text: 'Health Facility',
      color: '#0369a1',
      bg: '#e0f2fe'
    }
  };
  return map[amenity] || {
    text: amenity || 'Medical Facility',
    color: '#374151',
    bg: '#f3f4f6'
  };
}

/* ─── Leaflet custom icons ────────────────────────────────────────────────── */
function createHospitalIcon(index, isFirst) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 30px; height: 30px; border-radius: 50%;
        background: ${isFirst ? '#059669' : '#0369a1'};
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: 800;
      ">${index}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}
function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes pinDrop { 0%{transform:translateY(-6px)} 100%{transform:translateY(0px)} }
        @keyframes shadowPulse { 0%{transform:scale(0.6);opacity:0.3} 100%{transform:scale(1);opacity:0.15} }
      </style>
      <div style="position:relative;width:36px;height:50px">
        <svg style="animation:pinDrop 0.4s ease-in-out infinite alternate" width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#ef4444"/>
          <circle cx="18" cy="18" r="8" fill="#fff"/>
        </svg>
        <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:16px;height:4px;border-radius:50%;background:rgba(0,0,0,0.2);animation:shadowPulse 0.4s ease-in-out infinite alternate"></div>
      </div>
    `,
    iconSize: [36, 50],
    iconAnchor: [18, 44]
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function NearbyHospitals({
  onSelectHospital,
  onLoadingStateChange,
  onHospitalsFetched
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [status, setStatus] = useState('locating'); // idle|locating|loading|done|error
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [radius, setRadius] = useState(10000);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState('');
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(status === 'locating' || status === 'loading');
    }
  }, [status, onLoadingStateChange]);
  useEffect(() => {
    if (onHospitalsFetched && hospitals.length > 0) {
      onHospitalsFetched(hospitals);
    }
  }, [hospitals, onHospitalsFetched]);

  /* ── Init / reset Leaflet map ──────────────────────────────────────────── */
  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current) return null;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // User marker
    L.marker([lat, lng], {
      icon: createUserIcon(),
      zIndexOffset: 1000
    }).addTo(map).bindPopup('<strong>📍 Your Location</strong>');
    mapInstanceRef.current = map;
    return map;
  }, []);

  /* ── Place hospital markers on map ────────────────────────────────────── */
  const placeMarkers = useCallback((map, list, userLat, userLng) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const bounds = [[userLat, userLng]];
    list.forEach((h, idx) => {
      const marker = L.marker([h.lat, h.lng], {
        icon: createHospitalIcon(idx + 1, idx === 0)
      }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:170px; padding:4px;">
          <div style="font-weight:800; font-size:13px; color:#064e3b; margin-bottom:3px;">${idx + 1}. ${h.name}</div>
          <div style="font-size:11px; color:#6b7280;">📍 ${h.distanceKm} km away</div>
          ${h.phone ? `<div style="font-size:12px; margin-top:4px; color:#065f46; font-weight:700;">📞 ${h.phone}</div>` : ''}
        </div>
      `);
      marker.on('click', () => setExpandedId(h.id));
      markersRef.current.push(marker);
      bounds.push([h.lat, h.lng]);
    });
    if (bounds.length > 1) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
      });
    }
  }, []);

  /* ── Load hospitals for coordinates ───────────────────────────────────── */
  const loadHospitalsForLocation = useCallback(async (coords, address, currentRadius) => {
    setUserCoords(coords);
    if (address) setUserAddress(address);
    setStatus('loading');
    setError('');
    const searchRadius = currentRadius ?? radius;
    const map = initMap(coords.lat, coords.lng);
    try {
      const parsed = await fetchRealNearbyHospitals(coords.lat, coords.lng, searchRadius);
      setHospitals(parsed);
      setStatus('done');
      if (map && parsed.length > 0) {
        placeMarkers(map, parsed, coords.lat, coords.lng);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hospitals. Please check your internet connection.');
      setStatus('error');
    }
  }, [radius, initMap, placeMarkers]);

  /* ── Main auto-detect GPS / IP flow ───────────────────────────────────── */
  const runAutoDetect = useCallback(async forcedRadius => {
    setStatus('locating');
    setError('');
    setPermissionNotice('');
    setHospitals([]);
    const pos = await getLivePosition();
    setUserCoords(pos);
    if (pos.permissionStatus === 'denied') {
      setPermissionNotice('GPS access was not granted by your browser. We are showing hospitals near your detected city network. You can also search your exact area or pincode below.');
    }
    let addr = pos.city ? `${pos.city}, ${pos.region || ''}` : '';
    try {
      const geo = await reverseGeocode(pos.lat, pos.lng);
      addr = geo.shortAddress || geo.formattedAddress || addr || 'Live Location';
    } catch (_) {}
    setUserAddress(addr);
    await loadHospitalsForLocation(pos, addr, forcedRadius ?? radius);
  }, [radius, loadHospitalsForLocation]);

  /* ── Explicit GPS Request when user taps button ───────────────────────── */
  const handleRequestLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('locating');
    setPermissionNotice('');
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy || 10),
        source: 'gps',
        isFallback: false,
        permissionStatus: 'granted'
      };
      setUserCoords(coords);
      try {
        const geo = await reverseGeocode(coords.lat, coords.lng);
        const addr = geo.shortAddress || geo.formattedAddress || 'Live GPS Location';
        setUserAddress(addr);
        loadHospitalsForLocation(coords, addr, radius);
      } catch (_) {
        loadHospitalsForLocation(coords, 'Live GPS Location', radius);
      }
    }, err => {
      console.warn('Manual GPS request error:', err);
      setPermissionNotice(err.code === 1 ? 'Location permission is blocked. Please allow location in your browser settings (tap 🔒 lock icon in URL bar) or type your city/pincode below.' : 'GPS signal timed out. Using network location.');
      runAutoDetect(radius);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  /* ── Custom City / Pincode Search ─────────────────────────────────────── */
  const handleCustomSearch = async e => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const found = await searchLocationByName(searchQuery);
      if (found) {
        const coords = {
          lat: found.lat,
          lng: found.lng,
          accuracy: 50,
          source: 'search',
          isFallback: false
        };
        setUserCoords(coords);
        setUserAddress(found.shortAddress || found.displayName || searchQuery);
        setPermissionNotice('');
        await loadHospitalsForLocation(coords, found.shortAddress, radius);
      } else {
        alert(`Location "${searchQuery}" not found. Please try entering a city name or 6-digit PIN code.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for location. Please check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Auto-run on mount
  useEffect(() => {
    runAutoDetect(radius);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  const handleRadiusChange = newRadius => {
    setRadius(newRadius);
    if (userCoords) {
      loadHospitalsForLocation(userCoords, userAddress, newRadius);
    }
  };
  const openDirections = h => {
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    const dest = `${h.lat},${h.lng}`;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`, '_blank');
  };
  const openOsmMap = h => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}&query=${h.lat},${h.lng}`, '_blank');
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */
  return <div>
      {/* ── Top Bar: Search City / Pincode + Location Controls ────────────── */}
      <div style={{
      border: "1px solid #000",
      padding: '14px 16px',
      marginBottom: '14px'
    }}>
        {/* Search Bar Row */}
        <form onSubmit={handleCustomSearch} style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
          <div style={{
          position: 'relative',
          flex: 1,
          minWidth: '220px'
        }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0f4a46' }}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search city, PIN code, or Hospital Name (e.g. AIIMS Delhi)..." style={{
            width: '100%',
            padding: '10px 12px 10px 38px',
            border: "1.5px solid #000",
            fontSize: '0.86rem',
            outline: 'none',
            fontWeight: 600
          }} />
          </div>
          <button type="submit" disabled={searchLoading || !searchQuery.trim()} className="btn-primary" style={{
          padding: '9px 18px',
          fontSize: '0.85rem',
          whiteSpace: 'nowrap'
        }}>
            {searchLoading ? <Loader size={14} style={{}} /> : <Search size={14} />}
            <span>Search Area</span>
          </button>
          <button type="button" onClick={handleRequestLiveGps} disabled={status === 'locating' || status === 'loading'} style={{
          padding: '9px 16px',
          border: "1.5px solid #000",
          fontWeight: 800,
          fontSize: '0.84rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap'
        }}>
            <LocateFixed size={15} color="#059669" />
            <span>📍 Use Live GPS</span>
          </button>
        </form>

        {/* Status Badges & Controls Row */}
        <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        borderTop: "1px solid #000",
        paddingTop: '10px'
      }}>
          {/* Active Location Badge */}
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${userCoords?.source === 'gps' ? '#a7f3d0' : '#bae6fd'}`,
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
              {userCoords?.source === 'gps' ? <Radio size={14} color="#059669" style={{}} /> : <Globe size={14} color="#0284c7" />}
              <span style={{
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
                {status === 'locating' ? 'Locating...' : userAddress || 'Active Location'}
              </span>
              {userCoords?.source === 'gps' && <span style={{
              fontSize: '0.68rem',
              fontWeight: 800
            }}>● LIVE GPS</span>}
              {userCoords?.source === 'ip' && <span style={{
              fontSize: '0.68rem',
              fontWeight: 800
            }}>● CITY NETWORK</span>}
              {userCoords?.source === 'search' && <span style={{
              fontSize: '0.68rem',
              fontWeight: 800
            }}>● SEARCHED</span>}
            </div>

            {/* Radius Selector */}
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
              <span style={{
              fontSize: '0.78rem',
              fontWeight: 600
            }}>Radius:</span>
              <select value={radius} onChange={e => handleRadiusChange(Number(e.target.value))} disabled={status === 'loading' || status === 'locating'} style={{
              padding: '5px 10px',
              border: "1px solid #000",
              fontSize: '0.82rem',
              fontWeight: 700,
              outline: 'none'
            }}>
                <option value={2000}>2 km radius</option>
                <option value={5000}>5 km radius</option>
                <option value={10000}>10 km radius</option>
                <option value={20000}>20 km radius</option>
                <option value={50000}>50 km radius</option>
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button onClick={() => {
          runAutoDetect(radius);
        }} disabled={status === 'locating' || status === 'loading'} className="btn-secondary" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          padding: '6px 12px'
        }}>
            {status === 'locating' || status === 'loading' ? <><Loader size={13} style={{}} /> Locating...</> : <><RefreshCw size={13} /> Refresh</>}
          </button>
        </div>
      </div>

      {/* ── Permission or Network Notice ─────────────────────────────────── */}
      {permissionNotice && <div style={{
      border: "1px solid #000",
      padding: '12px 16px',
      marginBottom: '14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontSize: '0.82rem',
      lineHeight: 1.45
    }}>
          <AlertCircle size={18} color="#d97706" style={{
        flexShrink: 0,
        marginTop: '2px'
      }} />
          <div style={{
        flex: 1
      }}>
            <div style={{
          fontWeight: 800,
          marginBottom: '2px'
        }}>Location Access Guide:</div>
            <div>{permissionNotice}</div>
          </div>
          <button onClick={handleRequestLiveGps} style={{
        border: 'none',
        padding: '6px 12px',
        fontSize: '0.75rem',
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}>
            📍 Allow GPS
          </button>
        </div>}

      {/* ── Leaflet Map ──────────────────────────────────────────────────── */}
      <div style={{
      width: '100%',
      height: '360px',
      overflow: 'hidden',
      border: "1px solid #000",
      marginBottom: '16px',
      position: 'relative',
      zIndex: 1,
      isolation: 'isolate'
    }}>
        {(status === 'locating' || status === 'loading') && <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(4px)'
      }}>
            <div className="loading" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="64px" height="48px">
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
              </svg>
            </div>
            <span style={{
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
              {status === 'locating' ? '📍 Live location identify ho rahi hai...' : '🔍 100% Real nearby hospitals fetch ho rahe hain...'}
            </span>
            <span style={{
          fontSize: '0.75rem'
        }}>
              OpenStreetMap Overpass & Satellite database query active
            </span>
          </div>}
        <div ref={mapRef} style={{
        width: '100%',
        height: '100%'
      }} />
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {status === 'error' && <div style={{
      border: "1px solid #000",
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <div style={{
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>{error}</div>
            <button onClick={() => runAutoDetect(radius)} style={{
          marginTop: '6px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
              🔄 Try Again
            </button>
          </div>
        </div>}

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      {status === 'done' && <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      marginBottom: '16px',
      border: `1px solid ${hospitals.length > 0 ? '#a7f3d0' : '#fde68a'}`,
      fontSize: '0.83rem',
      fontWeight: 700,
      flexWrap: 'wrap',
      justifyContent: 'space-between'
    }}>
          <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <Stethoscope size={16} color={hospitals.length > 0 ? '#059669' : '#b45309'} />
            {hospitals.length > 0 ? <span>{hospitals.length} healthcare facilities found within {radius / 1000} km of {userAddress || 'your location'}</span> : <span>No hospitals found within {radius / 1000} km — try expanding radius to 20 km or 50 km</span>}
          </div>
          {hospitals.length > 0 && <span style={{
        fontSize: '0.74rem',
        fontWeight: 800
      }}>
              Nearest: {hospitals[0].name} ({hospitals[0].distanceKm} km)
            </span>}
        </div>}

      {/* ── Hospital Cards ────────────────────────────────────────────────── */}
      {status === 'done' && hospitals.length > 0 && <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
          {hospitals.map((h, idx) => {
        const labelStyle = getAmenityLabel(h.amenity);
        const isExpanded = expandedId === h.id;
        const isFirst = idx === 0;
        return <div key={h.id || idx} style={{
          border: isFirst ? '2px solid #10b981' : '1px solid #e2e8f0',
          overflow: 'hidden',
          position: 'relative'
        }}>
                {/* Top ribbon for nearest */}
                {isFirst && <div style={{
            background: "#000000",
            padding: '3px 14px',
            fontSize: '0.66rem',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '0.04em'
          }}>
                    🏆 NEAREST HEALTHCARE FACILITY FROM YOUR LOCATION
                  </div>}

                <div style={{
            padding: '14px 16px'
          }}>
                  {/* Header row */}
                  <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
                    {/* Rank circle */}
                    <div style={{
                width: '30px',
                height: '30px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.88rem',
                marginTop: '2px'
              }}>
                      {idx + 1}
                    </div>

                    <div style={{
                flex: 1,
                minWidth: 0
              }}>
                      <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  marginBottom: '5px',
                  wordBreak: 'break-word'
                }}>
                        {h.name}
                      </h3>

                      {/* Badges row */}
                      <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                        <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                          🏥 {labelStyle.text}
                        </span>
                        {h.emergency && <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px'
                  }}>🚨 Emergency</span>}
                        {h.beds && <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px'
                  }}>{h.beds}</span>}
                      </div>
                    </div>

                    {/* Distance badge */}
                    <div style={{
                textAlign: 'center',
                flexShrink: 0,
                border: `1px solid ${isFirst ? '#a7f3d0' : '#bae6fd'}`,
                padding: '5px 10px'
              }}>
                      <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 900
                }}>
                        {h.distanceKm} km
                      </div>
                      <div style={{
                  fontSize: '0.6rem',
                  fontWeight: 700
                }}>
                        ~{h.etaMins || Math.max(3, Math.round(h.distanceKm * 2.2))} MINS
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {h.address && <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginTop: '10px',
              padding: '7px 10px',
              fontSize: '0.77rem'
            }}>
                      <MapPin size={12} color="#059669" style={{
                marginTop: '2px',
                flexShrink: 0
              }} />
                      <span>{h.address}</span>
                    </div>}

                  {/* Phone number */}
                  {h.phone ? <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              padding: '9px 12px',
              border: "1px solid #000"
            }}>
                      <Phone size={14} color="#059669" />
                      <a href={`tel:${h.phone}`} style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}>
                        {h.phone}
                      </a>
                      <span style={{
                fontSize: '0.68rem',
                fontWeight: 600
              }}>
                        (Tap to Call)
                      </span>
                    </div> : <div style={{
              marginTop: '10px',
              padding: '7px 10px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
                      <Phone size={12} color="#b45309" />
                      <span>Emergency Helpline: <a href="tel:108" style={{
                  fontWeight: 800
                }}>108</a> / <a href="tel:102" style={{
                  fontWeight: 800
                }}>102</a></span>
                    </div>}

                  {/* Operator */}
                  {h.operator && <div style={{
              fontSize: '0.75rem',
              marginTop: '6px',
              paddingLeft: '2px'
            }}>
                      🏛️ Managed by: <strong style={{}}>{h.operator}</strong>
                    </div>}

                  {/* Opening hours toggle */}
                  {h.openingHours && <div style={{
              marginTop: '8px'
            }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : h.id)} style={{
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.77rem',
                fontWeight: 700,
                padding: '3px 0'
              }}>
                        <Clock size={12} color="#6b7280" />
                        <span>Opening Hours: {isExpanded ? 'Hide' : 'Show'}</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {isExpanded && <div style={{
                marginTop: '4px',
                padding: '8px 10px',
                border: "1px solid #000",
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                          {h.openingHours}
                        </div>}
                    </div>}

                  {/* Action buttons */}
                  <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: "1px solid #000",
              flexWrap: 'wrap'
            }}>
                    <button onClick={() => openDirections(h)} className="btn-primary" style={{
                flex: 1,
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '0.8rem',
                minWidth: '130px'
              }}>
                      <Navigation size={13} />
                      <span>Get Driving Directions</span>
                    </button>

                    <button onClick={() => openOsmMap(h)} className="btn-secondary" style={{
                flex: 1,
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '0.8rem',
                minWidth: '130px'
              }}>
                      <ExternalLink size={13} />
                      <span>Open on Google Maps</span>
                    </button>

                    {onSelectHospital && <button onClick={() => onSelectHospital(h, userCoords)} className="btn-secondary" style={{
                flex: 1,
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '0.8rem',
                minWidth: '130px'
              }}>
                        <Stethoscope size={13} />
                        <span>Select for Referral</span>
                      </button>}
                  </div>
                </div>
              </div>;
      })}
        </div>}

      {/* ── CSS animations ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes nearbySpinAnim {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes nearbyPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          50%  { transform: scale(1.6); opacity: 0.3; }
          100% { transform: scale(1);   opacity: 0.8; }
        }
      `}</style>
    </div>;
}