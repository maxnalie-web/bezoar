import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  title,
  subtitle,
  children,
  onPress,
  style,
  noPadding = false,
}: GlassCardProps) {
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
    { borderColor: isDark ? Colors.dark.glassBorder : Colors.light.glassBorder },
    style,
  ];

  const renderBackground = () => {
    if (Platform.OS === "ios") {
      return (
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, styles.blurView]}
        />
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.blurView,
          { backgroundColor: theme.backgroundDefault },
        ]}
      />
    );
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[containerStyle, animatedStyle]}
      >
        {renderBackground()}
        {cardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      {renderBackground()}
      {cardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardPadding: {
    padding: Spacing.lg,
  },
  blurView: {
    borderRadius: BorderRadius.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
});
