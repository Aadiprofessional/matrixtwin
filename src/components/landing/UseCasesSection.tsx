import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface UseCaseTabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const UseCaseTab = ({ id, label, isActive, onClick }: UseCaseTabProps): React.ReactElement => {
  const { darkMode } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-l-2 text-left ${
        isActive 
          ? 'border-indigo-500' + (darkMode ? ' text-white' : ' text-gray-900')
          : 'border-transparent' + (darkMode ? ' text-gray-400 hover:text-gray-300' : ' text-gray-600 hover:text-gray-800')
      }`}
    >
      {label}
    </button>
  );
};

const UseCasesSection: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('digital-twins');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentPlayPromise, setCurrentPlayPromise] = useState<Promise<void> | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  const useCases = [
    { id: 'digital-twins', label: t('useCasesSection.digitalTwins', 'Digital Twins'), route: '/digital-twins' },
    { id: 'project-management', label: t('useCasesSection.projectManagement', 'Project Management'), route: '/projects' },
    { id: 'iot-integration', label: t('useCasesSection.iotIntegration', 'IoT Integration'), route: '/iot-dashboard' },
    { id: 'documentation', label: t('useCasesSection.documentation', 'Documentation & Forms'), route: '/forms' },
    { id: 'team-collaboration', label: t('useCasesSection.teamCollaboration', 'Team Collaboration'), route: '/team' },
    { id: 'analytics', label: t('useCasesSection.analytics', 'Analytics & Insights'), route: '/dashboard' },
  ];
  
  // Video/image content for each tab
  const tabContent: Record<string, string> = {
    'digital-twins': '/videos/digital-twin.mp4',
    'project-management': '/videos/project-management.mp4',
    'iot-integration': '/videos/iot-integration.mp4',
    'documentation': '/videos/documentation.mp4',
    'team-collaboration': '/videos/team-collaboration.mp4',
    'analytics': '/videos/analytics.mp4',
  };
  
  // Auto-switch tabs when video ends
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handleVideoEnd = () => {
      // Find current index and move to next tab
      const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
      const nextIndex = (currentIndex + 1) % useCases.length;
      setSlideDirection('right');
      setActiveTab(useCases[nextIndex].id);
    };
    
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnd);
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [activeTab, useCases]);
  
  // Safe video play function
  const safePlayVideo = async () => {
    if (videoRef.current) {
      try {
        // Wait for any existing play promise to resolve
        if (currentPlayPromise) {
          await currentPlayPromise.catch(() => {});
        }
        
        const playPromise = videoRef.current.play();
        setCurrentPlayPromise(playPromise);
        
        if (playPromise !== undefined) {
          await playPromise;
        }
      } catch (error) {
        // Ignore play interruption errors
        console.log('Video play interrupted:', error);
      }
    }
  };

  // Safe video pause function
  const safePauseVideo = async () => {
    if (videoRef.current) {
      try {
        // Wait for any existing play promise to resolve before pausing
        if (currentPlayPromise) {
          await currentPlayPromise.catch(() => {});
        }
        videoRef.current.pause();
      } catch (error) {
        console.log('Video pause error:', error);
      }
    }
  };

  // Play video when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            safePlayVideo();
          } else {
            safePauseVideo();
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
  }, [currentPlayPromise]);
  
  // Auto-switch tabs every 10 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
      const nextIndex = (currentIndex + 1) % useCases.length;
      setSlideDirection('right');
      setActiveTab(useCases[nextIndex].id);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab, useCases]);

  // Navigation functions for mobile
  const goToPrevious = () => {
    const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
    const prevIndex = currentIndex === 0 ? useCases.length - 1 : currentIndex - 1;
    setSlideDirection('left');
    setActiveTab(useCases[prevIndex].id);
  };

  const goToNext = () => {
    const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
    const nextIndex = (currentIndex + 1) % useCases.length;
    setSlideDirection('right');
    setActiveTab(useCases[nextIndex].id);
  };

  return (
    <section className={`py-20 ${
      darkMode 
        ? 'bg-gradient-to-b from-black to-gray-900' 
        : 'bg-gradient-to-b from-gray-50 to-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`text-4xl md:text-5xl font-bold mb-6 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {t('useCasesSection.title', 'Made for construction professionals.')}<br />
              {t('useCasesSection.subtitle', 'See how industry leaders use our')}<br />
              {t('useCasesSection.digitalTools', 'digital platform.')}
            </motion.h2>
            
            <div className="flex flex-col space-y-4">
              {useCases.map((useCase) => (
                <div key={useCase.id} className="flex items-center">
                  <UseCaseTab
                    id={useCase.id}
                    label={useCase.label}
                    isActive={activeTab === useCase.id}
                    onClick={() => setActiveTab(useCase.id)}
                  />
                  {activeTab === useCase.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6"
                    >
                      <Link 
                        to={useCase.route}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg shadow-indigo-500/20 font-medium inline-flex items-center gap-2 hover:scale-105 transform text-sm"
                      >
                        {t('homePage.useCasesSection.tryNow', 'Try now')} →
                      </Link>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative rounded-lg overflow-hidden aspect-square">
            {/* Outer layer - border with glow */}
            <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
              darkMode 
                ? 'border-white/10 shadow-blue-500/20' 
                : 'border-gray-200/50 shadow-blue-500/10'
            }`}></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className={`absolute inset-[3px] rounded-lg bg-gradient-to-br ${
              darkMode 
                ? 'from-white/10 to-transparent' 
                : 'from-gray-100/30 to-transparent'
            }`}></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className={`absolute inset-[6px] backdrop-blur-lg rounded-lg border shadow-inner ${
              darkMode 
                ? 'bg-black/30 border-white/20 shadow-white/10' 
                : 'bg-white/30 border-gray-200/30 shadow-gray-500/10'
            }`}></div>
            
            {/* Content container with glass morphism */}
            <div className={`absolute inset-[6px] bg-gradient-to-br opacity-80 rounded-lg ${
              darkMode 
                ? 'from-white/5 to-transparent' 
                : 'from-gray-100/10 to-transparent'
            }`}></div>
            
            <div className="relative z-10 p-4 h-full flex items-center justify-center">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full"
              >
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg" 
                  autoPlay 
                  muted 
                  playsInline
                >
                  <source src={tabContent[activeTab]} type="video/mp4" />
                </video>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
         <div className="md:hidden">
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             viewport={{ once: true }}
             className={`text-3xl font-bold mb-8 text-center ${
               darkMode ? 'text-white' : 'text-gray-900'
             }`}
           >
             {t('useCasesSection.title', 'Made for every creator.')}<br />
             {t('useCasesSection.subtitle', 'See how pros use our')}<br />
             {t('useCasesSection.aiTools', 'AI tools.')}
           </motion.h2>

           {/* Mobile Use Cases - Horizontal Row with Navigation */}
           <div className="relative mb-6">
             {/* Navigation Buttons */}
             <button
               onClick={goToPrevious}
               className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                 darkMode 
                   ? 'bg-black/50 text-white hover:bg-black/70' 
                   : 'bg-white/50 text-gray-900 hover:bg-white/70'
               }`}
             >
               <FiChevronLeft className="w-5 h-5" />
             </button>
             
             <button
               onClick={goToNext}
               className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
                 darkMode 
                   ? 'bg-black/50 text-white hover:bg-black/70' 
                   : 'bg-white/50 text-gray-900 hover:bg-white/70'
               }`}
             >
               <FiChevronRight className="w-5 h-5" />
             </button>

             {/* Active Use Case Display - Center Only */}
              <div className="flex justify-center px-8 overflow-hidden">
                <motion.div 
                  key={activeTab}
                  initial={{ 
                    x: slideDirection === 'right' ? 300 : -300,
                    opacity: 0
                  }}
                  animate={{ 
                    x: 0,
                    opacity: 1
                  }}
                  exit={{ 
                    x: slideDirection === 'right' ? -300 : 300,
                    opacity: 0
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 20,
                    duration: 0.3
                  }}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 min-w-[260px] max-w-[280px] ${
                    darkMode 
                      ? 'border-indigo-500 bg-gray-800/50' 
                      : 'border-indigo-500 bg-indigo-50'
                  }`}
                >
                 <div className="flex flex-row items-center justify-center gap-4">
  <h3 className={`text-sm font-medium ${
    darkMode ? 'text-white' : 'text-gray-900'
  }`}>
    {useCases.find(useCase => useCase.id === activeTab)?.label}
  </h3>

  <Link 
    to={useCases.find(useCase => useCase.id === activeTab)?.route || '#'}
    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg shadow-indigo-500/20 font-medium inline-flex items-center gap-2 hover:scale-105 transform"
  >
    {t('homePage.useCasesSection.tryNow', 'Try now')} →
  </Link>
</div>

                </motion.div>
              </div>
           </div>

           {/* Mobile Video Container */}
           <div className="relative rounded-lg overflow-hidden aspect-square">
             {/* Outer layer - border with glow */}
             <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
               darkMode 
                 ? 'border-white/10 shadow-blue-500/20' 
                 : 'border-gray-200/50 shadow-blue-500/10'
             }`}></div>
             
             {/* Middle layer - subtle glow effect */}
             <div className={`absolute inset-[3px] rounded-lg bg-gradient-to-br ${
               darkMode 
                 ? 'from-white/10 to-transparent' 
                 : 'from-gray-100/30 to-transparent'
             }`}></div>
             
             {/* Inner layer - glass effect with backdrop blur */}
             <div className={`absolute inset-[6px] backdrop-blur-lg rounded-lg border shadow-inner ${
               darkMode 
                 ? 'bg-black/30 border-white/20 shadow-white/10' 
                 : 'bg-white/30 border-gray-200/30 shadow-gray-500/10'
             }`}></div>
             
             {/* Content container with glass morphism */}
             <div className={`absolute inset-[6px] bg-gradient-to-br opacity-80 rounded-lg ${
               darkMode 
                 ? 'from-white/5 to-transparent' 
                 : 'from-gray-100/10 to-transparent'
             }`}></div>
             
             <div className="relative z-10 p-4 h-full flex items-center justify-center overflow-hidden">
               <motion.div
                 key={activeTab}
                 initial={{ 
                   x: slideDirection === 'right' ? '100%' : '-100%',
                   opacity: 0
                 }}
                 animate={{ 
                   x: 0,
                   opacity: 1
                 }}
                 exit={{ 
                   x: slideDirection === 'right' ? '-100%' : '100%',
                   opacity: 0
                 }}
                 transition={{ 
                   type: "spring",
                   stiffness: 400,
                   damping: 18,
                   duration: 0.35
                 }}
                 className="w-full h-full"
               >
                 <video 
                   ref={videoRef}
                   className="w-full h-full object-cover rounded-lg" 
                   autoPlay 
                   muted 
                   playsInline
                 >
                   <source src={tabContent[activeTab]} type="video/mp4" />
                 </video>
               </motion.div>
             </div>
           </div>
         </div>
      </div>
    </section>
  );
};

export default UseCasesSection;