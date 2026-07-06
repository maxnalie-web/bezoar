import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Patient, Drug, Sale, Installment, AppData, StockMovement, StockMovementType, Reminder, ReminderType, PatientAttachment } from "@/types/models";

const STORAGE_KEYS = {
  PATIENTS: "@bezoar/patients",
  DRUGS: "@bezoar/drugs",
  SALES: "@bezoar/sales",
  INSTALLMENTS: "@bezoar/installments",
  STOCK_MOVEMENTS: "@bezoar/stockMovements",
  REMINDERS: "@bezoar/reminders",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getTimestamp(): string {
  return new Date().toISOString();
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PATIENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePatient(patient: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<Patient> {
  const patients = await getPatients();
  const newPatient: Patient = {
    ...patient,
    id: generateId(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
  patients.push(newPatient);
  await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return newPatient;
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const patients = await getPatients();
  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) return null;
  patients[index] = { ...patients[index], ...updates, updatedAt: getTimestamp() };
  await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return patients[index];
}

export async function deletePatient(id: string): Promise<boolean> {
  const patients = await getPatients();
  const filtered = patients.filter((p) => p.id !== id);
  if (filtered.length === patients.length) return false;
  await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));
  return true;
}

// ─────────────────────────────────────────────────────────────
// Patient attachments (medical photos / documents) — copied into a
// permanent local app folder so they survive after the picker's
// temporary cache is cleared.
// ─────────────────────────────────────────────────────────────

export async function addPatientAttachment(
  patientId: string,
  pickedUri: string,
  fileName: string,
  type: PatientAttachment["type"]
): Promise<Patient | null> {
  let storedUri = pickedUri;

  if (Platform.OS !== "web") {
    const FileSystem = await import("expo-file-system/legacy");
    const dir = FileSystem.documentDirectory + "patient-attachments/" + patientId + "/";
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = dir + generateId() + "-" + fileName;
    await FileSystem.copyAsync({ from: pickedUri, to: dest });
    storedUri = dest;
  }

  const patients = await getPatients();
  const index = patients.findIndex((p) => p.id === patientId);
  if (index === -1) return null;

  const attachment: PatientAttachment = {
    id: generateId(),
    type,
    name: fileName,
    uri: storedUri,
    addedAt: getTimestamp(),
  };

  const attachments = [...(patients[index].attachments ?? []), attachment];
  patients[index] = { ...patients[index], attachments, updatedAt: getTimestamp() };
  await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return patients[index];
}

export async function deletePatientAttachment(patientId: string, attachmentId: string): Promise<Patient | null> {
  const patients = await getPatients();
  const index = patients.findIndex((p) => p.id === patientId);
  if (index === -1) return null;

  const target = patients[index].attachments?.find((a) => a.id === attachmentId);
  if (target && Platform.OS !== "web") {
    try {
      const FileSystem = await import("expo-file-system/legacy");
      await FileSystem.deleteAsync(target.uri, { idempotent: true });
    } catch {
      // ignore filesystem errors, still remove the reference below
    }
  }

  const attachments = (patients[index].attachments ?? []).filter((a) => a.id !== attachmentId);
  patients[index] = { ...patients[index], attachments, updatedAt: getTimestamp() };
  await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return patients[index];
}

export async function getDrugs(): Promise<Drug[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRUGS);
    const drugs = data ? JSON.parse(data) : [];
    if (drugs.length === 0) {
      const defaultDrug: Drug = {
        id: generateId(),
        name: "Bezoar",
        code: "BZR001",
        type: "Herbal Medicine",
        purchasePrice: 0,
        salePrice: 0,
        unit: "Bottle",
        description: "Default Bezoar drug",
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        isMain: true,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify([defaultDrug]));
      return [defaultDrug];
    }
    return drugs;
  } catch {
    return [];
  }
}

