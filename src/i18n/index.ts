import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translations
import enTranslation from './locales/en.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import zhTranslation from './locales/zh.json';
import arTranslation from './locales/ar.json';

// Translation resources
const resources = {
  en: {
    translation: enTranslation
  },
  es: {
    translation: esTranslation
  },
  fr: {
    translation: frTranslation
  },
  zh: {
    translation: zhTranslation
  },
  ar: {
    translation: arTranslation
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n; 