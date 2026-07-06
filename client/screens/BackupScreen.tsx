import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAllData, restoreData, RestoreResult } from "@/lib/storage";

export default function BackupScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleExportToFile = async () => {
    setLoading(true);
    try {
      const data = await getAllData();
      const backup = JSON.stringify(data, null, 2);
      const fileName = `bezoar-backup-${new Date().toISOString().split("T")[0]}.json`;

      if (Platform.OS !== "web") {
        const FileSystem = await import("expo-file-system");
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, backup, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/json",
            dialogTitle: t("exportToFile"),
          });
        } else {
          Alert.alert(t("error"), t("sharingNotAvailable"));
        }
      } else {
        const blob = new Blob([backup], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert(t("success"), t("fileDownloaded"));
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(t("error"), t("failedToExport"));
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const fileUri = result.assets[0].uri;
      
      let content: string;

      if (Platform.OS !== "web") {
        const FileSystem = await import("expo-file-system");
        content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        const response = await fetch(fileUri);
        content = await response.text();
      }

      const data = JSON.parse(content);
      if (
        !Array.isArray(data.patients) ||
        !Array.isArray(data.drugs) ||
        !Array.isArray(data.sales) ||
        !Array.isArray(data.installments)
      ) {
        throw new Error("Invalid backup format");
      }

      Alert.alert(
        t("restoreBackup"),
        `${data.patients.length} بیمار، ${data.drugs.length} دارو، ${data.sales.length} فروش ${t("foundData")}.\n\n${t("smartRestoreInfo")}`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("confirm"),
            onPress: async () => {
              const result = await restoreData(data);
              if (result.totalNew === 0) {
                Alert.alert(t("success"), t("noNewDataToRestore"));
              } else {
                const details = [];
                if (result.newPatients > 0) details.push(`${result.newPatients} ${t("newPatient")}`);
                if (result.newDrugs > 0) details.push(`${result.newDrugs} ${t("newDrug")}`);
                if (result.newSales > 0) details.push(`${result.newSales} ${t("newSale")}`);
                if (result.newInstallments > 0) details.push(`${result.newInstallments} ${t("newInstallment")}`);
                Alert.alert(t("success"), `${t("dataRestored")}: ${details.join("، ")}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert(t("error"), t("invalidBackupFormat"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menuButton}>
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>

        <ThemedText type="h3" style={styles.headerTitle}>
          {t("backup")}
        </ThemedText>

        <View style={styles.menuButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
                <Feather name="upload-cloud" size={24} color={theme.accent} />
              </View>
              <View style={[styles.sectionInfo, styles.sectionInfoRTL]}>
                <ThemedText type="h4" style={{ textAlign: "left" }}>
                  {t("createBackup")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "left" }}>
                  {t("exportAllData")}
                </ThemedText>
              </View>
            </View>
            <Button
              onPress={handleExportToFile}
              loading={loading}
              icon="file"
              style={styles.actionButton}
            >
              {t("exportToFile")}
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.success + "20" }]}>
                <Feather name="download-cloud" size={24} color={theme.success} />
              </View>
              <View style={[styles.sectionInfo, styles.sectionInfoRTL]}>
                <ThemedText type="h4" style={{ textAlign: "left" }}>
                  {t("restoreBackup")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "left" }}>
                  {t("importFromBackup")}
                </ThemedText>
              </View>
            </View>
            <Button
              onPress={handleImportFromFile}
              variant="secondary"
              icon="file-plus"
              style={styles.actionButton}
            >
              {t("importFromFile")}
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard>
            <View style={styles.infoRow}>
              <Feather name="info" size={20} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.infoText, { color: theme.textSecondary }]}>
                {t("backupInfo")}
              </ThemedText>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionHeaderRTL: {
    flexDirection: "row",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sectionInfoRTL: {
    marginLeft: Spacing.md,
    marginRight: 0,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
    textAlign: "left",
  },
});
