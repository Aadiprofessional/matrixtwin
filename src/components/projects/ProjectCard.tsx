import React from 'react';
import { motion } from 'framer-motion';
import { 
  RiArrowRightLine,
  RiMapPinLine
} from 'react-icons/ri';

interface Project {
  id: string;
  name: string;
  image_url: string;
  location: string;
  client: string;
  deadline: string;
  description: string;
  status: string;
  progress?: number;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
  onClick: () => void;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  index = 0,
  onClick,
  onViewDetails
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-[4/3] mb-6">
        <div className="absolute inset-0 bg-portfolio-orange/0 group-hover:bg-portfolio-orange/10 transition-colors duration-500 z-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
        
        <img 
          src={project.image_url || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60'} 
          alt={project.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out filter grayscale-[30%] group-hover:grayscale-0"
        />
        
        {/* Hover Overlay Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 flex justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.();
            }}
            className="w-12 h-12 bg-portfolio-orange rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"
          >
            <RiArrowRightLine className="text-xl" />
          </button>
        </div>

        {/* Status Tag */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-mono uppercase tracking-widest">
            {project.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Content Info */}
      <div className="flex justify-between items-start border-t border-white/10 pt-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-portfolio-orange font-mono text-xs">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <h3 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-portfolio-orange transition-colors">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center text-gray-500 text-sm font-mono">
            <RiMapPinLine className="mr-2" />
            {project.location}
          </div>
        </div>
        
        <div className="text-right hidden sm:block">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Client</p>
          <p className="text-white text-sm font-medium">{project.client}</p>
        </div>
      </div>
    </motion.div>
  );
};
