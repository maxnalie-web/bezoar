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
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getSales, getPatients, getDrugs, saveSale, updateSale, getInstallments, updateInstallment } from "@/lib/storage";
import { Patient, Drug, PaymentStatus, Installment } from "@/types/models";

export default function SaleDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
  const [installments, setInstallments] = useState<Installment[]>([]);

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
      headerTitle: saleId ? t("editSale") : t("newSale"),
    });
  }, [saleId, navigation, t]);

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
        
        const allInstallments = await getInstallments();
        const saleInstallments = allInstallments
          .filter((i) => i.saleId === saleId)
          .sort((a, b) => a.installmentNumber - b.installmentNumber);
        setInstallments(saleInstallments);
      }
    }
  };

  const toggleInstallmentStatus = async (installmentId: string) => {
    const installment = installments.find((i) => i.id === installmentId);
    if (!installment) return;

    const newStatus = installment.status === "paid" ? "unpaid" : "paid";
    const paidDate = newStatus === "paid" ? new Date().toISOString() : undefined;

    await updateInstallment(installmentId, { status: newStatus, paidDate });
    
    setInstallments((prev) =>
      prev.map((i) =>
        i.id === installmentId ? { ...i, status: newStatus, paidDate } : i
      )
    );
  };

  const calculateTotal = () => {
    const bottles = parseInt(form.bottleCount) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    return bottles * price;
  };

  const handleSave = async () => {
    if (!selectedPatient || !selectedDrug) {
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
      Alert.alert(t("error"), "خطا در ذخیره فروش");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fa-IR") + " " + t("toman");
  };

  const PaymentStatusButton = ({ status, label }: { status: PaymentStatus; label: string }) => {
    const isSelected = form.paymentStatus === status;
    return (
      <Pressable
        onPress={() => updateField("paymentStatus", status)}
        style={[
          styles.statusButton,
          { borderColor: theme.glassBorder },
          isSelected && [styles.statusButtonActive, { backgroundColor: theme.accent + "20", borderColor: theme.accent }],
        ]}
      >
        <ThemedText
          type="small"
          style={[
            styles.statusText,
            { color: isSelected ? theme.accent : theme.textSecondary },
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
        <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.accent, textAlign: "right" }]}>
          {t("selectPatient")}
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
                    backgroundColor: theme.accent + "20",
                  },
                ]}
              >
                <ThemedText style={{ textAlign: "right" }}>{`${patient.firstName} ${patient.lastName}`}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                  {patient.nationalId}
                </ThemedText>
              </Pressable>
            ))}
            {patients.length === 0 ? (
              <ThemedText style={{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }}>
                بیماری یافت نشد. ابتدا یک بیمار اضافه کنید.
              </ThemedText>
            ) : null}
          </GlassCard>
        ) : (
          <GlassCard onPress={() => setShowPatientPicker(true)} style={styles.selectorCard}>
            <View style={[styles.selectorContent, styles.selectorContentRTL]}>
              <Feather name="user" size={20} color={theme.accent} />
              <View style={[styles.selectorText, styles.selectorTextRTL]}>
                <ThemedText type="body" style={{ textAlign: "right" }}>
                  {selectedPatient
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : "انتخاب بیمار"}
                </ThemedText>
                {selectedPatient ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                    {selectedPatient.nationalId}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          {t("selectDrug")}
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
                  selectedDrug?.id === drug.id && { backgroundColor: theme.accent + "20" },
                ]}
              >
                <ThemedText style={{ textAlign: "right" }}>{drug.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                  {formatCurrency(drug.salePrice)} هر {drug.unit}
                </ThemedText>
              </Pressable>
            ))}
          </GlassCard>
        ) : (
          <GlassCard onPress={() => setShowDrugPicker(true)} style={styles.selectorCard}>
            <View style={[styles.selectorContent, styles.selectorContentRTL]}>
              <Feather name="package" size={20} color={theme.accent} />
              <View style={[styles.selectorText, styles.selectorTextRTL]}>
                <ThemedText type="body" style={{ textAlign: "right" }}>{selectedDrug?.name || "انتخاب دارو"}</ThemedText>
                {selectedDrug ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                    {formatCurrency(selectedDrug.salePrice)} هر {selectedDrug.unit}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          جزئیات خرید
        </ThemedText>

        <FormInput
          label={t("bottleCount")}
          value={form.bottleCount}
          onChangeText={(value) => updateField("bottleCount", value)}
          placeholder="تعداد بطری"
          keyboardType="numeric"
          rtl={true}
        />
        <FormInput
          label={`${t("pricePerUnit")} (${t("toman")})`}
          value={form.unitPrice}
          onChangeText={(value) => updateField("unitPrice", value)}
          placeholder="قیمت هر بطری"
          keyboardType="numeric"
          rtl={true}
        />

        <GlassCard style={styles.totalCard}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {t("totalPrice")}
          </ThemedText>
          <ThemedText type="h3" style={{ color: theme.accent }}>
            {formatCurrency(calculateTotal())}
          </ThemedText>
        </GlassCard>

        <FormInput
          label={t("purchaseDate")}
          value={form.purchaseDate}
          onChangeText={(value) => updateField("purchaseDate", value)}
          placeholder="۱۴۰۳-۰۱-۰۱"
          rtl={true}
        />
        <FormInput
          label="تاریخ تحویل"
          value={form.deliveryDate}
          onChangeText={(value) => updateField("deliveryDate", value)}
          placeholder="۱۴۰۳-۰۱-۰۱"
          rtl={true}
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          {t("paymentStatus")}
        </ThemedText>

        <View style={[styles.statusContainer, styles.statusContainerRTL]}>
          <PaymentStatusButton status="paid" label={t("paid")} />
          <PaymentStatusButton status="unpaid" label={t("unpaid")} />
          <PaymentStatusButton status="installment" label={t("installment")} />
        </View>

        {form.paymentStatus === "installment" ? (
          <View style={styles.installmentSection}>
            <FormInput
              label="تعداد اقساط"
              value={form.installmentCount}
              onChangeText={(value) => updateField("installmentCount", value)}
              placeholder="مثال: ۳"
              keyboardType="numeric"
              rtl={true}
            />
            <FormInput
              label={`مبلغ هر قسط (${t("toman")})`}
              value={form.installmentAmount}
              onChangeText={(value) => updateField("installmentAmount", value)}
              placeholder="مبلغ هر پرداخت"
              keyboardType="numeric"
              rtl={true}
            />
          </View>
        ) : null}

        {saleId && installments.length > 0 ? (
          <View style={styles.installmentsListSection}>
            <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.accent, textAlign: "right" }]}>
              {t("installmentsStatus")}
            </ThemedText>
            
            <GlassCard style={styles.installmentsSummary}>
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("paidCount")}: {installments.filter((i) => i.status === "paid").length} / {installments.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("remainingCount")}: {formatCurrency(
                    installments.filter((i) => i.status === "unpaid").reduce((sum, i) => sum + i.amount, 0)
                  )}
                </ThemedText>
              </View>
            </GlassCard>

            {installments.map((inst) => (
              <Pressable
                key={inst.id}
                onPress={() => toggleInstallmentStatus(inst.id)}
                style={[
                  styles.installmentItem,
                  { 
                    backgroundColor: theme.capsuleBackground,
                    borderColor: inst.status === "paid" ? theme.success + "40" : theme.glassBorder,
                  },
                ]}
              >
                <View style={styles.installmentCheckbox}>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: inst.status === "paid" ? theme.success : theme.textSecondary },
                      inst.status === "paid" && { backgroundColor: theme.success },
                    ]}
                  >
                    {inst.status === "paid" ? (
                      <Feather name="check" size={14} color="#fff" />
                    ) : null}
                  </View>
                </View>
                <View style={styles.installmentInfo}>
                  <ThemedText type="body" style={{ textAlign: "right" }}>
                    {t("installmentNumber")} {inst.installmentNumber}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                    {formatCurrency(inst.amount)}
                  </ThemedText>
                </View>
                <View style={styles.installmentStatus}>
                  <ThemedText
                    type="small"
                    style={{
                      color: inst.status === "paid" ? theme.success : theme.warning,
                      fontWeight: "600",
                    }}
                  >
                    {inst.status === "paid" ? t("paidInstallment") : t("unpaidInstallment")}
                  </ThemedText>
                  {inst.paidDate ? (
                    <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 10 }}>
                      {new Date(inst.paidDate).toLocaleDateString("fa-IR")}
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {saleId ? t("updateSale") : t("newSale")}
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
  },
  selectorCard: {
    marginBottom: Spacing.md,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectorContentRTL: {
    flexDirection: "row-reverse",
  },
  selectorText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  selectorTextRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
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
  statusContainerRTL: {
    flexDirection: "row-reverse",
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
  },
  statusButtonActive: {},
  statusText: {
    fontWeight: "600",
  },
  installmentSection: {
    marginTop: Spacing.md,
  },
  installmentsListSection: {
    marginTop: Spacing.xl,
  },
  installmentsSummary: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  installmentItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  installmentCheckbox: {
    marginLeft: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  installmentInfo: {
    flex: 1,
  },
  installmentStatus: {
    alignItems: "flex-start",
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
});
