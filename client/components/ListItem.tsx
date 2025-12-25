import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  rtl?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon = "chevron-right",
  onPress,
  badge,
  badgeColor,
  rtl = false,
}: ListItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.container,
        rtl && styles.containerRTL,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      {leftIcon ? (
        <View
          style={[
            styles.leftIconContainer,
            rtl && styles.leftIconContainerRTL,
            { backgroundColor: theme.accent + "20" },
          ]}
        >
          <Feather name={leftIcon} size={18} color={theme.accent} />
        </View>
      ) : null}
      <View style={styles.content}>
        <ThemedText 
          type="body" 
          style={[styles.title, rtl && styles.titleRTL]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            type="small"
            style={[
              styles.subtitle, 
              rtl && styles.subtitleRTL,
              { color: theme.textSecondary }
            ]}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            rtl && styles.badgeRTL,
            { backgroundColor: badgeColor || theme.accent },
          ]}
        >
          <ThemedText type="small" style={styles.badgeText}>
            {badge}
          </ThemedText>
        </View>
      ) : null}
      {onPress ? (
        <Feather 
          name={rtl ? "chevron-left" : rightIcon} 
          size={20} 
          color={theme.textSecondary} 
        />
      ) : null}
    </AnimatedPressable>
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
  containerRTL: {
    flexDirection: "row-reverse",
  },
  leftIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  leftIconContainerRTL: {
    marginRight: 0,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "500",
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    marginTop: 2,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  badgeRTL: {
    marginRight: 0,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
});
