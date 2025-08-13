import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CallToActionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const CallToAction: React.FC<CallToActionProps> = ({ 
  title, 
  description, 
  buttonText, 
  buttonLink 
}) => {
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-xl overflow-hidden">
          {/* Glass card effect */}
          <div className="absolute inset-0 border border-white/10 rounded-xl shadow-lg shadow-blue-500/10"></div>
          <div className="absolute inset-[1px] rounded-lg bg-gradient-to-br from-gray-900 to-black"></div>
          <div className="absolute inset-[1px] backdrop-blur-sm bg-black/50 rounded-lg border border-white/5 shadow-inner shadow-white/5"></div>
          
          <div className="relative z-10 p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">{description}</p>
              
              <Link 
                to={buttonLink} 
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300"
              >
                {buttonText} <span className="ml-2">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;