import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
import Animated, { FadeInRight, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getDrugs, deleteDrug } from "@/lib/storage";
import { Drug } from "@/types/models";

type SortMode = "newest" | "oldest" | "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

const ACCENT_ROTATION = [
  AuroraGradient.teal,
  AuroraGradient.violet,
  AuroraGradient.magenta,
  AuroraGradient.amber,
  AuroraGradient.sky,
  AuroraGradient.emerald,
];

function accentForDrug(drug: Drug, index: number): string {
  if (drug.type) {
    let hash = 0;
    for (let i = 0; i < drug.type.length; i++) {
      hash = (hash * 31 + drug.type.charCodeAt(i)) >>> 0;
    }
    return ACCENT_ROTATION[hash % ACCENT_ROTATION.length];
  }
  return ACCENT_ROTATION[index % ACCENT_ROTATION.length];
}

export default function DrugsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadDrugs = async () => {
    try {
      const data = await getDrugs();
      setDrugs(data);
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

  const sortOptions: { key: SortMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "newest", label: t("newest"), icon: "clock" },
    { key: "oldest", label: t("oldest"), icon: "rotate-ccw" },
    { key: "nameAsc", label: t("sortByName"), icon: "arrow-down" },
    { key: "nameDesc", label: t("sortByNameDesc"), icon: "arrow-up" },
    { key: "priceAsc", label: t("sortByPriceAsc"), icon: "trending-up" },
    { key: "priceDesc", label: t("sortByPriceDesc"), icon: "trending-down" },
  ];

  const visibleDrugs = useMemo(() => {
    let list = [...drugs];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code?.toLowerCase().includes(q) ||
          d.type?.toLowerCase().includes(q)
      );
    }

    switch (sortMode) {
      case "newest":
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        list.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "nameAsc":
        list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
        break;
      case "nameDesc":
        list.sort((a, b) => b.name.localeCompare(a.name, "fa"));
        break;
      case "priceAsc":
        list.sort((a, b) => a.salePrice - b.salePrice);
        break;
      case "priceDesc":
        list.sort((a, b) => b.salePrice - a.salePrice);
        break;
    }

    return list;
  }, [drugs, searchQuery, sortMode]);

  const renderDrug = ({
    item,
    index,
  }: {
    item: Drug;
    index: number;
  }) => {
    const accent = accentForDrug(item, index);
    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50).duration(300)}
      >
        <GlassCard
          style={styles.drugCard}
          accentColor={accent}
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
                { backgroundColor: accent + "26", borderColor: accent + "40" },
              ]}
            >
              <Feather
                name="package"
                size={22}
                color={accent}
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
                { opacity: pressed ? 0.6 : 1, backgroundColor: theme.error + "18" },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather
                name="trash-2"
                size={19}
                color={theme.error}
              />
            </Pressable>
          </View>

          <View
            style={[styles.priceContainer, { borderTopColor: theme.glassBorder }]}
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
                  { color: accent },
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
                  backgroundColor: accent + "1f",
                  borderColor: accent + "40",
                  alignSelf: "flex-start",
                },
              ]}
            >
              <View style={[styles.typeDot, { backgroundColor: accent }]} />
              <ThemedText type="small" style={{ color: accent, fontWeight: "600" }}>
                {item.type}
              </ThemedText>
            </View>
          ) : null}
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
      ]}
    >
      <LinearGradient
        colors={[theme.accentSecondary + "22", "transparent"]}
        style={styles.headerGlow}
        pointerEvents="none"
      />

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

        <Pressable
          onPress={handleAddDrug}
          style={[styles.addButton, { backgroundColor: theme.accentSecondary }]}
        >
          <Feather name="plus" size={22} color={theme.buttonText} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("searchDrugs")}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            selectionColor={theme.accentSecondary}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFiltersOpen((v) => !v)}
          style={[
            styles.filterToggle,
            {
              backgroundColor: filtersOpen
                ? theme.accentTertiary
                : theme.backgroundSecondary,
              borderColor: filtersOpen ? theme.accentTertiary : theme.glassBorder,
            },
          ]}
        >
          <Feather
            name="sliders"
            size={18}
            color={filtersOpen ? theme.buttonText : theme.textSecondary}
          />
        </Pressable>
      </View>

      {filtersOpen ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.sortWrap}>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}
          >
            {t("sortBy")}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortScroll}
          >
            {sortOptions.map((opt) => {
              const active = sortMode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortMode(opt.key)}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active
                        ? theme.accentSecondary
                        : theme.backgroundSecondary,
                      borderColor: active ? theme.accentSecondary : theme.glassBorder,
                    },
                  ]}
                >
                  <Feather
                    name={opt.icon}
                    size={14}
                    color={active ? theme.buttonText : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: active ? theme.buttonText : theme.text,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}

      <View style={styles.resultsRow}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {visibleDrugs.length} {t("resultsCount")}
        </ThemedText>
      </View>

      <FlatList
        data={visibleDrugs}
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
            tintColor={theme.accentSecondary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={searchQuery ? t("noSearchResults") : "هنوز دارویی ثبت نشده"}
            description={
              searchQuery
                ? ""
                : "اولین دارو را اضافه کنید تا مدیریت موجودی را شروع کنید."
            }
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

  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    textAlign: "right",
    paddingVertical: 0,
  },

  filterToggle: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  sortWrap: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  sortScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  resultsRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  drugInfo: { flex: 1, marginLeft: Spacing.lg },

  drugName: { fontWeight: "700" },

  deleteButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.lg,
  },

  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },

  priceItem: { flex: 1 },

  priceValue: {
    fontWeight: "700",
    marginTop: Spacing.xs,
  },

  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },

  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
