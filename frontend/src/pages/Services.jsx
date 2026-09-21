import React from 'react';
import { MapPin, Droplet, AlertTriangle, FileText, Syringe, ArrowRight, ShieldCheck, Lock, Activity, Users } from 'lucide-react';

export default function Services({ setIsNearbyOpen, setIsBloodOpen, setIsSOSOpen }) {
  const servicesList = [
    {
      key: 'featured',
      icon: <MapPin size={22} strokeWidth={1.5} />,
      title: 'Find Verified Hospitals Near You',
      desc: 'Locate hospitals, PHCs, CHCs and emergency clinics using live GPS. View routes, contact numbers, availability and specialities before you travel — works across every district.',
      action: 'Search facilities',
      onClick: () => setIsNearbyOpen(true),
    },
    {
      key: 'blood',
      icon: <Droplet size={20} strokeWidth={1.5} />,
      title: 'Emergency Blood & Donor Finder',
      desc: 'Locate blood banks, active donors and donation NGOs by blood group in real time.',
      action: 'Find donors',
      onClick: () => setIsBloodOpen(true),
    },
    {
      key: 'sos',
      icon: <AlertTriangle size={20} strokeWidth={1.5} />,
      title: '108 Emergency SOS',
      desc: 'One-tap ambulance dispatch, live location sharing and hospital pre-alerting.',
      action: 'Activate SOS',
      onClick: () => setIsSOSOpen(true),
      emergency: true,
    },
    {
      key: 'programs',
      icon: <FileText size={20} strokeWidth={1.5} />,
      title: 'Government Health Programs',
      desc: 'Eligibility and enrolment for NHM schemes, insurance and maternal care.',
      action: 'View programs',
      onClick: () => {},
    },
    {
      key: 'preventive',
      icon: <Syringe size={20} strokeWidth={1.5} />,
      title: 'Preventive Care & Vaccination',
      desc: 'Immunisation schedules, screenings and preventive health reminders.',
      action: 'Learn more',
      onClick: () => {},
    },
  ];

  return (
    <>
      {/* ---------------- SERVICES ---------------- */}
      <section className="np-section np-texture" id="services">
        <div className="np-container">
          <div className="np-section-head">
            <div className="np-section-title-wrap">
              <div className="np-section-num"></div>
              <h2 className="np-h2">What we provide</h2>
            </div>
            <p className="np-lede np-section-lede">
              From locating the nearest verified facility to handling critical
              emergencies and connecting families with public health programs —
              every service is designed around rural realities.
            </p>
          </div>

          <div className="np-services mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '3.5rem' }}>
            {servicesList.map((s, i) => {
              const isFeatured = s.key === 'featured';
              const isEmergency = s.emergency;
              
              if (isFeatured) {
                return (
                  <button
                    key={s.key}
                    type="button"
                    className="mobile-grid-1"
                    onClick={s.onClick}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                      background: 'var(--primary)',
                      border: `1px solid var(--primary)`,
                      cursor: 'pointer',
                      gridColumn: '1 / -1',
                      boxShadow: '0 4px 20px rgba(8, 63, 61, 0.04)',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden',
                      borderRadius: '24px',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(8, 63, 61, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(8, 63, 61, 0.04)';
                    }}
                  >
                    <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ width: 56, height: 56, background: 'rgba(255, 255, 255, 0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', borderRadius: '12px' }}>
                        {React.cloneElement(s.icon, { size: 28, strokeWidth: 1.5 })}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', lineHeight: 1.1 }}>
                        {s.title}
                      </h3>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', lineHeight: 1.6, color: '#E6EDE9', marginBottom: '2.5rem' }}>
                        {s.desc}
                      </p>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginTop: 'auto' }}>
                        {s.action} <ArrowRight size={16} strokeWidth={2} />
                      </span>
                    </div>
                    <div style={{ height: '100%', minHeight: '350px', width: '100%', position: 'relative' }}>
                       <img src="/images/services_asha_worker_1789832864445.jpg" alt="ASHA worker interacting with family" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </button>
                );
              }

              let bg = 'var(--card)';
              let borderColor = 'var(--borderLight)';
              let iconBg = 'var(--background)';
              let iconColor = 'var(--primary)';
              
              if (isEmergency) {
                bg = '#FEF2F2';
                borderColor = '#FCA5A5';
                iconBg = 'var(--emergency)';
                iconColor = '#fff';
              }

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={s.onClick}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    background: bg,
                    border: `1px solid ${borderColor}`,
                    padding: '2.5rem',
                    cursor: 'pointer',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(8, 63, 61, 0.04)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(8, 63, 61, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(8, 63, 61, 0.04)';
                  }}
                >
                  <div style={{ 
                    width: 56, height: 56, background: iconBg, color: iconColor, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
                    border: isEmergency ? 'none' : '1px solid var(--borderLight)',
                    borderRadius: '12px'
                  }}>
                    {React.cloneElement(s.icon, { size: 28, strokeWidth: 1.5 })}
                  </div>
                  
                  <h3 style={{ 
                    fontFamily: 'var(--font-display)', fontSize: '1.5rem', 
                    fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.75rem', lineHeight: 1.2
                  }}>
                    {s.title}
                  </h3>
                  
                  <p style={{ 
                    fontFamily: 'var(--font-body)', fontSize: '1rem', lineHeight: 1.6, 
                    color: 'var(--mutedForeground)', marginBottom: '2.5rem', flexGrow: 1
                  }}>
                    {s.desc}
                  </p>
                  
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', 
                    color: isEmergency ? 'var(--emergency)' : 'var(--primary)',
                    marginTop: 'auto'
                  }}>
                    {s.action} <ArrowRight size={16} strokeWidth={2} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* ---------------- TRUST ---------------- */}
      <section className="np-section np-texture">
        <div className="np-container">
          <div className="np-section-head">
            <div className="np-section-title-wrap">
              <h2 className="np-h2">Built on trust</h2>
            </div>
            <p className="np-lede np-section-lede">
              Every layer of the platform prioritises safety, privacy and
              accountability — from verified facilities to secure data handling.
            </p>
          </div>

          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
            {[
              { icon: <ShieldCheck size={24} strokeWidth={1.5} />, title: 'Verified Network', desc: 'All hospitals and PHCs are cross-verified with national health registries.', meta: 'GOVT. APPROVED' },
              { icon: <Lock size={24} strokeWidth={1.5} />, title: 'Data Security', desc: 'End-to-end encryption for all patient records and rural triage data.', meta: 'ABDM COMPLIANT' },
              { icon: <Activity size={24} strokeWidth={1.5} />, title: 'Offline Reliability', desc: 'Health workers can record vitals securely without internet access.', meta: 'ZERO DATA LOSS' },
              { icon: <Users size={24} strokeWidth={1.5} />, title: 'Universal Access', desc: 'Available in multiple regional languages with screen reader support.', meta: 'WCAG 2.1 AA' }
            ].map((t, i) => (
              <div key={i} style={{ 
                background: 'var(--card)', border: '1px solid var(--borderLight)', padding: '2.5rem 2rem', 
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                boxShadow: '0 4px 20px rgba(8, 63, 61, 0.03)', transition: 'transform 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: 48, height: 48, background: 'var(--muted)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  {t.icon}
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.75rem' }}>{t.title}</h4>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--mutedForeground)', flex: 1, marginBottom: '2rem' }}>{t.desc}</p>
                
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em', borderTop: '1px solid var(--borderLight)', paddingTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 6, height: 6, background: 'var(--primary)' }}></div>
                  {t.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
