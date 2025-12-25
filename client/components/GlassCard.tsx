import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors, Shadows } from "@/constants/theme";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
  elevated?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 18,
  mass: 0.4,
  stiffness: 180,
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
  elevated = false,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, springConfig);
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
      borderColor: isDark ? Colors.dark.glassBorder : Colors.light.glassBorder,
    },
    elevated && Platform.OS === "ios" && Shadows.md,
    style,
  ];

  const renderBackground = () => {
    if (Platform.OS === "ios") {
      return (
        <>
          <BlurView
            intensity={isDark ? 50 : 60}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, styles.blurView]}
          />
          <View 
            style={[
              StyleSheet.absoluteFill, 
              styles.blurView, 
              { 
                backgroundColor: isDark 
                  ? "rgba(168, 85, 247, 0.03)" 
                  : "rgba(168, 85, 247, 0.02)" 
              }
            ]} 
          />
        </>
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.blurView,
          { 
            backgroundColor: isDark 
              ? theme.backgroundDefault 
              : theme.backgroundDefault,
            borderWidth: 0,
          },
        ]}
      >
        <LinearGradient
          colors={isDark 
            ? ["rgba(168, 85, 247, 0.08)", "rgba(168, 85, 247, 0.02)"] 
            : ["rgba(168, 85, 247, 0.04)", "rgba(168, 85, 247, 0.01)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardPadding: {
    padding: Spacing.lg,
  },
  blurView: {
    borderRadius: BorderRadius.xl,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginBottom: Spacing.md,
  },
});
