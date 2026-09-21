import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ExternalLink, Navigation, MapPin } from 'lucide-react';
import { getGoogleMapsDirUrl } from '../utils/geolocation';
export default function LiveMap({
  patientCoords = {
    lat: 28.6139,
    lng: 77.2090
  },
  patientLabel = 'Patient Incident Site',
  hospitalCoords = {
    lat: 28.6139,
    lng: 77.2090
  },
  hospitalName = 'Emergency Healthcare Facility',
  ambulanceCoords = null,
  ambulanceEtaMins = 8,
  distanceKm = 3.5,
  height = '320px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const pLat = patientCoords?.lat || 22.8354;
    const pLng = patientCoords?.lng || 70.8548;

    let hLat = (typeof hospitalCoords?.lat === 'number' && !isNaN(hospitalCoords.lat)) ? hospitalCoords.lat : (pLat + 0.012);
    let hLng = (typeof hospitalCoords?.lng === 'number' && !isNaN(hospitalCoords.lng)) ? hospitalCoords.lng : (pLng + 0.010);

    // Initialize Leaflet Map with OpenStreetMap
    const map = L.map(mapContainerRef.current, {
      center: [(pLat + hLat) / 2, (pLng + hLng) / 2],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Standard OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const patientIcon = L.divIcon({
      className: '',
      html: `
        <style>
          @keyframes pinDrop { 0%{transform:translateY(-6px)} 100%{transform:translateY(0px)} }
          @keyframes shadowPulse { 0%{transform:scale(0.6);opacity:0.3} 100%{transform:scale(1);opacity:0.15} }
        </style>
        <div style="position:relative;width:36px;height:50px">
          <svg style="animation:pinDrop 0.4s ease-in-out infinite alternate" width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#0284c7"/>
            <circle cx="18" cy="18" r="8" fill="#fff"/>
          </svg>
          <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:16px;height:4px;border-radius:50%;background:rgba(0,0,0,0.2);animation:shadowPulse 0.4s ease-in-out infinite alternate"></div>
        </div>
      `,
      iconSize: [36, 50],
      iconAnchor: [18, 44]
    });
    L.marker([pLat, pLng], {
      icon: patientIcon
    }).addTo(map).bindPopup(`<strong>📍 ${patientLabel}</strong><br/>Your GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}`).openPopup();

    // 2. Destination Marker (Blood Bank / Hospital)
    const isBlood = hospitalName?.toLowerCase().includes('blood') || hospitalName?.toLowerCase().includes('red cross') || hospitalName?.toLowerCase().includes('rotary');
    const hospitalIcon = L.divIcon({
      className: '',
      html: `
        <div style="width: 34px; height: 34px; border-radius: 50%; background: ${isBlood ? '#dc2626' : '#059669'}; border: 2.5px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
          ${isBlood ? '🩸' : '🏥'}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    L.marker([hLat, hLng], {
      icon: hospitalIcon
    }).addTo(map).bindPopup(`<strong>${isBlood ? '🩸 Blood Centre' : '🏥 Facility'}: ${hospitalName}</strong><br/>Distance: ${distanceKm || ''} km`);

    // 3. Optional Ambulance Marker
    const boundsPoints = [[pLat, pLng], [hLat, hLng]];
    if (ambulanceCoords && ambulanceCoords.lat && ambulanceCoords.lng) {
      const aLat = ambulanceCoords.lat;
      const aLng = ambulanceCoords.lng;
      boundsPoints.push([aLat, aLng]);
      const ambulanceIcon = L.divIcon({
        className: '',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #f59e0b; border: 2.5px solid white; box-shadow: 0 3px 10px rgba(245,158,11,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">
            🚑
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([aLat, aLng], {
        icon: ambulanceIcon
      }).addTo(map).bindPopup(`<strong>🚑 108 Ambulance ALS-108</strong><br/>En Route (ETA: ${ambulanceEtaMins} mins)`);

      L.polyline([[aLat, aLng], [pLat, pLng], [hLat, hLng]], {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);
    } else {
      L.polyline([[pLat, pLng], [hLat, hLng]], {
        color: '#dc2626',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(map);
    }

    // Fit map bounds to show all markers comfortably
    const bounds = L.latLngBounds(boundsPoints);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 15
    });
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
    mapInstanceRef.current = map;
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [patientCoords?.lat, patientCoords?.lng, hospitalCoords?.lat, hospitalCoords?.lng, hospitalName, ambulanceEtaMins, distanceKm]);
  const pLat = patientCoords?.lat || 22.8354;
  const pLng = patientCoords?.lng || 70.8548;
  const hLat = hospitalCoords?.lat || pLat + 0.012;
  const hLng = hospitalCoords?.lng || pLng + 0.010;
  const googleMapsUrl = getGoogleMapsDirUrl(pLat, pLng, hLat, hLng);
  return <div style={{
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    border: "1px solid #000",
    zIndex: 1,
    isolation: 'isolate'
  }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{
      width: '100%',
      height
    }} />

      {/* Floating Telemetry Badge */}
      <div style={{
      position: 'absolute',
      top: '12px',
      left: '12px',
      zIndex: 1000,
      padding: '6px 12px',
      border: "1px solid #000",
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.78rem'
    }}>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 800
      }}>
          <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px'
        }}></span>
          <span>108 LIVE GPS</span>
        </div>
        <div style={{}}>•</div>
        <div style={{
        fontWeight: 700
      }}>
          ETA: <strong>{ambulanceEtaMins} Mins</strong> ({distanceKm} km)
        </div>
      </div>

      {/* Google Maps Direct Navigation Link */}
      <div style={{
      position: 'absolute',
      bottom: '12px',
      right: '12px',
      zIndex: 1000
    }}>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        textDecoration: 'none',
        border: "1px solid #000"
      }}>
          <Navigation size={13} color="#2563eb" />
          <span>Open in Google Maps Navigation</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>;
}