'use strict';
/**
 * Build script — concat & minify JS/CSS for production.
 * No external dependencies; uses basic string minification.
 * Usage: npm run build
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const DIST = path.join(__dirname, '..', 'dist');

// Ensure dist directory exists
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

// ── Simple CSS minifier (no deps) ──
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// ── Simple JS minifier (conservative — no AST) ──
function minifyJs(js) {
  return js
    .replace(/\/\/[^\n]*/g, '')         // remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove multi-line comments
    .replace(/\n\s*\n/g, '\n')          // collapse blank lines
    .trim();
}

// ── CSS ──
console.log('📦 Building CSS...');
const cssFile = path.join(PUBLIC, 'style.css');
const cssMin = minifyCss(fs.readFileSync(cssFile, 'utf-8'));
fs.writeFileSync(path.join(DIST, 'style.min.css'), cssMin);
console.log(`   style.min.css: ${(cssMin.length / 1024).toFixed(1)} KB`);

// ── JS — concat app.js + all modules in load order ──
console.log('📦 Building JS...');
const appJs = fs.readFileSync(path.join(PUBLIC, 'app.js'), 'utf-8');
const modulesDir = path.join(PUBLIC, 'modules');
const moduleFiles = fs.readdirSync(modulesDir)
  .filter(f => f.endsWith('.js'))
  .sort();

let allJs = '';
for (const mf of moduleFiles) {
  allJs += fs.readFileSync(path.join(modulesDir, mf), 'utf-8') + '\n';
}
allJs += appJs;

const jsMin = minifyJs(allJs);
fs.writeFileSync(path.join(DIST, 'app.bundle.js'), jsMin);
console.log(`   app.bundle.js: ${(jsMin.length / 1024).toFixed(1)} KB`);

// ── Copy index.html with references swapped ──
let html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf-8');
// Replace multiple script tags with single bundle
html = html.replace(/<script src="modules\/[^"]+"><\/script>\s*/g, '');
html = html.replace(/<script src="app\.js"><\/script>/, '<script src="app.bundle.js"></script>');
html = html.replace(/style\.css/, 'style.min.css');
fs.writeFileSync(path.join(DIST, 'index.html'), html);

console.log('✅ Build complete → dist/');
