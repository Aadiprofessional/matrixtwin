import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AIChatPanel } from './AIChatPanel';

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPopup: React.FC<AIChatPopupProps> = ({ isOpen, onClose }) => {
  // Close popup when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-28 right-6 h-96 bg-dark-900 rounded-2xl shadow-2xl w-80 shadow-ai-blue/10 border border-dark-700 overflow-hidden z-50 flex flex-col fade-in-up"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <AIChatPanel showHeader={true} />
        </div>
      )}
    </AnimatePresence>
  );
}; 