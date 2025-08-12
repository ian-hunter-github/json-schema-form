#!/usr/bin/env bash
set -euo pipefail

SCOPE="@ianhunterpersonal"      # change if you used a different scope
TAG="experimental"              # npm dist-tag you published under
APP_DIR=".verify-jsf/react-test"

info(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){   printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
fail(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

info "Creating fresh demo at $APP_DIR"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/src"

cat > "$APP_DIR/package.json" <<'JSON'
{
  "name": "react-test",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 5174"
  }
}
JSON

# Basic tsconfig for Vite + React
cat > "$APP_DIR/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
JSON

# Vite config (kept tiny)
cat > "$APP_DIR/vite.config.ts" <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()]
})
TS

# HTML shell
cat > "$APP_DIR/index.html" <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>React Verify</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML

# Entry
cat > "$APP_DIR/src/main.tsx" <<'TSX'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const el = document.getElementById('root')!
createRoot(el).render(<React.StrictMode><App/></React.StrictMode>)
TSX

# App (no CSS import to avoid style emission issues)
cat > "$APP_DIR/src/App.tsx" <<'TSX'
import React, { useState } from 'react'
import { JsonSchemaForm } from '@ianhunterpersonal/jsf-react'

const schema = {
  $id: "verify-demo",
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    priority: { type: "integer", title: "Priority", enum: [1,2,3], "x-enumNames":["Low","Medium","High"] },
    profile: {
      title: "Profile",
      oneOf: [
        { title: "Person", type: "object", properties: { kind: { const: "person" }, first: { type: "string" }, last: { type: "string" } }, required: ["kind","first","last"] },
        { title: "Company", type: "object", properties: { kind: { const: "company" }, company: { type: "string" } }, required: ["kind","company"] }
      ],
      discriminator: { propertyName: "kind" }
    }
  },
  required: ["title","priority"]
}

export default function App(){
  const [data, setData] = useState<any>({})
  return (
    <div style={{maxWidth:780, margin:"40px auto", padding:"0 16px"}}>
      <h1>@ianhunterpersonal/jsf-react — Verify</h1>
      <JsonSchemaForm
        schema={schema}
        onChange={setData}
        onSubmit={(d)=>alert(JSON.stringify(d,null,2))}
        oneOfBranchTitleVisibility="sr-only"
        constVisibility="hidden"
      />
      <pre style={{background:"#fafafa", border:"1px solid #eee", padding:8, borderRadius:8, marginTop:12}}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
TSX

pushd "$APP_DIR" >/dev/null

info "Installing deps (this can take a minute on first run)…"
# Core deps
npm i react react-dom vite @vitejs/plugin-react >/dev/null
# TS + types
npm i -D typescript @types/react @types/react-dom >/dev/null
# Your published package (don’t import CSS to keep it simple)
npm i "${SCOPE}/jsf-react@${TAG}"

info "Building…"
npm run build >/dev/null

ok "React verify app built successfully."
echo
echo "Run it locally:"
echo "  cd $APP_DIR"
echo "  npm run preview"
echo "Then open: http://localhost:5174/"
popd >/dev/null
