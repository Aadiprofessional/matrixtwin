import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
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

interface AnimatedGridBannerProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

const AnimatedGridBanner: React.FC<AnimatedGridBannerProps> = ({
  title,
  description,
  buttonText = 'Get Started',
  buttonLink = '/signup'
}) => {
  const { darkMode } = useTheme();
  
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
  
  // No need to generate grid cells as we're using separate horizontal and vertical lines
  
  return (
    <div className={`relative w-full overflow-hidden shadow-2xl mb-10 ${
      darkMode 
        ? 'shadow-blue-900/10 bg-black' 
        : 'shadow-blue-500/5 bg-white'
    }`}>
      {/* Spline 3D Background - Left aligned, 2x bigger, can overflow */}
      <div className="absolute top-0 left-0 w-[240%] h-[200%] z-0 overflow-visible" style={{ transform: 'translateX(-50%)' }}>
        <div className="w-full h-full"> 
          {React.createElement('spline-viewer', { 
            url: '/grid.splinecode', 
            style: { 
              width: '100%', 
              height: '100%', 
              background: 'transparent', 
            }, 
            'events-target': 'global', 
            'logo': false, 
            'loading-anim': false, 
            'loading-anim-type': 'none', 
            'auto-rotate': false, 
            'camera-controls': true 
          })} 
        </div>
      </div>
      
      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden z-5">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div 
              key={`h-${i}`}
              className={`h-px w-full ${
                darkMode ? 'bg-white/5' : 'bg-gray-400/10'
              }`}
              initial={{ 
                opacity: 0.03, 
                boxShadow: darkMode 
                  ? '0 0 1px rgba(255,255,255,0.05)' 
                  : '0 0 1px rgba(0,0,0,0.05)'
              }}
              animate={{ 
                opacity: [0.03, 0.07, 0.03],
                boxShadow: darkMode ? [
                  '0 0 1px rgba(255,255,255,0.05)', 
                  '0 0 2px rgba(255,255,255,0.1)', 
                  '0 0 1px rgba(255,255,255,0.05)'
                ] : [
                  '0 0 1px rgba(0,0,0,0.05)', 
                  '0 0 2px rgba(0,0,0,0.1)', 
                  '0 0 1px rgba(0,0,0,0.05)'
                ]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                repeatType: 'reverse',
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Vertical grid lines */}
        <div className="absolute inset-0 flex flex-row justify-between">
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div 
              key={`v-${i}`}
              className={`w-px h-full ${
                darkMode ? 'bg-white/5' : 'bg-gray-400/10'
              }`}
              initial={{ 
                opacity: 0.03, 
                boxShadow: darkMode 
                  ? '0 0 1px rgba(255,255,255,0.05)' 
                  : '0 0 1px rgba(0,0,0,0.05)'
              }}
              animate={{ 
                opacity: [0.03, 0.07, 0.03],
                boxShadow: darkMode ? [
                  '0 0 1px rgba(255,255,255,0.05)', 
                  '0 0 2px rgba(255,255,255,0.1)', 
                  '0 0 1px rgba(255,255,255,0.05)'
                ] : [
                  '0 0 1px rgba(0,0,0,0.05)', 
                  '0 0 2px rgba(0,0,0,0.1)', 
                  '0 0 1px rgba(0,0,0,0.05)'
                ]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                repeatType: 'reverse',
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay */}
        <motion.div 
          className={`absolute inset-0 ${
            darkMode 
              ? 'bg-gradient-to-b from-black/10 via-blue-900/5 to-black/20' 
              : 'bg-gradient-to-b from-white/10 via-blue-100/5 to-white/20'
          }`}
          animate={{
            background: darkMode ? [
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(29,78,216,0.05), rgba(0,0,0,0.2))',
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(37,99,235,0.07), rgba(0,0,0,0.2))',
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(29,78,216,0.05), rgba(0,0,0,0.2))'
            ] : [
              'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(219,234,254,0.05), rgba(255,255,255,0.2))',
              'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(191,219,254,0.07), rgba(255,255,255,0.2))',
              'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(219,234,254,0.05), rgba(255,255,255,0.2))'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        {/* Additional subtle glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 px-6 py-12 md:py-16 lg:py-20 text-center min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto ml-auto mr-6 text-right"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {title}
          </h2>
          
          {description && (
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {description}
            </p>
          )}
          
          {buttonText && (
            <Link 
              to={buttonLink} 
              className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-base shadow-lg transition-colors duration-300 ${
                darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {buttonText} <FiArrowRight className="ml-2" />
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedGridBanner;