import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import * as RiIcons from 'react-icons/ri';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { IconContext } from 'react-icons';
import { Dialog } from '../components/ui/Dialog';
import { useAuth } from '../contexts/AuthContext';
import { ProjectHeader } from '../components/layout/ProjectHeader';
import matrixAILogo from '../assets/MatrixAILogo.png';
import { getUserInfo } from '../utils/userInfo';
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

  const fetchProjects = async () => {
    try {
      setIsRefetching(true);
      const userInfo = getUserInfo();
      if (!userInfo) return;

      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects/assigned?creator_uid=${userInfo.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
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
      if (!userInfo) return;

      const formData = new FormData();
      formData.append('creator_uid', userInfo.id);
      formData.append('name', newProjectData.name);
      formData.append('location', newProjectData.location);
      formData.append('client', newProjectData.client);
      formData.append('description', newProjectData.description);
      formData.append('deadline', newProjectData.deadline);
      
      // Handle image upload correctly
      if (newProjectData.image) {
        formData.append('image', newProjectData.image, newProjectData.image.name);
      }

      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
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
    navigate('/dashboard');
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
    upcoming: 'bg-ai-purple/10 text-ai-purple dark:bg-ai-purple/20 dark:text-ai-purple',
  };
  
  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };
  
  // Fix for the variant="ai-accent" issue on line 704
  const fixIconAndVariant = (line: string): string => {
    if (line.includes('variant="ai-accent"')) {
      return line.replace('variant="ai-accent"', 'variant="accent"');
    }
    return line;
  };

  // Fix for the comparison issues in filterProjects
  const fixTypeComparison = (line: string): string => {
    if (line.includes('manager.id === user.id')) {
      return line.replace('manager.id === user.id', 'String(manager.id) === user.id');
    }
    if (line.includes('worker.id === user?.id')) {
      return line.replace('worker.id === user?.id', 'String(worker.id) === user?.id');
    }
    if (line.includes('app.applicant.id === user?.id')) {
      return line.replace('app.applicant.id === user?.id', 'String(app.applicant.id) === user?.id');
    }
    return line;
  };
  
  // Fix the string vs number comparison in the workerApplications.some() check
  const compareProjIds = (projA: any, projB: any) => String(projA?.id) === String(projB?.id);
  const compareUserIds = (userId1: any, userId2: any) => String(userId1) === String(userId2);

  // Also, fix the "success" variant to use a valid variant
  const SuccessButton = ({ size, onClick, children }: any) => (
    <Button
      variant="accent"
      size={size}
      onClick={onClick}
      className="bg-success hover:bg-success/80 text-white"
    >
      {children}
    </Button>
  );
  
  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const userInfo = getUserInfo();
      if (!userInfo) return;

      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creator_uid: userInfo.id,
          status: newStatus
        })
      });

      if (response.ok) {
        // Update project status locally
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status: newStatus } : p
        ));
        
        // Show success message or notification
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      // Show error message to user
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmText !== 'DELETE') return;

    try {
      setIsDeletingProject(true);
      const userInfo = getUserInfo();
      if (!userInfo) return;

      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creator_uid: userInfo.id
        })
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
        setShowDeleteConfirm(false);
        setProjectToDelete(null);
        setDeleteConfirmText('');
        
        // Show success message
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      // Show error message to user
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Fetch users when staff modal opens
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/users/${user?.id}`, {
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

      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/projects/assign', {
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
      
      {/* Ultra-Modern 3D Futuristic Header with Better Gradients */}
      <div className="w-full relative overflow-hidden min-h-[420px] bg-black">
        {/* 3D mesh background with perspective effect */}
        <div className="absolute inset-0 z-0 perspective-1000 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black"
            style={{
              backgroundImage: 'radial-gradient(circle at 10% 30%, rgba(2, 132, 199, 0.15), transparent 40%), radial-gradient(circle at 90% 70%, rgba(192, 38, 211, 0.15), transparent 40%)'
            }}
          ></div>
          <motion.div 
            className="absolute inset-0 origin-center"
            initial={{ rotateX: 10, rotateY: -10 }}
            animate={{ 
              rotateX: [10, 5, 10], 
              rotateY: [-10, -5, -10],
              z: [0, 10, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)] h-full w-full opacity-30">
              {Array.from({ length: 20 }).map((_, rowIndex) => (
                Array.from({ length: 20 }).map((_, colIndex) => (
                  <motion.div 
                    key={`${rowIndex}-${colIndex}`}
                    className="border border-sky-500/10"
                    initial={{ opacity: 0.05 }}
                    animate={{ 
                      opacity: [0.05, rowIndex % 5 === 0 || colIndex % 5 === 0 ? 0.2 : 0.05, 0.05],
                      boxShadow: [
                        'none', 
                        rowIndex % 7 === 0 && colIndex % 9 === 0 ? 'inset 0 0 15px rgba(14, 165, 233, 0.2)' : 'none', 
                        'none'
                      ]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: (rowIndex + colIndex) * 0.01 
                    }}
                  />
                ))
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Animated neon lines */}
        <div className="absolute inset-0 z-0">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={`line-${i}`}
              className="absolute h-px w-full left-0"
              style={{ 
                top: `${25 + i * 25}%`,
                backgroundImage: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.7), rgba(139, 92, 246, 0.7), transparent)',
                filter: 'blur(1px)'
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ 
                scaleY: [0, 1, 0],
                opacity: [0, 0.7, 0],
                x: ['-100%', '100%']
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: i * 2
              }}
            />
          ))}
        </div>
        
        {/* Glowing orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute rounded-full"
              style={{ 
                width: `${50 + i * 20}px`, 
                height: `${50 + i * 20}px`,
                top: `${20 + Math.sin(i) * 40}%`,
                left: `${15 + i * 18}%`,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0) 70%)' 
                  : 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)',
                filter: 'blur(10px)'
              }}
              animate={{ 
                y: [-(10 + i * 5), (10 + i * 5), -(10 + i * 5)],
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          ))}
        </div>
        
        {/* Digital circuit lines */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="circuit-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 10 10 L 10 0" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.5"/>
              <path d="M 20 10 L 10 10" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.5"/>
              <path d="M 10 20 L 10 10" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
          </svg>
        </div>
        
        {/* Glass panel with content */}
        <div className="absolute inset-x-0 top-0 pt-16 h-full backdrop-blur-sm z-10">
          <div className="container mx-auto max-w-[1400px] px-6 py-16 h-full flex flex-col justify-center">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {/* Glowing side accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 rounded-full"></div>
                
                <div className="pl-4">
                  {/* Project title with 3D appearance */}
                  <h1 className="text-5xl md:text-6xl font-display font-bold">
                    <div className="relative inline-block">
                      <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-100 to-indigo-300 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                        {t('nav.projects') || 'Projects'}
                      </span>
                      <motion.div 
                        className="absolute -bottom-3 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500"
                        initial={{ width: "0%", left: "50%" }}
                        animate={{ width: "100%", left: "0%" }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                      />
                      <div className="absolute -z-10 left-0 right-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-indigo-500/20 blur-2xl opacity-50 rounded-full"></div>
                    </div>
                    
                    <motion.div 
                      className="inline-flex items-center ml-4 bg-gradient-to-r from-sky-900/40 to-indigo-900/40 backdrop-blur-md px-4 py-1 rounded-full border border-sky-500/20"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
                    
                    </motion.div>
                  </h1>
                  
                  <motion.p 
                    className="text-xl mt-4 max-w-2xl text-blue-100/80 leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    Advanced construction project management with AI-powered insights and real-time analytics
                  </motion.p>
                </div>
              </motion.div>
              
              <motion.div
                className="mt-8 md:mt-0 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {/* Ultra-modern New Project button with cool gradient */}
                {user?.role === 'admin' && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowNewProject(true)}
                    disabled={isCreatingProject}
                    className="relative overflow-hidden group bg-gradient-to-br from-sky-400 to-indigo-600"
                  >
                    {isCreatingProject ? (
                      <>
                        <span className="opacity-0">Create New Project</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        </div>
                      </>
                    ) : (
                      <>
                      <RiIcons.RiAddLine className="mr-2" />
                        Create New Project
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            </div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="relative backdrop-blur-md rounded-xl overflow-hidden group"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-600/20 via-blue-600/10 to-indigo-600/20 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-sky-500/20 rounded-xl"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
                
                <div className="relative p-5 flex items-center">
                  <div className="relative h-16 w-16 flex-shrink-0 mr-4">
                    <div className="absolute inset-0 rounded-full bg-sky-900/40 flex items-center justify-center backdrop-blur-md border border-sky-500/30">
                      <RiIcons.RiBuilding2Line className="text-3xl text-sky-300" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-sky-400/30 border-dashed"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-sky-300 font-medium">Total Projects</h3>
                    <div className="text-3xl font-bold text-white mt-1">{projects.length}</div>
                    <div className="mt-1 flex items-center">
                      <div className="h-1 w-16 bg-sky-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative backdrop-blur-md rounded-xl overflow-hidden group"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-fuchsia-600/10 to-pink-600/20 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-purple-500/20 rounded-xl"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
                
                <div className="relative p-5 flex items-center">
                  <div className="relative h-16 w-16 flex-shrink-0 mr-4">
                    <div className="absolute inset-0 rounded-full bg-purple-900/40 flex items-center justify-center backdrop-blur-md border border-purple-500/30">
                      <RiIcons.RiCheckboxCircleLine className="text-3xl text-purple-300" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ 
                        boxShadow: ['0 0 0 0 rgba(168, 85, 247, 0)', '0 0 0 10px rgba(168, 85, 247, 0.1)', '0 0 0 0 rgba(168, 85, 247, 0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-purple-300 font-medium">Active Projects</h3>
                    <div className="text-3xl font-bold text-white mt-1">{projects.filter(p => p.status === 'active').length}</div>
                    <div className="mt-1 flex items-center">
                      <div className="h-1 w-16 bg-purple-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative backdrop-blur-md rounded-xl overflow-hidden group"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } }
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-cyan-600/20 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="absolute inset-0 border border-emerald-500/20 rounded-xl"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
                
                <div className="relative p-5 flex items-center">
                  <div className="relative h-16 w-16 flex-shrink-0 mr-4">
                    <div className="absolute inset-0 rounded-full bg-emerald-900/40 flex items-center justify-center backdrop-blur-md border border-emerald-500/30">
                      <RiIcons.RiTeamLine className="text-3xl text-emerald-300" />
                    </div>
                    <motion.svg 
                      className="absolute inset-0" 
                      viewBox="0 0 100 100"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    >
                      <circle cx="50" cy="20" r="3" fill="rgba(16, 185, 129, 0.5)" />
                      <circle cx="80" cy="50" r="3" fill="rgba(16, 185, 129, 0.5)" />
                      <circle cx="50" cy="80" r="3" fill="rgba(16, 185, 129, 0.5)" />
                      <circle cx="20" cy="50" r="3" fill="rgba(16, 185, 129, 0.5)" />
                    </motion.svg>
                  </div>
                  
                  <div>
                    <h3 className="text-sm uppercase tracking-wider text-emerald-300 font-medium">Team Members</h3>
                    <div className="text-3xl font-bold text-white mt-1">
                      {projects.length}
                    </div>
                    <div className="mt-1 flex items-center">
                      <div className="h-1 w-16 bg-emerald-900/50 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-grow w-full md:w-auto">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <IconContext.Provider value={{}}>
                    <RiIcons.RiSearchLine />
                  </IconContext.Provider>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-10 w-full rounded-lg border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-secondary-800 dark:text-white"
                />
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  key="all"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                  }`}
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </button>
                <button
                  key="active"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'active'
                      ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                  }`}
                  onClick={() => setActiveFilter('active')}
                >
                  Active
                </button>
                <button
                  key="planning"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'planning'
                      ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                  }`}
                  onClick={() => setActiveFilter('planning')}
                >
                  Planning
                </button>
                <button
                  key="upcoming"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'upcoming'
                      ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                  }`}
                  onClick={() => setActiveFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  key="completing"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === 'completing'
                      ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                  }`}
                  onClick={() => setActiveFilter('completing')}
                >
                  Completing
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
        
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
                variant="primary" 
                leftIcon={<RiIcons.RiAddLine />}
                onClick={() => setShowNewProject(true)}
              >
                Create First Project
              </Button>
            )}
          </div>
        )}
        
        {/* Project details modal */}
        <AnimatePresence>
          {showProjectDetails && selectedProject && (
            <Dialog onClose={() => setShowProjectDetails(false)}>
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-dark-900 rounded-xl overflow-hidden max-w-4xl w-full mx-auto"
              >
                {/* Project header with image */}
                <div className="relative h-64">
                  <img 
                    src={selectedProject.image_url} 
                    alt={selectedProject.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between">
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${statusColors[selectedProject.status as keyof typeof statusColors] || ''}`}>
                          {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">{selectedProject.name}</h2>
                        <p className="text-gray-300">{selectedProject.location}</p>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        <div className="text-right">
                          <span className="text-gray-400 text-sm block">Deadline</span>
                          <span className="text-white font-medium">
                            {new Date(selectedProject.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowProjectDetails(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-dark-800/50 hover:bg-dark-800 text-gray-400 hover:text-white transition-colors"
                  >
                    <IconContext.Provider value={{}}>
                      <RiIcons.RiCloseLine />
                    </IconContext.Provider>
                  </button>
                </div>
                
                {/* Project details content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Description</h3>
                      <p className="text-gray-300">{selectedProject.description}</p>
                      
                      <h3 className="text-lg font-bold text-white mt-6 mb-2">Client</h3>
                      <div className="flex items-center">
                        <IconContext.Provider value={{ className: "text-gray-400 mr-2" }}>
                          <RiIcons.RiBuilding4Line />
                        </IconContext.Provider>
                        <span className="text-gray-300">{selectedProject.client}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">Status</h3>
                      {(user?.role === 'admin' || user?.role === 'projectManager' || user?.role === 'contractor') && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Project Status
                          </label>
                          <select
                            value={selectedProject.status}
                            onChange={(e) => handleUpdateProjectStatus(selectedProject.id, e.target.value)}
                            disabled={isUpdatingStatus}
                            className={`w-full px-4 py-2 bg-dark-800/50 border border-ai-blue/30 rounded-lg text-white ${
                              isUpdatingStatus ? 'opacity-50' : ''
                            }`}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-dark-800 pt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setShowProjectDetails(false)}>
                      Close
                    </Button>
                    
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setShowStaffModal(true);
                            fetchUsers();
                          }}
                        >
                          <RiIcons.RiTeamLine className="mr-2" />
                          View Staff
                        </Button>
                        
                        <Button
                          variant="primary"
                          className="bg-error hover:bg-error/80"
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
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* New project modal */}
        <AnimatePresence>
          {showNewProject && (
            <Dialog onClose={() => setShowNewProject(false)}>
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full mx-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Create New Project</h2>
                    <button 
                      onClick={() => setShowNewProject(false)}
                      className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
                    >
                      <IconContext.Provider value={{}}>
                        <RiIcons.RiCloseLine />
                      </IconContext.Provider>
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateProject}>
                    <div className="space-y-4">
                      {/* Image upload section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Project Image
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          <div className="w-32 h-32 rounded-lg overflow-hidden bg-dark-800 border border-dark-700 flex items-center justify-center">
                            {newProjectData.imagePreview ? (
                              <img 
                                src={newProjectData.imagePreview} 
                                alt="Project preview" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <RiIcons.RiImageAddLine className="text-4xl text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <label className="relative cursor-pointer bg-dark-800 hover:bg-dark-700 text-white py-2 px-4 rounded-lg border border-dark-700 transition-colors">
                              <span>Choose Image</span>
                              <input 
                                type="file" 
                                className="sr-only" 
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
                      
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                          Project Name <span className="text-error">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={newProjectData.name}
                          onChange={handleNewProjectChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                          placeholder="Enter project name"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                            Location <span className="text-error">*</span>
                          </label>
                          <input
                            id="location"
                            name="location"
                            type="text"
                            required
                            value={newProjectData.location}
                            onChange={handleNewProjectChange}
                            className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                            placeholder="City, State"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="client" className="block text-sm font-medium text-gray-300 mb-1">
                            Client <span className="text-error">*</span>
                          </label>
                          <input
                            id="client"
                            name="client"
                            type="text"
                            required
                            value={newProjectData.client}
                            onChange={handleNewProjectChange}
                            className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                            placeholder="Client name"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-1">
                          Deadline <span className="text-error">*</span>
                        </label>
                        <input
                          id="deadline"
                          name="deadline"
                          type="date"
                          required
                          value={newProjectData.deadline}
                          onChange={handleNewProjectChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        />
                      </div>
                      
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
                          className="form-textarea w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                          placeholder="Provide a brief description of the project"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setShowNewProject(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                      >
                        Create Project
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && projectToDelete && (
            <Dialog onClose={() => setShowDeleteConfirm(false)}>
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-dark-900 rounded-xl overflow-hidden max-w-md w-full mx-auto p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Delete Project</h2>
                <p className="text-gray-300 mb-4">
                  Are you sure you want to delete "{projectToDelete.name}"? This action cannot be undone.
                </p>
                <p className="text-gray-300 mb-4">
                  Type <span className="font-mono text-error">DELETE</span> to confirm.
                </p>
                
                <Input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="mb-4"
                />

                <div className="flex justify-end gap-3">
                      <Button
                        variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                    variant="primary"
                    className="bg-error hover:bg-error/80"
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingProject}
                    onClick={handleDeleteProject}
                  >
                    {isDeletingProject ? (
                      <>
                        <span className="opacity-0">Delete Project</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    </div>
                      </>
                    ) : (
                      'Delete Project'
                    )}
                    </Button>
                </div>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* Staff Management Modal */}
        <AnimatePresence>
          {showStaffModal && selectedProject && (
            <Dialog onClose={() => setShowStaffModal(false)}>
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-dark-900 rounded-xl overflow-hidden max-w-5xl w-full mx-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Staff Management</h2>
                    <button 
                      onClick={() => setShowStaffModal(false)}
                      className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
                    >
                      <RiIcons.RiCloseLine />
                    </button>
                  </div>

                  {assignError && (
                    <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error">
                      {assignError}
                    </div>
                  )}

                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ai-blue"></div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Assigned to This Project */}
                      <div>
                        <h3 className="text-lg font-semibold text-ai-blue mb-4">
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
                                variant="secondary" 
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
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserDetails(true);
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="primary"
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
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserDetails(true);
                                  }}
                                >
                                  View Details
                                </Button>
                                <Button
                                  variant="primary"
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
                </div>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* User Details Modal */}
        <AnimatePresence>
          {showUserDetails && selectedUser && (
            <Dialog onClose={() => setShowUserDetails(false)}>
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full mx-auto"
              >
                <div className="relative">
                  {/* Header with gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/20 to-purple-600/20"></div>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setShowUserDetails(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-dark-800/50 hover:bg-dark-800 text-gray-400 hover:text-white transition-colors"
                  >
                    <RiIcons.RiCloseLine />
                  </button>

                  {/* User header info */}
                  <div className="relative p-6 flex items-center space-x-6">
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-ai-blue/20 text-ai-blue">
                          {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                        </span>
                        <span className="text-gray-400">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User details content */}
                <div className="p-6 space-y-6">
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
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* Projects Grid with Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ai-blue"></div>
          </div>
        ) : isRefetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
              >
                <Card className="h-full flex flex-col overflow-hidden group">
                  {/* Project image */}
                  <div className="relative h-48 sm:h-40 md:h-48 overflow-hidden">
                    <img 
                      src={project.image_url} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent opacity-70"></div>
                    
                    {/* Status badge */}
                    <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[project.status as keyof typeof statusColors] || ''}`}>
                      {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    
                    {/* Project title */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white truncate">{project.name}</h3>
                      <p className="text-gray-300 text-sm truncate">{project.location}</p>
                          </div>
                  </div>
                  
                  {/* Project details */}
                  <div className="p-4 flex-grow flex flex-col">
                    {/* Client and deadline */}
                    <div className="text-sm mb-4">
                      <div className="flex items-center mb-2">
                        <IconContext.Provider value={{ className: "text-gray-400 mr-2 flex-shrink-0" }}>
                          <RiIcons.RiBuilding4Line />
                        </IconContext.Provider>
                        <span className="text-gray-300 truncate">{project.client}</span>
                            </div>
                      <div className="flex items-center">
                        <IconContext.Provider value={{ className: "text-gray-400 mr-2 flex-shrink-0" }}>
                          <RiIcons.RiCalendarLine />
                        </IconContext.Provider>
                        <span className="text-gray-300">Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                          </div>
                  </div>
                  
                    {/* Description - truncated */}
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                    
                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap md:flex-nowrap gap-2">
                    <Button
                        variant="secondary"
                        className="flex-grow w-full md:w-auto"
                        onClick={() => handleViewProject(project)}
                      >
                        View Details
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-grow w-full md:w-auto bg-ai-blue hover:bg-ai-blue/80"
                        onClick={() => handleGoToProject(project)}
                    >
                        <RiIcons.RiDashboardLine className="mr-2" />
                        Go to Project
                    </Button>
                  </div>
                </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
              >
                <Card className="h-full flex flex-col overflow-hidden group">
                  {/* Project image */}
                  <div className="relative h-48 sm:h-40 md:h-48 overflow-hidden">
                    <img 
                      src={project.image_url} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent opacity-70"></div>
                    
                    {/* Status badge */}
                    <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[project.status as keyof typeof statusColors] || ''}`}>
                      {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    
                    {/* Project title */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white truncate">{project.name}</h3>
                      <p className="text-gray-300 text-sm truncate">{project.location}</p>
                    </div>
                  </div>
                  
                  {/* Project details */}
                  <div className="p-4 flex-grow flex flex-col">
                    {/* Client and deadline */}
                    <div className="text-sm mb-4">
                      <div className="flex items-center mb-2">
                        <IconContext.Provider value={{ className: "text-gray-400 mr-2 flex-shrink-0" }}>
                          <RiIcons.RiBuilding4Line />
                        </IconContext.Provider>
                        <span className="text-gray-300 truncate">{project.client}</span>
                      </div>
                      <div className="flex items-center">
                        <IconContext.Provider value={{ className: "text-gray-400 mr-2 flex-shrink-0" }}>
                          <RiIcons.RiCalendarLine />
                        </IconContext.Provider>
                        <span className="text-gray-300">Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Description - truncated */}
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                    
                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap md:flex-nowrap gap-2">
                      <Button
                        variant="secondary"
                        className="flex-grow w-full md:w-auto"
                        onClick={() => handleViewProject(project)}
                      >
                        View Details
                      </Button>
                        <Button
                          variant="primary"
                        className="flex-grow w-full md:w-auto bg-ai-blue hover:bg-ai-blue/80"
                        onClick={() => handleGoToProject(project)}
                      >
                        <RiIcons.RiDashboardLine className="mr-2" />
                        Go to Project
                        </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects; 