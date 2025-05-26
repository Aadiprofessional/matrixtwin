import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { Button } from './Button';
import { RiCloseLine } from 'react-icons/ri';
import { icon } from '../../utils/iconUtils';
import { IconWrapper } from './IconWrapper';

export interface DialogProps {
  children: React.ReactNode;
  onClose: () => void;
  isOpen?: boolean;
  title?: string;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'ai-dark';
  showCloseButton?: boolean;
  maxWidth?: string;
  fullWidth?: boolean;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  onClose,
  isOpen = true,
  title,
  actions,
  size = 'md',
  variant = 'ai-dark',
  showCloseButton = true,
  maxWidth = '600px',
  fullWidth = false,
  className = ''
}) => {
  const [open, setOpen] = useState(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    // Handle clicking outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  
  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  // Determine width based on size prop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
    full: 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{ maxWidth, width: fullWidth ? '100%' : 'auto' }}
              className={`bg-dark-900 shadow-lg rounded-lg overflow-hidden ${className}`}
            >
              {title && (
                <div className="flex items-center justify-between p-4 border-b border-dark-800">
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                  {showCloseButton && (
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <IconWrapper icon="RiCloseLine" className="text-xl" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-4">
                {children}
              </div>
              {actions && (
                <div className="flex gap-3 mt-6 justify-end">
                  {actions}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Example usage:
// <Dialog 
//   isOpen={showModal} 
//   onClose={() => setShowModal(false)}
//   title="Add New Item"
//   actions={
//     <>
//       <Button variant="ai-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
//       <Button variant="ai-gradient" onClick={handleSubmit}>Submit</Button>
//     </>
//   }
// >
//   <p>Dialog content goes here</p>
// </Dialog> 