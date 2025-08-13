import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface FeatureCardProps {
  title: string;
  description: string;
  videoSrc?: string;
  imageSrc?: string;
  position: 'left' | 'right';
  index?: number;
}

const FeatureCard: React.FC<FeatureCardProps & { index?: number }> = ({ title, description, videoSrc, imageSrc, position, index }) => {
  const { darkMode } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Determine if this card should be square (1st and 4th cards)
  const isSquare = index === 0 || index === 3;
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.error("Error playing video:", error);
            });
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.3 }
    );
    
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`rounded-xl overflow-hidden h-full relative ${position === 'left' ? 'col-span-1' : 'col-span-1 md:col-span-2'}`}>
      {/* Outer layer - border with glow */}
      <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
        darkMode 
          ? 'border-white/10 shadow-blue-500/20' 
          : 'border-gray-300/30 shadow-gray-400/20'
      }`}></div>
      
      {/* Middle layer - subtle glow effect */}
      <div className={`absolute inset-[3px] rounded-lg bg-gradient-to-br ${
        darkMode 
          ? 'from-white/10 to-transparent' 
          : 'from-gray-200/30 to-transparent'
      }`}></div>
      
      {/* Inner layer - glass effect with padding */}
      <div className={`relative m-2 rounded-lg overflow-hidden backdrop-blur-lg h-[calc(100%-16px)] border shadow-inner ${
        darkMode 
          ? 'bg-black/30 border-white/20 shadow-white/10' 
          : 'bg-white/30 border-gray-300/20 shadow-gray-300/10'
      }`}>
        {/* Content container with glass morphism */}
        <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${
          darkMode 
            ? 'from-white/5 to-transparent' 
            : 'from-gray-100/20 to-transparent'
        }`}></div>
        
        <div className={`relative z-10 ${isSquare ? 'aspect-[2/1] md:aspect-square' : 'aspect-[2/1] md:aspect-video'}`}>
          {videoSrc ? (
            <video 
              ref={videoRef}
              className="w-full h-full object-cover" 
              loop 
              muted 
              playsInline
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : imageSrc ? (
            <img 
              src={imageSrc} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="relative z-10 p-6">
          <h3 className={`text-xl font-semibold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-800'
          }`}>{title}</h3>
          <p className={`${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>{description}</p>
        </div>
      </div>
    </div>
  );
};

const FeatureSection: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  return (
    <section className={`py-20 ${
      darkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-4xl font-bold mb-10 text-left ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>{t('featureSection.title', 'Why construction leaders choose MatrixTwin')}</h2>
        <p className={`text-xl mb-10 text-left max-w-3xl ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>{t('featureSection.description', 'Tired of disconnected systems and outdated construction software? See how our digital construction platform transforms project delivery with integrated solutions.')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title={t('featureSection.digitalTwins.title', 'Digital Twin Technology')}
            description={t('featureSection.digitalTwins.description', 'Create precise virtual replicas of your construction projects for real-time monitoring, simulation, and optimization. Visualize progress and identify issues before they impact your timeline.')}
            videoSrc="/videos/digital-twin.mp4"
            position="left"
            index={0}
          />
          <FeatureCard 
            title={t('featureSection.projectManagement.title', 'Integrated Project Management')}
            description={t('featureSection.projectManagement.description', 'Streamline workflows with our comprehensive project management tools. Track tasks, manage resources, monitor budgets, and coordinate teams from a single unified platform.')}
            videoSrc="/videos/project-management.mp4"
            position="right"
            index={1}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <FeatureCard 
            title={t('featureSection.iotIntegration.title', 'IoT Sensor Integration')}
            description={t('featureSection.iotIntegration.description', 'Monitor environmental conditions, equipment usage, and safety parameters with real-time IoT sensor data. Receive instant alerts and comprehensive analytics to prevent issues before they occur.')}
            videoSrc="/videos/iot-integration.mp4"
            position="right"
            index={2}
          />
          <FeatureCard 
            title={t('featureSection.documentation.title', 'Smart Documentation & Forms')}
            description={t('featureSection.documentation.description', 'Create custom documentation templates for site diaries, inspections, safety reports, and more with our powerful forms builder. Streamline approvals and maintain comprehensive project records.')}
            videoSrc="/videos/documentation.mp4"
            position="left"
            index={3}
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;