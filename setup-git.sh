#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

ROOT="$(pwd)"
[[ -f package.json ]] || { fail "No package.json found here. Run from repo root."; exit 1; }
[[ -d packages ]] || warn "packages/ not found — continuing anyway."

# Flags:
#   RESET=1   — remove existing .git and re-init
#   BRANCH=…  — branch name (default: main)
BRANCH="${BRANCH:-main}"

info "Repository: $ROOT"
info "Branch: $BRANCH"

if [[ -d .git ]]; then
  if [[ "${RESET:-0}" == "1" ]]; then
    warn ".git exists — removing due to RESET=1"
    rm -rf .git
    ok "Removed existing .git"
  else
    warn ".git already exists. To re-init, re-run with RESET=1"
  fi
fi

if [[ ! -d .git ]]; then
  info "Initializing Git repository"
  if git init -b "$BRANCH" >/dev/null 2>&1; then
    ok "git init -b $BRANCH"
  else
    info "Older Git detected; creating branch '$BRANCH' manually"
    git init
    git checkout -b "$BRANCH"
    ok "git init + checkout -b $BRANCH"
  fi
fi

info "Writing .gitignore"
cat > .gitignore <<'GITIGNORE'
# macOS
.DS_Store

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
*.log

# Build outputs
dist/
build/
*.tsbuildinfo
packages/*/dist/
examples/react/dist/
examples/react/.vite/

# Coverage
coverage/

# Env files
.env
.env.*
!.env.example

# Editors/IDE
.vscode/
.idea/

# Cache
.cache/
.tmp/
.GitHub/
GITIGNORE
ok ".gitignore written"

info "Writing .gitattributes"
cat > .gitattributes <<'GITATTR'
* text=auto eol=lf

# Mark built artifacts as generated
packages/*/dist/* linguist-generated=true
examples/react/dist/* linguist-generated=true

# Binary assets
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.webp binary
*.ico binary
GITATTR
ok ".gitattributes written"

# Optional: root README exists already; skip.
# Stage everything
info "Staging files"
git add -A

# Initial commit
info "Creating initial commit"
git commit -m "chore(repo): initial import (monorepo: core/react/vanilla/webc + examples)" >/dev/null || {
  warn "Nothing to commit (working tree clean)"
}

# Helpful tags (optional): set TAG=v0.0.1-beta.1 to create a local tag
if [[ -n "${TAG:-}" ]]; then
  info "Tagging ${TAG}"
  git tag -a "${TAG}" -m "Release ${TAG}" || warn "Could not create tag ${TAG}"
fi

ok "Git setup complete (no remote configured)."

cat <<'NEXT'

Next steps:
  • Inspect history:        git log --oneline --graph --decorate --all
  • See status:             git status
  • Add a remote later:     git remote add origin <url> && git push -u origin $(git branch --show-current)
  • (Optional) create a tag: TAG=v0.0.1-beta.1 ./setup-git.sh
  • (Optional) re-init:     RESET=1 ./setup-git.sh

Tip:
  You can keep this script for future repos; it’s idempotent and won’t clobber .git unless RESET=1.
NEXT
