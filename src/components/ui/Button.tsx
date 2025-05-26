import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'ai' | 'ai-secondary' | 'ai-gradient' | 'futuristic';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  glowing?: boolean;
  animated?: boolean;
  pulseEffect?: boolean;
  onDrag?: HTMLMotionProps<'button'>['onDrag'];
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  glowing = false,
  animated = false,
  pulseEffect = false,
  className = '',
  disabled,
  ...rest
}) => {
  // Define button styles based on variant
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all duration-200',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg transition-all duration-200',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-all duration-200',
    outline: 'bg-transparent border border-secondary-200 dark:border-dark-700 hover:bg-secondary-50 dark:hover:bg-dark-800 text-secondary-700 dark:text-secondary-300 rounded-lg transition-all duration-200',
    ghost: 'bg-transparent hover:bg-secondary-50 dark:hover:bg-dark-800 text-secondary-700 dark:text-secondary-300 rounded-lg transition-all duration-200',
    'ai': 'bg-ai-blue hover:bg-blue-600 text-white rounded-lg transition-all duration-200 border border-ai-blue/30',
    'ai-secondary': 'bg-dark-800/90 border border-ai-blue/30 hover:border-ai-blue/60 text-white rounded-lg transition-all duration-200',
    'ai-gradient': 'relative text-white rounded-lg transition-all duration-200 border border-ai-blue/30 overflow-hidden bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal bg-size-200 bg-pos-0 hover:bg-pos-100',
    'futuristic': 'relative text-white backdrop-blur-sm bg-black/40 border border-white/10 shadow-inner hover:shadow-[0_0_15px_rgba(30,144,255,0.3),inset_0_0_15px_rgba(30,144,255,0.2)] rounded-lg overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-black/50',
  };
  
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const glowClass = glowing ? 'shadow-ai-glow hover:shadow-ai-glow-lg' : '';
  
  const pulseAnimation = pulseEffect ? {
    scale: [1, 1.03, 1],
    opacity: [1, 0.85, 1],
    transition: { 
      duration: 1.8, 
      repeat: Infinity,
      ease: "easeInOut" 
    }
  } : {};
  
  const animatedVariants = {
    initial: { opacity: 0.9, y: 0 },
    hover: { 
      y: -2, 
      opacity: 1,
    },
    tap: { 
      y: 0,
      scale: 0.98
    }
  };
  
  return (
    <motion.button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${glowClass} ${className} relative overflow-hidden font-medium group`}
      disabled={isLoading || disabled}
      whileTap={animated ? { scale: 0.98 } : {}}
      whileHover={animated ? animatedVariants.hover : {}}
      initial={animated ? animatedVariants.initial : {}}
      animate={pulseEffect ? pulseAnimation : {}}
      {...rest as any}
    >
      {variant === 'ai-gradient' && (
        <span className="absolute inset-0 bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
      )}
      
      {variant === 'futuristic' && (
        <>
          <span className="absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 blur"></span>
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-10"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ 
              backgroundSize: '200% 200%',
            }}
          ></motion.span>
          <motion.span
            className="absolute -inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut",
            }}
          ></motion.span>
        </>
      )}
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit">
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : ''} z-10 relative group-hover:scale-105 transition-transform duration-300`}>
        {leftIcon && <span className="transition-transform duration-300 group-hover:translate-x-0.5">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="transition-transform duration-300 group-hover:translate-x-0.5">{rightIcon}</span>}
      </span>
    </motion.button>
  );
}; 