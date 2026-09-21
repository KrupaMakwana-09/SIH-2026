const fs = require('fs');

const cssToAppend = `
/* Media Query Hide Helpers */
@media (max-width: 1024px) {
  .desktop-nav { display: none !important; }
  .hamburger-btn { display: flex !important; }
  .tagline-hide { display: none !important; }
}
@media (max-width: 768px) {
  .brand-text-hide { display: none !important; }
  .online-label { display: none !important; }
  .user-name-label { display: none !important; }
  .sos-label { display: none !important; }
  .badge-hide { display: none !important; }
  .blood-label { display: none !important; }
}

/* Landing Page Overrides to Minimalist Monochrome */
.np-app { background: var(--background); min-height: 100vh; }
.np-container { max-width: 1152px; margin: 0 auto; padding: 0 2rem; }

/* Header */
.np-utility { display: none; }
.np-header { border-bottom: 4px solid var(--border); padding: 1.5rem 0; position: sticky; top: 0; z-index: 50; background: var(--background); }
.np-header-inner { display: flex; align-items: center; justify-content: space-between; }
.np-brand { display: flex; align-items: center; gap: 1rem; text-decoration: none; color: var(--foreground); }
.np-brand-mark { width: 44px; height: 44px; background: var(--foreground); color: var(--background); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 900; font-size: 1.5rem; }
.np-brand-name { font-family: var(--font-display); font-weight: 700; font-size: 1.5rem; line-height: 1; }
.np-brand-sub { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.25rem; }
.np-nav { display: flex; gap: 2rem; align-items: center; }
.np-nav a { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.875rem; color: var(--foreground); font-weight: 700; }
.np-nav a:hover, .np-nav a.active { text-decoration: underline; }
.np-header-actions { display: flex; gap: 1rem; }

/* Ticker */
.np-ticker { border-bottom: 2px solid var(--border); display: flex; align-items: center; background: var(--background); overflow: hidden; height: 44px; }
.np-ticker-badge { background: var(--foreground); color: var(--background); font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; font-size: 0.75rem; padding: 0 1.5rem; display: flex; align-items: center; height: 100%; letter-spacing: 0.1em; }
.np-ticker-track { flex: 1; overflow: hidden; display: flex; align-items: center; }
.np-ticker-content { display: flex; white-space: nowrap; padding-left: 2rem; animation: marquee 30s linear infinite; }
.np-ticker-item { font-family: var(--font-mono); font-size: 0.875rem; text-transform: uppercase; margin-right: 3rem; }
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

/* Hero */
.np-hero { padding: 4rem 0; border-bottom: 4px solid var(--border); }
.np-hero-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 4rem; align-items: center; }
.np-hero-headline-row { display: flex; gap: 1rem; margin-bottom: 2rem; align-items: center; }
.np-kicker { font-family: var(--font-mono); font-size: 0.875rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; border: 1px solid var(--border); padding: 0.25rem 0.5rem; }
.np-meta { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
.np-h1 { font-family: var(--font-display); font-size: 6rem; line-height: 0.9; letter-spacing: -0.05em; font-weight: 700; margin-bottom: 2rem; }
.np-h1 em { font-style: italic; }
.np-lede { font-family: var(--font-body); font-size: 1.25rem; line-height: 1.6; margin-bottom: 1.5rem; }
.np-hero-lede-wrap { display: grid; grid-template-columns: 1fr; gap: 2rem; border-top: 2px solid var(--border); padding-top: 2rem; }
.np-body { font-family: var(--font-body); font-size: 1.125rem; }
.np-stat-block { margin-top: 2rem; }
.np-stat-num { font-family: var(--font-display); font-size: 3rem; font-weight: 700; line-height: 1; }
.np-stat-label { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.5rem; }
.np-hero-actions { display: flex; gap: 1rem; margin-top: 3rem; }
.np-btn { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; font-size: 0.875rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem 2rem; cursor: pointer; border: none; transition: none; }
.np-btn-primary { background: var(--foreground); color: var(--background); border: 2px solid var(--foreground); }
.np-btn-primary:hover { background: var(--background); color: var(--foreground); }
.np-btn-outline { background: transparent; color: var(--foreground); border: 2px solid var(--foreground); }
.np-btn-outline:hover { background: var(--foreground); color: var(--background); }
.np-btn-ghost { background: transparent; color: var(--foreground); padding: 0.5rem 1rem; }
.np-btn-ghost:hover { text-decoration: underline; }
.np-btn-red { background: var(--foreground); color: var(--background); border: 2px solid var(--foreground); }
.np-trust-strip { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 2px solid var(--border); margin-top: 3rem; border-bottom: 2px solid var(--border); }
.np-trust-strip-item { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; padding: 1rem 0; border-right: 1px solid var(--border); padding-left: 1rem; }
.np-trust-strip-item:last-child { border-right: none; }

/* Illustration */
.np-illustration { border: 2px solid var(--border); background: var(--background); padding: 1rem; }
.np-illustration-head { border-bottom: 2px solid var(--border); display: flex; justify-content: space-between; padding-bottom: 1rem; font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; }
.np-illustration-body { padding: 2rem 0; }
.np-illustration-caption { border-top: 2px solid var(--border); padding-top: 1rem; font-family: var(--font-body); font-style: italic; font-size: 0.875rem; }

/* Sections */
.np-section { padding: 6rem 0; border-bottom: 4px solid var(--border); }
.np-h2 { font-family: var(--font-display); font-size: 4rem; line-height: 1; font-weight: 700; margin-bottom: 1rem; }
.np-section-head { display: grid; grid-template-columns: 1fr 2fr; gap: 4rem; align-items: end; border-bottom: 4px solid var(--border); padding-bottom: 2rem; margin-bottom: 4rem; }
.np-section-num { font-family: var(--font-mono); font-size: 1rem; font-weight: 700; }
.np-section-lede { font-family: var(--font-body); font-size: 1.25rem; margin-bottom: 0; }

/* Services */
.np-services { display: grid; grid-template-columns: repeat(12, 1fr); border: 2px solid var(--border); }
.np-service { padding: 2rem; border-right: 2px solid var(--border); border-bottom: 2px solid var(--border); background: var(--background); transition: none; display: flex; flex-direction: column; }
.np-service:hover { background: var(--foreground); color: var(--background); }
.np-service:hover * { color: var(--background) !important; border-color: var(--background) !important; }
.np-service-featured { grid-column: span 6; grid-row: span 2; }
.np-service-half { grid-column: span 3; }
.np-service-icon { width: 48px; height: 48px; border: 2px solid var(--foreground); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
.np-service-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
.np-service-desc { font-family: var(--font-body); font-size: 1rem; flex: 1; }
.np-service-action { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin-top: 2rem; }
.np-service-visual { border-top: 2px solid var(--border); margin: 2rem -2rem -2rem; padding: 2rem; }

/* Journey */
.np-journey { background: var(--foreground); color: var(--background); padding: 6rem 0; }
.np-journey * { color: var(--background) !important; border-color: var(--background) !important; }
.np-journey-grid { display: grid; grid-template-columns: repeat(5, 1fr); border: 2px solid var(--background); margin-top: 4rem; }
.np-journey-step { padding: 2rem; border-right: 2px solid var(--background); display: flex; flex-direction: column; }
.np-journey-step:last-child { border-right: none; }
.np-step-num { font-family: var(--font-display); font-size: 3rem; font-weight: 700; border-bottom: 2px solid var(--background); padding-bottom: 1rem; margin-bottom: 1rem; }
.np-step-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; }
.np-step-desc { font-family: var(--font-body); font-size: 1rem; }

/* Footer */
.np-footer { padding: 4rem 0; border-top: 8px solid var(--border); }
.np-footer-masthead { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid var(--border); padding-bottom: 2rem; margin-bottom: 2rem; }
.np-footer-masthead-brand { display: flex; align-items: center; gap: 1rem; }
.np-footer-masthead-mark { font-family: var(--font-display); font-size: 2rem; font-weight: 900; background: var(--foreground); color: var(--background); padding: 0.5rem; }
.np-footer-masthead-name { font-family: var(--font-display); font-size: 2rem; font-weight: 700; }
.np-footer-masthead-meta { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; text-align: right; }
.np-footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4rem; border-bottom: 2px solid var(--border); padding-bottom: 4rem; margin-bottom: 2rem; }
.np-footer-col-title { font-family: var(--font-mono); font-size: 0.875rem; text-transform: uppercase; font-weight: 700; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
.np-footer-purpose { font-family: var(--font-body); font-size: 1rem; }
.np-footer-col ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
.np-footer-col a { font-family: var(--font-body); font-size: 1rem; text-decoration: none; }
.np-footer-col a:hover { text-decoration: underline; }
.np-footer-bottom { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 2rem; }
.np-footer-bottom-links { display: flex; gap: 2rem; }
.np-footer-colophon { text-align: center; font-family: var(--font-body); font-style: italic; font-size: 0.875rem; border-top: 2px solid var(--border); padding-top: 2rem; }

/* Search Area */
.np-search { padding: 6rem 0; border-bottom: 4px solid var(--border); }
.np-search-panel { border: 4px solid var(--border); }
.np-search-head { background: var(--foreground); color: var(--background); padding: 1rem 2rem; display: flex; justify-content: space-between; font-family: var(--font-mono); text-transform: uppercase; font-size: 0.875rem; font-weight: 700; }
.np-search-tabs { display: flex; border-bottom: 2px solid var(--border); }
.np-search-tab { flex: 1; padding: 1.5rem; font-family: var(--font-mono); text-transform: uppercase; font-weight: 700; border: none; background: transparent; border-right: 2px solid var(--border); cursor: pointer; }
.np-search-tab:last-child { border-right: none; }
.np-search-tab.active { background: var(--foreground); color: var(--background); }
.np-search-body { display: grid; grid-template-columns: 1fr 1fr 200px; }
.np-search-field { padding: 2rem; border-right: 2px solid var(--border); display: flex; flex-direction: column; gap: 1rem; }
.np-search-label { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
.np-search-input-wrap { display: flex; align-items: center; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
.np-search-input-wrap input { border: none; font-family: var(--font-body); font-size: 1.25rem; outline: none; width: 100%; background: transparent; }
.np-search-cta-cell { display: flex; align-items: flex-end; padding: 2rem; }
.np-search-chips { border-top: 2px solid var(--border); display: flex; }
.np-search-chip-label { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; font-weight: 700; padding: 1rem 2rem; border-right: 2px solid var(--border); display: flex; align-items: center; }
.np-chip { padding: 1rem 2rem; font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; border: none; background: transparent; border-right: 2px solid var(--border); cursor: pointer; }
.np-chip:hover { background: var(--foreground); color: var(--background); }

/* Dropcap */
.np-dropcap::first-letter { font-family: var(--font-display); font-size: 5rem; font-weight: 900; float: left; margin-right: 0.5rem; line-height: 1; }

/* Modal */
.np-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.np-modal { background: var(--background); border: 4px solid var(--border); max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; }
.np-modal-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid var(--border); padding: 2rem; }
.np-modal-head-left { display: flex; align-items: center; gap: 1rem; }
.np-modal-head-icon { width: 48px; height: 48px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--foreground); color: var(--background); }
.np-modal-title { font-family: var(--font-display); font-size: 2rem; font-weight: 700; line-height: 1; }
.np-modal-sub { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; margin-top: 0.5rem; }
.np-modal-close { background: transparent; border: 2px solid var(--border); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.np-modal-close:hover { background: var(--foreground); color: var(--background); }
.np-modal-body { padding: 2rem; }

/* Loading Screen */
.np-loading { min-height: 100vh; background: var(--background); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.np-loading-rule { font-family: var(--font-mono); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; border-top: 4px solid var(--border); border-bottom: 2px solid var(--border); padding: 0.5rem 0; margin-bottom: 2rem; width: 300px; }
.np-loading-mark { font-family: var(--font-display); font-size: 4rem; font-weight: 900; background: var(--foreground); color: var(--background); width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; animation: pulse 1.5s infinite steps(2); }
@keyframes pulse { 0%, 100% { background: var(--foreground); color: var(--background); } 50% { background: transparent; color: var(--foreground); border: 4px solid var(--border); } }
.np-loading-brand { font-family: var(--font-display); font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
.np-loading-sub { font-family: var(--font-mono); font-size: 0.875rem; text-transform: uppercase; }

/* AuthModal Minimalist Overrides */
.np-auth-overlay {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: none !important;
}
.np-auth-modal {
  background: var(--background) !important;
  border: 4px solid var(--border) !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
.np-auth-modal h2 {
  font-family: var(--font-display) !important;
  color: var(--foreground) !important;
}
.np-auth-modal div[style*="color: #6b7280"], 
.np-auth-modal div[style*="color: '#6b7280'"] {
  color: var(--foreground) !important;
  font-family: var(--font-mono) !important;
  text-transform: uppercase !important;
}
.np-auth-modal button {
  border-radius: 0 !important;
  box-shadow: none !important;
  font-family: var(--font-mono) !important;
  text-transform: uppercase !important;
}
.np-auth-modal input, .np-auth-modal select {
  border-radius: 0 !important;
  border: 2px solid var(--border) !important;
  background: var(--background) !important;
  color: var(--foreground) !important;
  font-family: var(--font-body) !important;
}
.np-auth-modal input:focus, .np-auth-modal select:focus {
  border-color: var(--foreground) !important;
  outline: none !important;
}
.np-auth-modal label {
  font-family: var(--font-mono) !important;
  color: var(--foreground) !important;
  text-transform: uppercase !important;
}
.np-auth-modal [style*="linear-gradient"] {
  background: var(--foreground) !important;
  color: var(--background) !important;
  border: none !important;
}
.np-auth-modal [style*="background: '#f0fdf4'"] {
  background: transparent !important;
  border: 2px solid var(--border) !important;
}
.np-auth-modal button[style*="background: transparent"] {
  background: transparent !important;
  color: var(--foreground) !important;
}

/* Universal Monochrome Fixes */
.card, [class*='Modal'], [class*='Panel'], [class*='Portal'] {
  background: var(--background) !important;
  color: var(--foreground) !important;
}

button {
  border-radius: 0 !important;
  box-shadow: none !important;
  font-family: var(--font-mono) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  font-weight: 700 !important;
  transition: none !important;
}

input, select, textarea {
  border-radius: 0 !important;
  border: 2px solid var(--border) !important;
  background: var(--background) !important;
  color: var(--foreground) !important;
  font-family: var(--font-mono) !important;
  box-shadow: none !important;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--foreground) !important;
  outline: none !important;
}

label {
  font-family: var(--font-mono) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display) !important;
  font-weight: 700 !important;
  color: var(--foreground) !important;
  letter-spacing: -0.02em !important;
}

/* Modal specific global overrides to ensure they look sharp */
div[style*='position: fixed'], div[style*='position: absolute'] {
  border-radius: 0 !important;
}

/* Ensure no round icons or weird colors left */
svg {
  border-radius: 0 !important;
}
`;

fs.appendFileSync('src/minimalist.css', cssToAppend, 'utf8');
