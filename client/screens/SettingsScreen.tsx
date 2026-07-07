import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import AppIcon from "@assets/images/icon.png";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";

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
        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: AuroraGradient.violet }]} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("appearance")}
            </ThemedText>
          </View>
          <View style={styles.section}>
            <GlassCard accentColor={AuroraGradient.violet} noPadding style={styles.themeCard}>
              <View style={styles.themeRow}>
                <View style={styles.themeIconContainer}>
                  <LinearGradient
                    colors={[AuroraGradient.violet + (isDark ? "40" : "26"), AuroraGradient.violetLight + (isDark ? "20" : "12")]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBadge}
                  >
                    <Feather name={isDark ? "moon" : "sun"} size={20} color={AuroraGradient.violet} />
                  </LinearGradient>
                  <View style={styles.themeTextBlock}>
                    <ThemedText type="title" style={styles.themeTitle}>{t("theme")}</ThemedText>
                    <ThemedText type="body" style={[styles.themeSubtitle, { color: theme.textSecondary }]}>
                      {isDark ? t("darkMode") : t("lightMode")}
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleColorScheme}
                  trackColor={{ false: theme.backgroundTertiary, true: AuroraGradient.violet }}
                  thumbColor={theme.buttonText}
                />
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* Data management */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: AuroraGradient.rose }]} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("dataManagement")}
            </ThemedText>
          </View>
          <View style={styles.section}>
            <ListItem
              title={t("backup")}
              subtitle="مدیریت پشتیبان‌های داده"
              leftIcon="database"
              rtl={isRTL}
              onPress={() => (navigation as any).navigate("Backup")}
            />
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: AuroraGradient.teal }]} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {t("about")}
            </ThemedText>
          </View>
          <View style={styles.section}>
            <ListItem
              title={`${t("about")} ${t("appName")}`}
              subtitle={`${t("version")} 1.0.0`}
              leftIcon="info"
              rtl={isRTL}
              onPress={handleAbout}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400).duration(500)}>
          <GlassCard style={styles.appInfo} accentColor={AuroraGradient.teal} elevated>
            <LinearGradient
              colors={[AuroraGradient.teal, AuroraGradient.violet, AuroraGradient.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appIconRing}
            >
              <View style={[styles.appIconContainer, { backgroundColor: theme.backgroundDefault }]}>
                <Image
                  source={AppIcon}
                  style={styles.appIcon}
                  contentFit="contain"
                />
              </View>
            </LinearGradient>
            <ThemedText type="title" style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}>
              {t("appName")}
            </ThemedText>
            <ThemedText type="body" style={{ textAlign: "center", color: theme.textSecondary }}>
              {t("patientDrugManagement")}
            </ThemedText>
            <ThemedText type="caption" style={{ textAlign: "center", color: AuroraGradient.magenta, marginTop: Spacing.sm }}>
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
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginLeft: Spacing.lg,
    marginRight: Spacing.lg,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    textAlign: "right",
  },
  section: {
    marginBottom: Spacing.md,
  },
  themeCard: {
    marginTop: Spacing.xs,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  themeIconContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTextBlock: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginRight: Spacing.md,
  },
  themeSubtitle: {
    marginTop: 6,
    textAlign: "right",
  },
  themeTitle: {
    fontWeight: "500",
    textAlign: "right",
  },
  appInfo: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing["2xl"],
  },
  appIconRing: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  appIconContainer: {
    width: 78,
    height: 78,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
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
