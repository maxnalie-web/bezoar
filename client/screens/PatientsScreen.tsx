import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Dimensions } from "react-native";
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
import { getPatients, getSales, getInstallments, deletePatient } from "@/lib/storage";
import { Patient } from "@/types/models";
import { FormInput } from "@/components/FormInput";

export default function PatientsScreen() {
  const { theme } = useTheme();
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

  const filteredPatients = patients.filter((patient) => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      patient.firstName.toLowerCase().includes(search) ||
      patient.lastName.toLowerCase().includes(search) ||
      (patient.nationalId?.includes(search) ?? false) ||
      (patient.phone?.includes(search) ?? false);

    if (!matchesSearch) return false;
    if (filter === "debtors") {
      return debtorsMap.has(patient.id);
    }
    return true;
  });

  const renderPatient = ({ item, index }: { item: Patient; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <GlassCard
        style={styles.patientCard}
        onPress={() =>
          (navigation as any).navigate("PatientDetail", { patientId: item.id })
        }
      >
        <View style={[styles.patientHeader, styles.patientHeaderRTL]}>
          <View style={[styles.avatar, { backgroundColor: theme.accent + "30" }]}>
            <Feather name="user" size={24} color={theme.accent} />
          </View>
          <View style={[styles.patientInfo, styles.patientInfoRTL]}>
            <ThemedText type="body" numberOfLines={1} style={[styles.patientName, { textAlign: "right" }]}>
              {item.firstName} {item.lastName}
            </ThemedText>
          </View>
          {debtorsMap.has(item.id) && (
            <View
              style={{
                backgroundColor: theme.error,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: Spacing.sm,
              }}
            >
              <ThemedText type="small" style={{ color: "#fff", fontWeight: "600", textAlign: "left" }}>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>

        <ThemedText type="h3">{t("patients")}</ThemedText>

        <Pressable onPress={handleAddPatient} style={styles.menuButton}>
          <Feather name="plus" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
        <Pressable
          onPress={() => setFilter("all")}
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.full,
            marginLeft: Spacing.sm,
            backgroundColor: filter === "all" ? theme.accent + "20" : "transparent",
          }}
        >
          <ThemedText type="body" style={{ color: filter === "all" ? theme.accent : theme.textSecondary, textAlign: "left" }}>
            همه
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setFilter("debtors")}
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.full,
            backgroundColor: filter === "debtors" ? theme.error + "20" : "transparent",
          }}
        >
          <ThemedText type="body" style={{ color: filter === "debtors" ? theme.error : theme.textSecondary, textAlign: "left" }}>
            بدهکاران
          </ThemedText>
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
});
