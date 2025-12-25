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
import { Spacing, BorderRadius } from "@/constants/theme";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  onIconPress?: () => void;
  rtl?: boolean;
}

export function FormInput({
  label,
  error,
  icon,
  onIconPress,
  style,
  rtl = false,
  ...props
}: FormInputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText
        type="small"
        style={[
          styles.label,
          { color: theme.textSecondary },
          rtl && styles.labelRTL,
        ]}
      >
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputContainer,
          rtl && styles.inputContainerRTL,
          {
            backgroundColor: theme.backgroundSecondary,
            borderColor: error ? theme.error : theme.glassBorder,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: theme.text },
            icon ? styles.inputWithIcon : null,
            rtl && styles.inputRTL,
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          textAlign={rtl ? "right" : "left"}
          {...props}
        />
        {icon ? (
          <Pressable
            onPress={onIconPress}
            style={[styles.iconContainer, rtl && styles.iconContainerRTL]}
            hitSlop={8}
          >
            <Feather name={icon} size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText
          type="small"
          style={[styles.error, { color: theme.error }, rtl && styles.errorRTL]}
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
  labelRTL: {
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    height: Spacing.inputHeight,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  inputRTL: {
    textAlign: "right",
  },
  inputWithIcon: {
    paddingRight: Spacing["3xl"],
  },
  iconContainer: {
    position: "absolute",
    right: Spacing.md,
  },
  iconContainerRTL: {
    right: undefined,
    left: Spacing.md,
  },
  error: {
    marginTop: Spacing.xs,
  },
  errorRTL: {
    textAlign: "right",
  },
});
