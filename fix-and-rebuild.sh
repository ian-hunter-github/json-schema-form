#!/usr/bin/env bash
set -euo pipefail

log(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

# Sanity: ensure we're in the repo root
test -d packages/jsf-core || { err "Run this from the repo root (where 'packages/' lives)."; exit 1; }

log "Node: $(node -v)"
log "Fixing tsconfig for all packages to use Bundler resolution (avoids NodeNext extension errors)"

patch_tsconfig() {
  local FILE="$1"
  node - <<'NODE' "$FILE"
const fs=require('fs'); const p=process.argv[2];
const ts=JSON.parse(fs.readFileSync(p,'utf8'));
ts.extends = "../../tsconfig.base.json";
ts.compilerOptions = Object.assign({}, ts.compilerOptions||{}, {
  outDir: "dist",
  module: "ESNext",
  moduleResolution: "Bundler"
});
fs.writeFileSync(p, JSON.stringify(ts,null,2));
console.log("patched", p);
NODE
}

patch_tsconfig packages/jsf-core/tsconfig.json
patch_tsconfig packages/jsf-react/tsconfig.json
patch_tsconfig packages/jsf-vanilla/tsconfig.json
patch_tsconfig packages/jsf-webc/tsconfig.json
ok "Per-package tsconfig switched to Bundler"

log "Ensuring JSX is enabled explicitly for React package"
node - <<'NODE'
const fs=require('fs');
const p='packages/jsf-react/tsconfig.json';
const ts=JSON.parse(fs.readFileSync(p,'utf8'));
ts.compilerOptions = Object.assign({}, ts.compilerOptions||{}, { jsx: "react-jsx" });
fs.writeFileSync(p, JSON.stringify(ts,null,2));
console.log("patched", p);
NODE
ok "JSX set to react-jsx for jsf-react"

log "Adding React type packages to the monorepo root (for JSX IntrinsicElements)"
node - <<'NODE'
const fs=require('fs');
const p='package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.devDependencies = Object.assign({}, pkg.devDependencies||{}, {
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0"
});
fs.writeFileSync(p, JSON.stringify(pkg,null,2));
console.log("patched", p);
NODE
ok "Root devDependencies updated"

log "Re-installing deps (this may take a minute)"
npm i >/dev/null
ok "Install complete"

# Helpful: make sure event handlers are typed (idempotent patch)
log "Ensuring typed event params in React/Vanilla"
perl -0777 -pe 's/onChange=\(\s*e\s*\)\s*=>\s*\{/onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {/g' \
  -i packages/jsf-react/src/index.tsx || true
perl -0777 -pe 's/addEventListener\("submit",\s*\(\s*e\s*\)\s*=>\s*\{/addEventListener("submit", (e: Event) => {/g' \
  -i packages/jsf-vanilla/src/index.ts || true
perl -0777 -pe 's/addEventListener\("change",\s*\(\s*e\s*\)\s*=>\s*\{/addEventListener("change", (e: Event) => {/g' \
  -i packages/jsf-vanilla/src/index.ts || true
perl -0777 -pe 's/\.oninput\s*=\s*\(\s*e\s*\)\s*=>\s*\{/.oninput = (e: Event) => {/g' \
  -i packages/jsf-vanilla/src/index.ts || true
ok "Event handlers typed (or already OK)"

log "Building packages sequentially"
log "  -> @ianhunterpersonal/jsf-core"
npm --workspace @ianhunterpersonal/jsf-core run build >/dev/null && ok "core built"

log "  -> @ianhunterpersonal/jsf-react"
npm --workspace @ianhunterpersonal/jsf-react run build >/dev/null && ok "react built"

log "  -> @ianhunterpersonal/jsf-vanilla"
npm --workspace @ianhunterpersonal/jsf-vanilla run build >/dev/null && ok "vanilla built"

log "  -> @ianhunterpersonal/jsf-webc"
npm --workspace @ianhunterpersonal/jsf-webc run build >/dev/null && ok "webc built"

log "  -> examples/react (vite)"
if npm --workspace examples/react run build >/dev/null; then
  ok "examples built"
else
  warn "First Vite build failed; retrying with logs…"
  npm --workspace examples/react run build
fi

echo
ok "All fixed. Next steps:"
echo "  • npm run dev:react   # start the React demo"
echo "  • open examples/spa/index.html"
