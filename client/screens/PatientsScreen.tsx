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
import { getPatients, deletePatient } from "@/lib/storage";
import { Patient } from "@/types/models";

export default function PatientsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Failed to load patients:", error);
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
    return (
      patient.firstName.toLowerCase().includes(search) ||
      patient.lastName.toLowerCase().includes(search) ||
      patient.nationalId.includes(search) ||
      patient.phone.includes(search)
    );
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
            <ThemedText type="body" style={[styles.patientName, { textAlign: "right" }]}>
              {item.firstName} {item.lastName}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("nationalId")}: {item.nationalId}
            </ThemedText>
          </View>
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
            <ThemedText type="small" style={[styles.detailText, styles.detailTextRTL, { color: theme.textSecondary }]}>
              {item.phone || "بدون تلفن"}
            </ThemedText>
          </View>
          <View style={[styles.detailRow, styles.detailRowRTL]}>
            <Feather name="activity" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={[styles.detailText, styles.detailTextRTL, { color: theme.textSecondary }]}>
              {item.mainDisease || "بدون تشخیص"}
            </ThemedText>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
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
        <ThemedText type="h3">{t("patients")}</ThemedText>
        <Pressable onPress={handleAddPatient} style={styles.menuButton}>
          <Feather name="plus" size={24} color={theme.accent} />
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
              <ThemedText style={{ color: theme.textSecondary }}>
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
