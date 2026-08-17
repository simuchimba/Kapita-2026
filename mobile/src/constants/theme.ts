// Ported from frontend/tailwind.config.js + frontend/src/index.css so the
// mobile app matches the web app's brand exactly rather than an approximation.

const lightColors = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  navy: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',
  warning: '#d97706',
  warningBg: '#fffbeb',
  success: '#16a34a',
  successBg: '#f0fdf4',
  info: '#2563eb',
  white: '#ffffff',
  card: '#ffffff',
  background: '#f9fafb',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#6b7280',
};

// Dark palette: same token shape as light, so any component reading
// `colors.gray[50]` etc. gets the correct value for the active theme
// without needing to know which mode is active.
const darkColors = {
  primary: {
    50: '#052e21',
    100: '#06371f',
    200: '#0a4a2c',
    300: '#0d5c36',
    400: '#10b981',
    500: '#22c55e',
    600: '#34d399',
    700: '#6ee7b7',
    800: '#a7f3d0',
    900: '#d1fae5',
  },
  navy: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc',
  },
  gray: {
    50: '#18181b',
    100: '#1f2126',
    200: '#2a2d34',
    300: '#3a3d45',
    400: '#5b5f6a',
    500: '#7d818c',
    600: '#a1a5b0',
    700: '#c4c7cf',
    800: '#e2e4e9',
    900: '#f5f6f8',
  },
  danger: '#f87171',
  dangerBg: '#3a1414',
  dangerBorder: '#5c1f1f',
  warning: '#fbbf24',
  warningBg: '#3a2c0a',
  success: '#4ade80',
  successBg: '#0f2b1a',
  info: '#60a5fa',
  white: '#f5f6f8',
  card: '#1f2126',
  background: '#141518',
  border: '#2a2d34',
  text: '#f5f6f8',
  textMuted: '#a1a5b0',
};

export type Palette = typeof lightColors;

export const palettes: { light: Palette; dark: Palette } = {
  light: lightColors,
  dark: darkColors,
};

// Static default export — used by components that haven't been migrated to
// useAppTheme() yet. Always the light palette; dark-mode-aware components
// should use `const { colors } = useAppTheme()` instead of this import.
export const colors = lightColors;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export function getTypography(c: Palette) {
  return {
    title: { fontSize: 22, fontWeight: '700' as const, color: c.gray[900] },
    subtitle: { fontSize: 14, color: c.gray[500] },
    label: { fontSize: 13, fontWeight: '600' as const, color: c.gray[700] },
    body: { fontSize: 15, color: c.gray[900] },
    caption: { fontSize: 12, color: c.gray[500] },
  };
}

// Static default — light palette. Dark-mode-aware components should build
// their own typography from useAppTheme()'s colors via getTypography().
export const typography = getTypography(lightColors);
