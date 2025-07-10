import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserInfo } from '../utils/userInfo';

interface Project {
  id: string;
  name: string;
  status: string;
  image_url?: string;
  created_at: string;
  location: string;
  description?: string;
  client?: string;
  deadline?: string;
  created_by?: string;
  updated_at?: string;
}

export const ProjectContext = createContext<{
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
} | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const userInfo = getUserInfo();
      if (!userInfo) return;

      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects/assigned?creator_uid=${userInfo.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedData = data.map((project: any) => ({
          ...project,
          created_at: project.created_at || project.createdAt || new Date().toISOString()
        }));
        setProjects(transformedData);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent direct URL access to dashboard with project ID
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/') && !selectedProject) {
      navigate('/projects');
    }
  }, [location.pathname, selectedProject, navigate]);

  // Handle project selection and navigation
  const handleProjectSelection = (project: Project | null) => {
    setSelectedProject(project);
    if (project === null) {
      navigate('/projects');
    } else if (location.pathname === '/projects') {
      navigate('/dashboard');
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <ProjectContext.Provider 
      value={{ 
        selectedProject, 
        setSelectedProject: handleProjectSelection, 
        projects, 
        loading, 
        fetchProjects 
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}; 