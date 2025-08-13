import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface ComparisonItemProps {
  icon: React.ReactNode;
  text: string;
  isPositive?: boolean;
}

const ComparisonItem: React.FC<ComparisonItemProps> = ({ icon, text, isPositive = true }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span className={`flex-shrink-0 ${isPositive ? 'text-blue-500' : (darkMode ? 'text-gray-500' : 'text-gray-400')}`}>
        {icon}
      </span>
      <span className={`text-sm ${
        isPositive 
          ? (darkMode ? 'text-white' : 'text-gray-900') 
          : (darkMode ? 'text-gray-400' : 'text-gray-500')
      }`}>{text}</span>
    </div>
  );
};

const ComparisonSection: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  return (
    <section className={`py-20 ${
      darkMode ? 'bg-black' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={`text-4xl font-bold text-center mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {t('comparisonSection.title', 'Why use disconnected tools?')}<br />{t('comparisonSection.titleSecondLine', 'Integrate with MatrixTwin')}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className={`text-xl text-center mb-16 max-w-3xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {t('comparisonSection.description', 'Experience the difference between our integrated digital construction platform and traditional fragmented systems that create inefficiencies and data silos.')}
        </motion.p>
        
        <div className="md:grid md:grid-cols-2 md:gap-16 relative">
          {/* Left side - AI Video Generator */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden mb-8 md:mb-0"
          >
            {/* Outer layer - border with glow */}
            <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
              darkMode 
                ? 'border-white/40 shadow-blue-500/20' 
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
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/digital-construction-platform.svg" 
                  alt="Digital Construction Platform" 
                  className="w-full h-32 md:h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{t('comparisonSection.matrixTwinTitle', 'MatrixTwin\'s Integrated Platform')}</h3>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.integratedTools', 'Integrated Construction Tools')}
              />
              <p className={`text-sm ml-8 mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{t('comparisonSection.integratedToolsDesc', 'Access digital twins, project management, IoT monitoring, documentation, team collaboration, and analytics—all in one unified platform.')}</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.digitalTwinTechnology', 'Digital Twin Technology')}
              />
              <p className={`text-sm ml-8 mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{t('comparisonSection.digitalTwinTechnologyDesc', 'Create virtual replicas of your construction projects with real-time updates. Visualize, simulate, and optimize before physical implementation.')}</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.realTimeInsights', 'Real-Time Project Insights')}
              />
              <p className={`text-sm ml-8 mb-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{t('comparisonSection.realTimeInsightsDesc', 'Our platform processes complex construction data from multiple sources, providing actionable insights, predictive analytics, and real-time monitoring to keep your projects on track.')}</p>
            </div>
          </motion.div>
          
          {/* Mobile VS (below MatrixAI component) */}
          <div className="md:hidden relative flex items-center justify-center my-8">
            {/* Horizontal line */}
            <div className={`absolute w-full h-[1px] bg-gradient-to-r from-transparent to-transparent ${
              darkMode ? 'via-white/30' : 'via-gray-400/30'
            }`}></div>
            
            {/* VS in the middle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative z-10 px-6 py-3"
            >
              <span className={`text-2xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>vs</span>
            </motion.div>
          </div>
          
          {/* Desktop VS in the middle with vertical line */}
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 items-center justify-center z-20">
            {/* Vertical line */}
            <div className={`absolute h-full w-[1px] bg-gradient-to-b from-transparent to-transparent ${
              darkMode ? 'via-white/30' : 'via-gray-400/30'
            }`}></div>
            
            {/* VS in the middle */}
            <span className={`text-2xl font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>vs</span>
          </div>
          
          {/* Right side - Traditional Video Production */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden"
          >
            {/* Outer layer - border with glow */}
            <div className={`absolute inset-0 border-2 rounded-xl shadow-lg ${
              darkMode 
                ? 'border-white/40 shadow-blue-500/20' 
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
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/traditional-construction.svg" 
                  alt="Traditional Construction Methods" 
                  className="w-full h-32 md:h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{t('comparisonSection.traditionalTitle', 'Traditional Construction Methods')}</h3>
              
              <div className="space-y-4">
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.disconnectedSystems', 'Disconnected systems and data silos')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.manualDataEntry', 'Manual data entry and paperwork')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.limitedVisibility', 'Limited visibility into project status')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.delayedDecisions', 'Delayed decision-making due to outdated information')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.poorCommunication', 'Poor communication between stakeholders')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.costOverruns', 'Frequent cost overruns and schedule delays')}
                  isPositive={false}
                />
              </div>
            </div>
          </motion.div>
        </div>
        

      </div>
    </section>
  );
};

export default ComparisonSection;