export async function saveDrug(drug: Omit<Drug, "id" | "createdAt" | "updatedAt">): Promise<Drug> {
  const drugs = await getDrugs();
  const newDrug: Drug = {
    ...drug,
    id: generateId(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
  drugs.push(newDrug);
  await AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify(drugs));
  return newDrug;
}

export async function updateDrug(id: string, updates: Partial<Drug>): Promise<Drug | null> {
  const drugs = await getDrugs();
  const index = drugs.findIndex((d) => d.id === id);
  if (index === -1) return null;
  drugs[index] = { ...drugs[index], ...updates, updatedAt: getTimestamp() };
  await AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify(drugs));
  return drugs[index];
}

export async function deleteDrug(id: string): Promise<boolean> {
  const drugs = await getDrugs();
  const target = drugs.find(d => d.id === id);
  if (target && target.name === "Bezoar") {
    return false;
  }
  const filtered = drugs.filter((d) => d.id !== id);
  if (filtered.length === drugs.length) return false;
  await AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify(filtered));
  return true;
}

export async function getSales(): Promise<Sale[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveSale(
  sale: Omit<Sale, "id" | "createdAt" | "updatedAt">
): Promise<Sale> {
  const sales = await getSales();

  if (!sale.isGift) {
    await adjustDrugStock(sale.drugId, -sale.bottleCount, "sale", "فروش");
    if (Array.isArray(sale.auxiliaryDrugs)) {
      for (const aux of sale.auxiliaryDrugs) {
        await adjustDrugStock(aux.drugId, -aux.quantity, "sale", "فروش (جانبی)");
      }
    }
  }

  let mainTotal = sale.bottleCount * sale.unitPrice;
  let auxiliaryTotal = Array.isArray(sale.auxiliaryDrugs)
    ? sale.auxiliaryDrugs.reduce(
        (sum, d) => sum + d.quantity * d.unitPrice,
        0
      )
    : 0;

  if (sale.isGift === true) {
    mainTotal = 0;
    auxiliaryTotal = 0;
  }

  const newSale: Sale = {
    ...sale,
    mainTotalPrice: mainTotal,
    auxiliaryTotalPrice: auxiliaryTotal,
    totalPrice: sale.isGift === true ? 0 : mainTotal + auxiliaryTotal,
    id: generateId(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };

  sales.push(newSale);
  await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

  if (
    sale.paymentStatus === "installment" &&
    sale.installmentCount &&
    sale.installmentAmount &&
    !sale.isGift
  ) {
    const installments: Installment[] = [];
    const dueDate = new Date(sale.purchaseDate);

    for (let i = 1; i <= sale.installmentCount; i++) {
      dueDate.setMonth(dueDate.getMonth() + 1);
      installments.push({
        id: generateId(),
        saleId: newSale.id,
        installmentNumber: i,
        amount: sale.installmentAmount,
        dueDate: dueDate.toISOString(),
        status: "unpaid",
        createdAt: getTimestamp(),
      });
    }

    await saveInstallments(installments);
  }

  return newSale;
}

export async function updateSale(
  id: string,
  updates: Partial<Sale>
): Promise<Sale | null> {
  const sales = await getSales();
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const base = { ...sales[index], ...updates };

  let mainTotal = base.bottleCount * base.unitPrice;

  let auxiliaryTotal = Array.isArray(base.auxiliaryDrugs)
    ? base.auxiliaryDrugs.reduce(
        (sum, d) => sum + d.quantity * d.unitPrice,
        0
      )
    : 0;

  if (base.isGift === true) {
    mainTotal = 0;
    auxiliaryTotal = 0;
  }

  sales[index] = {
    ...base,
    mainTotalPrice: mainTotal,
    auxiliaryTotalPrice: auxiliaryTotal,
    totalPrice: base.isGift === true ? 0 : mainTotal + auxiliaryTotal,
    updatedAt: getTimestamp(),
  };
  await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  return sales[index];
}

export async function deleteSale(id: string): Promise<boolean> {
  const sales = await getSales();
  const filtered = sales.filter((s) => s.id !== id);
  if (filtered.length === sales.length) return false;
  await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));
  const installments = await getInstallments();
  const filteredInstallments = installments.filter((i) => i.saleId !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(filteredInstallments));
  return true;
}

