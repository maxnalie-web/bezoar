import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getDrugs, saveDrug, updateDrug } from "@/lib/storage";

export default function DrugDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const drugId = (route.params as any)?.drugId;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "",
    purchasePrice: "",
    salePrice: "",
    unit: "بطری",
    description: "",
    stockQuantity: "0",
    lowStockThreshold: "0",
  });

  useEffect(() => {
    if (drugId) {
      loadDrug();
    }
  }, [drugId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: drugId ? t("editDrug") : t("addDrug"),
      headerTitleAlign: "right",
    });
  }, [drugId, navigation, t]);

  const loadDrug = async () => {
    const drugs = await getDrugs();
    const drug = drugs.find((d) => d.id === drugId);
    if (drug) {
      setForm({
        name: drug.name,
        code: drug.code,
        type: drug.type,
        purchasePrice: drug.purchasePrice.toString(),
        salePrice: drug.salePrice.toString(),
        unit: drug.unit,
        description: drug.description,
        stockQuantity: (drug.stockQuantity ?? 0).toString(),
        lowStockThreshold: (drug.lowStockThreshold ?? 0).toString(),
      });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert(t("error"), "نام دارو الزامی است");
      return;
    }
    const purchaseP = parseFloat(form.purchasePrice) || 0;
    const saleP = parseFloat(form.salePrice) || 0;
    if (purchaseP < 0 || saleP < 0) {
      Alert.alert(t("error"), "قیمت نمی‌تواند منفی باشد");
      return;
    }
    setLoading(true);
    try {
      const drugData = {
        name: form.name,
        code: form.code,
        type: form.type,
        purchasePrice: purchaseP,
        salePrice: saleP,
        unit: form.unit,
        description: form.description,
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 0,
      };

      if (drugId) {
        await updateDrug(drugId, drugData);
      } else {
        await saveDrug(drugData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("error"), "خطا در ذخیره دارو");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const SectionHeader = ({
    title,
    icon,
    color,
  }: {
    title: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
  }) => (
    <View style={styles.sectionHeaderRow}>
      <View
        style={[
          styles.sectionIconBadge,
          { backgroundColor: color + "22", borderColor: color + "45" },
        ]}
      >
        <Feather name={icon} size={16} color={color} />
      </View>
      <ThemedText
        type="h4"
        style={[styles.sectionTitle, { color: theme.text }]}
      >
        {title}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="اطلاعات دارو"
          icon="info"
          color={AuroraGradient.violet}
        />

        <FormInput
          label={t("drugName")}
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder={t("enterDrugName")}
          rtl={false}
        />
        <FormInput
          label={t("drugCode")}
          value={form.code}
          onChangeText={(value) => updateField("code", value)}
          placeholder="مثال: BZR001"
          rtl={false}
        />
        <FormInput
          label={t("drugType")}
          value={form.type}
          onChangeText={(value) => updateField("type", value)}
          placeholder="مثال: داروی گیاهی"
          rtl={false}
        />

        <SectionHeader
          title="قیمت‌گذاری"
          icon="dollar-sign"
          color={AuroraGradient.teal}
        />

        <FormInput
          label={`${t("purchasePrice")} (${t("toman")})`}
          value={form.purchasePrice}
          onChangeText={(value) => updateField("purchasePrice", value)}
          placeholder={t("enterPurchasePrice")}
          keyboardType="numeric"
          rtl={false}
        />
        <FormInput
          label={`${t("salePrice")} (${t("toman")})`}
          value={form.salePrice}
          onChangeText={(value) => updateField("salePrice", value)}
          placeholder={t("enterSalePrice")}
          keyboardType="numeric"
          rtl={false}
        />
        <FormInput
          label={t("unit")}
          value={form.unit}
          onChangeText={(value) => updateField("unit", value)}
          placeholder={`مثال: ${t("bottle")}`}
          rtl={false}
        />

        <SectionHeader
          title={t("stockManagement")}
          icon="box"
          color={AuroraGradient.amber}
        />

        <FormInput
          label={t("currentStock")}
          value={form.stockQuantity}
          onChangeText={(value) => updateField("stockQuantity", value)}
          keyboardType="numeric"
          rtl={false}
        />
        <FormInput
          label={t("lowStockThreshold")}
          value={form.lowStockThreshold}
          onChangeText={(value) => updateField("lowStockThreshold", value)}
          keyboardType="numeric"
          rtl={false}
        />

        <SectionHeader
          title="اطلاعات تکمیلی"
          icon="file-text"
          color={AuroraGradient.magenta}
        />

        <FormInput
          label="توضیحات"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="توضیحات دارو را وارد کنید"
          multiline
          rtl={false}
        />

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {drugId ? t("updateDrug") : t("addDrug")}
        </Button>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
    alignSelf: "stretch",
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: "700",
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
