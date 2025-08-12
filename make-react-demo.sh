#!/usr/bin/env bash
set -euo pipefail

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){   printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

DEMO_DIR="${1:-jsf-react-demo}"
PKG_DIR="packages/jsf-react"
PKG_NAME="@ianhunterpersonal/jsf-react"

[[ -f "$PKG_DIR/package.json" ]] || { fail "Run from monorepo root. Missing $PKG_DIR/package.json"; exit 1; }

info "Node: $(node -v)"
info "Using local package: $PKG_NAME → $PKG_DIR"

info "Building $PKG_NAME"
npm --workspace "$PKG_NAME" run build
[[ -f "$PKG_DIR/dist/index.js" ]] || warn "dist/index.js not found (continuing anyway)"

info "Creating React + TS + Vite demo: $DEMO_DIR"
rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR/src"

# package.json (use file: to avoid EUNSUPPORTEDPROTOCOL on link:)
cat > "$DEMO_DIR/package.json" <<'JSON'
{
  "name": "jsf-react-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5174"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@ianhunterpersonal/jsf-react": "file:../packages/jsf-react"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0"
  }
}
JSON

# tsconfig.json
cat > "$DEMO_DIR/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
JSON

# vite.config.ts
cat > "$DEMO_DIR/vite.config.ts" <<'TS'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
TS

# index.html
cat > "$DEMO_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0" />
    <title>@ianhunterpersonal/jsf-react — Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML

# main.tsx
cat > "$DEMO_DIR/src/main.tsx" <<'TSX'
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(<App />);
TSX

# App.tsx – robust import that works with either default or named export
cat > "$DEMO_DIR/src/App.tsx" <<'TSX'
import React, { useMemo } from "react";
import * as JSF from "@ianhunterpersonal/jsf-react";
// Use whichever export the package provides:
const JsonSchemaForm: any = (JSF as any).JsonSchemaForm ?? (JSF as any).default;

import "./jsf-demo.css";

const demoSchema = {
  $id: "react-demo",
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    profile: {
      title: "Profile",
      oneOf: [
        {
          title: "Person",
          type: "object",
          properties: {
            kind: { const: "person" },
            first: { type: "string", title: "First name" },
            last: { type: "string", title: "Last name" }
          },
          required: ["kind", "first", "last"]
        },
        {
          title: "Company",
          type: "object",
          properties: {
            kind: { const: "company" },
            company: { type: "string", title: "Company name" }
          },
          required: ["kind", "company"]
        }
      ],
      discriminator: { propertyName: "kind" }
    },
    contact: {
      type: "object",
      title: "Contact",
      properties: {
        email: { type: "string", format: "email", title: "Email" },
        phone: { type: "string", title: "Phone" },
        address: {
          title: "Address",
          oneOf: [
            {
              title: "Domestic (UK)",
              type: "object",
              properties: {
                type: { const: "domestic" },
                street: { type: "string" },
                city: { type: "string" },
                postalCode: { type: "string" }
              },
              required: ["type", "street", "city", "postalCode"]
            },
            {
              title: "International",
              type: "object",
              properties: {
                type: { const: "international" },
                street: { type: "string" },
                city: { type: "string" },
                country: { type: "string" }
              },
              required: ["type", "street", "city", "country"]
            }
          ],
          discriminator: { propertyName: "type" }
        }
      },
      required: ["email"]
    },
    priority: {
      type: "integer",
      title: "Priority",
      enum: [1, 2, 3],
      "x-enumNames": ["Low", "Medium", "High"]
    },
    tags: {
      type: "array",
      title: "Tags",
      items: { type: "string", title: "Tag" }
    },
    lineItems: {
      type: "array",
      title: "Line Items",
      items: {
        type: "object",
        title: "Item",
        properties: {
          sku: { type: "string", title: "SKU" },
          qty: { type: "integer", title: "Qty" },
          price: { type: "number", title: "Price" }
        },
        required: ["sku", "qty"]
      }
    },
    metadata: {
      type: "object",
      title: "Metadata",
      properties: {},
      additionalProperties: { type: "string", title: "Value" }
    }
  },
  required: ["title", "priority"]
} as const;

export default function App() {
  const schema = useMemo(() => demoSchema, []);

  return (
    <div style={{ maxWidth: 780, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>@ianhunterpersonal/jsf-react — Demo</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Top-level & nested <code>oneOf</code>, enum, arrays (incl. array of objects), and <code>additionalProperties</code>.
      </p>

      <JsonSchemaForm
        schema={schema}
        constVisibility="readonly"
        autoConstTagging={true}
        constErrorStrategy="suppress-when-managed"
        oneOfBranchTitleVisibility="sr-only"
        oneOfBranchShowDescription={true}
        onSubmit={(data: any) => {
          alert("Submitted data:\\n" + JSON.stringify(data, null, 2));
        }}
        transformError={(e: any) => {
          if (e.keyword === "format" && e.path.endsWith("email")) {
            return { ...e, message: "Please enter a valid email address" };
          }
          return e;
        }}
        showReset
      />
    </div>
  );
}
TSX

# Minimal demo CSS (independent of package CSS export)
cat > "$DEMO_DIR/src/jsf-demo.css" <<'CSS'
:root{
  --jsf-error-bg: #fee2e2;
  --jsf-dirty-bg: #fff7ed;
  --jsf-input-border: #d1d5db;
  --jsf-radius: 8px;
}
.jsf-form { display:block; }
.jsf-field { margin: 10px 0; }
.jsf-label { display:block; margin-bottom: 4px; font-weight: 600; }
.jsf-input, .jsf-select, .jsf-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--jsf-input-border);
  border-radius: var(--jsf-radius);
}
.jsf-error { color:#b91c1c; font-size: 0.875rem; margin-top: 4px; }
.is-error .jsf-input, .is-error .jsf-select, .is-error .jsf-textarea { background: var(--jsf-error-bg); }
.is-dirty:not(.is-error) .jsf-input, .is-dirty:not(.is-error) .jsf-select, .is-dirty:not(.is-error) .jsf-textarea { background: var(--jsf-dirty-bg); }
CSS

# .gitignore
cat > "$DEMO_DIR/.gitignore" <<'GIT'
node_modules
dist
.vite
.DS_Store
GIT

ok "Files written → $DEMO_DIR"

info "Installing demo dependencies (this may take a moment)"
( cd "$DEMO_DIR" && npm install )

ok "Demo ready"

cat <<EOS

Next steps:
  cd $DEMO_DIR
  npm run dev
Then open:
  http://localhost:5173

Notes:
- The demo uses a local file dependency: "@ianhunterpersonal/jsf-react": "file:../packages/jsf-react"
- If you change the library, rebuild it in the monorepo root:
    npm --workspace @ianhunterpersonal/jsf-react run build
  then refresh your demo.
EOS
