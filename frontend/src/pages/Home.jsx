import React from 'react';
import { MapPin, Phone, ShieldCheck, Navigation, Lock } from 'lucide-react';
import NewsTicker from '../components/NewsTicker';
import { useNavigate } from 'react-router-dom';

export default function Home({ setIsNearbyOpen, setIsBloodOpen }) {
  const navigate = useNavigate();

  return (
    <>
      {/* ---------------- TICKER ---------------- */}
      <NewsTicker
        items={[
          'National Rural Health Mission · 108 Ambulance available 24×7',
          'Blood availability now updated live across 740+ districts',
          'New: ASHA workers can register patients offline — auto-sync enabled',
          'Government health helpline 104 · Maternal care 181',
          'District outbreak surveillance updated every 15 minutes',
        ]}
      />

      {/* ---------------- HERO ---------------- */}
      <section className="np-hero mobile-py-8" style={{ padding: '6rem 0', background: 'var(--background)' }}>
        <div className="np-container">
          <div className="np-hero-grid mobile-stack">
            {/* LEFT — headline column */}
            <div className="np-hero-left">
              <div>
                <div className="np-hero-headline-row mobile-stack" style={{ borderBottom: '2px solid var(--borderLight)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>GRAMIN AROGYA</span>
                  <span className="np-meta" style={{ color: 'var(--mutedForeground)' }}>· Rural Health Access Network</span>
                </div>

                <h1 className="np-h1" style={{ color: 'var(--foreground)', marginBottom: '1.5rem' }}>
                  Healthcare<br />
                  that reaches<br />
                  every village.
                </h1>

                <div className="np-hero-lede-wrap" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <p className="np-lede" style={{ fontSize: '1.125rem', color: 'var(--mutedForeground)', maxWidth: '480px', lineHeight: 1.6 }}>
                    Connecting citizens, health workers, and doctors on a unified network. Find verified facilities, route critical cases, and preserve care continuity across rural India.
                  </p>
                </div>

                <div className="np-hero-actions mobile-stack" style={{ marginTop: '2.5rem', gap: '1rem', display: 'flex' }}>
                  <button
                    className="np-btn np-btn-primary np-btn-lg mobile-full-width"
                    onClick={() => setIsNearbyOpen(true)}
                  >
                    <MapPin size={18} strokeWidth={2} />
                    Find Healthcare
                  </button>
                  <button
                    className="np-btn np-btn-outline np-btn-lg mobile-full-width"
                    onClick={() => setIsBloodOpen(true)}
                    style={{ borderColor: 'var(--emergency)', color: 'var(--emergency)' }}
                  >
                    <Phone size={18} strokeWidth={2} />
                    Emergency Help
                  </button>
                </div>
                
                <div className="np-trust-strip mobile-stack" style={{ marginTop: '4rem', borderBottom: 'none' }}>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <ShieldCheck size={16} strokeWidth={2} />
                    Verified facilities
                  </div>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <Navigation size={16} strokeWidth={2} />
                    Live GPS routing
                  </div>
                  <div className="np-trust-strip-item" style={{ color: 'var(--mutedForeground)' }}>
                    <Lock size={16} strokeWidth={2} />
                    Privacy-first
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — premium photo visual */}
            <div className="np-hero-right" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px', aspectRatio: '4/5', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 50px rgba(8, 63, 61, 0.12)' }}>
                <img src="/images/hero_rural_care_1789832838181.jpg" alt="Doctor consulting patient in a rural clinic" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8, 63, 61, 0.3), transparent 50%)', pointerEvents: 'none' }}></div>
                
                {/* Embedded Status indicator */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }}></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>NETWORK ACTIVE</span>
                </div>
              </div>
              
              {/* Floating Status Card overlapping the image */}
              <div style={{ position: 'absolute', bottom: '2rem', left: '-2rem', background: 'var(--card)', border: '1px solid var(--borderLight)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 12px 30px rgba(8, 63, 61, 0.15)', display: 'flex', alignItems: 'center', gap: '1rem', width: '280px' }}>
                <div style={{ width: 48, height: 48, background: 'var(--primary)', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={20} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>1,402+</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', marginTop: '0.25rem' }}>Verified Rural Facilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
