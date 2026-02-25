import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserInfo } from '../utils/userInfo';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

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
  // Initialize selectedProject from localStorage if available
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(() => {
    try {
      const savedProject = localStorage.getItem('selectedProject');
      return savedProject ? JSON.parse(savedProject) : null;
    } catch (e) {
      console.error('Failed to parse selectedProject from localStorage', e);
      return null;
    }
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Wrapper for setSelectedProject to also update localStorage
  const setSelectedProject = (project: Project | null) => {
    setSelectedProjectState(project);
    if (project) {
      try {
        // Create a lightweight version of the project for storage to avoid QuotaExceededError
        // We exclude potentially large fields like base64 images or extensive descriptions
        const storageProject = {
          id: project.id,
          name: project.name,
          status: project.status,
          created_at: project.created_at,
          location: project.location,
          // Only store description if it's reasonably short
          description: project.description && project.description.length < 500 ? project.description : undefined,
          client: project.client,
          deadline: project.deadline,
          created_by: project.created_by,
          updated_at: project.updated_at,
          // Only store image_url if it's a regular URL (short), not a base64 string
          image_url: project.image_url && project.image_url.length < 2000 ? project.image_url : undefined
        };
        
        localStorage.setItem('selectedProject', JSON.stringify(storageProject));
      } catch (e) {
        // Log warning but don't crash the app if storage is full
        console.warn('Failed to persist selected project to localStorage:', e);
      }
    } else {
      localStorage.removeItem('selectedProject');
    }
  };

  const fetchProjects = async () => {
    if (!isAuthenticated && !getUserInfo()) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      // Prefer user from context, fallback to utils
      const currentUserId = user?.id || getUserInfo()?.id;
      
      if (!currentUserId) {
          console.log('No user ID found for fetching projects');
          return;
      }

      console.log('Fetching projects for user:', currentUserId);
      const data = await api.getProjects(currentUserId);

      if (Array.isArray(data)) {
        const transformedData = data.map((project: any) => ({
          ...project,
          created_at: project.created_at || project.createdAt || new Date().toISOString()
        }));
        setProjects(transformedData);
      } else if (data && Array.isArray(data.data)) {
        const transformedData = data.data.map((project: any) => ({
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

  // Sync selected project with URL
  useEffect(() => {
    const syncProjectWithUrl = async () => {
      const path = location.pathname;
      if (path.startsWith('/dashboard/')) {
        const match = path.match(/\/dashboard\/([^\/]+)/);
        const projectIdFromUrl = match ? match[1] : null;
        
        if (projectIdFromUrl) {
          // If the project is already selected, do nothing
          if (selectedProject && selectedProject.id === projectIdFromUrl) {
            return;
          }

          console.log(`Syncing URL project ID: ${projectIdFromUrl}`);

          // Try to find in existing projects list
          const project = projects.find(p => p.id === projectIdFromUrl);
          
          if (project) {
            console.log('Found project in list, setting selected.');
            setSelectedProject(project);
          } else if (!loading) {
            // Only try to fetch if we're not currently loading the list
            // OR if the list is loaded but doesn't contain the project (e.g. pagination or direct link)
            try {
              console.log(`Project ${projectIdFromUrl} not in list, fetching directly...`);
              const response = await api.getProject(projectIdFromUrl);
              const fetchedProject = response.data || response;
              
              if (fetchedProject) {
                // Ensure date formatting consistency
                const formattedProject = {
                  ...fetchedProject,
                  created_at: fetchedProject.created_at || fetchedProject.createdAt || new Date().toISOString()
                };
                console.log('Fetched project directly, setting selected.');
                setSelectedProject(formattedProject);
                
                // Optional: Add to projects list if not present
                setProjects(prev => {
                  if (!prev.find(p => p.id === formattedProject.id)) {
                    return [...prev, formattedProject];
                  }
                  return prev;
                });
              }
            } catch (error) {
              console.error(`Failed to fetch project ${projectIdFromUrl}:`, error);
              // Only redirect if we are sure the project doesn't exist or we can't access it
              // navigate('/projects');
            }
          }
        }
      }
    };

    syncProjectWithUrl();
  }, [location.pathname, projects, loading, selectedProject]);

  // Handle project selection and navigation
  const handleProjectSelection = (project: Project | null) => {
    setSelectedProject(project);
    if (project === null) {
      navigate('/projects');
    } else if (location.pathname === '/projects') {
      navigate(`/dashboard/${project.id}`);
    }
  };

  // Fetch projects on mount or when auth state changes
  useEffect(() => {
    if (isAuthenticated || getUserInfo()) {
        fetchProjects();
    } else {
        // Clear project data if not authenticated
        setProjects([]);
        // We don't clear selectedProject here to avoid flashing on refresh before auth check completes
        // But we should verify if the selected project belongs to the user when they log in
    }
  }, [isAuthenticated]);

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