# Accordion Header Styling Implementation

## Overview

This implementation adds visual emphasis to accordion headers by setting contrasting background colors that work across all themes in the JSON Schema Form library.

## Implementation Details

### CSS Variables Added

The following CSS custom properties have been added to all theme files:

- `--accordion-header-bg`: Background color for accordion headers
- `--accordion-header-hover`: Hover state background color for accordion headers

### Theme-Specific Colors

Each theme has been configured with appropriate accordion header colors:

#### Light Theme
- `--accordion-header-bg: var(--lightblue-100)` - Light blue background
- `--accordion-header-hover: var(--lightblue-200)` - Slightly darker blue on hover

#### Dark Theme  
- `--accordion-header-bg: var(--purple-800)` - Dark purple background
- `--accordion-header-hover: var(--purple-700)` - Lighter purple on hover

#### Solar Theme
- `--accordion-header-bg: var(--yellow-200)` - Bright yellow background
- `--accordion-header-hover: var(--yellow-300)` - Slightly darker yellow on hover

#### Professional Theme
- `--accordion-header-bg: var(--blue-100)` - Light blue background
- `--accordion-header-hover: var(--blue-200)` - Medium blue on hover

#### Formal Theme
- `--accordion-header-bg: var(--purple-100)` - Light purple background  
- `--accordion-header-hover: var(--purple-200)` - Medium purple on hover

#### Fun Theme
- `--accordion-header-bg: var(--yellow-100)` - Light yellow background
- `--accordion-header-hover: var(--yellow-200)` - Medium yellow on hover

#### Minimal Theme
- `--accordion-header-bg: var(--gray-200)` - Light gray background
- `--accordion-header-hover: var(--gray-300)` - Medium gray on hover

### Default Fallback

The base semantic tokens file (`_semantic-tokens.css`) provides sensible defaults:
- `--accordion-header-bg: var(--accordion-header-bg, var(--surface-variant))`
- `--accordion-header-hover: var(--accordion-header-hover, var(--surface-variant-hover, #e5e5e5))`

This ensures that even if a theme doesn't define these variables explicitly, accordions will still have proper styling.

### Component Integration

The accordion styling is implemented in `_components.css` and uses the CSS variables:
```css
.jsf-accordion-header {
  background: var(--accordion-header-bg, var(--surface-variant, #f5f5f5));
  /* ... */
}

.jsf-accordion-header:hover {
  background: var(--accordion-header-hover, var(--surface-variant-hover, #e5e5e5));
}
```

## Testing

A test file `test-accordion-styling.html` has been created to demonstrate the accordion styling across different theme color schemes. Users can select different themes to see how the accordion headers change color.

## Benefits

1. **Visual Hierarchy**: Accordion headers now have clear visual distinction from form content
2. **Theme Consistency**: Colors are derived from each theme's color palette for consistency
3. **Accessibility**: Sufficient contrast between header background and text colors
4. **Hover States**: Interactive hover effects improve user experience
5. **Fallback Support**: Graceful degradation if CSS variables aren't defined

The implementation ensures that accordion headers provide clear visual cues while maintaining the aesthetic consistency of each theme.
