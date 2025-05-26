import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { IconContext } from 'react-icons';
import { 
  RiSearchLine,
  RiArrowRightLine,
  RiNotification3Line,
  RiCloseLine,
  RiSunLine,
  RiMoonLine,
  RiTranslate2,
  RiUserSettingsLine,
  RiUserStarLine,
  RiLogoutBoxRLine,
  RiQuestionLine,
  RiGlobalLine,
  RiBellLine,
  RiContactsLine,
  RiPhoneLine,
  RiMailLine,
  RiApps2Line,
  RiMenuLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiInformationLine
} from 'react-icons/ri';
import { IconWrapper } from '../ui/IconWrapper';
import { useProjects } from '../../contexts/ProjectContext';
import UserAvatar from '../common/UserAvatar';
import { SearchInput } from '../common/SearchInput';
import Notifications from '../../components/Notifications';
import LanguageSelector from '../../components/LanguageSelector';
import ModeToggle from '../../components/ModeToggle';

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface HeaderProps {
  onQuickActionsToggle?: () => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
}

// Mock notifications
const initialNotifications: NotificationProps[] = [
  {
    id: '1',
    title: 'New Inspection Report',
    message: 'Safety inspection report for Project Alpha has been submitted',
    time: '10 mins ago',
    read: false,
    type: 'info'
  },
  {
    id: '2',
    title: 'Approval Required',
    message: 'RFI #2458 needs your approval',
    time: '1 hour ago',
    read: false,
    type: 'warning'
  },
  {
    id: '3',
    title: 'Task Completed',
    message: 'Daily cleaning record has been verified',
    time: '3 hours ago',
    read: true,
    type: 'success'
  }
];

