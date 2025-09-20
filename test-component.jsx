import React from "react";
import { AdditionalPropertiesRenderer } from "./packages/jsf-react/src/components/fields/AdditionalPropertiesRenderer";

// Simple test component to verify the AdditionalPropertiesRenderer works
export function TestComponent() {
  const props = {
    path: "metadata",
    classNamePrefix: "jsf-",
    additionalSchema: { type: "string", title: "Value" },
    value: {
      customField1: "test value",
      customField2: "",
      customField3: { nested: "object" }
    },
    isDirty: false,
    onChange: async (path, value) => console.log("Change:", path, value),
    getSchemaAtPath: () => ({}),
    applyConstTagsForBranch: () => {},
    checkShouldUseAccordion: () => false,
    constVisibility: "hidden",
    autoConstTagging: true,
    constErrorStrategy: "suppress-when-managed",
    hiddenConstPathsRef: { current: new Set() },
    constPathsRef: { current: new Set() },
    engineRef: { 
      current: { 
        getState: () => ({ data: {} }),
        reset: () => {}
      } 
    },
    setTick: () => {},
    runPostChange: () => {},
    schemaProperties: {}
  };

  return (
    <div>
      <h2>Test AdditionalPropertiesRenderer</h2>
      <AdditionalPropertiesRenderer {...props} />
    </div>
  );
}
