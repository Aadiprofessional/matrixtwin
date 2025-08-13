import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiImage, FiVideo, FiFileText, FiMic, FiShield, FiArrowRight, FiSend, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

// Declare the spline-viewer custom element globally
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        url?: string;
        'events-target'?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

const CubeComponent: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    // Dynamically load the Spline viewer script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js';
    document.head.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

 

  return (
    <div className={`relative w-full min-h-[700px] lg:h-[700px] overflow-hidden ${
      darkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Background */}
      <div className={`absolute inset-0 ${
        darkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        {/* Simple line of light from corner at 75 degrees - responsive */}
        <div 
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r to-transparent ${
            darkMode ? 'from-white/40' : 'from-gray-400/40'
          }`}
          style={{
            width: '80%',
            transformOrigin: 'left bottom',
            transform: 'rotate(75deg)'
          }}
        ></div>
        
        {/* Mobile-specific light effect */}
        <div 
          className={`lg:hidden absolute bottom-0 left-0 h-0.5 bg-gradient-to-r to-transparent ${
            darkMode ? 'from-white/30' : 'from-gray-400/30'
          }`}
          style={{
            width: '60%',
            transformOrigin: 'left bottom',
            transform: 'rotate(60deg)'
          }}
        ></div>
        
        {/* Torch effect - light beam from top right to bottom left */}
        <div 
          className="absolute top-0 right-0 w-full h-full"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.05) 30%, transparent 60%)',
            clipPath: 'polygon(100% 0%, 70% 0%, 0% 100%, 30% 100%)'
          }}
        ></div>
        
        {/* Additional torch glow effect */}
        <div 
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl ${
            darkMode ? 'bg-white/10' : 'bg-gray-400/10'
          }`}
          style={{
            transform: 'translate(25%, -25%)'
          }}
        ></div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[700px] py-8 lg:py-0">
            
            {/* Mobile: Cube first, Desktop: Form first */}
            <motion.div 
              className={`order-2 lg:order-1 space-y-6 w-full flex justify-center ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Contact Form with Glass Effect */}
              <motion.div
                className={`backdrop-blur-md rounded-xl p-6 sm:p-8 shadow-2xl w-full max-w-md lg:max-w-lg xl:max-w-xl ${
                  darkMode 
                    ? 'bg-white/10 border border-white/20' 
                    : 'bg-black/10 border border-gray-300/20'
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.h2 
                  className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-center ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {t('contact.title')}
                </motion.h2>
                
                <motion.p 
                  className={`mb-6 text-sm sm:text-base text-center ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  {t('contact.description')}
                </motion.p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        placeholder={t('contact.form.namePlaceholder')}
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${
                          darkMode 
                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400' 
                            : 'bg-black/5 border border-gray-300/20 text-gray-700 placeholder-gray-500'
                        }`}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                  >
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        placeholder={t('contact.form.emailPlaceholder')}
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${
                          darkMode 
                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400' 
                            : 'bg-black/5 border border-gray-300/20 text-gray-700 placeholder-gray-500'
                        }`}
                        required
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  >
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder={t('contact.form.phonePlaceholder')}
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent backdrop-blur-sm transition-all duration-300 text-sm sm:text-base ${
                          darkMode 
                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400' 
                            : 'bg-black/5 border border-gray-300/20 text-gray-700 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <textarea
                      name="message"
                      placeholder={t('contact.form.messagePlaceholder')}
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent backdrop-blur-sm transition-all duration-300 resize-none text-sm sm:text-base ${
                        darkMode 
                          ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400' 
                          : 'bg-black/5 border border-gray-300/20 text-gray-700 placeholder-gray-500'
                      }`}
                      required
                    ></textarea>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 }}
                  >
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      <span>{t('contact.form.sendButton')}</span>
                      <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
            
            {/* Mobile: Cube on top, Desktop: Cube on right */}
           <motion.div 
  className="order-1 lg:order-2 relative h-[450px] sm:h-[500px] lg:h-[500px] flex items-center justify-center w-full max-w-[120%] sm:max-w-[100%] lg:max-w-none mx-auto lg:mx-0"
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, delay: 0.4 }}
>
  <div className="w-full h-full scale-[0.85] sm:scale-[0.85] lg:scale-100 flex items-center justify-center">
    {React.createElement('spline-viewer', {
      url: '/cube.splinecode',
      style: {
        width: '100%',
        height: '100%',
        background: 'transparent',
      },
    })}
  </div>
</motion.div>

            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CubeComponent;