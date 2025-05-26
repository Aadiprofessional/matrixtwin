import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { IconContext } from 'react-icons';
import { useTranslation } from 'react-i18next';
import { IconWrapper } from '../ui/IconWrapper';
import { ProjectSelector } from './ProjectSelector';
import matrixAILogo from '../../assets/MatrixAILogo.png';
import { 
  RiDashboardLine,
  RiBuilding4Line, 
  RiHome2Line,
  RiFileList3Line,
  RiBookmarkLine,
  RiShieldCheckLine,
  RiGroupLine,
  RiBrushLine,
  RiFileUserLine,
  RiSettings3Line,
  RiArrowRightSLine,
  RiArrowLeftSLine,
  RiLogoutBoxRLine,
  RiBarChartBoxLine,
  RiPieChartLine,
  RiListCheck2,
  RiTeamLine,
  RiCalendarTodoLine,
  RiCloseLine,
  RiBrainLine,
  RiVolumeUpLine
} from 'react-icons/ri';
import { useProjects } from '../../contexts/ProjectContext';

// Logo component
const Logo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  return (
    <div className="flex items-center justify-center my-6">
      {collapsed ? (
        <motion.div 
          className="h-10 w-10 rounded-xl flex items-center justify-center relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0"></div>
       
        </motion.div>
      ) : (
        <div className="flex items-center">
          <motion.div 
            className="h-10 w-10 rounded-xl flex items-center justify-center relative mr-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0  overflow-hidden"></div>
            <img src={matrixAILogo} alt="MatrixAI Logo" className="h-10 w-10 object-contain relative z-10" />
          </motion.div>
          <div className="font-display font-bold text-xl">
            <span className="bg-gradient-to-r from-ai-blue via-purple-500 to-ai-purple bg-clip-text text-transparent">
              Matrix<span className="text-white">Twin</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  requiredRoles?: string[];
  badgeCount?: number;
  mobile?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed, requiredRoles, badgeCount = 0, mobile, onClick }) => {
  const location = useLocation();
  const auth = useAuth();
  const { t } = useTranslation();
  const { selectedProject } = useProjects();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasRequiredRoles = !requiredRoles || 
    (auth.user?.role && requiredRoles.includes(auth.user.role));

  if (!hasRequiredRoles) {
    return null;
  }

  // Add project ID to navigation if a project is selected
  const getNavigationPath = () => {
    if (selectedProject && to !== '/projects') {
      return `${to}`;
    }
    return to;
  };

  const handleItemClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    if (onClick) onClick();
  };

  return (
    <NavLink
      to={getNavigationPath()}
      onClick={handleItemClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 relative ${
          isActive 
          ? 'text-white font-medium bg-gradient-to-r from-ai-blue/20 to-ai-purple/20 border-l-2 border-ai-blue shadow-[0_0_10px_rgba(30,144,255,0.3)]' 
          : 'text-gray-400 dark:text-gray-300 hover:text-gray-100'
        } ${
          collapsed && !mobile ? 'justify-center' : 'justify-between'
        } rounded-lg transition-all duration-300 hover:bg-dark-800/50 ${
          mobile ? 'py-4' : ''
        } ${
          isPressed ? 'scale-95 bg-ai-blue/20' : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg opacity-30 z-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-ai-dots" />
              <div className="absolute -inset-1 bg-gradient-to-r from-ai-blue to-ai-purple blur-xl" />
            </motion.div>
          )}
          <div className="flex items-center relative z-10">
            <motion.div
              animate={{ 
                scale: isActive || isHovered ? 1.1 : 1,
                color: isActive ? 'rgb(30, 144, 255)' : isHovered ? 'rgb(200, 200, 200)' : 'rgb(156, 163, 175)'
              }}
              transition={{ duration: 0.2 }}
              className={`${isActive ? 'text-ai-blue' : ''}`}
            >
              <IconContext.Provider value={{ size: '22px' }}>
                {icon}
              </IconContext.Provider>
            </motion.div>
            {(!collapsed || mobile) && (
              <motion.span 
                className={`ml-3 font-medium relative ${isActive ? 'text-white' : ''}`}
                animate={{ 
                  x: isActive ? 2 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                {t(label)}
                {isActive && (
                  <motion.span 
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-ai-blue to-ai-purple"
                    layoutId="underline"
                  />
                )}
              </motion.span>
            )}
          </div>
          
          {badgeCount > 0 && (!collapsed || mobile) && (
            <span className="bg-gradient-to-r from-ai-blue to-ai-purple text-white text-xs font-semibold px-2 py-1 rounded-full relative z-10 shadow-[0_0_10px_rgba(30,144,255,0.5)]">
              {badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobile = false, onClose, onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Always expanded on mobile
  useEffect(() => {
    if (mobile) {
      setCollapsed(false);
    }
  }, [mobile]);
  
  // Notify parent component when collapsed state changes
  useEffect(() => {
    if (onCollapseChange && !mobile) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange, mobile]);
  
  // Primary nav items
  const primaryNavItems = [
    { 
      to: '/dashboard', 
      icon: (
        <div><IconWrapper icon="RiDashboardLine" className="text-xl" /></div>
      ), 
      label: 'nav.dashboard',
      requiredRoles: undefined
    },
    { 
      to: '/digital-twins/iot-dashboard', 
      icon: (
        <div><IconWrapper icon="RiBuilding4Line" className="text-xl" /></div>
      ), 
      label: 'nav.digitalTwins',
      requiredRoles: undefined
    },
    { 
      to: '/ask-ai', 
      icon: (
        <div><IconWrapper icon="RiBrainLine" className="text-xl" /></div>
      ), 
      label: 'nav.askAI',
      badgeCount: 0,
      requiredRoles: undefined
    },
    { 
      to: '/analytics', 
      icon: (
        <div><IconWrapper icon="RiPieChartLine" className="text-xl" /></div>
      ), 
      label: 'analytics.title', 
      requiredRoles: ['admin', 'projectManager'] 
    }
  ];
  
  // DWSS Modules
  const dwssModules = [
    { 
      to: '/rfi', 
      icon: (
        <div><IconWrapper icon="RiFileList3Line" className="text-xl" /></div>
      ), 
      label: 'nav.forms',
      badgeCount: 3
    },
    { 
      to: '/diary', 
      icon: (
        <div><IconWrapper icon="RiBookmarkLine" className="text-xl" /></div>
      ), 
      label: 'diary.title' 
    },
    { 
      to: '/safety', 
      icon: (
        <div><IconWrapper icon="RiShieldCheckLine" className="text-xl" /></div>
      ), 
      label: 'safety.title', 
      requiredRoles: ['admin', 'projectManager', 'siteInspector'] 
    },
    { 
      to: '/labour', 
      icon: (
        <div><IconWrapper icon="RiGroupLine" className="text-xl" /></div>
      ), 
      label: 'labour.title', 
      requiredRoles: ['admin', 'projectManager', 'contractor'] 
    },
    { 
      to: '/cleansing', 
      icon: (
        <div><IconWrapper icon="RiBrushLine" className="text-xl" /></div>
      ), 
      label: 'cleansing.title' 
    }
  ];
  
  // Management nav items
  const managementItems = [
    { 
      to: '/tasks', 
      icon: (
        <div><IconWrapper icon="RiCalendarTodoLine" className="text-xl" /></div>
      ), 
      label: 'tasks.title',
      badgeCount: 5
    },
    { 
      to: '/forms', 
      icon: (
        <div><IconWrapper icon="RiFileUserLine" className="text-xl" /></div>
      ), 
      label: 'nav.customForms', 
      requiredRoles: ['admin', 'projectManager'] 
    },
    { 
      to: '/team', 
      icon: (
        <div><IconWrapper icon="RiTeamLine" className="text-xl" /></div>
      ), 
      label: 'team.title', 
      requiredRoles: ['admin', 'projectManager'] 
    },
    { 
      to: '/reports', 
      icon: (
        <div><IconWrapper icon="RiBarChartBoxLine" className="text-xl" /></div>
      ), 
      label: 'reports.title', 
      requiredRoles: ['admin', 'projectManager', 'siteInspector'] 
    },
    { 
      to: '/settings', 
      icon: (
        <div><IconWrapper icon="RiSettings3Line" className="text-xl" /></div>
      ), 
      label: 'settings.title' 
    },
  ];
  
  // For the beautiful glow effect based on scroll
  const [scrollPosition, setScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = (e: any) => {
      if (e.target) {
        setScrollPosition(e.target.scrollTop);
      }
    };
    
    const sidebar = document.getElementById('sidebar-content');
    if (sidebar) {
      sidebar.addEventListener('scroll', handleScroll);
      return () => sidebar.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  const handleNavItemClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };
  
  return (
    <motion.aside 
      className={`
        ${mobile ? 'fixed top-0 left-0 h-screen z-50' : 'fixed top-0 left-0 h-screen'}
        bg-dark-950 shadow-xl flex flex-col
        transition-all duration-300 ease-in-out 
        ${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-64'}
      `}
      layout
    >
      {mobile && (
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div><IconWrapper icon="RiCloseLine" className="text-xl" /></div>
        </motion.button>
      )}

      <div className="relative overflow-hidden h-full">
        {/* Beautiful gradient backdrop */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-ai-blue/10 to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-ai-purple/10 to-transparent pointer-events-none" />
        
        {/* Moving gradient based on scroll */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(circle at ${collapsed && !mobile ? '50%' : '70%'} ${30 + scrollPosition/10}%, rgba(63, 135, 255, 0.15) 0%, transparent 50%)`,
          }}
        />
        
        <Logo collapsed={collapsed && !mobile} />
        
        {/* Project Selector */}
        <ProjectSelector collapsed={collapsed && !mobile} mobile={mobile} />
        
        <div 
          id="sidebar-content"
          className="flex-1 py-8 px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900 overflow-x-hidden h-[calc(100vh-240px)]"
        >
          <AnimatePresence>
            <motion.nav layout className="space-y-6">
              {/* Main Navigation */}
              <div>
                {(!collapsed || mobile) && (
                  <h3 className="text-xs uppercase text-gray-500 font-medium px-4 mb-2">
                    {t('common.main', 'Project Management')}
                  </h3>
                )}
                {primaryNavItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NavItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      collapsed={collapsed && !mobile}
                      requiredRoles={item.requiredRoles}
                      badgeCount={item.badgeCount}
                      mobile={mobile}
                      onClick={handleNavItemClick}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* DWSS Modules */}
              <div>
                {(!collapsed || mobile) && (
                  <h3 className="text-xs uppercase text-gray-500 font-medium px-4 mb-2">
                    {t('common.modules', 'ISO19650 DWSS')}
                  </h3>
                )}
                {dwssModules.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <NavItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      collapsed={collapsed && !mobile}
                      requiredRoles={item.requiredRoles}
                      badgeCount={item.badgeCount}
                      mobile={mobile}
                      onClick={handleNavItemClick}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Management */}
              <div>
                {(!collapsed || mobile) && (
                  <h3 className="text-xs uppercase text-gray-500 font-medium px-4 mb-2">
                    {t('common.management', 'Management')}
                  </h3>
                )}
                {managementItems.map((item, index) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <NavItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      collapsed={collapsed && !mobile}
                      requiredRoles={item.requiredRoles}
                      badgeCount={item.badgeCount}
                      mobile={mobile}
                      onClick={handleNavItemClick}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.nav>
          </AnimatePresence>
        </div>
      </div>
      
      <div className="p-4 border-t border-dark-800">
        {!mobile && (
          <motion.button 
            onClick={toggleCollapsed}
            className="w-full py-2 flex items-center justify-center rounded-xl bg-dark-900/50 hover:bg-dark-800/80 text-gray-400 hover:text-white transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              animate={{ 
                rotate: collapsed ? 0 : 180
              }}
              transition={{ duration: 0.3 }}
            >
              <div><IconWrapper icon="RiArrowRightSLine" className="text-xl" /></div>
            </motion.div>
            {(!collapsed || mobile) && <span className="ml-2">{t('common.collapse', 'Collapse')}</span>}
          </motion.button>
        )}
        
        <motion.button 
          onClick={handleLogout}
          className="w-full mt-2 py-2 flex items-center justify-center rounded-xl bg-error/10 hover:bg-error/20 text-error hover:text-white transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-xl">
            <div><IconWrapper icon="RiLogoutBoxRLine" className="text-xl" /></div>
          </div>
          {(!collapsed || mobile) && <span className="ml-2">{t('auth.logout')}</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}; 