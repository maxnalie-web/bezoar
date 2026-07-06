export type PatientAttachmentType = "image" | "document";

export interface PatientAttachment {
  id: string;
  type: PatientAttachmentType;
  name: string;
  uri: string;
  addedAt: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  mainDisease: string;
  backgroundDiseases: string;
  medicalDescription: string;
  treatmentPlan: string;
  treatmentDuration: string;
  doctorNotes: string;
  attachments?: PatientAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Drug {
  id: string;
  name: string;
  code: string;
  type: string;
  purchasePrice: number;
  salePrice: number;
  unit: string;
  description: string;

  // Bezoar = داروی اصلی (قابل حذف نیست)
  isMain?: boolean;

  // مدیریت موجودی
  stockQuantity?: number;
  lowStockThreshold?: number;

  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "paid" | "installment" | "unpaid";

export interface AuxiliaryDrug {
  drugId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  patientId: string;

  // داروی اصلی (همیشه Bezoar)
  drugId: string;
  bottleCount: number;
  unitPrice: number;

  // داروهای جانبی (اختیاری)
  auxiliaryDrugs?: AuxiliaryDrug[];

  mainTotalPrice: number;      // مجموع داروی اصلی
  auxiliaryTotalPrice: number; // مجموع داروهای جانبی
  totalPrice: number;          // مجموع کل (اصلی + جانبی)

  // ✅ فروش هدیه
  isGift?: boolean;

  purchaseDate: string;
  deliveryDate: string;
  paymentStatus: PaymentStatus;
  installmentCount?: number;
  installmentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "paid" | "unpaid";
  createdAt: string;
}

export type StockMovementType = "in" | "out" | "adjustment" | "sale";

export interface StockMovement {
  id: string;
  drugId: string;
  type: StockMovementType;
  quantity: number;
  note?: string;
  createdAt: string;
}

export type ReminderType = "installment" | "lowStock" | "custom" | "followUp";

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description?: string;
  dueDate: string;
  isDone: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface AppData {
  patients: Patient[];
  drugs: Drug[];
  sales: Sale[];
  installments: Installment[];
  stockMovements?: StockMovement[];
  reminders?: Reminder[];
}

export interface DashboardStats {
  totalPatients: number;
  totalSales: number;
  totalDebt: number;
  totalBottlesSold: number;
  patientsWithDebt: number;
  monthlySales: number;
}
