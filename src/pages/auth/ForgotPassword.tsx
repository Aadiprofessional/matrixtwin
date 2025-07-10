import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

// Import MatrixAI Logo
import MatrixAILogo from '../../assets/MatrixAILogo.png';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to process request');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 bg-ai-dots">
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

      <div className="w-full max-w-md p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow bg-dark-950/40 backdrop-blur-sm">
            {success ? (
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
                <h2 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  Check Your Email
                </h2>
                <p className="text-gray-400 mb-4">
                  If an account exists with the email you provided, you will receive password reset instructions.
                </p>
                <Link to="/login">
                  <Button variant="ai-secondary">
                    Return to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                  Reset Password
                </h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Email Address"
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
                  Send Reset Instructions
                </Button>

                <p className="text-center text-sm text-gray-400 mt-4">
                  Remember your password?{' '}
                  <Link to="/login" className="text-ai-blue hover:text-ai-teal transition-colors">
                    Sign In
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

export default ForgotPassword; 