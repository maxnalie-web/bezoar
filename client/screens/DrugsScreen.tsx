import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDrugs = async () => {
    try {
      const data = await getDrugs();
      setDrugs(
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
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
    (navigation as any).navigate("DrugDetail", {
      drugId: undefined,
    });
  };

  const handleDeleteDrug = (drug: Drug) => {
    if (drug.name === "Bezoar") {
      Alert.alert(
        "خطا",
        "داروی اصلی Bezoar قابل حذف نیست."
      );
      return;
    }
    Alert.alert(
      t("delete"),
      `آیا مطمئن هستید که می‌خواهید ${drug.name} را حذف کنید؟`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            setDeletingId(drug.id);
            await deleteDrug(drug.id);
            setDeletingId(null);
            loadDrugs();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const renderDrug = ({
    item,
    index,
  }: {
    item: Drug;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
    >
      <GlassCard
        style={styles.drugCard}
        onPress={() => {
          if (deletingId === item.id) return;
          (navigation as any).navigate("DrugDetail", {
            drugId: item.id,
          });
        }}
      >
        <View
          style={styles.drugHeader}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.accent + "30" },
            ]}
          >
            <Feather
              name="package"
              size={24}
              color={theme.accent}
            />
          </View>

          <View style={styles.drugInfo}>
            <ThemedText
              type="body"
              style={styles.drugName}
            >
              {item.name}
            </ThemedText>
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
              }}
            >
              {t("drugCode")}: {item.code}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => {
              if (item.name === "Bezoar") {
                Alert.alert(
                  "خطا",
                  "داروی اصلی Bezoar قابل حذف نیست."
                );
                return;
              }
              handleDeleteDrug(item);
            }}
            style={({ pressed }) => [
              styles.deleteButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather
              name="trash-2"
              size={20}
              color={theme.error}
            />
          </Pressable>
        </View>

        <View
          style={styles.priceContainer}
        >
          <View style={styles.priceItem}>
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
              }}
            >
              {t("purchasePrice")}
            </ThemedText>
            <ThemedText
              type="body"
              style={styles.priceValue}
            >
              {formatCurrency(item.purchasePrice)}
            </ThemedText>
          </View>

          <View style={styles.priceItem}>
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
              }}
            >
              {t("salePrice")}
            </ThemedText>
            <ThemedText
              type="body"
              style={[
                styles.priceValue,
                { color: theme.accent },
              ]}
            >
              {formatCurrency(item.salePrice)}
            </ThemedText>
          </View>

          <View style={styles.priceItem}>
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
              }}
            >
              {t("unit")}
            </ThemedText>
            <ThemedText
              type="body"
              style={styles.priceValue}
            >
              {item.unit}
            </ThemedText>
          </View>
        </View>

        {item.type ? (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: theme.accent + "20",
                alignSelf: "flex-start",
              },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.accent }}>
              {item.type}
            </ThemedText>
          </View>
        ) : null}
      </GlassCard>
    </Animated.View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
      ]}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        <Pressable
          onPress={() =>
            navigation.dispatch(DrawerActions.toggleDrawer())
          }
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
  container: { flex: 1 },

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

  drugCard: { marginBottom: Spacing.md },

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

  drugInfo: { flex: 1, marginLeft: Spacing.lg },

  drugName: { fontWeight: "600" },

  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(239,68,68,0.1)",
    marginLeft: Spacing.lg,
  },

  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  priceItem: { flex: 1 },

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