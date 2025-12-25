import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  onIconPress?: () => void;
}

export function FormInput({
  label,
  error,
  icon,
  onIconPress,
  style,
  ...props
}: FormInputProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText
        type="small"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundSecondary,
            borderColor: error
              ? Colors.dark.error
              : isDark
                ? Colors.dark.glassBorder
                : Colors.light.glassBorder,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            icon ? styles.inputWithIcon : null,
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          {...props}
        />
        {icon ? (
          <Pressable
            onPress={onIconPress}
            style={styles.iconContainer}
            hitSlop={8}
          >
            <Feather name={icon} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText
          type="small"
          style={[styles.error, { color: Colors.dark.error }]}
        >
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: Spacing["3xl"],
  },
  iconContainer: {
    position: "absolute",
    right: Spacing.md,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
