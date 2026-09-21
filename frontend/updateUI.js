const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src', 'pages', 'SignIn.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{/* Role Selector */}\n              <div style={{",
  "{/* Role Selector */}\n              {isLoginTab && (<div style={{"
);
content = content.replace(
  "} </button>\n                ))}\n              </div>",
  "} </button>\n                ))}\n              </div>)}"
);

content = content.replace(
  "EMAIL OR MOBILE",
  "{isLoginTab ? (activeRole === 'doctor' ? 'DOCTOR ID' : activeRole === 'staff' ? 'STAFF ID' : 'EMAIL, MOBILE OR USERNAME') : 'EMAIL OR MOBILE'}"
);
content = content.replace(
  "Enter email or 10-digit mobile",
  "{isLoginTab ? (activeRole === 'doctor' ? 'Enter your Doctor ID (e.g. DOC-1234)' : activeRole === 'staff' ? 'Enter your Staff ID (e.g. STF-1234)' : 'Enter email, mobile, or admin') : 'Enter your email or mobile'}"
);

content = content.replace(
  "{/* Google Sign In */}\n            <button",
  "{/* Google Sign In */}\n            {isLoginTab && activeRole === 'patient' && (<button"
);
content = content.replace(
  "Sign in with Google\n            </button>",
  "Sign in with Google\n            </button>)}"
);

content = content.replace(
  "<div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>",
  "{isLoginTab && activeRole === 'patient' && (<div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0' }}>"
);
content = content.replace(
  "<div style={{ flex: 1, height: '1px', background: 'var(--borderLight)' }} />\n            </div>",
  "<div style={{ flex: 1, height: '1px', background: 'var(--borderLight)' }} />\n            </div>)}"
);

content = content.replace(
  "setIsLoginTab(!isLoginTab); setErrorMsg('');",
  "setIsLoginTab(!isLoginTab); setErrorMsg(''); if(isLoginTab) setActiveRole('patient');"
);

const otpBlock = \
            {adminOtpRequired ? (
              <div style={{ textAlign: 'center' }}>
                <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Verification</h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--mutedForeground)', marginBottom: '2rem' }}>
                  Please check the server console for your one-time password.
                </p>
                <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <input
                    type="text"
                    required
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    style={{
                      width: '100%', padding: '0.75rem 1rem', textAlign: 'center', letterSpacing: '4px',
                      background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
                      fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--foreground)'
                    }}
                  />
                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}>
                    {loading ? 'Verifying...' : 'Verify Admin'}
                  </button>
                  <button type="button" onClick={() => setAdminOtpRequired(false)} style={{ background: 'none', border: 'none', color: 'var(--mutedForeground)', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}>Cancel</button>
                </form>
              </div>
            ) : (\;

if (!content.includes('adminOtpRequired ?')) {
  content = content.replace(
    "{/* Form */}\n            <form onSubmit={handleAuth}",
    otpBlock + "\n            {/* Form */}\n            <form onSubmit={handleAuth}"
  );
  content = content.replace(
    "{/* Trust Banner */}",
    ")} \n\n            {/* Trust Banner */}"
  );
}

fs.writeFileSync(file, content);
