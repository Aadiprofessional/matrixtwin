import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  
  const { resetPassword, isLoading, error } = useAuth();
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    // Check if we have an active session from the recovery link
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        // No active session, redirect to login
        navigate('/login');
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    
    setPasswordsMatch(true);
    
    try {
      await resetPassword('', password); // token not needed as the session is already established
      setIsResetSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 bg-ai-dots relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-ai-grid opacity-20"></div>
      
      {/* Animated gradient orbs */}
      <motion.div 
        className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-ai-teal/20 blur-3xl"
        animate={{ 
          x: [0, 30, 0], 
          opacity: [0.2, 0.3, 0.2] 
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      />
      
      <motion.div 
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-ai-purple/20 blur-3xl"
        animate={{ 
          x: [0, -40, 0], 
          opacity: [0.15, 0.25, 0.15] 
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1 
        }}
      />
      
      <div className="w-full max-w-md z-10">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
       
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow">
            <h2 className="text-xl font-display font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
              {t('auth.createNewPassword')}
            </h2>
            
            {isResetSuccess ? (
              <motion.div 
                className="py-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 text-success mb-4">
                  <IconContext.Provider value={{ className: "text-3xl" }}>
                    <RiIcons.RiCheckLine />
                  </IconContext.Provider>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">Password Reset Successful</h3>
                <p className="text-gray-400 mb-6">
                  Your password has been updated successfully. Redirecting to login...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm text-gray-400 mb-6">
                  Create a new password for your account.
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Input
                      label={t('auth.newPassword')}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      leftIcon={
                        <IconContext.Provider value={{ className: "text-ai-blue" }}>
                          <RiIcons.RiLockLine />
                        </IconContext.Provider>
                      }
                      required
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-ai-blue transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <IconContext.Provider value={{}}>
                        {showPassword ? <RiIcons.RiEyeOffLine /> : <RiIcons.RiEyeLine />}
                      </IconContext.Provider>
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Input
                      label={t('auth.confirmNewPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      leftIcon={
                        <IconContext.Provider value={{ className: "text-ai-blue" }}>
                          <RiIcons.RiLockLine />
                        </IconContext.Provider>
                      }
                      required
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-ai-blue transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <IconContext.Provider value={{}}>
                        {showConfirmPassword ? <RiIcons.RiEyeOffLine /> : <RiIcons.RiEyeLine />}
                      </IconContext.Provider>
                    </button>
                  </div>
                </div>
                
                {!passwordsMatch && (
                  <motion.div 
                    className="bg-error/10 text-error text-sm p-3 rounded-lg mb-4 border border-error/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    Passwords do not match
                  </motion.div>
                )}
                
                {error && (
                  <motion.div 
                    className="bg-error/10 text-error text-sm p-3 rounded-lg mb-4 border border-error/20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
                
                <Button
                  type="submit"
                  variant="ai-gradient"
                  isLoading={isLoading}
                  fullWidth
                  className="mb-4"
                  glowing
                >
                  {t('auth.resetPassword')}
                </Button>
                
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="text-sm text-ai-blue hover:text-ai-teal flex items-center justify-center transition-colors"
                  >
                    <IconContext.Provider value={{ className: "mr-1" }}>
                      <RiIcons.RiArrowLeftLine />
                    </IconContext.Provider>
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword; 