import AsyncStorage from "@react-native-async-storage/async-storage";
import { Patient, Drug, Sale, Installment, AppData } from "@/types/models";

const STORAGE_KEYS = {
  PATIENTS: "@bezoar/patients",
  DRUGS: "@bezoar/drugs",
  SALES: "@bezoar/sales",
  INSTALLMENTS: "@bezoar/installments",
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

export async function saveSale(sale: Omit<Sale, "id" | "createdAt" | "updatedAt">): Promise<Sale> {
  const sales = await getSales();
  const newSale: Sale = {
    ...sale,
    id: generateId(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  };
  sales.push(newSale);
  await AsyncStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  
  if (sale.paymentStatus === "installment" && sale.installmentCount && sale.installmentAmount) {
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

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const sales = await getSales();
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) return null;
  sales[index] = { ...sales[index], ...updates, updatedAt: getTimestamp() };
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
  const [patients, drugs, sales, installments] = await Promise.all([
    getPatients(),
    getDrugs(),
    getSales(),
    getInstallments(),
  ]);
  return { patients, drugs, sales, installments };
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
    AsyncStorage.removeItem(STORAGE_KEYS.PATIENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.DRUGS),
    AsyncStorage.removeItem(STORAGE_KEYS.SALES),
    AsyncStorage.removeItem(STORAGE_KEYS.INSTALLMENTS),
  ]);
}
