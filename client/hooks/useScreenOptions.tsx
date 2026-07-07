import React from "react";
import { Pressable } from "react-native";
import { StackNavigationOptions } from "@react-navigation/stack";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";

interface UseScreenOptionsParams {
  transparent?: boolean;
}

function RTLBackButton({ color }: { color: string }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={{ paddingHorizontal: Spacing.md }}
    >
      <Feather name="arrow-right" size={24} color={color} />
    </Pressable>
  );
}

export function useScreenOptions({
  transparent = false,
}: UseScreenOptionsParams = {}): StackNavigationOptions {
  const { theme } = useTheme();
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
    headerLeft: isRTL ? () => <RTLBackButton color={theme.text} /> : undefined,
    gestureEnabled: true,
    gestureDirection: isRTL ? "horizontal-inverted" : "horizontal",
    cardStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
}
