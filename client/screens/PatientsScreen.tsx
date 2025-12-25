import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getPatients, deletePatient } from "@/lib/storage";
import { Patient } from "@/types/models";

export default function PatientsScreen() {
  const { theme } = useTheme();
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
      "Delete Patient",
      `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
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

  const renderPatient = ({ item }: { item: Patient }) => (
    <GlassCard
      style={styles.patientCard}
      onPress={() =>
        (navigation as any).navigate("PatientDetail", { patientId: item.id })
      }
    >
      <View style={styles.patientHeader}>
        <View style={[styles.avatar, { backgroundColor: Colors.dark.accent + "30" }]}>
          <Feather name="user" size={24} color={Colors.dark.accent} />
        </View>
        <View style={styles.patientInfo}>
          <ThemedText type="body" style={styles.patientName}>
            {item.firstName} {item.lastName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            ID: {item.nationalId}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => handleDeletePatient(item)}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={Colors.dark.error} />
        </Pressable>
      </View>
      <View style={styles.patientDetails}>
        <View style={styles.detailRow}>
          <Feather name="phone" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
            {item.phone || "No phone"}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="activity" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
            {item.mainDisease || "No diagnosis"}
          </ThemedText>
        </View>
      </View>
    </GlassCard>
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
        <ThemedText type="h3">Patients</ThemedText>
        <Pressable onPress={handleAddPatient} style={styles.menuButton}>
          <Feather name="plus" size={24} color={Colors.dark.accent} />
        </Pressable>
      </View>

      {patients.length === 0 ? (
        <EmptyState
          icon="users"
          title="No Patients Yet"
          description="Add your first patient to get started with managing their records."
          actionLabel="Add Patient"
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
              tintColor={Colors.dark.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <ThemedText style={{ color: theme.textSecondary }}>
                No patients found
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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    marginLeft: Spacing.xs,
  },
  emptySearch: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
});
