import React, { HTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onDrag'> {
  variant?: 'default' | 'glass' | 'futuristic' | 'ai' | 'ai-gradient' | 'ai-dark' | 'ai-glow';
  hover?: boolean;
  children: ReactNode;
  animateIn?: boolean;
  onDrag?: HTMLMotionProps<'div'>['onDrag'];
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hover = true,
  animateIn = false,
  className = '',
  ...rest
}) => {
  const baseClass = 'rounded-xl p-4 transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white dark:bg-dark-900 shadow-md dark:shadow-dark-950/50',
    glass: 'bg-white/90 dark:bg-dark-900/90 backdrop-blur-md shadow-lg dark:shadow-dark-950/50',
    futuristic: 'glass-card futuristic-border bg-opacity-90 dark:bg-opacity-90',
    'ai': 'bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border border-portfolio-orange/20 shadow-lg dark:shadow-dark-950/50',
    'ai-gradient': 'bg-white/95 dark:bg-dark-900/95 backdrop-blur-md border border-portfolio-orange/30 shadow-lg dark:shadow-dark-950/50',
    'ai-dark': 'bg-dark-800/95 backdrop-blur-md border border-portfolio-orange/20 shadow-lg text-white',
    'ai-glow': 'bg-white/95 dark:bg-dark-800/95 backdrop-blur-md border border-portfolio-orange/40 shadow-ai-glow dark:shadow-ai-glow',
  };
  
  const hoverClass = hover 
    ? variant.includes('ai') 
      ? 'transform hover:-translate-y-1 hover:shadow-ai-glow-lg' 
      : 'transform hover:-translate-y-1 hover:shadow-lg'
    : '';
  
  const animationProps = animateIn ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  } : {};
  
  return (
    <motion.div
      className={`${baseClass} ${variantClasses[variant]} ${hoverClass} ${className}`}
      {...animationProps}
      {...rest as any}
    >
      {children}
    </motion.div>
  );
}; 