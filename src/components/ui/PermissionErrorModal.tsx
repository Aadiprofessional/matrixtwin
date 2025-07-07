import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiErrorWarningLine, RiCloseLine, RiShieldLine } from 'react-icons/ri';
import { Button } from './Button';

interface PermissionErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  requiredRole?: string;
  userRole?: string;
}

export const PermissionErrorModal: React.FC<PermissionErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Access Denied",
  message = "You don't have permission to access this page or perform this action.",
  requiredRole,
  userRole
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-3">
                <RiShieldLine className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <RiErrorWarningLine className="mr-2 text-red-500" />
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <RiCloseLine className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {message}
              </p>
              
              {requiredRole && userRole && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Your Role:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{userRole}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Required Role:</span>
                    <span className="font-medium text-red-600 dark:text-red-400 capitalize">{requiredRole}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-4 py-2"
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  // Optionally navigate to dashboard or previous page
                  window.history.back();
                }}
                className="px-4 py-2"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 