export const Header: React.FC<HeaderProps> = ({ onQuickActionsToggle, onMenuToggle, isMobile, sidebarCollapsed }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, changeLanguage, languages } = useLanguage();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedProject } = useProjects();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  useEffect(() => {
    // Simulate receiving a new notification after 60 seconds
    const timer = setTimeout(() => {
      const newNotification: NotificationProps = {
        id: String(Date.now()),
        title: 'New Project Assignment',
        message: 'You have been assigned to Corporate HQ project',
        time: 'Just now',
        read: false,
        type: 'info'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setHasNewNotification(true);
      
      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(err => console.log('Audio play failed:', err));
    }, 60000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Add pulse animation when new notification arrives
  useEffect(() => {
    if (hasNewNotification) {
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [hasNewNotification]);
  
  // Handle window resize for responsive search
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSearchVisible(true);
        if (!isSearchFocused) {
          setIsSearchExpanded(false);
        }
      } else {
        setIsSearchVisible(isSearchFocused);
        setIsSearchExpanded(isSearchFocused);
      }
    };
    
    // Initial setup
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSearchFocused]);
  
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  const closeAllMenus = () => {
    setShowNotifications(false);
    setShowLanguageMenu(false);
    setShowProfileMenu(false);
    setShowHelpMenu(false);
  };
  
  const toggleSearch = () => {
    if (window.innerWidth < 768) {
      setIsSearchVisible(!isSearchVisible);
      setIsSearchFocused(!isSearchVisible);
      setTimeout(() => {
        if (searchRef.current && !isSearchVisible) {
          searchRef.current.focus();
        }
      }, 100);
    }
  };
  
  const focusSearch = () => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
    setIsSearchFocused(true);
    setIsSearchExpanded(true);
  };
  
  const dropdownAnimation = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Replace with actual search functionality
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    setIsSearchFocused(false);
    if (window.innerWidth < 768) {
      setIsSearchVisible(false);
    }
  };
  
  // Filter notifications based on the type
  const getNotificationClassName = (type: string) => {
    switch (type) {
      case 'info': return 'bg-ai-blue/10 border-l-4 border-ai-blue text-ai-blue';
      case 'warning': return 'bg-warning/10 border-l-4 border-warning text-warning';
      case 'success': return 'bg-success/10 border-l-4 border-success text-success';
      case 'error': return 'bg-error/10 border-l-4 border-error text-error';
      default: return 'bg-ai-blue/10 border-l-4 border-ai-blue text-ai-blue';
    }
  };

  const helpOptions = [
    { title: 'Documentation', icon: <IconWrapper icon="RiQuestionLine" />, url: "/help/docs" },
    { title: 'Contact Support', icon: <IconWrapper icon="RiContactsLine" />, url: "/help/support" },
    { title: 'Phone Support', icon: <IconWrapper icon="RiPhoneLine" />, content: "(852) 3907 3038" },
    { title: 'Email Support', icon: <IconWrapper icon="RiMailLine" />, content: "support@matrixtwin.com" }
  ];
  
  return (
    <header className={`fixed top-0 right-0 left-0 ${!isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''} h-16 bg-gradient-to-r from-dark-950 to-dark-900 backdrop-blur-sm bg-opacity-80 shadow-lg shadow-dark-950/20 z-50 flex items-center justify-between transition-all duration-300 ease-in-out`}>
      <div className="flex-1 flex items-center px-4 md:px-6">
        {/* Mobile menu toggle */}
        {isMobile && (
          <motion.button 
            onClick={onMenuToggle}
            className="mr-3 p-2 rounded-full bg-dark-800/50 hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconContext.Provider value={{ className: "text-xl" }}>
              <div><IconWrapper icon="RiMenuLine" /></div>
            </IconContext.Provider>
          </motion.button>
        )}
        
        {/* Search icon for mobile */}
        {!isSearchVisible && (
          <motion.button
            onClick={toggleSearch}
            className="md:hidden p-2 rounded-full bg-dark-800/50 hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.65 }}
          >
            <IconContext.Provider value={{ className: "text-xl" }}>
              <div><IconWrapper icon="RiSearchLine" /></div>
            </IconContext.Provider>
          </motion.button>
        )}
        
        {/* Container for search with max width */}
        <div className="flex-1 max-w-[60%]">
          {/* Search Bar with Expanded State */}
          {isSearchVisible && (
            <motion.form 
              onSubmit={handleSearch} 
              className="relative w-full"
              style={{
                maxWidth: window.innerWidth >= 768 ? (isSearchExpanded ? "100%" : 
                  sidebarCollapsed ? '350px' : '300px') : undefined
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ 
                width: "100%",
                opacity: 1
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  setIsSearchExpanded(true);
                }}
                onBlur={() => {
                  setIsSearchFocused(false);
                  if (window.innerWidth < 768 && !searchQuery) {
                    setTimeout(() => setIsSearchVisible(false), 200);
                  }
                  if (window.innerWidth >= 768 && !searchQuery) {
                    setTimeout(() => setIsSearchExpanded(false), 200);
                  }
                }}
                className="input-ai pl-10 pr-10 py-2 h-full w-full bg-dark-800/50 border border-dark-700 focus:border-ai-blue/50 rounded-full text-white shadow-inner shadow-dark-950/30 focus:shadow-ai-blue/20 transition-all duration-300"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <motion.div 
                  animate={{ 
                    scale: isSearchFocused ? 1.1 : 1, 
                    color: isSearchFocused ? "#3f87ff" : "#6b7280" 
                  }}
                >
                  <IconContext.Provider value={{ className: "text-xl" }}>
                    <IconWrapper icon="RiSearchLine" />
                  </IconContext.Provider>
                </motion.div>
              </div>
              {isSearchVisible && window.innerWidth < 768 && (
                <motion.button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchVisible(false);
                  }}
                >
                  <IconContext.Provider value={{ className: "text-xl" }}>
                    <IconWrapper icon="RiCloseLine" />
                  </IconContext.Provider>
                </motion.button>
              )}
              {isSearchVisible && window.innerWidth >= 768 && searchQuery && (
                <motion.button 
                  type="submit" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-ai-blue transition-colors"
                  animate={{ 
                    opacity: searchQuery ? 1 : 0,
                    scale: searchQuery ? 1 : 0.8,
                  }}
                >
                  <IconContext.Provider value={{ className: "text-base" }}>
                    <IconWrapper icon="RiArrowRightLine" />
                  </IconContext.Provider>
                </motion.button>
              )}
            </motion.form>
          )}
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-6">
        {/* Quick Actions Button - Hide on small screens */}
        <motion.button
          onClick={onQuickActionsToggle}
          className="hidden sm:flex p-2 rounded-full bg-ai-blue/20 hover:bg-ai-blue/30 text-ai-blue hover:text-white transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="text-xl">
            <IconContext.Provider value={{ className: "text-xl" }}>
              <div><IconWrapper icon="RiApps2Line" /></div>
            </IconContext.Provider>
          </div>
        </motion.button>
        
        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelpMenu(!showHelpMenu);
              setShowNotifications(false);
              setShowLanguageMenu(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-full hover:bg-dark-800/70 text-gray-300 hover:text-white transition-colors duration-200"
          >
            <div className="text-xl">
              <IconContext.Provider value={{ className: "text-xl" }}>
                <div><IconWrapper icon="RiGlobalLine" /></div>
              </IconContext.Provider>
            </div>
          </button>
          
          <AnimatePresence>
            {showHelpMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={closeAllMenus} />
                <motion.div
                  className="absolute right-0 mt-2 w-64 bg-dark-900/95 rounded-xl shadow-ai-glow border border-ai-blue/20 z-30 overflow-hidden backdrop-blur-sm"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="p-3 border-b border-dark-700">
                    <h3 className="font-medium text-white">Contact & Support</h3>
                  </div>
                  
                  <div className="p-2">
                    {helpOptions.map((option, index) => (
                      <div key={index} className="p-2">
                        {option.url ? (
                          <a 
                            href={option.url}
                            className="flex items-center px-3 py-2 rounded-lg text-white hover:bg-dark-800/80 transition-colors"
                          >
                            <IconContext.Provider value={{ className: "mr-3 text-ai-blue text-lg" }}>
                              {option.icon}
                            </IconContext.Provider>
                            {option.title}
                          </a>
                        ) : (
                          <div className="flex items-center px-3 py-2 rounded-lg text-white">
                            <IconContext.Provider value={{ className: "mr-3 text-ai-blue text-lg" }}>
                              {option.icon}
                            </IconContext.Provider>
                            <div>
                              <div className="text-sm text-gray-400">{option.title}</div>
                              <div className="text-white">{option.content}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <motion.button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowLanguageMenu(false);
              setShowHelpMenu(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-full hover:bg-dark-800/70 relative text-gray-300 hover:text-white transition-colors duration-200"
            animate={hasNewNotification ? { 
              scale: [1, 1.15, 1], 
              transition: { duration: 1, repeat: 3, repeatType: "reverse" } 
            } : {}}
          >
            <div className="text-xl">
              <IconContext.Provider value={{ className: "text-xl" }}>
                <div><IconWrapper icon="RiBellLine" /></div>
              </IconContext.Provider>
            </div>
            {unreadCount > 0 && (
              <motion.span 
                className="absolute top-0 right-0 h-5 w-5 bg-error text-white text-xs rounded-full flex items-center justify-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-20" onClick={closeAllMenus} />
                <motion.div
                  className="absolute right-0 mt-2 w-80 bg-dark-900/95 rounded-xl shadow-ai-glow border border-ai-blue/20 z-30 overflow-hidden backdrop-blur-sm"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                    <h3 className="font-medium text-white">Notifications</h3>
                    <div className="flex">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-ai-blue hover:text-ai-blue/80 mr-3"
                      >
                        Mark all as read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-error hover:text-error/80"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto scrollbar-hide">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <motion.div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-dark-800 hover:bg-dark-800/50 cursor-pointer ${
                            getNotificationClassName(notification.type)
                          }`}
                          onClick={() => markAsRead(notification.id)}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-sm">{notification.title}</span>
                                <button 
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                  className="text-gray-500 hover:text-gray-300 ml-2 opacity-50 hover:opacity-100"
                                >
                                  <IconContext.Provider value={{ className: "text-base" }}>
                                    <div><IconWrapper icon="RiCloseLine" /></div>
                                  </IconContext.Provider>
                                </button>
                              </div>
                              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                              <span className="text-xs mt-1 opacity-70">{notification.time}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Theme Toggle */}
        <motion.button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-dark-800/70 text-gray-300 hover:text-white transition-colors duration-200"
          whileTap={{ scale: 0.95 }}
        >
          <div className="text-xl">
            <IconContext.Provider value={{ className: "text-xl" }}>
              {darkMode ? <div><IconWrapper icon="RiSunLine" /></div> : <div><IconWrapper icon="RiMoonLine" /></div>}
            </IconContext.Provider>
          </div>
        </motion.button>
        
        {/* Language Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLanguageMenu(!showLanguageMenu);
              setShowNotifications(false);
              setShowHelpMenu(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-full hover:bg-dark-800/70 text-gray-300 hover:text-white transition-colors duration-200"
          >
            <div className="text-xl">
              <IconContext.Provider value={{ className: "text-xl" }}>
                <div><IconWrapper icon="RiTranslate2" /></div>
              </IconContext.Provider>
            </div>
          </button>
          
          <AnimatePresence>
            {showLanguageMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={closeAllMenus} />
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-dark-900/95 rounded-xl shadow-ai-glow border border-ai-blue/20 z-30 overflow-hidden backdrop-blur-sm"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      className={`w-full text-left px-4 py-2 flex items-center hover:bg-dark-800/80 transition-colors ${
                        language === lang.code ? 'bg-dark-800/80 text-ai-blue' : 'text-white'
                      }`}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <span className="mr-3 text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && (
                        <motion.div 
                          className="w-1.5 h-1.5 rounded-full bg-ai-blue ml-auto"
                          layoutId="activeLang" 
                        />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile Menu */}
        <div className="relative ml-2">
          <motion.button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowLanguageMenu(false);
              setShowHelpMenu(false);
            }}
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ai-blue via-purple-600 to-ai-purple flex items-center justify-center text-white font-medium text-sm border-2 border-dark-800">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </motion.button>
          
          <AnimatePresence>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={closeAllMenus} />
                <motion.div
                  className="absolute right-0 mt-2 w-56 bg-dark-900/95 rounded-xl shadow-ai-glow border border-ai-blue/20 z-30 overflow-hidden backdrop-blur-sm"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="p-4 border-b border-dark-800">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ai-blue via-purple-600 to-ai-purple flex items-center justify-center text-white font-medium text-sm mr-3">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user?.name || 'User'}</div>
                        <div className="text-sm text-gray-400">{user?.email || ''}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-ai-blue/20 text-ai-blue inline-block">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <motion.button
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center text-white hover:bg-dark-800/80"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      whileHover={{ x: 5 }}
                    >
                      <IconContext.Provider value={{ className: "mr-3 text-ai-blue text-lg" }}>
                        <div><IconWrapper icon="RiUserSettingsLine" /></div>
                      </IconContext.Provider>
                      Profile Settings
                    </motion.button>
                    
                    <motion.button
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center text-white hover:bg-dark-800/80"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/activity');
                      }}
                      whileHover={{ x: 5 }}
                    >
                      <IconContext.Provider value={{ className: "mr-3 text-ai-blue text-lg" }}>
                        <div><IconWrapper icon="RiUserStarLine" /></div>
                      </IconContext.Provider>
                      Your Activity
                    </motion.button>
                    
                    <div className="mt-2 pt-2 border-t border-dark-800">
                      <motion.button
                        className="w-full text-left px-3 py-2 rounded-lg flex items-center text-error hover:bg-dark-800/80"
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        whileHover={{ x: 5 }}
                      >
                        <IconContext.Provider value={{ className: "mr-3 text-error text-lg" }}>
                          <div><IconWrapper icon="RiLogoutBoxRLine" /></div>
                        </IconContext.Provider>
                        Logout
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}; 