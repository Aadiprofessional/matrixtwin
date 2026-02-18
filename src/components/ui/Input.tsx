import React, { InputHTMLAttributes, ReactNode, useState, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'default' | 'futuristic';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  required,
  id,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseClasses = 'input flex items-center';
  const variantClasses = {
    default: '',
    futuristic: 'border-0 bg-secondary-50/50 dark:bg-dark-800/50 backdrop-blur-sm focus:ring-portfolio-orange dark:focus:ring-portfolio-orange',
  };
  
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={`
            ${baseClasses} 
            ${variantClasses[variant]} 
            ${leftIcon ? 'pl-10' : ''} 
            ${rightIcon ? 'pr-10' : ''} 
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
            {rightIcon}
          </div>
        )}
        
        {isFocused && variant === 'futuristic' && (
          <div 
            className="absolute bottom-0 left-0 h-0.5 bg-portfolio-orange w-full transition-all duration-300"
          />
        )}
      </div>
      
      {(error || hint) && (
        <p className={`mt-1 text-sm ${error ? 'text-error' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}); 