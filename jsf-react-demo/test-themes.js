// Simple test to verify theme functionality
const { availableThemes, setTheme, getThemeByName } = require('./src/themeUtils');

console.log('Available themes:', availableThemes.map(t => t.name));

// Test setting each theme
availableThemes.forEach(theme => {
  console.log(`\nTesting theme: ${theme.name}`);
  setTheme(theme.name);
  
  // Check if theme class is applied
  const htmlClass = document.documentElement.className;
  console.log(`HTML class: ${htmlClass}`);
  console.log(`Theme applied: ${htmlClass.includes(`theme-${theme.name}`)}`);
});

console.log('\nTheme switching test completed!');
