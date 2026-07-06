import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getDrugs, adjustDrugStock, getDrugStockMovements } from "@/lib/storage";
import { Drug, StockMovement } from "@/types/models";

export default function InventoryScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementAmount, setMovementAmount] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");

  const loadDrugs = async () => {
    const data = await getDrugs();
    setDrugs(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadDrugs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrugs();
    setRefreshing(false);
  };

  const openDrug = async (drug: Drug) => {
    setSelectedDrug(drug);
    setThresholdValue((drug.lowStockThreshold ?? 0).toString());
    const history = await getDrugStockMovements(drug.id);
    setMovements(history);
  };

  const closeModal = () => {
    setSelectedDrug(null);
    setMovementAmount("");
    setMovements([]);
  };

  const applyMovement = async (direction: 1 | -1) => {
    if (!selectedDrug) return;
    const qty = parseInt(movementAmount, 10);
    if (!qty || qty <= 0) {
      Alert.alert(t("error"), "لطفاً یک عدد معتبر وارد کنید");
      return;
    }
    await adjustDrugStock(selectedDrug.id, direction * qty, direction === 1 ? "in" : "out", direction === 1 ? "افزودن دستی" : "کاهش دستی");
    setMovementAmount("");
    await loadDrugs();
    const history = await getDrugStockMovements(selectedDrug.id);
    setMovements(history);
    const refreshed = (await getDrugs()).find((d) => d.id === selectedDrug.id);
    if (refreshed) setSelectedDrug(refreshed);
  };

  const saveThreshold = async () => {
    if (!selectedDrug) return;
    const { updateDrug } = await import("@/lib/storage");
    const threshold = parseInt(thresholdValue, 10) || 0;
    await updateDrug(selectedDrug.id, { lowStockThreshold: threshold });
    await loadDrugs();
    Alert.alert(t("success"), "آستانه هشدار بروزرسانی شد");
  };

  const totalStockValue = drugs.reduce(
    (sum, d) => sum + (d.stockQuantity ?? 0) * d.purchasePrice,
    0
  );
  const lowStockCount = drugs.filter((d) => {
    const stock = d.stockQuantity ?? 0;
    const threshold = d.lowStockThreshold ?? 0;
    return threshold > 0 && stock <= threshold;
  }).length;
  const outOfStockCount = drugs.filter((d) => (d.stockQuantity ?? 0) <= 0).length;

  const formatCurrency = (amount: number) => amount.toLocaleString("fa-IR") + " " + t("toman");

  const renderDrug = ({ item, index }: { item: Drug; index: number }) => {
    const stock = item.stockQuantity ?? 0;
    const threshold = item.lowStockThreshold ?? 0;
    const isLow = threshold > 0 && stock <= threshold;
    const isOut = stock <= 0;
    const statusColor = isOut ? theme.error : isLow ? theme.warning : theme.success;

    return (
      <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
        <GlassCard style={styles.drugCard} onPress={() => openDrug(item)} elevated accentColor={statusColor}>
          <View style={styles.rowBetween}>
            <View style={styles.flexShrink}>
              <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.code} · {item.unit}
              </ThemedText>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: statusColor + "20" }]}>
              <Feather
                name={isOut ? "alert-triangle" : isLow ? "alert-circle" : "check-circle"}
                size={14}
                color={statusColor}
              />
              <ThemedText type="small" style={{ color: statusColor, fontWeight: "700", marginRight: 4 }}>
                {stock.toLocaleString("fa-IR")}
              </ThemedText>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menuButton}>
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("stockManagement")}</ThemedText>
        <View style={styles.menuButton} />
      </View>

      <FlatList
        data={drugs}
        renderItem={renderDrug}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <StatCard title={t("inventory")} value={drugs.length} icon="package" color={AuroraGradient.teal} />
            <StatCard title={t("lowStock")} value={lowStockCount} icon="alert-circle" color={AuroraGradient.amber} />
            <StatCard title={t("outOfStock")} value={outOfStockCount} icon="alert-triangle" color={AuroraGradient.rose} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="archive" title={t("noStockData")} description="داروها ابتدا باید در بخش داروها ثبت شوند." />
        }
      />

      <Modal visible={!!selectedDrug} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{selectedDrug?.name}</ThemedText>
              <Pressable onPress={closeModal} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
              {t("currentStock")}: {(selectedDrug?.stockQuantity ?? 0).toLocaleString("fa-IR")} {selectedDrug?.unit}
            </ThemedText>

            <View style={styles.movementRow}>
              <TextInput
                value={movementAmount}
                onChangeText={setMovementAmount}
                keyboardType="numeric"
                placeholder="تعداد"
                placeholderTextColor={theme.textSecondary}
                style={[styles.movementInput, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary }]}
              />
              <Pressable
                onPress={() => applyMovement(1)}
                style={[styles.movementButton, { backgroundColor: theme.success + "20" }]}
              >
                <Feather name="plus" size={18} color={theme.success} />
              </Pressable>
              <Pressable
                onPress={() => applyMovement(-1)}
                style={[styles.movementButton, { backgroundColor: theme.error + "20" }]}
              >
                <Feather name="minus" size={18} color={theme.error} />
              </Pressable>
            </View>

            <View style={styles.thresholdRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {t("lowStockThreshold")}
              </ThemedText>
              <View style={styles.movementRow}>
                <TextInput
                  value={thresholdValue}
                  onChangeText={setThresholdValue}
                  keyboardType="numeric"
                  style={[styles.movementInput, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary }]}
                />
                <Button size="small" onPress={saveThreshold} style={{ flex: 1 }}>
                  {t("save")}
                </Button>
              </View>
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              {t("stockHistory")}
            </ThemedText>
            <FlatList
              data={movements}
              keyExtractor={(m) => m.id}
              style={{ maxHeight: 200 }}
              ListEmptyComponent={
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", paddingVertical: Spacing.md }}>
                  {t("noData")}
                </ThemedText>
              }
              renderItem={({ item }) => (
                <View style={styles.historyRow}>
                  <ThemedText type="small" style={{ color: item.quantity > 0 ? theme.success : theme.error }}>
                    {item.quantity > 0 ? "+" : ""}
                    {item.quantity.toLocaleString("fa-IR")}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                  </ThemedText>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  drugCard: { marginBottom: Spacing.sm },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  flexShrink: { flexShrink: 1 },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  movementRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  movementInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    textAlign: "right",
  },
  movementButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  thresholdRow: { marginTop: Spacing.lg },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
});
