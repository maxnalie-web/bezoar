import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  trend?: "up" | "down" | "neutral";
  onPress?: () => void;
}

export function StatCard({ title, value, icon, trend, onPress }: StatCardProps) {
  const { theme } = useTheme();

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
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={[styles.header, styles.headerRTL]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.accent + "20" },
          ]}
        >
          <Feather name={icon} size={20} color={theme.accent} />
        </View>
        {trend ? (
          <Feather
            name={trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "minus"}
            size={16}
            color={getTrendColor()}
          />
        ) : null}
      </View>
      <ThemedText type="h3" style={[styles.value, styles.valueRTL]}>
        {value}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.title, styles.titleRTL, { color: theme.textSecondary }]}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    marginBottom: Spacing.xs,
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
