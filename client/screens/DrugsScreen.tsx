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
import { getDrugs, deleteDrug } from "@/lib/storage";
import { Drug } from "@/types/models";

export default function DrugsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      t("delete"),
      `آیا مطمئن هستید که می‌خواهید ${drug.name} را حذف کنید؟`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
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
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const renderDrug = ({ item, index }: { item: Drug; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <GlassCard
        style={styles.drugCard}
        onPress={() =>
          (navigation as any).navigate("DrugDetail", { drugId: item.id })
        }
      >
        <View style={[styles.drugHeader, styles.drugHeaderRTL]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accent + "30" }]}>
            <Feather name="package" size={24} color={theme.accent} />
          </View>
          <View style={[styles.drugInfo, styles.drugInfoRTL]}>
            <ThemedText type="body" style={[styles.drugName, { textAlign: "right" }]}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("drugCode")}: {item.code}
            </ThemedText>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteDrug(item);
            }}
            style={({ pressed }) => [
              styles.deleteButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="trash-2" size={20} color={theme.error} />
          </Pressable>
        </View>
        <View style={[styles.priceContainer, styles.priceContainerRTL]}>
          <View style={styles.priceItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("purchasePrice")}
            </ThemedText>
            <ThemedText type="body" style={[styles.priceValue, { textAlign: "right" }]}>
              {formatCurrency(item.purchasePrice)}
            </ThemedText>
          </View>
          <View style={styles.priceItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("salePrice")}
            </ThemedText>
            <ThemedText type="body" style={[styles.priceValue, { color: theme.accent, textAlign: "right" }]}>
              {formatCurrency(item.salePrice)}
            </ThemedText>
          </View>
          <View style={styles.priceItem}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
              {t("unit")}
            </ThemedText>
            <ThemedText type="body" style={[styles.priceValue, { textAlign: "right" }]}>
              {item.unit}
            </ThemedText>
          </View>
        </View>
        {item.type ? (
          <View style={[styles.typeBadge, { backgroundColor: theme.accent + "20", alignSelf: "flex-end" }]}>
            <ThemedText type="small" style={{ color: theme.accent }}>
              {item.type}
            </ThemedText>
          </View>
        ) : null}
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
        <ThemedText type="h3">{t("drugs")}</ThemedText>
        <Pressable onPress={handleAddDrug} style={styles.menuButton}>
          <Feather name="plus" size={24} color={theme.accent} />
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
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title="هنوز دارویی ثبت نشده"
            description="اولین دارو را اضافه کنید تا مدیریت موجودی را شروع کنید."
            actionLabel={t("addDrug")}
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
  drugCard: {
    marginBottom: Spacing.md,
  },
  drugHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  drugHeaderRTL: {
    flexDirection: "row-reverse",
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
  drugInfoRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  drugName: {
    fontWeight: "600",
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  priceContainerRTL: {
    flexDirection: "row-reverse",
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
