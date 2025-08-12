import React, { useMemo } from "react";
import * as JSF from "@totnesdev/jsf-react";
import '@totnesdev/jsf-react/styles.css';// Use whichever export the package provides:
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
      <h1 style={{ marginBottom: 8 }}>@totnesdev/jsf-react — Demo</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        Top-level & nested <code>oneOf</code>, enum, arrays (incl. array of objects), and <code>additionalProperties</code>.
      </p>

      <JsonSchemaForm
        schema={schema}
        constVisibility="hidden"
        autoConstTagging={true}
        constErrorStrategy="suppress-when-managed"
        oneOfBranchTitleVisibility="hidden"
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
