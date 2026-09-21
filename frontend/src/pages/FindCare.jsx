import React, { useState } from 'react';
import { Search, Building2, Stethoscope, AlertTriangle, FileText, Crosshair, Phone, ShieldCheck, Droplet, Activity, Users } from 'lucide-react';

export default function FindCare({ setIsNearbyOpen, setIsBloodOpen, setIsSOSOpen }) {
  const [searchTab, setSearchTab] = useState('hospitals'); // 'hospitals', 'doctors', 'emergency', 'programs'

  return (
    <>
      {/* ---------------- SEARCH UI ---------------- */}
      <section className="np-search" id="find-care" style={{ padding: '4rem 0 8rem 0', background: '#F7FAF9' }}>
        <div className="np-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#E6F0EF', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
              <Search size={14} strokeWidth={2.5} /> SEARCH NETWORK
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, color: '#18312F', lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Find Care <span style={{ color: 'var(--primary)' }}>Instantly</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: '#667876', maxWidth: '600px', lineHeight: 1.6 }}>
              Search for verified hospitals, specialists, or emergency services in your district.
            </p>
          </div>
          
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '1rem', boxShadow: '0 24px 50px rgba(8, 63, 61, 0.08)', border: '1px solid rgba(8, 63, 61, 0.05)', maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* TABS */}
            <div role="tablist" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: '#F7FAF9', borderRadius: '16px', marginBottom: '1rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'hospitals', label: 'Hospitals & Clinics', icon: <Building2 size={18} strokeWidth={2} /> },
                { id: 'doctors', label: 'Verified Doctors', icon: <Stethoscope size={18} strokeWidth={2} /> },
                { id: 'emergency', label: 'Emergency Services', icon: <AlertTriangle size={18} strokeWidth={2} /> },
                { id: 'programs', label: 'Health Programs', icon: <FileText size={18} strokeWidth={2} /> },
              ].map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={searchTab === t.id}
                  onClick={() => setSearchTab(t.id)}
                  style={{ 
                    flex: 1, minWidth: 'max-content', padding: '1rem 1.5rem', border: 'none', 
                    background: searchTab === t.id ? '#FFFFFF' : 'transparent',
                    color: searchTab === t.id ? 'var(--primary)' : '#667876',
                    borderRadius: '12px',
                    boxShadow: searchTab === t.id ? '0 4px 12px rgba(8, 63, 61, 0.05)' : 'none',
                    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* SEARCH FIELDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', padding: '0.5rem' }}>
              
              {/* Location */}
              <div className="brutalist-input-container">
                <input
                  id="np-loc"
                  type="text"
                  className="brutalist-input"
                  placeholder="LOC: Village, town, district..."
                />
                <div className="brutalist-icon">
                  <Crosshair size={22} strokeWidth={2.5} color="#18312F" style={{ cursor: 'pointer' }} onClick={(e) => e.preventDefault()} />
                </div>
              </div>

              {/* Service Needed */}
              <div className="brutalist-input-container">
                <input
                  id="np-need"
                  type="text"
                  className="brutalist-input"
                  placeholder={searchTab === 'emergency' ? 'FIND: Blood, Ambulance...' : 'FIND: OPD, Specialist...'}
                />
                <div className="brutalist-icon">
                  <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g strokeWidth="0"></g><g strokeLinecap="round" strokeLinejoin="round"></g>
                    <g> 
                      <path opacity="1" d="M14 5H20" stroke="#18312F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                      <path opacity="1" d="M14 8H17" stroke="#18312F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                      <path d="M21 11.5C21 16.75 16.75 21 11.5 21C6.25 21 2 16.75 2 11.5C2 6.25 6.25 2 11.5 2" stroke="#18312F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                      <path opacity="1" d="M22 22L20 20" stroke="#18312F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                    </g>
                  </svg>
                </div>
              </div>

              {/* Search Button */}
              <div className="box-button" onClick={() => setIsNearbyOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setIsNearbyOpen(true); }}>
                <div className="inner-button"><span>Search Network</span></div>
              </div>
            </div>

            {/* CHIPS */}
            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid rgba(8, 63, 61, 0.05)', marginTop: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: '#667876', textTransform: 'uppercase' }}>Popular:</span>
              {['24×7 Emergency', 'Maternity Care', 'Vaccination', 'Blood Bank', 'Cardiac', 'Pediatric'].map((c) => (
                <button key={c} type="button" style={{ 
                  padding: '0.5rem 1rem', border: '1px solid rgba(8, 63, 61, 0.1)', background: '#FFFFFF', borderRadius: '100px',
                  color: '#18312F', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)', fontWeight: 500
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#E6F0EF'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(8, 63, 61, 0.1)'; e.currentTarget.style.color = '#18312F'; }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- EMERGENCY ---------------- */}
      <section className="np-emergency np-texture" style={{ paddingBottom: '8rem' }}>
        <div className="np-container">
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            {/* Left: Strong Call to action with photo */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', boxShadow: '0 12px 40px rgba(217, 75, 75, 0.08)', borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '260px' }}>
                <img src="/images/emergency_ambulance_1789832904384.jpg" alt="108 Emergency Ambulance parked near a rural health facility" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--emergency)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
                  <AlertTriangle size={16} strokeWidth={2.5} />
                  EMERGENCY DISPATCH
                </div>
                
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: '#18312F', marginBottom: '1rem', lineHeight: 1.1 }}>
                  Every minute <span style={{ color: 'var(--emergency)' }}>matters.</span>
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: '#18312F', opacity: 0.8, marginBottom: '2.5rem', lineHeight: 1.6 }}>
                Direct access to ambulance dispatch, blood availability, and the nearest emergency-ready facility. No login required.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  className="np-btn"
                  style={{ width: '100%', background: 'var(--emergency)', color: '#fff', border: 'none', padding: '1.25rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', transition: 'background 0.2s', cursor: 'pointer' }}
                  onClick={() => setIsSOSOpen(true)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#B93D3D'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--emergency)'}
                >
                  <Phone size={18} strokeWidth={2} />
                  CALL 108 AMBULANCE
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className="np-btn"
                    style={{ flex: 1, border: '2px solid var(--emergency)', color: 'var(--emergency)', background: 'transparent', padding: '1rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setIsSOSOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--emergency)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--emergency)'; }}
                  >
                    <ShieldCheck size={16} strokeWidth={2} />
                    112 POLICE
                  </button>
                  <button
                    className="np-btn"
                    style={{ flex: 1, border: '2px solid var(--emergency)', color: 'var(--emergency)', background: 'transparent', padding: '1rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setIsBloodOpen(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--emergency)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--emergency)'; }}
                  >
                    <Droplet size={16} strokeWidth={2} />
                    FIND BLOOD
                  </button>
                </div>
              </div>
              </div>
            </div>

            {/* Right: Compact info panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--mutedForeground)', borderBottom: '1px solid var(--borderLight)', paddingBottom: '1rem', letterSpacing: '0.05em' }}>
                NATIONAL HEALTH HELPLINES
              </h3>
              
              {[
                { num: '108', title: 'Medical Emergency', desc: 'Free ambulance transport · 24×7', icon: <AlertTriangle size={20} /> },
                { num: '104', title: 'Health Helpline', desc: 'Medical advice & guidance', icon: <Stethoscope size={20} /> },
                { num: '1075', title: 'Disease Control', desc: 'National outbreak response', icon: <Activity size={20} /> },
                { num: '181', title: 'Women Helpline', desc: 'Support & counselling', icon: <Users size={20} /> }
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--borderLight)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--background)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {h.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>{h.num}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)' }}>{h.title}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)' }}>{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
