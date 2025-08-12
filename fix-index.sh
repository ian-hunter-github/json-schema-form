#!/usr/bin/env bash
set -euo pipefail

log(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
err(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

# Sanity
test -d packages/jsf-vanilla || { err "Run this from the repo root (json-schema-form/)"; exit 1; }

log "Rebuilding @ianhunterpersonal/jsf-vanilla to ensure IIFE exists"
npm --workspace @ianhunterpersonal/jsf-vanilla run build >/dev/null
ok "Vanilla build finished"

# Verify output
if [[ ! -f packages/jsf-vanilla/dist/browser.global.js ]]; then
  err "Expected packages/jsf-vanilla/dist/browser.global.js not found"
  exit 1
fi
ok "Found dist/browser.global.js"

log "Fixing SPA demo HTML (script path + remove TS-only syntax)"
cat > examples/spa/index.html <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>JSF SPA (No Build Tools)</title>
    <style>
      :root {
        --jsf-error-bg:#ffe6e6; --jsf-dirty-bg:#fff9db; --jsf-label-color:#333;
        --jsf-input-border:#ccc; --jsf-radius:8px; --jsf-spacing-sm:6px;
        --jsf-spacing-md:10px; --jsf-spacing-lg:16px; --jsf-font-size-sm:12px;
        --jsf-font-size-md:14px; --jsf-font-size-lg:16px;
      }
      .jsf-field { margin-bottom: var(--jsf-spacing-lg); }
      .jsf-label { display:block; margin-bottom: var(--jsf-spacing-sm); }
      .jsf-input, .jsf-select { width:100%; padding:8px; border:1px solid var(--jsf-input-border); border-radius: var(--jsf-radius); }
      .jsf-error { color:#b00020; font-size:12px; margin-top:4px; }
      .is-error { background: var(--jsf-error-bg); padding:6px; border-radius: var(--jsf-radius); }
    </style>
  </head>
  <body>
    <h1>JSON Schema Form (SPA)</h1>
    <div id="mount"></div>

    <!-- Use the IIFE bundle that defines window.JSFVanilla -->
    <script src="../../packages/jsf-vanilla/dist/browser.global.js"></script>
    <script type="module">
      function getParams() {
        const p = new URLSearchParams(location.search);
        return {
          schema: p.get("schema") ? JSON.parse(p.get("schema")) : null,
          schema_url: p.get("schema_url"),
          debug: p.get("debug") === "true"
        };
      }

      async function loadSchema() {
        const params = getParams();
        if (params.schema) return params.schema;
        if (params.schema_url) {
          const res = await fetch(params.schema_url, { cache: "no-store" });
          return await res.json();
        }
        return {
          type: "object",
          properties: {
            title: { type: "string", title: "Title" },
            email: { type: "string", format: "email", title: "Email" },
            priority: { type: "integer", enum: [1,2,3], "x-enumNames": ["Low","Med","High"] }
          },
          required: ["title","email"]
        };
      }

      (async () => {
        const schema = await loadSchema();
        if (!window.JSFVanilla) {
          console.error("JSFVanilla global not found. Check script path to browser.global.js");
          return;
        }
        const handle = window.JSFVanilla.renderJsonSchemaForm(
          document.getElementById("mount"),
          { schema, debug: getParams().debug }
        );
        window.handle = handle;
      })();
    </script>
  </body>
</html>
HTML
ok "SPA HTML updated"

echo
ok "All set. Open examples/spa/index.html again."
echo "Tip: If you still see a stale error, hard refresh the browser (⌘+Shift+R)."
