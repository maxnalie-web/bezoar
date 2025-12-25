import { Platform } from "react-native";

const neonPurple = "#A855F7";
const neonPurpleLight = "#C084FC";
const neonPurpleDark = "#7C3AED";
const neonPurpleGlow = "#D8B4FE";

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: neonPurple,
    link: neonPurple,
    accent: neonPurple,
    accentLight: neonPurpleLight,
    accentDark: neonPurpleDark,
    accentGlow: neonPurpleGlow,
    backgroundRoot: "#F8F9FA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F0F0F3",
    backgroundTertiary: "#E5E5E8",
    glass: "rgba(255, 255, 255, 0.85)",
    glassBorder: "rgba(168, 85, 247, 0.15)",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    cardShadow: "rgba(0, 0, 0, 0.08)",
    gradient: ["#F8F9FA", "#EDE9FE"],
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: neonPurple,
    link: neonPurpleLight,
    accent: neonPurple,
    accentLight: neonPurpleLight,
    accentDark: neonPurpleDark,
    accentGlow: neonPurpleGlow,
    backgroundRoot: "#0A0A0F",
    backgroundDefault: "#12121A",
    backgroundSecondary: "#1A1A25",
    backgroundTertiary: "#232330",
    glass: "rgba(18, 18, 26, 0.85)",
    glassBorder: "rgba(168, 85, 247, 0.25)",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    cardShadow: "rgba(168, 85, 247, 0.1)",
    gradient: ["#0A0A0F", "#1A0A25"],
  },
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
  sidebarExpandedWidth: 240,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  h2: {
    fontSize: 26,
    fontWeight: "700" as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 26,
  },
  small: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  link: {
    fontSize: 15,
    fontWeight: "500" as const,
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
  blur: 25,
  opacity: 0.85,
  borderWidth: 1,
};

export const Shadows = {
  sm: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
