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
}

export function StatCard({ title, value, icon, trend, onPress }: StatCardProps) {
  const { theme, isDark } = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return theme.success;
      case "down":
        return theme.error;
      default:
        return theme.accent;
    }
  };

  return (
    <GlassCard onPress={onPress} style={styles.card} elevated>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={isDark 
              ? ["rgba(168, 85, 247, 0.25)", "rgba(124, 58, 237, 0.15)"]
              : ["rgba(168, 85, 247, 0.15)", "rgba(124, 58, 237, 0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather name={icon} size={22} color={theme.accent} />
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
  iconWrapper: {
    ...Platform.select({
      ios: Shadows.glow,
      android: {},
      default: {},
    }),
  },
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
