import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  rtl?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 18,
  mass: 0.4,
  stiffness: 180,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon = "chevron-left",
  badge,
  badgeColor,
  onPress,
  rtl = false,
}: ListItemProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        rtl && styles.containerRTL,
        { 
          backgroundColor: theme.backgroundDefault,
          borderColor: isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.08)",
        },
        animatedStyle,
      ]}
    >
      {leftIcon ? (
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={isDark 
              ? ["rgba(168, 85, 247, 0.20)", "rgba(124, 58, 237, 0.10)"]
              : ["rgba(168, 85, 247, 0.12)", "rgba(124, 58, 237, 0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconContainer, rtl && styles.iconContainerRTL]}
          >
            <Feather name={leftIcon} size={20} color={theme.accent} />
          </LinearGradient>
        </View>
      ) : null}
      <View style={[styles.content, rtl && styles.contentRTL]}>
        <ThemedText
          type="body"
          style={[styles.title, rtl && styles.titleRTL]}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            type="small"
            style={[styles.subtitle, rtl && styles.subtitleRTL, { color: theme.textSecondary }]}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View
          style={[
            styles.badge,
            { backgroundColor: (badgeColor || theme.accent) + "20" },
          ]}
        >
          <ThemedText
            type="small"
            style={[styles.badgeText, { color: badgeColor || theme.accent }]}
          >
            {badge}
          </ThemedText>
        </View>
      ) : null}
      {onPress ? (
        <View style={[styles.chevronContainer, rtl && styles.chevronContainerRTL]}>
          <Feather
            name={rtl ? "chevron-left" : "chevron-right"}
            size={20}
            color={theme.textSecondary}
          />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  iconWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: "#A855F7",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {},
      default: {},
    }),
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  iconContainerRTL: {
    marginRight: 0,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentRTL: {
    alignItems: "flex-end",
  },
  title: {
    fontWeight: "500",
    marginBottom: 2,
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
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontWeight: "600",
    fontSize: 12,
  },
  chevronContainer: {
    marginLeft: Spacing.xs,
  },
  chevronContainerRTL: {
    marginLeft: 0,
    marginRight: Spacing.xs,
  },
});
