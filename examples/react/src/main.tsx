import React from "react";
import { createRoot } from "react-dom/client";
import { JsonSchemaForm } from "@ianhunterpersonal/jsf-react";


const schema = {
  $id: "demo",
  type: "object",
  properties: {
    name: { type: "string", title: "Name", default: "Alice" },
    email: { type: "string", format: "email", title: "Email" },
    age: { type: "integer", title: "Age" },
    status: { type: "string", enum: ["new","active","suspended"], "x-enumNames": ["New","Active","Suspended"] },
    profile: {
      title: "Profile",
      oneOf: [
        { title: "Person", type: "object", properties: { kind: { const: "person" }, first: { type: "string" } }, required: ["kind","first"], discriminator: { propertyName: "kind" } },
        { title: "Company", type: "object", properties: { kind: { const: "company" }, company: { type: "string" } }, required: ["kind","company"], discriminator: { propertyName: "kind" } }
      ],
      discriminator: { propertyName: "kind" }
    },
    extras: { title: "Extras", type: "object", properties: {}, additionalProperties: { type: "string" } }
  },
  required: ["name","email"]
};

function App() {
  return (
    <div style={{maxWidth: 700, margin: "24px auto"}}>
      <h1>JSON Schema Form (React)</h1>
      <JsonSchemaForm
        schema={schema}
        onChange={(d)=>console.log("change", d)}
        onSubmit={(d)=>alert(JSON.stringify(d,null,2))}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
