import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconContext } from 'react-icons';
import { Dialog } from '../components/ui/Dialog';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { roleService, Role } from '../services/roleService';
import { 
  RiUserLine,
  RiTeamLine,
  RiUserAddLine,
  RiMailLine,
  RiPhoneLine,
  RiBuilding4Line,
  RiShieldUserLine,
  RiUserSettingsLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiSearchLine,
  RiFilterLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiAddLine,
  RiListCheck2,
  RiHistoryLine,
  RiSendPlaneLine,
  RiUserReceivedLine,
  RiGridFill,
  RiListUnordered,
  RiGroupLine,
  RiOrganizationChart,
  RiSettings3Line,
  RiEyeLine,
  RiEditLine
} from 'react-icons/ri';

// Filter dropdown portal component
interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  roleLabels: Record<string, string>;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

interface PositionState {
  top: number;
  left: number;
}

// Animation variants
const dropdownVariants = {
  top: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
  },
  bottom: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }
};

interface WorkerApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string;
  skills: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  dateApplied: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  deadline: string;
  location: string;
  image_url: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  phone?: string;
  address?: string;
  skills?: string;
  assigned_projects: Project[];
  joinDate?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  isOpen, 
  onClose, 
  activeFilter, 
  onFilterChange, 
  roleLabels, 
  anchorRef 
}) => {
  const portalRoot = document.getElementById('portal-root');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Create portal root if it doesn't exist
  useEffect(() => {
    if (!portalRoot) {
      const div = document.createElement('div');
      div.id = 'portal-root';
      document.body.appendChild(div);
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorRef, portalRoot]);
  
  // Calculate position based on anchor element
  const [position, setPosition] = useState<PositionState>({ top: 0, left: 0 });
  // Store placement for animation
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  
  useEffect(() => {
    if (anchorRef.current && isOpen) {
      const rect = anchorRef.current.getBoundingClientRect();
      
      // Calculate available space
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 350; // approximate max height
      
      // Position below or above depending on available space
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Position above if more space there
        setPosition({
          top: rect.top + window.scrollY - 8,
          left: rect.left + window.scrollX
        });
        setPlacement('top');
      } else {
        // Position below (default)
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX
        });
        setPlacement('bottom');
      }
    }
  }, [isOpen, anchorRef]);
  
  if (!isOpen) return null;
  
  const portalElement = document.getElementById('portal-root') || document.body;
  
  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        className="fixed z-[9999]"
        style={{
          top: position.top,
          left: position.left,
          transformOrigin: placement === 'top' ? 'bottom left' : 'top left'
        }}
        initial={dropdownVariants[placement].initial}
        animate={dropdownVariants[placement].animate}
        exit={dropdownVariants[placement].exit}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div className="w-72 bg-dark-950 border border-dark-700 rounded-lg shadow-2xl overflow-hidden backdrop-blur-lg">
          <div className="p-3 border-b border-dark-800 bg-gradient-to-r from-dark-800 to-dark-900">
            <h4 className="text-sm font-medium text-white flex items-center">
              <RiFilterLine className="mr-2 text-ai-blue" />
              Filter by Role
            </h4>
          </div>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900">
            <div className="p-2 space-y-1">
              {Object.entries(roleLabels).map(([role, label]) => (
                <button
                  key={role}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center justify-between hover:bg-dark-800 transition-colors ${activeFilter === role ? 'bg-ai-blue/20 text-ai-blue' : 'text-gray-300'}`}
                  onClick={() => {
                    onFilterChange(role);
                    onClose();
                  }}
                >
                  <span>{label}</span>
                  {activeFilter === role && (
                    <span className="text-ai-blue">
                      <RiCheckLine />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    portalElement
  );
};

// Update role constants to match API
const ROLES = {
  PROJECT_MANAGER: 'projectManager',
  SITE_INSPECTOR: 'siteInspector',
  CONTRACTOR: 'contractor',
  WORKER: 'worker'
} as const;

const TeamPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const roleFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerApplications, setWorkerApplications] = useState<WorkerApplication[]>([]);

  // Form states
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.WORKER,
    address: '',
    skills: ''
  });

  // Add these state variables at the top of the TeamPage component
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Add new state for role management
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success message from create role page
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Load custom roles
  const loadCustomRoles = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setLoadingRoles(true);
      const roles = await roleService.getRoles();
      setCustomRoles(roles);
    } catch (err) {
      console.error('Error loading custom roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Load custom roles on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      loadCustomRoles();
    }
  }, [user]);

  // Fetch team members data
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        if (!user?.id) return;
        
        const response = await fetch(`https://matrixbim-server.onrender.com/api/auth/users/${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        
        const data = await response.json();
        setTeamMembers(data.map((member: any) => ({
          ...member,
          phone: member.phone || '+1 (555) 123-4567', // Fallback if phone not provided
          address: member.address || 'No address provided',
          skills: member.skills || 'No skills specified',
          assigned_projects: member.assigned_projects || []
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [user?.id]);

  // Handle project assignment
  const handleAssignProject = async (userId: string, projectId: string, role: string) => {
    try {
      const response = await fetch('https://matrixbim-server.onrender.com/api/projects/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creator_uid: user?.id,
          project_id: projectId,
          user_id: userId,
          role: role
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign project');
      }

      // Refresh team members data after assignment
      const updatedResponse = await fetch(`https://matrixbim-server.onrender.com/api/auth/users/${user?.id}`);
      const updatedData = await updatedResponse.json();
      setTeamMembers(updatedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign project');
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case ROLES.PROJECT_MANAGER: return 'Project Manager';
      case ROLES.SITE_INSPECTOR: return 'Site Inspector';
      case ROLES.CONTRACTOR: return 'Contractor';
      case ROLES.WORKER: return 'Worker';
      default: return role;
    }
  };

  // Update role labels to include custom roles
  const getAllRoleLabels = () => {
    const baseRoles = {
      'all': t('team.allRoles'),
      [ROLES.PROJECT_MANAGER]: 'Project Manager',
      [ROLES.SITE_INSPECTOR]: 'Site Inspector',
      [ROLES.CONTRACTOR]: 'Contractor',
      [ROLES.WORKER]: 'Worker'
    };

    // Add custom roles
    const customRoleLabels = customRoles.reduce((acc, role) => {
      acc[role.name] = role.name;
      return acc;
    }, {} as Record<string, string>);

    return { ...baseRoles, ...customRoleLabels };
  };

  // Get filtered team members
  const getFilteredMembers = () => {
    return teamMembers.filter(member => {
      // Text search
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = activeRoleFilter === 'all' || member.role === activeRoleFilter;
      
      return matchesSearch && matchesRole;
    });
  };

  // Handle add new member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would integrate with your user creation API
      // For now, we'll just update the local state
      const newMember: TeamMember = {
        id: String(Date.now()),
        name: newMemberData.name,
        email: newMemberData.email,
        role: newMemberData.role,
        avatar: `https://ui-avatars.com/api/?name=${newMemberData.name.replace(' ', '+')}&background=3D3D3D&color=fff`,
        phone: newMemberData.phone,
        address: newMemberData.address,
        skills: newMemberData.skills,
        assigned_projects: [],
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      setTeamMembers([...teamMembers, newMember]);
      setShowAddMember(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (role: string) => {
    setActiveRoleFilter(role);
    setShowRoleFilter(false);
  };

  // Get filtered team members
  const filteredMembers = getFilteredMembers();
  
  // Application handling functions
  const handleApproveApplication = (application: any) => {
    // Create a new team member from the application
    const newMember = {
      id: String(application.id),
      name: application.name,
      email: application.email,
      phone: application.phone,
      role: application.role,
      avatar: application.avatar,
      skills: application.skills,
      address: '123 Main St, City',
      assigned_projects: [],
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    // Add the new member to the team
    setTeamMembers([...teamMembers, newMember]);
    
    // Remove the application from the list
    setWorkerApplications(
      workerApplications.filter(app => app.id !== application.id)
    );
    
    // Close the applications modal if no more applications
    if (workerApplications.length === 1) {
      setShowApplications(false);
    }
  };
  
  const handleRejectApplication = (application: any) => {
    // Remove the application from the list
    setWorkerApplications(
      workerApplications.filter(app => app.id !== application.id)
    );
    
    // Close the applications modal if no more applications
    if (workerApplications.length === 1) {
      setShowApplications(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    // Check if it's a custom role
    const isCustomRole = customRoles.some(customRole => customRole.name === role);
    
    if (isCustomRole) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    
    switch(role) {
      case 'owner': return 'bg-ai-blue/10 text-ai-blue border-ai-blue/20';
      case 'generalContractor': return 'bg-ai-purple/10 text-ai-purple border-ai-purple/20';
      case 'mechanicalElectrical': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'designInstitute': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'steelStructure': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'package': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'supervisoryUnit': return 'bg-warning/10 text-warning border-warning/20';
      case 'bimConsultant': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'pendingApproval': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'ungrouped': return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
      case ROLES.PROJECT_MANAGER: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case ROLES.SITE_INSPECTOR: return 'bg-green-500/10 text-green-400 border-green-500/20';
      case ROLES.CONTRACTOR: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case ROLES.WORKER: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  
  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };

  // Handle view member details
  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };
  
  // Handle edit member
  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setNewMemberData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      address: member.address || '',
      skills: member.skills || ''
    });
    setShowEditMember(true);
  };

  // Handle delete member
  const handleDeleteMember = async (memberId: string) => {
    if (!user?.id) return;
    
    try {
      setIsDeletingMember(true);
      
      const response = await fetch(`https://matrixbim-server.onrender.com/api/auth/users/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Update local state
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      setShowMemberDetails(false);
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      setDeleteConfirmText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete member');
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Handle form input changes
  const handleNewMemberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMemberData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle update member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !user?.id) return;
    
    try {
      // Call the role update API if role has changed
      if (selectedMember.role !== newMemberData.role) {
        const roleResponse = await fetch('https://matrixbim-server.onrender.com/api/auth/users/role', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_uid: user.id,
            user_id: selectedMember.id,
            new_role: newMemberData.role
          }),
        });

        if (!roleResponse.ok) {
          throw new Error('Failed to update user role');
        }
      }

      // Update the local state with new data
      const updatedMembers = teamMembers.map(member => 
        member.id === selectedMember.id 
          ? { 
              ...member, 
              name: newMemberData.name,
              email: newMemberData.email,
              phone: newMemberData.phone,
              role: newMemberData.role,
              address: newMemberData.address,
              skills: newMemberData.skills
            } 
          : member
      );
      
      setTeamMembers(updatedMembers);
      setShowEditMember(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    }
  };

  // Update the stats section
  const getTotalProjects = () => {
    const projectIds = new Set();
    teamMembers.forEach(member => {
      member.assigned_projects.forEach(project => {
        projectIds.add(project.id);
      });
    });
    return projectIds.size;
  };

  // Format date safely
  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Add the delete confirmation modal
  const DeleteConfirmationModal = () => (
    <Dialog onClose={() => setShowDeleteConfirm(false)}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-dark-900 rounded-xl overflow-hidden max-w-md w-full mx-auto p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Delete Team Member</h2>
        <p className="text-gray-300 mb-4">
          Are you sure you want to delete "{memberToDelete?.name}"? This action cannot be undone.
        </p>
        <p className="text-gray-300 mb-4">
          Type <span className="font-mono text-error">DELETE</span> to confirm.
        </p>
        
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white mb-4"
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
            disabled={deleteConfirmText !== 'DELETE' || isDeletingMember}
            onClick={() => memberToDelete && handleDeleteMember(memberToDelete.id)}
          >
            {isDeletingMember ? (
              <>
                <span className="opacity-0">Delete Member</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                </div>
              </>
            ) : (
              'Delete Member'
            )}
          </Button>
        </div>
      </motion.div>
    </Dialog>
  );

  // Handle role assignment with custom roles
  const handleAssignCustomRole = async (userId: string, roleName: string) => {
    if (!user?.id) return;

    try {
      await roleService.assignRoleToUser({
        admin_uid: user.id,
        user_id: userId,
        new_role: roleName
      });

      // Update local state
      setTeamMembers(members => 
        members.map(member => 
          member.id === userId 
            ? { ...member, role: roleName }
            : member
        )
      );

      setSuccessMessage(`Role "${roleName}" assigned successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  // Delete custom role
  const handleDeleteRole = async (roleId: number) => {
    if (!user?.id) return;

    try {
      await roleService.deleteRole(roleId, user.id);
      await loadCustomRoles(); // Reload roles
      setSuccessMessage('Role deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-md z-50"
          >
            <div className="flex items-center justify-between">
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <RiCloseLine />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced header with visual appeal */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-blue-800 via-purple-700 to-indigo-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M50,0 L200,0 L200,200 L100,180 Q70,160 50,120 Q30,80 50,0"
              fill="url(#teamGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
                  <RiTeamLine className="mr-3 text-blue-300" />
                  {t('team.title')}
                </h1>
                <p className="text-blue-200 mt-2 max-w-2xl">
                  Manage your project team members, roles, and responsibilities
                </p>
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex flex-wrap gap-3 justify-start sm:justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Actions available to admins and owners */}
              {hasPermission(['admin']) && (
                <>
                  <Button 
                    variant="futuristic" 
                    leftIcon={<RiUserAddLine />}
                    onClick={() => setShowAddMember(true)}
                    animated
                    pulseEffect
                    glowing
                  >
                    {t('team.addMember')}
                  </Button>
                  
                  <Button 
                    variant="futuristic" 
                    leftIcon={<RiUserReceivedLine />}
                    onClick={() => setShowApplications(true)}
                    className="relative"
                    animated
                    glowing
                  >
                    {t('team.applications')}
                    {workerApplications.filter(app => app.status === 'pending').length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {workerApplications.filter(app => app.status === 'pending').length}
                      </span>
                    )}
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <Card className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative flex-grow w-full md:w-auto">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <IconContext.Provider value={{}}>
                  <RiSearchLine />
                </IconContext.Provider>
              </div>
              <input
                type="text"
                placeholder={t('team.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-10 w-full rounded-lg border-secondary-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-secondary-800 dark:text-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-between">
              {/* View Mode Toggle Button - sleeker design */}
              <div className="bg-secondary-100 dark:bg-secondary-800 rounded-full flex p-1 shadow-sm">
                <button 
                  className={`px-3 py-1.5 rounded-full flex items-center transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow transform scale-105' 
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/10'
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <RiListUnordered className="text-lg mr-1" />
                  <span className="text-sm font-medium">List</span>
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-full flex items-center transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow transform scale-105' 
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/10'
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <RiGridFill className="text-lg mr-1" />
                  <span className="text-sm font-medium">Grid</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Role filter with new dropdown */}
                <div className="relative">
                  <button 
                    ref={roleFilterButtonRef}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 bg-dark-800 text-gray-300 hover:bg-dark-700"
                    onClick={() => setShowRoleFilter(!showRoleFilter)}
                  >
                    <RiFilterLine className="text-ai-blue" />
                    <span>Role: {activeRoleFilter === 'all' ? 'All' : getRoleDisplayName(activeRoleFilter)}</span>
                    <RiArrowDownSLine className={`transition-transform duration-200 ${showRoleFilter ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <FilterDropdown 
                    isOpen={showRoleFilter}
                    onClose={() => setShowRoleFilter(false)}
                    activeFilter={activeRoleFilter}
                    onFilterChange={handleRoleFilterChange}
                    roleLabels={getAllRoleLabels()}
                    anchorRef={roleFilterButtonRef}
                  />
                </div>
              
                {/* Project filters - visible only to admins */}
                {hasPermission(['admin']) && (
                  <>
                    <button
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                          : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                      }`}
                      onClick={() => handleFilterChange('all')}
                    >
                      All Members
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          activeFilter === 'myProjects'
                            ? 'bg-ai-blue/10 text-ai-blue dark:bg-ai-blue/20'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-dark-700 dark:text-secondary-300 dark:hover:bg-dark-600'
                        }`}
                        onClick={() => handleFilterChange('myProjects')}
                      >
                        My Projects
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Team Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mr-4">
            <RiTeamLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {teamMembers.length}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Team Members</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mr-4">
            <RiGroupLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {Object.keys(teamMembers.reduce((acc, member) => {
                if (!acc[member.role]) acc[member.role] = true;
                return acc;
              }, {} as Record<string, boolean>)).length}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Different Roles</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mr-4">
            <RiBuilding4Line className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {getTotalProjects()}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Active Projects</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 mr-4">
            <RiUserReceivedLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {workerApplications.filter(app => app.status === 'pending').length}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Pending Applications</p>
          </div>
        </Card>
      </motion.div>
      
      {/* Role Management Section - Only for Admins */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-dark-900/50 border-dark-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="rounded-full p-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 mr-4">
                    <RiShieldUserLine className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Role Management</h2>
                    <p className="text-gray-400">Manage custom roles and permissions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRoleManagement(!showRoleManagement)}
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  >
                    <RiEyeLine className="mr-2" />
                    {showRoleManagement ? 'Hide Roles' : 'View Roles'}
                  </Button>
                  <Button
                    onClick={() => navigate('/create-role')}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <RiAddLine className="mr-2" />
                    Create Role
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showRoleManagement && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingRoles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        <span className="ml-3 text-gray-400">Loading roles...</span>
                      </div>
                    ) : customRoles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customRoles.map((role) => (
                          <motion.div
                            key={role.id}
                            className="bg-dark-800/50 border border-dark-600 rounded-lg p-4 hover:border-purple-500/30 transition-colors"
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm mr-3">
                                  {role.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-medium text-white">{role.name}</h3>
                                  <p className="text-xs text-gray-400">
                                    {role.permissions?.length || 0} permissions
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete Role"
                              >
                                <RiDeleteBinLine />
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                              {role.description || 'No description provided'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>Created: {new Date(role.created_at).toLocaleDateString()}</span>
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                Custom
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                          <RiShieldUserLine className="text-2xl text-purple-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No Custom Roles</h3>
                        <p className="text-gray-400 mb-4">Create custom roles to better manage your team permissions</p>
                        <Button
                          onClick={() => navigate('/create-role')}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                        >
                          <RiAddLine className="mr-2" />
                          Create Your First Role
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* No members message */}
      {filteredMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <RiTeamLine className="text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">{t('team.noMembersFound')}</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            {searchQuery 
              ? t('team.noMembersFoundSearch')
              : hasPermission(['admin', 'projectManager'])
                  ? t('team.noMembersFoundAdmin')
                  : t('team.noMembersFoundUser')
            }
          </p>
          {hasPermission(['admin', 'projectManager']) && !searchQuery && (
            <Button 
              variant="primary" 
              leftIcon={<RiUserAddLine />}
              onClick={() => setShowAddMember(true)}
            >
              {t('team.addFirstTeamMember')}
            </Button>
          )}
        </div>
      )}
      
      {/* List View (Horizontal Layout) */}
      {filteredMembers.length > 0 && viewMode === 'list' && (
        <div className="space-y-4">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-transparent hover:border-ai-blue/20 group">
                <div className="flex flex-col md:flex-row">
                  <div className="p-5 md:w-72 bg-gradient-to-br from-dark-800 to-dark-900 flex items-center md:border-r border-dark-700 relative overflow-hidden">
                    {/* Background pattern for visual interest */}
                    <div className="absolute inset-0 opacity-5 bg-ai-dots"></div>
                    
                    {/* Animated highlight on hover */}
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-r from-ai-blue/0 via-ai-purple/20 to-ai-blue/0 opacity-0 group-hover:opacity-100 blur-xl"
                      animate={{ 
                        x: ['-100%', '200%'], 
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3,
                        ease: "linear",
                        repeatDelay: 1
                      }}
                    />
                    
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-full mr-4 border-2 border-dark-700 z-10 group-hover:border-ai-blue/50 transition-all duration-300"
                    />
                    <div className="z-10">
                      <h3 className="text-lg font-bold text-white">{member.name}</h3>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(member.role)}`}>
                          {getRoleDisplayName(member.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <RiMailLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-300 text-sm break-all">{member.email}</span>
                        </div>
                        <div className="flex items-start">
                          <RiPhoneLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{member.phone}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <RiUserLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">Member since {formatDate(member.joinDate)}</span>
                        </div>
                        <div className="flex items-start">
                          <RiBuilding4Line className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">
                            {member.assigned_projects.length > 0 ? (
                              <span>{member.assigned_projects.length} Projects</span>
                            ) : (
                              <span className="text-gray-500">No assigned projects</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end md:justify-end space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleViewMember(member)}
                          className="text-sm px-3 py-1.5"
                        >
                          View Details
                        </Button>
                        
                        {/* Edit button only visible for admin users */}
                        {user?.role === 'admin' && (
                          <Button
                            variant="accent"
                            onClick={() => handleEditMember(member)}
                            className="text-sm px-3 py-1.5"
                          >
                            <RiUserSettingsLine />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Grid View */}
      {filteredMembers.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300 border border-transparent hover:border-ai-blue/20 group">
                <div className="p-6 pb-4 bg-gradient-to-br from-dark-800 to-dark-900 flex items-center relative overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5 bg-ai-dots"></div>
                  
                  {/* Animated highlight on hover */}
                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-ai-blue/0 via-ai-purple/20 to-ai-blue/0 opacity-0 group-hover:opacity-100 blur-xl"
                    animate={{ 
                      x: ['-100%', '200%'], 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "linear",
                      repeatDelay: 1
                    }}
                  />
                  
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-16 h-16 rounded-full mr-4 border-2 border-dark-700 z-10 group-hover:border-ai-blue/50 transition-all duration-300"
                  />
                  <div className="z-10">
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleBadgeColor(member.role)}`}>
                        {getRoleDisplayName(member.role)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 pt-3 flex-grow flex flex-col">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start">
                      <RiMailLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300 text-sm break-all">{member.email}</span>
                    </div>
                    <div className="flex items-start">
                      <RiPhoneLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{member.phone}</span>
                    </div>
                    
                    {member.assigned_projects.length > 0 ? (
                      <div className="flex items-start">
                        <RiBuilding4Line className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="text-gray-300 text-sm block mb-1">Projects:</span>
                          <div className="flex flex-wrap gap-1">
                            {member.assigned_projects.map((project: Project) => (
                              <span 
                                key={project.id}
                                className="px-2 py-0.5 text-xs rounded-full bg-ai-blue/10 text-ai-blue border border-ai-blue/20"
                              >
                                {project.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <RiBuilding4Line className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-500 text-sm">No assigned projects</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-grow"
                      onClick={() => handleViewMember(member)}
                    >
                      View Details
                    </Button>
                    
                    {/* Edit button only visible for admin users */}
                    {user?.role === 'admin' && (
                      <Button
                        variant="accent"
                        onClick={() => handleEditMember(member)}
                      >
                        <RiUserSettingsLine />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Member Details Modal */}
      <AnimatePresence>
        {showMemberDetails && selectedMember && (
          <Dialog onClose={() => setShowMemberDetails(false)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-dark-900 rounded-xl overflow-hidden max-w-3xl w-full mx-auto"
            >
              <div className="flex flex-col md:flex-row">
                {/* Sidebar with photo and basic details */}
                <div className="bg-dark-800 p-6 md:w-1/3 flex flex-col items-center md:items-start">
                  <img 
                    src={selectedMember.avatar} 
                    alt={selectedMember.name} 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dark-700 mb-4"
                  />
                  <h2 className="text-xl font-bold text-white mb-1">{selectedMember.name}</h2>
                  <span className={`px-2 py-0.5 text-xs rounded-full border mb-4 ${getRoleBadgeColor(selectedMember.role)}`}>
                    {getRoleDisplayName(selectedMember.role)}
                  </span>
                  
                  <div className="space-y-3 w-full">
                    <div className="flex items-start">
                      <RiMailLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300 text-sm break-all">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-start">
                      <RiPhoneLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{selectedMember.phone}</span>
                    </div>
                    <div className="flex items-start">
                      <RiUserLine className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">Member since {formatDate(selectedMember.joinDate)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Main content */}
                <div className="p-6 md:w-2/3 relative">
                  <button 
                    onClick={() => setShowMemberDetails(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white transition-colors"
                  >
                    <RiCloseLine />
                  </button>
                  
                  <h3 className="text-lg font-bold text-white mb-3">Skills</h3>
                  <p className="text-gray-300 mb-6">
                    {selectedMember.skills || 'No skills specified'}
                  </p>
                  
                  <h3 className="text-lg font-bold text-white mb-3">Address</h3>
                  <p className="text-gray-300 mb-6">
                    {selectedMember.address || 'No address specified'}
                  </p>
                  
                  <h3 className="text-lg font-bold text-white mb-3">Assigned Projects</h3>
                  {selectedMember.assigned_projects.length === 0 ? (
                    <p className="text-gray-500 mb-6">Not assigned to any projects</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedMember.assigned_projects.map((project: Project) => (
                        <span 
                          key={project.id}
                          className="px-3 py-1 text-sm rounded-full bg-ai-blue/10 text-ai-blue border border-ai-blue/20"
                        >
                          {project.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowMemberDetails(false)}
                    >
                      Close
                    </Button>
                    
                    {/* Edit and Delete buttons only visible for admin users */}
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="primary"
                          leftIcon={<RiUserSettingsLine />}
                          onClick={() => {
                            setShowMemberDetails(false);
                            handleEditMember(selectedMember);
                          }}
                        >
                          Edit Member
                        </Button>
                        
                        <Button
                          variant="accent"
                          onClick={() => {
                            setMemberToDelete(selectedMember);
                            setShowDeleteConfirm(true);
                          }}
                          className="bg-error hover:bg-error/80"
                        >
                          <RiDeleteBinLine className="mr-2" />
                          Delete Member
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
      
      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <Dialog onClose={() => setShowAddMember(false)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add New Team Member</h2>
                  <button 
                    onClick={() => setShowAddMember(false)}
                    className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
                  >
                    <RiCloseLine />
                  </button>
                </div>
                
                <form onSubmit={handleAddMember}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={newMemberData.name}
                        onChange={handleNewMemberChange}
                        className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                          Email <span className="text-error">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={newMemberData.email}
                          onChange={handleNewMemberChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                          placeholder="user@example.com"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                          Phone <span className="text-error">*</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          value={newMemberData.phone}
                          onChange={handleNewMemberChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
                        Role <span className="text-error">*</span>
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={newMemberData.role}
                        onChange={handleNewMemberChange}
                        className="form-select w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        required
                      >
                        <option value="">Select a role...</option>
                        {/* Only show custom roles */}
                        {customRoles.map(role => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">
                        Address
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={newMemberData.address}
                        onChange={handleNewMemberChange}
                        className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        placeholder="Street, City, State, ZIP"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-gray-300 mb-1">
                        Skills & Qualifications
                      </label>
                      <textarea
                        id="skills"
                        name="skills"
                        rows={3}
                        value={newMemberData.skills}
                        onChange={handleNewMemberChange}
                        className="form-textarea w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        placeholder="List skills, qualifications and experience"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddMember(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      Add Team Member
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
      
      {/* Edit Member Modal */}
      <AnimatePresence>
        {showEditMember && selectedMember && (
          <Dialog onClose={() => setShowEditMember(false)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-dark-900 rounded-xl overflow-hidden max-w-2xl w-full mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Edit Team Member</h2>
                  <button 
                    onClick={() => setShowEditMember(false)}
                    className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
                  >
                    <RiCloseLine />
                  </button>
                </div>
                
                <form onSubmit={handleUpdateMember}>
                  {/* Same fields as Add Member form but pre-filled with selected member data */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300 mb-1">
                        Full Name <span className="text-error">*</span>
                      </label>
                      <input
                        id="edit-name"
                        name="name"
                        type="text"
                        required
                        value={newMemberData.name}
                        onChange={handleNewMemberChange}
                        className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-300 mb-1">
                          Email <span className="text-error">*</span>
                        </label>
                        <input
                          id="edit-email"
                          name="email"
                          type="email"
                          required
                          value={newMemberData.email}
                          onChange={handleNewMemberChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-300 mb-1">
                          Phone <span className="text-error">*</span>
                        </label>
                        <input
                          id="edit-phone"
                          name="phone"
                          type="tel"
                          required
                          value={newMemberData.phone}
                          onChange={handleNewMemberChange}
                          className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-role" className="block text-sm font-medium text-gray-300 mb-1">
                        Role <span className="text-error">*</span>
                      </label>
                      <select
                        id="edit-role"
                        name="role"
                        value={newMemberData.role}
                        onChange={handleNewMemberChange}
                        className="form-select w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                        disabled={!hasPermission(['admin'])}
                      >
                        <option value="">Select a role...</option>
                        {/* Only show custom roles */}
                        {customRoles.map(role => (
                          <option key={role.id} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-address" className="block text-sm font-medium text-gray-300 mb-1">
                        Address
                      </label>
                      <input
                        id="edit-address"
                        name="address"
                        type="text"
                        value={newMemberData.address}
                        onChange={handleNewMemberChange}
                        className="form-input w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="edit-skills" className="block text-sm font-medium text-gray-300 mb-1">
                        Skills & Qualifications
                      </label>
                      <textarea
                        id="edit-skills"
                        name="skills"
                        rows={3}
                        value={newMemberData.skills}
                        onChange={handleNewMemberChange}
                        className="form-textarea w-full rounded-lg border-dark-700 bg-dark-800 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowEditMember(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
      
      {/* Worker Applications Modal */}
      <AnimatePresence>
        {showApplications && (
          <Dialog onClose={() => setShowApplications(false)}>
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-dark-900 rounded-xl overflow-hidden max-w-3xl w-full mx-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Worker Applications</h2>
                  <button 
                    onClick={() => setShowApplications(false)}
                    className="p-2 rounded-full hover:bg-dark-800 text-gray-400 hover:text-white"
                  >
                    <RiCloseLine />
                  </button>
                </div>
                
                {workerApplications.length === 0 ? (
                  <div className="py-8 text-center">
                    <RiUserReceivedLine className="text-4xl text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No worker applications at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workerApplications.map(application => (
                      <Card key={application.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={application.avatar}
                            alt={application.name}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                          <div className="flex-grow">
                            <div className="flex flex-wrap justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-medium text-white">{application.name}</h3>
                                <p className="text-sm text-gray-400">
                                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full border mr-2 ${getRoleBadgeColor(application.role)}`}>
                                    {getRoleDisplayName(application.role)}
                                  </span>
                                  Applied on {application.dateApplied}
                                </p>
                              </div>
                              <span className={`
                                px-2.5 py-1 rounded-full text-xs font-medium
                                ${application.status === 'pending' ? 'bg-warning/10 text-warning' : 
                                  application.status === 'approved' ? 'bg-success/10 text-success' : 
                                  'bg-error/10 text-error'}
                              `}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="text-sm text-gray-400">
                                <div className="flex items-center mb-1">
                                  <RiMailLine className="mr-2" />
                                  <span>{application.email}</span>
                                </div>
                                <div className="flex items-center">
                                  <RiPhoneLine className="mr-2" />
                                  <span>{application.phone}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400 mb-1">Skills:</p>
                                <p className="text-sm text-gray-300">{application.skills}</p>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 text-sm p-3 bg-dark-800 rounded-lg mb-3">
                              "{application.message}"
                            </p>
                            
                            {application.status === 'pending' && (
                              <div className="flex justify-end gap-3 mt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectApplication(application)}
                                  className="text-xs ml-2"
                                >
                                  <RiCloseLine className="mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  variant="accent"
                                  onClick={() => handleApproveApplication(application)}
                                  className="text-xs"
                                >
                                  <RiCheckLine className="mr-1" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowApplications(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Add the delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && memberToDelete && <DeleteConfirmationModal />}
      </AnimatePresence>
    </div>
  );
};

export default TeamPage; 