#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

REACT="packages/jsf-react/src/index.tsx"

[[ -f "$REACT" ]] || { fail "Missing $REACT (run from repo root)"; exit 1; }

info "Node: $(node -v)"
info "Repo: $(pwd)"

# 1) Try to restore a pre-nativeRequired backup
info "Searching for clean backups…"
restored=""
for f in "$REACT.bak" "$REACT.bak2" "$REACT.bak3" "$REACT.bak-native" "$REACT.orig" "$REACT.backup" "$REACT.save"; do
  if [[ -f "$f" ]]; then
    if ! grep -q "nativeRequiredMode" "$f"; then
      cp "$f" "$REACT"
      restored="$f"
      ok "Restored $REACT from $f (no nativeRequiredMode present)"
      break
    else
      warn "Backup contains nativeRequiredMode → $f (skipping)"
    fi
  fi
done

# 2) If no good backup, strip inline
if [[ -z "$restored" ]]; then
  info "No clean backup found. Stripping nativeRequiredMode from $REACT in place…"
  cp "$REACT" "$REACT.recovery.bak"
  ok "Backup created → $REACT.recovery.bak"

  node - "$REACT" <<'JS'
const fs = require('fs');
const p = process.argv[2];
let s = fs.readFileSync(p, 'utf8');
let changed = false;

// --- Remove prop typing in type/interface ---
s = s.replace(/\n\s*nativeRequiredMode\?\:\s*'off'\s*\|\s*'semantics'\s*\|\s*'enforce';?\s*\n/g, ()=>{ changed=true; return '\n'; });

// --- Remove from component props destructure defaults (arrow or function forms) ---
s = s.replace(/,\s*nativeRequiredMode\s*=\s*"semantics"\s*/g, ()=>{ changed=true; return '' ;});
s = s.replace(/\s*nativeRequiredMode\s*=\s*"semantics"\s*,\s*/g, ()=>{ changed=true; return '' ;});

// --- Remove from renderField param defaults ---
s = s.replace(/,\s*nativeRequiredMode\s*=\s*"semantics"\s*/g, ()=>{ changed=true; return '' ;});
s = s.replace(/\s*nativeRequiredMode\s*=\s*"semantics"\s*,\s*/g, ()=>{ changed=true; return '' ;});

// --- Remove passes: renderField({ nativeRequiredMode, … }) ---
s = s.replace(/renderField\(\{\s*nativeRequiredMode\s*,\s*/g, ()=>{ changed=true; return 'renderField({ '; });

// --- Remove spreads we injected for required/aria-required ---
s = s.replace(/\{\.\.\.\(required\s*&&\s*nativeRequiredMode\s*!==\s*'off'\s*\?\s*\{\s*required:\s*true,\s*'aria-required':\s*true\s*\}\s*:\s*\{\}\)\}/g,
  ()=>{ changed=true; return ''; });

// --- Remove direct attrs using nativeRequiredMode ---
s = s.replace(/\srequired=\{[^}]*nativeRequiredMode[^}]*\}\s*aria-required=\{[^}]*nativeRequiredMode[^}]*\}/g,
  ()=>{ changed=true; return ''; });

// --- Fix corrupted onChange handlers (if any prior patch mangled them) ---
s = s.replace(/onChange=\{e\s*=\s*required=\{[^}]+\}\s*aria-required=\{[^}]+\}>\s*setBranch\(/g,
  ()=>{ changed=true; return 'onChange={(e) => setBranch(';}
);
s = s.replace(/onChange=\{e\s*=\s*required=\{[^}]+\}\s*aria-required=\{[^}]+\}\s*>\s*\{/g,
  ()=>{ changed=true; return 'onChange={(e) => {';}
);
s = s.replace(/onChange=\{e\s*=/g, ()=>{ changed=true; return 'onChange={(e) =>'; });

// --- Revert form noValidate binding to plain noValidate ---
s = s.replace(/noValidate=\{nativeRequiredMode\s*!==\s*'enforce'\}/g, ()=>{ changed=true; return 'noValidate'; });

// --- Remove optional reportValidity gating block if it referenced nativeRequiredMode ---
s = s.replace(/\{\s*const\s+form\s*=\s*e\.currentTarget[\s\S]*?reportValidity\(\)[\s\S]*?}\s*/g, (m)=>{
  if (/nativeRequiredMode/.test(m)) { changed=true; return ''; }
  return m;
});

// --- Final tidy ---
s = s.replace(/\s+>/g, '>');
s = s.replace(/>\s+>/g, '>>');

if (changed) fs.writeFileSync(p, s);
console.log(changed ? "patched" : "no changes needed", p);
JS
fi

# 3) Clean React dist and rebuild
info "Cleaning dist outputs"
rm -rf packages/jsf-react/dist

# Optional deep clean & reinstall (set CLEAN_INSTALL=1 to enable)
if [[ "${CLEAN_INSTALL:-0}" == "1" ]]; then
  warn "CLEAN_INSTALL=1 → removing root node_modules + lockfile and reinstalling (can take a while)…"
  rm -rf node_modules package-lock.json
  find packages -type d -name node_modules -exec rm -rf {} +
  npm install
fi

info "Building @totnesdev/jsf-react"
npm --workspace @totnesdev/jsf-react run build

ok "React adapter builds clean. DTS step passed."
echo "If your SPA uses the Vanilla IIFE, rebuild it too:"
echo "  npm --workspace @totnesdev/jsf-vanilla run build"
