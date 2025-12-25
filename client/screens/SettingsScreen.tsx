import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleLanguagePress = () => {
    Alert.alert(
      "Language",
      "Language selection will be available in a future update. Currently displaying in English.",
      [{ text: "OK" }]
    );
  };

  const handleThemePress = () => {
    Alert.alert(
      "Theme",
      "Dark mode is enabled by default. Light mode support coming in a future update.",
      [{ text: "OK" }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About Bezoar",
      "Bezoar v1.0.0\n\nA patient and drug management application for tracking sales and payments.\n\nDesigned for offline-first usage with local data storage.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Settings</ThemedText>
        <View style={styles.menuButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          APPEARANCE
        </ThemedText>
        <View style={styles.section}>
          <ListItem
            title="Language"
            subtitle="English"
            leftIcon="globe"
            onPress={handleLanguagePress}
          />
          <ListItem
            title="Theme"
            subtitle="Dark Mode"
            leftIcon="moon"
            onPress={handleThemePress}
          />
        </View>

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DATA MANAGEMENT
        </ThemedText>
        <View style={styles.section}>
          <ListItem
            title="Backup & Restore"
            subtitle="Manage your data backups"
            leftIcon="database"
            onPress={() => (navigation as any).navigate("Backup")}
          />
        </View>

        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ABOUT
        </ThemedText>
        <View style={styles.section}>
          <ListItem
            title="About Bezoar"
            subtitle="Version 1.0.0"
            leftIcon="info"
            onPress={handleAbout}
          />
        </View>

        <GlassCard style={styles.appInfo}>
          <View style={[styles.appIconContainer, { backgroundColor: Colors.dark.accent + "20" }]}>
            <Feather name="package" size={32} color={Colors.dark.accent} />
          </View>
          <ThemedText type="h4" style={styles.appName}>
            Bezoar
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Patient & Drug Management
          </ThemedText>
          <ThemedText type="small" style={[styles.version, { color: theme.textSecondary }]}>
            v1.0.0
          </ThemedText>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  appInfo: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing["2xl"],
  },
  appIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  version: {
    marginTop: Spacing.md,
  },
});
