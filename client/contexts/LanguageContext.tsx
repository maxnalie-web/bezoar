import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

type Language = "fa" | "en";

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "@bezoar_language";

const translations: Record<Language, Record<string, string>> = {
  fa: {
    appName: "بزوار",
    dashboard: "داشبورد",
    patients: "بیماران",
    drugs: "داروها",
    sales: "فروش",
    reports: "گزارشات",
    backup: "پشتیبان‌گیری",
    settings: "تنظیمات",
    addPatient: "افزودن بیمار",
    editPatient: "ویرایش بیمار",
    addDrug: "افزودن دارو",
    editDrug: "ویرایش دارو",
    newSale: "فروش جدید",
    editSale: "ویرایش فروش",
    totalPatients: "کل بیماران",
    bottlesSold: "بطری فروخته شده",
    totalSales: "کل فروش",
    debtBalance: "مانده بدهی",
    patientsWithDebt: "بیماران بدهکار",
    monthlySales: "فروش ماهانه",
    recentPatients: "بیماران اخیر",
    recentSales: "فروش اخیر",
    noPatients: "هیچ بیماری یافت نشد",
    noDrugs: "هیچ دارویی یافت نشد",
    noSales: "هیچ فروشی یافت نشد",
    noData: "داده‌ای یافت نشد",
    save: "ذخیره",
    cancel: "لغو",
    delete: "حذف",
    edit: "ویرایش",
    search: "جستجو",
    filter: "فیلتر",
    all: "همه",
    paid: "پرداخت شده",
    unpaid: "پرداخت نشده",
    installment: "قسطی",
    firstName: "نام",
    lastName: "نام خانوادگی",
    nationalId: "کد ملی",
    phone: "تلفن",
    address: "آدرس",
    dateOfBirth: "تاریخ تولد",
    gender: "جنسیت",
    male: "مرد",
    female: "زن",
    other: "سایر",
    mainDisease: "بیماری اصلی",
    backgroundDiseases: "بیماری‌های زمینه‌ای",
    medicalDescription: "شرح پزشکی",
    treatmentPlan: "برنامه درمان",
    treatmentDuration: "مدت درمان",
    doctorNotes: "یادداشت‌های پزشک",
    identityInformation: "اطلاعات هویتی",
    medicalInformation: "اطلاعات پزشکی",
    drugName: "نام دارو",
    drugCode: "کد دارو",
    drugType: "نوع دارو",
    purchasePrice: "قیمت خرید",
    salePrice: "قیمت فروش",
    unit: "واحد",
    bottle: "بطری",
    box: "جعبه",
    pack: "بسته",
    selectPatient: "انتخاب بیمار",
    selectDrug: "انتخاب دارو",
    bottleCount: "تعداد بطری",
    pricePerBottle: "قیمت هر بطری",
    totalPrice: "قیمت کل",
    paymentStatus: "وضعیت پرداخت",
    purchaseDate: "تاریخ خرید",
    notes: "یادداشت‌ها",
    installments: "اقساط",
    addInstallment: "افزودن قسط",
    amount: "مبلغ",
    dueDate: "تاریخ سررسید",
    status: "وضعیت",
    createBackup: "ایجاد پشتیبان",
    restoreBackup: "بازیابی پشتیبان",
    exportToFile: "خروجی به فایل",
    importFromFile: "ورودی از فایل",
    backupCreated: "پشتیبان ایجاد شد",
    backupRestored: "پشتیبان بازیابی شد",
    theme: "پوسته",
    language: "زبان",
    darkMode: "حالت تاریک",
    lightMode: "حالت روشن",
    persian: "فارسی",
    english: "انگلیسی",
    error: "خطا",
    success: "موفق",
    warning: "هشدار",
    confirm: "تأیید",
    updatePatient: "بروزرسانی بیمار",
    updateDrug: "بروزرسانی دارو",
    updateSale: "بروزرسانی فروش",
    loading: "در حال بارگذاری...",
    noResults: "نتیجه‌ای یافت نشد",
    required: "الزامی",
    invalid: "نامعتبر",
    bottles: "بطری",
    toman: "تومان",
    monthly: "ماهانه",
    weekly: "هفتگی",
    daily: "روزانه",
    viewAll: "مشاهده همه",
    statistics: "آمار",
    salesChart: "نمودار فروش",
    noChartData: "داده‌ای برای نمایش وجود ندارد",
    appearance: "ظاهر",
    general: "عمومی",
    about: "درباره",
    version: "نسخه",
    dataManagement: "مدیریت داده",
    clearAllData: "پاک کردن همه داده‌ها",
    areYouSure: "آیا مطمئن هستید؟",
    thisCannotBeUndone: "این عمل قابل بازگشت نیست",
  },
  en: {
    appName: "Bezoar",
    dashboard: "Dashboard",
    patients: "Patients",
    drugs: "Drugs",
    sales: "Sales",
    reports: "Reports",
    backup: "Backup",
    settings: "Settings",
    addPatient: "Add Patient",
    editPatient: "Edit Patient",
    addDrug: "Add Drug",
    editDrug: "Edit Drug",
    newSale: "New Sale",
    editSale: "Edit Sale",
    totalPatients: "Total Patients",
    bottlesSold: "Bottles Sold",
    totalSales: "Total Sales",
    debtBalance: "Debt Balance",
    patientsWithDebt: "Patients with Debt",
    monthlySales: "Monthly Sales",
    recentPatients: "Recent Patients",
    recentSales: "Recent Sales",
    noPatients: "No patients found",
    noDrugs: "No drugs found",
    noSales: "No sales found",
    noData: "No data found",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    filter: "Filter",
    all: "All",
    paid: "Paid",
    unpaid: "Unpaid",
    installment: "Installment",
    firstName: "First Name",
    lastName: "Last Name",
    nationalId: "National ID",
    phone: "Phone",
    address: "Address",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    mainDisease: "Main Disease",
    backgroundDiseases: "Background Diseases",
    medicalDescription: "Medical Description",
    treatmentPlan: "Treatment Plan",
    treatmentDuration: "Treatment Duration",
    doctorNotes: "Doctor Notes",
    identityInformation: "Identity Information",
    medicalInformation: "Medical Information",
    drugName: "Drug Name",
    drugCode: "Drug Code",
    drugType: "Drug Type",
    purchasePrice: "Purchase Price",
    salePrice: "Sale Price",
    unit: "Unit",
    bottle: "Bottle",
    box: "Box",
    pack: "Pack",
    selectPatient: "Select Patient",
    selectDrug: "Select Drug",
    bottleCount: "Bottle Count",
    pricePerBottle: "Price per Bottle",
    totalPrice: "Total Price",
    paymentStatus: "Payment Status",
    purchaseDate: "Purchase Date",
    notes: "Notes",
    installments: "Installments",
    addInstallment: "Add Installment",
    amount: "Amount",
    dueDate: "Due Date",
    status: "Status",
    createBackup: "Create Backup",
    restoreBackup: "Restore Backup",
    exportToFile: "Export to File",
    importFromFile: "Import from File",
    backupCreated: "Backup created",
    backupRestored: "Backup restored",
    theme: "Theme",
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    persian: "Persian",
    english: "English",
    error: "Error",
    success: "Success",
    warning: "Warning",
    confirm: "Confirm",
    updatePatient: "Update Patient",
    updateDrug: "Update Drug",
    updateSale: "Update Sale",
    loading: "Loading...",
    noResults: "No results found",
    required: "Required",
    invalid: "Invalid",
    bottles: "bottles",
    toman: "T",
    monthly: "Monthly",
    weekly: "Weekly",
    daily: "Daily",
    viewAll: "View All",
    statistics: "Statistics",
    salesChart: "Sales Chart",
    noChartData: "No chart data available",
    appearance: "Appearance",
    general: "General",
    about: "About",
    version: "Version",
    dataManagement: "Data Management",
    clearAllData: "Clear All Data",
    areYouSure: "Are you sure?",
    thisCannotBeUndone: "This cannot be undone",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fa");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.log("Failed to load language preference");
    }
    setIsLoaded(true);
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      const isRTL = lang === "fa";
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        I18nManager.allowRTL(isRTL);
      }
    } catch (error) {
      console.log("Failed to save language preference");
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL: language === "fa",
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
