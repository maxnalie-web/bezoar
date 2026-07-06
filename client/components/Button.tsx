import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Shadows } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  icon?: keyof typeof Feather.glyphMap;
  size?: "small" | "medium" | "large";
}

const springConfig: WithSpringConfig = {
  damping: 18,
  mass: 0.4,
  stiffness: 180,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
  size = "medium",
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, springConfig);
      glow.value = withTiming(0.45, { duration: 150 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
      glow.value = withTiming(0, { duration: 250 });
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.backgroundTertiary;
    switch (variant) {
      case "primary":
        return theme.accent;
      case "secondary":
        return "transparent";
      case "ghost":
        return "transparent";
      case "danger":
        return theme.error;
      default:
        return theme.accent;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    switch (variant) {
      case "primary":
        return theme.buttonText;
      case "secondary":
        return theme.accentDark;
      case "ghost":
        return theme.text;
      case "danger":
        return "#FFFFFF";
      default:
        return theme.buttonText;
    }
  };

  const getBorderColor = () => {
    if (variant === "secondary") return theme.accent;
    return "transparent";
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 40;
      case "medium":
        return Spacing.buttonHeight;
      case "large":
        return 58;
      default:
        return Spacing.buttonHeight;
    }
  };

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "secondary" ? 1.5 : 0,
          height: getHeight(),
          opacity: disabled ? 0.6 : 1,
          shadowColor: theme.accentGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 14,
        },
        !disabled && variant === "primary" && Shadows.sm,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? (
            <Feather
              name={icon}
              size={size === "small" ? 16 : 20}
              color={getTextColor()}
              style={styles.icon}
            />
          ) : null}
          <ThemedText
            type={size === "small" ? "small" : "body"}
            style={[styles.buttonText, { color: getTextColor() }]}
          >
            {children}
          </ThemedText>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontWeight: "700",
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
