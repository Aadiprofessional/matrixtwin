import React from 'react';
import { motion } from 'framer-motion';
import { RiAddLine, RiSearchLine, RiArrowRightDownLine } from 'react-icons/ri';
import { Button } from '../ui/Button';

interface ProjectsHeroProps {
  onCreateProject: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  isAdmin: boolean;
}

export const ProjectsHero: React.FC<ProjectsHeroProps> = ({
  onCreateProject,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  isAdmin
}) => {
  return (
    <div className="relative bg-portfolio-dark pt-32 pb-12 overflow-hidden border-b border-white/5">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      <div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* Title Section */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h5 className="text-portfolio-orange font-mono text-sm tracking-widest mb-4 uppercase">
                // Architecture & Construction
              </h5>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter leading-[0.9]">
                SELECTED <br />
                <span className="text-gray-800 text-stroke-white">WORKS</span>
              </h1>
            </motion.div>
          </div>

          {/* Description & Stats */}
          <div className="lg:col-span-4 mb-2">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md"
            >
              We craft digital experiences for the physical world. 
              Explore our portfolio of construction projects, digital twins, and architectural innovations.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <RiArrowRightDownLine className="text-4xl text-portfolio-orange animate-bounce" />
            </motion.div>
          </div>
        </div>

        {/* Control Bar - Architectural Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-24 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Search Module */}
            <div className="flex-1 border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-2 group hover:bg-white/5 transition-colors">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">01 / Search</label>
              <div className="flex items-center gap-3">
                <RiSearchLine className="text-xl text-gray-400 group-hover:text-portfolio-orange transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Type project name..."
                  className="bg-transparent border-none text-white text-xl placeholder-gray-700 focus:outline-none w-full"
                />
              </div>
            </div>

            {/* Filter Module */}
            <div className="flex-[2] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">02 / Filter</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'completed', 'planning'].map((status) => (
                  <button
                    key={status}
                    onClick={() => onFilterChange(status)}
                    className={`px-4 py-1 rounded-full text-sm border transition-all duration-300 ${
                      filterStatus === status
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-white'
                    }`}
                  >
                    {status.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Module */}
            {isAdmin && (
              <div className="flex-none p-6 flex items-center justify-center bg-portfolio-orange hover:bg-portfolio-orange-hover transition-colors cursor-pointer group" onClick={onCreateProject}>
                <div className="flex items-center gap-3">
                  <span className="text-black font-bold uppercase tracking-wider text-sm group-hover:scale-105 transition-transform">Create New</span>
                  <RiAddLine className="text-black text-xl bg-white/20 rounded-full p-0.5" />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
