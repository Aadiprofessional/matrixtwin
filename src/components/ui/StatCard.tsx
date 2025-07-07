import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: IconType;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'cyan' | 'orange' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  description,
  icon: Icon,
  trend,
  color = 'blue',
  size = 'md',
  className = '',
  onClick,
  loading = false
}) => {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-900/40 to-blue-700/20',
      border: 'border-blue-800/50',
      icon: 'text-blue-400',
      value: 'text-white',
      unit: 'text-blue-300',
      description: 'text-blue-300/80'
    },
    green: {
      gradient: 'from-emerald-900/40 to-emerald-700/20',
      border: 'border-emerald-800/50',
      icon: 'text-emerald-400',
      value: 'text-white',
      unit: 'text-emerald-300',
      description: 'text-emerald-300/80'
    },
    yellow: {
      gradient: 'from-yellow-900/40 to-yellow-700/20',
      border: 'border-yellow-800/50',
      icon: 'text-yellow-400',
      value: 'text-white',
      unit: 'text-yellow-300',
      description: 'text-yellow-300/80'
    },
    red: {
      gradient: 'from-red-900/40 to-red-700/20',
      border: 'border-red-800/50',
      icon: 'text-red-400',
      value: 'text-white',
      unit: 'text-red-300',
      description: 'text-red-300/80'
    },
    purple: {
      gradient: 'from-purple-900/40 to-purple-700/20',
      border: 'border-purple-800/50',
      icon: 'text-purple-400',
      value: 'text-white',
      unit: 'text-purple-300',
      description: 'text-purple-300/80'
    },
    indigo: {
      gradient: 'from-indigo-900/40 to-indigo-700/20',
      border: 'border-indigo-800/50',
      icon: 'text-indigo-400',
      value: 'text-white',
      unit: 'text-indigo-300',
      description: 'text-indigo-300/80'
    },
    cyan: {
      gradient: 'from-cyan-900/40 to-cyan-700/20',
      border: 'border-cyan-800/50',
      icon: 'text-cyan-400',
      value: 'text-white',
      unit: 'text-cyan-300',
      description: 'text-cyan-300/80'
    },
    orange: {
      gradient: 'from-orange-900/40 to-orange-700/20',
      border: 'border-orange-800/50',
      icon: 'text-orange-400',
      value: 'text-white',
      unit: 'text-orange-300',
      description: 'text-orange-300/80'
    },
    emerald: {
      gradient: 'from-emerald-900/40 to-emerald-700/20',
      border: 'border-emerald-800/50',
      icon: 'text-emerald-400',
      value: 'text-white',
      unit: 'text-emerald-300',
      description: 'text-emerald-300/80'
    }
  };

  const sizeConfig = {
    sm: {
      padding: 'p-4',
      iconSize: 'text-xl',
      titleSize: 'text-sm',
      valueSize: 'text-2xl',
      unitSize: 'text-sm',
      descSize: 'text-xs'
    },
    md: {
      padding: 'p-6',
      iconSize: 'text-2xl',
      titleSize: 'text-base',
      valueSize: 'text-3xl',
      unitSize: 'text-base',
      descSize: 'text-sm'
    },
    lg: {
      padding: 'p-8',
      iconSize: 'text-3xl',
      titleSize: 'text-lg',
      valueSize: 'text-4xl',
      unitSize: 'text-lg',
      descSize: 'text-base'
    }
  };

  const colors = colorConfig[color];
  const sizes = sizeConfig[size];

  return (
    <motion.div
      className={`
        bg-gradient-to-br ${colors.gradient} 
        border ${colors.border} 
        rounded-2xl 
        ${sizes.padding}
        backdrop-blur-sm
        hover:shadow-lg
        hover:shadow-${color}-500/10
        transition-all
        duration-300
        group
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`${colors.icon} ${sizes.iconSize} group-hover:scale-110 transition-transform duration-200`}>
              <Icon />
            </div>
          )}
          <h3 className={`${colors.value} font-semibold ${sizes.titleSize}`}>
            {title}
          </h3>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            trend.isPositive !== false 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <span className={trend.isPositive !== false ? '↗' : '↘'}>
              {trend.isPositive !== false ? '↗' : '↘'}
            </span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mb-2">
        {loading ? (
          <div className="animate-pulse">
            <div className={`h-8 bg-slate-700 rounded ${size === 'lg' ? 'w-24' : size === 'md' ? 'w-20' : 'w-16'}`}></div>
          </div>
        ) : (
          <>
            <span className={`${colors.value} font-bold ${sizes.valueSize} leading-none`}>
              {value}
            </span>
            {unit && (
              <span className={`${colors.unit} ${sizes.unitSize} pb-1 font-medium`}>
                {unit}
              </span>
            )}
          </>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className={`${colors.description} ${sizes.descSize} leading-relaxed`}>
          {description}
        </p>
      )}

      {/* Trend label */}
      {trend?.label && (
        <p className={`${colors.description} text-xs mt-2 opacity-75`}>
          {trend.label}
        </p>
      )}
    </motion.div>
  );
};

export default StatCard; 