const fs = require('fs');
let css = fs.readFileSync('src/minimalist.css', 'utf8');

// 1. Replace the CSS variables
css = css.replace(
  /:root\s*\{[\s\S]*?\/\* Textures \*\//,
  `:root {
  /* Colors */
  --background: #F7FAF9;
  --foreground: #18312F;
  --muted: #E6EDE9;
  --mutedForeground: #667876;
  --accent: #E7A63B;
  --accentForeground: #FFFFFF;
  --primary: #0B6B68;
  --primaryForeground: #FFFFFF;
  --border: #083F3D;
  --borderLight: #C8D8D6;
  --card: #FFFFFF;
  --cardForeground: #18312F;
  --ring: #0B6B68;
  --emergency: #D94B4B;
  
  /* Fonts */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Textures */`
);

// 2. Update textures to use teal instead of black
css = css.replace(/#00000008/g, '#083F3D0C');
css = css.replace(/#000 1px, #000 2px/g, '#083F3D 1px, #083F3D 2px');
css = css.replace(/#0B6B6822 1px, #0B6B6822 2px/g, '#0B6B6844 1px, #0B6B6844 2px');

// 3. Update red buttons
css = css.replace(/\.btn-emergency, \.btn-emergency-monochrome\s*\{[\s\S]*?\}/, `.btn-emergency, .btn-emergency-monochrome {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 1rem 2rem;
  animation: pulseEmergency 2s infinite steps(2);
  background-color: var(--emergency) !important;
  color: #FFF !important;
  border: 2px solid var(--emergency) !important;
}`);

css = css.replace(/@keyframes pulseEmergency\s*\{[\s\S]*?\}/, `@keyframes pulseEmergency {
  0%, 100% { background-color: var(--emergency); color: #FFF; border-color: var(--emergency); }
  50% { background-color: transparent; color: var(--emergency); border: 2px solid var(--emergency); }
}`);

css = css.replace(/\.np-btn-red\s*\{[\s\S]*?\}/, `.np-btn-red { background: var(--emergency); color: #FFF; border: 2px solid var(--emergency); }`);

// 4. Update primary buttons in the hero section and general .btn-primary
css = css.replace(/\.btn-primary\s*\{[\s\S]*?\}/, `.btn-primary { background: var(--primary) !important; color: var(--primaryForeground) !important; border: 2px solid var(--primary) !important; padding: 1rem 2rem; }`);
css = css.replace(/\.btn-primary:hover\s*\{[\s\S]*?\}/, `.btn-primary:hover { background: var(--background) !important; color: var(--primary) !important; }`);
css = css.replace(/\.btn-outline\s*\{[\s\S]*?\}/, `.btn-outline { background: transparent !important; color: var(--primary) !important; border: 2px solid var(--primary) !important; padding: 1rem 2rem; }`);
css = css.replace(/\.btn-outline:hover\s*\{[\s\S]*?\}/, `.btn-outline:hover { background: var(--primary) !important; color: var(--background) !important; }`);

css = css.replace(/\.np-btn-primary\s*\{[\s\S]*?\}/, `.np-btn-primary { background: var(--primary) !important; color: var(--primaryForeground) !important; border: 2px solid var(--primary) !important; }`);
css = css.replace(/\.np-btn-primary:hover\s*\{[\s\S]*?\}/, `.np-btn-primary:hover { background: var(--background) !important; color: var(--primary) !important; }`);
css = css.replace(/\.np-btn-outline\s*\{[\s\S]*?\}/, `.np-btn-outline { background: transparent !important; color: var(--primary) !important; border: 2px solid var(--primary) !important; }`);
css = css.replace(/\.np-btn-outline:hover\s*\{[\s\S]*?\}/, `.np-btn-outline:hover { background: var(--primary) !important; color: var(--background) !important; }`);

// 5. Update global monochrome fixes to use primary instead of foreground for backgrounds
// Look for universal overrides and replace specific styles
css = css.replace(
  /button\s*\{\s*border-radius: 0 !important;\s*box-shadow: none !important;\s*font-family: var\(--font-mono\) !important;\s*text-transform: uppercase !important;\s*letter-spacing: 0\.05em !important;\s*font-weight: 700 !important;\s*transition: none !important;\s*\}/g,
  `button {
  border-radius: 0 !important;
  box-shadow: none !important;
  font-family: var(--font-mono) !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  font-weight: 700 !important;
  transition: none !important;
}`
);

// We had "background: var(--foreground) !important;" in some places like .np-footer-masthead-mark
css = css.replace(/\.np-footer-masthead-mark\s*\{[\s\S]*?\}/, `.np-footer-masthead-mark { font-family: var(--font-display); font-size: 2rem; font-weight: 900; background: var(--primary); color: var(--background); padding: 0.5rem; }`);

// Update modal icon backgrounds from foreground to primary
css = css.replace(/\.np-modal-head-icon\s*\{[\s\S]*?\}/, `.np-modal-head-icon { width: 48px; height: 48px; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--background); }`);

// Update loading screen
css = css.replace(/\.np-loading-mark\s*\{[\s\S]*?\}/, `.np-loading-mark { font-family: var(--font-display); font-size: 4rem; font-weight: 900; background: var(--primary); color: var(--background); width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; animation: pulse 1.5s infinite steps(2); }`);
css = css.replace(/@keyframes pulse\s*\{[\s\S]*?\}/, `@keyframes pulse { 0%, 100% { background: var(--primary); color: var(--background); } 50% { background: transparent; color: var(--primary); border: 4px solid var(--border); } }`);

fs.writeFileSync('src/minimalist.css', css);
