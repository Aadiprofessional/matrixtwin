import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  icon: React.ReactNode;
}

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  description: string;
  modelName: string;
  imageSrc?: string;
  imageAlt?: string;
  videoSrc?: string;
  isReversed?: boolean;
  hasPlayButton?: boolean;
  hasSpeakerButton?: boolean;
  bgStyle?: React.CSSProperties;
}

// Feature section component for model capabilities
const FeatureSection: React.FC<FeatureSectionProps> = ({ 
  title, 
  subtitle, 
  description, 
  modelName, 
  imageSrc, 
  imageAlt, 
  videoSrc,
  isReversed = false,
  hasPlayButton = false,
  hasSpeakerButton = false,
  bgStyle,
}) => {
  const { darkMode } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="py-16 md:py-28 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
          {/* Text content */}
          <motion.div 
            className="lg:w-1/2 space-y-6"
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="text-purple-500 font-medium uppercase tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {modelName}
            </motion.div>
            <motion.h2 
              className={`text-4xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {title}
            </motion.h2>
            <motion.p 
              className={`text-lg leading-relaxed ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {description}
            </motion.p>
          </motion.div>
          
          {/* Media content */}
          <motion.div 
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Glass card effect */}
            <div className="relative rounded-xl overflow-hidden">
              {/* Outer layer - border with glow */}
              <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
                darkMode 
                  ? 'border-white/40 shadow-blue-500/20' 
                  : 'border-gray-300/60 shadow-gray-400/20'
              }`}></div>
              
              {/* Middle layer - subtle glow effect */}
              <div className={`absolute inset-[3px] rounded-lg bg-gradient-to-br ${
                darkMode 
                  ? 'from-white/10 to-transparent' 
                  : 'from-gray-200/30 to-transparent'
              }`}></div>
              
              {/* Inner layer - glass effect with backdrop blur */}
              <div className={`absolute inset-[6px] backdrop-blur-lg rounded-lg border shadow-inner ${
                darkMode 
                  ? 'bg-black/30 border-white/20 shadow-white/10' 
                  : 'bg-white/30 border-gray-300/20 shadow-gray-300/10'
              }`}></div>
              
              {/* Content container with glass morphism */}
              <div className={`absolute inset-[6px] bg-gradient-to-br opacity-80 rounded-lg ${
                darkMode 
                  ? 'from-white/5 to-transparent' 
                  : 'from-gray-100/20 to-transparent'
              }`}></div>
              
              <div className="relative z-10 p-4 flex justify-center items-center">
                <div className="flex items-center justify-center w-full relative">
                  {/* Full width image */}
                  <div className="w-full relative">
                    {imageSrc && (
                      <img src={imageSrc} alt={imageAlt || title} className="rounded-lg w-full object-cover h-48 md:h-96" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

interface ModelItem {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
}

const ModelsShowcaseSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeModel, setActiveModel] = useState(0);

  const models: ModelItem[] = [
    {
      id: 'digital-twin',
      title: t('modelsShowcase.digitalTwin.title', 'Digital Twin Technology'),
      description: t('modelsShowcase.digitalTwin.description', 'Create virtual replicas of your construction sites for real-time monitoring, simulation, and optimization.'),
      imageSrc: '/images/digital-twin.svg',
    },
    {
      id: 'project-management',
      title: t('modelsShowcase.projectManagement.title', 'Project Management'),
      description: t('modelsShowcase.projectManagement.description', 'Streamline your construction workflows with our integrated project management tools.'),
      imageSrc: '/images/project-management.svg',
    },
    {
      id: 'iot-integration',
      title: t('modelsShowcase.iotIntegration.title', 'IoT Integration'),
      description: t('modelsShowcase.iotIntegration.description', 'Connect and monitor IoT sensors across your construction sites for real-time data and insights.'),
      imageSrc: '/images/iot-integration.svg',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModel((prev) => (prev + 1) % models.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [models.length]);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('modelsShowcase.title', 'Advanced Construction Models')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('modelsShowcase.subtitle', 'Explore our suite of digital construction tools designed to transform your workflow')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Model Selection */}
          <div className="lg:col-span-4 space-y-6">
            {models.map((model, index) => (
              <div 
                key={model.id}
                className={`cursor-pointer p-6 rounded-xl transition-all duration-300 ${activeModel === index ? 'bg-white dark:bg-gray-800 shadow-lg' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
                onClick={() => setActiveModel(index)}
              >
                <h3 className={`text-xl font-semibold mb-2 ${activeModel === index ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {model.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {model.description}
                </p>
              </div>
            ))}
          </div>

          {/* Model Display */}
          <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl h-[500px]">
            <motion.div
              key={activeModel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <img 
                src={models[activeModel].imageSrc} 
                alt={models[activeModel].title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelsShowcaseSection;