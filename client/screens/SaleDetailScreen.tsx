import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getSales, getPatients, getDrugs, saveSale, updateSale } from "@/lib/storage";
import { Patient, Drug, PaymentStatus } from "@/types/models";

export default function SaleDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const saleId = (route.params as any)?.saleId;

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDrugPicker, setShowDrugPicker] = useState(false);

  const [form, setForm] = useState({
    bottleCount: "1",
    unitPrice: "",
    paymentStatus: "unpaid" as PaymentStatus,
    purchaseDate: new Date().toISOString().split("T")[0],
    deliveryDate: new Date().toISOString().split("T")[0],
    installmentCount: "",
    installmentAmount: "",
  });

  useEffect(() => {
    navigation.setOptions({
      headerTitle: saleId ? "Edit Sale" : "New Sale",
    });
  }, [saleId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [patientsData, drugsData] = await Promise.all([getPatients(), getDrugs()]);
    setPatients(patientsData);
    setDrugs(drugsData);

    if (drugsData.length > 0 && !selectedDrug) {
      setSelectedDrug(drugsData[0]);
      setForm((prev) => ({ ...prev, unitPrice: drugsData[0].salePrice.toString() }));
    }

    if (saleId) {
      const sales = await getSales();
      const sale = sales.find((s) => s.id === saleId);
      if (sale) {
        const patient = patientsData.find((p) => p.id === sale.patientId);
        const drug = drugsData.find((d) => d.id === sale.drugId);
        setSelectedPatient(patient || null);
        setSelectedDrug(drug || null);
        setForm({
          bottleCount: sale.bottleCount.toString(),
          unitPrice: sale.unitPrice.toString(),
          paymentStatus: sale.paymentStatus,
          purchaseDate: sale.purchaseDate.split("T")[0],
          deliveryDate: sale.deliveryDate.split("T")[0],
          installmentCount: sale.installmentCount?.toString() || "",
          installmentAmount: sale.installmentAmount?.toString() || "",
        });
      }
    }
  };

  const calculateTotal = () => {
    const bottles = parseInt(form.bottleCount) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    return bottles * price;
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      Alert.alert("Error", "Please select a patient");
      return;
    }

    if (!selectedDrug) {
      Alert.alert("Error", "Please select a drug");
      return;
    }

    if (!form.bottleCount || parseInt(form.bottleCount) <= 0) {
      Alert.alert("Error", "Please enter a valid bottle count");
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        patientId: selectedPatient.id,
        drugId: selectedDrug.id,
        bottleCount: parseInt(form.bottleCount),
        unitPrice: parseFloat(form.unitPrice) || selectedDrug.salePrice,
        totalPrice: calculateTotal(),
        purchaseDate: new Date(form.purchaseDate).toISOString(),
        deliveryDate: new Date(form.deliveryDate).toISOString(),
        paymentStatus: form.paymentStatus,
        installmentCount:
          form.paymentStatus === "installment" ? parseInt(form.installmentCount) || undefined : undefined,
        installmentAmount:
          form.paymentStatus === "installment" ? parseFloat(form.installmentAmount) || undefined : undefined,
      };

      if (saleId) {
        await updateSale(saleId, saleData);
      } else {
        await saveSale(saleData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save sale");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + " T";
  };

  const PaymentStatusButton = ({ status, label }: { status: PaymentStatus; label: string }) => {
    const isSelected = form.paymentStatus === status;
    return (
      <Pressable
        onPress={() => updateField("paymentStatus", status)}
        style={[
          styles.statusButton,
          isSelected && [styles.statusButtonActive, { backgroundColor: Colors.dark.accent + "20" }],
        ]}
      >
        <ThemedText
          type="small"
          style={[
            styles.statusText,
            { color: isSelected ? Colors.dark.accent : theme.textSecondary },
          ]}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
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
          Select Patient
        </ThemedText>

        {showPatientPicker ? (
          <GlassCard style={styles.pickerCard}>
            {patients.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() => {
                  setSelectedPatient(patient);
                  setShowPatientPicker(false);
                }}
                style={[
                  styles.pickerItem,
                  selectedPatient?.id === patient.id && {
                    backgroundColor: Colors.dark.accent + "20",
                  },
                ]}
              >
                <ThemedText>{`${patient.firstName} ${patient.lastName}`}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {patient.nationalId}
                </ThemedText>
              </Pressable>
            ))}
            {patients.length === 0 ? (
              <ThemedText style={{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }}>
                No patients available. Add a patient first.
              </ThemedText>
            ) : null}
          </GlassCard>
        ) : (
          <GlassCard onPress={() => setShowPatientPicker(true)} style={styles.selectorCard}>
            <View style={styles.selectorContent}>
              <Feather name="user" size={20} color={Colors.dark.accent} />
              <View style={styles.selectorText}>
                <ThemedText type="body">
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : "Select a patient"}
                </ThemedText>
                {selectedPatient ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {selectedPatient.nationalId}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Select Drug
        </ThemedText>

        {showDrugPicker ? (
          <GlassCard style={styles.pickerCard}>
            {drugs.map((drug) => (
              <Pressable
                key={drug.id}
                onPress={() => {
                  setSelectedDrug(drug);
                  updateField("unitPrice", drug.salePrice.toString());
                  setShowDrugPicker(false);
                }}
                style={[
                  styles.pickerItem,
                  selectedDrug?.id === drug.id && { backgroundColor: Colors.dark.accent + "20" },
                ]}
              >
                <ThemedText>{drug.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {formatCurrency(drug.salePrice)} per {drug.unit}
                </ThemedText>
              </Pressable>
            ))}
          </GlassCard>
        ) : (
          <GlassCard onPress={() => setShowDrugPicker(true)} style={styles.selectorCard}>
            <View style={styles.selectorContent}>
              <Feather name="package" size={20} color={Colors.dark.accent} />
              <View style={styles.selectorText}>
                <ThemedText type="body">{selectedDrug?.name || "Select a drug"}</ThemedText>
                {selectedDrug ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {formatCurrency(selectedDrug.salePrice)} per {selectedDrug.unit}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Purchase Details
        </ThemedText>

        <FormInput
          label="Bottle Count"
          value={form.bottleCount}
          onChangeText={(value) => updateField("bottleCount", value)}
          placeholder="Number of bottles"
          keyboardType="numeric"
        />
        <FormInput
          label="Unit Price (Toman)"
          value={form.unitPrice}
          onChangeText={(value) => updateField("unitPrice", value)}
          placeholder="Price per bottle"
          keyboardType="numeric"
        />

        <GlassCard style={styles.totalCard}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Price
          </ThemedText>
          <ThemedText type="h3" style={{ color: Colors.dark.accent }}>
            {formatCurrency(calculateTotal())}
          </ThemedText>
        </GlassCard>

        <FormInput
          label="Purchase Date"
          value={form.purchaseDate}
          onChangeText={(value) => updateField("purchaseDate", value)}
          placeholder="YYYY-MM-DD"
        />
        <FormInput
          label="Delivery Date"
          value={form.deliveryDate}
          onChangeText={(value) => updateField("deliveryDate", value)}
          placeholder="YYYY-MM-DD"
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Payment Status
        </ThemedText>

        <View style={styles.statusContainer}>
          <PaymentStatusButton status="paid" label="Paid" />
          <PaymentStatusButton status="unpaid" label="Unpaid" />
          <PaymentStatusButton status="installment" label="Installment" />
        </View>

        {form.paymentStatus === "installment" ? (
          <View style={styles.installmentSection}>
            <FormInput
              label="Number of Installments"
              value={form.installmentCount}
              onChangeText={(value) => updateField("installmentCount", value)}
              placeholder="e.g., 3"
              keyboardType="numeric"
            />
            <FormInput
              label="Amount per Installment (Toman)"
              value={form.installmentAmount}
              onChangeText={(value) => updateField("installmentAmount", value)}
              placeholder="Amount per payment"
              keyboardType="numeric"
            />
          </View>
        ) : null}

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {saleId ? "Update Sale" : "Create Sale"}
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
    marginBottom: Spacing.md,
    color: Colors.dark.accent,
  },
  selectorCard: {
    marginBottom: Spacing.md,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  pickerCard: {
    marginBottom: Spacing.md,
    maxHeight: 200,
  },
  pickerItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  totalCard: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statusContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  },
  statusButtonActive: {
    borderColor: Colors.dark.accent,
  },
  statusText: {
    fontWeight: "600",
  },
  installmentSection: {
    marginTop: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
