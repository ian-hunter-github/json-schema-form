#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'jsf-react-demo', 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const jsfReactDep = packageJson.dependencies['@ianhunterpersonal/jsf-react'];
  const jsfCoreDep = packageJson.dependencies['@ianhunterpersonal/jsf-core'];
  
  const isLocalMode = jsfReactDep.startsWith('file:');
  
  console.log('=== Current JSF Demo Mode ===');
  console.log(`Mode: ${isLocalMode ? 'LOCAL' : 'NPM'}`);
  console.log(`JSF React: ${jsfReactDep}`);
  if (jsfCoreDep) {
    console.log(`JSF Core: ${jsfCoreDep}`);
  } else {
    console.log('JSF Core: Not installed (NPM mode)');
  }
  console.log('=============================');
  console.log('Available commands:');
  console.log('  npm run use-local  - Switch to local development mode');
  console.log('  npm run use-npm    - Switch to npm package mode');
  console.log('  npm run switch-mode - Toggle between modes');
  
} catch (error) {
  console.error('Error reading package.json:', error.message);
}
