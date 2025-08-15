import React, { useState, useEffect, useRef } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';

import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { setUserInfo } from '../../utils/userInfo';

// Import the video
import BackgroundVideo from '../../assets/back.mp4';
// Import MatrixAI Logo
import MatrixAILogo from '../../assets/MatrixAILogo.png';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  // Check if we're in localhost/development environment
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === '0.0.0.0';
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Skip Turnstile validation for localhost
    if (!isLocalhost && !turnstileToken) {
      setError('Please complete the Turnstile verification');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          turnstileToken
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store the token
        localStorage.setItem('token', data.token);
        
        // Store user info
        setUserInfo(data.user);
        
        setSignupSuccess(true);
        // Navigate to projects page after successful signup
        navigate('/projects');
      } else {
        throw new Error(data.message || 'Signup failed');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Signup failed with error:', error);
      setError(error.message);
      
      // Reset Turnstile on error (only if not localhost)
      if (!isLocalhost && turnstileRef.current) {
        turnstileRef.current.reset();
        setTurnstileToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    if (error && token) {
      setError('');
    }
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setError('Turnstile verification failed. Please try again.');
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
        className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-ai-purple/20 blur-3xl z-10"
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
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-ai-blue/20 blur-3xl z-10"
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
          <option value="es">🇪🇸 Español</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="ar">🇸🇦 العربية</option>
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
            {signupSuccess ? (
              <motion.div 
                className="py-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 text-success mb-4">
                  <IconContext.Provider value={{ className: "text-3xl" }}>
                    <RiIcons.RiMailSendLine />
                  </IconContext.Provider>
                </div>
                <h2 className="text-xl font-display font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  {emailSent ? 'Verification Email Sent' : t('auth.signupSuccess')}
                </h2>
                <p className="text-gray-400 mb-4">
                  {emailSent 
                    ? 'Please check your email to verify your account. After verification, an administrator will need to approve your account before you can log in.'
                    : t('auth.redirecting')}
                </p>
                <Button
                  variant="ai-secondary"
                  onClick={() => navigate('/login')}
                >
                  Return to Login
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-display font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  {t('auth.register')}
                </h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label={t('auth.name')}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder')}
                      leftIcon={
                        <IconContext.Provider value={{ className: "text-ai-blue" }}>
                          <RiIcons.RiUser3Line />
                        </IconContext.Provider>
                      }
                      required
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                    />
                  </div>
                  
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
                  
                  <div className="relative">
                    <Input
                      label={t('auth.passwordConfirm')}
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
                  
                  {/* Turnstile - Only show in production */}
                  {!isLocalhost && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.65, duration: 0.5 }} 
                      className="mt-6 flex justify-center"
                    >
                      <Turnstile 
                        ref={turnstileRef} 
                        siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY || "0x4AAAAAABrRlVmhV5uIuLDZ"}
                        onSuccess={handleTurnstileSuccess} 
                        onError={handleTurnstileError} 
                        options={{ 
                          theme: 'dark' 
                        }} 
                      />
                    </motion.div>
                  )}
                  
                  {/* Development notice for localhost */}
                  {isLocalhost && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.65, duration: 0.5 }} 
                      className="mt-6 flex justify-center"
                    >
                      <div className="text-sm text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-500/30">
                        Development Mode: Turnstile bypassed for localhost
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {error && (
                  <motion.div 
                    className="bg-error/10 text-error text-sm p-3 rounded-lg my-4 border border-error/20"
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
                  {t('auth.register')}
                </Button>
                
                <p className="text-center text-sm text-gray-400 mt-4">
                  {t('auth.haveAccount')}{' '}
                  <Link to="/login" className="text-ai-blue hover:text-ai-teal transition-colors">
                    {t('auth.login')}
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

export default Signup;