export async function getInstallments(): Promise<Installment[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveInstallments(installments: Installment[]): Promise<void> {
  const existing = await getInstallments();
  await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify([...existing, ...installments]));
}

export async function updateInstallment(id: string, updates: Partial<Installment>): Promise<Installment | null> {
  const installments = await getInstallments();
  const index = installments.findIndex((i) => i.id === id);
  if (index === -1) return null;
  installments[index] = { ...installments[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments));
  return installments[index];
}

export async function getAllData(): Promise<AppData> {
  const [patients, drugs, sales, installments, stockMovements, reminders] = await Promise.all([
    getPatients(),
    getDrugs(),
    getSales(),
    getInstallments(),
    getStockMovements(),
    getReminders(),
  ]);
  return { patients, drugs, sales, installments, stockMovements, reminders };
}

function mergeArraysById<T extends { id: string }>(existing: T[], incoming: T[]): { merged: T[]; newCount: number } {
  const existingIds = new Set(existing.map(item => item.id));
  const newItems = incoming.filter(item => !existingIds.has(item.id));
  return {
    merged: [...existing, ...newItems],
    newCount: newItems.length,
  };
}

export interface RestoreResult {
  newPatients: number;
  newDrugs: number;
  newSales: number;
  newInstallments: number;
  totalNew: number;
}

export async function restoreData(data: AppData): Promise<RestoreResult> {
  const [existingPatients, existingDrugs, existingSales, existingInstallments] = await Promise.all([
    getPatients(),
    getDrugs(),
    getSales(),
    getInstallments(),
  ]);

  const patientsResult = mergeArraysById(existingPatients, data.patients);
  const drugsResult = mergeArraysById(existingDrugs, data.drugs);
  const salesResult = mergeArraysById(existingSales, data.sales);
  const installmentsResult = mergeArraysById(existingInstallments, data.installments);

  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patientsResult.merged)),
    AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify(drugsResult.merged)),
    AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesResult.merged)),
    AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installmentsResult.merged)),
  ]);

  return {
    newPatients: patientsResult.newCount,
    newDrugs: drugsResult.newCount,
    newSales: salesResult.newCount,
    newInstallments: installmentsResult.newCount,
    totalNew: patientsResult.newCount + drugsResult.newCount + salesResult.newCount + installmentsResult.newCount,
  };
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.STOCK_MOVEMENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.REMINDERS),
    AsyncStorage.removeItem(STORAGE_KEYS.PATIENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.DRUGS),
    AsyncStorage.removeItem(STORAGE_KEYS.SALES),
    AsyncStorage.removeItem(STORAGE_KEYS.INSTALLMENTS),
  ]);
}

export type SearchResult =
  | {
      type: "patient";
      patient: Patient;
    }
  | {
      type: "sale";
      sale: Sale;
      patient?: Patient;
    };

// ─────────────────────────────────────────────────────────────
// Stock / inventory management
// ─────────────────────────────────────────────────────────────

