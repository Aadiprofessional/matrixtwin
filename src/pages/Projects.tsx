import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { IconContext } from 'react-icons';
import { Dialog } from '../components/ui/Dialog';
import { useAuth } from '../contexts/AuthContext';
import { ProjectHeader } from '../components/layout/ProjectHeader';
import { ProjectsHero } from '../components/projects/ProjectsHero';
import { ProjectCard } from '../components/projects/ProjectCard';
import UserAvatar from '../components/common/UserAvatar';
import matrixAILogo from '../assets/MatrixAILogo.png';
import { getUserInfo } from '../utils/userInfo';
import { api } from '../utils/api';
import { useProjects } from '../contexts/ProjectContext';

interface Project {
  id: string;
  name: string;
  image_url: string;
  location: string;
  client: string;
  deadline: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  assigned_projects: Project[];
}

const Projects: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setLocalSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);

  // New project form state
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    location: '',
    client: '',
    description: '',
    deadline: '',
    image: null as File | null,
    imagePreview: ''
  });
  
  // Animation controls
  const controls = useAnimation();
  const statsControls = useAnimation();

  // Start animation sequence
  useEffect(() => {
    const sequence = async () => {
      await controls.start("visible");
      await statsControls.start("visible");
    };
    sequence();
  }, [controls, statsControls]);
  
  // Check URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true' && user?.role === 'admin') {
      setShowNewProject(true);
    }
  }, [location, user?.role]);
  
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (user?.company_id) {
        try {
          // If we have an endpoint for company details
          const data = await api.getCompany(user.company_id);
          setCompany(data);
        } catch (error) {
          console.error('Error fetching company info:', error);
        }
      }
    };
    
    if (user?.company_id) {
      fetchCompanyInfo();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setIsRefetching(true);
      const data = await api.getProjectsList();
      if (Array.isArray(data)) {
        setProjects(data);
      } else if (data && Array.isArray(data.data)) {
        // Handle if response is wrapped in { success: true, data: [...] }
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsRefetching(false);
      setLoading(false);
    }
  };
  
  // Handle project form input changes
  const handleNewProjectChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProjectData({
      ...newProjectData,
      [name]: value
    });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProjectData({
          ...newProjectData,
          image: file,
          imagePreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle project creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreatingProject(true);
      const userInfo = getUserInfo();
      
      const projectData = {
        name: newProjectData.name,
        location: newProjectData.location,
        client: newProjectData.client,
        description: newProjectData.description,
        deadline: newProjectData.deadline,
        image: newProjectData.imagePreview || null,
        status: 'active',
        creator_uid: userInfo?.id
      };

      await api.createProject(projectData);

      // Reset form
      setNewProjectData({
        name: '',
        location: '',
        client: '',
        description: '',
        deadline: '',
        image: null,
        imagePreview: ''
      });
        
      // Close modal
      setShowNewProject(false);
        
      // Refresh projects list
      await fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsCreatingProject(false);
    }
  };
  
  // Handle selecting a project and navigating to dashboard
  const handleViewProject = (project: Project) => {
    setLocalSelectedProject(project);
    setShowProjectDetails(true);
  };

  // Handle navigation to project dashboard
  const handleGoToProject = (project: Project) => {
    setSelectedProject(project);
    navigate(`/dashboard/${project.id}`);
  };
  
  // Filter projects based on user role and search/status filters
  const getFilteredProjects = () => {
    let filteredProjects = [...projects];
    
    // Then apply search and status filters
    return filteredProjects.filter(project => {
      // Text search filter
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = activeFilter === 'all' || project.status === activeFilter;
      
      return matchesSearch && matchesStatus;
    });
  };
  
  const filteredProjects = getFilteredProjects();
  
  // Status color mapping
  const statusColors = {
    active: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    planning: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    completing: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
    completed: 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
    onHold: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning',
    upcoming: 'bg-portfolio-orange/10 text-portfolio-orange dark:bg-portfolio-orange/20 dark:text-portfolio-orange',
  };
  
  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };
  


  // Fix for the comparison issues in filterProjects

  
  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    if (user?.role !== 'admin') {
      console.warn('Only admins can update project status');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const userInfo = getUserInfo();
      
      await api.updateProject(projectId, {
        status: newStatus,
        creator_uid: userInfo?.id
      });

      // Update project status locally
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: newStatus } : p
      ));
      
      // Also update the selected project if it's the one being modified
      if (selectedProject && selectedProject.id === projectId) {
        setLocalSelectedProject({ ...selectedProject, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmText !== 'DELETE') return;
    if (user?.role !== 'admin') {
      console.warn('Only admins can delete projects');
      return;
    }

    try {
      setIsDeletingProject(true);
      
      await api.deleteProject(projectToDelete.id);

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      setDeleteConfirmText('');
      
      // If the deleted project was open in details view, close it
      if (selectedProject && selectedProject.id === projectToDelete.id) {
        setShowProjectDetails(false);
        setLocalSelectedProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Fetch users when staff modal opens
  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      setIsLoadingUsers(true);
      const response = await fetch(`https://server.matrixtwin.com/api/auth/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Handle user assignment
  const handleAssignUser = async (userId: string, projectId: string) => {
    try {
      setIsAssigningUser(true);
      setAssignError(null);
      const userInfo = getUserInfo();
      if (!userInfo) return;

      const response = await fetch('https://server.matrixtwin.com/api/projects/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creator_uid: userInfo.id,
          project_id: projectId,
          user_id: userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh users list
        await fetchUsers();
      } else {
        setAssignError(data.message || 'Failed to assign user');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      setAssignError('An error occurred while assigning the user');
    } finally {
      setIsAssigningUser(false);
    }
  };

  // Function to categorize users
  const categorizeUsers = (projectId: string) => {
    const assignedToThisProject = users.filter(user => 
      user.assigned_projects.some(project => project.id === projectId)
    );

    const unassignedUsers = users.filter(user => 
      user.assigned_projects.length === 0
    );

    const assignedToOtherProjects = users.filter(user => 
      user.assigned_projects.length > 0 && 
      !user.assigned_projects.some(project => project.id === projectId)
    );

    return {
      assignedToThisProject,
      unassignedUsers,
      assignedToOtherProjects
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Add this inside your project details modal
  const statusOptions = ['upcoming', 'in_progress', 'completed', 'on_hold', 'cancelled'];
  
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Use the custom ProjectHeader component */}
      <ProjectHeader />
      
      {company && (
        <div className="bg-portfolio-dark/50 backdrop-blur-md border-b border-white/5 py-8">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                {company.logo_url ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-portfolio-orange to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
                    {company.name ? company.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
                
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{company.name}</h1>
                  <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
                    {company.address && (
                      <div className="flex items-center gap-2">
                        <RiIcons.RiMapPinLine className="text-portfolio-orange" />
                        <span>{company.address}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2">
                        <RiIcons.RiPhoneLine className="text-portfolio-orange" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center gap-2">
                        <RiIcons.RiGlobalLine className="text-portfolio-orange" />
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-white transition-colors"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 {/* Company specific actions could go here */}
                 <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-center">
                   <div className="text-2xl font-bold text-white">{projects.length}</div>
                   <div className="text-xs text-gray-400 uppercase tracking-wider">Projects</div>
                 </div>
                 {/* Add more stats if available */}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ProjectsHero 
        onCreateProject={() => setShowNewProject(true)}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        filterStatus={activeFilter}
        onFilterChange={setActiveFilter}
        isAdmin={user?.role === 'admin'}
      />
      
      <div className="bg-portfolio-dark min-h-screen">
        <div className="mx-auto px-6 md:px-12 py-12 max-w-[1800px]">
          {/* Section Title - Removed as it's in Hero now */}

        
        {/* No projects message */}
        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <RiIcons.RiBuilding4Line className="text-5xl text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery 
                ? "No projects match your search criteria. Try adjusting your search or filters."
                : user?.role === 'admin'
                    ? "You don't have any projects yet. Create your first project to get started."
                    : "There are currently no projects available for you. Check back later or contact your administrator."
              }
            </p>
            {user?.role === 'admin' && !searchQuery && (
              <Button 
                variant="ai-gradient" 
                leftIcon={<RiIcons.RiAddLine />}
                onClick={() => setShowNewProject(true)}
              >
                Create First Project
              </Button>
            )}
          </div>
        )}
        
        {/* Project details modal */}
        <Dialog 
          isOpen={showProjectDetails && !!selectedProject} 
          onClose={() => setShowProjectDetails(false)}
          size="lg"
          maxWidth="56rem" // max-w-4xl (was 64rem/xl)
          disablePadding
          className="bg-black/80 backdrop-blur-2xl border border-white/5"
        >
          {selectedProject && (
            <div className="overflow-hidden">
                {/* Project header with image */}
                <div className="relative h-[400px]">
                  <img 
                    src={selectedProject.image_url} 
                    alt={selectedProject.name} 
                    className="w-full h-full object-cover filter grayscale-[20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-portfolio-dark via-portfolio-dark/50 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-portfolio-orange text-black text-xs font-bold uppercase tracking-widest">
                            {selectedProject.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">{selectedProject.name}</h2>
                        <div className="flex items-center text-gray-400 font-mono text-sm">
                          <RiIcons.RiMapPinLine className="mr-2" />
                          {selectedProject.location}
                        </div>
                      </div>
                      
                      <div className="text-right hidden md:block">
                        <span className="text-portfolio-orange text-xs font-mono uppercase tracking-widest block mb-1">Target Delivery</span>
                        <span className="text-white text-xl font-light">
                          {new Date(selectedProject.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowProjectDetails(false)}
                    className="absolute top-6 right-6 p-3 rounded-full bg-black/20 hover:bg-portfolio-orange text-white hover:text-black transition-all backdrop-blur-sm"
                  >
                    <IconContext.Provider value={{ className: "text-xl" }}>
                      <RiIcons.RiCloseLine />
                    </IconContext.Provider>
                  </button>
                </div>
                
                {/* Project details content */}
                <div className="p-8 md:p-12 bg-transparent">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-mono text-portfolio-orange uppercase tracking-widest mb-4">About the Project</h3>
                      <p className="text-gray-300 text-lg leading-relaxed font-light">{selectedProject.description}</p>
                    </div>
                    
                    <div className="space-y-8 border-l border-white/10 pl-8 md:pl-12">
                      <div>
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Client</h3>
                        <div className="flex items-center text-white text-lg">
                          <RiIcons.RiBuilding4Line className="mr-3 text-portfolio-orange" />
                          <span>{selectedProject.client}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">Project Manager</h3>
                        <div className="flex items-center text-white">
                          <UserAvatar name={user?.name || 'Manager'} image={user?.avatar} size="sm" />
                          <span className="ml-3">{user?.name || 'Assigned Manager'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Status</h3>
                      {user?.role === 'admin' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Project Status
                          </label>
                          <select
                            value={selectedProject.status}
                            onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`w-full px-4 py-2 bg-dark-800/50 border-0 focus:ring-1 focus:ring-portfolio-orange rounded-lg text-white ${
                              isUpdatingStatus ? 'opacity-50' : ''
                            }`}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status} className="bg-dark-900 text-white">
                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  
                  <div className="border-t border-dark-800 pt-6 flex justify-end gap-3">
                    <Button variant="ai-secondary" onClick={() => setShowProjectDetails(false)}>
                      Close
                    </Button>
                    
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="ai"
                          onClick={() => {
                            setShowStaffModal(true);
                            fetchUsers();
                          }}
                        >
                          <RiIcons.RiTeamLine className="mr-2" />
                          View Staff
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setProjectToDelete(selectedProject);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          Delete Project
                        </Button>
                      </>
                    )}
                  </div>
                </div>
            </div>
          )}
        </Dialog>
        
        {/* New project modal */}
        <Dialog 
          isOpen={showNewProject} 
          onClose={() => setShowNewProject(false)}
          title="Create New Project"
          maxWidth="520px" // was 672px
        >
          <form onSubmit={handleCreateProject} className="space-y-4">
            {/* Image upload section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Image
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-dark-800 border border-dark-700 flex items-center justify-center relative group">
                  {newProjectData.imagePreview ? (
                    <>
                      <img 
                        src={newProjectData.imagePreview} 
                        alt="Project preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <RiIcons.RiEditLine className="text-white text-2xl" />
                      </div>
                    </>
                  ) : (
                    <RiIcons.RiImageAddLine className="text-4xl text-gray-500" />
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="relative cursor-pointer">
                    <Button variant="ai-secondary" size="sm" type="button" onClick={() => document.getElementById('image-upload')?.click()}>
                      Choose Image
                    </Button>
                    <input 
                      id="image-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    Recommended: 1200×800px JPG, PNG or WebP
                  </p>
                </div>
              </div>
            </div>
            
            <Input
              label="Project Name"
              name="name"
              required
              value={newProjectData.name}
              onChange={handleNewProjectChange}
              placeholder="Enter project name"
              variant="futuristic"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location"
                name="location"
                required
                value={newProjectData.location}
                onChange={handleNewProjectChange}
                placeholder="City, State"
                variant="futuristic"
              />
              
              <Input
                label="Client"
                name="client"
                required
                value={newProjectData.client}
                onChange={handleNewProjectChange}
                placeholder="Client name"
                variant="futuristic"
              />
            </div>
            
            <Input
              label="Deadline"
              name="deadline"
              type="date"
              required
              value={newProjectData.deadline}
              onChange={handleNewProjectChange}
              variant="futuristic"
            />
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description <span className="text-error">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={newProjectData.description}
                onChange={handleNewProjectChange}
                className="w-full rounded-lg border-0 bg-dark-800/50 backdrop-blur-sm text-white focus:ring-2 focus:ring-primary-400 placeholder-gray-500 resize-none"
                placeholder="Provide a brief description of the project"
              />
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ai-secondary"
                type="button"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </Button>
              <Button
                variant="ai"
                type="submit"
                isLoading={isCreatingProject}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Dialog>
        
        {/* Delete confirmation modal */}
        <Dialog 
          isOpen={showDeleteConfirm && !!projectToDelete} 
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Project"
          maxWidth="448px" // max-w-md
        >
          {projectToDelete && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete <span className="text-white font-bold">"{projectToDelete.name}"</span>? This action cannot be undone.
              </p>
              <p className="text-gray-300">
                Type <span className="font-mono text-error">DELETE</span> to confirm.
              </p>
              
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                variant="futuristic"
                className="border-error/30 focus:ring-error"
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ai-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  isLoading={isDeletingProject}
                  disabled={deleteConfirmText !== 'DELETE'}
                >
                  Delete Project
                </Button>
              </div>
            </div>
          )}
        </Dialog>
        
        {/* Staff Management Modal */}
        <Dialog 
          isOpen={showStaffModal && !!selectedProject}
          onClose={() => setShowStaffModal(false)}
          title="Staff Management"
          maxWidth="48rem" // max-w-3xl
        >
          {assignError && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error">
              {assignError}
            </div>
          )}

          {isLoadingUsers ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-portfolio-orange"></div>
            </div>
          ) : selectedProject && (
            <div className="space-y-8">
              {/* Assigned to This Project */}
              <div>
                <h3 className="text-lg font-semibold text-portfolio-orange mb-4">
                  Assigned to {selectedProject.name}
                </h3>
                <div className="space-y-3">
                  {categorizeUsers(selectedProject.id).assignedToThisProject.map(user => (
                    <div key={user.id} className="bg-dark-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="text-white font-medium">{user.name}</h4>
                          <p className="text-gray-400 text-sm">{user.role}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ai-secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unassigned Users */}
              <div>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4">
                  Available Staff
                </h3>
                <div className="space-y-3">
                  {categorizeUsers(selectedProject.id).unassignedUsers.map(user => (
                    <div key={user.id} className="bg-dark-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="text-white font-medium">{user.name}</h4>
                          <p className="text-gray-400 text-sm">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ai-secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ai"
                          size="sm"
                          onClick={() => handleAssignUser(user.id, selectedProject.id)}
                          disabled={isAssigningUser}
                        >
                          {isAssigningUser ? 'Assigning...' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned to Other Projects */}
              <div>
                <h3 className="text-lg font-semibold text-warning mb-4">
                  Assigned to Other Projects
                </h3>
                <div className="space-y-3">
                  {categorizeUsers(selectedProject.id).assignedToOtherProjects.map(user => (
                    <div key={user.id} className="bg-dark-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <h4 className="text-white font-medium">{user.name}</h4>
                          <p className="text-gray-400 text-sm">
                            {user.role} - Assigned to {user.assigned_projects[0]?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ai-secondary" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ai"
                          size="sm"
                          onClick={() => handleAssignUser(user.id, selectedProject.id)}
                          disabled={isAssigningUser}
                        >
                          {isAssigningUser ? 'Assigning...' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Dialog>
        
        {/* User Details Modal */}
        <Dialog 
          isOpen={showUserDetails && !!selectedUser} 
          onClose={() => setShowUserDetails(false)}
          maxWidth="32rem" // max-w-lg
          disablePadding
          className="bg-black/80 backdrop-blur-2xl border border-white/5"
        >
          {selectedUser && (
            <div className="bg-transparent overflow-hidden">
              <div className="relative">
                {/* Header with gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-portfolio-orange/10 to-transparent"></div>
                
                {/* Close button */}
                <button 
                  onClick={() => setShowUserDetails(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white transition-colors z-10"
                >
                  <RiIcons.RiCloseLine />
                </button>

                {/* User header info */}
                <div className="relative p-6 flex items-center space-x-6 bg-black/20">
                  <div className="relative">
                    <img 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name} 
                      className="w-24 h-24 rounded-full border-4 border-dark-800"
                    />
                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-success flex items-center justify-center border-2 border-dark-900">
                      <RiIcons.RiCheckLine className="text-white text-sm" />
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedUser.name}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-portfolio-orange/20 text-portfolio-orange">
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                      <span className="text-gray-400">{selectedUser.email}</span>
                    </div>
                  </div>
                </div>
              </div>

                {/* User details content */}
                <div className="p-6 space-y-6 bg-transparent">
                {/* Project Assignments Section */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <RiIcons.RiProjectorLine className="mr-2" />
                    Project Assignments
                  </h3>
                  
                  {selectedUser.assigned_projects.length > 0 ? (
                    <div className="space-y-3">
                      {selectedUser.assigned_projects.map(project => (
                        <div key={project.id} className="bg-dark-800 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-medium">{project.name}</h4>
                              <p className="text-gray-400 text-sm">{project.location}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusColors[project.status as keyof typeof statusColors] || ''
                            }`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Client:</span>
                              <span className="ml-2 text-white">{project.client}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Deadline:</span>
                              <span className="ml-2 text-white">
                                {new Date(project.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-dark-800 rounded-lg">
                      <RiIcons.RiInboxLine className="mx-auto text-4xl text-gray-500 mb-2" />
                      <p className="text-gray-400">No project assignments</p>
                    </div>
                  )}
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-dark-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {selectedUser.assigned_projects.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Projects</div>
                  </div>
                  <div className="bg-dark-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {selectedUser.assigned_projects.filter(p => p.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-400">Active Projects</div>
                  </div>
                  <div className="bg-dark-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {selectedUser.assigned_projects.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog>
        
        {/* Projects Grid with Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-portfolio-orange"></div>
          </div>
        ) : isRefetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 opacity-50">
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project.id}
                index={idx}
                project={project}
                onClick={() => handleGoToProject(project)}
                onViewDetails={() => handleViewProject(project)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project.id}
                index={idx}
                project={project}
                onClick={() => handleGoToProject(project)}
                onViewDetails={() => handleViewProject(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Projects; 