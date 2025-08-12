#!/usr/bin/env bash
set -euo pipefail

SCOPE="@ianhunterpersonal"
TAG="${1:-experimental}"   # allow: ./verify-published-packages.sh latest

echo "[INFO] Using scope: $SCOPE, tag: $TAG"
echo

echo "[STEP] Check dist-tags & versions"
for P in jsf-core jsf-vanilla jsf-react; do
  echo -n "  - $SCOPE/$P → "
  npm view "$SCOPE/$P" dist-tags version 2>/dev/null || { echo "NOT FOUND"; exit 1; }
done
echo

WORK=".verify-jsf"
rm -rf "$WORK"
mkdir -p "$WORK"
pushd "$WORK" >/dev/null

echo "[STEP] Smoke test: core (ESM import + validate)"
mkdir core && cd core
npm init -y >/dev/null
npm i "$SCOPE/jsf-core@$TAG" >/dev/null
cat > smoke.mjs <<'JS'
import { createEngine } from "@ianhunterpersonal/jsf-core";
const schema = { type:"object", properties:{ email:{ type:"string", format:"email" }}, required:["email"] };
const engine = createEngine(schema, { email:"a@b.co" });
const ok = engine.validate();
if (!ok) { console.error("core validate failed", engine.getState().errors); process.exit(1); }
console.log("core: OK");
JS
node smoke.mjs
cd ..

echo "[STEP] Smoke test: vanilla (ESM import exists)"
mkdir vanilla-esm && cd vanilla-esm
npm init -y >/dev/null
npm i "$SCOPE/jsf-vanilla@$TAG" >/dev/null
node -e "import('@ianhunterpersonal/jsf-vanilla').then(m=>{console.log(typeof m.renderJsonSchemaForm==='function'?'vanilla-esm: OK':'vanilla-esm: MISSING')}).catch(e=>{console.error(e);process.exit(1)})"
cd ..

echo "[STEP] Smoke test: react (typecheck & build)"
# Create a tiny vite react-ts app and compile it (no dev server)
npm create vite@latest react-test -- --template react-ts >/dev/null 2>&1
cd react-test
npm i >/dev/null
npm i "$SCOPE/jsf-react@$TAG" >/dev/null

# Try to import CSS if exposed; fall back gracefully if not present.
cat > src/App.tsx <<'TSX'
import { useMemo } from "react";
import { JsonSchemaForm } from "@ianhunterpersonal/jsf-react";
try { await import("@ianhunterpersonal/jsf-react/dist/index.css"); } catch {}

const schema = {
  $id:"verify-react",
  type:"object",
  properties:{
    title:{ type:"string", title:"Title" },
    priority:{ type:"integer", enum:[1,2,3], "x-enumNames":["Low","Medium","High"], title:"Priority" }
  },
  required:["title","priority"]
};

export default function App(){
  const s = useMemo(()=>schema,[]);
  return (
    <div style={{maxWidth:680,margin:"40px auto",padding:"0 16px"}}>
      <h1>React verify</h1>
      <JsonSchemaForm
        schema={s}
        onChange={(d)=>{ /* no-op */ }}
        onSubmit={(d)=>{ console.log("react-submit", d); }}
      />
    </div>
  );
}
TSX

# Build (ensures TS + bundler can resolve the package)
npm run build >/dev/null
echo "react: OK (vite build passed)"
cd ..

echo
echo "[DONE] All smoke tests completed."
echo "       For a live react run, cd $WORK/react-test && npm run dev"
popd >/dev/null