export async function getStockMovements(): Promise<StockMovement[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function adjustDrugStock(
  drugId: string,
  delta: number,
  type: StockMovementType,
  note?: string
): Promise<void> {
  const drugs = await getDrugs();
  const index = drugs.findIndex((d) => d.id === drugId);
  if (index === -1) return;

  const current = drugs[index].stockQuantity ?? 0;
  const next = Math.max(0, current + delta);
  drugs[index] = { ...drugs[index], stockQuantity: next, updatedAt: getTimestamp() };
  await AsyncStorage.setItem(STORAGE_KEYS.DRUGS, JSON.stringify(drugs));

  const movements = await getStockMovements();
  movements.push({
    id: generateId(),
    drugId,
    type,
    quantity: delta,
    note,
    createdAt: getTimestamp(),
  });
  await AsyncStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
}

export async function getLowStockDrugs(): Promise<Drug[]> {
  const drugs = await getDrugs();
  return drugs.filter((d) => {
    const stock = d.stockQuantity ?? 0;
    const threshold = d.lowStockThreshold ?? 0;
    return threshold > 0 && stock <= threshold;
  });
}

export async function getDrugStockMovements(drugId: string): Promise<StockMovement[]> {
  const movements = await getStockMovements();
  return movements
    .filter((m) => m.drugId === drugId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─────────────────────────────────────────────────────────────
// Reminders / notifications
// ─────────────────────────────────────────────────────────────

export async function getReminders(): Promise<Reminder[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addReminder(
  reminder: Omit<Reminder, "id" | "createdAt" | "isDone">
): Promise<Reminder> {
  const reminders = await getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: generateId(),
    isDone: false,
    createdAt: getTimestamp(),
  };
  reminders.push(newReminder);
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return newReminder;
}

export async function updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
  const reminders = await getReminders();
  const index = reminders.findIndex((r) => r.id === id);
  if (index === -1) return null;
  reminders[index] = { ...reminders[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return reminders[index];
}

export async function deleteReminder(id: string): Promise<boolean> {
  const reminders = await getReminders();
  const filtered = reminders.filter((r) => r.id !== id);
  if (filtered.length === reminders.length) return false;
  await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
  return true;
}

export interface NotificationItem {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  dueDate: string;
  isOverdue: boolean;
  isDone: boolean;
  relatedId?: string;
}

/**
 * Builds a unified notification feed from installment due dates, low-stock
 * drugs, and any custom reminders the user created — so the Notifications
 * screen doesn't need separate lists for auto-generated vs manual items.
 */
export async function getNotificationFeed(): Promise<NotificationItem[]> {
  const [installments, sales, patients, lowStockDrugs, customReminders] = await Promise.all([
    getInstallments(),
    getSales(),
    getPatients(),
    getLowStockDrugs(),
    getReminders(),
  ]);

  const now = new Date();
  const items: NotificationItem[] = [];

  installments
    .filter((i) => i.status === "unpaid")
    .forEach((i) => {
      const sale = sales.find((s) => s.id === i.saleId);
      const patient = sale ? patients.find((p) => p.id === sale.patientId) : undefined;
      const name = patient ? `${patient.firstName} ${patient.lastName}` : "بیمار";
      items.push({
        id: `installment-${i.id}`,
        type: "installment",
        title: `قسط ${i.installmentNumber} - ${name}`,
        description: `مبلغ ${i.amount.toLocaleString("fa-IR")} تومان`,
        dueDate: i.dueDate,
        isOverdue: new Date(i.dueDate) < now,
        isDone: false,
        relatedId: i.saleId,
      });
    });

  lowStockDrugs.forEach((d) => {
    items.push({
      id: `lowstock-${d.id}`,
      type: "lowStock",
      title: `موجودی کم: ${d.name}`,
      description: `${d.stockQuantity ?? 0} ${d.unit} باقی‌مانده`,
      dueDate: now.toISOString(),
      isOverdue: (d.stockQuantity ?? 0) <= 0,
      isDone: false,
      relatedId: d.id,
    });
  });

  customReminders.forEach((r) => {
    items.push({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description ?? "",
      dueDate: r.dueDate,
      isOverdue: new Date(r.dueDate) < now && !r.isDone,
      isDone: r.isDone,
      relatedId: r.relatedId,
    });
  });

  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const [patients, sales] = await Promise.all([
    getPatients(),
    getSales(),
  ]);

  const results: SearchResult[] = [];

  // Patients
  patients.forEach(p => {
    if (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.nationalId?.includes(q)
    ) {
      results.push({
        type: "patient",
        patient: p,
      });
    }
  });

  // Sales
  sales.forEach(s => {
    if (
      s.totalPrice.toString().includes(q) ||
      s.bottleCount.toString().includes(q)
    ) {
      const patient = patients.find(p => p.id === s.patientId);
      results.push({
        type: "sale",
        sale: s,
        patient,
      });
    }
  });

  return results;
}
