#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'jsf-react-demo', 'package.json');
const appTsxPath = path.join(__dirname, '..', 'jsf-react-demo', 'src', 'App.tsx');

// Read files
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let appContent = fs.readFileSync(appTsxPath, 'utf8');

// Determine current mode by checking the jsf-react dependency
const currentJsFReactDep = packageJson.dependencies['@ianhunterpersonal/jsf-react'];
const isLocalMode = currentJsFReactDep.startsWith('file:');

console.log(`Current mode: ${isLocalMode ? 'LOCAL' : 'NPM'}`);

// Toggle the dependencies
if (isLocalMode) {
  // Switch to NPM mode
  console.log('Switching to NPM mode...');
  
  // Update package.json
  packageJson.dependencies['@ianhunterpersonal/jsf-react'] = 'latest';
  delete packageJson.dependencies['@ianhunterpersonal/jsf-core'];
  
  // Update App.tsx - change CSS import from local to npm
  appContent = appContent.replace(
    /import '\.\.\/\.\.\/packages\/jsf-react\/src\/styles\/theme-fun\.css';/,
    "import '@ianhunterpersonal/jsf-react/dist/styles/theme-professional.css';"
  );
  
  // Remove jsf-core import if it exists
  appContent = appContent.replace(
    /import { applyDefaults } from "@ianhunterpersonal\/jsf-core";\n/,
    ''
  );
  
  // Replace applyDefaults usage
  appContent = appContent.replace(
    /const initialData = useMemo\(\(\) => applyDefaults\(schema, \{\}\), \[schema\]\);/,
    'const initialData = useMemo(() => ({}), [schema]);'
  );
  
} else {
  // Switch to LOCAL mode
  console.log('Switching to LOCAL mode...');
  
  // Update package.json
  packageJson.dependencies['@ianhunterpersonal/jsf-react'] = 'file:../packages/jsf-react';
  packageJson.dependencies['@ianhunterpersonal/jsf-core'] = 'file:../packages/jsf-core';
  
  // Update App.tsx - change CSS import from npm to local
  appContent = appContent.replace(
    /import '@ianhunterpersonal\/jsf-react\/dist\/styles\/theme-[\w-]+\.css';/,
    "import '../../packages/jsf-react/src/styles/theme-fun.css';"
  );
  
  // Add jsf-core import
  if (!appContent.includes('@ianhunterpersonal/jsf-core')) {
    appContent = appContent.replace(
      /import \* as JSF from "@ianhunterpersonal\/jsf-react";/,
      'import * as JSF from "@ianhunterpersonal/jsf-react";\nimport { applyDefaults } from "@ianhunterpersonal/jsf-core";'
    );
  }
  
  // Restore applyDefaults usage
  appContent = appContent.replace(
    /const initialData = useMemo\(\(\) => \(\{\}\), \[schema\]\);/,
    'const initialData = useMemo(() => applyDefaults(schema, {}), [schema]);'
  );
}

// Write the updated files
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
fs.writeFileSync(appTsxPath, appContent);

console.log('Files updated successfully!');
console.log('Run "npm install" to apply the dependency changes.');
