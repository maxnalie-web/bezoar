import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";
import AppLogo from "@assets/images/logo.png";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={AppLogo}
        style={styles.icon}
        contentFit="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 32,
    height: 32,
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});
