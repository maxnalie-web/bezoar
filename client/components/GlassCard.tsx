import React from "react";
import { I18nManager } from "react-native";
import { StyleSheet, Pressable, ViewStyle, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Elevation } from "@/constants/theme";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
  elevated?: boolean;
  accentColor?: string;
}

const springConfig: WithSpringConfig = {
  damping: 18,
  mass: 0.4,
  stiffness: 180,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Flat white "surface" card with a soft multi-level shadow — matches the
 * reference style-guide's card + elevation system (no glass/blur effects).
 */
export function GlassCard({
  title,
  subtitle,
  children,
  onPress,
  style,
  noPadding = false,
  elevated = false,
  accentColor,
}: GlassCardProps) {
  const { theme } = useTheme();
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

  const cardContent = (
    <>
      {title ? (
        <ThemedText type="h4" style={styles.cardTitle}>
          {title}
        </ThemedText>
      ) : null}
      {subtitle ? (
        <ThemedText
          type="small"
          style={[styles.cardSubtitle, { color: theme.textSecondary }]}
        >
          {subtitle}
        </ThemedText>
      ) : null}
      {children}
    </>
  );

  const containerStyle = [
    styles.card,
    !noPadding && styles.cardPadding,
    {
      backgroundColor: theme.backgroundDefault,
      borderColor: accentColor ? accentColor + "35" : theme.glassBorder,
    },
    elevated ? Elevation[3] : Elevation[1],
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, animatedStyle]}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return <View style={containerStyle}>{cardContent}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignSelf: "stretch",
  },
  cardPadding: {
    padding: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
});
