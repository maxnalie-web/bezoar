import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Switch } from "react-native";
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

  const handleAbout = () => {
    Alert.alert(
      `${t("about")} ${t("appName")}`,
      `${t("appName")} ${t("version")} 1.0.0\n\n${t("appDescription")}`,
      [{ text: t("confirm") }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, styles.headerRTL, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("settings")}</ThemedText>
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
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: "right" }]}>
            {t("appearance").toUpperCase()}
          </ThemedText>
          <View style={styles.section}>
            <View style={[styles.themeRow, { backgroundColor: theme.backgroundDefault }, styles.themeRowRTL]}>
              <View style={[styles.themeIconContainer, styles.themeIconContainerRTL]}>
                <Feather name={isDark ? "moon" : "sun"} size={22} color={theme.accent} />
                <View style={styles.themeTextRTL}>
                  <ThemedText style={[styles.themeTitle, { textAlign: "right" }]}>{t("theme")}</ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
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
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: "right" }]}>
            {t("dataManagement").toUpperCase()}
          </ThemedText>
          <View style={styles.section}>
            <ListItem
              title={t("backup")}
              subtitle="مدیریت پشتیبان‌های داده"
              leftIcon="database"
              onPress={() => (navigation as any).navigate("Backup")}
              rtl={true}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: "right" }]}>
            {t("about").toUpperCase()}
          </ThemedText>
          <View style={styles.section}>
            <ListItem
              title={`${t("about")} ${t("appName")}`}
              subtitle={`${t("version")} 1.0.0`}
              leftIcon="info"
              onPress={handleAbout}
              rtl={true}
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
            <ThemedText type="h4" style={styles.appName}>
              {t("appName")}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              {t("patientDrugManagement")}
            </ThemedText>
            <ThemedText type="small" style={[styles.version, { color: theme.textSecondary }]}>
              {t("version")} 1.0.0
            </ThemedText>
          </GlassCard>
        </Animated.View>
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
  headerRTL: {
    flexDirection: "row-reverse",
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
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  themeRowRTL: {
    flexDirection: "row-reverse",
  },
  themeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeIconContainerRTL: {
    flexDirection: "row-reverse",
  },
  themeTextRTL: {
    marginRight: Spacing.md,
    marginLeft: 0,
  },
  themeTitle: {
    fontWeight: "500",
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
  version: {
    marginTop: Spacing.md,
  },
});
