import { Platform } from "react-native";
import { StackNavigationOptions } from "@react-navigation/stack";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseScreenOptionsParams {
  transparent?: boolean;
}

export function useScreenOptions({
  transparent = false,
}: UseScreenOptionsParams = {}): StackNavigationOptions {
  const { theme, isDark } = useTheme();
  const { isRTL } = useLanguage();

  return {
    headerTitleAlign: "center",
    headerTransparent: transparent,
    headerTintColor: theme.text,
    headerTitleStyle: {
      color: theme.text,
      fontWeight: "600",
    },
    headerStyle: {
      backgroundColor: transparent ? undefined : theme.backgroundDefault,
    },
    gestureEnabled: true,
    gestureDirection: isRTL ? "horizontal-inverted" : "horizontal",
    cardStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
}
