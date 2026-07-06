import React, { forwardRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TextStyle,
  Pressable,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FormInputProps extends TextInputProps {
  label?: React.ReactNode;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  onIconPress?: () => void;
  labelStyle?: TextStyle | TextStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  rtl?: boolean;
}

export const FormInput = forwardRef<any, FormInputProps>(
  (
    {
      label,
      error,
      icon,
      onIconPress,
      style,
      labelStyle,
      containerStyle,
      rtl = true,
      placeholderTextColor,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label ? (
          <ThemedText
            type="small"
            style={[
              styles.label,
              {
                color: focused ? theme.accentDark : theme.textSecondary,
                backgroundColor: theme.backgroundRoot,
              },
              typeof label === "string" &&
                (label === "اطلاعات پزشکی" || label === "اطلاعات هویتی") && {
                  top: -Spacing["5xl"],
                  marginBottom: Spacing.lg,
                  fontSize: 22,
                  fontWeight: "600",
                },
              labelStyle,
            ]}
          >
            {label}
          </ThemedText>
        ) : null}
        <View
          style={[
            styles.inputContainer,
            rtl && styles.inputContainerRTL,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: error ? theme.error : focused ? theme.accentGlow : theme.glassBorder,
              borderWidth: focused ? 1.5 : 1,
              shadowColor: theme.accentGlow,
              shadowOpacity: focused ? 0.35 : 0,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              elevation: focused ? 3 : 0,
            },
            containerStyle,
          ]}
        >
          <TextInput
            ref={ref as any}
            style={[
              styles.input,
              icon ? (rtl ? styles.inputWithIconRTL : styles.inputWithIcon) : null,
              style,
              { color: theme.text },
            ]}
            placeholderTextColor={placeholderTextColor ?? theme.textSecondary}
            placeholder={props.placeholder}
            editable={props.editable ?? true}
            selectionColor={theme.accentDark}
            allowFontScaling={true}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {icon ? (
            <Pressable
              onPress={onIconPress}
              style={[styles.iconContainer, rtl && styles.iconContainerRTL]}
              hitSlop={12}
            >
              <Feather name={icon} size={20} color={focused ? theme.accentDark : theme.textSecondary} />
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
);

FormInput.displayName = "FormInput";

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing["2xl"],
    paddingTop: Spacing.lg,
  },
  label: {
    position: "absolute",
    top: -Spacing.md,
    right: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    fontWeight: "500",
    fontSize: 18,
    zIndex: 2,
  },
  labelRTL: {
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 48,
    marginTop: Spacing.xs,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    includeFontPadding: false,
    textAlign: "right",
    lineHeight: 20,
  },
  inputRTL: {
    textAlign: "left",
  },
  inputWithIcon: {
    paddingRight: Spacing["3xl"],
  },
  inputWithIconRTL: {
    paddingLeft: Spacing["3xl"],
  },
  iconContainer: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 3,
    elevation: 3,
  },
  iconContainerRTL: {
    right: undefined,
    left: Spacing.md,
  },
  error: {
    marginTop: Spacing.xs,
    fontSize: 18,
  },
  errorRTL: {
    textAlign: "right",
  },
});
