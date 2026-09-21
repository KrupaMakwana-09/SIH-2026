import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Articles() {
  const articles = [
    { 
      title: 'Maternal & child health: a complete rural care pathway', 
      desc: 'Antenatal checkups, institutional delivery, immunisation and post-natal follow-up — mapped to the national health programs available at your nearest facility.',
      label: 'MATERNAL CARE',
      img: '/images/maternal_child_care.jpg',
      slug: 'maternal-child-health'
    },
    { 
      title: 'Ayushman Bharat — eligibility & enrolment guide', 
      desc: 'Learn how to check your family\'s eligibility for the PMJAY health insurance scheme and understand the cashless treatment process at empanelled hospitals.',
      label: 'GOVERNMENT SCHEME',
      img: '/images/ayushman_bharat.jpg',
      slug: 'ayushman-bharat'
    },
    { 
      title: 'Child immunisation schedule explained', 
      desc: 'A comprehensive timeline for your child\'s vaccinations, including BCG, Polio, and Measles, as recommended by the National Health Mission.',
      label: 'PREVENTIVE CARE',
      img: '/images/child_immunisation.jpg',
      slug: 'child-immunisation'
    },
    { 
      title: 'Tele-MANAS: Free mental health support', 
      desc: 'A comprehensive guide on accessing the National Tele Mental Health Programme (14416) for anonymous counseling and psychiatric support.',
      label: 'MENTAL HEALTH',
      img: '/images/tele_manas_mental_health.jpg',
      slug: 'tele-manas-mental-health'
    },
    { 
      title: 'Snakebite emergencies: Do\'s and Don\'ts', 
      desc: 'Critical first-aid protocols, recognizing venomous bites, and locating the nearest Anti-Snake Venom (ASV) equipped health facility.',
      label: 'EMERGENCY FIRST AID',
      img: '/images/snakebite_first_aid.jpg',
      slug: 'snakebite-first-aid'
    },
    { 
      title: 'Combating Anaemia: The Anaemia Mukt Bharat strategy', 
      desc: 'Understanding the 6x6x6 strategy to tackle anaemia in rural India, including free Iron and Folic Acid (IFA) supplementation details.',
      label: 'NUTRITION',
      img: '/images/combating_anaemia.jpg',
      slug: 'combating-anaemia'
    }
  ];

  return (
    <>
      <section className="np-section np-texture" id="articles" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <div className="np-container">
          <div className="np-section-head">
            <div className="np-section-title-wrap">
              <h2 className="np-h2">Health Articles & Reading Hub</h2>
            </div>
            <p className="np-lede np-section-lede">
              Curated health education, first-aid protocols, and government program details to help rural families make informed decisions.
            </p>
          </div>

          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginTop: '3.5rem' }}>
            {articles.map((r, i) => (
              <Link 
                to={`/articles/${r.slug}`} 
                key={i} 
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: 'var(--card)', border: '1px solid var(--borderLight)', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(8, 63, 61, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Thumbnail */}
                <div style={{ height: '240px', background: 'var(--muted)', borderBottom: '1px solid var(--borderLight)', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={r.img} 
                    alt={r.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} 
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{
                    position: 'absolute', top: '16px', left: '16px',
                    fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
                    color: '#fff', background: 'var(--primary)', padding: '5px 12px',
                    letterSpacing: '0.05em', borderRadius: '6px'
                  }}>
                    {r.label}
                  </div>
                </div>
                
                {/* Content */}
                <div style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.3 }}>
                    {r.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', lineHeight: 1.6, flex: 1, marginBottom: '2.5rem' }}>
                    {r.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginTop: 'auto' }}>
                    Read article <ArrowRight size={16} strokeWidth={2} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Ornamental divider */}
          <div className="np-ornament" aria-hidden="true" style={{ marginTop: '4rem' }}>
            &#x2727; &#x2727; &#x2727;
          </div>
        </div>
      </section>
    </>
  );
}
