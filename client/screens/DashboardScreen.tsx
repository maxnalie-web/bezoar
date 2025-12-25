import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import AppIcon from "@assets/images/icon.png";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { GlassCard } from "@/components/GlassCard";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";
import { getPatients, getDrugs, getSales, getInstallments } from "@/lib/storage";
import { Patient, Sale, Drug, DashboardStats } from "@/types/models";

type SaleWithUnit = Sale & { drugUnit: string };

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
  const [recentSales, setRecentSales] = useState<SaleWithUnit[]>([]);

  const loadData = async () => {
    try {
      const [patients, drugs, sales, installments] = await Promise.all([
        getPatients(),
        getDrugs(),
        getSales(),
        getInstallments(),
      ]);

      const drugsMap = new Map(drugs.map((d) => [d.id, d]));

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

      const salesWithUnit: SaleWithUnit[] = sales.map((sale) => {
        const drug = drugsMap.get(sale.drugId);
        return {
          ...sale,
          drugUnit: drug?.unit || "واحد",
        };
      });

      setRecentSales(
        salesWithUnit.sort((a, b) => {
          const dateA = new Date(b.purchaseDate || b.createdAt).getTime();
          const dateB = new Date(a.purchaseDate || a.createdAt).getTime();
          return dateA - dateB;
        }).slice(0, 3)
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
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return t("paid");
      case "unpaid": return t("unpaid");
      case "installment": return t("installment");
      default: return status;
    }
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
        <View style={[styles.headerTitle, styles.headerTitleRTL]}>
          <Image
            source={AppIcon}
            style={[styles.headerLogo, styles.headerLogoRTL]}
            contentFit="contain"
          />
          <ThemedText type="h3">{t("appName")}</ThemedText>
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
            tintColor={theme.accent}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.statsGrid}>
            <View style={[styles.statsRow, styles.statsRowRTL]}>
              <StatCard
                title={t("totalPatients")}
                value={stats.totalPatients.toLocaleString("fa-IR")}
                icon="users"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title={t("bottlesSold")}
                value={stats.totalBottlesSold.toLocaleString("fa-IR")}
                icon="package"
              />
            </View>
            <View style={[styles.statsRow, styles.statsRowRTL]}>
              <StatCard
                title={t("totalSales")}
                value={formatCurrency(stats.totalSales)}
                icon="shopping-cart"
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
                title={t("patientsWithDebt")}
                value={stats.patientsWithDebt.toLocaleString("fa-IR")}
                icon="user-x"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <ThemedText type="h4">{t("recentPatients")}</ThemedText>
              <Pressable
                onPress={() => (navigation as any).navigate("Patients")}
                hitSlop={8}
              >
                <ThemedText style={{ color: theme.accent }}>{t("viewAll")}</ThemedText>
              </Pressable>
            </View>
            {recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <ListItem
                  key={patient.id}
                  title={`${patient.firstName} ${patient.lastName}`}
                  subtitle={patient.phone}
                  leftIcon="user"
                  rtl={true}
                  onPress={() =>
                    (navigation as any).navigate("PatientDetail", { patientId: patient.id })
                  }
                />
              ))
            ) : (
              <GlassCard>
                <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {t("noPatients")}
                </ThemedText>
              </GlassCard>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <ThemedText type="h4">{t("recentSales")}</ThemedText>
              <Pressable
                onPress={() => (navigation as any).navigate("Sales")}
                hitSlop={8}
              >
                <ThemedText style={{ color: theme.accent }}>{t("viewAll")}</ThemedText>
              </Pressable>
            </View>
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <ListItem
                  key={sale.id}
                  title={`${sale.bottleCount.toLocaleString("fa-IR")} ${sale.drugUnit}`}
                  subtitle={formatCurrency(sale.totalPrice)}
                  leftIcon="shopping-cart"
                  badge={getPaymentStatusLabel(sale.paymentStatus)}
                  badgeColor={
                    sale.paymentStatus === "paid"
                      ? theme.success
                      : sale.paymentStatus === "unpaid"
                        ? theme.error
                        : theme.warning
                  }
                  rtl={true}
                  onPress={() =>
                    (navigation as any).navigate("SaleDetail", { saleId: sale.id })
                  }
                />
              ))
            ) : (
              <GlassCard>
                <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {t("noSales")}
                </ThemedText>
              </GlassCard>
            )}
          </View>
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
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleRTL: {
    flexDirection: "row-reverse",
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  headerLogoRTL: {
    marginRight: 0,
    marginLeft: Spacing.sm,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
});
