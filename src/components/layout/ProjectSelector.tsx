import React from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { IconContext } from 'react-icons';
import { RiBuilding4Line, RiArrowDownSLine, RiArrowLeftLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProjectSelectorProps {
  collapsed?: boolean;
  mobile?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ collapsed = false, mobile = false }) => {
  const { selectedProject, setSelectedProject, projects, loading } = useProjects();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    try {
      // First check if the date string is valid
      if (!dateString) return 'No date';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    setIsOpen(false);
    navigate('/dashboard');
  };
  
  const handleBackToProjects = () => {
    setSelectedProject(null);
    navigate('/projects');
    setIsOpen(false);
  };
  
  const isProjectPage = location.pathname === '/projects';

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="animate-pulse flex items-center">
          <div className="h-8 w-8 bg-dark-700 rounded-lg"></div>
          {!collapsed && (
            <div className="ml-3 flex-1">
              <div className="h-4 bg-dark-700 rounded w-3/4"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2 rounded-lg bg-dark-800/50 border border-dark-700 hover:bg-dark-700 transition-colors ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 h-8 w-8 rounded-lg overflow-hidden">
            {selectedProject?.image_url ? (
              <img
                src={selectedProject.image_url}
                alt={selectedProject.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-ai-blue/10 flex items-center justify-center">
                <IconContext.Provider value={{ className: "text-ai-blue text-xl" }}>
                  <RiBuilding4Line />
                </IconContext.Provider>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="ml-3 truncate">
              <div className="text-sm font-medium text-white truncate">
                {selectedProject?.name || 'Select Project'}
              </div>
              {selectedProject && (
                <div className="text-xs text-gray-400">
                  Created: {formatDate(selectedProject.created_at)}
                </div>
              )}
            </div>
          )}
        </div>
        {!collapsed && (
          <IconContext.Provider value={{ className: "text-gray-400" }}>
            <RiArrowDownSLine className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </IconContext.Provider>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 right-4 top-full mt-2 z-50 bg-dark-800 rounded-lg border border-dark-700 shadow-lg overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto">
              {/* Back to Projects Button */}
              {!isProjectPage && (
                <button
                  onClick={handleBackToProjects}
                  className="w-full px-4 py-3 flex items-center text-left hover:bg-dark-700 transition-colors border-b border-dark-700"
                >
                  <IconContext.Provider value={{ className: "text-gray-400 mr-2" }}>
                    <RiArrowLeftLine />
                  </IconContext.Provider>
                  <span className="text-gray-300">Back to Projects</span>
                </button>
              )}
              
              {/* Projects List */}
              <div className="py-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors ${
                      selectedProject?.id === project.id ? 'bg-ai-blue/10 text-white' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                        {project.image_url ? (
                          <img
                            src={project.image_url}
                            alt={project.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-ai-blue/10 flex items-center justify-center">
                            <IconContext.Provider value={{ className: "text-ai-blue text-xl" }}>
                              <RiBuilding4Line />
                            </IconContext.Provider>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{project.name}</div>
                        <div className="text-xs text-gray-400 flex items-center space-x-2">
                          <span className="capitalize">{project.status.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="truncate">Created: {formatDate(project.created_at)}</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate">{project.location}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 