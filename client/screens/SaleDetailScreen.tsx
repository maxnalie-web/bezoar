import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import {
  getSales,
  getPatients,
  getDrugs,
  saveSale,
  updateSale,
  getInstallments,
  updateInstallment,
} from "@/lib/storage";
import { Patient, Drug, PaymentStatus, Installment } from "@/types/models";

import dayjs from "dayjs";
import jalaliday from "jalaliday";

dayjs.extend(jalaliday);

export default function SaleDetailScreen() {
  const { theme, isDark } = useTheme();
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
  const [selectedExtraDrugIds, setSelectedExtraDrugIds] = useState<string[]>([]);
  const [showExtraDrugPicker, setShowExtraDrugPicker] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDrugPicker, setShowDrugPicker] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isGift, setIsGift] = useState(false);

  const mainDrugName = "Bezoar";
  const mainDrugId = selectedDrug?.id;

  const extraDrugs = useMemo(() => {
    // Extra (side) drugs are any drugs except the main Bezoar drug.
    return drugs.filter((d) => d.name !== mainDrugName);
  }, [drugs]);

  const [form, setForm] = useState({
    bottleCount: "1",
    unitPrice: "",
    paymentStatus: "unpaid" as PaymentStatus,
    purchaseDate: dayjs().calendar("jalali").format("YYYY-MM-DD"),
    deliveryDate: dayjs().calendar("jalali").format("YYYY-MM-DD"),
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

    const mainDrug = drugsData.find((d) => d.name === "Bezoar");
    if (mainDrug) {
      setSelectedDrug(mainDrug);
      setForm((prev) => ({ ...prev, unitPrice: mainDrug.salePrice.toString() }));
    }

    if (saleId) {
      const sales = await getSales();
      const sale = sales.find((s) => s.id === saleId);
      if (sale) {
        const gift = (sale as any).isGift === true;
        setIsGift(gift);

        const patient = patientsData.find((p) => p.id === sale.patientId);
        const drug = drugsData.find((d) => d.id === (sale as any).drugId);
        setSelectedPatient(patient || null);
        setSelectedDrug((prev) => prev ?? drug ?? null);

        const auxiliaryIds = Array.isArray((sale as any).auxiliaryDrugs)
          ? ((sale as any).auxiliaryDrugs as any[]).map((d) => d.drugId)
          : [];
        setSelectedExtraDrugIds(auxiliaryIds);

        setForm({
          bottleCount: sale.bottleCount.toString(),
          unitPrice: gift ? "0" : sale.unitPrice.toString(),
          paymentStatus: gift ? ("paid" as PaymentStatus) : sale.paymentStatus,
          purchaseDate: dayjs(sale.purchaseDate).calendar("jalali").format("YYYY-MM-DD"),
          deliveryDate: dayjs(sale.deliveryDate).calendar("jalali").format("YYYY-MM-DD"),
          installmentCount: gift ? "" : sale.installmentCount?.toString() || "",
          installmentAmount: gift ? "" : sale.installmentAmount?.toString() || "",
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
      prev.map((i) => (i.id === installmentId ? { ...i, status: newStatus, paidDate } : i))
    );
  };

  const calculateMainTotal = () => {
    if (isGift) return 0;
    const bottles = parseInt(form.bottleCount) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    return bottles * price;
  };

  const calculateAuxiliaryTotal = () => {
    if (isGift) return 0;
    return selectedExtraDrugIds.reduce((sum, id) => {
      const drug = drugs.find((d) => d.id === id);
      return sum + (drug ? drug.salePrice : 0);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateMainTotal() + calculateAuxiliaryTotal();
  };

  const handleSave = async () => {
    if (!selectedPatient || !selectedDrug) {
      Alert.alert(
        t("error"),
        !selectedPatient ? "لطفاً یک بیمار انتخاب کنید" : "لطفاً یک دارو انتخاب کنید"
      );
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        patientId: selectedPatient.id,
        drugId: selectedDrug.id,
        isGift: isGift,

        auxiliaryDrugs: isGift
          ? []
          : selectedExtraDrugIds.map((id) => {
              const drug = drugs.find((d) => d.id === id)!;
              return {
                drugId: drug.id,
                quantity: 1,
                unitPrice: drug.salePrice,
                totalPrice: drug.salePrice,
              };
            }),

        bottleCount: parseInt(form.bottleCount),
        unitPrice: isGift ? 0 : parseFloat(form.unitPrice) || selectedDrug.salePrice,
        totalPrice: isGift ? 0 : calculateGrandTotal(),

        purchaseDate: dayjs(form.purchaseDate, "YYYY-MM-DD")
          .calendar("jalali")
          .toDate()
          .toISOString(),
        deliveryDate: dayjs(form.deliveryDate, "YYYY-MM-DD")
          .calendar("jalali")
          .toDate()
          .toISOString(),

        paymentStatus: isGift ? ("paid" as PaymentStatus) : form.paymentStatus,

        installmentCount:
          !isGift && form.paymentStatus === "installment"
            ? parseInt(form.installmentCount) || undefined
            : undefined,
        installmentAmount:
          !isGift && form.paymentStatus === "installment"
            ? parseFloat(form.installmentAmount) || undefined
            : undefined,
      } as any;

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

  const statusAccent = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return AuroraGradient.emerald;
      case "unpaid":
        return AuroraGradient.rose;
      case "installment":
        return AuroraGradient.amber;
      default:
        return theme.accent;
    }
  };

  const PaymentStatusButton = ({ status, label }: { status: PaymentStatus; label: string }) => {
    const isSelected = form.paymentStatus === status;
    const accent = statusAccent(status);
    return (
      <Pressable
        onPress={() => {
          if (isGift) return;
          updateField("paymentStatus", status);
        }}
        style={[
          styles.statusButton,
          { borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary },
          isSelected && [
            styles.statusButtonActive,
            { backgroundColor: accent + "22", borderColor: accent },
          ],
          isGift && { opacity: 0.6 },
        ]}
      >
        <ThemedText
          type="small"
          style={[styles.statusText, { color: isSelected ? accent : theme.textSecondary }]}
        >
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  const SectionHeader = ({
    icon,
    color,
    label,
  }: {
    icon: keyof typeof Feather.glyphMap;
    color: string;
    label: string;
  }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionHeaderIcon, { backgroundColor: color + "22", borderColor: color + "40" }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <ThemedText type="small" style={[styles.sectionHeaderText, { color: theme.text }]}>
        {label}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {isGift && (
          <GlassCard
            accentColor={AuroraGradient.violet}
            style={{
              marginBottom: Spacing.lg,
              backgroundColor: AuroraGradient.violet + "18",
              borderColor: AuroraGradient.violet,
              borderWidth: 1,
            }}
          >
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                justifyContent: "center",
                gap: Spacing.sm,
              }}
            >
              <Feather name="gift" size={18} color={AuroraGradient.violet} />
              <ThemedText style={{ color: AuroraGradient.violet, fontWeight: "700" }}>
                این فروش به‌صورت هدیه ثبت می‌شود
              </ThemedText>
            </View>
          </GlassCard>
        )}
        <SectionHeader icon="user" color={theme.accentSecondary} label={t("selectPatient")} />

        {showPatientPicker ? (
          <GlassCard style={{ ...styles.pickerCard, marginBottom: Spacing.lg }}>
            {patients.map((patient) => (
              <Pressable
                key={patient.id}
                onPress={() => {
                  setSelectedPatient(patient);
                  setShowPatientPicker(false);
                }}
                style={[
                  styles.pickerItem,
                  selectedPatient?.id === patient.id && { backgroundColor: theme.accentSecondary + "20" },
                ]}
              >
                <ThemedText style={styles.centerText}>{`${patient.firstName} ${patient.lastName}`}</ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                  {patient.nationalId}
                </ThemedText>
              </Pressable>
            ))}
            {patients.length === 0 ? (
              <ThemedText style={[{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }, styles.centerText]}>
                بیماری یافت نشد. ابتدا یک بیمار اضافه کنید.
              </ThemedText>
            ) : null}
          </GlassCard>
        ) : (
          <GlassCard accentColor={theme.accentSecondary} onPress={() => setShowPatientPicker(true)} style={{ ...styles.selectorCard, marginBottom: Spacing.lg }}>
            <View style={[styles.selectorContent, styles.selectorContentRTL]}>
              <View style={[styles.selectorIconWrap, { backgroundColor: theme.accentSecondary + "22" }]}>
                <Feather name="user" size={18} color={theme.accentSecondary} />
              </View>
              <View style={[styles.selectorText, styles.selectorTextRTL]}>
                <ThemedText type="body" style={styles.centerText}>
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "انتخاب بیمار"}
                </ThemedText>
                {selectedPatient ? (
                  <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                    {selectedPatient.nationalId}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        <SectionHeader icon="package" color={theme.accent} label={t("selectDrug")} />

        {/* Primary drug (fixed) */}
        <GlassCard accentColor={theme.accent} style={{ ...styles.selectorCard, marginBottom: Spacing.lg }}>
          <View style={[styles.selectorContent, styles.selectorContentRTL]}>
            <View style={[styles.selectorIconWrap, { backgroundColor: theme.accent + "22" }]}>
              <Feather name="package" size={18} color={theme.accent} />
            </View>
            <View style={[styles.selectorText, styles.selectorTextRTL]}>
              <ThemedText type="body" style={[styles.centerText, { fontSize: 18, fontWeight: "700" }]}>
                {selectedDrug?.name || "Bezoar"}
              </ThemedText>
              {selectedDrug ? (
                <ThemedText type="small" style={[{ color: theme.textSecondary, fontSize: 15 }, styles.centerText]}>
                  {formatCurrency(selectedDrug.salePrice)} هر {selectedDrug.unit}
                </ThemedText>
              ) : null}
              <ThemedText type="small" style={[{ color: theme.textSecondary, marginTop: 4, fontSize: 14 }, styles.centerText]}>
                داروی اصلی فروش (قابل تغییر نیست)
              </ThemedText>
            </View>
          </View>
        </GlassCard>

        {/* Extra (side) drugs */}
        <SectionHeader icon="plus-circle" color={theme.accentTertiary} label="داروهای جانبی" />

        {showExtraDrugPicker ? (
          <GlassCard style={{ ...styles.pickerCard, marginBottom: Spacing.lg }}>
            {extraDrugs.map((drug) => {
              const selected = selectedExtraDrugIds.includes(drug.id);
              return (
                <Pressable
                  key={drug.id}
                  onPress={() => {
                    setSelectedExtraDrugIds((prev) =>
                      selected ? prev.filter((id) => id !== drug.id) : [...prev, drug.id]
                    );
                  }}
                  style={[styles.pickerItem, selected && { backgroundColor: theme.accentTertiary + "20" }]}
                >
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.centerText}>{drug.name}</ThemedText>
                      <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                        {formatCurrency(drug.salePrice)} هر {drug.unit}
                      </ThemedText>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: selected ? theme.accentTertiary : theme.textSecondary,
                        backgroundColor: selected ? theme.accentTertiary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: Spacing.md,
                      }}
                    >
                      {selected ? <Feather name="check" size={14} color="#fff" /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {extraDrugs.length === 0 ? (
              <ThemedText style={[{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }, styles.centerText]}>
                داروی جانبی برای انتخاب وجود ندارد.
              </ThemedText>
            ) : null}

            <Button onPress={() => setShowExtraDrugPicker(false)} style={{ marginTop: Spacing.sm }}>
              بستن
            </Button>
          </GlassCard>
        ) : (
          <GlassCard accentColor={theme.accentTertiary} onPress={() => setShowExtraDrugPicker(true)} style={{ ...styles.selectorCard, marginBottom: Spacing.lg }}>
            <View style={[styles.selectorContent, styles.selectorContentRTL]}>
              <View style={[styles.selectorIconWrap, { backgroundColor: theme.accentTertiary + "22" }]}>
                <Feather name="plus-circle" size={18} color={theme.accentTertiary} />
              </View>
              <View style={[styles.selectorText, styles.selectorTextRTL]}>
                <ThemedText type="body" style={styles.centerText}>
                  {selectedExtraDrugIds.length ? `تعداد انتخاب‌شده: ${selectedExtraDrugIds.length}` : "انتخاب داروهای جانبی"}
                </ThemedText>
                {selectedExtraDrugIds.length ? (
                  <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                    {selectedExtraDrugIds
                      .map((id) => drugs.find((d) => d.id === id)?.name)
                      .filter(Boolean)
                      .join("، ")}
                  </ThemedText>
                ) : null}
              </View>
              <Feather name="chevron-down" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
        )}

        {/* Gift toggle */}
        <GlassCard accentColor={AuroraGradient.violet} style={{ marginBottom: Spacing.lg }}>
          <View
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: Spacing.sm }}>
              <View
                style={[
                  styles.giftIconWrap,
                  { backgroundColor: AuroraGradient.violet + (isGift ? "30" : "18") },
                ]}
              >
                <Feather name="gift" size={16} color={AuroraGradient.violet} />
              </View>
              <ThemedText style={{ fontWeight: "600" }}>این فروش هدیه است</ThemedText>
            </View>

            <Pressable
              onPress={() => {
                setIsGift((prev) => {
                  const next = !prev;

                  setForm((f) =>
                    next
                      ? {
                          ...f,
                          paymentStatus: "paid" as PaymentStatus,
                          installmentCount: "",
                          installmentAmount: "",
                          unitPrice: "0",
                        }
                      : {
                          ...f,
                          unitPrice: selectedDrug?.salePrice?.toString() ?? f.unitPrice,
                        }
                  );

                  return next;
                });
              }}
              style={[
                styles.giftSwitchTrack,
                { backgroundColor: isGift ? AuroraGradient.violet : theme.glassBorder },
              ]}
            >
              <View
                style={[
                  styles.giftSwitchThumb,
                  {
                    alignSelf: isGift ? "flex-start" : "flex-end",
                    shadowColor: AuroraGradient.violet,
                  },
                ]}
              />
            </Pressable>
          </View>
        </GlassCard>

        <SectionHeader icon="shopping-bag" color={theme.info} label="جزئیات خرید" />

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
          editable={!isGift}
        />

        <View style={[styles.totalCardOuter, { marginBottom: Spacing.lg }]}>
          <LinearGradient
            colors={[
              theme.accentSecondary + (isDark ? "26" : "1a"),
              theme.accent + (isDark ? "20" : "14"),
              theme.accentTertiary + (isDark ? "26" : "1a"),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.totalCard, styles.centerBoxContent, { borderColor: theme.glassBorder }]}>
            <View style={[styles.totalIconWrap, { backgroundColor: theme.accent + "22" }]}>
              <Feather name="bar-chart-2" size={18} color={theme.accent} />
            </View>

            <ThemedText type="small" style={[{ color: theme.textSecondary, fontSize: 15, marginTop: Spacing.sm }, styles.centerText]}>
              جمع داروی اصلی
            </ThemedText>
            <ThemedText type="body" style={[{ color: theme.text, fontSize: 18, fontWeight: "700" }, styles.centerText]}>
              {formatCurrency(calculateMainTotal())}
            </ThemedText>

            <ThemedText type="small" style={[{ color: theme.textSecondary, marginTop: 8, fontSize: 15 }, styles.centerText]}>
              جمع داروهای جانبی
            </ThemedText>
            <ThemedText type="body" style={[{ color: theme.text, fontSize: 18, fontWeight: "700" }, styles.centerText]}>
              {formatCurrency(calculateAuxiliaryTotal())}
            </ThemedText>

            <View style={[styles.totalDivider, { backgroundColor: theme.glassBorder }]} />

            <ThemedText type="small" style={[{ color: theme.textSecondary, fontSize: 15 }, styles.centerText]}>
              مبلغ کل
            </ThemedText>
            <ThemedText type="h3" style={[{ color: isGift ? theme.textSecondary : theme.accentTertiary, fontSize: 24, fontWeight: "800" }, styles.centerText]}>
              {formatCurrency(calculateGrandTotal())}
            </ThemedText>
          </View>
        </View>

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

        <SectionHeader icon="credit-card" color={theme.accentTertiary} label={t("paymentStatus")} />

        <View style={[styles.statusContainer, styles.statusContainerRTL]}>
          <PaymentStatusButton status="paid" label={t("paid")} />
          <PaymentStatusButton status="unpaid" label={t("unpaid")} />
          <PaymentStatusButton status="installment" label={t("installment")} />
        </View>

        {!isGift && form.paymentStatus === "installment" ? (
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
            <SectionHeader icon="list" color={AuroraGradient.amber} label={t("installmentsStatus")} />

            <GlassCard accentColor={AuroraGradient.amber} style={{ ...styles.installmentsSummary, marginBottom: Spacing.lg }}>
              <View style={styles.summaryRow}>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                  {t("paidCount")}: {installments.filter((i) => i.status === "paid").length} / {installments.length}
                </ThemedText>
                <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                  {t("remainingCount")}:{" "}
                  {formatCurrency(installments.filter((i) => i.status === "unpaid").reduce((sum, i) => sum + i.amount, 0))}
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
                    {inst.status === "paid" ? <Feather name="check" size={14} color="#fff" /> : null}
                  </View>
                </View>
                <View style={styles.installmentInfo}>
                  <ThemedText type="body" style={styles.centerText}>
                    {t("installmentNumber")} {inst.installmentNumber}
                  </ThemedText>
                  <ThemedText type="small" style={[{ color: theme.textSecondary }, styles.centerText]}>
                    {formatCurrency(inst.amount)}
                  </ThemedText>
                </View>
                <View style={styles.installmentStatus}>
                  <ThemedText
                    type="small"
                    style={{
                      color: inst.status === "paid" ? theme.success : theme.warning,
                      fontWeight: "600",
                      textAlign: "center",
                      alignSelf: "center",
                    }}
                  >
                    {inst.status === "paid" ? t("paidInstallment") : t("unpaidInstallment")}
                  </ThemedText>
                  {inst.paidDate ? (
                    <ThemedText type="small" style={[{ color: theme.textSecondary, fontSize: 10 }, styles.centerText]}>
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
  selectorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  selectorTextRTL: {
    marginRight: Spacing.md,
  },
  pickerCard: {
    marginBottom: Spacing.md,
    maxHeight: 260,
  },
  pickerItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  giftIconWrap: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  giftSwitchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  giftSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  totalCardOuter: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  totalCard: {
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  totalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  totalDivider: {
    height: 1,
    alignSelf: "stretch",
    marginVertical: Spacing.md,
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
  sectionHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.lg,
    alignSelf: "flex-end",
  },
  sectionHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "right",
  },
  centerBoxContent: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  centerText: {
    textAlign: "center",
    alignSelf: "center",
  },
});