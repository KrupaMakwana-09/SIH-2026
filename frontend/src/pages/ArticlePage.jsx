import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, BookOpen } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ARTICLE DATA — Full content for each resource article
   ═══════════════════════════════════════════════════════════════════════════ */
const ARTICLES = {
  'maternal-child-health': {
    title: 'Maternal & child health: a complete rural care pathway',
    label: 'MATERNAL CARE',
    img: '/images/maternal_child_care.jpg',
    author: 'Dr. Priya Sharma, MD (Obstetrics)',
    date: 'September 15, 2026',
    readTime: '8 min read',
    content: [
      {
        heading: 'Why maternal care matters in rural India',
        text: 'India accounts for nearly 12% of global maternal deaths, with a disproportionate burden falling on rural communities. The National Health Mission (NHM) has identified safe motherhood as a top priority, establishing a continuum of care from pregnancy detection through post-natal follow-up. Every pregnant woman in rural India is entitled to free antenatal checkups, institutional delivery, and post-natal care under the Janani Suraksha Yojana (JSY) and Janani Shishu Suraksha Karyakram (JSSK).'
      },
      {
        heading: 'Antenatal care (ANC): The first 9 months',
        text: 'The Government of India recommends at least four ANC visits during pregnancy. During these visits, the expecting mother receives: (1) Blood pressure monitoring and weight tracking, (2) Haemoglobin testing to detect anaemia, (3) Urine tests for infection and pre-eclampsia screening, (4) Ultrasound examination at 18-20 weeks, (5) Tetanus toxoid (TT) vaccination, (6) Iron and folic acid supplementation (IFA tablets). ASHA workers play a critical role in ensuring pregnant women in villages register early and attend all scheduled ANC visits at the nearest Sub-Centre or Primary Health Centre (PHC).'
      },
      {
        heading: 'Institutional delivery under JSSK',
        text: 'The JSSK scheme guarantees completely free delivery services at government health facilities, including: free drugs and consumables, free diet during the stay (up to 3 days for normal delivery, 7 days for caesarean), free diagnostics, free blood transfusion if required, and free transport from home to facility and back. The scheme covers both the mother and sick newborns up to 30 days after birth. Families should carry their Mother and Child Protection (MCP) card and Aadhaar for seamless cashless treatment.'
      },
      {
        heading: 'Post-natal care and newborn health',
        text: 'After delivery, the mother and baby should receive at least three post-natal home visits by the ASHA worker — on Day 3, Day 7, and Day 42. Key aspects monitored include: breastfeeding initiation within 1 hour of birth, exclusive breastfeeding for the first 6 months, umbilical cord care, thermal care (kangaroo mother care for low birth weight babies), immunisation starting with BCG and OPV-0 at birth, and maternal mental health screening for post-partum depression.'
      },
      {
        heading: 'Immunisation schedule for infants',
        text: 'The Universal Immunisation Programme (UIP) provides free vaccines to all children. The schedule includes: Birth — BCG, OPV-0, Hepatitis B (birth dose); 6 weeks — OPV-1, Pentavalent-1, Rotavirus-1, fIPV-1, PCV-1; 10 weeks — OPV-2, Pentavalent-2, Rotavirus-2; 14 weeks — OPV-3, Pentavalent-3, Rotavirus-3, fIPV-2, PCV-2; 9 months — MR-1, JE-1, PCV Booster; 16-24 months — DPT Booster-1, MR-2, OPV Booster, JE-2. All vaccines are available free at government health facilities and during Village Health & Nutrition Days (VHNDs).'
      },
      {
        heading: 'How to access these services',
        text: 'Contact your local ASHA worker or dial 104 (Health Helpline) to register your pregnancy and begin receiving benefits. The GraminArogya platform can help you locate your nearest PHC or Community Health Centre (CHC) with delivery facilities. Always carry your MCP card, Aadhaar card, and bank passbook (for JSY cash incentive of ₹1,400 for rural institutional deliveries).'
      }
    ]
  },
  'ayushman-bharat': {
    title: 'Ayushman Bharat — eligibility & enrolment guide',
    label: 'GOVERNMENT SCHEME',
    img: '/images/ayushman_bharat.jpg',
    author: 'National Health Authority (NHA)',
    date: 'September 10, 2026',
    readTime: '10 min read',
    content: [
      {
        heading: 'What is Ayushman Bharat PM-JAY?',
        text: 'Pradhan Mantri Jan Arogya Yojana (PM-JAY) is the world\'s largest government-funded health insurance scheme, providing coverage of up to ₹5 lakh per family per year for secondary and tertiary hospitalisation. Launched on September 23, 2018, the scheme covers over 55 crore beneficiaries (approximately 12 crore families) across India. It covers 1,949 medical procedures including surgeries, medical treatments, and day care procedures across 27 specialities.'
      },
      {
        heading: 'Who is eligible?',
        text: 'Eligibility is based on the Socio-Economic Caste Census (SECC) 2011 data. In rural areas, families are automatically eligible if they meet any of these criteria: (1) Only one room with kutcha walls and roof, (2) No adult member aged 16-59, (3) Female-headed household with no adult male member aged 16-59, (4) Household with a disabled member and no able-bodied adult, (5) SC/ST households, (6) Landless households deriving income from manual casual labour, (7) Households without shelter, destitute, living on alms, manual scavengers, primitive tribal groups, or legally released bonded labour.'
      },
      {
        heading: 'How to check your eligibility',
        text: 'You can check eligibility through multiple channels: (1) Visit mera.pmjay.gov.in and enter your mobile number or ration card number, (2) Call the PM-JAY helpline at 14555, (3) Visit your nearest Common Service Centre (CSC) or Ayushman Mitra at an empanelled hospital, (4) Visit the District Implementation Unit (DIU). You will need your Aadhaar card, ration card, or any government-issued ID for verification.'
      },
      {
        heading: 'How to get your Ayushman Card',
        text: 'Once verified as eligible, you can get your Ayushman Card (e-card) by: (1) Visiting any empanelled hospital — the Ayushman Mitra at the help desk will assist you, (2) Using the Ayushman App (available on Google Play), (3) Visiting a Common Service Centre with Aadhaar card and one family member\'s photo. The card is issued free of cost. Each family member gets an individual card linked to the family ID.'
      },
      {
        heading: 'How to use PM-JAY for treatment',
        text: 'The process is fully cashless: (1) Visit any PM-JAY empanelled hospital (government or private), (2) Show your Ayushman Card or Aadhaar at the Ayushman Mitra desk, (3) The hospital will verify your identity and check package eligibility, (4) If approved, treatment begins immediately with zero out-of-pocket cost, (5) The hospital claims reimbursement directly from the government. The scheme covers 3 days of pre-hospitalisation and 15 days of post-hospitalisation expenses including diagnostics and medicines.'
      },
      {
        heading: 'Key benefits and coverage',
        text: 'PM-JAY covers: all pre-existing diseases from day one, no cap on family size (all members covered), no age restriction, transport allowance (₹150 per hospitalisation), and treatment at any empanelled hospital across India (portability). The scheme does NOT cover: OPD consultations, cosmetic procedures, organ transplants, fertility treatments, or individual health insurance top-ups. For the complete list of empanelled hospitals near you, use the GraminArogya "Find Care" feature.'
      }
    ]
  },
  'child-immunisation': {
    title: 'Child immunisation schedule explained',
    label: 'PREVENTIVE CARE',
    img: '/images/child_immunisation.jpg',
    author: 'Dr. Rajesh Patel, Paediatrician',
    date: 'September 5, 2026',
    readTime: '7 min read',
    content: [
      {
        heading: 'Why immunisation is critical',
        text: 'Immunisation prevents an estimated 2-3 million deaths every year worldwide. India\'s Universal Immunisation Programme (UIP) is one of the largest in the world, targeting approximately 2.67 crore newborns and 2.9 crore pregnant women annually. Despite tremendous progress, India still has approximately 38 lakh children who miss out on full immunisation each year. The Mission Indradhanush and Intensified Mission Indradhanush (IMI) campaigns specifically target these left-out and drop-out children.'
      },
      {
        heading: 'The complete vaccination schedule',
        text: 'At Birth: BCG (tuberculosis), OPV-0 (polio), Hepatitis B (birth dose). At 6 Weeks: OPV-1, Pentavalent-1 (diphtheria, pertussis, tetanus, hepatitis B, Hib), Rotavirus-1, fIPV-1 (injectable polio), PCV-1 (pneumococcal). At 10 Weeks: OPV-2, Pentavalent-2, Rotavirus-2. At 14 Weeks: OPV-3, Pentavalent-3, Rotavirus-3, fIPV-2, PCV-2. At 9 Months: MR-1 (measles-rubella), JE-1 (Japanese Encephalitis, in endemic districts), PCV Booster. At 16-24 Months: DPT Booster-1, MR-2, OPV Booster, JE-2. At 5-6 Years: DPT Booster-2. At 10 Years: TT (tetanus toxoid). At 16 Years: TT Booster.'
      },
      {
        heading: 'Where to get vaccines',
        text: 'All vaccines under UIP are provided FREE of cost at: (1) Government hospitals and PHCs, (2) Sub-Centres during fixed immunisation sessions, (3) Village Health and Nutrition Days (VHNDs) — usually held once a month at the Anganwadi centre, (4) Special outreach sessions in hard-to-reach areas, (5) During Mission Indradhanush campaign rounds. Your ASHA worker will remind you about upcoming vaccination dates and accompany you to the session site if needed.'
      },
      {
        heading: 'What to bring and expect',
        text: 'Carry your child\'s Mother and Child Protection (MCP) Card to every vaccination session. The vaccinator will: verify the child\'s age and previous vaccination history, administer the appropriate vaccine(s), record the vaccination on the MCP card, inform you about the next due date, and monitor for any immediate adverse reactions (the child should wait at the centre for 30 minutes after vaccination). Common mild side effects include low-grade fever, mild swelling at the injection site, and irritability — these are normal and resolve within 1-2 days.'
      },
      {
        heading: 'Catch-up vaccination',
        text: 'If your child has missed any scheduled vaccine, don\'t worry — it\'s never too late to catch up. Contact your nearest health facility or ASHA worker to create a catch-up schedule. The key principle is: there is no need to restart a vaccine series if doses were delayed; simply continue from where you left off. Mission Indradhanush campaigns are specifically designed to cover children who have been left out of routine immunisation.'
      },
      {
        heading: 'New vaccines added to UIP',
        text: 'In recent years, India has added several new vaccines: Rotavirus vaccine (2016) — protects against the leading cause of severe diarrhoea in children. Pneumococcal Conjugate Vaccine/PCV (2017) — protects against pneumonia, the leading killer of children under 5. Measles-Rubella vaccine (2017) — replaced the standalone measles vaccine to also protect against rubella (which causes birth defects). These additions have significantly strengthened India\'s child health protection framework.'
      }
    ]
  },
  'tele-manas-mental-health': {
    title: 'Tele-MANAS: Free mental health support',
    label: 'MENTAL HEALTH',
    img: '/images/tele_manas_mental_health.jpg',
    author: 'Tele-MANAS Initiative',
    date: 'October 10, 2026',
    readTime: '5 min read',
    content: [
      {
        heading: 'What is Tele-MANAS?',
        text: 'The National Tele Mental Health Programme of India (Tele-MANAS) is a free, 24/7 service offering mental health counseling and psychiatric support. You can reach them toll-free at 14416 or 1800-891-4416. It is designed to provide access to mental health care anywhere, especially in rural areas.'
      },
      {
        heading: 'How it works',
        text: 'When you dial the number, you can select your preferred local language. You will first speak to a trained counselor who will listen to your problems, whether it is stress, anxiety, or depression. If necessary, they will connect you to a clinical psychologist or a psychiatrist for a specialized consultation.'
      }
    ]
  },
  'snakebite-first-aid': {
    title: 'Snakebite emergencies: Do\'s and Don\'ts',
    label: 'EMERGENCY FIRST AID',
    img: '/images/snakebite_first_aid.jpg',
    author: 'Dr. Sameer Khan, Emergency Medicine',
    date: 'August 12, 2026',
    readTime: '6 min read',
    content: [
      {
        heading: 'Critical First Steps',
        text: 'If bitten by a snake, DO NOT panic. Panic increases heart rate and spreads venom faster. DO NOT tie a tight tourniquet (rope/cloth) above the bite—this can cause gangrene. DO NOT cut the wound or try to suck out the venom. Immobilize the bitten limb just like a fracture.'
      },
      {
        heading: 'Getting Medical Help',
        text: 'Time is critical. Get to the nearest Primary Health Centre (PHC) or Community Health Centre (CHC) that has Anti-Snake Venom (ASV). Do not waste time with traditional healers. You can use the GraminArogya Emergency module to find the nearest ASV-equipped facility immediately.'
      }
    ]
  },
  'combating-anaemia': {
    title: 'Combating Anaemia: The Anaemia Mukt Bharat strategy',
    label: 'NUTRITION',
    img: '/images/combating_anaemia.jpg',
    author: 'Ministry of Health and Family Welfare',
    date: 'July 25, 2026',
    readTime: '4 min read',
    content: [
      {
        heading: 'The 6x6x6 Strategy',
        text: 'Anaemia Mukt Bharat aims to reduce anaemia among children, adolescents, and women. The strategy focuses on 6 target beneficiary groups, 6 interventions, and 6 institutional mechanisms. It emphasizes the importance of iron and folic acid (IFA) supplementation.'
      },
      {
        heading: 'Nutrition and IFA Tablets',
        text: 'Eat iron-rich local foods like drumstick leaves, jaggery, and spinach. Pregnant women and adolescent girls can receive free IFA tablets from their local ASHA worker or Anganwadi centre. Taking these tablets regularly is crucial for maternal health and preventing stunting in children.'
      }
    ]
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   ARTICLE PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ArticlePage() {
  const { slug } = useParams();
  const article = ARTICLES[slug];

  if (!article) {
    return (
      <section className="np-section" style={{ paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <div className="np-container">
          <h2 className="np-h2">Article not found</h2>
          <p style={{ marginTop: '1rem', color: 'var(--mutedForeground)' }}>
            The article you're looking for doesn't exist.
          </p>
          <Link to="/articles" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Articles
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article style={{ background: 'var(--paper)' }}>
      {/* ── Back Navigation ──────────────────────────────────── */}
      <div className="np-container" style={{ paddingTop: '2rem' }}>
        <Link to="/articles" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600,
          color: 'var(--mutedForeground)', textDecoration: 'none', transition: 'color 0.2s',
          padding: '0.5rem 1rem', border: '1px solid var(--borderLight)', borderRadius: '8px'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--mutedForeground)'}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Back to Articles
        </Link>
      </div>

      {/* ── Hero Cover Image ─────────────────────────────────── */}
      <div className="np-container" style={{ paddingTop: '2rem' }}>
        <div style={{
          width: '100%', height: '420px', borderRadius: '20px', overflow: 'hidden',
          border: '1px solid var(--borderLight)', position: 'relative'
        }}>
          <img src={article.img} alt={article.title} style={{
            width: '100%', height: '100%', objectFit: 'cover'
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
          }} />
          <div style={{
            position: 'absolute', bottom: '20px', left: '24px',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
            color: '#fff', background: 'var(--primary)', padding: '6px 14px',
            letterSpacing: '0.05em', borderRadius: '6px'
          }}>
            {article.label}
          </div>
        </div>
      </div>

      {/* ── Article Header ───────────────────────────────────── */}
      <div className="np-container" style={{ maxWidth: '780px', margin: '0 auto', paddingTop: '3rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2, marginBottom: '1.5rem'
        }}>
          {article.title}
        </h1>

        {/* Meta */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center',
          paddingBottom: '2rem', borderBottom: '1px solid var(--borderLight)',
          fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={14} strokeWidth={2} /> {article.author}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} strokeWidth={2} /> {article.date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} strokeWidth={2} /> {article.readTime}
          </span>
        </div>

        {/* ── Article Body ─────────────────────────────────────── */}
        <div style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
          {article.content.map((section, i) => (
            <div key={i} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 600,
                color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.3
              }}>
                {section.heading}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '1.0625rem',
                color: 'var(--mutedForeground)', lineHeight: 1.8
              }}>
                {section.text}
              </p>
            </div>
          ))}

          {/* Bottom navigation */}
          <div style={{
            borderTop: '1px solid var(--borderLight)', paddingTop: '2.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
          }}>
            <Link to="/articles" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700,
              color: 'var(--primary)', textDecoration: 'none'
            }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
              All Articles
            </Link>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--mutedForeground)'
            }}>
              <BookOpen size={14} /> Published under National Health Mission guidelines
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
