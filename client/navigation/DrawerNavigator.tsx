import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { createDrawerNavigator, DrawerContentComponentProps } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Elevation } from "@/constants/theme";
import AppLogo from "@assets/images/logo.png";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import SearchScreen from "@/screens/SearchScreen";
import DrugsScreen from "@/screens/DrugsScreen";
import Inventory from "@/screens/InventoryScreen";
import BackupScreen from "@/screens/BackupScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export type DrawerParamList = {
  MainTabs: undefined;
  Search: undefined;
  Drugs: undefined;
  Inventory: undefined;
  Backup: undefined;
  Settings: undefined;
};

type DrawerItemConfig = {
  name: keyof DrawerParamList;
  labelKey: string;
  icon: keyof typeof Feather.glyphMap;
};

const drawerItems: DrawerItemConfig[] = [
  { name: "MainTabs", labelKey: "dashboard", icon: "home" },
  { name: "Search", labelKey: "search", icon: "search" },
  { name: "Drugs", labelKey: "drugs", icon: "package" },
  { name: "Inventory", labelKey: "inventory", icon: "archive" },
  { name: "Backup", labelKey: "backup", icon: "database" },
  { name: "Settings", labelKey: "settings", icon: "settings" },
];

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.drawerContainer, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.capsuleContainer,
          {
            backgroundColor: theme.capsuleBackground,
            borderColor: theme.capsuleBorder,
            marginTop: insets.top + Spacing.lg,
            marginBottom: insets.bottom + Spacing.lg,
          },
          Elevation[5],
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              entering={FadeIn.duration(500)}
              style={styles.logoContainer}
            >
              <Image
                source={AppLogo}
                style={styles.logoImage}
                contentFit="contain"
              />
              <ThemedText type="h4" style={styles.appName}>
                {t("appName")}
              </ThemedText>
            </Animated.View>

            <View style={styles.navSection}>
              {drawerItems.map((item, index) => {
                const isActive = currentRoute === item.name;
                return (
                  <Animated.View
                    key={item.name}
                    entering={FadeInRight.delay(index * 50).duration(400)}
                  >
                    <Pressable
                      onPress={() => navigation.navigate(item.name)}
                      style={({ pressed }) => [
                        styles.drawerItem,
                        { backgroundColor: isActive ? theme.accent + "22" : "transparent" },
                        pressed && styles.drawerItemPressed,
                      ]}
                    >
                      {isActive ? (
                        <View
                          style={[styles.activeIndicator, { backgroundColor: theme.accentDark }]}
                        />
                      ) : null}
                      <View style={styles.iconContainer}>
                        <Feather
                          name={item.icon}
                          size={20}
                          color={isActive ? theme.accentDark : theme.textSecondary}
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.drawerItemLabel,
                          { color: isActive ? theme.text : theme.textSecondary },
                          isActive && { fontWeight: "700" },
                        ]}
                      >
                        {t(item.labelKey)}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? "permanent" : "front",
        drawerPosition: "right",
        drawerStyle: {
          width: Spacing.sidebarExpandedWidth,
          backgroundColor: "transparent",
        },
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(20, 30, 27, 0.35)",
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
      <Drawer.Screen name="Search" component={SearchScreen} />
      <Drawer.Screen name="Drugs" component={DrugsScreen} />
      <Drawer.Screen name="Inventory" component={Inventory} />
      <Drawer.Screen name="Backup" component={BackupScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  capsuleContainer: {
    flex: 1,
    borderRadius: BorderRadius.capsule,
    borderWidth: 1,
    overflow: "hidden",
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  appName: {
    marginTop: Spacing.xs,
  },
  navSection: {
    gap: Spacing.xs,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: "relative",
    overflow: "hidden",
  },
  drawerItemPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: {
    marginLeft: Spacing.md,
    fontSize: 15,
    flex: 1,
    textAlign: "left",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: BorderRadius.full,
  },
});
