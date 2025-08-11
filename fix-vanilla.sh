#!/usr/bin/env bash
set -euo pipefail

log(){ printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m[DONE]\033[0m %s\n" "$*"; }
err(){ printf "\033[1;31m[FAIL]\033[0m %s\n" "$*"; }

test -f packages/jsf-vanilla/src/index.ts || { err "Run this from json-schema-form/"; exit 1; }

log "Patching vanilla adapter for immediate re-render + stable caret"
cat > packages/jsf-vanilla/src/index.ts <<'TS'
import { createEngine, getByPath, sanitizeId } from "@totnesdev/jsf-core";
import type { JSONSchema } from "@totnesdev/jsf-core";

export type VanillaOptions = {
  schema: JSONSchema;
  initialData?: any;
  classNamePrefix?: string;
  debug?: boolean;
  keepDataOnOneOfSwitch?: boolean;
};

export function renderJsonSchemaForm(target: HTMLElement | string, opts: VanillaOptions) {
  let containerSchema = opts.schema;
  const el = typeof target === "string" ? document.querySelector(target)! : target;
  const prefix = (c: string) => (opts.classNamePrefix ?? "jsf-") + c;
  let engine = createEngine(containerSchema, opts.initialData, { keepDataOnOneOfSwitch: opts.keepDataOnOneOfSwitch });

  function clear() { while (el.firstChild) el.removeChild(el.firstChild); }

  function render() {
    // Save focus/caret so typing doesn't feel janky
    const active = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    const save =
      active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ? { id: active.id, start: (active as HTMLInputElement).selectionStart, end: (active as HTMLInputElement).selectionEnd }
        : null;

    clear();
    const form = document.createElement("form");
    form.className = prefix("form");
    form.addEventListener("submit", (e: Event) => {
      e.preventDefault();
      engine.validate();
      el.dispatchEvent(new CustomEvent("jsf-submit", { detail: engine.getState().data }));
      if (opts.debug) alert(JSON.stringify(engine.getState().data, null, 2));
    });

    const state = engine.getState();

    const renderField = (schema: any, path: string, required: boolean) => {
      const t = Array.isArray(schema?.type) ? schema.type.find((x: any) => x !== "null") : schema?.type;
      const id = sanitizeId(path);
      const wrap = document.createElement("div");
      wrap.className = prefix("field");
      wrap.setAttribute("data-field-name", path);
      wrap.setAttribute("data-field-type", String(t ?? "unknown"));

      const label = document.createElement("label");
      label.className = prefix("label");
      label.htmlFor = id;
      const title = (schema.title ?? path.split(".").slice(-1)[0]) || "field";
      label.textContent = title + (required ? " *" : "");
      wrap.appendChild(label);

      const error = state.errors.find(e => e.path === path);

      // Enums
      if (Array.isArray(schema.enum)) {
        const sel = document.createElement("select");
        sel.className = prefix("select");
        sel.id = id;
        const opt0 = document.createElement("option");
        opt0.value = ""; opt0.textContent = "-- select --";
        sel.appendChild(opt0);
        const value = getByPath(state.data, path);
        const strValue = typeof value === "string" ? value : (value == null ? "" : JSON.stringify(value));
        sel.value = strValue;
        const labels: string[] = (schema["x-enumNames"] || schema["x-enum-labels"] || schema.enum).map((x: any) => String(x));
        schema.enum.forEach((v: any, i: number) => {
          const o = document.createElement("option");
          o.value = typeof v === "string" ? v : JSON.stringify(v);
          o.textContent = labels[i];
          sel.appendChild(o);
        });
        sel.addEventListener("change", (_e: Event) => {
          let v: any = sel.value;
          if (schema.enum.some((x: any) => typeof x !== "string")) {
            try { v = JSON.parse(v); } catch {}
          }
          engine.setValue(path, v);
          render(); // re-render immediately so errors/dirty clear
          el.dispatchEvent(new CustomEvent("jsf-change", { detail: engine.getState().data }));
        });
        wrap.appendChild(sel);
      }
      // Objects (+ additionalProperties)
      else if (t === "object" || schema.properties) {
        const fs = document.createElement("fieldset");
        fs.className = prefix("object");
        const lg = document.createElement("legend");
        lg.className = prefix("label");
        lg.textContent = title + (required ? " *" : "");
        fs.appendChild(lg);
        const req: string[] = schema.required || [];
        Object.entries(schema.properties || {}).forEach(([k, s]) => {
          fs.appendChild(renderField(s as any, path ? `${path}.${k}` : k, req.includes(k)));
        });
        if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
          const objVal = getByPath(state.data, path) || {};
          const holder = document.createElement("div");
          holder.style.marginTop = "6px";
          const titleEl = document.createElement("strong");
          titleEl.textContent = "Additional properties";
          holder.appendChild(titleEl);
          Object.keys(objVal).filter(k => !(schema.properties || {})[k]).forEach((k) => {
            const row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "1fr auto";
            row.style.gap = "8px";
            row.style.marginTop = "6px";
            row.appendChild(renderField(schema.additionalProperties, path ? `${path}.${k}` : k, false));
            const rm = document.createElement("button");
            rm.type = "button"; rm.textContent = "Remove";
            rm.onclick = () => {
              const next = { ...engine.getState().data };
              const segs = path ? path.split(".") : [];
              let cur: any = next;
              for (const seg of segs) { cur[seg] = cur[seg] ?? {}; cur = cur[seg]; }
              delete cur[k];
              engine.reset(next);
              render();
              el.dispatchEvent(new CustomEvent("jsf-change", { detail: engine.getState().data }));
            };
            row.appendChild(rm);
            holder.appendChild(row);
          });
          const addRow = document.createElement("div");
          addRow.style.display = "flex";
          addRow.style.gap = "8px";
          addRow.style.marginTop = "8px";
          const keyInp = document.createElement("input");
          keyInp.placeholder = "new key";
          keyInp.className = prefix("input");
          keyInp.id = id + "-ap-key";
          const addBtn = document.createElement("button");
          addBtn.type = "button"; addBtn.textContent = "Add";
          addBtn.onclick = () => {
            const key = (keyInp.value || "").trim();
            if (!key) return;
            const next = { ...engine.getState().data };
            const segs = path ? path.split(".") : [];
            let cur: any = next;
            for (const seg of segs) { cur[seg] = cur[seg] ?? {}; cur = cur[seg]; }
            if (cur[key] !== undefined) return;
            cur[key] = undefined;
            engine.reset(next);
            render();
            el.dispatchEvent(new CustomEvent("jsf-change", { detail: engine.getState().data }));
            keyInp.value = "";
          };
          addRow.appendChild(keyInp);
          addRow.appendChild(addBtn);
          holder.appendChild(addRow);
          fs.appendChild(holder);
        }
        wrap.appendChild(fs);
      }
      // Arrays
      else if (t === "array" || schema.items) {
        const arrWrap = document.createElement("div");
        const items = Array.isArray(getByPath(state.data, path)) ? getByPath(state.data, path) : [];
        items.forEach((_v: any, i: number) => {
          arrWrap.appendChild(renderField(schema.items, `${path}.${i}`, false));
          const rm = document.createElement("button");
          rm.type = "button";
          rm.textContent = "Remove";
          rm.onclick = () => { engine.removeArrayItem(path, i); render(); };
          arrWrap.appendChild(rm);
        });
        const add = document.createElement("button");
        add.type = "button";
        add.textContent = "Add";
        add.onclick = () => { engine.addArrayItem(path); render(); };
        arrWrap.appendChild(add);
        wrap.appendChild(arrWrap);
      }
      // Primitive (string/number/integer/boolean with formats)
      else {
        const format = schema.format;
        const input = document.createElement("input");
        input.className = prefix("input");
        input.id = id;
        input.type =
          (format === "date" && "date") ||
          (format === "time" && "time") ||
          (format === "date-time" && "datetime-local") ||
          (format === "email" && "email") ||
          (format === "uri" && "url") ||
          (format === "password" && "password") ||
          (t === "number" || t === "integer") ? "number" :
          (t === "boolean") ? "checkbox" : "text";

        const value = getByPath(state.data, path);
        if (input.type === "checkbox") (input as HTMLInputElement).checked = !!value;
        else (input as HTMLInputElement).value = value ?? "";

        // Use onchange for checkboxes; oninput for text-like inputs
        if (input.type === "checkbox") {
          (input as HTMLInputElement).onchange = (_e: Event) => {
            const v = (input as HTMLInputElement).checked;
            engine.setValue(path, v);
            render();
            el.dispatchEvent(new CustomEvent("jsf-change", { detail: engine.getState().data }));
          };
        } else {
          (input as HTMLInputElement).oninput = (_e: Event) => {
            let v: any = (input as HTMLInputElement).value;
            if (t === "integer" || t === "number") v = v === "" ? undefined : Number(v);
            engine.setValue(path, v);
            render();
            el.dispatchEvent(new CustomEvent("jsf-change", { detail: engine.getState().data }));
          };
        }
        wrap.appendChild(input);
      }

      if (error) {
        const em = document.createElement("div");
        em.className = prefix("error");
        em.id = id + "-err";
        em.textContent = error.message!;
        wrap.appendChild(em);
        wrap.classList.add("is-error");
      }

      return wrap;
    };

    const req: string[] = (containerSchema as any).required || [];
    if ((containerSchema as any).type === "object" || (containerSchema as any).properties) {
      Object.entries((containerSchema as any).properties || {}).forEach(([k, s]) => {
        form.appendChild(renderField(s as any, k, req.includes(k)));
      });
    } else {
      form.appendChild(renderField(containerSchema, "", false));
    }

    const submit = document.createElement("button");
    submit.type = "submit"; submit.textContent = "Submit";
    form.appendChild(submit);
    el.appendChild(form);

    // Restore focus/caret after render
    if (save?.id) {
      const re = document.getElementById(save.id) as HTMLInputElement | null;
      if (re) {
        re.focus();
        try {
          if (save.start != null && save.end != null) re.setSelectionRange(save.start, save.end);
        } catch {}
      }
    }
  }

  render();

  return {
    getData: () => engine.getState().data,
    setData: (d: any) => { engine.reset(d); render(); },
    setSchema: (s: JSONSchema) => { containerSchema = s; engine.setSchema(s); render(); },
    validate: () => engine.validate(),
    reset: () => { engine.reset(); render(); },
    destroy: () => clear()
  };
}
TS

log "Rebuilding @totnesdev/jsf-vanilla (and core just in case)"
npm --workspace @totnesdev/jsf-vanilla run build >/dev/null
ok "jsf-vanilla rebuilt"

echo
ok "Patch applied. Reload the SPA at examples/spa/index.html (hard refresh: ⌘+Shift+R)."
echo "You should see: (1) Title error clears as you type, (2) Email accepts typing normally."
