import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { IconWrapper } from './ui/IconWrapper';

const ModeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => toggleDarkMode()}
      className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
      title={darkMode ? "Light Mode" : "Dark Mode"}
    >
      <div className="text-xl">
        {darkMode ? <IconWrapper icon="RiSunLine" /> : <IconWrapper icon="RiMoonLine" />}
      </div>
    </button>
  );
};

export default ModeToggle; 