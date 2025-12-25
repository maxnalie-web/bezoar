import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Colors, Shadows } from "@/constants/theme";

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
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
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
        return 40;
      case "medium":
        return Spacing.buttonHeight;
      case "large":
        return 58;
      default:
        return Spacing.buttonHeight;
    }
  };

  const getGradientColors = (): [string, string] => {
    if (disabled) {
      return isDark 
        ? [Colors.dark.backgroundSecondary, Colors.dark.backgroundSecondary]
        : [Colors.light.backgroundSecondary, Colors.light.backgroundSecondary];
    }
    switch (variant) {
      case "primary":
        return ["#A855F7", "#7C3AED"];
      case "secondary":
        return ["transparent", "transparent"];
      case "ghost":
        return ["transparent", "transparent"];
      case "danger":
        return ["#EF4444", "#DC2626"];
      default:
        return ["#A855F7", "#7C3AED"];
    }
  };

  const content = (
    <>
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
    </>
  );

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          borderColor: getBorderColor(),
          borderWidth: variant === "secondary" ? 2 : 0,
          height: getHeight(),
          opacity: disabled ? 0.5 : 1,
        },
        variant === "primary" && Platform.OS === "ios" && !disabled && Shadows.glow,
        style,
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: BorderRadius.full }]}
      />
      {content}
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
    overflow: "hidden",
  },
  buttonText: {
    fontWeight: "600",
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
