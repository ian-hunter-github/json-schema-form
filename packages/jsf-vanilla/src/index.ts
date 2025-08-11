// Vanilla adapter with const options + focus-preserving, debounced rerenders
import { createEngine, getByPath, sanitizeId } from "@totnesdev/jsf-core";
import type { JSONSchema, ValidationError } from "@totnesdev/jsf-core";

type ValidateCtx = { valid: boolean; errors: ValidationError[]; data: any; ts: number };
type ChangeCtx = { path: string; value: any; data: any; schema: JSONSchema; ts: number };

type ConstVisibility = "hidden" | "readonly" | "visible";
type ConstErrorStrategy = "suppress-when-managed" | "show";

export type VanillaOptions = {
  nativeRequiredMode?: 'off' | 'semantics' | 'enforce';
  oneOfBranchTitleVisibility?: 'sr-only' | 'hidden' | 'visible';
  oneOfBranchShowDescription?: boolean;
  schema: JSONSchema;
  initialData?: any;
  classNamePrefix?: string;
  debug?: boolean;
  debounceMs?: number;
  keepDataOnOneOfSwitch?: boolean;

  constVisibility?: ConstVisibility;           // default 'hidden'
  autoConstTagging?: boolean;                  // default true
  constErrorStrategy?: ConstErrorStrategy;     // default 'suppress-when-managed'

  onChange?: (data: any) => void;
  onSubmit?: (data: any) => void;
  onSubmitFailed?: (ctx: ValidateCtx) => void;
  onValidate?: (ctx: ValidateCtx) => void;
  onBeforeChange?: (ctx: ChangeCtx) => boolean | void;
  onAfterChange?: (ctx: ChangeCtx) => void;
  onBeforeSubmit?: (ctx: ValidateCtx) => boolean | void;
  onBranchChange?: (info: { path: string; index: number }) => void;
  onArrayAdd?: (info: { path: string; index: number }) => void;
  onArrayRemove?: (info: { path: string; index: number }) => void;
  onReset?: (data: any) => void;
  onSchemaLoad?: (schema: JSONSchema) => void;
  transformError?: (e: ValidationError) => ValidationError | null;
};

export type VanillaHandle = {
  getData(): any;
  setData(data: any): void;
  validate(): boolean;
  reset(data?: any): void;
  destroy(): void;
};

function debounce<T extends (...a:any[])=>void>(ms:number, fn:T):T{
  let t:any=null; // eslint-disable-line
  return function(this:any, ...args:any[]){ // eslint-disable-line
    if (t) clearTimeout(t);
    t = setTimeout(()=>{ t=null; fn.apply(this,args); }, ms);
  } as T;
}

// Apply all direct property const tags for a chosen branch schema at a given path.
function applyConstTagsForBranch(engine: any, path: string, branchSchema: any, enable:boolean) {
  if (!enable) return;
  const props = branchSchema?.properties || {};
  for (const k of Object.keys(props)) {
    const sub: any = (props as any)[k];
    if (sub && typeof sub === "object" && Object.prototype.hasOwnProperty.call(sub, "const")) {
      const p = path ? `${path}.${k}` : k;
      engine.setValue(p, sub.const);
    }
  }
}

