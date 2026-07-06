import React from "react";
import { View, StyleSheet, Platform, I18nManager } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  trend?: "up" | "down" | "neutral";
  onPress?: () => void;
  color?: string;
}

export function StatCard({ title, value, icon, trend, onPress, color }: StatCardProps) {
  const { theme, isDark } = useTheme();
  const accent = color ?? theme.accent;

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return theme.success;
      case "down":
        return theme.error;
      default:
        return accent;
    }
  };

  return (
    <GlassCard onPress={onPress} style={styles.card} elevated accentColor={accent}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, Platform.OS === "ios" ? { shadowColor: accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 } : null]}>
          <LinearGradient
            colors={[accent + (isDark ? "40" : "26"), accent + (isDark ? "20" : "12")]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name={icon} size={22} color={accent} />
          </LinearGradient>
        </View>
        {trend ? (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + "20" }]}>
            <Feather
              name={trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "minus"}
              size={14}
              color={getTrendColor()}
            />
          </View>
        ) : null}
      </View>
      <ThemedText type="h3" style={[styles.value, I18nManager.isRTL && styles.valueRTL, { color: theme.text }]}>
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.title, I18nManager.isRTL && styles.titleRTL, { color: theme.textSecondary }]}
      >
        {title}
      </ThemedText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconWrapper: {},
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  trendBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  value: {
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  valueRTL: {
    textAlign: "right",
  },
  title: {
    fontWeight: "500",
  },
  titleRTL: {
    textAlign: "right",
  },
});
