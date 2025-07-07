import React from 'react';
import { motion } from 'framer-motion';
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiAlarmWarningLine
} from 'react-icons/ri';

// Sensor status
export type SensorStatus = 'online' | 'offline' | 'warning' | 'critical';

interface StatusIndicatorProps {
  status: SensorStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'md',
  showIcon = true,
  showText = true,
  className = ''
}) => {
  const getStatusConfig = (status: SensorStatus) => {
    const configs = {
      online: {
        color: 'emerald',
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        ringColor: 'ring-emerald-500/20',
        icon: RiCheckboxCircleLine,
        label: 'Online'
      },
      offline: {
        color: 'slate',
        bgColor: 'bg-slate-500',
        textColor: 'text-slate-400',
        ringColor: 'ring-slate-500/20',
        icon: RiCloseCircleLine,
        label: 'Offline'
      },
      warning: {
        color: 'amber',
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-400',
        ringColor: 'ring-amber-500/20',
        icon: RiAlertLine,
        label: 'Warning'
      },
      critical: {
        color: 'red',
        bgColor: 'bg-red-500',
        textColor: 'text-red-400',
        ringColor: 'ring-red-500/20',
        icon: RiAlarmWarningLine,
        label: 'Critical'
      }
    };
    return configs[status];
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      dot: 'w-2 h-2',
      icon: 'text-sm',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      dot: 'w-3 h-3',
      icon: 'text-base',
      text: 'text-sm',
      padding: 'px-3 py-1.5'
    },
    lg: {
      dot: 'w-4 h-4',
      icon: 'text-lg',
      text: 'text-base',
      padding: 'px-4 py-2'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div 
      className={`inline-flex items-center gap-2 ${sizes.padding} rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm ${config.ringColor} ring-1 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && (
        <motion.div
          className="relative"
          animate={{
            scale: status === 'online' ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: status === 'online' ? Infinity : 0,
            repeatType: "reverse"
          }}
        >
          <div className={`${sizes.dot} ${config.bgColor} rounded-full shadow-lg`}>
            <div className={`${sizes.dot} ${config.bgColor} rounded-full animate-ping absolute inset-0 ${status === 'online' ? 'opacity-75' : 'opacity-0'}`}></div>
          </div>
        </motion.div>
      )}
      
      {showText && (
        <span className={`font-medium ${config.textColor} ${sizes.text}`}>
          {config.label}
        </span>
      )}
    </motion.div>
  );
};

export default StatusIndicator; 