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
  pendingRequestsCount?: number;
  onShowRequests?: () => void;
}

export const ProjectsHero: React.FC<ProjectsHeroProps> = ({
  onCreateProject,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  isAdmin,
  pendingRequestsCount = 0,
  onShowRequests
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
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      filterStatus === status 
                        ? 'bg-portfolio-orange text-black font-medium' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Module */}
            <div className="flex-1 p-6 flex items-center justify-end gap-4 bg-white/5 md:bg-transparent">
              {isAdmin && onShowRequests && (
                <Button 
                  variant="outline" 
                  onClick={onShowRequests}
                  className="relative group border-white/20 hover:border-portfolio-orange/50"
                >
                  <span>Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingRequestsCount}
                    </span>
                  )}
                </Button>
              )}
              
              {isAdmin && (
                <Button 
                  variant="ai-gradient" 
                  leftIcon={<RiAddLine />}
                  onClick={onCreateProject}
                  className="shadow-lg shadow-portfolio-orange/20"
                >
                  New Project
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
