const fs = require('fs');
const css = `
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
`;
fs.appendFileSync('d:/finalsih/SIH-2026/frontend/src/minimalist.css', css);
