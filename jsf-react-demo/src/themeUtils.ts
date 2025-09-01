// Utility function to get available themes
export interface ThemeInfo {
  name: string;
  displayName: string;
}

// Known theme patterns - this maps file names to display names
const themeNameMap: Record<string, string> = {
  'light': 'Light',
  'dark': 'Dark',
  'professional': 'Professional',
  'formal': 'Formal',
  'fun': 'Fun',
  'minimal': 'Minimal',
  'solar': 'Solar',
  'royal': 'Royal',
};

// List of available themes - dynamically generated based on known patterns
export const availableThemes: ThemeInfo[] = Object.entries(themeNameMap).map(([name, displayName]) => ({
  name,
  displayName,
}));

// Function to get theme by name
export const getThemeByName = (name: string): ThemeInfo | undefined => {
  return availableThemes.find(theme => theme.name === name);
};

// Function to get default theme (light)
export const getDefaultTheme = (): ThemeInfo => {
  return availableThemes.find(theme => theme.name === 'light')!;
};

// Function to get theme display name from file name
export const getThemeDisplayName = (fileName: string): string => {
  const themeName = fileName.replace('theme-', '').replace('.css', '');
  return themeNameMap[themeName] || themeName.charAt(0).toUpperCase() + themeName.slice(1);
};

// Function to set the current theme
export function setTheme(themeName: string) {
  // Remove any existing theme classes
  document.documentElement.className = '';
  // Add the new theme class
  document.documentElement.classList.add(`theme-${themeName}`);
  console.log(`Setting theme to: ${themeName}`);
}
