import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'ai' | 'ai-secondary' | 'ai-gradient' | 'futuristic' | 'destructive';
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
    primary: 'bg-primary-500/90 hover:bg-primary-600 backdrop-blur-sm text-white rounded-lg transition-all duration-200 shadow-lg shadow-primary-500/20 border border-white/10',
    secondary: 'bg-secondary-500/90 hover:bg-secondary-600 backdrop-blur-sm text-white rounded-lg transition-all duration-200 shadow-lg shadow-secondary-500/20 border border-white/10',
    accent: 'bg-accent-500/90 hover:bg-accent-600 backdrop-blur-sm text-white rounded-lg transition-all duration-200 shadow-lg shadow-accent-500/20 border border-white/10',
    outline: 'bg-transparent border border-secondary-200 dark:border-white/10 hover:bg-secondary-50 dark:hover:bg-white/5 backdrop-blur-sm text-secondary-700 dark:text-secondary-300 rounded-lg transition-all duration-200',
    ghost: 'bg-transparent hover:bg-secondary-50 dark:hover:bg-white/5 backdrop-blur-sm text-secondary-700 dark:text-secondary-300 rounded-lg transition-all duration-200',
    'ai': 'bg-portfolio-orange hover:bg-portfolio-orange-hover text-white rounded-lg transition-all duration-200 border border-portfolio-orange/30',
    'ai-secondary': 'bg-portfolio-card/90 backdrop-blur-sm border border-portfolio-orange/30 hover:border-portfolio-orange/60 text-white rounded-lg transition-all duration-200',
    'ai-gradient': 'bg-portfolio-orange hover:bg-portfolio-orange-hover text-white rounded-lg transition-all duration-200 shadow-lg shadow-portfolio-orange/20 border border-portfolio-orange/30',
    'futuristic': 'relative text-white backdrop-blur-sm bg-black/40 border border-white/10 shadow-inner hover:shadow-[0_0_15px_rgba(255,165,0,0.3),inset_0_0_15px_rgba(255,165,0,0.2)] rounded-lg overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-black/50',
    'destructive': 'bg-error hover:bg-error/80 text-white rounded-lg transition-all duration-200 shadow-lg shadow-error/20 border border-white/10',
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

      
      {variant === 'futuristic' && (
        <>
          <span className="absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-portfolio-orange via-orange-600 to-red-600 blur"></span>
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-portfolio-orange via-orange-600 to-red-600 opacity-10"
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