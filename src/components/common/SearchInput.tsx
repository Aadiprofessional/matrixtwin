import React, { forwardRef } from 'react';
import { IconContext } from 'react-icons';
import { IconWrapper } from '../ui/IconWrapper';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={`relative flex-grow ${containerClassName}`}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
          <IconContext.Provider value={{ className: "text-lg" }}>
            <IconWrapper icon="RiSearchLine" />
          </IconContext.Provider>
        </div>
        <input
          ref={ref}
          type="text"
          className={`
            w-full 
            pl-10 pr-4 py-2
            bg-light-50 dark:bg-dark-800
            border border-light-200 dark:border-dark-700
            rounded-lg
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput'; 