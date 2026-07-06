import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type BannerType = "success" | "warning" | "error";

interface StatusBannerProps {
  type: BannerType;
  message: string;
}

/**
 * Pill-shaped colored alert banner — matches the reference
 * style-guide's Success / Warning / Error alert pills.
 */
export function StatusBanner({ type, message }: StatusBannerProps) {
  const { theme } = useTheme();

  const config: Record<BannerType, { bg: string; icon: keyof typeof Feather.glyphMap; text: string }> = {
    success: { bg: theme.success, icon: "check-circle", text: theme.buttonText },
    warning: { bg: theme.warning, icon: "alert-triangle", text: "#3D2E0A" },
    error: { bg: theme.error, icon: "alert-circle", text: "#FFFFFF" },
  };

  const { bg, icon, text } = config[type];

  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Feather name={icon} size={16} color={text} style={styles.icon} />
      <ThemedText type="small" style={{ color: text, fontWeight: "600", flexShrink: 1 }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  icon: {
    marginLeft: 2,
  },
});
