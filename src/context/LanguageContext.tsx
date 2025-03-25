
import React, { createContext, useState, useContext, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/components/ui-custom/LanguageSelector';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

// Default translations
const translations: Record<string, Record<string, string>> = {
  'en-US': {
    'dashboard': 'Dashboard',
    'products': 'Products',
    'inventory': 'Inventory',
    'billing': 'Billing',
    'reports': 'Reports',
    'settings': 'Settings',
    'shop_finder': 'Shop Finder',
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'add_product': 'Add Product',
    'create_bill': 'Create Bill',
    'total_products': 'Total Products',
    'total_stock': 'Total Stock',
    'low_stock_items': 'Low Stock Items',
    'total_sales': 'Total Sales',
    'welcome': 'Welcome',
    'search': 'Search',
    'price': 'Price',
    'quantity': 'Quantity',
    'position': 'Position',
    'expiry': 'Expiry Date',
    'voice_command': 'Voice Command',
  },
  'hi-IN': {
    'dashboard': 'डैशबोर्ड',
    'products': 'उत्पाद',
    'inventory': 'इन्वेंटरी',
    'billing': 'बिलिंग',
    'reports': 'रिपोर्ट्स',
    'settings': 'सेटिंग्स',
    'shop_finder': 'दुकान खोजक',
    'login': 'लॉगिन',
    'register': 'रजिस्टर',
    'logout': 'लॉगआउट',
    'add_product': 'उत्पाद जोड़ें',
    'create_bill': 'बिल बनाएं',
    'total_products': 'कुल उत्पाद',
    'total_stock': 'कुल स्टॉक',
    'low_stock_items': 'कम स्टॉक आइटम',
    'total_sales': 'कुल बिक्री',
    'welcome': 'स्वागत है',
    'search': 'खोजें',
    'price': 'मूल्य',
    'quantity': 'मात्रा',
    'position': 'स्थिति',
    'expiry': 'समाप्ति तिथि',
    'voice_command': 'आवाज़ कमांड',
  },
};

// Fallback to English if translation is missing
const getTranslation = (lang: string, key: string): string => {
  if (translations[lang] && translations[lang][key]) {
    return translations[lang][key];
  }
  
  // Fallback to English
  return translations['en-US'][key] || key;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en-US',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    const savedLang = localStorage.getItem('app_language');
    return savedLang || 'en-US';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    
    // Also update HTML lang attribute for accessibility
    document.documentElement.lang = language.split('-')[0];
  }, [language]);

  const setLanguage = (code: string) => {
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === code)) {
      setLanguageState(code);
    }
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
