import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getSales, getPatients, getDrugs, deleteSale } from "@/lib/storage";
import { Sale, Patient, Drug } from "@/types/models";

type SaleWithDetails = Sale & {
  patientName: string;
  drugName: string;
};

export default function SalesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "installment">("all");

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
        return {
          ...sale,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "ناشناس",
          drugName: drug ? drug.name : "ناشناس",
        };
      });

      setSales(
        salesWithDetails.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load sales:", error);
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

  const filteredSales = sales.filter((sale) => {
    if (filter === "all") return true;
    return sale.paymentStatus === filter;
  });

  const renderSale = ({ item, index }: { item: SaleWithDetails; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <GlassCard
        style={styles.saleCard}
        onPress={() => (navigation as any).navigate("SaleDetail", { saleId: item.id })}
      >
        <View style={[styles.saleHeader, styles.saleHeaderRTL]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accent + "30" }]}>
            <Feather name="shopping-cart" size={20} color={theme.accent} />
          </View>
          <View style={[styles.saleInfo, styles.saleInfoRTL]}>
            <ThemedText type="body" style={[styles.saleName, { textAlign: "right" }]}>
              {item.patientName}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {item.drugName} - {item.bottleCount.toLocaleString("fa-IR")} {t("bottle")}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => handleDeleteSale(item)}
            style={styles.deleteButton}
            hitSlop={8}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
          </Pressable>
        </View>
        <View style={[styles.saleDetails, styles.saleDetailsRTL]}>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("totalPrice")}
            </ThemedText>
            <ThemedText type="body" style={[styles.detailValue, { color: theme.accent, textAlign: "right" }]}>
              {formatCurrency(item.totalPrice)}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("purchaseDate")}
            </ThemedText>
            <ThemedText type="body" style={[styles.detailValue, { textAlign: "right" }]}>
              {formatDate(item.purchaseDate)}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("status")}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.paymentStatus) + "20", alignSelf: "flex-end" },
              ]}
            >
              <ThemedText
                type="small"
                style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}
              >
                {getStatusLabel(item.paymentStatus)}
              </ThemedText>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const FilterButton = ({
    label,
    value,
  }: {
    label: string;
    value: typeof filter;
  }) => (
    <Pressable
      onPress={() => setFilter(value)}
      style={[
        styles.filterButton,
        filter === value && [
          styles.filterButtonActive,
          { backgroundColor: theme.accent + "20" },
        ],
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.filterText,
          { color: filter === value ? theme.accent : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, styles.headerRTL, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("sales")}</ThemedText>
        <Pressable onPress={handleAddSale} style={styles.menuButton}>
          <Feather name="plus" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <View style={[styles.filterContainer, styles.filterContainerRTL]}>
        <FilterButton label={t("all")} value="all" />
        <FilterButton label={t("paid")} value="paid" />
        <FilterButton label={t("unpaid")} value="unpaid" />
        <FilterButton label={t("installment")} value="installment" />
      </View>

      <FlatList
        data={filteredSales}
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
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="هنوز فروشی ثبت نشده"
            description="اولین فروش را ثبت کنید تا پیگیری تراکنش‌ها را شروع کنید."
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterContainerRTL: {
    flexDirection: "row-reverse",
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterButtonActive: {
    borderRadius: BorderRadius.full,
  },
  filterText: {
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  saleCard: {
    marginBottom: Spacing.md,
  },
  saleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  saleHeaderRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saleInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  saleInfoRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  saleName: {
    fontWeight: "600",
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  saleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saleDetailsRTL: {
    flexDirection: "row-reverse",
  },
  detailItem: {
    flex: 1,
  },
  detailValue: {
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontWeight: "600",
    fontSize: 12,
  },
});
