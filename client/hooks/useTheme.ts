import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";

export function useTheme() {
  const { colorScheme, isDark, setColorScheme, toggleColorScheme } = useThemeContext();
  const theme = Colors[colorScheme];

  return {
    theme,
    isDark,
    colorScheme,
    setColorScheme,
    toggleColorScheme,
  };
}
