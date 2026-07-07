import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getSales, getPatients, getInstallments, getDrugs } from "@/lib/storage";

interface DrugRevenue {
  drugId: string;
  name: string;
  revenue: number;
  units: number;
}

interface ReportStats {
  totalSales: number;
  totalDebt: number;
  monthlySales: number;
  yearlySales: number;
  bottlesSold: number;
  patientsWithDebt: number;
  monthlyData: { month: string; amount: number }[];
  mainSales: number;
  auxiliarySales: number;
  patients?: { name: string; phone: string; nationalId: string }[];
  paidCount: number;
  unpaidCount: number;
  installmentCount: number;
  paidAmount: number;
  unpaidAmount: number;
  installmentAmount: number;
  topDrugs: DrugRevenue[];
  avgSaleValue: number;
  totalSalesCount: number;
}

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const ExportCheckbox = ({
  label,
  value,
  onToggle,
  color,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  color: string;
}) => (
  <Pressable
    onPress={onToggle}
    style={{
      flexDirection: "row-reverse",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: value ? color : "#999",
        backgroundColor: value ? color : "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
      }}
    >
      {value ? <Feather name="check" size={14} color="#fff" /> : null}
    </View>
    <ThemedText type="body" style={{ textAlign: "right", fontSize: 16 }}>
      {label}
    </ThemedText>
  </Pressable>
);

