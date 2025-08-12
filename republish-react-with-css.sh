
#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="packages/jsf-react"
TAG="experimental"
NEW_VERSION="0.0.1-beta.3"

echo "[INFO] Patching $PKG_DIR to ship CSS…"

# 1) Ensure a CSS source exists
mkdir -p "$PKG_DIR/src"
if [[ ! -f "$PKG_DIR/src/index.css" ]]; then
  cat > "$PKG_DIR/src/index.css" <<'CSS'
/* Minimal default styles for jsf-react */
.jsf-form { display:block; }
.jsf-field { margin: 8px 0; }
.jsf-label { display:block; font-weight:600; margin-bottom:4px; }
.jsf-input, .jsf-select { width:100%; padding:6px 8px; border:1px solid #ccc; border-radius:6px; }
.jsf-error { color:#b91c1c; font-size:0.92em; margin-top:4px; }
.jsf-object { border:1px solid #eee; padding:8px; border-radius:8px; }
CSS
  echo "[DONE] Wrote src/index.css"
else
  echo "[INFO] Found src/index.css"
fi

# 2) Make sure build copies CSS → dist/index.css (no import required in JS)
#    Add/merge exports for the CSS subpath and sideEffects
jq '
  .files = ( .files // ["dist/*"] ) |
  .sideEffects = ( ( .sideEffects | if type=="array" then . else [] end ) + ["dist/index.css"] | unique ) |
  .exports = (
    .exports // {} |
    . as $root |
    ($root + {
      ".": {
        "import": "./dist/index.js",
        "require": "./dist/index.cjs",
        "types": "./dist/index.d.ts"
      },
      "./dist/index.css": "./dist/index.css"
    })
  ) |
  .scripts.build = "tsup src/index.tsx --dts --format esm,cjs --clean && mkdir -p dist && cp src/index.css dist/index.css"
' "$PKG_DIR/package.json" > "$PKG_DIR/package.json.tmp"
mv "$PKG_DIR/package.json.tmp" "$PKG_DIR/package.json"
echo "[DONE] Updated package.json (exports + sideEffects + build copier)"

# 3) Rebuild
( cd "$PKG_DIR" && npm run build )

# 4) Bump prerelease and publish with tag
( cd "$PKG_DIR" && npm version "$NEW_VERSION" --no-git-tag-version )
( cd "$PKG_DIR" && npm publish --access public --tag "$TAG" )

echo "[DONE] Published @ianhunterpersonal/jsf-react@$NEW_VERSION (tag: $TAG)"
echo "Consumers can now import: import '@ianhunterpersonal/jsf-react/dist/index.css';"
