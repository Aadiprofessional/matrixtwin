import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  faqs: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ title, faqs }) => {
  const { darkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={`py-12 md:py-20 ${
      darkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={`text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </motion.h2>
        
        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`border-b pb-2 ${
                darkMode ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-start md:items-center justify-between py-3 md:py-4 text-left focus:outline-none min-h-[48px]"
              >
                <span className={`text-base md:text-lg font-medium pr-4 leading-relaxed ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{faq.question}</span>
                <span className="ml-2 md:ml-6 flex-shrink-0 mt-1 md:mt-0">
                  <svg
                    className={`h-6 w-6 transform ${openIndex === index ? 'rotate-180' : 'rotate-0'} transition-transform duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100 pb-3 md:pb-4' : 'max-h-0 opacity-0'}`}
              >
                <p className={`text-sm md:text-base leading-relaxed ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;