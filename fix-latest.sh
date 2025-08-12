#!/usr/bin/env bash
set -euo pipefail

FILE="packages/jsf-react/src/index.tsx"

echo "[INFO] Patching $FILE to hide discriminator consts inside oneOf/anyOf…"
[[ -f "$FILE" ]] || { echo "[FAIL] $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak.discriminator-const" && echo "[DONE] Backup → $FILE.bak.discriminator-const"

node - "$FILE" <<'JS'
const fs = require('fs');
const p = process.argv[2];
let s = fs.readFileSync(p, 'utf8');
let changed = false;

// 1) Add a hiddenConstPathsRef Set right after constPathsRef
if (!/hiddenConstPathsRef/.test(s)) {
  s = s.replace(
    /const constPathsRef = useRef<Set<string>>\(new Set\(\)\);/,
`const constPathsRef = useRef<Set<string>>(new Set());
  // Paths of discriminator const fields to hide (e.g. profile.kind)
  const hiddenConstPathsRef = useRef<Set<string>>(new Set());`
  );
  changed = true;
}

// 2) Reset the hidden set before each render, next to resetConstPaths()
if (!/hiddenConstPathsRef\.current\s*=\s*new Set\(\)/.test(s)) {
  s = s.replace(
    /\/\/ reset const path tracking before each render pass\n\s*resetConstPaths\(\);/,
`// reset const path tracking before each render pass
  resetConstPaths();
  hiddenConstPathsRef.current = new Set();`
  );
  changed = true;
}

// 3) In oneOf/anyOf renderer: register the discriminator path to hide
// Find the block: if (Array.isArray(s?.oneOf) || Array.isArray(s?.anyOf)) { … }
s = s.replace(
  /(if\s*\(Array\.isArray\(s\?\.oneOf\)\s*\|\|\s*Array\.isArray\(s\?\.anyOf\)\)\s*\{\s*[\s\S]*?const idx[^\n]*\n)/,
  (m) => {
    if (m.includes('const discProp')) return m; // already patched
    changed = true;
    return m + `
      // Discriminator property name on the selector schema (if any)
      const discProp = typeof (s as any)?.discriminator?.propertyName === "string"
        ? (s as any).discriminator.propertyName
        : null;
      if (discProp) {
        // e.g. path="profile" + ".kind" → hide that const field in the branch UI
        hiddenConstPathsRef.current.add(path ? \`\${path}.\${discProp}\` : discProp);
      }
`;
  }
);

// 4) In "const field" branch: early-return if this path is a registered discriminator
// Locate the "Handle const fields" block
s = s.replace(
  /(\/\/ Handle const fields[\s\S]*?if\s*\(\s*s\s*&&[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(s,\s*"const"\)\s*\)\s*\{\s*\n)/,
  (m) => {
    if (m.includes('hiddenConstPathsRef.current.has(path)')) return m;
    changed = true;
    return m + `      // Hide discriminator consts that are registered for this path
      if (hiddenConstPathsRef.current.has(path)) {
        if (autoConstTagging) (engineRef.current as any).setValue(path, (s as any).const);
        return null;
      }
`;
  }
);

if (!changed) {
  console.log("no changes needed");
} else {
  fs.writeFileSync(p, s);
  console.log("patched", p);
}
JS

echo "[INFO] Rebuilding @totnesdev/jsf-react"
npm --workspace @totnesdev/jsf-react run build
echo "[DONE] Patch applied and package rebuilt."
