import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

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
  damping: 15,
  mass: 0.3,
  stiffness: 150,
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
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const getBackgroundColor = () => {
    if (disabled) {
      return isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary;
    }
    switch (variant) {
      case "primary":
        return Colors.dark.accent;
      case "secondary":
        return "transparent";
      case "ghost":
        return "transparent";
      case "danger":
        return Colors.dark.error;
      default:
        return Colors.dark.accent;
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return theme.textSecondary;
    }
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return Colors.dark.accent;
      case "ghost":
        return theme.text;
      case "danger":
        return "#FFFFFF";
      default:
        return "#FFFFFF";
    }
  };

  const getBorderColor = () => {
    if (variant === "secondary") {
      return Colors.dark.accent;
    }
    return "transparent";
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 36;
      case "medium":
        return Spacing.buttonHeight;
      case "large":
        return 56;
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
          opacity: disabled ? 0.5 : 1,
        },
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
              size={size === "small" ? 16 : 18}
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
    fontWeight: "600",
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
