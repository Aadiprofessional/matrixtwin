import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface HeroBannerProps {
  title: string;
  description: string;
  backgroundImage?: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ 
  title, 
  description, 
  backgroundImage 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();
  const { darkMode } = useTheme();



  useEffect(() => {
    // Auto-play video when component mounts and video ref is available
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <section className={`relative py-20 overflow-hidden min-h-screen ${
      darkMode 
        ? 'bg-black text-white' 
        : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 text-gray-900'
    }`}>
      {/* Background image with overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage} 
            alt={t('background')} 
            className="w-full h-full object-cover opacity-40"
          />
          <div className={`absolute inset-0 ${
            darkMode 
              ? 'bg-gradient-to-b from-black/70 to-black/90' 
              : 'bg-gradient-to-b from-white/70 to-white/90'
          }`}></div>
        </div>
      )}
      

      
      <div className="relative z-10 max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className={`text-lg md:text-xl mb-10 max-w-3xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {description}
          </p>
          
          {/* Video container with increased width */}
          <div className={`relative w-full max-w-9xl mx-auto rounded-lg overflow-hidden border shadow-2xl mb-10 ${
            darkMode 
              ? 'border-gray-700/50 shadow-purple-900/20' 
              : 'border-gray-300/50 shadow-blue-900/20'
          }`}>
            <div className="w-full h-64 md:h-96 lg:h-[500px]">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover" 
                loop 
                muted 
                playsInline
              >
                <source src="/videos/digital-twin.mp4" type="video/mp4" />
                {t('heroBanner.videoNotSupported', 'Your browser does not support the video tag')}
              </video>
              {/* Optional dark overlay */}
              <div className={`absolute inset-0 ${
                darkMode ? 'bg-black/20' : 'bg-white/10'
              }`}></div>
              
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlayPause}
                className={`absolute bottom-4 right-4 backdrop-blur-sm p-3 rounded-full transition-all duration-300 ${
                  darkMode 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-black/20 hover:bg-black/30'
                }`}
                aria-label={isPlaying ? t('heroBanner.pauseVideo', 'Pause video') : t('heroBanner.playVideo', 'Play video')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill={darkMode ? 'white' : 'white'} 
                  className="w-6 h-6"
                >
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
