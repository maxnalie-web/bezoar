import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getSales, getPatients, getInstallments } from "@/lib/storage";

interface ReportStats {
  totalSales: number;
  totalDebt: number;
  monthlySales: number;
  yearlySales: number;
  bottlesSold: number;
  patientsWithDebt: number;
  monthlyData: { month: string; amount: number }[];
}

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalDebt: 0,
    monthlySales: 0,
    yearlySales: 0,
    bottlesSold: 0,
    patientsWithDebt: 0,
    monthlyData: [],
  });

  const loadData = async () => {
    try {
      const [sales, patients, installments] = await Promise.all([
        getSales(),
        getPatients(),
        getInstallments(),
      ]);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const totalSales = sales.reduce((sum, s) => sum + s.totalPrice, 0);
      const monthlySales = sales
        .filter((s) => new Date(s.purchaseDate) >= startOfMonth)
        .reduce((sum, s) => sum + s.totalPrice, 0);
      const yearlySales = sales
        .filter((s) => new Date(s.purchaseDate) >= startOfYear)
        .reduce((sum, s) => sum + s.totalPrice, 0);
      const bottlesSold = sales.reduce((sum, s) => sum + s.bottleCount, 0);

      const unpaidInstallments = installments.filter((i) => i.status === "unpaid");
      const installmentDebt = unpaidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const unpaidSales = sales.filter((s) => s.paymentStatus === "unpaid");
      const unpaidDebt = unpaidSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const totalDebt = installmentDebt + unpaidDebt;

      const patientsWithDebt = new Set(
        sales.filter((s) => s.paymentStatus !== "paid").map((s) => s.patientId)
      ).size;

      const monthlyData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthSales = sales
          .filter((s) => {
            const date = new Date(s.purchaseDate);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, s) => sum + s.totalPrice, 0);
        monthlyData.push({
          month: persianMonths[monthStart.getMonth()],
          amount: monthSales,
        });
      }

      setStats({
        totalSales,
        totalDebt,
        monthlySales,
        yearlySales,
        bottlesSold,
        patientsWithDebt,
        monthlyData,
      });
    } catch (error) {
      console.error("Failed to load report data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const maxAmount = Math.max(...stats.monthlyData.map((d) => d.amount), 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, styles.headerRTL, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("reports")}</ThemedText>
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
            tintColor={theme.accent}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.statsGrid}>
            <View style={[styles.statsRow, styles.statsRowRTL]}>
              <StatCard
                title={t("totalSales")}
                value={formatCurrency(stats.totalSales)}
                icon="trending-up"
                trend="up"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title={t("debtBalance")}
                value={formatCurrency(stats.totalDebt)}
                icon="alert-circle"
                trend={stats.totalDebt > 0 ? "down" : "neutral"}
              />
            </View>
            <View style={[styles.statsRow, styles.statsRowRTL]}>
              <StatCard
                title={t("monthlySales")}
                value={formatCurrency(stats.monthlySales)}
                icon="calendar"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title="فروش سالانه"
                value={formatCurrency(stats.yearlySales)}
                icon="bar-chart-2"
              />
            </View>
            <View style={[styles.statsRow, styles.statsRowRTL]}>
              <StatCard
                title={t("bottlesSold")}
                value={stats.bottlesSold.toLocaleString("fa-IR")}
                icon="package"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title={t("patientsWithDebt")}
                value={stats.patientsWithDebt.toLocaleString("fa-IR")}
                icon="user-x"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard title="روند فروش ماهانه" style={styles.chartCard}>
            <View style={[styles.chart, styles.chartRTL]}>
              {stats.monthlyData.map((data, index) => (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(data.amount / maxAmount) * 100}%`,
                          backgroundColor: theme.accent,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText
                    type="small"
                    style={[styles.barLabel, { color: theme.textSecondary }]}
                  >
                    {data.month}
                  </ThemedText>
                </View>
              ))}
            </View>
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
  statsGrid: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  statsRowRTL: {
    flexDirection: "row-reverse",
  },
  statSpacer: {
    width: Spacing.md,
  },
  chartCard: {
    marginBottom: Spacing.xl,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: Spacing.lg,
  },
  chartRTL: {
    flexDirection: "row-reverse",
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    flex: 1,
    width: "60%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: BorderRadius.xs,
    minHeight: 4,
  },
  barLabel: {
    marginTop: Spacing.sm,
    fontSize: 10,
  },
});
