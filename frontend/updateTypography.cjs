const fs = require('fs');
let css = fs.readFileSync('src/minimalist.css', 'utf8');

// Update Google Fonts import
css = css.replace(
  /@import url\([^)]+\);/,
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');"
);

// Update font variables
css = css.replace(/--font-display:.*;/, "--font-display: 'Lora', Georgia, serif;");
css = css.replace(/--font-body:.*;/, "--font-body: 'Inter', system-ui, -apple-system, sans-serif;");
css = css.replace(/--font-mono:.*;/, "--font-mono: 'Inter', system-ui, -apple-system, sans-serif;");

// Remove uppercase globally
css = css.replace(/text-transform:\s*uppercase\s*!important;/g, '');
css = css.replace(/text-transform:\s*uppercase;/g, '');

// Remove dramatic letter spacing
css = css.replace(/letter-spacing:\s*[-0-9.em]+\s*!important;/g, '');
css = css.replace(/letter-spacing:\s*[-0-9.em]+;/g, '');

// Tame font weights (700 -> 600, 900 -> 700) for a calmer UI
css = css.replace(/font-weight:\s*700\s*!important;/g, 'font-weight: 600 !important;');
css = css.replace(/font-weight:\s*900;/g, 'font-weight: 700;');

// Make line heights more standard for sans-serif readability (1.0 is too tight)
css = css.replace(/line-height:\s*1;/g, 'line-height: 1.25;');
css = css.replace(/line-height:\s*0\.9;/g, 'line-height: 1.1;');

// Reduce massive font sizes
css = css.replace(/font-size:\s*6rem;/g, 'font-size: 4rem;');
css = css.replace(/font-size:\s*5rem;/g, 'font-size: 3.5rem;');
css = css.replace(/font-size:\s*4rem;/g, 'font-size: 3rem;');
css = css.replace(/font-size:\s*3rem;/g, 'font-size: 2.25rem;');
css = css.replace(/font-size:\s*2\.5rem;/g, 'font-size: 2rem;');

// Increase button weights slightly since we changed to Inter and stripped uppercase
css = css.replace(/\.btn\s*\{[\s\S]*?\}/, match => {
  return match.replace(/font-weight:\s*[0-9]+;/, 'font-weight: 600;');
});

fs.writeFileSync('src/minimalist.css', css);
console.log('Typography updated.');
