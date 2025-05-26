import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  // Find current language
  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
        onClick={toggleDropdown}
      >
        <span className="text-lg mr-1">{currentLanguage?.flag}</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`w-full text-left px-4 py-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  language === lang.code ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
                onClick={() => handleLanguageChange(lang.code)}
              >
                <span className="mr-2 text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector; 