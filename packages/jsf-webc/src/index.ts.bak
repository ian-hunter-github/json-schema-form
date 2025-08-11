import { renderJsonSchemaForm } from "@totnesdev/jsf-vanilla";

type ConstVisibility = "hidden" | "readonly" | "visible";
type ConstErrorStrategy = "suppress-when-managed" | "show";

const BOOL = (v:string|null) => v === "true" || v === "1" || v === "yes";

export class JsonSchemaFormEl extends HTMLElement {
  private _handle: any = null;
  private _root: ShadowRoot;

  static get observedAttributes(){ return ["schema","debug","const-visibility","auto-const-tagging","const-error-strategy", "oneof-branch-title-visibility", "oneof-branch-show-description", "native-required-mode"]; }

  constructor(){
    super();
    this._root = this.attachShadow({ mode: "open" });
    const mount = document.createElement("div");
    mount.setAttribute("part","root");
    this._root.appendChild(mount);
  }

  connectedCallback(){ this._render(); }
  disconnectedCallback(){ this._handle?.destroy?.(); this._handle = null; }

  attributeChangedCallback(){ this._render(); }

  set schemaObject(obj: any) {
    this.setAttribute("schema", JSON.stringify(obj ?? {}));
  }

  get mount(): HTMLElement {
    return this._root.querySelector("div") as HTMLElement;
  }

  _optionsFromAttrs() {
    const constVisibility = (this.getAttribute("const-visibility") as ConstVisibility) || "hidden";
    const autoConstTagging = BOOL(this.getAttribute("auto-const-tagging") ?? "true");
    const constErrorStrategy = (this.getAttribute("const-error-strategy") as ConstErrorStrategy) || "suppress-when-managed";
    const debug = BOOL(this.getAttribute("debug"));
    return { constVisibility, autoConstTagging, constErrorStrategy, debug };
  }

  _render(){
    const schemaAttr = this.getAttribute("schema");
    if (!schemaAttr) return;

    let schema: any;
    try { schema = JSON.parse(schemaAttr); } catch { return; }

    this._handle?.destroy?.();
    this._handle = renderJsonSchemaForm(this.mount, {
      schema,
      classNamePrefix: "jsf-",
      ...this._optionsFromAttrs(),
    });

    this.dispatchEvent(new CustomEvent("jsf-schema", { bubbles: true, detail: { schema, ts: Date.now() } }));
  }

  // Public methods
  loadSchema(schema: any){ this.schemaObject = schema; }
  getData(){ return this._handle?.getData?.(); }
  validate(){ return this._handle?.validate?.(); }
  reset(){ return this._handle?.reset?.(); }
}

if (!customElements.get("json-schema-form")) {
  customElements.define("json-schema-form", JsonSchemaFormEl);
}

export default JsonSchemaFormEl;
