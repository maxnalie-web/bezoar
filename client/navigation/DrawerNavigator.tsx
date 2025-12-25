import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { createDrawerNavigator, DrawerContentComponentProps } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInRight, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

import DashboardScreen from "@/screens/DashboardScreen";
import PatientsScreen from "@/screens/PatientsScreen";
import DrugsScreen from "@/screens/DrugsScreen";
import SalesScreen from "@/screens/SalesScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import BackupScreen from "@/screens/BackupScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export type DrawerParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Drugs: undefined;
  Sales: undefined;
  Reports: undefined;
  Backup: undefined;
  Settings: undefined;
};

type DrawerItemConfig = {
  name: keyof DrawerParamList;
  labelKey: string;
  icon: keyof typeof Feather.glyphMap;
};

const drawerItems: DrawerItemConfig[] = [
  { name: "Dashboard", labelKey: "dashboard", icon: "home" },
  { name: "Patients", labelKey: "patients", icon: "users" },
  { name: "Drugs", labelKey: "drugs", icon: "package" },
  { name: "Sales", labelKey: "sales", icon: "shopping-bag" },
  { name: "Reports", labelKey: "reports", icon: "bar-chart-2" },
  { name: "Backup", labelKey: "backup", icon: "database" },
  { name: "Settings", labelKey: "settings", icon: "settings" },
];

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index].name;

  return (
    <View style={[styles.drawerContainer, { backgroundColor: theme.backgroundRoot }]}>
      <View 
        style={[
          styles.capsuleContainer,
          { 
            backgroundColor: isDark ? theme.capsuleBackground : theme.capsuleBackground,
            borderColor: theme.capsuleBorder,
            marginTop: insets.top + Spacing.lg,
            marginBottom: insets.bottom + Spacing.lg,
          },
          Platform.OS === "ios" && Shadows.capsule,
        ]}
      >
        <ScrollView
          style={styles.drawerScroll}
          contentContainerStyle={styles.drawerContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={styles.logoContainer}
          >
            <View style={[styles.logoIcon, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="activity" size={22} color={theme.accent} />
            </View>
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
                      pressed && styles.drawerItemPressed,
                    ]}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={theme.activeGradient as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.activeBackground, { borderColor: theme.accent + "40" }]}
                      />
                    ) : null}
                    {isActive ? (
                      <View
                        style={[
                          styles.activeIndicator,
                          { backgroundColor: theme.accent },
                          Shadows.glow,
                        ]}
                      />
                    ) : null}
                    <View style={[styles.iconContainer, isActive && { backgroundColor: isDark ? theme.accent + "15" : theme.accent + "10" }]}>
                      <Feather
                        name={item.icon}
                        size={20}
                        color={isActive ? theme.accent : theme.textSecondary}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.drawerItemLabel,
                        { color: isActive ? theme.text : theme.textSecondary },
                        isActive && { fontWeight: "600" },
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
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  const { theme, isDark } = useTheme();
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
        overlayColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Patients" component={PatientsScreen} />
      <Drawer.Screen name="Drugs" component={DrugsScreen} />
      <Drawer.Screen name="Sales" component={SalesScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
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
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.sm,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    marginRight: Spacing.md,
  },
  navSection: {
    gap: Spacing.xs,
  },
  drawerItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: "relative",
    overflow: "hidden",
  },
  activeBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  drawerItemPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: {
    marginRight: Spacing.md,
    fontSize: 15,
    flex: 1,
    textAlign: "right",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: BorderRadius.full,
  },
});
