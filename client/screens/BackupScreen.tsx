import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getAllData, restoreData, clearAllData } from "@/lib/storage";

export default function BackupScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [backupData, setBackupData] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const data = await getAllData();
      const backup = JSON.stringify(data, null, 2);
      setBackupData(backup);
      
      const fileName = `bezoar-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS !== "web") {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, backup, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/json",
            dialogTitle: t("createBackup"),
          });
        } else {
          await Clipboard.setStringAsync(backup);
          Alert.alert(t("success"), t("backupCopied"));
        }
      } else {
        await Clipboard.setStringAsync(backup);
        Alert.alert(t("success"), t("backupCopied"));
      }
    } catch (error) {
      Alert.alert(t("error"), t("failedToCreateBackup"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportToFile = async () => {
    setLoading(true);
    try {
      const data = await getAllData();
      const backup = JSON.stringify(data, null, 2);
      const fileName = `bezoar-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      if (Platform.OS !== "web") {
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

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const data = JSON.parse(content);
      if (!data.patients || !data.drugs || !data.sales || !data.installments) {
        throw new Error("Invalid backup format");
      }

      Alert.alert(
        t("restoreBackup"),
        `${data.patients.length} بیمار، ${data.drugs.length} دارو، ${data.sales.length} فروش ${t("foundData")}. ${t("restoreQuestion")}`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("confirm"),
            onPress: async () => {
              await restoreData(data);
              Alert.alert(t("success"), t("backupRestored"));
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t("error"), t("invalidBackupFormat"));
    }
  };

  const handleCopyBackup = async () => {
    if (!backupData) return;
    await Clipboard.setStringAsync(backupData);
    Alert.alert(t("success"), t("backupCopied"));
  };

  const handleRestoreFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        Alert.alert(t("error"), t("clipboardEmpty"));
        return;
      }

      const data = JSON.parse(clipboardContent);
      if (!data.patients || !data.drugs || !data.sales || !data.installments) {
        throw new Error("Invalid backup format");
      }

      Alert.alert(
        t("restoreBackup"),
        `${data.patients.length} بیمار، ${data.drugs.length} دارو، ${data.sales.length} فروش ${t("foundData")}. ${t("restoreQuestion")}`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("confirm"),
            onPress: async () => {
              await restoreData(data);
              Alert.alert(t("success"), t("backupRestored"));
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t("error"), t("invalidBackupData"));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t("clearAllData"),
      t("areYouSure") + " " + t("thisCannotBeUndone"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("confirmDelete"),
              t("deleteConfirmMessage"),
              [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("confirm"),
                  style: "destructive",
                  onPress: async () => {
                    await clearAllData();
                    Alert.alert(t("success"), t("allDataDeleted"));
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, styles.headerRTL, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("backup")}</ThemedText>
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
                <ThemedText type="h4" style={{ textAlign: "right" }}>
                  {t("createBackup")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                  {t("exportAllData")}
                </ThemedText>
              </View>
            </View>
            <Button
              onPress={handleCreateBackup}
              loading={loading}
              icon="download"
              style={styles.actionButton}
            >
              {t("createBackup")}
            </Button>
            <Button
              onPress={handleExportToFile}
              variant="secondary"
              icon="file"
              style={styles.actionButton}
            >
              {t("exportToFile")}
            </Button>
            {backupData ? (
              <Button
                onPress={handleCopyBackup}
                variant="secondary"
                icon="copy"
                style={styles.actionButton}
              >
                {t("copyToClipboard")}
              </Button>
            ) : null}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.success + "20" }]}>
                <Feather name="download-cloud" size={24} color={theme.success} />
              </View>
              <View style={[styles.sectionInfo, styles.sectionInfoRTL]}>
                <ThemedText type="h4" style={{ textAlign: "right" }}>
                  {t("restoreBackup")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
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
            <Button
              onPress={handleRestoreFromClipboard}
              variant="secondary"
              icon="clipboard"
              style={styles.actionButton}
            >
              {t("restoreFromClipboard")}
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <GlassCard style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderRTL]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
                <Feather name="trash-2" size={24} color={theme.error} />
              </View>
              <View style={[styles.sectionInfo, styles.sectionInfoRTL]}>
                <ThemedText type="h4" style={{ textAlign: "right" }}>
                  {t("resetDatabase")}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "right" }}>
                  {t("deleteAllDataPermanently")}
                </ThemedText>
              </View>
            </View>
            <Button
              onPress={handleClearData}
              variant="danger"
              icon="alert-triangle"
              style={styles.actionButton}
            >
              {t("clearAllData")}
            </Button>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <GlassCard style={[styles.infoCard, styles.infoCardRTL]}>
            <Feather name="info" size={20} color={theme.textSecondary} />
            <ThemedText type="small" style={[styles.infoText, { color: theme.textSecondary }, styles.infoTextRTL]}>
              {t("backupInfo")}
            </ThemedText>
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
  headerRTL: {
    flexDirection: "row-reverse",
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row-reverse",
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
    marginLeft: 0,
    marginRight: Spacing.md,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.md,
  },
  infoCardRTL: {
    flexDirection: "row-reverse",
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTextRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
    textAlign: "right",
  },
});
