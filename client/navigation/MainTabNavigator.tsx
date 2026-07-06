import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { BorderRadius, Spacing, Elevation } from "@/constants/theme";

import DashboardScreen from "@/screens/DashboardScreen";
import PatientsScreen from "@/screens/PatientsScreen";
import SalesScreen from "@/screens/SalesScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";

export type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Sales: undefined;
  Reports: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, keyof typeof Feather.glyphMap> = {
  Dashboard: "home",
  Patients: "users",
  Sales: "shopping-bag",
  Reports: "bar-chart-2",
  Notifications: "bell",
};

const tabLabels: Record<keyof MainTabParamList, string> = {
  Dashboard: "dashboard",
  Patients: "patients",
  Sales: "sales",
  Reports: "reports",
  Notifications: "notifications",
};

export default function MainTabNavigator() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.accentDark,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Feather name={tabIcons[route.name as keyof MainTabParamList]} size={size ?? 22} color={color} />
        ),
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.glassBorder,
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
          },
          Elevation[4],
        ],
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t("dashboard") }} />
      <Tab.Screen name="Patients" component={PatientsScreen} options={{ tabBarLabel: t("patients") }} />
      <Tab.Screen name="Sales" component={SalesScreen} options={{ tabBarLabel: t("sales") }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarLabel: t("reports") }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: t("notifications") }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: Platform.OS === "ios" ? 0 : Spacing.sm,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderTopWidth: 1,
  },
});
