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
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "paid" | "installment" | "unpaid";

export interface Sale {
  id: string;
  patientId: string;
  drugId: string;
  bottleCount: number;
  unitPrice: number;
  totalPrice: number;
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

export interface AppData {
  patients: Patient[];
  drugs: Drug[];
  sales: Sale[];
  installments: Installment[];
}

export interface DashboardStats {
  totalPatients: number;
  totalSales: number;
  totalDebt: number;
  totalBottlesSold: number;
  patientsWithDebt: number;
  monthlySales: number;
}
