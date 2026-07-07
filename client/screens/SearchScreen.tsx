import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getPatients, getSales, getDrugs } from "@/lib/storage";
import { Patient, Sale, Drug } from "@/types/models";

type ResultType = "all" | "patients" | "sales" | "drugs";

export default function SearchScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [typeFilter, setTypeFilter] = useState<ResultType>("all");

  useEffect(() => {
    (async () => {
      const [p, s, d] = await Promise.all([
        getPatients(),
        getSales(),
        getDrugs(),
      ]);
      setPatients(p);
      setSales(s);
      setDrugs(d);
    })();
  }, []);

  const q = query.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    if (!q) return [];
    return patients.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.phone?.includes(q) ?? false) ||
      (p.nationalId?.includes(q) ?? false)
    );
  }, [q, patients]);

  const filteredSales = useMemo(() => {
    if (!q) return [];
    return sales.filter(s =>
      s.id.includes(q) ||
      s.patientId.includes(q)
    );
  }, [q, sales]);

  const filteredDrugs = useMemo(() => {
    if (!q) return [];
    return drugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.code?.toLowerCase().includes(q) ?? false)
    );
  }, [q, drugs]);

  const showPatients = typeFilter === "all" || typeFilter === "patients";
  const showSales = typeFilter === "all" || typeFilter === "sales";
  const showDrugs = typeFilter === "all" || typeFilter === "drugs";

  const visiblePatients = showPatients ? filteredPatients : [];
  const visibleSales = showSales ? filteredSales : [];
  const visibleDrugs = showDrugs ? filteredDrugs : [];

  const totalResults = filteredPatients.length + filteredSales.length + filteredDrugs.length;

  const typeFilters: { key: ResultType; label: string; icon: keyof typeof Feather.glyphMap; color: string; count: number }[] = [
    { key: "all", label: t("all") || "همه", icon: "grid", color: theme.accent, count: totalResults },
    { key: "patients", label: "بیماران", icon: "user", color: AuroraGradient.teal, count: filteredPatients.length },
    { key: "sales", label: "فروش‌ها", icon: "shopping-cart", color: AuroraGradient.violet, count: filteredSales.length },
    { key: "drugs", label: "داروها", icon: "package", color: AuroraGradient.amber, count: filteredDrugs.length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() =>
            (navigation as any).canGoBack()
              ? (navigation as any).goBack()
              : (navigation as any).openDrawer?.()
          }
          style={styles.iconBtn}
        >
          <Feather
            name={(navigation as any).canGoBack() ? "arrow-right" : "menu"}
            size={22}
            color={theme.text}
          />
        </Pressable>

        <ThemedText type="h3">{t("search") || "جستجو"}</ThemedText>

        <View style={styles.iconBtn} />
      </View>

      {/* Search Input */}
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
          value={query}
          onChangeText={setQuery}
          placeholder="جستجو در بیماران، فروش‌ها، داروها..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          selectionColor={theme.accentSecondary}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Type filter chips */}
      {q ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {typeFilters.map(f => {
            const active = typeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTypeFilter(f.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? f.color : theme.backgroundSecondary,
                    borderColor: active ? f.color : theme.glassBorder,
                  },
                ]}
              >
                <Feather
                  name={f.icon}
                  size={14}
                  color={active ? theme.buttonText : f.color}
                />
                <ThemedText
                  type="small"
                  style={{
                    color: active ? theme.buttonText : theme.text,
                    fontWeight: active ? "700" : "400",
                  }}
                >
                  {f.label}
                </ThemedText>
                <View
                  style={[
                    styles.chipBadge,
                    { backgroundColor: active ? theme.buttonText + "30" : f.color + "20" },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: active ? theme.buttonText : f.color,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {f.count}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patients */}
        {visiblePatients.length > 0 && (
          <Section title="بیماران" color={AuroraGradient.teal}>
            {visiblePatients.map(p => (
              <ResultItem
                key={p.id}
                icon="user"
                color={AuroraGradient.teal}
                title={`${p.firstName} ${p.lastName}`}
                subtitle={p.phone}
                onPress={() =>
                  (navigation as any).navigate("PatientDetail", { patientId: p.id })
                }
              />
            ))}
          </Section>
        )}

        {/* Sales */}
        {visibleSales.length > 0 && (
          <Section title="فروش‌ها" color={AuroraGradient.violet}>
            {visibleSales.map(s => (
              <ResultItem
                key={s.id}
                icon="shopping-cart"
                color={AuroraGradient.violet}
                title={`${s.bottleCount} بطری`}
                subtitle={s.isGift ? "هدیه" : `${s.totalPrice.toLocaleString("fa-IR")} تومان`}
                onPress={() =>
                  (navigation as any).navigate("SaleDetail", { saleId: s.id })
                }
              />
            ))}
          </Section>
        )}

        {/* Drugs */}
        {visibleDrugs.length > 0 && (
          <Section title="داروها" color={AuroraGradient.amber}>
            {visibleDrugs.map(d => (
              <ResultItem
                key={d.id}
                icon="package"
                color={AuroraGradient.amber}
                title={d.name}
                subtitle={`${d.salePrice.toLocaleString("fa-IR")} تومان`}
                onPress={() =>
                  (navigation as any).navigate("DrugDetail", { drugId: d.id })
                }
              />
            ))}
          </Section>
        )}

        {q && visiblePatients.length === 0 && visibleSales.length === 0 && visibleDrugs.length === 0 && (
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyIconBadge,
                { backgroundColor: theme.accent + (isDark ? "20" : "14") },
              ]}
            >
              <Feather name="search" size={28} color={theme.accent} />
            </View>
            <ThemedText style={{ textAlign: "center", marginTop: Spacing.md, color: theme.textSecondary }}>
              نتیجه‌ای یافت نشد
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- Small Components ---------- */

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <ThemedText
          type="title"
          style={{
            textAlign: "right",
          }}
        >
          {title}
        </ThemedText>
      </View>
      <GlassCard accentColor={color} noPadding style={styles.sectionCard}>
        {children}
      </GlassCard>
    </View>
  );
}

function ResultItem({
  icon,
  color,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  color: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.resultItem, { borderBottomColor: theme.glassBorder }]}
    >
      <LinearGradient
        colors={[color + (isDark ? "40" : "26"), color + (isDark ? "20" : "12")]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resultIconBadge}
      >
        <Feather name={icon} size={18} color={color} />
      </LinearGradient>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
        <ThemedText type="body" style={{ textAlign: "right" }}>{title}</ThemedText>
        {subtitle && (
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      <Feather name="chevron-left" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    textAlign: "right",
  },
  chipsScroll: {
    marginBottom: Spacing.md,
  },
  chipsRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
    marginRight: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  resultItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
