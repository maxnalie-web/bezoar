import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getSales, getPatients, getDrugs, deleteSale } from "@/lib/storage";
import { Sale, Patient, Drug } from "@/types/models";

type SaleWithDetails = Sale & {
  patientName: string;
  drugName: string;
};

export default function SalesScreen() {
  const { theme } = useTheme();
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
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown",
          drugName: drug ? drug.name : "Unknown",
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
      "Delete Sale",
      `Are you sure you want to delete this sale for ${sale.patientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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
    return amount.toLocaleString() + " T";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return Colors.dark.success;
      case "unpaid":
        return Colors.dark.error;
      case "installment":
        return Colors.dark.warning;
      default:
        return theme.textSecondary;
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (filter === "all") return true;
    return sale.paymentStatus === filter;
  });

  const renderSale = ({ item }: { item: SaleWithDetails }) => (
    <GlassCard
      style={styles.saleCard}
      onPress={() => (navigation as any).navigate("SaleDetail", { saleId: item.id })}
    >
      <View style={styles.saleHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent + "30" }]}>
          <Feather name="shopping-cart" size={20} color={Colors.dark.accent} />
        </View>
        <View style={styles.saleInfo}>
          <ThemedText type="body" style={styles.saleName}>
            {item.patientName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.drugName} - {item.bottleCount} bottles
          </ThemedText>
        </View>
        <Pressable
          onPress={() => handleDeleteSale(item)}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={Colors.dark.error} />
        </Pressable>
      </View>
      <View style={styles.saleDetails}>
        <View style={styles.detailItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total
          </ThemedText>
          <ThemedText type="body" style={[styles.detailValue, { color: Colors.dark.accent }]}>
            {formatCurrency(item.totalPrice)}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Date
          </ThemedText>
          <ThemedText type="body" style={styles.detailValue}>
            {formatDate(item.purchaseDate)}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Status
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.paymentStatus) + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}
            >
              {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
            </ThemedText>
          </View>
        </View>
      </View>
    </GlassCard>
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
          { backgroundColor: Colors.dark.accent + "20" },
        ],
      ]}
    >
      <ThemedText
        type="small"
        style={[
          styles.filterText,
          { color: filter === value ? Colors.dark.accent : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Sales</ThemedText>
        <Pressable onPress={handleAddSale} style={styles.menuButton}>
          <Feather name="plus" size={24} color={Colors.dark.accent} />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Paid" value="paid" />
        <FilterButton label="Unpaid" value="unpaid" />
        <FilterButton label="Installment" value="installment" />
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
            tintColor={Colors.dark.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="shopping-cart"
            title="No Sales Yet"
            description="Record your first sale to start tracking your transactions."
            actionLabel="Add Sale"
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
