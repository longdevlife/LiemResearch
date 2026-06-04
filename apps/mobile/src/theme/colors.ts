/**
 * Source of truth for colors. Mirrors tailwind.config.js so JS code outside
 * NativeWind className (e.g., StatusBar, navigation theming) stays in sync.
 */
export const colors = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  primary: "#18181b",
  primaryForeground: "#fafafa",
  border: "#e4e4e7",
} as const;
