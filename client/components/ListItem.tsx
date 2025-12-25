import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon = "chevron-right",
  onPress,
  badge,
  badgeColor,
}: ListItemProps) {
  const { theme, isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: isDark ? Colors.dark.glassBorder : Colors.light.glassBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      {leftIcon ? (
        <View
          style={[
            styles.leftIconContainer,
            { backgroundColor: Colors.dark.accent + "20" },
          ]}
        >
          <Feather name={leftIcon} size={18} color={Colors.dark.accent} />
        </View>
      ) : null}
      <View style={styles.content}>
        <ThemedText type="body" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            type="small"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor || Colors.dark.accent },
          ]}
        >
          <ThemedText type="small" style={styles.badgeText}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      {onPress ? (
        <Feather name={rightIcon} size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  leftIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
  },
  subtitle: {
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
});
