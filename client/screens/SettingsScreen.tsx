import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";

import AppIcon from "@assets/images/icon.png";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const { theme, isDark, toggleColorScheme } = useTheme();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.menuButton} />
        <ThemedText style={styles.headerTitle}>
          {t("settings")}
        </ThemedText>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ThemedText style={styles.sectionTitle}>
            {t("appearance")}
          </ThemedText>
          <View style={styles.section}>
            <View style={[styles.themeRow, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.themeIconContainer}>
                <Feather name={isDark ? "moon" : "sun"} size={22} color={theme.accent} />
                <View style={styles.themeTextBlock}>
                  <ThemedText type="title" style={styles.themeTitle}>{t("theme")}</ThemedText>
                  <ThemedText type="body" style={styles.themeSubtitle}>
                    {isDark ? t("darkMode") : t("lightMode")}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleColorScheme}
                trackColor={{ false: theme.backgroundTertiary, true: theme.accent }}
                thumbColor={theme.buttonText}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ThemedText style={styles.sectionTitle}>
            {t("dataManagement")}
          </ThemedText>
          <View style={styles.section}>
            <ListItem
              title={t("backup")}
              subtitle="مدیریت پشتیبان‌های داده"
              leftIcon="database"
              onPress={() => (navigation as any).navigate("Backup")}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <ThemedText style={styles.sectionTitle}>
            {t("about")}
          </ThemedText>
          <View style={styles.section}>
            <ListItem
              title={`${t("about")} ${t("appName")}`}
              subtitle={`${t("version")} 1.0.0`}
              leftIcon="info"
              onPress={handleAbout}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400).duration(500)}>
          <GlassCard style={styles.appInfo}>
            <View style={[styles.appIconContainer, { backgroundColor: theme.accent + "20" }]}>
              <Image
                source={AppIcon}
                style={styles.appIcon}
                contentFit="contain"
              />
            </View>
            <ThemedText type="title" style={{ marginBottom: Spacing.xs }}>
              {t("appName")}
            </ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary }}>
              {t("patientDrugManagement")}
            </ThemedText>
            <ThemedText type="caption" style={{ textAlign: "center", color: theme.accent }}>
              {t("madeWithLove")} ❤️
            </ThemedText>
            <ThemedText type="caption" style={{ textAlign: "center", color: theme.textSecondary }}>
              {t("version")} 1.0.0
            </ThemedText>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );

  function handleAbout() {
    Alert.alert(
      `${t("about")} ${t("appName")}`,
      `${t("appName")} ${t("version")} 1.0.0\n\n${t("appDescription")}\n\n${t("madeWithLove")} ❤️`,
      [{ text: t("confirm") }]
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 24,
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
    fontWeight: "500",
    fontSize: 18,
    lineHeight: 24,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginLeft: Spacing.lg,
    marginRight: Spacing.lg,
    textAlign: "left",
  },
  section: {
    marginBottom: Spacing.md,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  themeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeTextBlock: {
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: Spacing.md,
  },
  themeSubtitle: {
    color: "#999",
    marginTop: 6,
    textAlign: "left",
  },
  themeTitle: {
    fontWeight: "500",
    textAlign: "left",
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
    overflow: "hidden",
  },
  appIcon: {
    width: 64,
    height: 64,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  madeWith: {
    marginTop: Spacing.lg,
  },
  version: {
    marginTop: Spacing.sm,
  },
});