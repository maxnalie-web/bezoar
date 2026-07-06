import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getSales, getPatients, getDrugs, deleteSale } from "@/lib/storage";
import { Sale } from "@/types/models";

type SaleWithDetails = Sale & {
  patientName: string;
  drugName: string;
  drugUnit: string;
  extraDrugNames?: string;
  mainTotal: number;
  auxiliaryTotal: number;
};

type StatusFilter = "all" | "paid" | "unpaid" | "installment";
type SortMode = "newest" | "oldest" | "highestAmount" | "lowestAmount";
type DateRangeFilter = "all" | "today" | "thisWeek" | "thisMonth";

export default function SalesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadSales = async () => {
    try {
      const [salesData, patients, drugs] = await Promise.all([
        getSales(),
        getPatients(),
        getDrugs(),
      ]);

      const patientsMap = new Map(patients.map((p) => [p.id, p]));
      const drugsMap = new Map(drugs.map((d) => [d.id, d]));

      const salesWithDetails: SaleWithDetails[] = salesData.map((sale) => {
        const patient = patientsMap.get(sale.patientId);
        const drug = drugsMap.get(sale.drugId);

        const mainTotal = sale.isGift ? 0 : sale.bottleCount * sale.unitPrice;

        const auxiliaryTotal = sale.isGift
          ? 0
          : sale.auxiliaryDrugs?.reduce(
              (sum, d) => sum + d.totalPrice,
              0
            ) ?? 0;

        return {
          ...sale,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "ناشناس",
          drugName: drug ? drug.name : "ناشناس",
          drugUnit: drug ? drug.unit : "واحد",
          extraDrugNames: sale.auxiliaryDrugs
            ?.map(d => drugsMap.get(d.drugId)?.name)
            .filter(Boolean)
            .join("، "),
          mainTotal,
          auxiliaryTotal,
        };
      });

      setSales(
        salesWithDetails.sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load sales:", error);
      Alert.alert(t("error"), "خطا در بارگذاری فروش‌ها");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  };

  const handleAddSale = () => {
    (navigation as any).navigate("SaleDetail", { saleId: undefined });
  };

  const handleDeleteSale = (sale: SaleWithDetails) => {
    Alert.alert(
      t("delete"),
      `آیا مطمئن هستید که می‌خواهید این فروش برای ${sale.patientName} را حذف کنید؟`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deleteSale(sale.id);
            loadSales();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return theme.success;
      case "unpaid":
        return theme.error;
      case "installment":
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return t("paid");
      case "unpaid":
        return t("unpaid");
      case "installment":
        return t("installment");
      default:
        return status;
    }
  };

  const getCardAccent = (sale: SaleWithDetails) => {
    if (sale.isGift) return AuroraGradient.violet;
    switch (sale.paymentStatus) {
      case "paid":
        return AuroraGradient.emerald;
      case "unpaid":
        return AuroraGradient.rose;
      case "installment":
        return AuroraGradient.amber;
      default:
        return theme.accent;
    }
  };

  const isWithinRange = (dateString: string) => {
    if (dateRange === "all") return true;
    const now = new Date();
    const d = new Date(dateString);
    if (dateRange === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (dateRange === "thisWeek") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (dateRange === "thisMonth") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  };

  const visibleSales = useMemo(() => {
    let list = sales.filter((sale) => {
      if (filter !== "all") {
        if (sale.isGift) return false;
        if (sale.paymentStatus !== filter) return false;
      }
      if (!isWithinRange(sale.purchaseDate)) return false;
      return true;
    });

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.patientName.toLowerCase().includes(q) ||
          s.drugName.toLowerCase().includes(q) ||
          s.extraDrugNames?.toLowerCase().includes(q)
      );
    }

    list = [...list];
    switch (sortMode) {
      case "newest":
        list.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
        break;
      case "highestAmount":
        list.sort((a, b) => b.totalPrice - a.totalPrice);
        break;
      case "lowestAmount":
        list.sort((a, b) => a.totalPrice - b.totalPrice);
        break;
    }

    return list;
  }, [sales, filter, searchQuery, sortMode, dateRange]);

  const sortOptions: { key: SortMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "newest", label: t("newest"), icon: "clock" },
    { key: "oldest", label: t("oldest"), icon: "rotate-ccw" },
    { key: "highestAmount", label: t("highestAmount"), icon: "trending-up" },
    { key: "lowestAmount", label: t("lowestAmount"), icon: "trending-down" },
  ];

  const dateRangeOptions: { key: DateRangeFilter; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "today", label: t("today") },
    { key: "thisWeek", label: t("thisWeek") },
    { key: "thisMonth", label: t("thisMonth") },
  ];

  const renderSale = ({ item, index }: { item: SaleWithDetails; index: number }) => {
    const accent = getCardAccent(item);
    return (
      <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
        <GlassCard
          style={styles.saleCard}
          accentColor={accent}
          onPress={() => (navigation as any).navigate("SaleDetail", { saleId: item.id })}
        >
          <View style={styles.saleHeader}>
            <View style={[styles.iconContainer, { backgroundColor: accent + "26", borderColor: accent + "40" }]}>
              <Feather name={item.isGift ? "gift" : "shopping-cart"} size={20} color={accent} />
            </View>
            <View style={styles.saleInfo}>
              <ThemedText type="body" style={styles.saleName} numberOfLines={1}>
                {item.patientName}
              </ThemedText>
              {item.isGift && (
                <ThemedText
                  type="small"
                  style={{ color: AuroraGradient.violet, marginTop: 2, fontWeight: "600" }}
                >
                  فروش هدیه
                </ThemedText>
              )}
              <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary }}>
                {item.drugName} - {item.bottleCount.toLocaleString("fa-IR")} {item.drugUnit}
              </ThemedText>
              {item.extraDrugNames ? (
                <ThemedText
                  type="small"
                  numberOfLines={1}
                  style={{ color: theme.textSecondary, marginTop: 2 }}
                >
                  داروهای جانبی: {item.extraDrugNames}
                </ThemedText>
              ) : null}
            </View>
            <Pressable
              onPress={() => handleDeleteSale(item)}
              style={[styles.deleteButton, { backgroundColor: theme.error + "18" }]}
              hitSlop={8}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          </View>
          <View style={[styles.saleDetails, { borderTopColor: theme.glassBorder }]}>
            <View style={styles.detailItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                مبلغ داروی اصلی
              </ThemedText>
              <ThemedText type="body" style={styles.detailValue}>
                {formatCurrency(item.mainTotal)}
              </ThemedText>
            </View>

            {item.auxiliaryTotal > 0 && (
              <View style={styles.detailItem}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  مبلغ داروهای جانبی
                </ThemedText>
                <ThemedText type="body" style={styles.detailValue}>
                  {formatCurrency(item.auxiliaryTotal)}
                </ThemedText>
              </View>
            )}

            <View style={styles.detailItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                جمع کل
              </ThemedText>
              <ThemedText
                type="body"
                style={[
                  styles.detailValue,
                  {
                    color: item.isGift ? theme.textSecondary : accent,
                  },
                ]}
              >
                {formatCurrency(item.totalPrice)}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t("purchaseDate")}
              </ThemedText>
              <ThemedText type="body" style={styles.detailValue}>
                {formatDate(item.purchaseDate)}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t("status")}
              </ThemedText>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: accent + "20",
                    borderColor: accent + "40",
                    alignSelf: "flex-start",
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: accent }]} />
                <ThemedText
                  type="small"
                  style={[styles.statusText, { color: accent }]}
                >
                  {item.isGift ? "هدیه" : getStatusLabel(item.paymentStatus)}
                </ThemedText>
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  const FilterButton = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: StatusFilter;
    color: string;
  }) => (
    <Pressable
      onPress={() => setFilter(value)}
      style={[
        styles.filterButton,
        { borderColor: theme.glassBorder },
        filter === value && [
          styles.filterButtonActive,
          { backgroundColor: color + "22", borderColor: color },
        ],
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.filterText,
          { color: filter === value ? color : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[theme.accentTertiary + "22", "transparent"]}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>

        <ThemedText type="h3">{t("sales")}</ThemedText>

        <Pressable
          onPress={handleAddSale}
          style={[styles.addButton, { backgroundColor: theme.accentTertiary }]}
        >
          <Feather name="plus" size={22} color={theme.buttonText} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.glassBorder },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("searchSales")}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            selectionColor={theme.accentTertiary}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFiltersOpen((v) => !v)}
          style={[
            styles.filterToggle,
            {
              backgroundColor: filtersOpen ? theme.accentTertiary : theme.backgroundSecondary,
              borderColor: filtersOpen ? theme.accentTertiary : theme.glassBorder,
            },
          ]}
        >
          <Feather name="sliders" size={18} color={filtersOpen ? theme.buttonText : theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label={t("all")} value="all" color={theme.accent} />
        <FilterButton label={t("paid")} value="paid" color={AuroraGradient.emerald} />
        <FilterButton label={t("unpaid")} value="unpaid" color={AuroraGradient.rose} />
        <FilterButton label={t("installment")} value="installment" color={AuroraGradient.amber} />
      </View>

      {filtersOpen ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.advancedFilters}>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            {t("sortBy")}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScroll}
          >
            {sortOptions.map((opt) => {
              const active = sortMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortMode(opt.key)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active ? theme.accentTertiary : theme.backgroundSecondary,
                      borderColor: active ? theme.accentTertiary : theme.glassBorder,
                    },
                  ]}
                >
                  <Feather name={opt.icon} size={14} color={active ? theme.buttonText : theme.textSecondary} />
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.buttonText : theme.text, fontWeight: active ? "700" : "400" }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
            {t("dateRange")}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScroll}
          >
            {dateRangeOptions.map((opt) => {
              const active = dateRange === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setDateRange(opt.key)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active ? theme.accentSecondary : theme.backgroundSecondary,
                      borderColor: active ? theme.accentSecondary : theme.glassBorder,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.buttonText : theme.text, fontWeight: active ? "700" : "400" }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}

      <View style={styles.resultsRow}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {visibleSales.length.toLocaleString("fa-IR")} {t("resultsCount")}
        </ThemedText>
      </View>

      <FlatList
        data={visibleSales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentTertiary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title={searchQuery ? t("noSearchResults") : "هنوز فروشی ثبت نشده"}
            description={
              searchQuery
                ? ""
                : "اولین فروش را ثبت کنید تا پیگیری تراکنش‌ها را شروع کنید."
            }
            actionLabel={t("newSale")}
            onAction={handleAddSale}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    textAlign: "right",
    paddingVertical: 0,
  },
  filterToggle: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontWeight: "500",
  },
  advancedFilters: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sortScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultsRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  saleCard: {
    marginBottom: Spacing.md,
  },
  saleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saleInfo: {
    flex: 1,
    marginStart: Spacing.md,
  },
  saleName: {
    fontWeight: "700",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  detailItem: {
    flex: 1,
  },
  detailValue: {
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },
});
