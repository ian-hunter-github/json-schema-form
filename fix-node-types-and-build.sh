# scripts/fix-node-types-and-build.sh
#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }

info "Installing @types/node at repo root (WITHOUT workspaces)"
npm install -D @types/node --workspaces=false

# Make sure each package has its own dev deps (tsup, etc.)
for pkg in packages/jsf-core packages/jsf-vanilla packages/jsf-react; do
  info "Installing deps in $pkg (no workspaces)"
  npm --prefix "$pkg" install --workspaces=false
done

info "Building packages in dependency order: core → vanilla → react"
npm --workspace @ianhunterpersonal/jsf-core run build
npm --workspace @ianhunterpersonal/jsf-vanilla run build
npm --workspace @ianhunterpersonal/jsf-react run build

ok "Builds complete."
