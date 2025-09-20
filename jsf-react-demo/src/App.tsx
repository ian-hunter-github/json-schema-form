import React, { useMemo, useState, useEffect } from "react";
import * as JSF from "@ianhunterpersonal/jsf-react";
import { applyDefaults } from "@ianhunterpersonal/jsf-core";
import JsonDisplay from "./JsonDisplay";
import { availableThemes, getThemeByName, getDefaultTheme, ThemeInfo, setTheme } from "./themeUtils";

import './App.css';


const JsonSchemaForm: any = (JSF as any).JsonSchemaForm ?? (JSF as any).default;

const demoSchema = {
  $id: "react-demo",
  type: "object",
  properties: {
    title: { type: "string", title: "Title", isRequired: true },
    details: {
      type: "object",
      title: "Details",
      properties: {
        category: { 
          type: "string", 
          title: "Category",
          enum: ["personal", "business", "education"],
          "x-enumNames": ["Personal", "Business", "Education"]
        },
        status: { 
          type: "string", 
          title: "Status",
          enum: ["new", "in-progress", "completed"],
          "x-enumNames": ["New", "In Progress", "Completed"]
        },
        startDate: { type: "string", format: "date", title: "Start Date" },
        endDate: { type: "string", format: "date", title: "End Date" },
        description: { type: "string", title: "Description", format: "textarea" },
        notes: { type: "string", title: "Additional Notes", format: "textarea" },
        attachments: {
          type: "array",
          title: "Attachments",
          items: { type: "string", format: "uri", title: "URL" }
        }
      },
      required: ["category", "status", "startDate"]
    },
    profile: {
      title: "Profile",
      oneOf: [
        {
          title: "Person",
          type: "object",
          properties: {
            kind: { const: "person" },
            first: { type: "string", title: "First name" },
            last: { type: "string", title: "Last name" },
            dob: { type: "string", format: "date", title: "Date of Birth" },
            gender: { 
              type: "string", 
              title: "Gender",
              enum: ["male", "female", "other"],
              "x-enumNames": ["Male", "Female", "Other"]
            },
            occupation: { type: "string", title: "Occupation" },
            bio: { type: "string", title: "Biography", format: "textarea" }
          },
          required: ["kind", "first", "last", "dob"]
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
  required: ["priority"]
} as const;

export default function App() {
  const schema = useMemo(() => demoSchema, []);
  const [formData, setFormData] = useState<any>({});
  const [currentTheme, setCurrentTheme] = useState<ThemeInfo>(getDefaultTheme());

  // Generate initial data with defaults from schema
  const initialData = useMemo(() => {
    const data = applyDefaults(schema, {});
    // Add some test metadata to see the table
    data.metadata = {
      testKey: "testValue",
      anotherKey: "",
      complexKey: JSON.stringify({ nested: "object" })
    };
    return data;
  }, [schema]);

  // Load theme CSS dynamically
  useEffect(() => {
    setTheme(currentTheme.name);
  }, [currentTheme]);

  // Set initial theme on component mount
  useEffect(() => {
    setTheme(getDefaultTheme().name);
  }, []);

  const handleFormChange = (data: any) => {
    setFormData(data);
  };

  const handleThemeChange = (themeName: string) => {
    const theme = getThemeByName(themeName);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  return (
    <div className="split-pane">
      <div className="pane left-pane">
        <div className="form-container">
          {/* Toolbar with theme selector */}
          <div className="toolbar">
            <h1 style={{ marginBottom: 8, flex: 1 }}>@ianhunterpersonal/jsf-react — Demo</h1>
            <div className="theme-selector">
              <label htmlFor="theme-select">Theme: </label>
              <select
                id="theme-select"
                value={currentTheme.name}
                onChange={(e) => handleThemeChange(e.target.value)}
                style={{ marginLeft: '8px', padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {availableThemes.map((theme) => (
                  <option key={theme.name} value={theme.name}>
                    {theme.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ color: "#555", marginTop: 0 }}>
            Top-level & nested <code>oneOf</code>, enum, arrays (incl. array of objects), and <code>additionalProperties</code>.
          </p>

          <JsonSchemaForm
            schema={schema}
            initialData={initialData}
            constVisibility="hidden"
            autoConstTagging={true}
            constErrorStrategy="suppress-when-managed"
            oneOfBranchTitleVisibility="hidden"
            oneOfBranchShowDescription={true}
            onSubmit={(data: any) => {
              console.log("onSubmit callback called with data:", data);
              alert("Submitted data:\\n" + JSON.stringify(data, null, 2));
            }}
            transformError={(e: any) => {
              if (e.keyword === "format" && e.path.endsWith("email")) {
                return { ...e, message: "Please enter a valid email address" };
              }
              return e;
            }}
            showReset
            onChange={handleFormChange}
          />
        </div>
      </div>
      
      <div className="pane right-pane">
        <JsonDisplay data={formData} />
      </div>
    </div>
  );
}