export function renderJsonSchemaForm(target: HTMLElement | string, opts: VanillaOptions): VanillaHandle {
  const mount: HTMLElement = typeof target === "string" ? (document.querySelector(target) as HTMLElement) : target;
  if (!mount) throw new Error("Mount element not found");

  const {
    schema,
    initialData,
    classNamePrefix = "jsf-",
    debug = false,
    debounceMs = 120,
    keepDataOnOneOfSwitch,
    constVisibility = "hidden",
    autoConstTagging = true,
    constErrorStrategy = "suppress-when-managed",
    onChange,
    onSubmit,
    onSubmitFailed,
    onValidate,
    onBeforeChange,
    onAfterChange,
    onBeforeSubmit,
    onBranchChange,
    onArrayAdd,
    onArrayRemove,
    onReset,
    onSchemaLoad,
    transformError
  ,
    oneOfBranchTitleVisibility = 'sr-only',
    oneOfBranchShowDescription = true,
    nativeRequiredMode = 'semantics'} = opts;

  const engine = createEngine(schema, initialData, { keepDataOnOneOfSwitch });
  onSchemaLoad?.(schema);

  const prefix = (c: string) => classNamePrefix + c;
  const constPaths: Set<string> = new Set();

  const dispatch = (name: string, detail: any, cancelable=false) => {
    const ev = new CustomEvent(name, { bubbles: true, cancelable, detail });
    mount.dispatchEvent(ev);
    return ev.defaultPrevented;
  };

  // --- Focus-preserving rerender helpers ------------------------------------
  function captureFocus(){
    const ae = document.activeElement as (HTMLElement|null);
    const id = (ae && ae.id) ? ae.id : null;
    let sel: {start:number|null; end:number|null} | null = null;
    if (ae && (ae as HTMLInputElement).selectionStart !== undefined) {
      const inp = ae as HTMLInputElement;
      sel = { start: inp.selectionStart, end: inp.selectionEnd };
    }
    return { id, sel };
  }
  function restoreFocus(id: string|null, sel: {start:number|null; end:number|null} | null){
    if (!id) return;
    const el = document.getElementById(id) as (HTMLInputElement|null);
    if (!el) return;
    el.focus();
    if (sel && sel.start != null && sel.end != null && typeof el.setSelectionRange === "function") {
      try { el.setSelectionRange(sel.start, sel.end); } catch {}
    }
  }
  function rerenderPreserveFocus(){
    const { id, sel } = captureFocus();
    mount.innerHTML = "";
    mount.appendChild(buildForm());
    restoreFocus(id, sel);
  }
  // --------------------------------------------------------------------------

  const runValidate = () => {
    const ok = engine.validate() as boolean;
    const st = engine.getState();
    let errs: ValidationError[] = st.errors;
    if (transformError) errs = (errs.map(transformError).filter(Boolean) as ValidationError[]);

    // Filter summary 'oneOf' error when a branch is selected at that path
    { const active = (st as any).activeOneOf || {};
      errs = errs.filter(e => !(e.keyword === "oneOf" && Object.prototype.hasOwnProperty.call(active, e.path)));
    }
    if (constErrorStrategy === "suppress-when-managed") {
      errs = errs.filter(e => !(e.keyword === "const" && constPaths.has(e.path)));
    }
    const ctx: ValidateCtx = { valid: ok, errors: errs, data: st.data, ts: Date.now() };
    onValidate?.(ctx);
    dispatch("jsf-validate", ctx);
    return ctx;
  };

  // Debounced pipeline: validate → rerender (preserving focus) → fire onChange
  const debouncedAfterChange = debounce(Math.max(150, debounceMs), () => {
    const _ = runValidate();
    rerenderPreserveFocus();
    onChange?.(engine.getState().data);
  });

  const el = (tag: string, cls?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };

  const fieldError = (path: string, errs: ValidationError[]) => errs.find(e => e.path === path);

  const applyChange = (path: string, value: any) => {
    const st0 = engine.getState();
    const ctx0: ChangeCtx = { path, value, data: st0.data, schema, ts: Date.now() };
    let vetoed = false;
    if (onBeforeChange) { const r = onBeforeChange(ctx0); if (r === false) vetoed = true; }
    if (dispatch("jsf-before-change", ctx0, true)) vetoed = true;
    if (vetoed) return;

    engine.setValue(path, value);

    const st1 = engine.getState();
    const ctx1: ChangeCtx = { path, value, data: st1.data, schema, ts: Date.now() };
    onAfterChange?.(ctx1);
    mount.dispatchEvent(new CustomEvent("jsf-change", { bubbles: true, detail: ctx1 }));

    // Do NOT hard-rerender immediately (keeps typing smooth).
    debouncedAfterChange();
  };

  const addItem = (path: string) => {
    engine.addArrayItem(path);
    const arr = getByPath(engine.getState().data, path);
    const idx = (Array.isArray(arr) ? arr.length : 1) - 1;
    onArrayAdd?.({ path, index: idx });
    mount.dispatchEvent(new CustomEvent("jsf-array-add", { bubbles: true, detail: { path, index: idx, ts: Date.now() } }));
    rerenderPreserveFocus();
    debouncedAfterChange();
  };

  const removeItem = (path: string, i: number) => {
    engine.removeArrayItem(path, i);
    onArrayRemove?.({ path, index: i });
    mount.dispatchEvent(new CustomEvent("jsf-array-remove", { bubbles: true, detail: { path, index: i, ts: Date.now() } }));
    rerenderPreserveFocus();
    debouncedAfterChange();
  };

  const setBranch = (path: string, index: number, branchSchema: any) => {
    engine.setActiveBranch(path, index);
    applyConstTagsForBranch(engine, path, branchSchema, autoConstTagging);
    onBranchChange?.({ path, index });
    mount.dispatchEvent(new CustomEvent("jsf-branch", { bubbles: true, detail: { path, index, ts: Date.now() } }));
    rerenderPreserveFocus();
    debouncedAfterChange();
  };

  const renderField = (s: any, path: string, required: boolean, errs: ValidationError[], inOneOfBranch: boolean = false): HTMLElement | null => {
    const id = sanitizeId(path);
    const t = Array.isArray(s?.type) ? s.type.find((x: any) => x !== "null") : s?.type;
    const title = (s?.title ?? (path ? path.split(".").slice(-1)[0] : "field")) || "field";
    const err = fieldError(path, errs);
    const wrap = el("div", `${prefix("field")} ${err ? "is-error" : ""}`.trim());
    wrap.setAttribute("data-field-name", path);
    wrap.setAttribute("data-field-type", String(t ?? "unknown"));

    // const field handling
    if (s && typeof s === "object" && Object.prototype.hasOwnProperty.call(s, "const")) {
      constPaths.add(path);
      if (autoConstTagging) engine.setValue(path, s.const);
      const display = typeof s.const === "string" ? s.const : JSON.stringify(s.const);
      if (constVisibility === "hidden") return null;

      const lab = el("label", prefix("label"));
      lab.setAttribute("for", id);
      lab.textContent = title + (required ? " *" : "");
      wrap.appendChild(lab);

      if (constVisibility === "readonly") {
        const val = el("div", prefix("input"));
        val.id = id; (val as any).style = "opacity:.8";
        val.textContent = display;
        wrap.appendChild(val);
      } else { // visible
        const inp = el("input", prefix("input")) as HTMLInputElement;
        inp.id = id; inp.value = display; inp.disabled = true; inp.setAttribute("aria-readonly","true");
        
      }

      if (err) {
        const em = el("div", prefix("error"));
        em.id = id + "-err";
        em.textContent = err.message;
        wrap.appendChild(em);
      }
      return wrap;
    }

    // oneOf / anyOf
    if (Array.isArray(s?.oneOf) || Array.isArray(s?.anyOf)) {
      const group = s.oneOf || s.anyOf;
      const idx = (engine.getState().activeOneOf || {})[path] ?? 0;

      const lab = el("label", prefix("label"));
      lab.setAttribute("for", id);
      lab.textContent = title + (required ? " *" : "");
      wrap.appendChild(lab);

      const sel = el("select", prefix("select")) as HTMLSelectElement;
      sel.id = id;
      group.forEach((g: any, i: number) => {
        const opt = el("option") as HTMLOptionElement;
        opt.value = String(i);
        opt.textContent = g.title ?? `${title} (${i + 1})`;
        if (i === idx) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", () => setBranch(path, Number(sel.value), group[Number(sel.value)]));
      if (required && nativeRequiredMode !== 'off') { sel.required = true; sel.setAttribute('aria-required', 'true'); }
      wrap.appendChild(sel);

      applyConstTagsForBranch(engine, path, group[idx], autoConstTagging);
      if (oneOfBranchShowDescription && (group[idx] as any)?.description) {
        const hint = el("div", prefix("hint"));
        hint.style.opacity = ".85"; hint.style.fontSize = "0.9em"; hint.style.marginTop = "4px";
        hint.textContent = (group[idx] as any).description;
        wrap.appendChild(hint);
      }

      
const inner = renderField(group[idx], path, required, errs, true);
// Enforce oneOf branch legend visibility after render (robust even if flags weren't applied earlier)
if (inner && inner.tagName === "FIELDSET") {
  inner.setAttribute("data-oneof-branch", "true");
  const leg = inner.querySelector("legend");
  if (leg) {
    if (oneOfBranchTitleVisibility === 'hidden') {
      leg.remove();
    } else if (oneOfBranchTitleVisibility === 'sr-only') {
      // robust SR-only styles
      leg.style.position = "absolute";
      leg.style.width = "1px";
      leg.style.height = "1px";
      leg.style.padding = "0";
      leg.style.margin = "-1px";
      leg.style.overflow = "hidden";
      leg.style.whiteSpace = "nowrap";
      leg.style.borderWidth = "0";
      leg.style.clip = "rect(0,0,0,0)";
      leg.style.clipPath = "inset(50%)";
      leg.style.left = "-9999px";
    }
  }
}
      if (inner) {
        const box = el("div", prefix("object"));
        box.appendChild(inner);
        wrap.appendChild(box);
      }
      if (err) {
        const em = el("div", prefix("error"));
        em.id = id + "-err";
        em.textContent = err.message;
        wrap.appendChild(em);
      }
      return wrap;
    }

    // Enum
    if (Array.isArray(s?.enum)) {
      const value = getByPath(engine.getState().data, path);
      const strValue = typeof value === "string" ? value : (value == null ? "" : JSON.stringify(value));
      const labels: string[] = (s["x-enumNames"] || s["x-enum-labels"] || s.enum).map((x: any) => String(x));

      const lab = el("label", prefix("label"));
      lab.setAttribute("for", id);
      lab.textContent = title + (required ? " *" : "");
      wrap.appendChild(lab);

      const sel = el("select", prefix("select")) as HTMLSelectElement;
      sel.id = id;
      const blank = el("option") as HTMLOptionElement;
      blank.value = ""; blank.textContent = "-- select --";
      sel.appendChild(blank);
      s.enum.forEach((v: any, i: number) => {
        const opt = el("option") as HTMLOptionElement;
        opt.value = typeof v === "string" ? v : JSON.stringify(v);
        opt.textContent = labels[i];
        if (opt.value === strValue) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", () => {
        let v: any = sel.value;
        if (s.enum.some((x: any) => typeof x !== "string")) { try { v = JSON.parse(v); } catch {} }
        applyChange(path, v);
      });
      wrap.appendChild(sel);

      if (err) {
        const em = el("div", prefix("error"));
        em.id = id + "-err";
        em.textContent = err.message;
        wrap.appendChild(em);
      }
      return wrap;
    }

    // Object (+ additionalProperties)
    if (t === "object" || s.properties) {
      const req: string[] = s.required || [];
      const obj = el("fieldset", `${prefix("object")} ${prefix("field")} ${err ? "is-error" : ""}`.trim());
      obj.setAttribute("data-field-name", path);
      obj.setAttribute("data-field-type", "object");

      const leg = el("legend", prefix("label"));
      leg.textContent = title + (required ? " *" : "");
      obj.appendChild(leg);

      Object.entries(s.properties || {}).forEach(([k, sub]) => {
        const child = renderField(sub as any, path ? `${path}.${k}` : k, req.includes(k), errs);
        if (child) obj.appendChild(child);
      });

      const additionalSchema = s.additionalProperties && typeof s.additionalProperties === "object" ? s.additionalProperties : null;
      if (additionalSchema) {
        const stateObj = getByPath(engine.getState().data, path) || {};
        const extraKeys = Object.keys(stateObj).filter(k => !(s.properties || {})[k]);

        const strong = el("strong"); strong.textContent = "Additional properties"; obj.appendChild(strong);

        extraKeys.forEach((k) => {
          const row = el("div");
          row.style.display = "grid"; (row.style as any).gridTemplateColumns = "1fr auto"; row.style.gap = "8px";
          const field = renderField(additionalSchema, path ? `${path}.${k}` : k, false, errs);
          if (field) row.appendChild(field);
          const btn = el("button") as HTMLButtonElement; btn.type="button"; btn.textContent="Remove";
          btn.onclick = () => {
            const next = { ...engine.getState().data };
            const segs = path ? path.split(".") : [];
            let cur:any = next; for (const seg of segs) { cur[seg] = cur[seg] ?? {}; cur = cur[seg]; }
            delete cur[k];
            engine.reset(next);
            rerenderPreserveFocus(); debouncedAfterChange();
          };
          row.appendChild(btn);
          obj.appendChild(row);
        });

        const addRow = el("div"); addRow.style.display="flex"; addRow.style.gap="8px"; addRow.style.marginTop="8px";
        const keyInput = el("input", prefix("input")) as HTMLInputElement; keyInput.placeholder = "new key";
        const addBtn = el("button") as HTMLButtonElement; addBtn.type="button"; addBtn.textContent="Add";
        addBtn.onclick = () => {
          const name = (keyInput.value||"").trim(); if (!name) return;
          const next = { ...engine.getState().data };
          const segs = path ? path.split(".") : [];
          let cur:any = next; for (const seg of segs) { cur[seg] = cur[seg] ?? {}; cur = cur[seg]; }
          if (cur[name] !== undefined) return;
          cur[name] = undefined;
          engine.reset(next);
          keyInput.value = "";
          rerenderPreserveFocus(); debouncedAfterChange();
        };
        addRow.appendChild(keyInput); addRow.appendChild(addBtn);
        obj.appendChild(addRow);
      }

      if (err) {
        const em = el("div", prefix("error"));
        em.id = id + "-err";
        em.textContent = err.message;
        obj.appendChild(em);
      }

      return obj;
    }

    // Array
    if (t === "array" || s.items) {
      const arrWrap = el("div", `${prefix("field")} ${err ? "is-error" : ""}`.trim());
      arrWrap.setAttribute("data-field-name", path);
      arrWrap.setAttribute("data-field-type", "array");

      const lab = el("label", prefix("label"));
      lab.setAttribute("for", id);
      lab.textContent = title + (required ? " *" : "");
      arrWrap.appendChild(lab);

      const items = Array.isArray(getByPath(engine.getState().data, path)) ? getByPath(engine.getState().data, path) : [];
      items.forEach((_v: any, i: number) => {
        const row = el("div");
        row.style.marginBottom = "8px";
        const child = renderField(s.items, `${path}.${i}`, false, errs);
        if (child) row.appendChild(child);
        const btn = el("button") as HTMLButtonElement; btn.type="button"; btn.textContent="Remove";
        btn.onclick = () => removeItem(path, i);
        row.appendChild(btn);
        arrWrap.appendChild(row);
      });

      const add = el("button") as HTMLButtonElement; add.type="button"; add.textContent="Add";
      add.onclick = () => addItem(path);
      arrWrap.appendChild(add);

      if (err) {
        const em = el("div", prefix("error"));
        em.id = id + "-err";
        em.textContent = err.message;
        arrWrap.appendChild(em);
      }
      return arrWrap;
    }

    // Primitive
    const format = s.format;
    let inputType: string = "text";
    if (format === "date") inputType = "date";
    else if (format === "time") inputType = "time";
    else if (format === "date-time") inputType = "datetime-local";
    else if (format === "email") inputType = "email";
    else if (format === "uri") inputType = "url";
    else if (format === "password") inputType = "password";
    else if (t === "number" || t === "integer") inputType = "number";
    else if (t === "boolean") inputType = "checkbox";

    const value = getByPath(engine.getState().data, path);

    const lab = el("label", prefix("label"));
    lab.setAttribute("for", id);
    lab.textContent = title + (required ? " *" : "");
    wrap.appendChild(lab);

    if (inputType === "checkbox") {
      const inp = el("input", prefix("input")) as HTMLInputElement;
      inp.type = "checkbox"; inp.id = id; inp.checked = !!value;
      inp.onchange = () => applyChange(path, inp.checked);
      if (required && nativeRequiredMode !== 'off') { inp.required = true; inp.setAttribute('aria-required','true'); }
      wrap.appendChild(inp);
    } else {
      const inp = el("input", prefix("input")) as HTMLInputElement;
      inp.type = inputType; inp.id = id; inp.value = value ?? "";
      inp.oninput = () => {
        const raw = inp.value;
        let v:any = raw;
        if (t === "number" || t === "integer") v = raw === "" ? undefined : Number(raw);
        applyChange(path, v);
      };
      wrap.appendChild(inp);
    }

    if (err) {
      const em = el("div", prefix("error"));
      em.id = id + "-err";
      em.textContent = err.message;
      wrap.appendChild(em);
    }
    return wrap;
  };

  const buildForm = (): HTMLFormElement => {
    // reset const path set each render
    constPaths.clear();

    const form = el("form", prefix("form")) as HTMLFormElement;
    form.noValidate = nativeRequiredMode !== 'enforce';
    const ctx = runValidate();
    const req: string[] = (schema as any).required || [];

    let rootField: HTMLElement | null = null;
    if ((schema as any).type === "object" || (schema as any).properties) {
      const container = el("div");
      Object.entries((schema as any).properties || {}).forEach(([k, s]) => {
        const node = renderField(s as any, k, req.includes(k), ctx.errors);
        if (node) container.appendChild(node);
      });
      rootField = container;
    } else {
      rootField = renderField(schema as any, "", false, ctx.errors);
    }
    if (rootField) form.appendChild(rootField);

    const actions = el("div");
    actions.style.marginTop = "12px"; actions.style.display = "flex"; actions.style.gap = "8px";
    const submit = el("button") as HTMLButtonElement; submit.type="submit"; submit.textContent="Submit";
    const reset = el("button") as HTMLButtonElement; reset.type="button"; reset.textContent="Reset";
    actions.appendChild(submit); actions.appendChild(reset);
    form.appendChild(actions);

    form.onsubmit = (e) => {
      e.preventDefault();
      if (nativeRequiredMode === 'enforce' && typeof (form as any).reportValidity === 'function') {
        if (!(form as any).reportValidity()) { return; }
      }
      const ctx2 = runValidate();
      if (!ctx2.valid) {
        onSubmitFailed?.(ctx2);
        mount.dispatchEvent(new CustomEvent("jsf-submit-failed", { bubbles: true, detail: ctx2 }));
        if (ctx2.errors[0]) {
          const id = sanitizeId(ctx2.errors[0].path);
          document.getElementById(id)?.focus?.();
        }
        return;
      }
      const cancel = onBeforeSubmit?.(ctx2) === false || dispatch("jsf-submit", { data: ctx2.data, ts: Date.now() }, true);
      if (cancel) return;
      onSubmit?.(ctx2.data);
      if (debug) alert(JSON.stringify(ctx2.data, null, 2));
    };

    reset.onclick = () => {
      engine.reset();
      onReset?.(engine.getState().data);
      mount.dispatchEvent(new CustomEvent("jsf-reset", { bubbles: true, detail: { data: engine.getState().data, ts: Date.now() } }));
      rerenderPreserveFocus();
      debouncedAfterChange();
    };

    return form;
  };

  // Initial render
  mount.innerHTML = "";
  mount.appendChild(buildForm());

  return {
    getData(){ return engine.getState().data; },
    setData(data:any){ engine.reset(data); rerenderPreserveFocus(); runValidate(); },
    validate(){ return engine.validate() as boolean; },
    reset(data?:any){ engine.reset(data); rerenderPreserveFocus(); runValidate(); },
    destroy(){ mount.innerHTML = ""; }
  };
}

export default { renderJsonSchemaForm };
