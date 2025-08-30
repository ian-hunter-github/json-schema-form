# JSF Demo Mode Switching Solution

## Problem
Previously, there were two separate demo projects:
- `jsf-react-demo`: Used local file references to packages
- `jsf-react-npm-demo`: Used npm package references

This was inefficient and required maintaining two nearly identical projects.

## Solution
A single demo project (`jsf-react-demo`) with scripts to easily switch between local development mode and npm package mode.

## Implementation

### Scripts Created

1. **`scripts/switch-mode.js`** - Main switching script that:
   - Toggles package.json dependencies between local file references and npm packages
   - Updates CSS imports in App.tsx to match the mode
   - Handles jsf-core import/usage differences

2. **`scripts/check-mode.js`** - Utility to check current mode and available commands

### Package.json Scripts Added

- `npm run use-local` - Switch to local mode and run npm install
- `npm run use-npm` - Switch to npm mode and run npm install  
- `npm run switch-mode` - Toggle between modes without installing
- `npm run check-mode` - Display current mode and available commands

### Mode Differences Handled

#### Local Mode
- Dependencies: `file:../packages/jsf-react`, `file:../packages/jsf-core`
- CSS Import: `../../packages/jsf-react/src/styles/theme-fun.css`
- Includes direct access to `@ianhunterpersonal/jsf-core` utilities

#### NPM Mode  
- Dependencies: `@ianhunterpersonal/jsf-react@latest`
- CSS Import: `@ianhunterpersonal/jsf-react/dist/styles/theme-professional.css`
- jsf-core is not directly imported (included as dependency)

## Usage

### Check Current Mode
```bash
cd jsf-react-demo
npm run check-mode
```

### Switch to Local Development Mode
```bash
npm run use-local
```

### Switch to NPM Package Mode  
```bash
npm run use-npm
```

### Toggle Between Modes
```bash
npm run switch-mode
```

## Benefits

1. **Single Project** - No more maintaining two separate demo projects
2. **Easy Switching** - Simple npm commands to change modes
3. **Comprehensive** - Handles all differences (dependencies, CSS imports, jsf-core usage)
4. **Documented** - Clear README with usage instructions
5. **Robust** - Tested round-trip switching works correctly

## Files Modified/Created

- `jsf-react-demo/package.json` - Added mode switching scripts
- `jsf-react-demo/README.md` - Comprehensive documentation
- `scripts/switch-mode.js` - Main switching logic
- `scripts/check-mode.js` - Mode checking utility
- `DEMO_MODE_SWITCHING.md` - This summary document

## Testing

The solution has been tested with:
- ✅ Switching from LOCAL → NPM mode
- ✅ Switching from NPM → LOCAL mode (round-trip)
- ✅ Package.json dependency updates
- ✅ App.tsx CSS import updates  
- ✅ jsf-core import/usage handling
- ✅ Mode checking utility

The system successfully consolidates two demo projects into one with easy mode switching capabilities.
