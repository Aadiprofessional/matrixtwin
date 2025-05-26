import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { RiHome2Line } from 'react-icons/ri';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-950 dark:to-dark-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="relative mb-8">
          <div className="text-[150px] font-display font-bold text-primary-500/10 dark:text-primary-500/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="h-24 w-24 bg-gradient-to-br from-ai-blue via-purple-600 to-ai-purple text-white rounded-2xl flex items-center justify-center font-display font-bold text-4xl shadow-ai-glow mb-4"
              animate={{ 
                boxShadow: ["0 0 10px rgba(63, 135, 255, 0.3)", "0 0 20px rgba(63, 135, 255, 0.5)", "0 0 10px rgba(63, 135, 255, 0.3)"],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse"
              }}
            >
              M
            </motion.div>
          </div>
        </div>
        
        <h1 className="text-3xl font-display font-bold text-secondary-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        
        <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/">
          <Button variant="primary" leftIcon={<RiHome2Line />}>
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="h-full w-full bg-gradient-to-t from-primary-500/10 to-transparent dark:from-primary-800/10" />
      </motion.div>
    </div>
  );
};

export default NotFoundPage; 