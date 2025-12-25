import { StatusBar } from "expo-status-bar";
import { useThemeContext } from "@/contexts/ThemeContext";

export function AppStatusBar() {
  const { isDark } = useThemeContext();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
