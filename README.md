# JSON Schema Form (beta) — User & Developer Manual

> **Status:** Experimental • Version **0.0.1-beta.1** • Do not use in production yet.
>
> Packages: `@totnesdev/jsf-core`, `@totnesdev/jsf-react`, `@totnesdev/jsf-vanilla`, `@totnesdev/jsf-webc`

This manual explains how to use and customize the JSON Schema Form generator in **React**, as a **Web Component**, and as a **Vanilla JS** widget. It also covers validation, styling, supported/unsupported JSON Schema features (Draft‑07 baseline), and local development.

---

## Contents

* [1. What it is](#sec-1)
* [2. Supported platforms](#sec-2)
* [3. Feature overview](#sec-3)
* [4. 5‑minute starter](#sec-4)

  * [4.1 React](#sec-4-1)
  * [4.2 Web Component](#sec-4-2)
  * [4.3 Vanilla](#sec-4-3)
* [5. Using JSON Schema](#sec-5)

  * [5.1 Primitives & formats](#sec-5-1)
  * [5.2 Enums (with labels)](#sec-5-2)
  * [5.3 Objects & nested fields](#sec-5-3)
  * [5.4 Arrays](#sec-5-4)
  * [5.5 oneOf / anyOf + discriminator](#sec-5-5)
  * [5.6 additionalProperties editor](#sec-5-6)
  * [5.7 Defaults & required](#sec-5-7)
  * [5.8 Const fields & discriminators: visibility & auto‑tagging](#sec-5-8)
* [6. Real‑world examples](#sec-6)
* [7. Recipes](#sec-7)
* [8. Adapters & APIs](#sec-8)

  * [8.1 React component API](#sec-8-1)
  * [8.2 Web Component API](#sec-8-2)
  * [8.3 Vanilla API](#sec-8-3)
  * [8.4 Single‑page demo (no build tools)](#sec-8-4)
* [9. Styling & theming](#sec-9)
* [10. Validation behavior](#sec-10)
* [11. Error handling](#sec-11)
* [12. Accessibility](#sec-12)
* [13. Performance](#sec-13)
* [14. Performance benchmarks & tips](#sec-14)
* [15. Security considerations](#sec-15)
* [16. Feature matrix (supported vs. not yet)](#sec-16)
* [17. Troubleshooting](#sec-17)
* [18. Getting Help](#sec-18)
* [19. Roadmap](#sec-19)
* [20. Developers: local build & repo layout](#sec-20)
* [21. Changelog](#sec-21)
* [22. Contributing](#sec-22)
* [23. Publishing to npm (beta/experimental)](#sec-23)
* [24. License](#sec-24)
* [25. Appendix: Full demo schema](#sec-25)

---

## 1. What it is

<a id="sec-1"></a>

A small library that turns a **JSON Schema (Draft‑07+)** into an interactive HTML form, producing JSON data that conforms to the schema.

* Core – headless state & validation engine (`@totnesdev/jsf-core`)
* React adapter – `<JsonSchemaForm />` (`@totnesdev/jsf-react`)
* Vanilla adapter – `renderJsonSchemaForm()` (`@totnesdev/jsf-vanilla`)
* Web Component – `<json-schema-form>` (`@totnesdev/jsf-webc`)

### 1.1 Architecture & data flow

<a id="sec-1-1"></a>

![Architecture: Core + Adapters + Ajv](docs/img/architecture.png)

![Data flow: Input → setValue → Ajv validate → state → render](docs/img/data-flow.png)

## 2. Supported platforms

<a id="sec-2"></a>

* **Node:** 18+ recommended (tested on 18/20/23)
* **Browsers:** modern evergreen browsers; Chrome/Edge/Firefox (latest 2); Safari **16+** (iOS 16+). No IE.

> Note: the “no‑build” SPA demo may require a small HTTP server for `?schema_url=` due to browser file:// restrictions.

---

## 3. Feature overview

<a id="sec-3"></a>

✅ **Supported now**

* Primitive types: `string`, `number`, `integer`, `boolean`
* Formats: `date`, `time`, `date-time`, `email`, `uri`, `password` → mapped to HTML5 inputs when available
* Enums (including non‑string values) with optional labels via `x-enumNames` / `x-enum-labels`
* Objects & nested objects
* Arrays (primitives & objects) with add/remove controls
* `oneOf` / `anyOf` with a branch selector and **discriminator** auto‑select
* `additionalProperties` key/value editor (add/remove)
* Required field markers, dirty state, inline error messages
* Validation via **Ajv 8** + `ajv-formats` on change & on submit
* Theming via CSS variables; class prefix override; `data-field-name`/`data-field-type` attributes
* React, Web Component, Vanilla adapters + SPA demo with `?schema` / `?schema_url` / `?debug`

⚠️ **Not yet / partial** (see [Feature matrix](#sec-16))

* `allOf` merging; `if/then/else` conditionals
* `$ref` resolution in the renderer (UI) – not yet (validation may still handle refs internally)
* `patternProperties` UI; `uniqueItems` UI enforcement
* Array reordering / virtualization for huge lists
* Nullable (`type: [T, "null"]`) toggle UI
* Auto‑focus first error on submit in Vanilla/WebC (React has a basic focus)

---

## 4. 5‑minute starter

<a id="sec-4"></a>

### 4.1 React (quick start)

<a id="sec-4-1"></a>

```bash
npm i react react-dom @totnesdev/jsf-react
```

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { JsonSchemaForm } from "@totnesdev/jsf-react";

const schema = {
  $id: "demo",
  type: "object",
  properties: {
    title: { type: "string", title: "Title" },
    priority: { type: "integer", title: "Priority", enum: [1,2,3], "x-enumNames": ["Low","Medium","High"] },
    contact: {
      type: "object", title: "Contact",
      properties: {
        email: { type: "string", format: "email", title: "Email" },
        address: {
          title: "Address",
          oneOf: [
            { title: "Domestic", type: "object", properties: { type: { const: "domestic" }, street: { type: "string" } }, required: ["type","street"] },
            { title: "International", type: "object", properties: { type: { const: "international" }, street: { type: "string" }, country: { type: "string" } }, required: ["type","street","country"] }
          ],
          discriminator: { propertyName: "type" }
        }
      }, required: ["email"]
    },
    tags: { type: "array", title: "Tags", items: { type: "string", title: "Tag" } }
  },
  required: ["title","priority"]
};

function App(){
  return (
    <JsonSchemaForm
      schema={schema}
      onChange={(data)=>console.log("change", data)}
      onSubmit={(data)=>alert(JSON.stringify(data,null,2))}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App/>);
```

### 4.2 Web Component (quick start)

<a id="sec-4-2"></a>

```html
<!-- When installed locally -->
<script type="module">
  import "@totnesdev/jsf-webc";
</script>

<json-schema-form id="form"></json-schema-form>
<script>
  const schema = { type: "object", properties: { name: { type: "string" } }, required: ["name"] };
  const el = document.getElementById("form");
  el.setAttribute("schema", JSON.stringify(schema));
  el.addEventListener("jsf-submit", (e)=> alert(JSON.stringify(e.detail, null, 2)) );
</script>
```

### 4.3 Vanilla (quick start)

<a id="sec-4-3"></a>

```html
<script type="module">
  import { renderJsonSchemaForm } from "@totnesdev/jsf-vanilla";
  const schema = { type: "object", properties: { email: { type: "string", format: "email" } }, required: ["email"] };
  const handle = renderJsonSchemaForm(document.getElementById("mount"), { schema });
  document.getElementById("mount").addEventListener("jsf-submit", (e)=> alert(JSON.stringify(e.detail, null, 2)) );
</script>
<div id="mount"></div>
```

---

## 5. Using JSON Schema

<a id="sec-5"></a>

### 5.1 Primitives & formats

<a id="sec-5-1"></a>

![Screenshot: primitives and formats rendered inputs](docs/img/screenshots/primitives-formats.png)

* `string` / `number` / `integer` / `boolean` map to HTML inputs.
* `format` maps to input types:

  * `date` → `type="date"`
  * `time` → `type="time"`
  * `date-time` → `type="datetime-local"`
  * `email` → `type="email"`
  * `uri` → `type="url"`
  * `password` → `type="password"`

### 5.2 Enums (with labels)

<a id="sec-5-2"></a>

![Screenshot: enum select with labels](docs/img/screenshots/enums.png)

```json
{
  "type": "integer",
  "title": "Priority",
  "enum": [1, 2, 3],
  "x-enumNames": ["Low", "Medium", "High"]
}
```

* Renders a `<select>` with label text from `x-enumNames` (or `x-enum-labels`).
* Non‑string enum values are preserved by parsing the selected option.

### 5.3 Objects & nested fields

<a id="sec-5-3"></a>

![Screenshot: object with nested fields](docs/img/screenshots/objects-nested.png)

```json
{
  "type": "object",
  "title": "Contact",
  "properties": {
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "address": {
      "type": "object",
      "properties": { "street": { "type": "string" }, "city": { "type": "string" } }
    }
  },
  "required": ["email"]
}
```

* Fields render with hierarchical `data-field-name` (e.g., `contact.address.street`).

### 5.4 Arrays

<a id="sec-5-4"></a>

![Screenshot: array of primitives and array of objects](docs/img/screenshots/arrays.png)

* Arrays of primitives render a dynamic list with **Add** / **Remove**.
* Arrays of objects render a list of grouped sub‑fields per item.

```json
{ "type": "array", "title": "Tags", "items": { "type": "string", "title": "Tag" } }
```

> `minItems`, `maxItems` are respected for enabling/disabling add/remove; reorder & virtualization are **not yet** implemented.

### 5.5 oneOf / anyOf + discriminator

<a id="sec-5-5"></a>

![Screenshot: oneOf/anyOf branch selector and discriminator](docs/img/screenshots/oneof-selector.png)

```json
{
  "title": "Profile",
  "oneOf": [
    { "title": "Person", "type": "object", "properties": { "kind": { "const": "person" }, "first": { "type": "string" } }, "required": ["kind","first"] },
    { "title": "Company", "type": "object", "properties": { "kind": { "const": "company" }, "company": { "type": "string" } }, "required": ["kind","company"] }
  ],
  "discriminator": { "propertyName": "kind" }
}
```

* UI shows a selector for branches; if a `discriminator.propertyName` exists (e.g., `kind`), the branch is auto‑picked from current data.
* **Noisy summary errors** like *must match exactly one schema in oneOf* are suppressed when a branch is explicitly selected; users instead see the specific field‑level errors.
* **Branch titles inside the selected object** can be visually reduced to avoid duplication—see **options below**.

**Options affecting oneOf/anyOf rendering**

* `oneOfBranchTitleVisibility`: `'sr-only' | 'hidden' | 'visible'` (default `'sr-only'`)

  * `sr-only` keeps the inner object legend for screen readers but hides it visually.
  * `hidden` removes the inner legend entirely.
  * `visible` shows the legend (previous behavior).
* `oneOfBranchShowDescription`: `boolean` (default `true`)

  * If a branch schema has `description`, show it as a small hint under the selector.

> Accessibility note: prefer `sr-only` so screen readers retain context for the inner fieldset.

### 5.6 additionalProperties editor

<a id="sec-5-6"></a>

![Screenshot: additionalProperties editor with add/remove rows](docs/img/screenshots/additional-properties.png)

Use this to allow arbitrary keys under an object. The UI lets users add/remove keys and edit their values.

```json
{
  "type": "object",
  "title": "Metadata",
  "properties": {},
  "additionalProperties": { "type": "string", "title": "Value" }
}
```

* When `additionalProperties` is an object schema, an **Additional properties** section appears with a key input and **Add** button.
* Keys that don’t exist in `properties` are listed; each can be removed.
* If `additionalProperties: false`, extra keys are blocked (no add UI).

**Example (HTML, Web Component):**

```html
<json-schema-form id="meta"></json-schema-form>
<script type="module">
  import "@totnesdev/jsf-webc";
  const schema = {
    type: "object",
    properties: { title: { type: "string" } },
    additionalProperties: { type: "string", title: "Value" }
  };
  const el = document.getElementById("meta");
  el.setAttribute("schema", JSON.stringify(schema));
</script>
```

### 5.7 Defaults & required

<a id="sec-5-7"></a>

* `default` values are applied on mount and when adding array/object items.
* `required` fields show an asterisk. Validation messages indicate missing required fields precisely on the child field path.

### 5.8 Const fields & discriminators: visibility & auto‑tagging

<a id="sec-5-8"></a>

Many schemas use **`const`** properties as **discriminator tags** (e.g., `kind: "person"`). The adapters now manage these for you.

**Behavior**

* **Auto‑tagging:** when a `oneOf/anyOf` branch is selected (and on initial render), we write the branch’s `const` values into the data at the correct paths.
* **Visibility control:** you can choose how `const` fields appear in the UI.

**Options**

* `constVisibility`: `'hidden' | 'readonly' | 'visible'` (default `'hidden'`)

  * `hidden` — field is omitted from UI
  * `readonly` — renders a small, non‑editable chip/value (good for transparency)
  * `visible` — renders a disabled input with the constant value
* `autoConstTagging`: `boolean` (default `true`)

  * If `false`, we won’t auto‑write tag values on branch switch. You’ll need to set them in your app.
* `constErrorStrategy`: `'suppress-when-managed' | 'show'` (default `'suppress-when-managed'`)

  * When we manage a `const` field and its value matches the constant, related errors are suppressed. Conflicting consts still surface.

**Notes**

* This improves UX by removing the need to type fixed tags like `kind` or `type`.
* For auditing or user clarity, prefer `readonly` to display the tag.
* If your schema imposes conflicting `const` via composition, the form shows a clear error; consider making the tag visible.

---

## 6. Real‑world examples

<a id="sec-6"></a>

### 6.1 User registration

<a id="sec-6-1"></a>

![Screenshot: registration form example](docs/img/screenshots/example-registration.png)

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "title": "Full name" },
    "email": { "type": "string", "format": "email" },
    "password": { "type": "string", "format": "password" },
    "country": {
      "type": "string",
      "enum": ["UK","US","DE"],
      "x-enumNames": ["United Kingdom","United States","Germany"]
    }
  },
  "required": ["name","email","password"]
}
```

### 6.2 Product catalog item

<a id="sec-6-2"></a>

![Screenshot: product item example](docs/img/screenshots/example-product.png)

```json
{
  "type": "object",
  "properties": {
    "sku": { "type": "string" },
    "price": { "type": "number" },
    "status": { "type": "integer", "enum": [0,1], "x-enumNames": ["Draft","Live"] },
    "dimensions": {
      "type": "object",
      "properties": {
        "w": { "type": "number", "title": "Width (cm)" },
        "h": { "type": "number", "title": "Height (cm)" },
        "d": { "type": "number", "title": "Depth (cm)" }
      }
    },
    "tags": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["sku","price"]
}
```

### 6.3 Feature flags (top‑level `oneOf` with discriminator)

<a id="sec-6-3"></a>

![Screenshot: feature flags oneOf example](docs/img/screenshots/example-feature-flags.png)

```json
{
  "title": "Flag",
  "oneOf": [
    { "title": "Simple", "type": "object", "properties": { "kind": { "const": "simple" }, "enabled": { "type": "boolean" } }, "required": ["kind"] },
    { "title": "Rules", "type": "object", "properties": { "kind": { "const": "rules" }, "minVersion": { "type": "integer" } }, "required": ["kind","minVersion"] }
  ],
  "discriminator": { "propertyName": "kind" }
}
```

### 6.4 Metadata editor (`additionalProperties`)

<a id="sec-6-4"></a>

![Screenshot: metadata editor example](docs/img/screenshots/example-metadata.png)

```json
{
  "type": "object",
  "title": "Metadata",
  "properties": { "title": { "type": "string" } },
  "additionalProperties": { "type": "string", "title": "Value" }
}
```

> The UI shows an **Additional properties** section where users can add/remove arbitrary keys.

## 7. Recipes

<a id="sec-7"></a>

* **Numeric enums with labels**

  ```json
  { "type":"integer", "enum":[1,2,3], "x-enumNames":["Low","Medium","High"] }
  ```
* **Discriminator pattern** (branch auto‑pick)

  ```json
  { "oneOf":[{"properties":{"kind":{"const":"a"}}},{"properties":{"kind":{"const":"b"}}}], "discriminator":{"propertyName":"kind"} }
  ```
* **Custom error text**

  ```tsx
  <JsonSchemaForm transformError={(e)=> e.keyword==='format' && e.path.endsWith('email')
    ? { ...e, message:'Please enter a valid email' } : e } />
  ```
* **Persist & reload**

  ```js
  const data = handle.getData(); localStorage.setItem('form', JSON.stringify(data));
  // later
  handle.setData(JSON.parse(localStorage.getItem('form')||'{}'));
  ```

## 8. Adapters & APIs

<a id="sec-8"></a>

This library ships three adapters. All now support **rich event handling** so you can intercept changes, validation, and submission.

### 8.1 React component API

<a id="sec-8-1"></a>

```tsx
<JsonSchemaForm
  schema={schema}
  initialData={{}}
  onChange={(data)=>{}}
  onSubmit={(data)=>{}}
  classNamePrefix="jsf-"
  keepDataOnOneOfSwitch={false}
  debounceMs={120}
  debug={false}
  // Const/discriminator management
  constVisibility="hidden" // 'hidden' | 'readonly' | 'visible'
  autoConstTagging={true}
  constErrorStrategy="suppress-when-managed" // or 'show'
  // oneOf branch legend/description
  oneOfBranchTitleVisibility="sr-only" // 'sr-only' | 'hidden' | 'visible'
  oneOfBranchShowDescription={true}
  // Hooks
  onValidate={({valid, errors, data})=>{}}
  onSubmitFailed={({errors, data})=>{}}
  onBeforeSubmit={({valid, data})=> true /* return false to cancel */}
  onBeforeChange={({path, value, data})=> true /* return false to veto */}
  onAfterChange={({path, data})=>{}}
  onBranchChange={({path, index, schema})=>{}}
  onArrayAdd={({path, index})=>{}}
  onArrayRemove={({path, index})=>{}}
  onReset={(data)=>{}}
  onSchemaLoad={(schema)=>{}}
  transformError={(e)=> e}
  showReset
/>
```

**Quick reference**

| Prop                                       | What it does                                       | Notes                                            |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------ |
| `schema`                                   | JSON Schema to render                              | Required                                         |
| `initialData`                              | Seed form values                                   | Applied on mount                                 |
| `onChange(data)`                           | Called after debounced changes                     | For autosave/analytics                           |
| `onSubmit(data)`                           | Called when valid submit occurs                    | Not cancelable (use `onBeforeSubmit`)            |
| `onValidate(ctx)`                          | Called after each validation                       | `{ valid, errors[], data, ts }`                  |
| `onSubmitFailed(ctx)`                      | Called when submit fails validation                | Use to focus or toast                            |
| `onBeforeSubmit(ctx)`                      | **Cancel or allow** submit                         | Return `false` to cancel                         |
| `onBeforeChange(ctx)`                      | **Veto or allow** a value change                   | Return `false` to veto                           |
| `onAfterChange(ctx)`                       | After a value change                               |                                                  |
| `onBranchChange(info)`                     | `oneOf/anyOf` branch switched                      | `{path,index,schema}`                            |
| `onArrayAdd(info)` / `onArrayRemove(info)` | Array mutations                                    | `{path,index}`                                   |
| `onReset(data)`                            | Reset button pressed                               | Requires `showReset`                             |
| `onSchemaLoad(schema)`                     | Schema prop changed                                | Fires after set                                  |
| `transformError(e)`                        | Translate/alter errors                             | Return `null` to hide                            |
| `classNamePrefix`                          | CSS class prefix                                   | Default `jsf-`                                   |
| `debounceMs`                               | Validate/change debounce                           | Default 120ms                                    |
| `keepDataOnOneOfSwitch`                    | Reserved for pruning/keep                          | Planned behavior                                 |
| `debug`                                    | Show live state dump                               | Dev only                                         |
| `showReset`                                | Show Reset button                                  | Hidden by default                                |
| `constVisibility`                          | Visibility of `const` fields                       | `'hidden'` (default), `'readonly'`, `'visible'`  |
| `autoConstTagging`                         | Auto-set branch tag values                         | `true` (default)                                 |
| `constErrorStrategy`                       | Show or suppress const errors when managed         | `'suppress-when-managed'` (default) or `'show'`  |
| `oneOfBranchTitleVisibility`               | Inner legend visibility for selected branch object | `'sr-only'` (default) / `'hidden'` / `'visible'` |
| `oneOfBranchShowDescription`               | Show branch `description` under selector           | `true` (default)                                 |

---

### 8.2 Web Component API

<a id="sec-8-2"></a>

**Tag:** `<json-schema-form>`

**Attributes**

* `schema` — JSON stringified schema (required)
* `debug` — if present, shows debug details
* `const-visibility` — `'hidden' | 'readonly' | 'visible'` (default `'hidden'`)
* `auto-const-tagging` — `'true' | 'false'` (default `'true'`)
* `const-error-strategy` — `'suppress-when-managed' | 'show'` (default `'suppress-when-managed'`)
* `oneof-branch-title-visibility` — `'sr-only' | 'hidden' | 'visible'` (default `'sr-only'`)
* `oneof-branch-show-description` — `'true' | 'false'` (default `'true'`)

**Methods**

* `loadSchema(schema: object)`
* `getData(): any`
* `validate(): boolean`
* `reset(): void`

**Events** (all bubble through Shadow DOM; **`jsf-submit` is cancelable**):

* `jsf-before-change` — `{ path, value, data, ts }` (cancelable)
* `jsf-change` — `{ path, value, data, ts }`
* `jsf-validate` — `{ valid, errors[], data, ts }`
* `jsf-submit` — `{ data, ts }` (**call `event.preventDefault()` to take over**)
* `jsf-submit-failed` — `{ valid:false, errors[], data, ts }`
* `jsf-branch` — `{ path, index, ts }`
* `jsf-array-add` / `jsf-array-remove` — `{ path, index, ts }`
* `jsf-reset` — `{ data, ts }`
* `jsf-schema` — `{ schema, ts }`

**Example**

```html
<json-schema-form id="form" const-visibility="readonly" auto-const-tagging="true"></json-schema-form>
<script type="module">
  import "@totnesdev/jsf-webc";
  const schema = { type: "object", properties: { email: { type: "string", format: "email" } }, required: ["email"] };
  const el = document.getElementById("form");
  el.setAttribute("schema", JSON.stringify(schema));
  el.addEventListener("jsf-submit", (e) => { e.preventDefault(); save(e.detail.data); });
</script>
```

---

### 8.3 Vanilla API

<a id="sec-8-3"></a>

```ts
import { renderJsonSchemaForm } from "@totnesdev/jsf-vanilla";

const handle = renderJsonSchemaForm(targetElOrSelector, {
  schema,
  initialData,
  classNamePrefix: "jsf-",
  debug: false,
  keepDataOnOneOfSwitch: false,
  // Const/discriminator management
  constVisibility: 'hidden',           // 'hidden' | 'readonly' | 'visible'
  autoConstTagging: true,
  constErrorStrategy: 'suppress-when-managed', // or 'show'
  // oneOf branch legend/description
  oneOfBranchTitleVisibility: 'sr-only', // 'sr-only' | 'hidden' | 'visible'
  oneOfBranchShowDescription: true,
  // hooks
  onBeforeChange: ({path, value, data}) => true, // return false to veto
  onAfterChange: ({path, data}) => {},
  onValidate: ({valid, errors, data}) => {},
  onSubmit: (data) => {},
  onSubmitFailed: ({errors, data}) => {},
  onBeforeSubmit: ({valid, data}) => true,
  onBranchChange: ({path, index}) => {},
  onArrayAdd: ({path, index}) => {},
  onArrayRemove: ({path, index}) => {},
  onReset: (data) => {},
  onSchemaLoad: (schema) => {},
  transformError: (e) => e
});

// DOM events are also dispatched on the mount element:
// jsf-before-change (cancelable), jsf-change, jsf-validate, jsf-submit (cancelable),
// jsf-submit-failed, jsf-branch, jsf-array-add/jsf-array-remove, jsf-reset, jsf-schema
```

### 8.4 Single‑page demo (no build tools)

<a id="sec-8-4"></a>

Open `examples/spa/index.html` directly, or serve the folder:

```bash
npx http-server examples/spa -p 8080
open http://localhost:8080
```

**URL params**

* `?schema=` — JSON‑encoded schema
* `?schema_url=` — URL to fetch schema (requires HTTP, not `file://`)
* `?debug=true` — enable debug mode

## 9. Styling & theming

<a id="sec-9"></a>

![Screenshot: themed form using CSS variables](docs/img/screenshots/theming.png)

### 9.1 CSS variables

<a id="sec-9-1"></a>

Global theme variables (override in `:root` or scoped container):

* `--jsf-error-bg` — background for error state
* `--jsf-dirty-bg` — background for dirty (changed) state
* `--jsf-label-color`
* `--jsf-input-border`
* `--jsf-radius`
* `--jsf-spacing-sm`, `--jsf-spacing-md`, `--jsf-spacing-lg`
* `--jsf-font-size-sm`, `--jsf-font-size-md`, `--jsf-font-size-lg`

### 9.2 Class names & data attributes

<a id="sec-9-2"></a>

* Structural classes (prefixed by `classNamePrefix`, default `jsf-`):

  * `jsf-form`, `jsf-object`, `jsf-array`, `jsf-field`, `jsf-label`, `jsf-input`, `jsf-select`, `jsf-error`
* State classes: `is-error`, `is-dirty`
* Data attributes on each field wrapper:

  * `data-field-name` — full path, e.g. `contact.address.street`
  * `data-field-type` — e.g. `string`, `integer`, `enum`

**Examples**

```css
/* Make everything under contact.* wider border */
[data-field-name^="contact."] .jsf-input { border-color: #1d4ed8; }

/* Style priority specifically */
[data-field-name="priority"] .jsf-select { background: #fff7ed; }
```

### 9.3 Web Component styling notes

<a id="sec-9-3"></a>

* The Web Component renders inside Shadow DOM. For now, **use CSS variables** to theme.
* `::part(...)` hooks for `field|label|input|error` are planned but not yet exposed.

### 9.4 Visually hidden (sr-only) utility

<a id="sec-9-4"></a>

When `oneOfBranchTitleVisibility` is set to `sr-only`, inner fieldset legends are visually hidden but kept accessible. If you prefer a reusable class, add this CSS and we’ll apply `class="sr-only"` in your wrapper:

```css
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
```

---

## 10. Validation behavior

<a id="sec-10"></a>

* **Ajv 8** with `ajv-formats` validates on **every change** (debounced) and **on submit**.
* Unknown vendor keywords (`x-enumNames`, `x-enum-labels`, `discriminator`) are tolerated.
* Errors are mapped to **precise field paths**; required‑missing at parent is associated with the missing child field.
* React adapter focuses the **first invalid field** on submit. (Vanilla/WebC: a live error summary is shown; auto‑focus is planned.)

## 11. Error handling

<a id="sec-11"></a>

![Screenshot: inline errors and error summary](docs/img/screenshots/error-states.png)

**What you get:** a normalized error shape and hooks/events to observe or customize.

**Error object**

```ts
{ path: string; message: string; keyword: string }
```

**Intercept & customize**

* React: `transformError(e) => e' | null` (return `null` to hide an error)
* Vanilla/WebC: `transformError` option is also available

**Examples**

```tsx
// React
<JsonSchemaForm
  schema={schema}
  transformError={(e) => (
    e.keyword === 'format' && e.path.endsWith('email')
      ? { ...e, message: 'Please enter a valid email address' }
      : e
  )}
  onValidate={({ valid, errors }) => console.log(valid ? 'ok' : 'errors', errors)}
/>
```

```js
// Web Component (cancelable submit)
el.addEventListener('jsf-submit', (e) => {
  e.preventDefault(); // take control
  save(e.detail.data);
});

// Veto a specific change
el.addEventListener('jsf-before-change', (e) => {
  if (e.detail.path === 'priority' && e.detail.value === 3) e.preventDefault();
});
```

**Common error scenarios**

* `strict mode: unknown keyword "x-enumNames"` → Ajv strict mode: use the provided core (defaults relaxed) or set `strict:false`.
* `oneOf` mismatch → check the `discriminator.propertyName` and the branch tag `const` values.
* Type mismatch on numbers → inputs for `number`/`integer` parse to `Number`; blank becomes `undefined`.

---

## 12. Accessibility

<a id="sec-12"></a>

* Labels are linked via `for`/`id`.
* Fields with errors get `aria-invalid` and `aria-describedby`.
* Keyboard navigation: inputs/selects/buttons receive focus; array controls are buttons.
* Default theme targets WCAG AA contrast; please validate your overrides.

---

## 13. Performance

<a id="sec-13"></a>

* Validators are cached per schema `$id`.
* Change validation is **debounced** (default 120ms).
* Intended target: \~20 top‑level fields; 3 nested levels; sub‑100ms typical updates on modern hardware.

## 14. Performance benchmarks & tips

<a id="sec-14"></a>

> Numbers below are indicative; run Lighthouse/DevTools and your own scenarios.

**Example measurements**

| Schema         | Fields | Avg onChange validate |     P95 |
| -------------- | -----: | --------------------: | ------: |
| Basic          |     10 |                2–4 ms |  < 8 ms |
| Medium         |     25 |               6–10 ms | < 18 ms |
| Nested + oneOf |     30 |               8–12 ms | < 22 ms |

**Tips**

* Give each schema a stable **`$id`** to maximize Ajv reuse.
* Increase **`debounceMs`** (e.g., 150–250ms) for heavy schemas.
* Split very large forms into tabs/steps; avoid rendering hundreds of inputs at once.
* Avoid huge arrays in a single view; paginate (virtualization is planned).
* Prefer **discriminator-based `oneOf`** with `const` tags for faster branch selection.

## 15. Security considerations

<a id="sec-15"></a>

* **No `eval` of schema**; input `id`s are sanitized; titles/labels are rendered as text.
* Treat schemas as **untrusted input**; avoid HTML in titles/descriptions (we escape text anyway).
* Remote schemas / `$ref` fetching is **off** by default; if you enable it, enforce CORS, same‑origin or an allow‑list, and consider ETag caching.
* For cross-origin flows (e.g., SPA callbacks), use **`postMessage` with origin checks**.
* Don’t put secrets in query params (e.g., `?callback_auth=`); prefer short‑lived tokens.
* Consider a **Content Security Policy (CSP)** in production docs.

---

## 16. Feature matrix (supported vs. not yet)

<a id="sec-16"></a>

| Area                                                                | Status                                      |
| ------------------------------------------------------------------- | ------------------------------------------- |
| Primitives & formats (date/time/datetime/email/uri/password)        | ✅                                           |
| Enum (incl. non‑strings) + labels via `x-enumNames`/`x-enum-labels` | ✅                                           |
| Objects & nested objects                                            | ✅                                           |
| Arrays (primitives/objects) add/remove                              | ✅                                           |
| `oneOf` / `anyOf` + discriminator                                   | ✅                                           |
| `additionalProperties` editor                                       | ✅                                           |
| Required markers; dirty & error visuals                             | ✅                                           |
| Ajv validation (change + submit)                                    | ✅                                           |
| **allOf** merged schemas                                            | ❌ (planned)                                 |
| **if/then/else** conditionals                                       | ❌ (planned)                                 |
| `$ref` / `$defs` UI resolution                                      | ❌ (planned; validation only)                |
| `patternProperties` UI                                              | ❌ (planned)                                 |
| `uniqueItems` UI enforcement                                        | ❌ (planned; validation may flag duplicates) |
| Array reorder / virtualization                                      | ❌ (planned)                                 |
| Nullable `type: [T, "null"]` toggle UI                              | ❌ (planned)                                 |
| Auto‑focus first error (Vanilla/WebC)                               | ⚠️ partial                                  |
| Web Component `::part(...)` styling                                 | ❌ (planned)                                 |

---

## 17. Troubleshooting

<a id="sec-17"></a>

**Opening SPA via `file://`**
`?schema_url=` may fail due to CORS. Start a tiny server:

```bash
npx http-server examples/spa -p 8080
open http://localhost:8080
```

**Unknown keyword `x-enumNames`**
If you supply your own Ajv instance in advanced setups, set `strict:false` or register custom keywords. The default core tolerates vendor keywords.

**Enum values saved as strings**
For non‑string enums we serialize option values and parse them back. Ensure `enum` and `x-enumNames` lengths match.

**Can’t type into `<input type="email">` or fields drop keystrokes**
Ensure you’re on ≥ `0.0.1-beta.1`. Also, don’t unmount/remount the form on each keystroke; keep `schema` stable in React.

**`oneOf` never validates**
Check `discriminator.propertyName` and that each branch includes a matching `const` for that property.

**Intercepting submit**
React: use `onBeforeSubmit` to cancel. Web Component/Vanilla: listen for `jsf-submit` and call `event.preventDefault()`.

**Scrolling to first error**
React focuses the first invalid input on submit. Vanilla/WebC will get focus+anchors in a future release.

---

## 18. Getting Help

<a id="sec-18"></a>

* **Bugs & feature requests:** GitHub Issues (include schema, adapter, Node/Browser versions, minimal repro).
* **Questions & ideas:** GitHub Discussions.
* **Security:** email security\@yourdomain (avoid public issues for vulnerabilities).

## 19. Roadmap

<a id="sec-19"></a>

* `allOf` merge; `if/then/else` conditional logic
* `$ref` / `$defs` resolution and remote fetch with caching & ETag
* `patternProperties` UI; `uniqueItems` enforcement
* `nullable` toggle widget
* Keep/prune data when switching `oneOf` branches
* Array item reorder; virtualization for very large lists
* Web Component `::part()` styling; improved focus management and error summary links

---

## 20. Developers: local build & repo layout

<a id="sec-20"></a>

**Monorepo**

```
packages/
  jsf-core/     # headless engine (Ajv integration)
  jsf-react/    # React adapter
  jsf-vanilla/  # Vanilla adapter + IIFE build
  jsf-webc/     # Web Component wrapper
examples/
  react/        # Vite React demo
  spa/          # No-build SPA demo (IIFE)
```

**Install & build**

```bash
npm i
npm run build               # builds core → react → vanilla → webc → examples
npm run dev:react           # starts the Vite demo (React)
```

**Testing**

* Unit tests (core) planned; smoke tests for adapters planned.

## 21. Changelog

<a id="sec-21"></a>

**0.0.1-beta.1**

* Initial beta release.
* Core features: primitives, formats, enums with labels, nested objects, arrays.
* `oneOf/anyOf` with discriminator; `additionalProperties` editor.
* Ajv 8 validation (change + submit), debounced.
* **New:** Rich event model across adapters:

  * React: `onValidate`, `onSubmitFailed`, `onBeforeSubmit`, `onBeforeChange`, `onAfterChange`, `onBranchChange`, `onArrayAdd`, `onArrayRemove`, `onReset`, `onSchemaLoad`, `transformError`.
  * Web Component/Vanilla: DOM events `jsf-before-change` (cancelable), `jsf-change`, `jsf-validate`, `jsf-submit` (cancelable), `jsf-submit-failed`, `jsf-branch`, `jsf-array-add`, `jsf-array-remove`, `jsf-reset`, `jsf-schema`; plus Vanilla options mirroring React hooks.

## 22. Contributing

<a id="sec-22"></a>

We welcome issues and PRs. To contribute:

1. Fork and clone the repo
2. `npm i` then `npm run build`
3. Use feature branches and add concise PR descriptions
4. For bug reports, include schema + adapter + versions + repro steps

(A full `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` will be added.)

## 23. Publishing to npm (beta/experimental)

<a id="sec-23"></a>

When ready to publish beta builds:

* Set version like `0.0.1-beta.1` in each package’s `package.json`.
* Publish with a non‑default dist‑tag (e.g., `experimental`) so users don’t get it by accident:

```bash
npm publish --access public --tag experimental  # run in each package dir
```

Consumers would then install with:

```bash
npm i @totnesdev/jsf-react@experimental
```

> You can use any tag name; `experimental` is clear and avoids the default `latest`.

---

## 24. License

<a id="sec-24"></a>

**TBD by project owner.** (Common choices: MIT/Apache‑2.0/BSD‑3‑Clause.)

---

## 25. Appendix: Full demo schema (top‑level & nested oneOf, enum, array, additionalProperties)

<a id="sec-25"></a> (top‑level & nested oneOf, enum, array, additionalProperties)

```json
{
  "$id": "spa-demo",
  "type": "object",
  "properties": {
    "title": { "type": "string", "title": "Title" },
    "profile": {
      "title": "Profile",
      "oneOf": [
        { "title": "Person", "type": "object", "properties": { "kind": { "const": "person" }, "first": { "type": "string" }, "last": { "type": "string" } }, "required": ["kind","first","last"] },
        { "title": "Company", "type": "object", "properties": { "kind": { "const": "company" }, "company": { "type": "string" } }, "required": ["kind","company"] }
      ],
      "discriminator": { "propertyName": "kind" }
    },
    "contact": {
      "type": "object",
      "title": "Contact",
      "properties": {
        "email": { "type": "string", "format": "email", "title": "Email" },
        "phone": { "type": "string", "title": "Phone" },
        "address": {
          "title": "Address",
          "oneOf": [
            { "title": "Domestic (UK)", "type": "object", "properties": { "type": { "const": "domestic" }, "street": { "type": "string" }, "city": { "type": "string" }, "postalCode": { "type": "string" } }, "required": ["type","street","city","postalCode"] },
            { "title": "International", "type": "object", "properties": { "type": { "const": "international" }, "street": { "type": "string" }, "city": { "type": "string" }, "country": { "type": "string" } }, "required": ["type","street","city","country"] }
          ],
          "discriminator": { "propertyName": "type" }
        }
      },
      "required": ["email"]
    },
    "priority": { "type": "integer", "title": "Priority", "enum": [1,2,3], "x-enumNames": ["Low","Medium","High"] },
    "tags": { "type": "array", "title": "Tags", "items": { "type": "string", "title": "Tag" } },
    "metadata": { "type": "object", "title": "Metadata", "properties": {}, "additionalProperties": { "type": "string", "title": "Value" } }
  },
  "required": ["title","priority"]
}
```
