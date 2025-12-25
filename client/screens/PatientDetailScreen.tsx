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
import { getPatients, savePatient, updatePatient } from "@/lib/storage";
import { Patient } from "@/types/models";

export default function PatientDetailScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const patientId = (route.params as any)?.patientId;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    mainDisease: "",
    backgroundDiseases: "",
    medicalDescription: "",
    treatmentPlan: "",
    treatmentDuration: "",
    doctorNotes: "",
  });

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: patientId ? t("editPatient") : t("addPatient"),
    });
  }, [patientId, navigation, t]);

  const loadPatient = async () => {
    const patients = await getPatients();
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setForm({
        firstName: patient.firstName,
        lastName: patient.lastName,
        nationalId: patient.nationalId,
        phone: patient.phone,
        address: patient.address,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        mainDisease: patient.mainDisease,
        backgroundDiseases: patient.backgroundDiseases,
        medicalDescription: patient.medicalDescription,
        treatmentPlan: patient.treatmentPlan,
        treatmentDuration: patient.treatmentDuration,
        doctorNotes: patient.doctorNotes,
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (patientId) {
        await updatePatient(patientId, form);
      } else {
        await savePatient(form);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("error"), "خطا در ذخیره بیمار");
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
          {t("identityInformation")}
        </ThemedText>

        <FormInput
          label={t("firstName")}
          value={form.firstName}
          onChangeText={(value) => updateField("firstName", value)}
          placeholder={t("enterFirstName")}
          rtl={true}
        />
        <FormInput
          label={t("lastName")}
          value={form.lastName}
          onChangeText={(value) => updateField("lastName", value)}
          placeholder={t("enterLastName")}
          rtl={true}
        />
        <FormInput
          label={t("nationalId")}
          value={form.nationalId}
          onChangeText={(value) => updateField("nationalId", value)}
          placeholder={t("enterNationalId")}
          keyboardType="numeric"
          rtl={true}
        />
        <FormInput
          label={t("phone")}
          value={form.phone}
          onChangeText={(value) => updateField("phone", value)}
          placeholder={t("enterPhone")}
          keyboardType="phone-pad"
          rtl={true}
        />
        <FormInput
          label={t("address")}
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder={t("enterAddress")}
          multiline
          rtl={true}
        />
        <FormInput
          label={t("dateOfBirth")}
          value={form.dateOfBirth}
          onChangeText={(value) => updateField("dateOfBirth", value)}
          placeholder="۱۳۸۰-۰۱-۰۱"
          rtl={true}
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl, color: theme.accent, textAlign: "right" }]}>
          {t("medicalInformation")}
        </ThemedText>

        <FormInput
          label={t("mainDisease")}
          value={form.mainDisease}
          onChangeText={(value) => updateField("mainDisease", value)}
          placeholder={t("enterMainDisease")}
          rtl={true}
        />
        <FormInput
          label={t("backgroundDiseases")}
          value={form.backgroundDiseases}
          onChangeText={(value) => updateField("backgroundDiseases", value)}
          placeholder={t("enterBackgroundDiseases")}
          multiline
          rtl={true}
        />
        <FormInput
          label={t("medicalDescription")}
          value={form.medicalDescription}
          onChangeText={(value) => updateField("medicalDescription", value)}
          placeholder={t("enterMedicalDescription")}
          multiline
          rtl={true}
        />
        <FormInput
          label={t("treatmentPlan")}
          value={form.treatmentPlan}
          onChangeText={(value) => updateField("treatmentPlan", value)}
          placeholder={t("enterTreatmentPlan")}
          multiline
          rtl={true}
        />
        <FormInput
          label={t("treatmentDuration")}
          value={form.treatmentDuration}
          onChangeText={(value) => updateField("treatmentDuration", value)}
          placeholder={t("enterTreatmentDuration")}
          rtl={true}
        />
        <FormInput
          label={t("doctorNotes")}
          value={form.doctorNotes}
          onChangeText={(value) => updateField("doctorNotes", value)}
          placeholder={t("enterDoctorNotes")}
          multiline
          rtl={true}
        />

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {patientId ? t("updatePatient") : t("addPatient")}
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
