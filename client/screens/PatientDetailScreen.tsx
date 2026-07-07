import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert, Image, Pressable, ScrollView, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";

import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { GlassCard } from "@/components/GlassCard";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getPatients, savePatient, updatePatient, addPatientAttachment, deletePatientAttachment } from "@/lib/storage";
import { Patient, PatientAttachment } from "@/types/models";

export default function PatientDetailScreen() {
  const { theme, isDark } = useTheme();
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
  const [attachments, setAttachments] = useState<PatientAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      if (patientId) loadPatient();
    }, [patientId])
  );

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
      setAttachments(patient.attachments ?? []);
    }
  };

  const handlePickAttachment = async () => {
    if (!patientId) {
      Alert.alert(t("error"), "ابتدا بیمار را ذخیره کنید تا بتوانید عکس یا سند اضافه کنید");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);
      const isImage = (asset.mimeType ?? "").startsWith("image/");
      const updated = await addPatientAttachment(
        patientId,
        asset.uri,
        asset.name ?? "file",
        isImage ? "image" : "document"
      );
      if (updated) setAttachments(updated.attachments ?? []);
    } catch (error) {
      Alert.alert(t("error"), "خطا در افزودن فایل");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAttachment = (attachment: PatientAttachment) => {
    if (attachment.type === "document") {
      Linking.openURL(attachment.uri).catch(() => {
        Alert.alert(t("error"), "امکان باز کردن فایل نیست");
      });
    }
  };

  const handleDeleteAttachment = (attachment: PatientAttachment) => {
    if (!patientId) return;
    Alert.alert(t("delete"), t("areYouSure"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          const updated = await deletePatientAttachment(patientId, attachment.id);
          if (updated) setAttachments(updated.attachments ?? []);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert(t("error"), "نام و نام خانوادگی الزامی است");
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
      Alert.alert(t("error"), "خطا در ذخیره بیمار");
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
      <LinearGradient
        colors={[color + (isDark ? "45" : "30"), color + (isDark ? "20" : "12")]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionIconBadge}
      >
        <Feather name={icon} size={18} color={color} />
      </LinearGradient>
      <ThemedText type="h4" style={[styles.sectionTitle, { color: theme.text }]}>
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
        <SectionHeader title={t("identityInformation")} icon="user" color={theme.accentSecondary} />

        <GlassCard accentColor={theme.accentSecondary} style={styles.sectionCard}>
          <FormInput
            label={t("firstName")}
            value={form.firstName}
            onChangeText={(value) => updateField("firstName", value)}
            placeholder={t("enterFirstName")}
          />
          <FormInput
            label={t("lastName")}
            value={form.lastName}
            onChangeText={(value) => updateField("lastName", value)}
            placeholder={t("enterLastName")}
          />
          <FormInput
            label={t("nationalId")}
            value={form.nationalId}
            onChangeText={(value) => updateField("nationalId", value)}
            placeholder={t("enterNationalId")}
            keyboardType="numeric"
          />
          <FormInput
            label={t("phone")}
            value={form.phone}
            onChangeText={(value) => updateField("phone", value)}
            placeholder={t("enterPhone")}
            keyboardType="phone-pad"
          />
          <FormInput
            label={t("address")}
            value={form.address}
            onChangeText={(value) => updateField("address", value)}
            placeholder={t("enterAddress")}
            multiline
          />
          <FormInput
            label={t("dateOfBirth")}
            value={form.dateOfBirth}
            onChangeText={(value) => updateField("dateOfBirth", value)}
            placeholder="۱۳۸۰-۰۱-۰۱"
          />
        </GlassCard>

        <SectionHeader title={t("medicalInformation")} icon="activity" color={theme.accentTertiary} />

        <GlassCard accentColor={theme.accentTertiary} style={styles.sectionCard}>
          <FormInput
            label={t("mainDisease")}
            value={form.mainDisease}
            onChangeText={(value) => updateField("mainDisease", value)}
            placeholder={t("enterMainDisease")}
          />
          <FormInput
            label={t("backgroundDiseases")}
            value={form.backgroundDiseases}
            onChangeText={(value) => updateField("backgroundDiseases", value)}
            placeholder={t("enterBackgroundDiseases")}
            multiline
          />
          <FormInput
            label={t("medicalDescription")}
            value={form.medicalDescription}
            onChangeText={(value) => updateField("medicalDescription", value)}
            placeholder={t("enterMedicalDescription")}
            multiline
          />
          <FormInput
            label={t("treatmentPlan")}
            value={form.treatmentPlan}
            onChangeText={(value) => updateField("treatmentPlan", value)}
            placeholder={t("enterTreatmentPlan")}
            multiline
          />
          <FormInput
            label={t("treatmentDuration")}
            value={form.treatmentDuration}
            onChangeText={(value) => updateField("treatmentDuration", value)}
            placeholder={t("enterTreatmentDuration")}
          />
          <FormInput
            label={t("doctorNotes")}
            value={form.doctorNotes}
            onChangeText={(value) => updateField("doctorNotes", value)}
            placeholder={t("enterDoctorNotes")}
            multiline
          />
        </GlassCard>

        <SectionHeader title="عکس‌ها و اسناد پزشکی" icon="paperclip" color={theme.accentDark} />

        <GlassCard accentColor={theme.accentDark} style={styles.sectionCard}>
          {attachments.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center", paddingVertical: Spacing.md }}>
              {patientId ? "هنوز فایلی اضافه نشده" : "ابتدا بیمار را ذخیره کنید"}
            </ThemedText>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentsRow}>
              {attachments.map((att) => (
                <Pressable
                  key={att.id}
                  onPress={() => handleOpenAttachment(att)}
                  onLongPress={() => handleDeleteAttachment(att)}
                  style={[styles.attachmentThumb, { borderColor: theme.glassBorder, backgroundColor: theme.backgroundSecondary }]}
                >
                  {att.type === "image" ? (
                    <Image source={{ uri: att.uri }} style={styles.attachmentImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.attachmentDocIcon}>
                      <Feather name="file-text" size={28} color={theme.accentDark} />
                    </View>
                  )}
                  <Pressable
                    onPress={() => handleDeleteAttachment(att)}
                    hitSlop={8}
                    style={[styles.attachmentDeleteBtn, { backgroundColor: theme.error }]}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Button
            variant="secondary"
            icon="upload"
            onPress={handlePickAttachment}
            loading={uploading}
            style={{ marginTop: Spacing.md }}
          >
            افزودن عکس یا سند
          </Button>
        </GlassCard>

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
    paddingTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    textAlign: "right",
  },
  sectionCard: {
    marginBottom: Spacing.sm,
  },
  saveButton: {
    marginTop: Spacing.xl,
  },
  attachmentsRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
  },
  attachmentThumb: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  attachmentDocIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentDeleteBtn: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
