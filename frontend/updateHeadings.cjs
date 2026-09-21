const fs = require('fs');
let css = fs.readFileSync('src/minimalist.css', 'utf8');

css = css.replace(
  /h1, h2, h3, h4, h5, h6, \.font-display\s*\{[\s\S]*?\}/,
  `h1, h2, .np-h1, .np-h2, .font-display {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.2;
  color: var(--foreground);
}
h3, h4, h5, h6 {
  font-family: var(--font-body);
  font-weight: 600;
  line-height: 1.2;
  color: var(--foreground);
}`
);

css = css.replace(
  /h1, h2, h3, h4, h5, h6\s*\{[\s\S]*?\}/,
  `h1, h2, .font-display {
  font-family: var(--font-display) !important;
  font-weight: 600 !important;
  color: var(--foreground) !important;
}
h3, h4, h5, h6 {
  font-family: var(--font-body) !important;
  font-weight: 600 !important;
  color: var(--foreground) !important;
}`
);

fs.writeFileSync('src/minimalist.css', css);
console.log('Heading font mappings updated.');
