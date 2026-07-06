import React from "react";
import {
  Platform,
  ScrollView,
  ScrollViewProps,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import type { KeyboardAwareScrollViewProps } from "react-native-keyboard-controller";

type Props = KeyboardAwareScrollViewProps & ScrollViewProps;

/**
 * Cross-platform keyboard-aware scroll container.
 * - iOS: react-native-keyboard-controller
 * - Android: KeyboardAvoidingView + ScrollView
 */
export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  contentContainerStyle,
  ...props
}: Props) {
  if (Platform.OS === "ios") {
    const { KeyboardAwareScrollView } = require("react-native-keyboard-controller");

    return (
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...props}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  // Android fallback — wrap in KeyboardAvoidingView so the keyboard doesn't cover inputs
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="height"
      keyboardVerticalOffset={80}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
