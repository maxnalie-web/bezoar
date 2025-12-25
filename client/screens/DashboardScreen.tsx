import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Image } from "expo-image";

import AppIcon from "@assets/images/icon.png";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { GlassCard } from "@/components/GlassCard";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { getPatients, getDrugs, getSales, getInstallments } from "@/lib/storage";
import { Patient, Sale, DashboardStats } from "@/types/models";

export default function DashboardScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalSales: 0,
    totalDebt: 0,
    totalBottlesSold: 0,
    patientsWithDebt: 0,
    monthlySales: 0,
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const loadData = async () => {
    try {
      const [patients, drugs, sales, installments] = await Promise.all([
        getPatients(),
        getDrugs(),
        getSales(),
        getInstallments(),
      ]);

      const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
      const unpaidInstallments = installments.filter((i) => i.status === "unpaid");
      const totalDebt = unpaidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const unpaidSales = sales.filter((s) => s.paymentStatus === "unpaid");
      const totalUnpaid = unpaidSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const totalBottlesSold = sales.reduce((sum, s) => sum + s.bottleCount, 0);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlySales = sales
        .filter((s) => new Date(s.purchaseDate) >= startOfMonth)
        .reduce((sum, s) => sum + s.totalPrice, 0);

      const patientsWithDebt = new Set(
        sales
          .filter((s) => s.paymentStatus !== "paid")
          .map((s) => s.patientId)
      ).size;

      setStats({
        totalPatients: patients.length,
        totalSales,
        totalDebt: totalDebt + totalUnpaid,
        totalBottlesSold,
        patientsWithDebt,
        monthlySales,
      });

      setRecentPatients(
        patients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
      );
      setRecentSales(
        sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener("focus", loadData);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " T";
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
        <View style={styles.headerTitle}>
          <Image
            source={AppIcon}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <ThemedText type="h3">Bezoar</ThemedText>
        </View>
        <View style={styles.menuButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Patients"
              value={stats.totalPatients}
              icon="users"
            />
            <View style={styles.statSpacer} />
            <StatCard
              title="Bottles Sold"
              value={stats.totalBottlesSold}
              icon="package"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Sales"
              value={formatCurrency(stats.totalSales)}
              icon="shopping-cart"
              trend="up"
            />
            <View style={styles.statSpacer} />
            <StatCard
              title="Outstanding Debt"
              value={formatCurrency(stats.totalDebt)}
              icon="alert-circle"
              trend={stats.totalDebt > 0 ? "down" : "neutral"}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Monthly Sales"
              value={formatCurrency(stats.monthlySales)}
              icon="calendar"
            />
            <View style={styles.statSpacer} />
            <StatCard
              title="Patients with Debt"
              value={stats.patientsWithDebt}
              icon="user-x"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Recent Patients</ThemedText>
            <Pressable
              onPress={() => (navigation as any).navigate("Patients")}
              hitSlop={8}
            >
              <ThemedText style={{ color: Colors.dark.accent }}>View All</ThemedText>
            </Pressable>
          </View>
          {recentPatients.length > 0 ? (
            recentPatients.map((patient) => (
              <ListItem
                key={patient.id}
                title={`${patient.firstName} ${patient.lastName}`}
                subtitle={patient.phone}
                leftIcon="user"
                onPress={() =>
                  (navigation as any).navigate("PatientDetail", { patientId: patient.id })
                }
              />
            ))
          ) : (
            <GlassCard>
              <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
                No patients yet
              </ThemedText>
            </GlassCard>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4">Recent Sales</ThemedText>
            <Pressable
              onPress={() => (navigation as any).navigate("Sales")}
              hitSlop={8}
            >
              <ThemedText style={{ color: Colors.dark.accent }}>View All</ThemedText>
            </Pressable>
          </View>
          {recentSales.length > 0 ? (
            recentSales.map((sale) => (
              <ListItem
                key={sale.id}
                title={`${sale.bottleCount} bottles`}
                subtitle={formatCurrency(sale.totalPrice)}
                leftIcon="shopping-cart"
                badge={sale.paymentStatus}
                badgeColor={
                  sale.paymentStatus === "paid"
                    ? Colors.dark.success
                    : sale.paymentStatus === "unpaid"
                      ? Colors.dark.error
                      : Colors.dark.warning
                }
                onPress={() =>
                  (navigation as any).navigate("SaleDetail", { saleId: sale.id })
                }
              />
            ))
          ) : (
            <GlassCard>
              <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
                No sales yet
              </ThemedText>
            </GlassCard>
          )}
        </View>
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
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
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
  statsGrid: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  statSpacer: {
    width: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
});
