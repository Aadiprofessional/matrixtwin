import React, { useState, useEffect } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { RiBuilding4Line } from 'react-icons/ri';

interface ModuleProjectSelectorProps {
  className?: string;
}

export const ModuleProjectSelector: React.FC<ModuleProjectSelectorProps> = ({ className = '' }) => {
  const { selectedProject, projects } = useProjects();
  const [localSelectedProject, setLocalSelectedProject] = useState<any>(selectedProject || null);

  // Initialize selectedProject based on selectedProject or first project in list
  useEffect(() => {
    if (selectedProject) {
      setLocalSelectedProject(selectedProject);
    } else if (projects.length > 0 && !localSelectedProject) {
      setLocalSelectedProject(projects[0]);
    }
  }, [selectedProject, projects]);

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 py-2 px-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
        <div className="flex items-center gap-2">
          {localSelectedProject?.image ? (
            <img
              src={localSelectedProject.image}
              alt={localSelectedProject.name}
              className="w-6 h-6 rounded-md object-cover"
            />
          ) : (
            <RiBuilding4Line className="text-lg" />
          )}
          <span className="font-medium text-sm truncate max-w-[150px]">
            {localSelectedProject?.name || "No Project Selected"}
          </span>
        </div>
      </div>
      <select
        value={localSelectedProject?.id || ''}
        onChange={(e) => {
          const project = projects.find(p => p.id === e.target.value);
          setLocalSelectedProject(project || null);
        }}
        className={`form-select bg-dark-800 border-dark-700 text-white rounded-lg ${className}`}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}; 