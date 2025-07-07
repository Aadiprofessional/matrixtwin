import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface Tab {
  id: string;
  label: string;
  icon?: IconType;
  badge?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeConfig = {
    sm: {
      padding: 'px-3 py-2',
      text: 'text-sm',
      icon: 'text-sm',
      gap: 'gap-2'
    },
    md: {
      padding: 'px-4 py-3',
      text: 'text-base',
      icon: 'text-base',
      gap: 'gap-3'
    },
    lg: {
      padding: 'px-6 py-4',
      text: 'text-lg',
      icon: 'text-lg',
      gap: 'gap-4'
    }
  };

  const sizes = sizeConfig[size];

  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return {
          container: 'bg-slate-800/30 rounded-2xl p-1 border border-slate-700/50',
          tab: 'rounded-xl transition-all duration-300',
          active: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25',
          inactive: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        };
      case 'underline':
        return {
          container: 'border-b border-slate-700/50',
          tab: 'border-b-2 border-transparent transition-all duration-300 -mb-px',
          active: 'border-indigo-500 text-indigo-400',
          inactive: 'text-slate-400 hover:text-white hover:border-slate-600'
        };
      default:
        return {
          container: 'bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 backdrop-blur-sm',
          tab: 'rounded-lg transition-all duration-300',
          active: 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white shadow-lg border border-indigo-500/30',
          inactive: 'text-slate-400 hover:text-white hover:bg-slate-700/30'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`flex ${variantClasses.container} ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <motion.button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex-1 flex items-center justify-center ${sizes.gap} ${sizes.padding}
              ${variantClasses.tab}
              ${isActive ? variantClasses.active : variantClasses.inactive}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              font-medium ${sizes.text}
              relative
            `}
            whileHover={!tab.disabled ? { scale: 1.02 } : {}}
            whileTap={!tab.disabled ? { scale: 0.98 } : {}}
            layout
          >
            {Icon && (
              <Icon className={`${sizes.icon} ${isActive ? 'text-indigo-400' : ''}`} />
            )}
            <span className="relative">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <motion.span
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </motion.span>
              )}
            </span>
            
            {/* Active indicator for underline variant */}
            {variant === 'underline' && isActive && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default TabNavigation; 