import React from 'react';
import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  const cols = [
    {
      title: 'Health Services',
      links: ['Find Nearby Hospitals', 'Emergency Blood Finder', '108 Ambulance', 'Health Programs', 'Preventive Care'],
    },
    {
      title: 'For Workers',
      links: ['ASHA Portal', 'Doctor Desk', 'Smart Routing', 'Referral Hub', 'Government Dashboard'],
    },
    {
      title: 'Resources',
      links: ['Health Education', 'Government Schemes', 'Accessibility', 'Contact Support', 'Help Centre'],
    },
  ];
  
  return (
    <footer style={{ background: 'var(--background)', borderTop: '1px solid var(--borderLight)', padding: '5rem 0 2rem 0', color: 'var(--foreground)' }}>
      <div className="np-container">
        
        {/* Main Footer Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', marginBottom: '4rem' }}>
          
          {/* Brand & Mission Column */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, background: 'var(--primary)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>GA</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>GraminArogya</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--mutedForeground)', letterSpacing: '0.05em' }}>RURAL HEALTH NETWORK</div>
              </div>
            </div>
            
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', lineHeight: 1.6, maxWidth: '400px' }}>
              A public healthcare platform connecting citizens, frontline health workers, clinicians, and district administration through a single coordinated care network.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Emergency block in footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#FEF2F2', padding: '1rem 1.5rem', border: '1px solid #FCA5A5' }}>
                <Phone size={20} color="var(--emergency)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--emergency)' }}>EMERGENCY DISPATCH</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#18312F' }}>108</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Columns Wrapper */}
          <div style={{ flex: '2 1 500px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem' }}>
            {cols.map((col) => (
              <div key={col.title}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.05em', marginBottom: '1.5rem', borderBottom: '1px solid var(--borderLight)', paddingBottom: '0.75rem' }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {col.links.map((l) => (
                    <li key={l}>
                      {l === 'Contact Support' ? (
                        <Link to="/contact" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', textDecoration: 'none', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mutedForeground)'}
                        >
                          {l}
                        </Link>
                      ) : (
                        <a href="#" onClick={(e) => e.preventDefault()} style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', textDecoration: 'none', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mutedForeground)'}
                        >
                          {l}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--borderLight)', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)' }}>
            © {new Date().getFullYear()} GraminArogya · National Health Mission
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Privacy Policy', 'Terms of Service', 'Accessibility', 'RTI'].map((link) => (
              <a key={link} href="#" onClick={(e) => e.preventDefault()} style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mutedForeground)'}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
