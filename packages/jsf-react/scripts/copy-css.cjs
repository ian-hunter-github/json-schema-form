const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const stylesDir = path.join(root, 'src', 'styles');

// Copy index.css to dist/index.css
const indexSrc = path.join(root, 'src', 'index.css');
const indexOut = path.join(distDir, 'index.css');

if (fs.existsSync(indexSrc)) {
  fs.mkdirSync(distDir, { recursive: true });
  fs.copyFileSync(indexSrc, indexOut);
  console.log('[INFO] Copied index.css → dist/index.css');
}

// Copy all theme files from src/styles/ to dist/styles/
if (fs.existsSync(stylesDir)) {
  const themeFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
  if (themeFiles.length > 0) {
    const themeOutDir = path.join(distDir, 'styles');
    fs.mkdirSync(themeOutDir, { recursive: true });
    
    themeFiles.forEach(file => {
      const srcPath = path.join(stylesDir, file);
      const outPath = path.join(themeOutDir, file);
      fs.copyFileSync(srcPath, outPath);
      console.log(`[INFO] Copied theme ${file} → dist/styles/${file}`);
    });
  }
}
