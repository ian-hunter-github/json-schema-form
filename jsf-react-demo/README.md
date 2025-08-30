# JSF React Demo

A demo application for the `@ianhunterpersonal/jsf-react` JSON Schema Form library.

## Features

- **Single project** that can switch between local development and npm package modes
- **Easy switching** between local file references and published npm packages
- **Comprehensive demo** with various JSON Schema features including:
  - OneOf discriminators
  - Arrays and arrays of objects
  - Enums with custom labels
  - Additional properties
  - Form validation
  - Real-time form data display

## Usage

### Check Current Mode

```bash
npm run check-mode
```

This will show whether you're currently using local development files or npm packages.

### Switch to Local Development Mode

```bash
npm run use-local
```

This will:
- Switch dependencies to use local file references (`file:../packages/jsf-react`, `file:../packages/jsf-core`)
- Update CSS imports to use local source files
- Install the local dependencies

### Switch to NPM Package Mode

```bash
npm run use-npm
```

This will:
- Switch dependencies to use npm packages (`@ianhunterpersonal/jsf-react@latest`)
- Update CSS imports to use npm package distribution files
- Remove the jsf-core dependency (it's included as a dependency of jsf-react)
- Install the npm packages

### Toggle Between Modes

```bash
npm run switch-mode
```

This will toggle between local and npm modes without automatically running `npm install`.

### Development

```bash
npm run dev
```

Starts the development server on port 5173.

### Build

```bash
npm run build
```

Builds the application for production.

## Mode Differences

### Local Mode
- Uses `file:../packages/jsf-react` and `file:../packages/jsf-core` dependencies
- CSS imported from local source: `../../packages/jsf-react/src/styles/theme-fun.css`
- Includes direct access to `@ianhunterpersonal/jsf-core` utilities like `applyDefaults`

### NPM Mode
- Uses `@ianhunterpersonal/jsf-react@latest` from npm
- CSS imported from npm package: `@ianhunterpersonal/jsf-react/dist/styles/theme-professional.css`
- jsf-core is not directly imported (it's a dependency of jsf-react)

## Project Structure

- `src/App.tsx` - Main demo application with comprehensive JSON Schema form
- `src/JsonDisplay.tsx` - Component to display form data in real-time
- `src/App.css` - Styling for the split-pane layout
- `package.json` - Contains scripts for mode switching

## Switching Process

When you switch modes, the system:
1. Updates `package.json` dependencies
2. Modifies `src/App.tsx` to handle CSS import differences
3. Handles jsf-core import/usage differences
4. (Optional) Runs `npm install` to apply dependency changes

## Notes

- After switching modes, you may need to restart the development server if it was already running
- The npm mode uses the latest published version of the packages
- Local mode requires the packages to be built (`npm run build` in each package directory)
