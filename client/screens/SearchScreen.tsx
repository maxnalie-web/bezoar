import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TextInput, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getPatients, getSales, getDrugs } from "@/lib/storage";
import { Patient, Sale, Drug } from "@/types/models";

export default function SearchScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);

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
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جستجو در بیماران، فروش‌ها، داروها..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patients */}
        {filteredPatients.length > 0 && (
          <Section title="بیماران">
            {filteredPatients.map(p => (
              <ResultItem
                key={p.id}
                icon="user"
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
        {filteredSales.length > 0 && (
          <Section title="فروش‌ها">
            {filteredSales.map(s => (
              <ResultItem
                key={s.id}
                icon="shopping-cart"
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
        {filteredDrugs.length > 0 && (
          <Section title="داروها">
            {filteredDrugs.map(d => (
              <ResultItem
                key={d.id}
                icon="package"
                title={d.name}
                subtitle={`${d.salePrice.toLocaleString("fa-IR")} تومان`}
                onPress={() =>
                  (navigation as any).navigate("DrugDetail", { drugId: d.id })
                }
              />
            ))}
          </Section>
        )}

        {q && !filteredPatients.length && !filteredSales.length && !filteredDrugs.length && (
          <ThemedText style={{ textAlign: "center", marginTop: Spacing.xl, color: theme.textSecondary }}>
            نتیجه‌ای یافت نشد
          </ThemedText>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- Small Components ---------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <ThemedText
        type="title"
        style={{
          marginBottom: Spacing.sm,
          marginLeft: Spacing.lg,
          textAlign: "left",
        }}
      >
        {title}
      </ThemedText>
      <GlassCard>{children}</GlassCard>
    </View>
  );
}

function ResultItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.resultItem}>
      <Feather name={icon} size={18} />
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <ThemedText type="body">{title}</ThemedText>
        {subtitle && <ThemedText type="small">{subtitle}</ThemedText>}
      </View>
      <Feather name="chevron-right" size={18} />
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
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    textAlign: "left",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});