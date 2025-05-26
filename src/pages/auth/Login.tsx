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
import { setUserInfo } from '../../utils/userInfo';

// Import the video
import BackgroundVideo from '../../assets/back.mp4';
// Import MatrixAI Logo
import MatrixAILogo from '../../assets/MatrixAILogo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser, setIsAuthenticated, verifyTwoFactor } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Add this new useEffect at the top of the component
  useEffect(() => {
    // Clear any existing auth data for fresh login experience
    console.log('Clearing existing auth data...');
    localStorage.removeItem('auth.user');
    localStorage.removeItem('auth.session');
    sessionStorage.removeItem('login_success');
    
    // Allow special direct login for specific email
    const urlParams = new URLSearchParams(window.location.search);
    const directEmail = urlParams.get('email');
    if (directEmail === 'anadi.mpvm@gmail.com') {
      setEmail(directEmail);
      // Focus the password field
      setTimeout(() => {
        const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
          setError('Please enter your password to login');
        }
      }, 500);
    }
  }, []);
  
  // Check for password reset confirmation
  useEffect(() => {
    const checkPasswordReset = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        // User came from password reset email
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          // Set the session using the recovery token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });
          
          if (!error) {
            navigate('/reset-password');
          }
        }
      }
    };
    
    checkPasswordReset();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.clear(); // Start with clean console
    
    try {
      console.log('Login attempt starting with:', email);
      
      // Clear any previous errors
      setError(null);
      setIsLoading(true);
      
      // Make API call to the new endpoint
      const response = await fetch('https://matrixbim-server.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      
      // If remember me is checked, store in localStorage, otherwise in sessionStorage
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('isAuthenticated', 'true');
      }
      
      setUserInfo(data.user);
      
      // Update auth context
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log('Login completed successfully');
      setLoginSuccess(true);
      
      // Store successful login info
      sessionStorage.setItem('login_success', 'true');
      
      // Navigate to projects page
      console.log('Navigating to projects...');
      setTimeout(() => {
        navigate('/projects', { replace: true });
      }, 500);
      
    } catch (err) {
      const error = err as Error;
      console.error('Login failed with error:', error);
      setError(error.message);
      setLoginSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await verifyTwoFactor(twoFactorCode);
      setLoginSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 bg-ai-dots relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
        style={{ filter: 'brightness(2)' }}
      >
        <source src={BackgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-ai-grid opacity-20 z-10"></div>
      
      {/* Logo and branding at top left */}
      <div className="absolute top-8 left-8 z-20 flex items-center">
        <div className="w-16 h-16 mr-4">
          <img src={MatrixAILogo} alt="MatrixAI Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ai-blue">MatrixTwin</h1>
          <p className="text-sm text-gray-300">Intelligent Construction Management</p>
        </div>
      </div>
      
      {/* Company footer at bottom right */}
      <div className="absolute bottom-4 right-8 z-20 text-right">
        <p className="text-gray-400 text-sm">Powered by: MatrixAI Company Ltd</p>
      </div>
      
      {/* Animated gradient orbs - with z-index to appear above video */}
      <motion.div 
        className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-ai-blue/20 blur-3xl z-10"
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
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-ai-purple/20 blur-3xl z-10"
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
      
      <motion.div 
        className="absolute top-2/3 left-1/4 w-40 h-40 rounded-full bg-ai-teal/20 blur-3xl z-10"
        animate={{ 
          y: [0, -30, 0], 
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ 
          duration: 7, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2 
        }}
      />

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 text-gray-300"
        >
          <IconContext.Provider value={{ className: "text-xl" }}>
            {darkMode ? <RiIcons.RiEyeLine /> : <RiIcons.RiEyeOffLine />}
          </IconContext.Provider>
        </motion.button>
        
        <motion.select
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-lg text-sm px-3 py-2 text-gray-300"
        >
          <option value="en">🇺🇸 English</option>
          <option value="zh">🇨🇳 中文</option>
          <option value="fr">🇫🇷 Français</option>
        </motion.select>
      </div>
      
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
          <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow bg-dark-950/40 backdrop-blur-sm">
            {loginSuccess ? (
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
                <h2 className="text-xl font-display font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  {t('auth.loginSuccess')}
                </h2>
                <p className="text-gray-400">
                  {t('auth.redirecting')}
                </p>
              </motion.div>
            ) : pendingVerification ? (
              <motion.div 
                className="py-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-warning/10 text-warning mb-4">
                  <IconContext.Provider value={{ className: "text-3xl" }}>
                    <RiIcons.RiTimeLine />
                  </IconContext.Provider>
                </div>
                <h2 className="text-xl font-display font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  Account Pending Verification
                </h2>
                <p className="text-gray-400 mb-4">
                  Your account is waiting for admin verification. Please check back later or contact an administrator.
                </p>
                <Button
                  variant="ai-secondary"
                  onClick={() => setPendingVerification(false)}
                >
                  Back to Login
                </Button>
              </motion.div>
            ) : showTwoFactor ? (
              <form onSubmit={handleTwoFactorSubmit}>
                <h2 className="text-xl font-display font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  {t('auth.2fa')}
                </h2>
            
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-400 mb-4">
                    {t('auth.enterCode')}
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <Input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="000000"
                      required
                      className="text-center text-xl tracking-wide max-w-[180px] input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-4">
                    For demo purposes, any 6-digit code will work
                  </p>
                  
                  {error && (
                    <motion.div 
                      className="bg-error/10 text-error text-sm p-3 rounded-lg mb-4 border border-error/20"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ai-secondary"
                      className="flex-1"
                      onClick={() => setShowTwoFactor(false)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="ai-gradient"
                      isLoading={isLoading}
                      className="flex-1"
                      glowing
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-display font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  {t('auth.login')}
                </h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label={t('auth.email')}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      leftIcon={
                        <IconContext.Provider value={{ className: "text-ai-blue" }}>
                          <RiIcons.RiMailLine />
                        </IconContext.Provider>
                      }
                      required
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                
                <div className="relative">
                  <Input
                    label={t('auth.password')}
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
                </div>
                
                <div className="flex items-center justify-between my-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="form-checkbox h-4 w-4 text-ai-blue rounded border-ai-blue/50 focus:ring-ai-blue/30 bg-dark-800"
                    />
                    <span className="text-sm text-gray-400">{t('auth.rememberMe')}</span>
                  </label>
                  
                  <Link to="/forgot-password" className="text-sm text-ai-blue hover:text-ai-teal transition-colors">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                
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
                  className="mt-6"
                  glowing
                >
                  {t('auth.login')}
                </Button>
                
                <p className="text-center text-sm text-gray-400 mt-4">
                  {t('auth.noAccount')}{' '}
                  <Link to="/signup" className="text-ai-blue hover:text-ai-teal transition-colors">
                    {t('auth.signup')}
                  </Link>
                </p>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 