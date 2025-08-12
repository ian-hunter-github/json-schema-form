const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src', 'index.css');
const out = path.join(root, 'dist', 'styles.css');

if (!fs.existsSync(src)) {
  console.warn('[WARN] No src/index.css; skipping copy.');
  process.exit(0);
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.copyFileSync(src, out);
console.log('[INFO] Copied CSS → dist/styles.css');
