# JSON Schema Form (beta) — User & Developer Manual

> **Status:** Experimental • Version **0.0.1-beta.1** • Do not use in production yet.
>
> Packages: `@totnesdev/jsf-core`, `@totnesdev/jsf-react`, `@totnesdev/jsf-vanilla`, `@totnesdev/jsf-webc`
> **Web Component status:** The `@totnesdev/jsf-webc` adapter is currently **not usable** in this beta. WebC sections below are for preview only; please do not use in apps.

This manual explains how to use and customize the JSON Schema Form generator in **React**, as a **Web Component**, and as a **Vanilla JS** widget. It also covers validation, styling, supported/unsupported JSON Schema features (Draft‑07 baseline), and local development.

---

## Contents

- [JSON Schema Form (beta) — User \& Developer Manual](#json-schema-form-beta--user--developer-manual)
  - [Contents](#contents)
  - [1. What it is](#1-what-it-is)
    - [1.1 Architecture \& data flow](#11-architecture--data-flow)
  - [2. Supported platforms](#2-supported-platforms)
  - [3. Feature overview](#3-feature-overview)
  - [4. 5‑minute starter](#4-5minute-starter)
    - [4.1 React (quick start)](#41-react-quick-start)
    - [4.2 Web Component (quick start)](#42-web-component-quick-start)
    - [4.3 Vanilla (quick start)](#43-vanilla-quick-start)
  - [5. Using JSON Schema](#5-using-json-schema)
    - [5.1 Primitives \& formats](#51-primitives--formats)
    - [5.2 Enums (with labels)](#52-enums-with-labels)
    - [5.3 Objects \& nested fields](#53-objects--nested-fields)
    - [5.4 Arrays](#54-arrays)
    - [5.5 oneOf / anyOf + discriminator](#55-oneof--anyof--discriminator)
    - [5.6 additionalProperties editor](#56-additionalproperties-editor)
    - [5.7 Defaults \& required](#57-defaults--required)
    - [5.8 Const fields \& discriminators: visibility \& auto‑tagging](#58-const-fields--discriminators-visibility--autotagging)
  - [6. Real‑world examples](#6-realworld-examples)
    - [6.1 User registration](#61-user-registration)
    - [6.2 Product catalog item](#62-product-catalog-item)
    - [6.3 Feature flags (top‑level `oneOf` with discriminator)](#63-feature-flags-toplevel-oneof-with-discriminator)
    - [6.4 Metadata editor (`additionalProperties`)](#64-metadata-editor-additionalproperties)
  - [7. Recipes](#7-recipes)
  - [8. Adapters \& APIs](#8-adapters--apis)
    - [8.1 React component API](#81-react-component-api)
    - [8.2 Web Component API](#82-web-component-api)
    - [8.3 Vanilla API](#83-vanilla-api)
    - [8.4 Single‑page demo (no build tools)](#84-singlepage-demo-no-build-tools)
  - [9. Styling \& theming](#9-styling--theming)
    - [9.1 CSS variables](#91-css-variables)
    - [9.2 Class names \& data attributes](#92-class-names--data-attributes)
    - [9.3 Web Component styling notes](#93-web-component-styling-notes)
    - [9.4 Visually hidden (sr-only) utility](#94-visually-hidden-sr-only-utility)
    - [9.5 Example stylesheet \& usage (React/Vanilla)](#95-example-stylesheet--usage-reactvanilla)
  - [10. Validation behavior](#10-validation-behavior)
  - [11. Error handling](#11-error-handling)
  - [12. Accessibility](#12-accessibility)
  - [13. Performance](#13-performance)
  - [14. Performance benchmarks \& tips](#14-performance-benchmarks--tips)
  - [15. Security considerations](#15-security-considerations)
  - [16. Feature matrix (supported vs. not yet)](#16-feature-matrix-supported-vs-not-yet)
  - [17. Troubleshooting](#17-troubleshooting)
    - [17.1 Opening SPA via `?schema_url=` may fail due to CORS. Start a tiny server:](#171-opening-spa-via-schema_url-may-fail-due-to-cors-start-a-tiny-server)
    - [17.2 Unknown keyword](#172-unknown-keyword)
    - [17.3 Enum values saved as strings](#173-enum-values-saved-as-strings)
    - [17.4 Can’t type into **\`\`** or fields drop keystrokes](#174-cant-type-into--or-fields-drop-keystrokes)
    - [17.5 never validates](#175-never-validates)
    - [17.6 Intercepting submit](#176-intercepting-submit)
    - [17.7 Scrolling to first error](#177-scrolling-to-first-error)
  - [18. Getting Help](#18-getting-help)
  - [19. Roadmap](#19-roadmap)
  - [20. Developers: local build \& repo layout](#20-developers-local-build--repo-layout)
  - [21. Changelog](#21-changelog)
  - [22. Contributing](#22-contributing)
  - [23. Publishing to npm (beta/experimental)](#23-publishing-to-npm-betaexperimental)
  - [24. License](#24-license)
  - [25. Appendix: Full demo schema (top‑level \& nested oneOf, enum, array, additionalProperties)](#25-appendix-full-demo-schema-toplevel--nested-oneof-enum-array-additionalproperties)

---

## 1. What it is

A small library that turns a **JSON Schema (Draft‑07+)** into an interactive HTML form, producing JSON data that conforms to the schema.

* Core – headless state & validation engine (`@totnesdev/jsf-core`)
* React adapter – `<JsonSchemaForm />` (`@totnesdev/jsf-react`)
* Vanilla adapter – `renderJsonSchemaForm()` (`@totnesdev/jsf-vanilla`)
* Web Component – `<json-schema-form>` (`@totnesdev/jsf-webc`)

### 1.1 Architecture & data flow

## 2. Supported platforms

* **Node:** 18+ recommended (tested on 18/20/23)
* **Browsers:** modern evergreen browsers; Chrome/Edge/Firefox (latest 2); Safari **16+** (iOS 16+). No IE.

> Note: the “no‑build” SPA demo may require a small HTTP server for `?schema_url=` due to browser file:// restrictions.

---

## 3. Feature overview

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

### 4.1 React (quick start)

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

> **WebC status:** Not usable in this beta. The snippet below is for preview only.

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

### 5.1 Primitives & formats

* `string` / `number` / `integer` / `boolean` map to HTML inputs.
* `format` maps to input types:

  * `date` → `type="date"`
  * `time` → `type="time"`
  * `date-time` → `type="datetime-local"`
  * `email` → `type="email"`
  * `uri` → `type="url"`
  * `password` → `type="password"`

### 5.2 Enums (with labels)

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

* Arrays of primitives render a dynamic list with **Add** / **Remove**.
* Arrays of objects render a list of grouped sub‑fields per item.

```json
{ "type": "array", "title": "Tags", "items": { "type": "string", "title": "Tag" } }
```

> `minItems`, `maxItems` are respected for enabling/disabling add/remove; reorder & virtualization are **not yet** implemented.

### 5.5 oneOf / anyOf + discriminator

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

> **WebC status:** Not usable in this beta; example for reference only.

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

* `default` values are applied on mount and when adding array/object items.
* `required` fields show an asterisk. Validation messages indicate missing required fields precisely on the child field path.

### 5.8 Const fields & discriminators: visibility & auto‑tagging

Many schemas use \`\` properties as **discriminator tags** (e.g., `kind: "person"`). The adapters now manage these for you.

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

### 6.1 User registration

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

This library ships three adapters. All now support **rich event handling** so you can intercept changes, validation, and submission.

### 8.1 React component API

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

> **WebC status:** Not usable in this beta. API spec is provided for planning only.

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

**Events** (all bubble through Shadow DOM; \`\`\*\* is cancelable\*\*):

* `jsf-before-change` — `{ path, value, data, ts }` (cancelable)
* `jsf-change` — `{ path, value, data, ts }`
* `jsf-validate` — `{ valid, errors[], data, ts }`
* `jsf-submit` — `{ data, ts }` (**call **\`\`** to take over**)
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

### 9.1 CSS variables

Global theme variables (override in `:root` or scoped container):

* `--jsf-error-bg` — background for error state
* `--jsf-dirty-bg` — background for dirty (changed) state
* `--jsf-label-color`
* `--jsf-input-border`
* `--jsf-radius`
* `--jsf-spacing-sm`, `--jsf-spacing-md`, `--jsf-spacing-lg`
* `--jsf-font-size-sm`, `--jsf-font-size-md`, `--jsf-font-size-lg`

### 9.2 Class names & data attributes

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

> **WebC status:** Not usable in this beta. Styling notes refer to a future release.

* The Web Component renders inside Shadow DOM. For now, **use CSS variables** to theme.
* `::part(...)` hooks for `field|label|input|error` are planned but not yet exposed.

### 9.4 Visually hidden (sr-only) utility

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

### 9.5 Example stylesheet & usage (React/Vanilla)

A minimal, drop‑in stylesheet you can tweak or scope.

```css
/* jsf-theme.css */
:root {
  --jsf-radius: 8px;
  --jsf-spacing-sm: 0.4rem;
  --jsf-spacing-md: 0.75rem;
  --jsf-spacing-lg: 1rem;

  --jsf-label-color: #111827;
  --jsf-input-border: #d1d5db;
  --jsf-error-bg: #fef2f2;
  --jsf-dirty-bg: #fffbeb;

  --jsf-font-size-sm: 0.875rem;
  --jsf-font-size-md: 1rem;
  --jsf-font-size-lg: 1.125rem;
}

/* Basic structure */
.jsf-form { display: grid; gap: var(--jsf-spacing-md); }
.jsf-field { display: grid; gap: 0.25rem; }
.jsf-label { color: var(--jsf-label-color); font-weight: 600; }
.jsf-input, .jsf-select {
  border: 1px solid var(--jsf-input-border);
  border-radius: var(--jsf-radius);
  padding: 0.5rem 0.625rem;
  font-size: var(--jsf-font-size-md);
}
.jsf-error {
  background: var(--jsf-error-bg);
  padding: 0.4rem 0.5rem;
  border-radius: var(--jsf-radius);
}
.is-dirty .jsf-input, .is-dirty .jsf-select { background: var(--jsf-dirty-bg); }
```

**React usage**

```tsx
// main.tsx or App.tsx
import './jsf-theme.css';

function App() {
  return (
    <div className="my-form-scope">
      <JsonSchemaForm
        schema={schema}
        classNamePrefix="jsf-" // keep in sync with selectors in the CSS above
      />
    </div>
  );
}
```

Scope and override variables locally (optional):

```css
.my-form-scope {
  --jsf-input-border: #94a3b8;
  --jsf-label-color: #0f172a;
}
```

**Vanilla usage**

```html
<link rel="stylesheet" href="/css/jsf-theme.css" />
<div id="mount" class="my-form-scope"></div>
<script type="module">
  import { renderJsonSchemaForm } from "@totnesdev/jsf-vanilla";
  const handle = renderJsonSchemaForm(document.getElementById("mount"), {
    schema,
    classNamePrefix: "jsf-"
  });
</script>
```

> Tip: If you customize `classNamePrefix`, adjust the class selectors in your CSS accordingly (e.g., `.acme-form .acme-input`).

---

## 10. Validation behavior

* **Ajv 8** with `ajv-formats` validates on **every change** (debounced) and **on submit**.
* Unknown vendor keywords (`x-enumNames`, `x-enum-labels`, `discriminator`) are tolerated.
* Errors are mapped to **precise field paths**; required‑missing at parent is associated with the missing child field.
* React adapter focuses the **first invalid field** on submit. (Vanilla/WebC: a live error summary is shown; auto‑focus is planned.)

## 11. Error handling

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

> **WebC status:** Not usable in this beta; example for reference only.

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

* Labels are linked via `for`/`id`.
* Fields with errors get `aria-invalid` and `aria-describedby`.
* Keyboard navigation: inputs/selects/buttons receive focus; array controls are buttons.
* Default theme targets WCAG AA contrast; please validate your overrides.

---

## 13. Performance

* Validators are cached per schema `$id`.
* Change validation is **debounced** (default 120ms).
* Intended target: \~20 top‑level fields; 3 nested levels; sub‑100ms typical updates on modern hardware.

## 14. Performance benchmarks & tips

> Numbers below are indicative; run Lighthouse/DevTools and your own scenarios.

**Example measurements**

| Schema         | Fields | Avg onChange validate | P95     |
| -------------- | ------ | --------------------- | ------- |
| Basic          | 10     | 2–4 ms                | < 8 ms  |
| Medium         | 25     | 6–10 ms               | < 18 ms |
| Nested + oneOf | 30     | 8–12 ms               | < 22 ms |

**Tips**

* Give each schema a stable \`\` to maximize Ajv reuse.
* Increase \`\` (e.g., 150–250ms) for heavy schemas.
* Split very large forms into tabs/steps; avoid rendering hundreds of inputs at once.
* Avoid huge arrays in a single view; paginate (virtualization is planned).
* Prefer \*\*discriminator-based \*\*\`\` with `const` tags for faster branch selection.

## 15. Security considerations

* **No **\`\`** of schema**; input `id`s are sanitized; titles/labels are rendered as text.
* Treat schemas as **untrusted input**; avoid HTML in titles/descriptions (we escape text anyway).
* Remote schemas / `$ref` fetching is **off** by default; if you enable it, enforce CORS, same‑origin or an allow‑list, and consider ETag caching.
* For cross-origin flows (e.g., SPA callbacks), use \`\`\*\* with origin checks\*\*.
* Don’t put secrets in query params (e.g., `?callback_auth=`); prefer short‑lived tokens.
* Consider a **Content Security Policy (CSP)** in production docs.

---

## 16. Feature matrix (supported vs. not yet)

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

### 17.1 Opening SPA via `?schema_url=` may fail due to CORS. Start a tiny server:

```bash
npx http-server examples/spa -p 8080
open http://localhost:8080
```

### 17.2 Unknown keyword
If you supply your own Ajv instance in advanced setups, set `strict:false` or register custom keywords. The default core tolerates vendor keywords.

### 17.3 Enum values saved as strings

For non‑string enums we serialize option values and parse them back. Ensure `enum` and `x-enumNames` lengths match.

### 17.4 Can’t type into **\`\`** or fields drop keystrokes
Ensure you’re on ≥ `0.0.1-beta.1`. Also, don’t unmount/remount the form on each keystroke; keep `schema` stable in React.

### 17.5 never validates

Check `discriminator.propertyName` and that each branch includes a matching `const` for that property.

### 17.6 Intercepting submit
React: use `onBeforeSubmit` to cancel. Web Component/Vanilla: listen for `jsf-submit` and call `event.preventDefault()`.

### 17.7 Scrolling to first error
React focuses the first invalid input on submit. Vanilla/WebC will get focus+anchors in a future release.

---

## 18. Getting Help

18.1 Bugs & feature requests: GitHub Issues (include schema, adapter, Node/Browser versions, minimal repro).
18.2 Questions & ideas: GitHub Discussions.
18.3 Security: email security\@yourdomain (avoid public issues for vulnerabilities).

## 19. Roadmap

* `allOf` merge; `if/then/else` conditional logic
* `$ref` / `$defs` resolution and remote fetch with caching & ETag
* `patternProperties` UI; `uniqueItems` enforcement
* `nullable` toggle widget
* Keep/prune data when switching `oneOf` branches
* Array item reorder; virtualization for very large lists
* Web Component `::part()` styling; improved focus management and error summary links
* Attribute level support of isRequired: true/false
* Testing and verification of WebC usage.
* Update to and ensure a reactive UI.

---

## 20. Developers: local build & repo layout

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

**0.0.1-beta.1**

* Initial beta release.
* Core features: primitives, formats, enums with labels, nested objects, arrays.
* `oneOf/anyOf` with discriminator; `additionalProperties` editor.
* Ajv 8 validation (change + submit), debounced.
* **New:** Rich event model across adapters:

  * React: `onValidate`, `onSubmitFailed`, `onBeforeSubmit`, `onBeforeChange`, `onAfterChange`, `onBranchChange`, `onArrayAdd`, `onArrayRemove`, `onReset`, `onSchemaLoad`, `transformError`.
  * Web Component/Vanilla: DOM events `jsf-before-change` (cancelable), `jsf-change`, `jsf-validate`, `jsf-submit` (cancelable), `jsf-submit-failed`, `jsf-branch`, `jsf-array-add`, `jsf-array-remove`, `jsf-reset`, `jsf-schema`; plus Vanilla options mirroring React hooks.

## 22. Contributing

We welcome issues and PRs. To contribute:

1. Fork and clone the repo
2. `npm i` then `npm run build`
3. Use feature branches and add concise PR descriptions
4. For bug reports, include schema + adapter + versions + repro steps

(A full `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` will be added.)

## 23. Publishing to npm (beta/experimental)

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

**TBD by project owner.** (Common choices: MIT/Apache‑2.0/BSD‑3‑Clause.)

---

## 25. Appendix: Full demo schema (top‑level & nested oneOf, enum, array, additionalProperties)

&#x20;(top‑level & nested oneOf, enum, array, additionalProperties)

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
