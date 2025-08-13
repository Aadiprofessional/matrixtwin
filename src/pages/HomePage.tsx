import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiInstagram, FiTwitter, FiYoutube, FiGithub, FiLinkedin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { 
  HomeNavbar, 
  FeatureSection, 
  UseCasesSection, 
  ComparisonSection, 
  HeroBanner, 
  CallToAction, 
  FAQSection, 
  AnimatedGridBanner, 
  ModelsShowcaseSection, 
  CubeComponent 
} from '../components/landing';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  // FAQ data 
  const faqData = [ 
    { 
      question: t('homePage.faq.features.question', 'What features does MatrixTwin offer?'), 
      answer: t('homePage.faq.features.answer', 'MatrixTwin offers a comprehensive suite of digital construction tools including project management, digital twins, IoT integration, real-time analytics, forms & documentation, and team collaboration features.') 
    }, 
    { 
      question: t('homePage.faq.digitalTwins.question', 'How do digital twins help in construction projects?'), 
      answer: t('homePage.faq.digitalTwins.answer', 'Our advanced digital twin technology creates precise virtual replicas of physical construction sites, allowing for real-time monitoring, simulation, predictive analysis, and optimization of project workflows and resources.') 
    }, 
    { 
      question: t('homePage.faq.iotIntegration.question', 'How does the IoT integration work?'), 
      answer: t('homePage.faq.iotIntegration.answer', 'MatrixTwin seamlessly connects with IoT sensors on construction sites to monitor environmental conditions, equipment usage, material tracking, and safety parameters in real-time, providing instant alerts and comprehensive analytics.') 
    }, 
    { 
      question: t('homePage.faq.documentation.question', 'Can I create custom forms for my project documentation?'), 
      answer: t('homePage.faq.documentation.answer', 'Yes, MatrixTwin includes a powerful forms builder that allows you to create custom documentation templates for site diaries, inspections, safety reports, RFIs, and more, with automated workflows and approval processes.') 
    }, 
    { 
      question: t('homePage.faq.aiFeatures.question', 'How does AI enhance the digital construction process?'), 
      answer: t('homePage.faq.aiFeatures.answer', 'Our AI features analyze project data to identify potential delays, optimize resource allocation, enhance safety monitoring, detect construction anomalies, and provide actionable insights for better decision-making throughout the project lifecycle.') 
    }, 
    { 
      question: t('homePage.faq.enterprise.question', 'Do you offer enterprise solutions?'), 
      answer: t('homePage.faq.enterprise.answer', 'Yes, we offer enterprise plans with dedicated support, custom integrations, advanced security features, tailored training, and API access. Contact our sales team for a personalized demonstration.') 
    } 
  ];

  return (
    <div className={`min-h-screen overflow-hidden ${darkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Home Navbar */}
      <HomeNavbar />
      <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Video Background with Dark Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/digital-twin.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay */}
          <div className={`absolute inset-0 ${darkMode ? 'bg-black/50' : 'bg-black/30'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }} 
            className="max-w-3xl mx-auto" 
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6"> 
              <span className="hidden md:inline">{t('homePage.title', 'MatrixTwin')}<br />{t('homePage.titleSecondLine', 'Digital Construction Platform')}</span> 
              <span className="md:hidden">{t('homePage.titleMobile', 'MatrixTwin Platform')}</span> 
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto"> 
              <span className="hidden md:inline">{t('homePage.description', 'Trusted by construction leaders worldwide. Powered by advanced AI and digital twin technology. Create virtual replicas of your construction sites, monitor with IoT sensors, generate custom documentation, analyze real-time data, and collaborate with your team—all in one integrated platform.')}</span> 
              <span className="md:hidden">{t('homePage.descriptionMobile', 'Trusted by construction leaders worldwide. Create virtual replicas of your sites, monitor with IoT sensors, generate custom documentation, analyze real-time data, and collaborate with your team—all in one platform.')}</span> 
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"> 
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3, duration: 0.5 }} 
                className="w-full sm:w-auto" 
              > 
                <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-lg font-medium text-base md:text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300"> 
                  <span className="hidden sm:inline">{t('homePage.startManaging', 'Start managing projects')}</span> 
                  <span className="sm:hidden">{t('homePage.startManagingMobile', 'Get Started')}</span> 
                  <FiArrowRight className="ml-2" /> 
                </Link> 
              </motion.div> 
            </div> 
            <div className="flex items-center justify-center gap-8 text-gray-400 text-sm"> 
              <div className="flex items-center"> 
                <span>{t('homePage.projectCount', '500+ projects')}</span> 
              </div> 
              <div className="flex items-center"> 
                <span>{t('homePage.companyCount', '150+ companies')}</span> 
              </div> 
              <div className="flex items-center"> 
                <span>{t('homePage.foundedYear', 'Founded in 2022')}</span> 
              </div> 
            </div> 
          </motion.div> 
        </div> 
      </section>
      
      {/* Line separator */}
      <div className={`w-full h-px ${darkMode ? 'bg-white opacity-20' : 'bg-gray-300 opacity-40'}`}></div>
      
      {/* Feature Section */}
      <FeatureSection /> 
      
      {/* Use Cases Section */}
      <UseCasesSection /> 
      
      {/* Comparison Section */}
      <ComparisonSection /> 
      
      <ModelsShowcaseSection /> 

      <HeroBanner 
        title={t('homePage.heroBannerTitle', 'Powerful digital construction tools for every project')} 
        description={t('homePage.heroBannerDescription', "Skip the frustration of disconnected tools and outdated software. With MatrixTwin, you'll manage construction projects efficiently, monitor site progress with digital twins, track IoT sensors in real-time, create custom documentation, and collaborate seamlessly with your team.")} 
      /> 
      
      <CubeComponent /> 

      <AnimatedGridBanner 
        title={t('homePage.gridBannerTitle', "Don't settle for outdated and disconnected construction tools.")} 
        description={t('homePage.gridBannerDescription', "With MatrixTwin, you get the fastest, most advanced construction management platform. From digital twins to IoT integration, real-time analytics, custom documentation, and team collaboration—all powered by cutting-edge technology. Trusted by construction professionals, available to companies of all sizes. Don't miss out—get the most efficient construction management solution available.")} 
        buttonText={t('homePage.startCreating', 'Start managing projects')} 
        buttonLink="/signup" 
      /> 
      
      {/* FAQ Section */}
      <FAQSection 
        title={t('homePage.faqTitle', 'Frequently Asked Questions')} 
        faqs={faqData} 
      /> 
    </div> 
  );
};

export default HomePage;