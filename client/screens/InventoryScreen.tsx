import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getDrugs, adjustDrugStock, getDrugStockMovements, updateDrug } from "@/lib/storage";
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
    const threshold = parseInt(thresholdValue, 10) || 0;
    await updateDrug(selectedDrug.id, { lowStockThreshold: threshold });
    await loadDrugs();
    Alert.alert(t("success"), "آستانه هشدار بروزرسانی شد");
  };

  const lowStockCount = drugs.filter((d) => {
    const stock = d.stockQuantity ?? 0;
    const threshold = d.lowStockThreshold ?? 0;
    return threshold > 0 && stock <= threshold;
  }).length;
  const outOfStockCount = drugs.filter((d) => (d.stockQuantity ?? 0) <= 0).length;

  const summaryItems = [
    { label: t("inventory"), value: drugs.length, icon: "package" as const, color: AuroraGradient.teal },
    { label: t("lowStock"), value: lowStockCount, icon: "alert-circle" as const, color: theme.warning },
    { label: t("outOfStock"), value: outOfStockCount, icon: "alert-triangle" as const, color: theme.error },
  ];

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
            <View style={[styles.stockBadge, { backgroundColor: statusColor + "20" }]}>
              <Feather
                name={isOut ? "alert-triangle" : isLow ? "alert-circle" : "check-circle"}
                size={14}
                color={statusColor}
              />
              <ThemedText type="small" style={{ color: statusColor, fontWeight: "700" }}>
                {stock.toLocaleString("fa-IR")}
              </ThemedText>
            </View>
            <View style={styles.flexShrink}>
              <ThemedText type="body" style={{ fontWeight: "600", textAlign: "right" }} numberOfLines={1}>
                {item.name}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                {item.code} · {item.unit}
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
            {summaryItems.map((s) => (
              <View
                key={s.label}
                style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault, borderColor: s.color + "30" }]}
              >
                <View style={[styles.summaryIcon, { backgroundColor: s.color + "18" }]}>
                  <Feather name={s.icon} size={16} color={s.color} />
                </View>
                <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.xs }}>
                  {s.value.toLocaleString("fa-IR")}
                </ThemedText>
                <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {s.label}
                </ThemedText>
              </View>
            ))}
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
              <Pressable onPress={closeModal} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">{selectedDrug?.name}</ThemedText>
            </View>

            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, textAlign: "right" }}>
              {t("currentStock")}: {(selectedDrug?.stockQuantity ?? 0).toLocaleString("fa-IR")} {selectedDrug?.unit}
            </ThemedText>

            <View style={styles.movementRow}>
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
              <TextInput
                value={movementAmount}
                onChangeText={setMovementAmount}
                keyboardType="numeric"
                placeholder="تعداد"
                placeholderTextColor={theme.textSecondary}
                style={[styles.movementInput, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary }]}
              />
            </View>

            <View style={styles.thresholdRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                {t("lowStockThreshold")}
              </ThemedText>
              <View style={styles.movementRow}>
                <Button size="small" onPress={saveThreshold} style={{ flex: 1 }}>
                  {t("save")}
                </Button>
                <TextInput
                  value={thresholdValue}
                  onChangeText={setThresholdValue}
                  keyboardType="numeric"
                  style={[styles.movementInput, { color: theme.text, borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary }]}
                />
              </View>
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm, textAlign: "right" }}>
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
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: item.quantity > 0 ? theme.success : theme.error, fontWeight: "600" }}>
                    {item.quantity > 0 ? "+" : ""}
                    {item.quantity.toLocaleString("fa-IR")}
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
  statsRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  drugCard: { marginBottom: Spacing.sm },
  rowBetween: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: Spacing.md },
  flexShrink: { flexShrink: 1 },
  stockBadge: {
    flexDirection: "row-reverse",
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
  modalHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  movementRow: { flexDirection: "row-reverse", gap: Spacing.sm, alignItems: "center" },
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
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
});
