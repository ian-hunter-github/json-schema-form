# JSF React Demo - Split Pane Layout

This demo application showcases the JSON Schema Form (JSF) React component with a split-pane layout.

## Features

- **Left Pane**: Interactive JSON Schema Form with various field types
- **Right Pane**: Real-time JSON output that updates as you fill out the form
- **Responsive Design**: Adapts to mobile devices with vertical stacking
- **Syntax Highlighting**: Color-coded JSON display for better readability

## Form Schema

The demo includes a comprehensive schema with:
- Basic string, number, and boolean fields
- Date and email format validation
- Enum fields with custom labels
- Nested objects and arrays
- OneOf discriminators (Person/Company profile selection)
- Additional properties (dynamic key-value pairs)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5174`

## Build for Production

```bash
npm run build
```

## How It Works

The application uses:
- `JsonSchemaForm` component from `@ianhunterpersonal/jsf-react` for the form
- React state management to track form data changes
- Custom `JsonDisplay` component for syntax-highlighted JSON output
- CSS Grid/Flexbox for the split-pane layout

## File Structure

- `src/App.tsx` - Main application component with split-pane layout
- `src/JsonDisplay.tsx` - Component for displaying formatted JSON
- `src/App.css` - Styles for the split-pane layout and JSON display
- `src/main.tsx` - React application entry point

## Customization

You can modify the form schema in `App.tsx` to test different JSON Schema configurations. The split-pane layout will automatically adapt to your changes.
