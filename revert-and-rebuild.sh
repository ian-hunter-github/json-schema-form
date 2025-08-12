#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){   printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

# Sanity checks
[[ -d .git ]] || { fail "No .git directory here. Run from the repo root."; exit 1; }

info "Node: $(node -v)"
info "NPM : $(npm -v)"
info "Repo: $(pwd)"

# 1) Reset working tree to local HEAD
info "Resetting working tree to HEAD (discarding local changes)"
git reset --hard HEAD

# 2) Clean ignored/untracked build artifacts (keeps tracked files only)
info "Cleaning ignored artifacts (node_modules, dist, cache, etc.)"
git clean -ffdX

# 3) Fresh install
info "Installing root dependencies"
if npm ci >/dev/null 2>&1; then
  ok "npm ci complete"
else
  warn "npm ci failed (perhaps lock mismatch). Falling back to npm install."
  npm install
  ok "npm install complete"
fi

# 4) Build all packages
if npm run | grep -qE '^\s*build'; then
  info "Running root build script"
  npm run build
  ok "Root build finished"
else
  warn "No root build script found. Building workspaces individually."

  # Core
  if [[ -f packages/jsf-core/package.json ]]; then
    info "Building @ianhunterpersonal/jsf-core"
    npm --workspace @ianhunterpersonal/jsf-core run build
    ok "core built"
  fi

  # React
  if [[ -f packages/jsf-react/package.json ]]; then
    info "Building @ianhunterpersonal/jsf-react"
    npm --workspace @ianhunterpersonal/jsf-react run build
    ok "react built"
  fi

  # Vanilla
  if [[ -f packages/jsf-vanilla/package.json ]]; then
    info "Building @ianhunterpersonal/jsf-vanilla"
    npm --workspace @ianhunterpersonal/jsf-vanilla run build
    ok "vanilla built"
  fi

  # Web Component
  if [[ -f packages/jsf-webc/package.json ]]; then
    info "Building @ianhunterpersonal/jsf-webc"
    npm --workspace @ianhunterpersonal/jsf-webc run build
    ok "webc built"
  fi
fi

# 5) Build Vite example (if workspace exists)
if npm query .workspace --silent 2>/dev/null | grep -q '"jsf-examples-react"'; then
  info "Building examples/react (Vite)"
  if npm --workspace jsf-examples-react run build; then
    ok "examples/react built"
  else
    warn "examples/react build failed; check logs"
  fi
elif [[ -f examples/react/package.json ]]; then
  info "Building examples/react directly"
  (cd examples/react && npm install && npm run build) || warn "examples/react build failed"
fi

# 6) Reinstall demo app (if present)
if [[ -d jsf-react-demo && -f jsf-react-demo/package.json ]]; then
  info "Refreshing local demo (jsf-react-demo)"
  (cd jsf-react-demo && npm install) || warn "Demo install failed"
  ok "Demo ready. To run: (cd jsf-react-demo && npm run dev)"
fi

ok "All done. Repo is reset to HEAD and rebuilt."
