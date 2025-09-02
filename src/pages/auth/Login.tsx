import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { Turnstile } from '@marsidev/react-turnstile';

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
  const [showTokenExpiredMessage, setShowTokenExpiredMessage] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const turnstileRef = useRef<any>(null);
  
  const { setUser, setIsAuthenticated, verifyTwoFactor, isAuthenticated } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're in localhost/development environment
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === '0.0.0.0';

  // Handle pre-filled credentials from signup
  useEffect(() => {
    const state = location.state as any;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    if (state?.showEmailVerificationAlert && state?.alertMessage) {
      setShowAlert(true);
      setAlertMessage(state.alertMessage);
    }
    
    // Check if user was redirected here due to token expiration
    const urlParams = new URLSearchParams(window.location.search);
    const tokenExpired = urlParams.get('tokenExpired');
    if (tokenExpired === 'true') {
      setShowTokenExpiredMessage(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    // Check for OAuth redirect parameters in URL
    const hasOAuthParams = window.location.hash.includes('access_token') || 
                          window.location.search.includes('access_token');
    
    // If we detect OAuth parameters, we're in a redirect flow
    if (hasOAuthParams) {
      console.log('Detected OAuth redirect parameters, checking session...');
      // We'll let the AuthContext handle the session setup
      // Just show loading state until that's complete
      setIsLoading(true);
      return;
    }
    
    if (isAuthenticated) {
      console.log('User detected, redirecting to dashboard');
      navigate('/projects');
    }
    
    // Only clear auth data if user is not already authenticated
    if (!isAuthenticated) {
      console.log('Clearing existing auth data for fresh login...');
      localStorage.removeItem('auth.user');
      localStorage.removeItem('auth.session');
      sessionStorage.removeItem('login_success');
    }
    
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
  }, [isAuthenticated, navigate]);
  
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
            refresh_token: hashParams.get('refresh_token') || ''
          });
          
          if (!error) {
            // Redirect to reset password page
            navigate('/reset-password');
          }
        }
      }
    };
    
    checkPasswordReset();
  }, [navigate]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('auth.emailRequired') + ' and ' + t('auth.passwordRequired'));
      return;
    }

    // Skip Turnstile validation for localhost
    if (!isLocalhost && !turnstileToken) {
      setError('Please complete the Turnstile verification');
      return;
    }

    try {
      console.log('Login attempt starting with:', email);
      
      // Clear any previous errors
      setError(null);
      setIsLoading(true);
      
      // Make API call to the remote server (same as other pages)
      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, turnstileToken })
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
      
      // Reset Turnstile on error (only if not localhost)
      if (!isLocalhost && turnstileRef.current) {
        turnstileRef.current.reset();
        setTurnstileToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsLoading(true);
      
      await verifyTwoFactor(twoFactorCode);
      
      console.log('Two-factor verification successful');
      setLoginSuccess(true);
      
      // Navigate to projects page
      setTimeout(() => {
        navigate('/projects', { replace: true });
      }, 500);
      
    } catch (err) {
      const error = err as Error;
      console.error('Two-factor verification failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw new Error(error.message);
      
      alert('Password reset email sent! Check your inbox.');
      
    } catch (err) {
      const error = err as Error;
      console.error('Password reset failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
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

  if (showTwoFactor) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Background Video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.3)' }}
          >
            <source src={BackgroundVideo} type="video/mp4" />
          </video>
        </div>
        
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
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-md mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow bg-dark-950/40 backdrop-blur-sm">
              <div className="p-8">
                <div className="text-center mb-8">
                  <img src={MatrixAILogo} alt="MatrixAI Logo" className="h-16 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {t('auth.twoFactorAuth')}
                  </h1>
                  <p className="text-white/80">
                    {t('auth.enterVerificationCode')}
                  </p>
                </div>

                <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
                  <div>
                    <Input
                      type="text"
                      placeholder={t('auth.verificationCode')}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.verifying') : t('auth.verify')}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowTwoFactor(false)}
                    className="text-white/80 hover:text-white text-sm"
                  >
                    {t('auth.backToLogin')}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{ filter: 'brightness(2)' }}
        >
          <source src={BackgroundVideo} type="video/mp4" />
        </video>
      </div>
      
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
      
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          title={i18n.language === 'en' ? 'العربية' : 'English'}
        >
          <RiIcons.RiGlobalLine className="w-5 h-5" />
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
          title={darkMode ? t('auth.lightMode') : t('auth.darkMode')}
        >
          {darkMode ? <RiIcons.RiSunLine className="w-5 h-5" /> : <RiIcons.RiMoonLine className="w-5 h-5" />}
        </button>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow bg-dark-950/40 backdrop-blur-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <img src={MatrixAILogo} alt="MatrixAI Logo" className="h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t('auth.welcomeBack')}
                </h1>
                <p className="text-white/80">
                  {t('auth.signInToContinue')}
                </p>
              </div>

              {/* Token Expired Message */}
              {showTokenExpiredMessage && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-6">
                  <p className="text-yellow-200 text-sm">
                    <RiIcons.RiInformationLine className="inline mr-2" />
                    Your session has expired. Please log in again to continue.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white placeholder:text-gray-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-ai-blue transition-colors"
                  >
                    {showPassword ? <RiIcons.RiEyeOffLine /> : <RiIcons.RiEyeLine />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center text-white/80">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-2 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                    />
                    {t('auth.rememberMe')}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-white/80 hover:text-white text-sm"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {loginSuccess && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-200 text-sm">{t('auth.loginSuccessful')}</p>
                  </div>
                )}

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
                        theme: darkMode ? 'dark' : 'light' 
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-white/80 text-sm">
                  {t('auth.dontHaveAccount')}{' '}
                  <Link to="/signup" className="text-blue-400 hover:text-blue-300">
                    {t('auth.signup')}
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;