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
import { getPatients, savePatient, updatePatient } from "@/lib/storage";
import { Patient } from "@/types/models";

export default function PatientDetailScreen() {
  const { theme } = useTheme();
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
      headerTitle: patientId ? "Edit Patient" : "Add Patient",
    });
  }, [patientId, navigation]);

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
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    if (!form.nationalId.trim()) {
      Alert.alert("Error", "National ID is required");
      return;
    }

    setLoading(true);
    try {
      if (patientId) {
        await updatePatient(patientId, form);
      } else {
        await savePatient(form);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save patient");
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
          Identity Information
        </ThemedText>

        <FormInput
          label="First Name"
          value={form.firstName}
          onChangeText={(value) => updateField("firstName", value)}
          placeholder="Enter first name"
        />
        <FormInput
          label="Last Name"
          value={form.lastName}
          onChangeText={(value) => updateField("lastName", value)}
          placeholder="Enter last name"
        />
        <FormInput
          label="National ID"
          value={form.nationalId}
          onChangeText={(value) => updateField("nationalId", value)}
          placeholder="Enter national ID"
          keyboardType="numeric"
        />
        <FormInput
          label="Phone Number"
          value={form.phone}
          onChangeText={(value) => updateField("phone", value)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        <FormInput
          label="Address"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="Enter full address"
          multiline
        />
        <FormInput
          label="Date of Birth"
          value={form.dateOfBirth}
          onChangeText={(value) => updateField("dateOfBirth", value)}
          placeholder="YYYY-MM-DD"
        />

        <ThemedText type="h4" style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Medical Information
        </ThemedText>

        <FormInput
          label="Main Disease"
          value={form.mainDisease}
          onChangeText={(value) => updateField("mainDisease", value)}
          placeholder="Primary diagnosis"
        />
        <FormInput
          label="Background Diseases"
          value={form.backgroundDiseases}
          onChangeText={(value) => updateField("backgroundDiseases", value)}
          placeholder="Other medical conditions"
          multiline
        />
        <FormInput
          label="Medical Description"
          value={form.medicalDescription}
          onChangeText={(value) => updateField("medicalDescription", value)}
          placeholder="Detailed medical notes"
          multiline
        />
        <FormInput
          label="Treatment Plan"
          value={form.treatmentPlan}
          onChangeText={(value) => updateField("treatmentPlan", value)}
          placeholder="Treatment approach"
          multiline
        />
        <FormInput
          label="Treatment Duration"
          value={form.treatmentDuration}
          onChangeText={(value) => updateField("treatmentDuration", value)}
          placeholder="e.g., 3 months"
        />
        <FormInput
          label="Doctor Notes"
          value={form.doctorNotes}
          onChangeText={(value) => updateField("doctorNotes", value)}
          placeholder="Additional notes"
          multiline
        />

        <Button onPress={handleSave} loading={loading} style={styles.saveButton}>
          {patientId ? "Update Patient" : "Add Patient"}
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
