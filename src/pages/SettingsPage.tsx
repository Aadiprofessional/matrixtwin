import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { availableLanguages } from '../contexts/LanguageContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as Ri from 'react-icons/ri';
import { Button } from '../components/ui/Button';

interface SettingsCategoryProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  active: boolean;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useTranslation();
  const { language, changeLanguage, languages } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('profile');

  // Stats for the settings page
  const settingsStats = {
    lastUpdated: '2 days ago',
    securityScore: 92,
    pendingUpdates: 3
  };

  const settingsCategories: SettingsCategoryProps[] = [
    {
      title: 'Profile Settings',
      icon: <Ri.RiUserSettingsLine />,
      description: 'Manage your profile, change password, and update personal information.',
      onClick: () => setActiveCategory('profile'),
      active: activeCategory === 'profile'
    },
    {
      title: 'Notifications',
      icon: <Ri.RiNotification3Line />,
      description: 'Configure which notifications you receive and how they are delivered.',
      onClick: () => setActiveCategory('notifications'),
      active: activeCategory === 'notifications'
    },
    {
      title: 'Appearance',
      icon: <Ri.RiPaintLine />,
      description: 'Customize the look and feel of your dashboard and interface.',
      onClick: () => setActiveCategory('appearance'),
      active: activeCategory === 'appearance'
    },
    {
      title: 'Language',
      icon: <Ri.RiTranslate2 />,
      description: 'Change the language used throughout the application.',
      onClick: () => setActiveCategory('language'),
      active: activeCategory === 'language'
    },
    {
      title: 'Accessibility',
      icon: <Ri.RiEyeLine />,
      description: 'Adjust settings to make the application more accessible.',
      onClick: () => setActiveCategory('accessibility'),
      active: activeCategory === 'accessibility'
    },
    {
      title: 'Privacy & Security',
      icon: <Ri.RiShieldLine />,
      description: 'Manage your privacy settings and security options.',
      onClick: () => setActiveCategory('privacy'),
      active: activeCategory === 'privacy'
    }
  ];

  // Layout animation for smooth transitions
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced header with gradient background */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-gray-900 via-slate-800 to-zinc-900">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute left-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M0,0 L100,0 Q70,50 100,100 L0,200 Z"
              fill="url(#settingsGradient)" 
              className="opacity-20"
              initial={{ x: -100 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="settingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
                  <Ri.RiSettings4Line className="mr-3 text-slate-300" />
                  {t('settings.title', 'Settings')}
                </h1>
                <p className="text-slate-300 mt-2 max-w-2xl">
                  Manage your account settings, preferences, and customize your experience
                </p>
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                leftIcon={<Ri.RiQuestionLine />}
              >
                Help
              </Button>
            </motion.div>
          </div>

          {/* Statistics Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-slate-500/20 rounded-full mr-4">
                <Ri.RiHistoryLine className="text-2xl text-slate-300" />
              </div>
              <div>
                <div className="text-sm text-slate-300">Last Updated</div>
                <div className="text-2xl font-bold text-white">{settingsStats.lastUpdated}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-slate-500/20 rounded-full mr-4">
                <Ri.RiShieldCheckLine className="text-2xl text-slate-300" />
              </div>
              <div>
                <div className="text-sm text-slate-300">Security Score</div>
                <div className="text-2xl font-bold text-white">{settingsStats.securityScore}%</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-slate-500/20 rounded-full mr-4">
                <Ri.RiApps2Line className="text-2xl text-slate-300" />
              </div>
              <div>
                <div className="text-sm text-slate-300">Pending Updates</div>
                <div className="text-2xl font-bold text-white">{settingsStats.pendingUpdates}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Categories */}
        <motion.div
          className="lg:col-span-1"
          variants={containerAnimation}
          initial="hidden"
          animate="show"
        >
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-secondary-900 dark:text-white px-2">
              Settings
            </h2>
            <div className="space-y-2">
              {settingsCategories.map((category, index) => (
                <motion.button
                  key={index}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors ${
                    category.active 
                      ? 'bg-primary-500/10 text-primary-500' 
                      : 'hover:bg-dark-800/50'
                  }`}
                  onClick={category.onClick}
                  variants={itemAnimation}
                >
                  <div className={`mr-3 text-xl ${category.active ? 'text-primary-500' : 'text-secondary-400'}`}>
                    {category.icon}
                  </div>
                  <div>
                    <div className="font-medium">{category.title}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      {category.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6">
            {activeCategory === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white">
                  Appearance Settings
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-secondary-700 dark:text-secondary-300">
                      Light / Dark
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                          !darkMode 
                            ? 'bg-primary-500/10 text-primary-500 font-medium' 
                            : 'text-secondary-600 dark:text-secondary-400 hover:bg-dark-800/50'
                        }`}
                        onClick={() => {
                          if (darkMode) toggleDarkMode();
                        }}
                      >
                        {!darkMode && (
                          <div className="mr-1">
                            <Ri.RiCheckLine />
                          </div>
                        )}
                        Light
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm flex items-center ${
                          darkMode 
                            ? 'bg-primary-500/10 text-primary-500 font-medium' 
                            : 'text-secondary-600 dark:text-secondary-400 hover:bg-dark-800/50'
                        }`}
                        onClick={() => {
                          if (!darkMode) toggleDarkMode();
                        }}
                      >
                        {darkMode && (
                          <div className="mr-1">
                            <Ri.RiCheckLine />
                          </div>
                        )}
                        Dark
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3 text-secondary-700 dark:text-secondary-300">
                      Accent Color
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['blue', 'purple', 'teal', 'green', 'red', 'orange'].map(color => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-full"
                          style={{ 
                            backgroundColor: 
                              color === 'blue' ? '#3b82f6' :
                              color === 'purple' ? '#8b5cf6' :
                              color === 'teal' ? '#14b8a6' :
                              color === 'green' ? '#22c55e' :
                              color === 'red' ? '#ef4444' :
                              '#f97316'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'language' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white">
                  Language Settings
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      className={`px-4 py-3 rounded-lg flex items-center ${
                        language === lang.code
                          ? 'bg-primary-500/10 text-primary-500 font-medium'
                          : 'hover:bg-secondary-100 dark:hover:bg-dark-800/50'
                      }`}
                      onClick={() => changeLanguage(lang.code)}
                    >
                      <div className="w-6 h-6 mr-3 flex-shrink-0">
                        <img 
                          src={lang.flag} 
                          alt={lang.name} 
                          className="w-full h-full object-cover rounded-sm"
                        />
                      </div>
                      <div>{lang.name}</div>
                      {language === lang.code && (
                        <div className="ml-auto">
                          <Ri.RiCheckLine />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white flex items-center">
                  <Ri.RiUserSettingsLine className="mr-2 text-primary-500" />
                  Profile Settings
                </h2>
                
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary-200 dark:bg-dark-700">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-4xl text-secondary-400">
                            <Ri.RiUserLine />
                          </div>
                        )}
                        <button className="absolute bottom-0 right-0 bg-primary-500 p-1.5 rounded-full text-white">
                          <Ri.RiPencilLine className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-grow space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            defaultValue={user?.name || ''}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            defaultValue={user?.email || ''}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            defaultValue={user?.role || ''}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                            defaultValue="+1 (123) 456-7890"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
                      defaultValue="Construction project manager with over 10 years of experience in commercial projects."
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="primary" leftIcon={<Ri.RiSaveLine />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white flex items-center">
                  <Ri.RiNotification3Line className="mr-2 text-primary-500" />
                  Notification Settings
                </h2>
                
                {/* Notification settings content */}
              </div>
            )}

            {activeCategory === 'accessibility' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white flex items-center">
                  <Ri.RiEyeLine className="mr-2 text-primary-500" />
                  Accessibility Settings
                </h2>
                
                {/* Accessibility settings content */}
              </div>
            )}

            {activeCategory === 'privacy' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 text-secondary-900 dark:text-white flex items-center">
                  <Ri.RiShieldLine className="mr-2 text-primary-500" />
                  Privacy & Security
                </h2>
                
                {/* Privacy settings content */}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage; 