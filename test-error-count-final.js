// Test script to verify error count functionality
const { JsonSchemaForm } = require('./packages/jsf-react/dist/index.cjs');
const React = require('react');
const { createRoot } = require('react-dom/client');

const schema = {
  type: "object",
  properties: {
    person: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2 },
        age: { type: "integer", minimum: 0 }
      },
      required: ["name", "age"]
    }
  }
};

const initialData = {
  person: {
    name: "", // Will cause error
    age: -5   // Will cause error
  }
};

console.log("Testing error count functionality...");

// Create a simple test component
function TestComponent() {
  const [errorCounts, setErrorCounts] = React.useState({});
  
  const handleErrorChange = (errors, errorCounts) => {
    console.log("Error counts:", errorCounts);
    setErrorCounts(errorCounts);
  };

  return React.createElement(JsonSchemaForm, {
    schema,
    initialData,
    debug: true,
    onErrorChange: handleErrorChange
  });
}

console.log("Test component created successfully");
console.log("Expected: Both name and age fields should have errors");
console.log("Expected: Person object should have errorCount > 0");
console.log("Expected: Root object should have errorCount > 0");
