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
  RiInformationLine,
  RiShieldUserLine,
  RiAddLine
} from 'react-icons/ri';
import { IconWrapper } from '../ui/IconWrapper';
import { useProjects } from '../../contexts/ProjectContext';
import UserAvatar from '../common/UserAvatar';
import { SearchInput } from '../common/SearchInput';
import Notifications from '../../components/Notifications';
import LanguageSelector from '../../components/LanguageSelector';
import ModeToggle from '../../components/ModeToggle';
import { notificationService, type Notification } from '../../services/notificationService';

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

export const Header: React.FC<HeaderProps> = ({ onQuickActionsToggle, onMenuToggle, isMobile, sidebarCollapsed }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { language, changeLanguage, languages } = useLanguage();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedProject } = useProjects();
  
  // Fetch notifications on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setNotificationsLoading(true);
      const response = await notificationService.getNotifications({
        limit: 20,
        page: 1
      });
      
      // Check if there are new notifications
      const newNotifications = response.notifications.filter(
        n => !notifications.find(existing => existing.id === n.id) && !n.read
      );
      
      if (newNotifications.length > 0) {
        setHasNewNotification(true);
        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(err => console.log('Audio play failed:', err));
        } catch (error) {
          console.log('Audio not available:', error);
        }
      }
      
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };
  
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
  
  // Add pulse animation when new notification arrives
  useEffect(() => {
    if (hasNewNotification) {
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [hasNewNotification]);
  
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read and navigate
    notificationService.handleNotificationClick(notification, navigate);
    markAsRead(notification.id);
    setShowNotifications(false);
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
      case 'info': return 'bg-portfolio-orange/10 border-l-4 border-portfolio-orange text-portfolio-orange';
      case 'warning': return 'bg-warning/10 border-l-4 border-warning text-warning';
      case 'success': return 'bg-success/10 border-l-4 border-success text-success';
      case 'error': return 'bg-error/10 border-l-4 border-error text-error';
      default: return 'bg-portfolio-orange/10 border-l-4 border-portfolio-orange text-portfolio-orange';
    }
  };

  const helpOptions = [
    { title: 'Documentation', icon: <IconWrapper icon="RiQuestionLine" />, url: "/help/docs" },
    { title: 'Contact Support', icon: <IconWrapper icon="RiContactsLine" />, url: "/help/support" },
    { title: 'Phone Support', icon: <IconWrapper icon="RiPhoneLine" />, content: "(852) 3907 3038" },
    { title: 'Email Support', icon: <IconWrapper icon="RiMailLine" />, content: "support@matrixtwin.com" }
  ];
  
  return (
    <header className={`fixed top-0 right-0 left-0 ${!isMobile ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''} h-20 bg-portfolio-dark/95 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between transition-all duration-300 ease-in-out`}>
      <div className="flex-1 flex items-center px-4 md:px-6">
        {/* Mobile menu toggle */}
        {isMobile && (
          <motion.button 
            onClick={onMenuToggle}
            className="mr-3 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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
            className="md:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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
                className="pl-10 pr-10 py-2 h-full w-full bg-white/5 border border-white/10 focus:border-portfolio-orange/50 rounded-full text-white shadow-inner focus:shadow-portfolio-orange/20 transition-all duration-300 placeholder-gray-500"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500">
                <motion.div 
                  animate={{ 
                    scale: isSearchFocused ? 1.1 : 1, 
                    color: isSearchFocused ? "#FF5722" : "#6b7280" 
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-portfolio-orange transition-colors"
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
          className="hidden sm:flex p-2 rounded-full bg-portfolio-orange/10 hover:bg-portfolio-orange/20 text-portfolio-orange hover:text-white transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="text-xl">
            <IconContext.Provider value={{ className: "text-xl" }}>
              <div><IconWrapper icon="RiApps2Line" /></div>
            </IconContext.Provider>
          </div>
        </motion.button>
        
        {/* Create Role Button - Only for Admin */}
        {user?.role === 'admin' && (
          <motion.button
            onClick={() => navigate('/create-role')}
            className="hidden sm:flex items-center px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors duration-200 border border-white/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Create New Role"
          >
            <IconContext.Provider value={{ className: "text-lg mr-2" }}>
              <div><RiShieldUserLine /></div>
            </IconContext.Provider>
            <span className="text-sm font-medium">Create Role</span>
          </motion.button>
        )}
        
        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHelpMenu(!showHelpMenu);
              setShowNotifications(false);
              setShowLanguageMenu(false);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
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
                  className="absolute right-0 mt-2 w-64 bg-[#121212] rounded-none shadow-2xl border border-white/10 z-30 overflow-hidden"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="p-3 border-b border-white/10">
                    <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400">Contact & Support</h3>
                  </div>
                  
                  <div className="p-2">
                    {helpOptions.map((option, index) => (
                      <div key={index} className="p-1">
                        {option.url ? (
                          <a 
                            href={option.url}
                            className="flex items-center px-3 py-2 text-white hover:bg-white/5 transition-colors"
                          >
                            <IconContext.Provider value={{ className: "mr-3 text-portfolio-orange text-lg" }}>
                              {option.icon}
                            </IconContext.Provider>
                            <span className="text-sm">{option.title}</span>
                          </a>
                        ) : (
                          <div className="flex items-center px-3 py-2 text-white">
                            <IconContext.Provider value={{ className: "mr-3 text-portfolio-orange text-lg" }}>
                              {option.icon}
                            </IconContext.Provider>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{option.title}</div>
                              <div className="text-white text-sm">{option.content}</div>
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
            className="p-2 rounded-full hover:bg-white/10 relative text-gray-400 hover:text-white transition-colors duration-200"
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
                className="absolute top-0 right-0 h-5 w-5 bg-portfolio-orange text-white text-xs rounded-full flex items-center justify-center"
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
                  className="absolute right-0 mt-2 w-80 bg-[#121212] rounded-none shadow-2xl border border-white/10 z-30 overflow-hidden"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="font-mono text-sm uppercase tracking-widest text-gray-400">Notifications</h3>
                    <div className="flex">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-portfolio-orange hover:text-portfolio-orange-hover mr-3 font-mono uppercase tracking-wider"
                      >
                        Mark read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-gray-500 hover:text-white font-mono uppercase tracking-wider"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto scrollbar-hide">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <motion.div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer ${
                            getNotificationClassName(notification.type)
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-sm text-white">{notification.title}</span>
                                <button 
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                  className="text-gray-500 hover:text-white ml-2 opacity-50 hover:opacity-100"
                                >
                                  <IconContext.Provider value={{ className: "text-base" }}>
                                    <div><IconWrapper icon="RiCloseLine" /></div>
                                  </IconContext.Provider>
                                </button>
                              </div>
                              <p className="text-sm mt-1 text-gray-400">{notification.message}</p>
                              <span className="text-xs mt-1 text-gray-600 font-mono">
                                {notificationService.formatRelativeTime(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 font-mono text-sm">
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
          className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
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
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
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
                  className="absolute right-0 mt-2 w-48 bg-[#121212] rounded-none shadow-2xl border border-white/10 z-30 overflow-hidden"
                  variants={dropdownAnimation}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      className={`w-full text-left px-4 py-3 flex items-center hover:bg-white/5 transition-colors ${
                        language === lang.code ? 'bg-white/5 text-portfolio-orange' : 'text-gray-300'
                      }`}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setShowLanguageMenu(false);
                      }}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <span className="mr-3 text-lg">{lang.flag}</span>
                      <span className="font-mono text-sm">{lang.name}</span>
                      {language === lang.code && (
                        <motion.div 
                          className="w-1.5 h-1.5 rounded-full bg-portfolio-orange ml-auto"
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