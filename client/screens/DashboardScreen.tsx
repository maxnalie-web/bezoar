import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getPatients, getSales, getInstallments } from "@/lib/storage";
import { Patient, Sale, DashboardStats } from "@/types/models";

const { width } = Dimensions.get("window");
const KPI_CARD_SIZE = (width - Spacing.lg * 3) / 2;



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
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [auxiliarySalesTotal, setAuxiliarySalesTotal] = useState(0);

  // Remove iconAnim and related animation logic

  const loadData = async () => {
    const [patients, sales, installments] = await Promise.all([
      getPatients(),
      getSales(),
      getInstallments(),
    ]);

    // Filter out gift sales for stats
    const validSales = sales.filter(s => !s.isGift);

    const mainSales = validSales.reduce((s, x) => s + x.bottleCount * x.unitPrice, 0);
    const auxSales = validSales.reduce(
      (s, x) =>
        s +
        (Array.isArray(x.auxiliaryDrugs)
          ? x.auxiliaryDrugs.reduce((a, d) => a + d.totalPrice, 0)
          : 0),
      0
    );

    const unpaidInstallments = installments.filter(i => i.status === "unpaid");
    const installmentDebt = unpaidInstallments.reduce((s, i) => s + i.amount, 0);
    const unpaidSales = validSales.filter(s => s.paymentStatus === "unpaid");
    const unpaidDebt = unpaidSales.reduce((s, x) => s + x.totalPrice, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySales = validSales
      .filter(s => s.purchaseDate && new Date(s.purchaseDate) >= startOfMonth)
      .reduce((sum, s) => {
        const m = s.bottleCount * s.unitPrice;
        const a = Array.isArray(s.auxiliaryDrugs)
          ? s.auxiliaryDrugs.reduce((x, d) => x + d.totalPrice, 0)
          : 0;
        return sum + m + a;
      }, 0);

    setAuxiliarySalesTotal(auxSales);

    setStats({
      totalPatients: patients.length,
      totalSales: mainSales + auxSales,
      totalDebt: installmentDebt + unpaidDebt,
      totalBottlesSold: validSales.reduce((s, x) => s + x.bottleCount, 0),
      patientsWithDebt: new Set(
        validSales.filter(s => s.paymentStatus !== "paid").map(s => s.patientId)
      ).size,
      monthlySales,
    });

    setRecentPatients(
      [...patients]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 3)
    );

    setRecentSales(
      [...sales]
        .sort(
          (a, b) =>
            +new Date(b.purchaseDate || b.createdAt) -
            +new Date(a.purchaseDate || a.createdAt)
        )
        .slice(0, 3)
    );
  };

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener("focus", loadData);
    return unsub;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString("fa-IR") + " " + t("toman");

  // Remove iconAnimatedStyle

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, styles.headerRTL]}>
        <View style={styles.headerIcon} />
        <ThemedText type="h3" style={styles.headerTitle}>
          داشبورد
        </ThemedText>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.headerIcon}
        >
          <Feather name="menu" size={26} color={theme.text} />
        </Pressable>
      </View>

      {/* Hero Card: Monthly Sales */}
      <GlassCard style={styles.heroCard} elevated>
        <View style={styles.heroContent}>
          <View style={styles.heroTextWrapper}>
            <ThemedText type="title" style={{ color: theme.accent, textAlign: "left" }}>
              فروش ماهانه
            </ThemedText>
            <ThemedText type="title" style={{ marginTop: Spacing.sm, textAlign: "left" }}>
              {formatCurrency(stats.monthlySales)}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs, textAlign: "left" }}>
              مجموع فروش این ماه
            </ThemedText>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: theme.accent + "15" }]}>
            <Feather name="trending-up" size={36} color={theme.accent} />
          </View>
        </View>
      </GlassCard>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
      >

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <Animated.View entering={FadeIn.delay(100)} style={[styles.kpiCardWrapper]}>
            <GlassCard
              style={[styles.kpiCard, { backgroundColor: theme.backgroundDefault }]}
              elevated
            >
              <View style={styles.kpiContent}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: theme.accent + "15" }]}>
                  <Feather name="users" size={24} color={theme.accent} />
                </View>
                <View style={styles.kpiTextWrapper}>
                  <ThemedText type="title" style={{ color: theme.accent, textAlign: "left" }}>
                    {stats.totalPatients.toLocaleString("fa-IR")}
                  </ThemedText>
                  <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "left" }}>
                    کل بیماران
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200)} style={[styles.kpiCardWrapper]}>
            <GlassCard
              style={[styles.kpiCard, { backgroundColor: theme.backgroundDefault }]}
              elevated
            >
              <View style={styles.kpiContent}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: theme.accent + "15" }]}>
                  <Feather name="alert-circle" size={24} color={theme.accent} />
                </View>
                <View style={styles.kpiTextWrapper}>
                  <ThemedText type="title" style={{ color: theme.accent, textAlign: "left" }}>
                    {stats.patientsWithDebt.toLocaleString("fa-IR")}
                  </ThemedText>
                  <ThemedText
                    type="body"
                    numberOfLines={2}
                    style={{
                      color: theme.textSecondary,
                      textAlign: "left",
                      flexShrink: 1,
                      lineHeight: 20,
                    }}
                  >
                    بیماران بدهکار
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300)} style={[styles.kpiCardWrapper]}>
            <GlassCard
              style={[styles.kpiCard, { backgroundColor: theme.backgroundDefault }]}
              elevated
            >
              <View style={styles.kpiContent}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: theme.accent + "15" }]}>
                  <Feather name="shopping-cart" size={24} color={theme.accent} />
                </View>
                <View style={styles.kpiTextWrapper}>
                  <ThemedText type="title" style={{ color: theme.accent, textAlign: "left" }}>
                    {formatCurrency(stats.totalSales)}
                  </ThemedText>
                  <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "left" }}>
                    فروش کل
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400)} style={[styles.kpiCardWrapper]}>
            <GlassCard
              style={[styles.kpiCard, { backgroundColor: theme.backgroundDefault }]}
              elevated
            >
              <View style={styles.kpiContent}>
                <View style={[styles.kpiIconWrapper, { backgroundColor: theme.accent + "15" }]}>
                  <Feather name="credit-card" size={24} color={theme.accent} />
                </View>
                <View style={styles.kpiTextWrapper}>
                  <ThemedText type="title" style={{ color: theme.accent, textAlign: "left" }}>
                    {formatCurrency(stats.totalDebt)}
                  </ThemedText>
                  <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "left" }}>
                    بدهی کل
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </View>

        {/* Recent Patients */}
        <GlassCard style={styles.sectionCard} elevated>
          <ThemedText
            type="title"
            style={styles.sectionTitle}
          >
            {t("recentPatients")}
          </ThemedText>
          <View style={styles.listContainer}>
            {recentPatients.length ? recentPatients.map(p => (
              <GlassCard key={p.id} style={styles.listItem} elevated>
                <Pressable
                  style={styles.listItemContent}
                  onPress={() => (navigation as any).navigate("PatientDetail", { patientId: p.id })}
                >
                  <View style={styles.listTextWrapper}>
                    <ThemedText type="body" numberOfLines={1} style={{ color: theme.text, textAlign: "right" }}>
                      {`${p.firstName} ${p.lastName}`}
                    </ThemedText>
                    <ThemedText type="caption" numberOfLines={1} style={{ color: theme.textSecondary, textAlign: "right" }}>
                      {p.phone}
                    </ThemedText>
                  </View>
                </Pressable>
              </GlassCard>
            )) : (
              <View style={{ width: "100%", alignItems: "center", paddingVertical: Spacing.md }}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {t("noPatients")}
                </ThemedText>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Recent Sales */}
        <GlassCard style={styles.sectionCard} elevated>
          <ThemedText
            type="title"
            style={styles.sectionTitle}
          >
            {t("recentSales")}
          </ThemedText>
          <View style={styles.listContainer}>
            {recentSales.length ? recentSales.map(s => {
              const paymentLabel = () =>
                s.isGift ? "هدیه" : s.paymentStatus === "paid" ? t("paid") : s.paymentStatus === "unpaid" ? t("unpaid") : t("installment");
              const badgeColor = s.isGift
                ? theme.accent
                : s.paymentStatus === "paid"
                ? theme.success
                : s.paymentStatus === "unpaid"
                ? theme.error
                : theme.warning;
              return (
                <GlassCard key={s.id} style={styles.listItem} elevated>
                  <Pressable
                    style={styles.listItemContent}
                    onPress={() => (navigation as any).navigate("SaleDetail", { saleId: s.id })}
                  >
                    <View style={styles.listTextWrapper}>
                      <ThemedText type="body" numberOfLines={1} style={{ color: theme.text, textAlign: "right" }}>
                        {`${s.bottleCount.toLocaleString("fa-IR")} بطری`}
                      </ThemedText>
                      <ThemedText type="caption" numberOfLines={1} style={{ color: theme.textSecondary, textAlign: "right" }}>
                        {s.isGift ? "۰ تومان" : formatCurrency(s.totalPrice)}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: badgeColor,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        },
                      ]}
                    >
                      {s.isGift && <Feather name="gift" size={12} color="#fff" />}
                      <ThemedText type="caption" style={{ color: "#fff", textAlign: "left" }}>
                        {paymentLabel()}
                      </ThemedText>
                    </View>
                  </Pressable>
                </GlassCard>
              );
            }) : (
              <View style={{ width: "100%", alignItems: "center", paddingVertical: Spacing.md }}>
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {t("noSales")}
                </ThemedText>
              </View>
            )}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    textAlign: "center",
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTextWrapper: {
    flex: 1,
    paddingLeft: Spacing.lg,
    alignItems: "flex-start",
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Spacing["2xl"],
  },
  kpiCardWrapper: {
    width: KPI_CARD_SIZE,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minHeight: 110,
    justifyContent: "center",
  },
  kpiContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  kpiIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  kpiTextWrapper: {
    flex: 1,
    marginRight: Spacing.md,
    minWidth: 0,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: Spacing.xl,
  },
  listContainer: {
    width: "100%",
    flexDirection: "column",
    gap: Spacing.md,
  },
  listItem: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  listTextWrapper: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  badge: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.md,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  // fakeIcon, staticIcon, staticIconSmall removed

  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: 0,
  },

  sectionTitle: {
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    textAlign: "left",
  },
});