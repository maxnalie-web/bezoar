import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing } from "@/constants/theme";
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
    unit: t("bottle"),
    description: "",
  });

  useEffect(() => {
    if (drugId) {
      loadDrug();
    }
  }, [drugId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: drugId ? t("editDrug") : t("addDrug"),
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
      });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert(t("error"), "نام دارو الزامی است");
      return;
    }

    if (!form.code.trim()) {
      Alert.alert(t("error"), "کد دارو الزامی است");
      return;
    }

    setLoading(true);
    try {
      const drugData = {
        name: form.name,
        code: form.code,
        type: form.type,
        purchasePrice: parseFloat(form.purchasePrice) || 0,
        salePrice: parseFloat(form.salePrice) || 0,
        unit: form.unit,
        description: form.description,
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
        <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.accent, textAlign: "right" }]}>
          اطلاعات دارو
        </ThemedText>

        <FormInput
          label={t("drugName")}
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder={t("enterDrugName")}
          rtl={true}
        />
        <FormInput
          label={t("drugCode")}
          value={form.code}
          onChangeText={(value) => updateField("code", value)}
          placeholder="مثال: BZR001"
          rtl={true}
        />
        <FormInput
          label={t("drugType")}
          value={form.type}
          onChangeText={(value) => updateField("type", value)}
          placeholder="مثال: داروی گیاهی"
          rtl={true}
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          قیمت‌گذاری
        </ThemedText>

        <FormInput
          label={`${t("purchasePrice")} (${t("toman")})`}
          value={form.purchasePrice}
          onChangeText={(value) => updateField("purchasePrice", value)}
          placeholder={t("enterPurchasePrice")}
          keyboardType="numeric"
          rtl={true}
        />
        <FormInput
          label={`${t("salePrice")} (${t("toman")})`}
          value={form.salePrice}
          onChangeText={(value) => updateField("salePrice", value)}
          placeholder={t("enterSalePrice")}
          keyboardType="numeric"
          rtl={true}
        />
        <FormInput
          label={t("unit")}
          value={form.unit}
          onChangeText={(value) => updateField("unit", value)}
          placeholder={`مثال: ${t("bottle")}`}
          rtl={true}
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          اطلاعات تکمیلی
        </ThemedText>

        <FormInput
          label="توضیحات"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="توضیحات دارو را وارد کنید"
          multiline
          rtl={true}
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
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
