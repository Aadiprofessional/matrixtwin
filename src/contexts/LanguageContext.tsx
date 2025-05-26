import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';

// Define language options
export type Language = {
  code: string;
  name: string;
  flag: string;
};

// Available languages in the app
export const availableLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

// Define language context types
type LanguageContextType = {
  language: string;
  changeLanguage: (lang: string) => void;
  languages: Language[];
};

// Create the context with defaults
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {},
  languages: availableLanguages,
});

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage); // Also update i18n language on mount
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Set HTML language attribute for accessibility
    document.documentElement.lang = lang;
    // Change the i18n language
    i18n.changeLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, languages: availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}; 