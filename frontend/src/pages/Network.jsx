import React from 'react';
import { 
  Users, HeartPulse, Stethoscope, Building2, ShieldCheck, 
  ArrowRight, FileText, Activity, Droplet, Ambulance, Phone, Globe, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Network() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ 
        position: 'relative', 
        minHeight: '85vh', 
        display: 'flex', 
        alignItems: 'center', 
        paddingTop: '80px',
        background: ' #0F2524',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img 
            src="/images/network_hero_1789908555308.jpg" 
            alt="Rural Healthcare Network India" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} 
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(11, 107, 104, 0.95) 0%, rgba(11, 107, 104, 0.7) 50%, rgba(11, 107, 104, 0.2) 100%)' }}></div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--background) 0%, transparent 20%)' }}></div>
        </div>

        <div className="np-container" style={{ position: 'relative', zIndex: 10, maxWidth: '1400px' }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={{ 
              display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '100px', color: '#fff', fontFamily: 'var(--font-mono)', 
              fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem'
            }}>
              A UNIFIED DIGITAL ECOSYSTEM
            </div>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 5vw, 4.5rem)', 
              fontWeight: 700, color: '#ffffff', lineHeight: 1.1, marginBottom: '1.5rem',
              textShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
              Connecting rural communities to definitive care.
            </h1>
            <p style={{ 
              fontFamily: 'var(--font-body)', fontSize: 'clamp(1.125rem, 2vw, 1.25rem)', 
              color: '#E6EDE9', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '650px',
              textShadow: '0 2px 12px rgba(0,0,0,0.1)'
            }}>
              GraminArogya bridges the gap between citizens, ASHA workers, doctors, hospitals, and government health systems—ensuring no patient falls through the cracks of the rural healthcare infrastructure.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/find-care" style={{ textDecoration: 'none' }}>
                <button style={{ 
                  padding: '1rem 2rem', background: '#fff', color: 'var(--primary)',
                  border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.9375rem',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }}>
                  Find Care in the Network <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW THE NETWORK CONNECTS (INTERACTIVE-STYLE GRAPH) */}
      <section style={{ padding: '8rem 0', background: 'var(--background)' }}>
        <div className="np-container" style={{ maxWidth: '1400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem', maxWidth: '800px', margin: '0 auto 5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
              How the Network Connects
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--mutedForeground)', lineHeight: 1.6 }}>
              A seamless flow of health records, referrals, and resources across five critical tiers of the Indian healthcare system.
            </p>
          </div>

          <div className="mobile-grid-1" style={{ 
            position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', alignItems: 'flex-start'
          }}>
            {/* Connecting Line (Desktop) */}
            <div className="mobile-hidden" style={{ 
              position: 'absolute', top: '48px', left: '10%', right: '10%', height: '2px', 
              background: 'linear-gradient(90deg, rgba(11, 107, 104, 0.1), rgba(11, 107, 104, 0.5), rgba(11, 107, 104, 0.1))', 
              zIndex: 0 
            }}></div>

            {[
              { id: 1, title: 'Citizens', icon: <Users size={32} />, color: '#0B6B68', desc: 'Rural patients seeking care or emergency aid.' },
              { id: 2, title: 'ASHA Workers', icon: <HeartPulse size={32} />, color: '#E7A63B', desc: 'First responders providing primary screening & triage.' },
              { id: 3, title: 'Doctors & Specialists', icon: <Stethoscope size={32} />, color: '#0B6B68', desc: 'Tele-consultations and clinical diagnosis.' },
              { id: 4, title: 'PHCs & Hospitals', icon: <Building2 size={32} />, color: '#E7A63B', desc: 'Definitive treatment and inpatient care facilities.' },
              { id: 5, title: 'Gov. Health Systems', icon: <Globe size={32} />, color: '#0B6B68', desc: 'District administration and public health monitoring.' },
            ].map((node) => (
              <div key={node.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ 
                  width: '96px', height: '96px', background: '#fff', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${node.color}`, color: node.color,
                  boxShadow: '0 12px 24px rgba(11, 107, 104, 0.08)', marginBottom: '1.5rem',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(11, 107, 104, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(11, 107, 104, 0.08)';
                }}
                >
                  {node.icon}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  TIER {node.id}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.75rem' }}>
                  {node.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', lineHeight: 1.5 }}>
                  {node.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. THE CARE JOURNEY (DETAILED SECTIONS) */}
      <section style={{ padding: '6rem 0', background: '#fff', borderTop: '1px solid var(--borderLight)' }}>
        <div className="np-container" style={{ maxWidth: '1400px' }}>
          
          <div style={{ marginBottom: '6rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
              The Care Journey
            </h2>
            <div style={{ width: '80px', height: '4px', background: 'var(--accent)', borderRadius: '2px' }}></div>
          </div>

          {/* Journey Step 1 */}
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '8rem' }}>
            <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 50px rgba(11, 107, 104, 0.1)', aspectRatio: '4/3' }}>
              <img src="/images/network_asha_1789908573661.jpg" alt="ASHA Worker with digital tablet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'var(--primary)', color: '#fff', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <HeartPulse size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Community Health Workers
              </h3>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                The First Line of Care
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--mutedForeground)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Accredited Social Health Activists (ASHAs) and Auxillary Nurse Midwives (ANMs) form the bedrock of the GraminArogya network. Equipped with the GraminArogya digital tablet interface, they conduct door-to-door screenings, digitize patient vitals, and initiate the care triage process.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Digital patient registration (ABHA integrated)',
                  'Maternal and child health tracking',
                  'Non-Communicable Disease (NCD) screening',
                  'Direct escalation to remote doctors'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--foreground)' }}>
                    <ShieldCheck size={20} color="var(--accent)" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Journey Step 2 */}
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '8rem' }}>
            <div style={{ order: 2 }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 50px rgba(11, 107, 104, 0.1)', aspectRatio: '4/3' }}>
                <img src="/images/network_doctor_1789908597936.jpg" alt="Doctor consulting rural patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ order: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'var(--primary)', color: '#fff', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <Stethoscope size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Doctors & Tele-consultation
              </h3>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                Bringing Specialists to the Doorstep
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--mutedForeground)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                When ASHA workers encounter complex cases, the platform instantly routes the patient's digital records to the nearest available Medical Officer. Doctors can review symptoms remotely, prescribe medication digitally, or issue formal referrals to secondary facilities.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Secure access to patient history',
                  'E-prescriptions and lab requisition',
                  'Smart Referral Hub coordination',
                  'Integration with Ayushman Arogya Mandirs'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--foreground)' }}>
                    <ShieldCheck size={20} color="var(--accent)" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Journey Step 3 */}
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', marginBottom: '4rem' }}>
            <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 50px rgba(11, 107, 104, 0.1)', aspectRatio: '4/3' }}>
              <img src="/images/network_emergency_1789908619871.jpg" alt="108 Emergency Ambulance at Rural Hospital" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'var(--emergency)', color: '#fff', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <Ambulance size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Emergency & Escalation
              </h3>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 600, color: 'var(--emergency)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                Rapid Response Coordination
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--mutedForeground)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                In critical scenarios, GraminArogya's SOS system coordinates seamlessly with the 108 Ambulance service and local blood banks. GPS-enabled routing ensures patients are transported to the nearest capable Community Health Centre (CHC) or District Hospital without delay.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  'Live SOS triggers for 108 Ambulance dispatch',
                  'Real-time blood availability tracking',
                  'Prioritized routing for maternal emergencies',
                  'Pre-arrival alerts to hospital casualty wards'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--foreground)' }}>
                    <ShieldCheck size={20} color="var(--emergency)" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 4. DIGITAL HEALTH RECORDS & GOV INTEGRATION */}
      <section style={{ padding: '6rem 0', background: 'var(--muted)' }}>
        <div className="np-container" style={{ maxWidth: '1400px' }}>
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            
            {/* ABHA Integration */}
            <div style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <FileText size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Unified Digital Records
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Fully compliant with the Ayushman Bharat Digital Mission (ABDM). Patient records are securely stored, ensuring continuity of care whether the patient visits a village clinic or a district hospital.
              </p>
            </div>

            {/* Infrastructure Facts */}
            <div style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Building2 size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Healthcare Facilities
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Our network maps directly to the national rural infrastructure, spanning Sub-Centres, Primary Health Centres (PHCs), and Community Health Centres (CHCs).
              </p>
              <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.75rem', background: 'var(--muted)', borderRadius: '8px' }}>
                India has over 1.6 lakh Ayushman Arogya Mandirs providing Comprehensive Primary Health Care. <br/>
                <a href="https://mohfw.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginTop: '0.5rem', display: 'inline-block' }}>Source: MoHFW</a>
              </div>
            </div>

            {/* NHM Stats */}
            <div style={{ background: '#fff', padding: '3rem 2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Globe size={40} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem' }}>
                Government Integration
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Built to augment the National Health Mission (NHM). Dashboards provide District Medical Officers with real-time epidemiological data and resource tracking.
              </p>
              <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.75rem', background: 'var(--muted)', borderRadius: '8px' }}>
                Over 1 million ASHA workers serve as the critical link between the community and the public health system. <br/>
                <a href="https://nhm.gov.in" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', marginTop: '0.5rem', display: 'inline-block' }}>Source: NHM</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section style={{ padding: '8rem 0', background: 'var(--primary)', textAlign: 'center' }}>
        <div className="np-container" style={{ maxWidth: '800px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Access the network today.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: '#E6EDE9', lineHeight: 1.6, marginBottom: '3rem' }}>
            Whether you are looking for a nearby doctor, need emergency blood, or want to register as a rural patient, the GraminArogya network is here for you.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/find-care" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '1rem 2rem', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '1rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 8px 24px rgba(231, 166, 59, 0.3)', transition: 'transform 0.2s'
              }}>
                Find Care Near You <ChevronRight size={20} />
              </button>
            </Link>
            <Link to="/sign-in" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '1rem 2rem', background: 'transparent', color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '1rem',
                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'background 0.2s, border-color 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
              >
                Register as Patient
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
