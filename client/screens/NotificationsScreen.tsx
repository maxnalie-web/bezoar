import React, { useCallback, useState } from "react";
import { View, StyleSheet, FlatList, Pressable, RefreshControl, Alert, Modal, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { FormInput } from "@/components/FormInput";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, AuroraGradient } from "@/constants/theme";
import { getNotificationFeed, addReminder, updateReminder, deleteReminder, NotificationItem } from "@/lib/storage";
import { ReminderType } from "@/types/models";

const typeMeta: Record<ReminderType, { icon: keyof typeof Feather.glyphMap; color: string; label: string }> = {
  installment: { icon: "credit-card", color: AuroraGradient.amber, label: "قسط" },
  lowStock: { icon: "package", color: AuroraGradient.rose, label: "موجودی" },
  followUp: { icon: "user-check", color: AuroraGradient.sky, label: "پیگیری" },
  custom: { icon: "bell", color: AuroraGradient.violet, label: "یادآوری" },
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const load = async () => {
    const feed = await getNotificationFeed();
    setItems(feed);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkDone = async (item: NotificationItem) => {
    if (item.type === "installment" || item.type === "lowStock") {
      Alert.alert(t("error"), "این مورد به‌صورت خودکار مدیریت می‌شود");
      return;
    }
    await updateReminder(item.id, { isDone: true });
    load();
  };

  const handleDelete = async (item: NotificationItem) => {
    if (item.type === "installment" || item.type === "lowStock") return;
    Alert.alert(t("delete"), t("areYouSure"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await deleteReminder(item.id);
          load();
        },
      },
    ]);
  };

  const handleAddReminder = async () => {
    if (!newTitle.trim() || !newDate.trim()) {
      Alert.alert(t("error"), t("required"));
      return;
    }
    const parsedDate = new Date(newDate);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert(t("error"), t("invalid"));
      return;
    }
    await addReminder({ type: "custom", title: newTitle, dueDate: parsedDate.toISOString() });
    setNewTitle("");
    setNewDate("");
    setShowAddModal(false);
    load();
  };

  const activeItems = items.filter((i) => !i.isDone);
  const overdueCount = activeItems.filter((i) => i.isOverdue).length;

  const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => {
    const meta = typeMeta[item.type];
    return (
      <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
        <GlassCard style={styles.card} elevated accentColor={item.isOverdue ? theme.error : meta.color}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: meta.color + "20" }]}>
              <Feather name={meta.icon} size={20} color={meta.color} />
            </View>
            <View style={styles.flexShrink}>
              <ThemedText type="body" numberOfLines={1} style={{ fontWeight: "600" }}>
                {item.title}
              </ThemedText>
              {item.description ? (
                <ThemedText type="small" numberOfLines={1} style={{ color: theme.textSecondary }}>
                  {item.description}
                </ThemedText>
              ) : null}
              <ThemedText type="small" style={{ color: item.isOverdue ? theme.error : theme.textSecondary, marginTop: 2 }}>
                {item.isOverdue ? t("overdue") + " · " : ""}
                {new Date(item.dueDate).toLocaleDateString("fa-IR")}
              </ThemedText>
            </View>
            <View style={styles.actionCol}>
              {item.type === "custom" || item.type === "followUp" ? (
                <Pressable onPress={() => handleMarkDone(item)} hitSlop={8} style={{ marginBottom: 8 }}>
                  <Feather name="check-circle" size={20} color={theme.success} />
                </Pressable>
              ) : null}
              {item.type === "custom" || item.type === "followUp" ? (
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <Feather name="trash-2" size={18} color={theme.error} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.menuButton}>
          <Feather name="menu" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">
          {t("notifications")}
          {overdueCount > 0 ? ` (${overdueCount.toLocaleString("fa-IR")})` : ""}
        </ThemedText>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.menuButton}>
          <Feather name="plus" size={24} color={theme.accent} />
        </Pressable>
      </View>

      <FlatList
        data={activeItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={<EmptyState icon="bell" title={t("noNotifications")} description="همه چیز مرتب است!" />}
      />

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{t("addReminder")}</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <FormInput label={t("reminderTitle")} value={newTitle} onChangeText={setNewTitle} rtl />
            <FormInput
              label={t("reminderDate")}
              value={newDate}
              onChangeText={setNewDate}
              placeholder="YYYY-MM-DD"
              rtl
            />
            <Button onPress={handleAddReminder}>{t("save")}</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: Spacing.md },
  iconCircle: { width: 42, height: 42, borderRadius: BorderRadius.md, alignItems: "center", justifyContent: "center" },
  flexShrink: { flex: 1 },
  actionCol: { alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
});
