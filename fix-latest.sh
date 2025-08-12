#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){   printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

PKG_DIR="packages/jsf-react"
PKG_JSON="$PKG_DIR/package.json"
CSS_SRC="$PKG_DIR/src/index.css"
COPY_SCRIPT="$PKG_DIR/scripts/copy-css.cjs"
DEMO_CSS_IMPORT="import '@totnesdev/jsf-react/styles.css';"

[[ -f "$PKG_JSON" ]] || { fail "Run from monorepo root. Missing $PKG_JSON"; exit 1; }

info "Node: $(node -v)"
info "Patching $PKG_DIR for standalone CSS export"

# 1) Ensure a minimal CSS source exists (safe to overwrite only if missing)
if [[ ! -f "$CSS_SRC" ]]; then
  info "Creating $CSS_SRC"
  mkdir -p "$(dirname "$CSS_SRC")"
  cat > "$CSS_SRC" <<'CSS'
:root {
  --jsf-error-bg: #fee2e2;
  --jsf-dirty-bg: #fff7ed;
  --jsf-label-color: #111827;
  --jsf-input-border: #d1d5db;
  --jsf-radius: 8px;
  --jsf-spacing-sm: 6px;
  --jsf-spacing-md: 10px;
  --jsf-spacing-lg: 16px;
  --jsf-font-size-sm: 0.875rem;
  --jsf-font-size-md: 1rem;
  --jsf-font-size-lg: 1.125rem;
}
.jsf-form { display:block; }
.jsf-field { margin: var(--jsf-spacing-md) 0; }
.jsf-label { display:block; margin-bottom: 4px; font-weight: 600; color: var(--jsf-label-color); }
.jsf-input, .jsf-select, .jsf-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--jsf-input-border);
  border-radius: var(--jsf-radius);
  font-size: var(--jsf-font-size-md);
}
.jsf-error { color:#b91c1c; font-size: var(--jsf-font-size-sm); margin-top: 4px; }
.is-error .jsf-input, .is-error .jsf-select, .is-error .jsf-textarea { background: var(--jsf-error-bg); }
.is-dirty:not(.is-error) .jsf-input, .is-dirty:not(.is-error) .jsf-select, .is-dirty:not(.is-error) .jsf-textarea { background: var(--jsf-dirty-bg); }
CSS
  ok "Wrote default CSS"
else
  info "CSS already present: $CSS_SRC"
fi

# 2) Write CJS postbuild copier (works even with "type":"module")
info "Writing postbuild copier → $COPY_SCRIPT"
mkdir -p "$(dirname "$COPY_SCRIPT")"
cat > "$COPY_SCRIPT" <<'CJS'
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
CJS
ok "Postbuild copier ready"

# 3) Patch package.json (ESM-safe inline patch via --input-type=module)
info "Patching $PKG_JSON (exports.styles.css, sideEffects, files, build)"
node --input-type=module -e '
  import fs from "node:fs";
  import path from "node:path";
  const pkgPath = process.argv.at(-1);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  // Ensure files includes dist
  pkg.files = Array.isArray(pkg.files) ? Array.from(new Set([...pkg.files, "dist"])) : ["dist"];

  // Ensure sideEffects includes dist/styles.css (so bundlers keep it)
  const se = pkg.sideEffects;
  if (se === true) {
    // leave as-is
  } else if (se === false || se == null) {
    pkg.sideEffects = ["./dist/styles.css"];
  } else if (Array.isArray(se)) {
    if (!se.includes("./dist/styles.css")) pkg.sideEffects = [...se, "./dist/styles.css"];
  } else {
    pkg.sideEffects = ["./dist/styles.css"];
  }

  // Exports: keep existing; add subpath for CSS
  pkg.exports = pkg.exports ?? {};
  // normalize main export to object shape if needed (do not overwrite)
  if (typeof pkg.exports === "string") {
    pkg.exports = { ".": pkg.exports };
  }
  // ensure dot export object has types/import/require if they already exist; leave them untouched

  // add styles subpath
  pkg.exports["./styles.css"] = "./dist/styles.css";

  // Optional "style" field (hint for some tools)
  pkg.style = "./dist/styles.css";

  // Build script: append copy step if not already present
  pkg.scripts = pkg.scripts ?? {};
  const build = pkg.scripts.build || "tsup src/index.tsx --dts --format esm,cjs --clean";
  if (!build.includes("node scripts/copy-css.cjs")) {
    pkg.scripts.build = build + " && node scripts/copy-css.cjs";
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("[patched]", path.relative(process.cwd(), pkgPath));
' "$PKG_JSON"
ok "package.json patched"

# 4) Rebuild the package
info "Rebuilding @totnesdev/jsf-react"
npm --workspace @totnesdev/jsf-react run build

# 5) Verify output
if [[ -f "$PKG_DIR/dist/styles.css" ]]; then
  ok "CSS emitted → $PKG_DIR/dist/styles.css"
else
  fail "CSS was not emitted. Check build logs."
  exit 1
fi

# 6) If a local demo exists, switch import to the new subpath
if [[ -d "jsf-react-demo" && -f "jsf-react-demo/src/App.tsx" ]]; then
  info "Patching demo CSS import in jsf-react-demo/src/App.tsx"
  # Remove old imports pointing at dist/index.css
  sed -i.bak "/@totnesdev\/jsf-react\/dist\/index.css/d" jsf-react-demo/src/App.tsx || true
  # Ensure styles.css import exists
  if ! grep -q "@totnesdev/jsf-react/styles.css" jsf-react-demo/src/App.tsx; then
    # insert after the React imports block
    awk '
      BEGIN{inserted=0}
      /^import / && inserted==0 {print; next}
      {
        if (!inserted) {
          print "import '\x40totnesdev/jsf-react/styles.css';"
          inserted=1
        }
        print
      }
    ' jsf-react-demo/src/App.tsx > jsf-react-demo/src/App.tsx.tmp && mv jsf-react-demo/src/App.tsx.tmp jsf-react-demo/src/App.tsx
  fi
  ok "Demo import updated"
  echo "→ Reinstall inside demo to pick up local file dep changes:"
  echo "   (cd jsf-react-demo && npm install)"
fi

ok "All set. Consumers can now do:"
echo "  import '@totnesdev/jsf-react/styles.css';"
