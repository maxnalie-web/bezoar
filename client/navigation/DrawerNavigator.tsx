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
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeInLeft, FadeInRight, FadeIn } from "react-native-reanimated";

import AppIcon from "@assets/images/icon.png";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";

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
  { name: "Dashboard", labelKey: "dashboard", icon: "grid" },
  { name: "Patients", labelKey: "patients", icon: "users" },
  { name: "Drugs", labelKey: "drugs", icon: "package" },
  { name: "Sales", labelKey: "sales", icon: "shopping-cart" },
  { name: "Reports", labelKey: "reports", icon: "bar-chart-2" },
  { name: "Backup", labelKey: "backup", icon: "database" },
  { name: "Settings", labelKey: "settings", icon: "settings" },
];

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent({ state, navigation }: DrawerContentComponentProps) {
  const { theme, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index].name;

  const renderBackground = () => {
    if (Platform.OS === "ios") {
      return (
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.backgroundDefault },
        ]}
      />
    );
  };

  return (
    <View style={styles.drawerContainer}>
      {renderBackground()}
      <ScrollView
        style={styles.drawerScroll}
        contentContainerStyle={[
          styles.drawerContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeIn.duration(500)}
          style={[styles.logoContainer, isRTL && styles.logoContainerRTL]}
        >
          <Image
            source={AppIcon}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText type="h4" style={[styles.appName, isRTL && styles.appNameRTL]}>
            {t("appName")}
          </ThemedText>
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

        {drawerItems.map((item, index) => {
          const isActive = currentRoute === item.name;
          const EnterAnimation = isRTL ? FadeInRight : FadeInLeft;
          return (
            <Animated.View
              key={item.name}
              entering={EnterAnimation.delay(index * 50).duration(400)}
            >
              <Pressable
                onPress={() => navigation.navigate(item.name)}
                style={({ pressed }) => [
                  styles.drawerItem,
                  isRTL && styles.drawerItemRTL,
                  isActive && [
                    styles.drawerItemActive,
                    { backgroundColor: theme.accent + "20" },
                  ],
                  pressed && styles.drawerItemPressed,
                ]}
              >
                {isActive && !isRTL ? (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: theme.accent },
                    ]}
                  />
                ) : null}
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? theme.accent : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.drawerItemLabel,
                    isRTL && styles.drawerItemLabelRTL,
                    { color: isActive ? theme.accent : theme.text },
                  ]}
                >
                  {t(item.labelKey)}
                </ThemedText>
                {isActive && isRTL ? (
                  <View
                    style={[
                      styles.activeIndicatorRTL,
                      { backgroundColor: theme.accent },
                    ]}
                  />
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function DrawerNavigator() {
  const { theme, isDark } = useTheme();
  const { isRTL } = useLanguage();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? "permanent" : "front",
        drawerPosition: isRTL ? "right" : "left",
        drawerStyle: {
          width: Spacing.sidebarExpandedWidth,
          backgroundColor: "transparent",
        },
        overlayColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.3)",
        sceneContainerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
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
  },
  drawerScroll: {
    flex: 1,
  },
  drawerContent: {
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  logoContainerRTL: {
    flexDirection: "row-reverse",
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
  },
  appName: {
    marginLeft: Spacing.md,
  },
  appNameRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.xl,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    position: "relative",
  },
  drawerItemRTL: {
    flexDirection: "row-reverse",
  },
  drawerItemActive: {
    borderRadius: BorderRadius.sm,
  },
  drawerItemPressed: {
    opacity: 0.7,
  },
  drawerItemLabel: {
    marginLeft: Spacing.md,
    fontSize: 15,
    fontWeight: "500",
  },
  drawerItemLabelRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "25%",
    bottom: "25%",
    width: 3,
    borderRadius: BorderRadius.full,
  },
  activeIndicatorRTL: {
    position: "absolute",
    right: 0,
    top: "25%",
    bottom: "25%",
    width: 3,
    borderRadius: BorderRadius.full,
  },
});
