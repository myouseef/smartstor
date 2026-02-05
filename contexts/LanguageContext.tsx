import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

type Language = 'en' | 'ar';

interface Translations {
  dashboard: string;
  products: string;
  leads: string;
  aiTools: string;
  settings: string;
  totalProducts: string;
  totalLeads: string;
  conversion: string;
  visits: string;
  recentLeads: string;
  viewAll: string;
  addProduct: string;
  addLead: string;
  editProduct: string;
  editLead: string;
  delete: string;
  save: string;
  cancel: string;
  name: string;
  price: string;
  description: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  notes: string;
  offer: string;
  active: string;
  inactive: string;
  new: string;
  contacted: string;
  qualified: string;
  converted: string;
  lost: string;
  landingPage: string;
  whatsapp: string;
  socialMedia: string;
  referral: string;
  generateDescription: string;
  generateAdCopy: string;
  suggestPrice: string;
  campaignIdeas: string;
  language: string;
  english: string;
  arabic: string;
  productName: string;
  targetAudience: string;
  generate: string;
  generating: string;
  result: string;
  noProducts: string;
  noLeads: string;
  messageOnWhatsApp: string;
  welcome: string;
  marketingPlatform: string;
  category: string;
  originalPrice: string;
  contactLead: string;
  search: string;
  filter: string;
  all: string;
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: 'Dashboard',
    products: 'Products',
    leads: 'Leads',
    aiTools: 'AI Tools',
    settings: 'Settings',
    totalProducts: 'Total Products',
    totalLeads: 'Total Leads',
    conversion: 'Conversion',
    visits: 'Visits',
    recentLeads: 'Recent Leads',
    viewAll: 'View All',
    addProduct: 'Add Product',
    addLead: 'Add Lead',
    editProduct: 'Edit Product',
    editLead: 'Edit Lead',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    name: 'Name',
    price: 'Price',
    description: 'Description',
    phone: 'Phone',
    email: 'Email',
    status: 'Status',
    source: 'Source',
    notes: 'Notes',
    offer: 'Offer',
    active: 'Active',
    inactive: 'Inactive',
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    converted: 'Converted',
    lost: 'Lost',
    landingPage: 'Landing Page',
    whatsapp: 'WhatsApp',
    socialMedia: 'Social Media',
    referral: 'Referral',
    generateDescription: 'Generate Description',
    generateAdCopy: 'Generate Ad Copy',
    suggestPrice: 'Suggest Price',
    campaignIdeas: 'Campaign Ideas',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    productName: 'Product Name',
    targetAudience: 'Target Audience',
    generate: 'Generate',
    generating: 'Generating...',
    result: 'Result',
    noProducts: 'No products yet',
    noLeads: 'No leads yet',
    messageOnWhatsApp: 'Message on WhatsApp',
    welcome: 'Welcome to TagerPro',
    marketingPlatform: 'Your Marketing Platform',
    category: 'Category',
    originalPrice: 'Original Price',
    contactLead: 'Contact Lead',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    products: 'المنتجات',
    leads: 'العملاء المحتملين',
    aiTools: 'أدوات الذكاء',
    settings: 'الإعدادات',
    totalProducts: 'إجمالي المنتجات',
    totalLeads: 'إجمالي العملاء',
    conversion: 'التحويل',
    visits: 'الزيارات',
    recentLeads: 'العملاء الجدد',
    viewAll: 'عرض الكل',
    addProduct: 'إضافة منتج',
    addLead: 'إضافة عميل',
    editProduct: 'تعديل المنتج',
    editLead: 'تعديل العميل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    name: 'الاسم',
    price: 'السعر',
    description: 'الوصف',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    status: 'الحالة',
    source: 'المصدر',
    notes: 'ملاحظات',
    offer: 'العرض',
    active: 'نشط',
    inactive: 'غير نشط',
    new: 'جديد',
    contacted: 'تم التواصل',
    qualified: 'مؤهل',
    converted: 'محول',
    lost: 'خسارة',
    landingPage: 'صفحة الهبوط',
    whatsapp: 'واتساب',
    socialMedia: 'وسائل التواصل',
    referral: 'إحالة',
    generateDescription: 'إنشاء وصف',
    generateAdCopy: 'إنشاء نص إعلاني',
    suggestPrice: 'اقتراح السعر',
    campaignIdeas: 'أفكار الحملات',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    productName: 'اسم المنتج',
    targetAudience: 'الجمهور المستهدف',
    generate: 'إنشاء',
    generating: 'جاري الإنشاء...',
    result: 'النتيجة',
    noProducts: 'لا توجد منتجات بعد',
    noLeads: 'لا يوجد عملاء بعد',
    messageOnWhatsApp: 'مراسلة على واتساب',
    welcome: 'مرحباً بك في تاجر برو',
    marketingPlatform: 'منصتك التسويقية',
    category: 'الفئة',
    originalPrice: 'السعر الأصلي',
    contactLead: 'تواصل مع العميل',
    search: 'بحث',
    filter: 'تصفية',
    all: 'الكل',
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('language').then((saved) => {
      if (saved === 'ar' || saved === 'en') {
        setLanguageState(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language],
    isRTL: language === 'ar',
  }), [language]);

  if (!isLoaded) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
