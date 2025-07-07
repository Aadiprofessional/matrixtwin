import React from 'react';
import { motion } from 'framer-motion';
import {
  RiTempHotLine, 
  RiWaterFlashLine,
  RiLightbulbLine,
  RiFireLine,
  RiDoorLockLine,
  RiUserLocationLine,
  RiSensorLine,
  RiWindyLine
} from 'react-icons/ri';

// Sensor types
export type SensorType = 'temperature' | 'humidity' | 'occupancy' | 'energy' | 'water' | 'security' | 'air';

interface SensorIconProps {
  type: SensorType;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'outlined' | 'filled';
  animated?: boolean;
}

const SensorIcon: React.FC<SensorIconProps> = ({ 
  type, 
  className = '', 
  size = 'md',
  variant = 'default',
  animated = false
}) => {
  const getSensorConfig = (type: SensorType) => {
    const configs = {
      temperature: {
        icon: RiTempHotLine,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        hoverColor: 'hover:bg-red-500/20'
      },
      humidity: {
        icon: RiWaterFlashLine,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        hoverColor: 'hover:bg-blue-500/20'
      },
      energy: {
        icon: RiLightbulbLine,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        hoverColor: 'hover:bg-yellow-500/20'
      },
      water: {
        icon: RiWaterFlashLine,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        hoverColor: 'hover:bg-cyan-500/20'
      },
      security: {
        icon: RiDoorLockLine,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        hoverColor: 'hover:bg-purple-500/20'
      },
      occupancy: {
        icon: RiUserLocationLine,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        hoverColor: 'hover:bg-green-500/20'
      },
      air: {
        icon: RiWindyLine,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        hoverColor: 'hover:bg-indigo-500/20'
      }
    };
    return configs[type] || {
      icon: RiSensorLine,
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
      hoverColor: 'hover:bg-slate-500/20'
    };
  };

  const config = getSensorConfig(type);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-6 h-6 p-1 text-sm',
    md: 'w-8 h-8 p-1.5 text-base',
    lg: 'w-10 h-10 p-2 text-lg',
    xl: 'w-12 h-12 p-2.5 text-xl'
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outlined':
        return `border ${config.borderColor} ${config.hoverColor}`;
      case 'filled':
        return `${config.bgColor} ${config.hoverColor}`;
      default:
        return config.hoverColor;
    }
  };

  const iconElement = (
    <div className={`
      ${sizeClasses[size]} 
      ${getVariantClasses()}
      ${config.color}
      rounded-lg 
      transition-all 
      duration-200 
      flex 
      items-center 
      justify-center
      ${className}
    `}>
      <Icon className="w-full h-full" />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {iconElement}
      </motion.div>
    );
  }

  return iconElement;
};

export default SensorIcon; 