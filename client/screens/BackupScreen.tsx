import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, Share, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { ListItem } from "@/components/ListItem";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getAllData, restoreData, clearAllData } from "@/lib/storage";

export default function BackupScreen() {
  const { theme } = useTheme();
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
      
      if (Platform.OS !== "web") {
        await Share.share({
          message: backup,
          title: "Bezoar Backup",
        });
      } else {
        await Clipboard.setStringAsync(backup);
        Alert.alert("Success", "Backup data copied to clipboard!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create backup");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackup = async () => {
    if (!backupData) return;
    await Clipboard.setStringAsync(backupData);
    Alert.alert("Success", "Backup copied to clipboard!");
  };

  const handleRestore = () => {
    Alert.prompt(
      "Restore Backup",
      "Paste your backup data here:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async (value) => {
            if (!value) return;
            try {
              const data = JSON.parse(value);
              if (!data.patients || !data.drugs || !data.sales || !data.installments) {
                throw new Error("Invalid backup format");
              }
              await restoreData(data);
              Alert.alert("Success", "Data restored successfully!");
            } catch (error) {
              Alert.alert("Error", "Invalid backup data format");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleRestoreFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        Alert.alert("Error", "Clipboard is empty");
        return;
      }

      const data = JSON.parse(clipboardContent);
      if (!data.patients || !data.drugs || !data.sales || !data.installments) {
        throw new Error("Invalid backup format");
      }

      Alert.alert(
        "Restore Backup",
        `Found ${data.patients.length} patients, ${data.drugs.length} drugs, ${data.sales.length} sales. Restore this data?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            onPress: async () => {
              await restoreData(data);
              Alert.alert("Success", "Data restored successfully!");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Invalid backup data in clipboard");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete ALL data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Delete",
              "This will permanently delete all patients, drugs, sales, and payment records.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    await clearAllData();
                    Alert.alert("Success", "All data has been deleted.");
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">Backup</ThemedText>
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
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent + "20" }]}>
              <Feather name="upload-cloud" size={24} color={Colors.dark.accent} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText type="h4">Create Backup</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Export all your data as JSON
              </ThemedText>
            </View>
          </View>
          <Button
            onPress={handleCreateBackup}
            loading={loading}
            icon="download"
            style={styles.actionButton}
          >
            Create Backup
          </Button>
          {backupData ? (
            <Button
              onPress={handleCopyBackup}
              variant="secondary"
              icon="copy"
              style={styles.actionButton}
            >
              Copy to Clipboard
            </Button>
          ) : null}
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.dark.success + "20" }]}>
              <Feather name="download-cloud" size={24} color={Colors.dark.success} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText type="h4">Restore Backup</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Import data from a backup file
              </ThemedText>
            </View>
          </View>
          <Button
            onPress={handleRestoreFromClipboard}
            variant="secondary"
            icon="clipboard"
            style={styles.actionButton}
          >
            Restore from Clipboard
          </Button>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.dark.error + "20" }]}>
              <Feather name="trash-2" size={24} color={Colors.dark.error} />
            </View>
            <View style={styles.sectionInfo}>
              <ThemedText type="h4">Reset Database</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Delete all data permanently
              </ThemedText>
            </View>
          </View>
          <Button
            onPress={handleClearData}
            variant="danger"
            icon="alert-triangle"
            style={styles.actionButton}
          >
            Clear All Data
          </Button>
        </GlassCard>

        <GlassCard style={styles.infoCard}>
          <Feather name="info" size={20} color={theme.textSecondary} />
          <ThemedText type="small" style={[styles.infoText, { color: theme.textSecondary }]}>
            Backups include all patients, drugs, sales, and installment records. Store your
            backup data in a safe place.
          </ThemedText>
        </GlassCard>
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
  actionButton: {
    marginTop: Spacing.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
