import React, { useState, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Dimensions, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getPatients, getSales, getInstallments, deletePatient } from "@/lib/storage";
import { Patient } from "@/types/models";
import { FormInput } from "@/components/FormInput";

type SortOption = "newest" | "oldest" | "nameAsc";

export default function PatientsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "debtors">("all");
  const [debtorsMap, setDebtorsMap] = useState<Map<string, number>>(new Map());
  const searchInputRef = useRef<any>(null);
  const shiftLeft = Math.round(Dimensions.get("window").width * 0.2);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  const loadPatients = async () => {
    try {
      const [patientsData, sales, installments] = await Promise.all([
        getPatients(),
        getSales(),
        getInstallments(),
      ]);

      const debtMap = new Map<string, number>();

      sales.forEach(s => {
        if (s.paymentStatus !== "paid") {
          debtMap.set(s.patientId, (debtMap.get(s.patientId) || 0) + s.totalPrice);
        }
      });

      installments.forEach(i => {
        if (i.status === "unpaid") {
          const sale = sales.find(s => s.id === i.saleId);
          if (sale) {
            debtMap.set(sale.patientId, (debtMap.get(sale.patientId) || 0) + i.amount);
          }
        }
      });

      setDebtorsMap(debtMap);

      setPatients(
        patientsData.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load patients:", error);
      Alert.alert(t("error"), "خطا در بارگذاری بیماران");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const handleAddPatient = () => {
    (navigation as any).navigate("PatientDetail", { patientId: undefined });
  };

  const handleDeletePatient = (patient: Patient) => {
    Alert.alert(
      t("delete"),
      `آیا مطمئن هستید که می‌خواهید ${patient.firstName} ${patient.lastName} را حذف کنید؟`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deletePatient(patient.id);
            loadPatients();
          },
        },
      ]
    );
  };

  const openFilters = () => {
    setDateFrom(appliedDateFrom);
    setDateTo(appliedDateTo);
    setFiltersVisible(true);
  };

  const applyAdvancedFilters = () => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setFiltersVisible(false);
  };

  const resetAdvancedFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
    setSortOption("newest");
    setFiltersVisible(false);
  };

  const hasActiveAdvancedFilters = !!appliedDateFrom || !!appliedDateTo || sortOption !== "newest";

  const filteredPatients = useMemo(() => {
    const search = searchQuery.toLowerCase();

    let list = patients.filter((patient) => {
      const matchesSearch =
        patient.firstName.toLowerCase().includes(search) ||
        patient.lastName.toLowerCase().includes(search) ||
        (patient.nationalId?.includes(search) ?? false) ||
        (patient.phone?.includes(search) ?? false);

      if (!matchesSearch) return false;
      if (filter === "debtors" && !debtorsMap.has(patient.id)) return false;

      if (appliedDateFrom) {
        const fromTime = new Date(appliedDateFrom).getTime();
        if (!isNaN(fromTime) && new Date(patient.createdAt).getTime() < fromTime) return false;
      }
      if (appliedDateTo) {
        const toTime = new Date(appliedDateTo).getTime();
        if (!isNaN(toTime) && new Date(patient.createdAt).getTime() > toTime) return false;
      }

      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortOption === "nameAsc") {
        return `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`, "fa");
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOption === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [patients, searchQuery, filter, debtorsMap, appliedDateFrom, appliedDateTo, sortOption]);

  const renderPatient = ({ item, index }: { item: Patient; index: number }) => {
    const isDebtor = debtorsMap.has(item.id);
    const accentColor = isDebtor ? theme.error : theme.accentSecondary;

    return (
      <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
        <GlassCard
          style={styles.patientCard}
          accentColor={accentColor}
          onPress={() =>
            (navigation as any).navigate("PatientDetail", { patientId: item.id })
          }
        >
          <View style={[styles.patientHeader, styles.patientHeaderRTL]}>
            <LinearGradient
              colors={[accentColor + (isDark ? "45" : "30"), accentColor + (isDark ? "20" : "12")]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Feather name="user" size={22} color={accentColor} />
            </LinearGradient>
            <View style={[styles.patientInfo, styles.patientInfoRTL]}>
              <ThemedText type="body" numberOfLines={1} style={[styles.patientName, { textAlign: "right" }]}>
                {item.firstName} {item.lastName}
              </ThemedText>
            </View>
            {isDebtor && (
              <View
                style={{
                  backgroundColor: theme.error + "22",
                  borderWidth: 1,
                  borderColor: theme.error + "55",
                  borderRadius: BorderRadius.full,
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 3,
                  marginLeft: Spacing.sm,
                }}
              >
                <ThemedText type="small" style={{ color: theme.error, fontWeight: "600", textAlign: "left" }}>
                  بدهکار
                </ThemedText>
              </View>
            )}
            <Pressable
              onPress={() => handleDeletePatient(item)}
              style={styles.deleteButton}
              hitSlop={8}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          </View>
          <View style={[styles.patientDetails, styles.patientDetailsRTL]}>
            <View style={[styles.detailRow, styles.detailRowRTL]}>
              <Feather name="phone" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.detailText, styles.detailTextRTL, { color: theme.textSecondary, textAlign: "left" }]}>
                {item.phone || "بدون تلفن"}
              </ThemedText>
            </View>
            <View style={[styles.detailRow, styles.detailRowRTL]}>
              <Feather name="activity" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.detailText, styles.detailTextRTL, { color: theme.textSecondary, textAlign: "left" }]}>
                {item.mainDisease || "بدون تشخیص"}
              </ThemedText>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  const sortLabels: Record<SortOption, string> = {
    newest: t("newest"),
    oldest: t("oldest"),
    nameAsc: "نام (الف-ی)",
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark ? ["rgba(34,211,199,0.10)", "transparent"] : ["rgba(139,92,246,0.08)", "transparent"]}
        style={styles.headerGlow}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>

        <ThemedText type="h3">{t("patients")}</ThemedText>

        <Pressable onPress={handleAddPatient} style={[styles.menuButton, styles.addButton]}>
          <LinearGradient
            colors={[AuroraGradient.teal, AuroraGradient.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Feather name="plus" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.filterBarRow}>
        <View style={styles.pillsRow}>
          <Pressable
            onPress={() => setFilter("all")}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              marginLeft: Spacing.sm,
              backgroundColor: filter === "all" ? theme.accentSecondary + "22" : theme.backgroundSecondary,
              borderWidth: 1,
              borderColor: filter === "all" ? theme.accentSecondary + "55" : "transparent",
            }}
          >
            <ThemedText type="body" style={{ color: filter === "all" ? theme.accentSecondary : theme.textSecondary, textAlign: "left" }}>
              همه
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setFilter("debtors")}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              backgroundColor: filter === "debtors" ? theme.error + "22" : theme.backgroundSecondary,
              borderWidth: 1,
              borderColor: filter === "debtors" ? theme.error + "55" : "transparent",
            }}
          >
            <ThemedText type="body" style={{ color: filter === "debtors" ? theme.error : theme.textSecondary, textAlign: "left" }}>
              بدهکاران
            </ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={openFilters}
          style={[
            styles.advancedFilterButton,
            {
              backgroundColor: hasActiveAdvancedFilters ? theme.accentTertiary + "22" : theme.backgroundSecondary,
              borderColor: hasActiveAdvancedFilters ? theme.accentTertiary + "55" : "transparent",
            },
          ]}
        >
          <Feather
            name="sliders"
            size={16}
            color={hasActiveAdvancedFilters ? theme.accentTertiary : theme.textSecondary}
          />
          {hasActiveAdvancedFilters && (
            <View style={[styles.advancedFilterDot, { backgroundColor: theme.accentTertiary }]} />
          )}
        </Pressable>
      </View>

      {patients.length === 0 ? (
        <EmptyState
          icon="users"
          title="هنوز بیماری ثبت نشده"
          description="اولین بیمار را اضافه کنید تا مدیریت سوابق آنها را شروع کنید."
          actionLabel={t("addPatient")}
          onAction={handleAddPatient}
        />
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatient}
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
            <View style={styles.emptySearch}>
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "left" }}>
                {t("noPatients")}
              </ThemedText>
            </View>
          }
        />
      )}

      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <LinearGradient
              colors={[AuroraGradient.teal, AuroraGradient.violet, AuroraGradient.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalAccentBar}
            />

            <View style={styles.modalHeader}>
              <ThemedText type="h4">{t("advancedFilters")}</ThemedText>
              <Pressable onPress={() => setFiltersVisible(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, textAlign: "right" }}>
              {t("sortBy")}
            </ThemedText>
            <View style={styles.sortOptionsRow}>
              {(["newest", "oldest", "nameAsc"] as SortOption[]).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setSortOption(opt)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: sortOption === opt ? theme.accentSecondary + "22" : theme.backgroundSecondary,
                      borderColor: sortOption === opt ? theme.accentSecondary + "66" : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: sortOption === opt ? theme.accentSecondary : theme.textSecondary, textAlign: "center" }}
                  >
                    {sortLabels[opt]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xs, textAlign: "right" }}>
              {t("dateRange")}
            </ThemedText>
            <View style={styles.dateRangeRow}>
              <View style={{ flex: 1 }}>
                <FormInput
                  label={t("from")}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="۱۴۰۰-۰۱-۰۱"
                  labelStyle={{ textAlign: "left", alignSelf: "flex-start", width: "100%", fontSize: 14 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormInput
                  label={t("to")}
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="۱۴۰۳-۱۲-۲۹"
                  labelStyle={{ textAlign: "left", alignSelf: "flex-start", width: "100%", fontSize: 14 }}
                />
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={resetAdvancedFilters}
                style={[styles.modalSecondaryButton, { borderColor: theme.glassBorder }]}
              >
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  {t("reset")}
                </ThemedText>
              </Pressable>
              <Pressable onPress={applyAdvancedFilters} style={styles.modalPrimaryButtonWrapper}>
                <LinearGradient
                  colors={[AuroraGradient.teal, AuroraGradient.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalPrimaryButton}
                >
                  <ThemedText type="body" style={{ color: "#fff", fontWeight: "600", textAlign: "center" }}>
                    {t("apply")}
                  </ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRTL: {
    flexDirection: "row-reverse",
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
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBarRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pillsRow: {
    flexDirection: "row",
  },
  advancedFilterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedFilterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  patientCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  patientHeaderRTL: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  patientInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  patientInfoRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  patientName: {
    fontWeight: "600",
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  patientDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  patientDetailsRTL: {
    flexDirection: "row-reverse",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailRowRTL: {
    flexDirection: "row-reverse",
  },
  detailText: {
    marginLeft: Spacing.xs,
  },
  detailTextRTL: {
    marginLeft: 0,
    marginRight: Spacing.xs,
  },
  emptySearch: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sortOptionsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dateRangeRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
  },
  modalActionsRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButtonWrapper: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  modalPrimaryButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