export default function ReportsScreen() {
  const { theme, isDark } = useTheme();
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
    mainSales: 0,
    auxiliarySales: 0,
    paidCount: 0,
    unpaidCount: 0,
    installmentCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    installmentAmount: 0,
    topDrugs: [],
    avgSaleValue: 0,
    totalSalesCount: 0,
  });

  const [exportOptions, setExportOptions] = useState({
    mainSales: true,
    auxiliarySales: true,
    totalSales: true,
    debts: true,
    patients: false,
  });

  const loadData = async () => {
    try {
      const [sales, patients, installments, drugs] = await Promise.all([
        getSales(),
        getPatients(),
        getInstallments(),
        getDrugs(),
      ]);

      const filteredSales = sales.filter(s => !s.isGift);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalSales = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const monthlySales = filteredSales
        .filter((s) => s.purchaseDate && new Date(s.purchaseDate) >= startOfMonth)
        .reduce((sum, s) => sum + s.totalPrice, 0);
      const yearlySales = filteredSales
        .filter(
          (s) =>
            s.purchaseDate &&
            new Date(s.purchaseDate).getFullYear() === now.getFullYear()
        )
        .reduce((sum, s) => sum + s.totalPrice, 0);
      const bottlesSold = filteredSales.reduce((sum, s) => sum + s.bottleCount, 0);

      const auxiliarySales = filteredSales.reduce(
        (sum, s) =>
          sum +
          (Array.isArray(s.auxiliaryDrugs)
            ? s.auxiliaryDrugs.reduce((a, d) => a + d.totalPrice, 0)
            : 0),
        0
      );

      const mainSales = filteredSales.reduce(
        (sum, s) => sum + s.bottleCount * s.unitPrice,
        0
      );

      const unpaidInstallments = installments.filter((i) => i.status === "unpaid");
      const installmentDebt = unpaidInstallments.reduce((sum, i) => sum + i.amount, 0);
      const unpaidSales = filteredSales.filter((s) => s.paymentStatus === "unpaid");
      const unpaidDebt = unpaidSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const totalDebt = installmentDebt + unpaidDebt;

      const patientsWithDebt = new Set(
        filteredSales.filter((s) => s.paymentStatus !== "paid").map((s) => s.patientId)
      ).size;

      // Payment status breakdown
      const paidSales = filteredSales.filter((s) => s.paymentStatus === "paid");
      const installmentSales = filteredSales.filter((s) => s.paymentStatus === "installment");

      // Show only the last 6 months (rolling)
      const monthlyData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);

        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

        const monthSales = filteredSales
          .filter(s => {
            if (!s.purchaseDate) return false;
            const sd = new Date(s.purchaseDate);
            return sd >= monthStart && sd <= monthEnd;
          })
          .reduce((sum, s) => sum + s.totalPrice, 0);

        monthlyData.push({
          month: persianMonths[d.getMonth()],
          amount: monthSales,
        });
      }

      // Top-selling drugs by revenue (main + auxiliary)
      const drugsMap = new Map(drugs.map((d) => [d.id, d]));
      const revenueByDrug = new Map<string, DrugRevenue>();

      const addRevenue = (drugId: string, revenue: number, units: number) => {
        const drug = drugsMap.get(drugId);
        const name = drug ? drug.name : "ناشناس";
        const existing = revenueByDrug.get(drugId);
        if (existing) {
          existing.revenue += revenue;
          existing.units += units;
        } else {
          revenueByDrug.set(drugId, { drugId, name, revenue, units });
        }
      };

      filteredSales.forEach((s) => {
        addRevenue(s.drugId, s.bottleCount * s.unitPrice, s.bottleCount);
        if (Array.isArray(s.auxiliaryDrugs)) {
          s.auxiliaryDrugs.forEach((a) => addRevenue(a.drugId, a.totalPrice, a.quantity));
        }
      });

      const topDrugs = Array.from(revenueByDrug.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const patientRows = patients.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        phone: p.phone,
        nationalId: p.nationalId,
      }));

      setStats({
        totalSales,
        totalDebt,
        monthlySales,
        yearlySales,
        bottlesSold,
        patientsWithDebt,
        monthlyData,
        mainSales,
        auxiliarySales,
        patients: patientRows,
        paidCount: paidSales.length,
        unpaidCount: unpaidSales.length,
        installmentCount: installmentSales.length,
        paidAmount: paidSales.reduce((s, x) => s + x.totalPrice, 0),
        unpaidAmount: unpaidDebt,
        installmentAmount: installmentDebt,
        topDrugs,
        totalSalesCount: filteredSales.length,
        avgSaleValue: filteredSales.length ? totalSales / filteredSales.length : 0,
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
    return Math.round(amount).toLocaleString("fa-IR") + " " + t("toman");
  };

  const maxAmount = useMemo(
    () => Math.max(...stats.monthlyData.map((d) => d.amount), 1),
    [stats.monthlyData]
  );
  const reversedMonthlyData = useMemo(
    () => [...stats.monthlyData].reverse(),
    [stats.monthlyData]
  );

  const maxTopDrugRevenue = useMemo(
    () => Math.max(...stats.topDrugs.map((d) => d.revenue), 1),
    [stats.topDrugs]
  );

  const paymentTotal = stats.paidCount + stats.unpaidCount + stats.installmentCount || 1;

  // ── Beautiful HTML/PDF export ─────────────────────────────
  const buildTableRows = (overrideStats?: ReportStats) => {
    const s = overrideStats ?? stats;
    const rows: string[] = [];
    if (exportOptions.mainSales)
      rows.push(`<tr><td>فروش داروی اصلی</td><td>${formatCurrency(s.mainSales)}</td></tr>`);
    if (exportOptions.auxiliarySales)
      rows.push(`<tr><td>فروش داروهای جانبی</td><td>${formatCurrency(s.auxiliarySales)}</td></tr>`);
    if (exportOptions.totalSales)
      rows.push(`<tr><td>فروش کل</td><td>${formatCurrency(s.totalSales)}</td></tr>`);
    if (exportOptions.debts)
      rows.push(`<tr><td>بدهی کل</td><td>${formatCurrency(s.totalDebt)}</td></tr>`);
    return rows.join("");
  };

  const buildMonthlyChartHtml = () => {
    const max = Math.max(...stats.monthlyData.map((d) => d.amount), 1);
    return stats.monthlyData
      .map((d) => {
        const pct = Math.max(4, Math.round((d.amount / max) * 100));
        return `
          <div class="bar-col">
            <div class="bar-track"><div class="bar-fill" style="height:${pct}%"></div></div>
            <div class="bar-label">${d.month}</div>
          </div>`;
      })
      .join("");
  };

  const buildTopDrugsHtml = () => {
    if (!stats.topDrugs.length) return "";
    const max = Math.max(...stats.topDrugs.map((d) => d.revenue), 1);
    const rows = stats.topDrugs
      .map(
        (d) => `
        <div class="top-drug-row">
          <div class="top-drug-name">${d.name}</div>
          <div class="top-drug-track"><div class="top-drug-fill" style="width:${Math.max(6, Math.round((d.revenue / max) * 100))}%"></div></div>
          <div class="top-drug-amount">${formatCurrency(d.revenue)}</div>
        </div>`
      )
      .join("");
    return `
      <div class="section-title">پرفروش‌ترین داروها</div>
      <div class="top-drugs">${rows}</div>`;
  };

  const buildPaymentStatusHtml = () => {
    const total = stats.paidCount + stats.unpaidCount + stats.installmentCount || 1;
    const paidPct = Math.round((stats.paidCount / total) * 100);
    const unpaidPct = Math.round((stats.unpaidCount / total) * 100);
    const instPct = 100 - paidPct - unpaidPct;
    return `
      <div class="section-title">وضعیت پرداخت‌ها</div>
      <div class="status-bar">
        <div style="width:${paidPct}%;background:#10D9A3"></div>
        <div style="width:${unpaidPct}%;background:#FB6B8A"></div>
        <div style="width:${instPct}%;background:#F59E0B"></div>
      </div>
      <div class="status-legend">
        <span><i style="background:#10D9A3"></i>پرداخت شده (${stats.paidCount.toLocaleString("fa-IR")})</span>
        <span><i style="background:#FB6B8A"></i>پرداخت نشده (${stats.unpaidCount.toLocaleString("fa-IR")})</span>
        <span><i style="background:#F59E0B"></i>قسطی (${stats.installmentCount.toLocaleString("fa-IR")})</span>
      </div>`;
  };

  const buildPatientsSection = () => {
    if (!exportOptions.patients || !stats.patients?.length) return "";
    return `
      <div class="section-title">لیست بیماران</div>
      <table>
        <thead><tr><th>نام</th><th>تلفن</th><th>کد ملی</th></tr></thead>
        <tbody>
          ${stats.patients
            .map((p) => `<tr><td>${p.name}</td><td>${p.phone}</td><td>${p.nationalId}</td></tr>`)
            .join("")}
        </tbody>
      </table>`;
  };

  const loadPrintModules = async () => {
    const Print = await import("expo-print");
    const Sharing = await import("expo-sharing");
    return { Print, Sharing };
  };

  const exportPDF = async () => {
    try {
      const { Print, Sharing } = await loadPrintModules();
      const html = `
<html dir="rtl" lang="fa">
  <head>
    <meta charset="UTF-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                     Roboto, "Helvetica Neue", Arial, sans-serif;
        direction: rtl;
        margin: 0;
        padding: 0;
        color: #1a1a2e;
        background: #f7f7fb;
      }
      .hero {
        background: linear-gradient(135deg, #22D3C7 0%, #8B5CF6 55%, #EC4899 100%);
        padding: 36px 28px 28px;
        color: #fff;
      }
      .hero h1 { margin: 0; font-size: 26px; font-weight: 800; }
      .hero p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
      .content { padding: 24px 28px 40px; }
      .stat-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: -18px;
      }
      .stat-card {
        flex: 1 1 22%;
        background: #fff;
        border-radius: 14px;
        padding: 14px 12px;
        box-shadow: 0 4px 14px rgba(80,60,180,0.12);
        text-align: center;
        min-width: 130px;
      }
      .stat-card .label { font-size: 11px; color: #6b6f8a; margin-bottom: 4px; }
      .stat-card .value { font-size: 16px; font-weight: 700; color: #1a1a2e; }
      .section-title {
        margin-top: 30px;
        margin-bottom: 10px;
        font-size: 15px;
        font-weight: 700;
        color: #1a1a2e;
        border-right: 4px solid #8B5CF6;
        padding-right: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
      }
      th, td {
        border-bottom: 1px solid #eee;
        padding: 10px 8px;
        text-align: right;
      }
      th { background: #f1f0fb; font-weight: 700; color: #4c4f6b; }
      tr:nth-child(even) { background-color: #fafafe; }

      .bars { display: flex; flex-direction: row-reverse; align-items: flex-end; gap: 10px; height: 160px; margin-top: 8px; }
      .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
      .bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
      .bar-fill { width: 100%; background: linear-gradient(180deg, #22D3C7, #8B5CF6); border-radius: 8px 8px 0 0; min-height: 4px; }
      .bar-label { margin-top: 6px; font-size: 11px; color: #6b6f8a; }

      .top-drugs { display: flex; flex-direction: column; gap: 10px; }
      .top-drug-row { display: flex; flex-direction: row-reverse; align-items: center; gap: 10px; background: #fff; border-radius: 10px; padding: 8px 12px; }
      .top-drug-name { width: 110px; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .top-drug-track { flex: 1; height: 10px; background: #f0f0f8; border-radius: 6px; overflow: hidden; }
      .top-drug-fill { height: 100%; background: linear-gradient(90deg, #8B5CF6, #EC4899); border-radius: 6px; }
      .top-drug-amount { width: 110px; font-size: 12px; text-align: left; color: #4c4f6b; }

      .status-bar { display: flex; flex-direction: row-reverse; height: 18px; border-radius: 9px; overflow: hidden; }
      .status-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; font-size: 12px; color: #4c4f6b; }
      .status-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-left: 6px; }

      .footer {
        margin-top: 40px;
        font-size: 11px;
        text-align: center;
        color: #999;
      }
    </style>
  </head>

  <body>
    <div class="hero">
      <h1>گزارش فروش Bezoar</h1>
      <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString("fa-IR")}</p>
    </div>

    <div class="content">
      <div class="stat-grid">
        <div class="stat-card"><div class="label">فروش کل</div><div class="value">${formatCurrency(stats.totalSales)}</div></div>
        <div class="stat-card"><div class="label">بدهی کل</div><div class="value">${formatCurrency(stats.totalDebt)}</div></div>
        <div class="stat-card"><div class="label">میانگین هر فروش</div><div class="value">${formatCurrency(stats.avgSaleValue)}</div></div>
        <div class="stat-card"><div class="label">تعداد فروش</div><div class="value">${stats.totalSalesCount.toLocaleString("fa-IR")}</div></div>
      </div>

      <div class="section-title">خلاصه گزارش</div>
      <table>
        <thead><tr><th>عنوان</th><th>مبلغ</th></tr></thead>
        <tbody>${buildTableRows()}</tbody>
      </table>

      <div class="section-title">روند فروش شش‌ماهه</div>
      <div class="bars">${buildMonthlyChartHtml()}</div>

      ${buildPaymentStatusHtml()}

      ${buildTopDrugsHtml()}

      ${buildPatientsSection()}

      <div class="footer">گزارش تولید شده توسط سیستم Bezoar</div>
    </div>
  </body>
</html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.warn("PDF export not available:", e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 80}
    >
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText type="h3">{t("reports")}</ThemedText>
        </View>

        <View style={styles.menuButton} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
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
        <View style={{ flexDirection: "column" }}>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard title={t("totalSales")} value={formatCurrency(stats.totalSales)} icon="trending-up" trend="up" color={AuroraGradient.violet} />
                <View style={styles.statSpacer} />
                <StatCard title={t("debtBalance")} value={formatCurrency(stats.totalDebt)} icon="alert-circle" trend={stats.totalDebt > 0 ? "down" : "neutral"} color={AuroraGradient.rose} />
              </View>
              <View style={styles.statsRow}>
                <StatCard title="فروش داروی اصلی" value={formatCurrency(stats.mainSales)} icon="activity" color={AuroraGradient.teal} />
                <View style={styles.statSpacer} />
                <StatCard title="فروش داروهای جانبی" value={formatCurrency(stats.auxiliarySales)} icon="box" color={AuroraGradient.amber} />
              </View>
              <View style={styles.statsRow}>
                <StatCard title={t("monthlySales")} value={formatCurrency(stats.monthlySales)} icon="calendar" color={AuroraGradient.sky} />
                <View style={styles.statSpacer} />
                <StatCard title="فروش سالانه" value={formatCurrency(stats.yearlySales)} icon="bar-chart-2" color={AuroraGradient.magenta} />
              </View>
              <View style={styles.statsRow}>
                <StatCard title="میانگین هر فروش" value={formatCurrency(stats.avgSaleValue)} icon="hash" color={AuroraGradient.emerald} />
                <View style={styles.statSpacer} />
                <StatCard title={t("patientsWithDebt")} value={stats.patientsWithDebt.toLocaleString("fa-IR")} icon="user-x" color={AuroraGradient.rose} />
              </View>
            </View>
          </Animated.View>

          {/* Payment status breakdown */}
          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={styles.sectionTitle}>
              وضعیت پرداخت‌ها
            </ThemedText>
          </View>
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <GlassCard elevated accentColor={AuroraGradient.violet}>
              <View style={styles.statusBarTrack}>
                {stats.paidCount > 0 && (
                  <View style={{ flex: stats.paidCount, backgroundColor: theme.success }} />
                )}
                {stats.unpaidCount > 0 && (
                  <View style={{ flex: stats.unpaidCount, backgroundColor: theme.error }} />
                )}
                {stats.installmentCount > 0 && (
                  <View style={{ flex: stats.installmentCount, backgroundColor: theme.warning }} />
                )}
                {paymentTotal === 1 && stats.paidCount + stats.unpaidCount + stats.installmentCount === 0 && (
                  <View style={{ flex: 1, backgroundColor: theme.backgroundTertiary }} />
                )}
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t("paid")} ({stats.paidCount.toLocaleString("fa-IR")})
                  </ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t("unpaid")} ({stats.unpaidCount.toLocaleString("fa-IR")})
                  </ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.warning }]} />
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {t("installment")} ({stats.installmentCount.toLocaleString("fa-IR")})
                  </ThemedText>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Top-selling drugs */}
          {stats.topDrugs.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <ThemedText type="body" style={styles.sectionTitle}>
                  پرفروش‌ترین داروها
                </ThemedText>
              </View>
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <GlassCard elevated accentColor={AuroraGradient.magenta}>
                  {stats.topDrugs.map((d, index) => (
                    <View key={d.drugId} style={[styles.topDrugRow, index > 0 && styles.topDrugRowBorder, { borderColor: theme.glassBorder }]}>
                      <View style={styles.topDrugRank}>
                        <ThemedText type="small" style={{ color: theme.accentTertiary, fontWeight: "700" }}>
                          {(index + 1).toLocaleString("fa-IR")}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "600" }}>
                          {d.name}
                        </ThemedText>
                        <View style={[styles.topDrugTrack, { backgroundColor: theme.backgroundTertiary }]}>
                          <LinearGradient
                            colors={[AuroraGradient.violet, AuroraGradient.magenta]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.topDrugFill, { width: `${Math.max(6, (d.revenue / maxTopDrugRevenue) * 100)}%` }]}
                          />
                        </View>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>
                        {formatCurrency(d.revenue)}
                      </ThemedText>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={styles.sectionTitle}>
              انتخاب داده‌های خروجی
            </ThemedText>
          </View>
          <GlassCard accentColor={AuroraGradient.teal}>
            <ExportCheckbox
              label="فروش داروی اصلی"
              value={exportOptions.mainSales}
              color={AuroraGradient.teal}
              onToggle={() => setExportOptions((p) => ({ ...p, mainSales: !p.mainSales }))}
            />
            <ExportCheckbox
              label="فروش داروهای جانبی"
              value={exportOptions.auxiliarySales}
              color={AuroraGradient.teal}
              onToggle={() => setExportOptions((p) => ({ ...p, auxiliarySales: !p.auxiliarySales }))}
            />
            <ExportCheckbox
              label="فروش کل"
              value={exportOptions.totalSales}
              color={AuroraGradient.teal}
              onToggle={() => setExportOptions((p) => ({ ...p, totalSales: !p.totalSales }))}
            />
            <ExportCheckbox
              label="بدهی کل"
              value={exportOptions.debts}
              color={AuroraGradient.teal}
              onToggle={() => setExportOptions((p) => ({ ...p, debts: !p.debts }))}
            />
            <ExportCheckbox
              label="لیست بیماران"
              value={exportOptions.patients}
              color={AuroraGradient.teal}
              onToggle={() => setExportOptions((p) => ({ ...p, patients: !p.patients }))}
            />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={styles.sectionTitle}>
              خروجی گزارش
            </ThemedText>
          </View>
          <Pressable onPress={exportPDF} style={styles.exportButtonWrapper}>
            <LinearGradient
              colors={[AuroraGradient.teal, AuroraGradient.violet, AuroraGradient.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exportButton}
            >
              <Feather name="file-text" size={18} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                دریافت خروجی PDF
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={styles.sectionTitle}>
              نمودار فروش شش‌ماهه اخیر
            </ThemedText>
          </View>
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <GlassCard style={styles.chartCard} elevated accentColor={AuroraGradient.sky}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
                {reversedMonthlyData.map((data, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={[AuroraGradient.teal, AuroraGradient.violet]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[
                          styles.bar,
                          { height: `${(data.amount / maxAmount) * 100}%` },
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
              </ScrollView>
            </GlassCard>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
    flexDirection: "row-reverse",
    marginBottom: Spacing.md,
  },
  statSpacer: {
    width: Spacing.md,
  },
  statusBarTrack: {
    flexDirection: "row-reverse",
    height: 18,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  topDrugRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  topDrugRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  topDrugRank: {
    width: 24,
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  topDrugTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  topDrugFill: {
    height: "100%",
    borderRadius: 3,
  },
  exportButtonWrapper: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  exportButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  chartCard: {
    marginBottom: Spacing.xl,
  },
  chart: {
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    height: 200,
    marginTop: Spacing.md,
  },
  chartBar: {
    width: 44,
    alignItems: "center",
    justifyContent: "flex-end",
    marginHorizontal: 6,
  },
  barContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: BorderRadius.xs,
    minHeight: 4,
  },
  barLabel: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
    width: "100%",
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "right",
  },
});
