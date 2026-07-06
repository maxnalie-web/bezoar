import React, { useState, useCallback, useMemo } from "react";
import * as FileSystem from "expo-file-system";
import { View, StyleSheet, ScrollView, Pressable, RefreshControl, KeyboardAvoidingView, Platform } from "react-native";
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
  mainSales: number;
  auxiliarySales: number;
  patients?: { name: string; phone: string; nationalId: string }[];
}

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const ExportCheckbox = ({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) => (
  <Pressable
    onPress={onToggle}
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: value ? "#4CAF50" : "#999",
        backgroundColor: value ? "#4CAF50" : "transparent",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}
    >
      {value ? <Feather name="check" size={14} color="#fff" /> : null}
    </View>
    <ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>
      {label}
    </ThemedText>
  </Pressable>
);

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
    mainSales: 0,
    auxiliarySales: 0,
  });

  const [exportOptions, setExportOptions] = useState({
    mainSales: true,
    auxiliarySales: true,
    totalSales: true,
    debts: true,
    patients: false,
  });
  // Removed year selection state

  const loadData = async () => {
    try {
      const [sales, patients, installments] = await Promise.all([
        getSales(),
        getPatients(),
        getInstallments(),
      ]);

      const filteredSales = sales.filter(s => !s.isGift);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalSales = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const monthlySales = filteredSales
        .filter((s) => new Date(s.purchaseDate) >= startOfMonth)
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

  const maxAmount = useMemo(
    () => Math.max(...stats.monthlyData.map((d) => d.amount), 1),
    [stats.monthlyData]
  );
  const reversedMonthlyData = useMemo(
    () => [...stats.monthlyData].reverse(),
    [stats.monthlyData]
  );

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
    if (exportOptions.patients && s.patients?.length) {
      rows.push(
        `<tr><th colspan="3">لیست بیماران</th></tr>` +
        `<tr><th>نام</th><th>تلفن</th><th>کد ملی</th></tr>` +
        s.patients
          .map(
            (p) =>
              `<tr><td>${p.name}</td><td>${p.phone}</td><td>${p.nationalId}</td></tr>`
          )
          .join("")
      );
    }
    return rows.join("");
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
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                     Roboto, "Helvetica Neue", Arial, sans-serif;
        direction: rtl;
        padding: 24px;
        color: #222;
      }

      h1 {
        text-align: center;
        font-size: 20px;
        margin-bottom: 24px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
        font-size: 13px;
      }

      th, td {
        border: 1px solid #ccc;
        padding: 10px 8px;
        text-align: right;
      }

      th {
        background-color: #f2f2f2;
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }

      .section-title {
        margin-top: 28px;
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 600;
      }

      .footer {
        margin-top: 32px;
        font-size: 11px;
        text-align: center;
        color: #777;
      }
    </style>
  </head>

  <body>
    <h1>گزارش فروش</h1>

    <div class="section-title">خلاصه گزارش</div>

    <table>
      <thead>
        <tr>
          <th>عنوان</th>
          <th>مبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows()}
      </tbody>
    </table>

    <div class="footer">
      گزارش تولید شده توسط سیستم Bezoar
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
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
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
              <View style={[styles.statsRow, styles.statsRowRTL]}>
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>{t("totalSales")}</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.totalSales)}</ThemedText>}
                  icon="trending-up"
                  trend="up"
                />
                <View style={styles.statSpacer} />
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>{t("debtBalance")}</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.totalDebt)}</ThemedText>}
                  icon="alert-circle"
                  trend={stats.totalDebt > 0 ? "down" : "neutral"}
                />
              </View>
              <View style={[styles.statsRow, styles.statsRowRTL]}>
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>فروش داروی اصلی</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.mainSales)}</ThemedText>}
                  icon="activity"
                />
                <View style={styles.statSpacer} />
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>فروش داروهای جانبی</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.auxiliarySales)}</ThemedText>}
                  icon="box"
                />
              </View>
              <View style={[styles.statsRow, styles.statsRowRTL]}>
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>{t("monthlySales")}</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.monthlySales)}</ThemedText>}
                  icon="calendar"
                />
                <View style={styles.statSpacer} />
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>فروش سالانه</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{formatCurrency(stats.yearlySales)}</ThemedText>}
                  icon="bar-chart-2"
                />
              </View>
              <View style={[styles.statsRow, styles.statsRowRTL]}>
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>{t("bottlesSold")}</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{stats.bottlesSold.toLocaleString("fa-IR")}</ThemedText>}
                  icon="package"
                />
                <View style={styles.statSpacer} />
                <StatCard
                  title={<ThemedText type="body" style={{ textAlign: "left", fontSize: 16 }}>{t("patientsWithDebt")}</ThemedText>}
                  value={<ThemedText style={{ textAlign: "left", fontSize: 18, fontWeight: "600" }}>{stats.patientsWithDebt.toLocaleString("fa-IR")}</ThemedText>}
                  icon="user-x"
                />
              </View>
            </View>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={[styles.sectionTitle, { fontSize: 17, fontWeight: "600" }]}>
              انتخاب داده‌های خروجی
            </ThemedText>
          </View>
          <GlassCard>
            <ExportCheckbox
              label="فروش داروی اصلی"
              value={exportOptions.mainSales}
              onToggle={() =>
                setExportOptions((p) => ({ ...p, mainSales: !p.mainSales }))
              }
            />
            <ExportCheckbox
              label="فروش داروهای جانبی"
              value={exportOptions.auxiliarySales}
              onToggle={() =>
                setExportOptions((p) => ({ ...p, auxiliarySales: !p.auxiliarySales }))
              }
            />
            <ExportCheckbox
              label="فروش کل"
              value={exportOptions.totalSales}
              onToggle={() =>
                setExportOptions((p) => ({ ...p, totalSales: !p.totalSales }))
              }
            />
            <ExportCheckbox
              label="بدهی کل"
              value={exportOptions.debts}
              onToggle={() =>
                setExportOptions((p) => ({ ...p, debts: !p.debts }))
              }
            />
            <ExportCheckbox
              label="لیست بیماران"
              value={exportOptions.patients}
              onToggle={() =>
                setExportOptions((p) => ({ ...p, patients: !p.patients }))
              }
            />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={[styles.sectionTitle, { fontSize: 17, fontWeight: "600" }]}>
              خروجی گزارش
            </ThemedText>
          </View>
          <GlassCard>
            <Pressable
              onPress={exportPDF}
              style={{
                marginBottom: 12,
                alignItems: "center",
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: theme.accent,
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                دریافت PDF
              </ThemedText>
            </Pressable>
          </GlassCard>

          <View style={styles.sectionHeader}>
            <ThemedText type="body" style={[styles.sectionTitle, { fontSize: 17, fontWeight: "600" }]}>
              نمودار فروش شش‌ماهه اخیر
            </ThemedText>
          </View>
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
                {reversedMonthlyData.map((data, index) => (
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
                      style={[styles.barLabel, { color: theme.textSecondary, textAlign: "left" }]}
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
  chartHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  yearSelector: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  yearDropdown: {
    marginBottom: Spacing.md,
  },
  yearOption: {
    paddingVertical: 10,
    alignItems: "center",
  },
  yearOptionActive: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  chartOverlayHeader: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    marginBottom: Spacing.sm,
  },
  yearDropdownOverlay: {
    position: "absolute",
    top: 48,
    right: 0,
    left: 0,
    zIndex: 20,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: "#888", // Will be replaced with theme.textSecondary in render
    textAlign: "left",
  },
});