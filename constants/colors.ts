/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens keep the app's visual identity in one place.
 *
 * Replace the values below when the product brand changes.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F4F7FA',
    tint: '#41D6C3',
    background: '#0A1118',
    foreground: '#F4F7FA',
    card: '#111D27',
    cardForeground: '#F4F7FA',
    primary: '#41D6C3',
    primaryForeground: '#071014',
    secondary: '#1A2935',
    secondaryForeground: '#C9D5DD',
    muted: '#16232E',
    mutedForeground: '#8EA0AD',
    accent: '#F3B562',
    accentForeground: '#241A0E',
    destructive: '#F06C6C',
    destructiveForeground: '#FFFFFF',
    border: '#233543',
    input: '#203340',
  },

  // Shared radius for cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
