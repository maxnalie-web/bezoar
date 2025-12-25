import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors } from "@/constants/theme";
import { getDrugs, saveDrug, updateDrug } from "@/lib/storage";

export default function DrugDetailScreen() {
  const { theme } = useTheme();
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
    unit: "Bottle",
    description: "",
  });

  useEffect(() => {
    if (drugId) {
      loadDrug();
    }
  }, [drugId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: drugId ? "Edit Drug" : "Add Drug",
    });
  }, [drugId, navigation]);

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
      Alert.alert("Error", "Drug name is required");
      return;
    }

    if (!form.code.trim()) {
      Alert.alert("Error", "Drug code is required");
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
      Alert.alert("Error", "Failed to save drug");
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
        <ThemedText type="h4" style={styles.sectionTitle}>
          Drug Information
        </ThemedText>

        <FormInput
          label="Drug Name"
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="Enter drug name"
        />
        <FormInput
          label="Drug Code"
          value={form.code}
          onChangeText={(value) => updateField("code", value)}
          placeholder="Enter drug code (e.g., BZR001)"
        />
        <FormInput
          label="Drug Type"
          value={form.type}
          onChangeText={(value) => updateField("type", value)}
          placeholder="e.g., Herbal Medicine"
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Pricing
        </ThemedText>

        <FormInput
          label="Purchase Price (Toman)"
          value={form.purchasePrice}
          onChangeText={(value) => updateField("purchasePrice", value)}
          placeholder="Enter purchase price"
          keyboardType="numeric"
        />
        <FormInput
          label="Sale Price (Toman)"
          value={form.salePrice}
          onChangeText={(value) => updateField("salePrice", value)}
          placeholder="Enter sale price"
          keyboardType="numeric"
        />
        <FormInput
          label="Unit"
          value={form.unit}
          onChangeText={(value) => updateField("unit", value)}
          placeholder="e.g., Bottle"
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Additional Info
        </ThemedText>

        <FormInput
          label="Description"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="Enter drug description"
          multiline
        />

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {drugId ? "Update Drug" : "Add Drug"}
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
    color: Colors.dark.accent,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
