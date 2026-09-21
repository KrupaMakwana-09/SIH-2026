import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, Ambulance, Clock, Send, ShieldAlert, ArrowRight, CheckCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '6rem' }}>
      
      {/* HERO SECTION */}
      <section style={{ 
        paddingTop: '8rem', paddingBottom: '4rem', 
        background: 'var(--primary)', color: '#fff',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Subtle Background Pattern */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.1, 
          background: 'var(--texture-grid)', zIndex: 0 
        }} />
        
        <div className="np-container" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px' }}>
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ 
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
                fontWeight: 700, marginBottom: '1rem', lineHeight: 1.1 
              }}>
                Contact GraminArogya
              </h1>
              <p style={{ 
                fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', 
                color: '#E6EDE9', lineHeight: 1.6, maxWidth: '600px' 
              }}>
                Whether you need general support, have technical questions, or are looking for emergency healthcare coordination, we are here to help.
              </p>
            </div>
            
            <div className="mobile-hidden" style={{ 
              width: '100%', aspectRatio: '16/10', borderRadius: '24px', overflow: 'hidden', 
              boxShadow: '0 24px 50px rgba(0,0,0,0.3)', position: 'relative',
              border: '4px solid rgba(255,255,255,0.1)'
            }}>
              <img 
                src="/images/contact_hero_1789910573658.jpg" 
                alt="Healthcare worker helping patient" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11, 107, 104, 0.2), transparent)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
        <div className="np-container" style={{ maxWidth: '1400px' }}>
          <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: CONTACT FORM */}
            <div style={{ 
              background: '#fff', padding: '3rem', borderRadius: '16px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid var(--borderLight)'
            }}>
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  Send us a message
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', lineHeight: 1.6 }}>
                  Fill out the form below and our support team will get back to you within 24 hours. For medical emergencies, please use the 108 SOS button or call directly.
                </p>
              </div>

              {success ? (
                <div className="fade-in" style={{ 
                  background: '#ECFDF5', border: '1px solid #10B981', borderRadius: '12px', 
                  padding: '3rem 2rem', textAlign: 'center', color: '#064E3B' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle size={48} color="#10B981" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Message Sent Successfully!
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                    Thank you for reaching out to GraminArogya. Our team will contact you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>FULL NAME</label>
                      <input 
                        type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Enter your full name"
                        style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--background)', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>MOBILE NUMBER</label>
                      <input 
                        type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210"
                        style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--background)', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>EMAIL ADDRESS (OPTIONAL)</label>
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@domain.com"
                      style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--background)', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>SUBJECT</label>
                    <select 
                      name="subject" required value={formData.subject} onChange={handleChange}
                      style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--background)', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', color: 'var(--foreground)', appearance: 'none', cursor: 'pointer' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    >
                      <option value="" disabled>Select a topic...</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Account Access">Account & Login Issues</option>
                      <option value="Hospital Coordination">Hospital / PHC Coordination</option>
                      <option value="Feedback">Feedback & Suggestions</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>MESSAGE</label>
                    <textarea 
                      name="message" required value={formData.message} onChange={handleChange} placeholder="How can we help you?" rows={5}
                      style={{ width: '100%', padding: '0.875rem 1rem', background: 'var(--background)', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    />
                  </div>

                  <button
                    type="submit" disabled={loading}
                    style={{
                      padding: '1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', 
                      fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s ease', 
                      opacity: loading ? 0.8 : 1, marginTop: '0.5rem'
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#083F3D')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'var(--primary)')}
                  >
                    {loading ? (
                      <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Send Message <Send size={18} /></>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT COLUMN: CONTACT INFO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Emergency Card */}
              <div style={{ 
                background: '#FEF2F2', padding: '2rem', borderRadius: '16px', 
                border: '1px solid #FCA5A5', position: 'relative', overflow: 'hidden' 
              }}>
                <div style={{ position: 'absolute', top: '-1rem', right: '-1rem', opacity: 0.05, transform: 'rotate(15deg)' }}>
                  <ShieldAlert size={120} color="var(--emergency)" />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, color: 'var(--emergency)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--emergency)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                    MEDICAL EMERGENCIES
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ background: '#FEE2E2', padding: '0.75rem', borderRadius: '50%', color: 'var(--emergency)' }}>
                        <Ambulance size={24} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#991B1B' }}>108</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: '#7F1D1D', marginTop: '0.25rem' }}>National Ambulance Service</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ background: '#FEE2E2', padding: '0.75rem', borderRadius: '50%', color: 'var(--emergency)' }}>
                        <Phone size={24} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#991B1B' }}>104</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: '#7F1D1D', marginTop: '0.25rem' }}>Health Information Helpline</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Support Card */}
              <div style={{ 
                background: '#fff', padding: '2rem', borderRadius: '16px', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid var(--borderLight)' 
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '1.5rem' }}>
                  General Support
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--mutedForeground)', marginBottom: '0.25rem' }}>EMAIL US</div>
                      <a href="mailto:support@graminarogya.in" style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none' }}>support@graminarogya.in</a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--mutedForeground)', marginBottom: '0.25rem' }}>SERVICE HOURS</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 500, color: 'var(--foreground)' }}>Mon - Sat, 9:00 AM - 6:00 PM</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--mutedForeground)', marginTop: '0.25rem' }}>Platform operations are 24/7.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HQ Card */}
              <div style={{ 
                background: '#fff', padding: '2rem', borderRadius: '16px', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid var(--borderLight)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                      Headquarters
                    </h3>
                    <address style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', lineHeight: 1.6, fontStyle: 'normal' }}>
                      Ministry of Health & Family Welfare<br/>
                      Nirman Bhawan, Maulana Azad Road<br/>
                      New Delhi - 110011, India
                    </address>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
