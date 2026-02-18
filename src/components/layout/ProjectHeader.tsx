import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { IconContext } from 'react-icons';
import * as RiIcons from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { IconWrapper } from '../ui/IconWrapper';

interface ProjectHeaderProps {
  onQuickActionsToggle?: () => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
  sidebarCollapsed?: boolean;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  onQuickActionsToggle, 
  onMenuToggle, 
  isMobile, 
  sidebarCollapsed 
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const closeAllMenus = () => {
    setShowProfileMenu(false);
  };
  
  const dropdownAnimation = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-portfolio-dark/80 backdrop-blur-md border-b border-white/5 z-50 w-full transition-all duration-300">
      <div className="flex items-center justify-between h-full w-full px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex-1 flex items-center">
          {/* Mobile menu toggle */}
          {isMobile && (
            <motion.button 
              onClick={onMenuToggle}
              className="mr-3 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconContext.Provider value={{ className: "text-xl" }}>
                <div><RiIcons.RiMenuLine /></div>
              </IconContext.Provider>
            </motion.button>
          )}
          
          {/* Logo and title */}
          <Link to="/" className="flex items-center group">
            <div className="flex items-center">
              <div className="mr-3 text-3xl text-portfolio-orange group-hover:scale-110 transition-transform duration-300">
                <RiIcons.RiBuilding2Fill />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-portfolio-orange transition-colors duration-300">
                MT<span className="text-portfolio-orange">.</span>
              </h1>
            </div>
          </Link>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Actions Button - Hide on small screens */}
          <motion.button
            onClick={onQuickActionsToggle}
            className="hidden sm:flex p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-xl">
              <IconContext.Provider value={{ className: "text-xl" }}>
                <div><RiIcons.RiApps2Line /></div>
              </IconContext.Provider>
            </div>
          </motion.button>
          
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-xl">
              <IconContext.Provider value={{ className: "text-xl" }}>
                {darkMode ? <div><RiIcons.RiSunLine /></div> : <div><RiIcons.RiMoonLine /></div>}
              </IconContext.Provider>
            </div>
          </motion.button>
          
          {/* Profile Menu */}
          <div className="relative ml-2">
            <motion.button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
              }}
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="h-9 w-9 rounded-full object-cover border-2 border-dark-800"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-ai-blue via-purple-600 to-ai-purple flex items-center justify-center text-white font-medium text-sm border-2 border-dark-800">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
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
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ai-blue via-purple-600 to-ai-purple flex items-center justify-center text-white font-medium text-sm mr-3">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                        )}
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
                          <div><RiIcons.RiUserSettingsLine /></div>
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
                          <div><RiIcons.RiUserStarLine /></div>
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
                            <div><RiIcons.RiLogoutBoxRLine /></div>
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
      </div>
    </header>
  );
};

export default ProjectHeader; 