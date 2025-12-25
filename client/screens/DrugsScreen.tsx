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
import { getDrugs, deleteDrug } from "@/lib/storage";
import { Drug } from "@/types/models";

export default function DrugsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrugs = async () => {
    try {
      const data = await getDrugs();
      setDrugs(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Failed to load drugs:", error);
    }
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

  const handleAddDrug = () => {
    (navigation as any).navigate("DrugDetail", { drugId: undefined });
  };

  const handleDeleteDrug = (drug: Drug) => {
    Alert.alert(
      "Delete Drug",
      `Are you sure you want to delete ${drug.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteDrug(drug.id);
            loadDrugs();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " T";
  };

  const renderDrug = ({ item }: { item: Drug }) => (
    <GlassCard
      style={styles.drugCard}
      onPress={() =>
        (navigation as any).navigate("DrugDetail", { drugId: item.id })
      }
    >
      <View style={styles.drugHeader}>
        <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent + "30" }]}>
          <Feather name="package" size={24} color={Colors.dark.accent} />
        </View>
        <View style={styles.drugInfo}>
          <ThemedText type="body" style={styles.drugName}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Code: {item.code}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => handleDeleteDrug(item)}
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={Colors.dark.error} />
        </Pressable>
      </View>
      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Purchase Price
          </ThemedText>
          <ThemedText type="body" style={styles.priceValue}>
            {formatCurrency(item.purchasePrice)}
          </ThemedText>
        </View>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sale Price
          </ThemedText>
          <ThemedText type="body" style={[styles.priceValue, { color: Colors.dark.accent }]}>
            {formatCurrency(item.salePrice)}
          </ThemedText>
        </View>
        <View style={styles.priceItem}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Unit
          </ThemedText>
          <ThemedText type="body" style={styles.priceValue}>
            {item.unit}
          </ThemedText>
        </View>
      </View>
      {item.type ? (
        <View style={[styles.typeBadge, { backgroundColor: Colors.dark.accent + "20" }]}>
          <ThemedText type="small" style={{ color: Colors.dark.accent }}>
            {item.type}
          </ThemedText>
        </View>
      ) : null}
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
        <ThemedText type="h3">Drugs</ThemedText>
        <Pressable onPress={handleAddDrug} style={styles.menuButton}>
          <Feather name="plus" size={24} color={Colors.dark.accent} />
        </Pressable>
      </View>

      <FlatList
        data={drugs}
        renderItem={renderDrug}
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
            icon="package"
            title="No Drugs Yet"
            description="Add your first drug to start managing your inventory."
            actionLabel="Add Drug"
            onAction={handleAddDrug}
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  drugCard: {
    marginBottom: Spacing.md,
  },
  drugHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  drugInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  drugName: {
    fontWeight: "600",
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  priceItem: {
    flex: 1,
  },
  priceValue: {
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
});
