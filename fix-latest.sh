#!/usr/bin/env bash
set -euo pipefail

FILE="packages/jsf-react/src/index.tsx"

echo "[INFO] Patching oneOf branch legend visibility in $FILE"
[[ -f "$FILE" ]] || { echo "[FAIL] $FILE not found (run from repo root)"; exit 1; }

cp "$FILE" "$FILE.bak.oneof-legend" && echo "[DONE] Backup → $FILE.bak.oneof-legend"

node - "$FILE" <<'JS'
const fs = require('fs');
const p = process.argv[2];
let s = fs.readFileSync(p, 'utf8');
let changed = false;

// 1) Ensure the component destructure includes defaulted prop
if (!/oneOfBranchTitleVisibility\s*=/.test(s)) {
  s = s.replace(
    /debug\s*=\s*false,\s*\n\s*constVisibility[\s\S]*?constErrorStrategy\s*=\s*"suppress-when-managed",/,
    (m)=> m + `\n  oneOfBranchTitleVisibility = 'sr-only',`
  );
  changed = true;
}

// 2) Pass the prop down when rendering the selected oneOf branch
// Find the oneOf/anyOf block's RenderField call and add branchLegendVisibility prop.
if (!/branchLegendVisibility=\{oneOfBranchTitleVisibility\}/.test(s)) {
  s = s.replace(
    /<RenderField\s+schema=\{group\[idx\]\}\s+path=\{path\}\s+required=\{required\}\s*\/>/,
    `<RenderField schema={group[idx]} path={path} required={required} branchLegendVisibility={oneOfBranchTitleVisibility} />`
  );
  changed = true;
}

// 3) Add the optional prop to the RenderField typing
if (!/branchLegendVisibility\?\:\s*'sr-only'\s*\|\s*'hidden'\s*\|\s*'visible'/.test(s)) {
  s = s.replace(
    /const RenderField: React\.FC<\{\s*([\s\S]*?)\}\>\s*=\s*\(\{\s*schema:\s*s,\s*path,\s*required\s*\}\)/,
    (m, inner) => {
      const innerNew = inner.replace(/required:\s*boolean;?/, 'required: boolean;\n    branchLegendVisibility?: \'sr-only\' | \'hidden\' | \'visible\';');
      return `const RenderField: React.FC<{ ${innerNew} }> = ({ schema: s, path, required, branchLegendVisibility })`;
    }
  );
  changed = true;
}

// 4) Make the object legend conditional (hidden/sr-only/visible)
// Replace the static legend block with a conditional render.
const legendRe = /<legend className=\{prefix\("label"\)\}>\s*\{title\}\s*\{required \? " \*" : ""\}\s*<\/legend>/;
if (legendRe.test(s) && !/branchLegendVisibility \?\?/.test(s)) {
  s = s.replace(
    legendRe,
`{(() => {
  const vis = branchLegendVisibility ?? 'visible';
  if (vis === 'hidden') return null;
  const srStyle = vis === 'sr-only'
    ? { position:'absolute', width:1, height:1, padding:0, margin:-1, overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }
    : undefined;
  return (
    <legend className={prefix("label")} style={srStyle}>
      {title}
      {required ? " *" : ""}
    </legend>
  );
})()}`}
  );
  changed = true;
}

if (!changed) {
  console.log("no changes needed");
} else {
  fs.writeFileSync(p, s);
  console.log("patched", p);
}
JS

echo "[INFO] Rebuilding @ianhunterpersonal/jsf-react"
npm --workspace @ianhunterpersonal/jsf-react run build

echo "[DONE] oneOf branch legend visibility patched and built."
