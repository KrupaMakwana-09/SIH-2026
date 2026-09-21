import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

// Destructure from default export to handle ES modules properly
const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

const walkDir = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.jsx')) {
      callback(dirPath);
    }
  });
};

const processFile = (filePath) => {
  if (filePath.includes('App.jsx') || filePath.includes('Navbar.jsx')) return; // already refactored
  let code = fs.readFileSync(filePath, 'utf8');
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    let changed = false;

    traverse(ast, {
      JSXAttribute(path) {
        if (path.node.name.name === 'style') {
          const value = path.node.value;
          if (value && value.type === 'JSXExpressionContainer' && value.expression.type === 'ObjectExpression') {
            const newProps = [];
            for (const prop of value.expression.properties) {
              if (prop.type !== 'ObjectProperty') {
                newProps.push(prop);
                continue;
              }
              const keyName = prop.key.name || prop.key.value;
              if (!keyName) {
                newProps.push(prop);
                continue;
              }

              // Strip these properties completely
              const stripProps = [
                'borderRadius', 'boxShadow', 'backdropFilter', 'WebkitBackdropFilter',
                'backgroundBlendMode', 'transition', 'animation'
              ];
              if (stripProps.includes(keyName)) {
                changed = true;
                continue;
              }

              // Standardize borders to 1px solid black
              if (keyName.startsWith('border') && prop.value.type === 'StringLiteral') {
                prop.value.value = prop.value.value.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,6}/, '#000');
                changed = true;
              }

              // Remove background colors/gradients or make them monochrome
              if (keyName.startsWith('background') || keyName === 'color') {
                if (prop.value.type === 'StringLiteral') {
                  const val = prop.value.value;
                  // If it's a gradient, change to solid black (or white if requested)
                  if (val.includes('linear-gradient')) {
                    prop.value.value = '#000000';
                  } else if (keyName === 'color') {
                    // Force text to black if it was colored, or let it inherit (better to inherit by deleting)
                    continue; // skip color prop, it will inherit black!
                  } else {
                    // For background, if it was light (f0, fa, etc), make it transparent or white. 
                    // If it was dark (like green #059669), make it black.
                    // Just removing background lets it inherit, which is safer for layout.
                    continue; // skip background prop!
                  }
                  changed = true;
                } else {
                  // If not string literal (e.g. ternary), just keep it or remove it. We'll remove it.
                  changed = true;
                  continue; 
                }
              }

              newProps.push(prop);
            }
            value.expression.properties = newProps;
          }
        }
      }
    });

    if (changed) {
      const output = generate(ast, {}, code);
      fs.writeFileSync(filePath, output.code, 'utf8');
      console.log('Processed', filePath);
    }
  } catch (err) {
    console.error('Error parsing', filePath, err.message);
  }
};

walkDir('./src/components', processFile);
walkDir('./src/views', processFile);
console.log('Done transforming AST!');
