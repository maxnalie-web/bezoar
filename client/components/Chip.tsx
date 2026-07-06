import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Pill-shaped filter chip — matches the reference style-guide's
 * Filter / Selected / Disabled chip states.
 */
export function Chip({ label, selected = false, disabled = false, icon, onPress, style }: ChipProps) {
  const { theme } = useTheme();

  const backgroundColor = disabled
    ? theme.backgroundTertiary
    : selected
    ? theme.accent
    : theme.backgroundSecondary;

  const textColor = disabled ? theme.textSecondary : selected ? theme.buttonText : theme.text;
  const borderColor = disabled ? theme.glassBorder : selected ? theme.accent : theme.glassBorder;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.chip,
        { backgroundColor, borderColor },
        style,
      ]}
    >
      {selected && !icon ? (
        <Feather name="check" size={14} color={textColor} style={styles.icon} />
      ) : icon ? (
        <Feather name={icon} size={14} color={textColor} style={styles.icon} />
      ) : null}
      <ThemedText type="small" style={{ color: textColor, fontWeight: selected ? "700" : "500" }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  icon: {
    marginLeft: 2,
  },
});
