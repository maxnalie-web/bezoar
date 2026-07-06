import { Platform } from "react-native";

// ─────────────────────────────────────────────────────────────
// MINT — a light, soft, pastel design system built to match a
// reference product style-guide: seafoam-mint primary, pure white
// surfaces, pill-shaped buttons/chips/tabs, a glowing teal focus
// ring, and a 5-level soft-shadow elevation scale.
// ─────────────────────────────────────────────────────────────

const mint = {
  primary: "#7BDDC4",
  primaryDark: "#4FC7A8",
  primaryLight: "#B7EFE0",
  surface: "#FFFFFE",
  border: "#E6E9F0",
  focusRing: "#00CFCC",
  success: "#6FDCB3",
  warning: "#F5D98B",
  warningStrong: "#E0AA3E",
  error: "#F3A9A9",
  errorStrong: "#E06A6A",
};

export const Colors = {
  light: {
    text: "#20262E",
    textSecondary: "#7A8290",
    buttonText: "#16362E",
    tabIconDefault: "#A6ADBB",
    tabIconSelected: mint.primaryDark,
    link: mint.primaryDark,
    accent: mint.primary,
    accentLight: mint.primaryLight,
    accentDark: mint.primaryDark,
    accentGlow: mint.focusRing,
    accentSecondary: mint.focusRing,
    accentTertiary: mint.primaryDark,
    backgroundRoot: "#F6FBFA",
    backgroundDefault: mint.surface,
    backgroundSecondary: "#F0F4F3",
    backgroundTertiary: "#E9EEEC",
    glass: "rgba(255, 255, 255, 0.96)",
    glassBorder: mint.border,
    success: mint.success,
    warning: mint.warningStrong,
    error: mint.errorStrong,
    info: mint.focusRing,
    cardShadow: "rgba(40, 60, 55, 0.10)",
    gradient: ["#F6FBFA", "#EAF7F3"],
    gradientAurora: [mint.primary, mint.focusRing, mint.primaryDark],
    capsuleBackground: "#FFFFFE",
    capsuleBorder: mint.border,
    activeGradient: ["rgba(123, 221, 196, 0.28)", "rgba(0, 207, 204, 0.10)"],
  },
  dark: {
    text: "#EAF6F2",
    textSecondary: "#8FA39C",
    buttonText: "#16362E",
    tabIconDefault: "#5C6B66",
    tabIconSelected: mint.primary,
    link: mint.primary,
    accent: mint.primary,
    accentLight: mint.primaryLight,
    accentDark: mint.primaryDark,
    accentGlow: mint.focusRing,
    accentSecondary: mint.focusRing,
    accentTertiary: mint.primaryDark,
    backgroundRoot: "#0E1613",
    backgroundDefault: "#141F1B",
    backgroundSecondary: "#192723",
    backgroundTertiary: "#20302A",
    glass: "rgba(20, 31, 27, 0.94)",
    glassBorder: "rgba(123, 221, 196, 0.22)",
    success: mint.success,
    warning: mint.warningStrong,
    error: mint.errorStrong,
    info: mint.focusRing,
    cardShadow: "rgba(0, 207, 204, 0.10)",
    gradient: ["#0E1613", "#141F1B"],
    gradientAurora: [mint.primary, mint.focusRing, mint.primaryDark],
    capsuleBackground: "#141F1B",
    capsuleBorder: "rgba(123, 221, 196, 0.18)",
    activeGradient: ["rgba(123, 221, 196, 0.22)", "rgba(0, 207, 204, 0.10)"],
  },
};

export const Mint = mint;
export const AuroraGradient = {
  teal: mint.focusRing,
  tealLight: "#5CE8E5",
  violet: mint.primaryDark,
  violetLight: mint.primaryLight,
  magenta: mint.primaryDark,
  magentaLight: mint.primary,
  amber: mint.warningStrong,
  emerald: mint.success,
  rose: mint.errorStrong,
  sky: mint.focusRing,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 52,
  buttonHeight: 54,
  sidebarWidth: 72,
  sidebarExpandedWidth: 260,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 36,
  "3xl": 48,
  capsule: 60,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    lineHeight: 42,
  },
  h2: {
    fontSize: 25,
    fontWeight: "700" as const,
    letterSpacing: -0.2,
    lineHeight: 34,
  },
  h3: {
    fontSize: 21,
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 30,
  },
  h4: {
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 25,
  },
  small: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 21,
  },
  link: {
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "Vazirmatn-Regular",
    medium: "Vazirmatn-Medium",
    bold: "Vazirmatn-Bold",
  },
  android: {
    sans: "Vazirmatn-Regular",
    medium: "Vazirmatn-Medium",
    bold: "Vazirmatn-Bold",
  },
  default: {
    sans: "Vazirmatn-Regular",
    medium: "Vazirmatn-Medium",
    bold: "Vazirmatn-Bold",
  },
  web: {
    sans: "'Vazirmatn', 'Tahoma', sans-serif",
    medium: "'Vazirmatn', 'Tahoma', sans-serif",
    bold: "'Vazirmatn', 'Tahoma', sans-serif",
  },
});

export const GlassStyles = {
  blur: 20,
  opacity: 0.96,
  borderWidth: 1,
};

// A five-level soft-shadow elevation scale, matching the reference
// style-guide's "Level 1..5" stacked-card elevation demo.
export const Elevation = {
  1: { shadowColor: "#1F2924", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  2: { shadowColor: "#1F2924", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  3: { shadowColor: "#1F2924", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  4: { shadowColor: "#1F2924", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
  5: { shadowColor: "#1F2924", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 10 },
};

export const Shadows = {
  sm: Elevation[1],
  md: Elevation[3],
  lg: Elevation[4],
  glow: {
    shadowColor: mint.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  capsule: Elevation[5],
};
