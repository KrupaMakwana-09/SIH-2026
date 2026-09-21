import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, Check, X, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// import { api } from '../utils/api'; // We'll mock API calls for the UI flow

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Steps: 'IDENTIFY' -> 'VERIFY' -> 'RESET' -> 'SUCCESS'
  const [step, setStep] = useState('IDENTIFY');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Step 1 State
  const [identity, setIdentity] = useState('');
  
  // Step 2 State
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  
  // Step 3 State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, upper: false, lower: false, number: false, special: false, score: 0
  });

  // Timer Effect
  useEffect(() => {
    let interval;
    if (step === 'VERIFY' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Password Strength Effect
  useEffect(() => {
    if (step !== 'RESET') return;
    const reqs = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    const score = Object.values(reqs).filter(Boolean).length;
    setPasswordStrength({ ...reqs, score });
  }, [password, step]);

  const getStrengthColor = (score) => {
    if (score <= 2) return 'var(--emergency)'; // Reddish
    if (score <= 4) return '#E7A63B'; // Amber
    return '#10B981'; // Green
  };

  const getStrengthLabel = (score) => {
    if (score === 0) return '';
    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'MEDIUM';
    return 'STRONG';
  };

  const RequirementItem = ({ satisfied, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: satisfied ? '#10B981' : 'var(--mutedForeground)' }}>
      {satisfied ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Simulate API call
    setTimeout(() => {
      if (identity.trim() === '') {
        setErrorMsg('Please enter a valid email or mobile number.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep('VERIFY');
      setTimer(30);
    }, 1000);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Simulate API call
    setTimeout(() => {
      if (otp.length !== 6) {
        setErrorMsg('Please enter a valid 6-digit OTP.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep('RESET');
    }, 1000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }
    if (passwordStrength.score < 5) {
      setErrorMsg('Please satisfy all password requirements');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('SUCCESS');
    }, 1500);
  };

  return (
    <div style={{ background: 'var(--paper)', padding: '3rem 1rem 5rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div style={{ 
        display: 'flex', width: '100%', maxWidth: '1100px', 
        minHeight: '650px', background: 'var(--background)', 
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid var(--borderLight)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
      }}>
        {/* ─── LEFT COLUMN: FORM ───────────────────────────────────────────── */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', 
          justifyContent: 'center', alignItems: 'center', padding: '3rem 2rem' 
        }}>
          
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {/* Logo & Back Link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <Link to="/sign-in" style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                color: 'var(--mutedForeground)', textDecoration: 'none', 
                fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mutedForeground)'}
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{ 
                background: '#FEF2F2', color: 'var(--emergency)', padding: '1rem', 
                borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', 
                fontSize: '0.875rem', border: '1px solid #FCA5A5' 
              }}>
                {errorMsg}
              </div>
            )}

            {/* Step 1: IDENTIFY */}
            {step === 'IDENTIFY' && (
              <div className="fade-in">
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  Forgot your password?
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2.5rem' }}>
                  Enter the email or mobile number associated with your account, and we'll send you an OTP to reset it.
                </p>
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      EMAIL OR MOBILE NUMBER
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        required
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        placeholder="e.g. 9876543210 or email@domain.com"
                        style={{
                          width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
                          background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
                          outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                      fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.2s ease', opacity: loading ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#083F3D')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'var(--primary)')}
                  >
                    {loading ? (
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Send OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: VERIFY */}
            {step === 'VERIFY' && (
              <div className="fade-in">
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  Verify it's you
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2.5rem' }}>
                  We've sent a 6-digit verification code to <strong>{identity}</strong>. Enter it below.
                </p>
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      6-DIGIT OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only numbers
                      placeholder="• • • • • •"
                      style={{
                        width: '100%', padding: '0.875rem 1rem', textAlign: 'center', letterSpacing: '8px',
                        background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                        fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--foreground)',
                        outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                        fontWeight: 700
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--mutedForeground)', fontFamily: 'var(--font-body)' }}>
                      Didn't receive code?
                    </span>
                    <button 
                      type="button" 
                      disabled={timer > 0}
                      onClick={() => setTimer(30)}
                      style={{ 
                        background: 'none', border: 'none', fontFamily: 'var(--font-mono)', 
                        fontSize: '0.875rem', fontWeight: 600, 
                        color: timer > 0 ? 'var(--mutedForeground)' : 'var(--primary)', 
                        cursor: timer > 0 ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    style={{
                      width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                      fontWeight: 700, cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', marginTop: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.2s ease', opacity: (loading || otp.length !== 6) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !(loading || otp.length !== 6) && (e.currentTarget.style.background = '#083F3D')}
                    onMouseLeave={(e) => !(loading || otp.length !== 6) && (e.currentTarget.style.background = 'var(--primary)')}
                  >
                    {loading ? (
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Verify OTP <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: RESET */}
            {step === 'RESET' && (
              <div className="fade-in">
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  Create New Password
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2.5rem' }}>
                  Your new password must be unique from those previously used.
                </p>
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      NEW PASSWORD
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your new password"
                        style={{
                          width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem', 
                          background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
                          outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
                          position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mutedForeground)'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                      <div style={{ background: '#F8FAF9', border: '1px solid var(--borderLight)', borderRadius: '8px', padding: '1rem', marginTop: '0.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                          <RequirementItem satisfied={passwordStrength.length} text="Min 8 characters" />
                          <RequirementItem satisfied={passwordStrength.upper} text="1 uppercase letter" />
                          <RequirementItem satisfied={passwordStrength.lower} text="1 lowercase letter" />
                          <RequirementItem satisfied={passwordStrength.number} text="1 number" />
                          <RequirementItem satisfied={passwordStrength.special} text="1 special symbol" />
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: '6px', background: 'var(--borderLight)', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                          <div style={{ flex: 1, background: passwordStrength.score >= 1 ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                          <div style={{ flex: 1, background: passwordStrength.score >= 2 ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                          <div style={{ flex: 1, background: passwordStrength.score >= 3 ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                          <div style={{ flex: 1, background: passwordStrength.score >= 4 ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                          <div style={{ flex: 1, background: passwordStrength.score >= 5 ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 600, color: getStrengthColor(passwordStrength.score), marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                          {getStrengthLabel(passwordStrength.score)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      CONFIRM NEW PASSWORD
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        style={{
                          width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem', 
                          background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                          fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
                          outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ 
                          position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mutedForeground)'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Real-time match validation */}
                    {confirmPassword.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: confirmPassword === password ? '#10B981' : 'var(--emergency)', marginTop: '0.25rem', fontFamily: 'var(--font-body)' }}>
                        {confirmPassword === password ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                        {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                      fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.2s ease', opacity: loading ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#083F3D')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.background = 'var(--primary)')}
                  >
                    {loading ? (
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>Reset Password <Check size={16} /></>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: SUCCESS */}
            {step === 'SUCCESS' && (
              <div className="fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ 
                  width: '64px', height: '64px', background: '#ECFDF5', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', margin: '0 auto 1.5rem' 
                }}>
                  <Check size={32} color="#10B981" strokeWidth={3} />
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>
                  Password Reset!
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2.5rem' }}>
                  Your password has been successfully reset. You can now log in to your account with your new credentials.
                </p>
                <Link to="/sign-in" style={{ textDecoration: 'none' }}>
                  <button
                    type="button"
                    style={{
                      width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                      fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#083F3D'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
                  >
                    Return to Sign In
                  </button>
                </Link>
              </div>
            )}

            {/* Trust Banner (Only shown on Step 1) */}
            {step === 'IDENTIFY' && (
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                marginTop: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', 
                color: 'var(--mutedForeground)' 
              }}>
                <ShieldCheck size={16} color="var(--primary)" />
                Secure & Private Password Recovery
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: IMAGE (Hidden on Mobile) ────────────────────── */}
        <div className="auth-image-panel" style={{ 
          flex: 1, position: 'relative', background: '#0F2524', overflow: 'hidden'
        }}>
          <img 
            src="/images/auth_side_panel.jpg" 
            alt="Healthcare Provider" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(to top, rgba(11, 79, 76, 0.95) 0%, rgba(11, 79, 76, 0.6) 40%, transparent 80%)' 
          }} />
          
          <div style={{ position: 'absolute', bottom: '3rem', left: '3.5rem', right: '3.5rem', zIndex: 10 }}>
            <div role="heading" aria-level="2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.15, marginBottom: '1.25rem', textShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
              Secure account recovery.
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1rem, 1.5vw, 1.125rem)', fontWeight: 500, color: '#F3F8F6', lineHeight: 1.6, maxWidth: '420px', textShadow: '0 1px 8px rgba(0,0,0,0.2)' }}>
              GraminArogya employs rigorous security standards to ensure your healthcare records and account details remain completely protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
