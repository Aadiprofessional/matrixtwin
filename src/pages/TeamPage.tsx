import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconContext } from 'react-icons';
import { Dialog } from '../components/ui/Dialog';
import ReactDOM from 'react-dom';
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
  RiOrganizationChart
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

const TeamPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list' - default to list view
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const roleFilterButtonRef = useRef<HTMLButtonElement>(null);
  
  // Form states
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'generalContractor',
    address: '',
    skills: ''
  });
  
  // Mock team data
  const [teamMembers, setTeamMembers] = useState([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@matrixtwin.com',
      phone: '+1 (555) 123-4567',
      role: 'owner',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0062C3&color=fff',
      address: '123 Admin St, New York, NY',
      skills: 'Project Management, Administration, System Design',
      projects: [
        { id: 1, name: 'Project Alpha' },
        { id: 2, name: 'Harbor Tower' }
      ],
      joinDate: '2022-06-15'
    },
    {
      id: '2',
      name: 'Project Manager',
      email: 'pm@matrixtwin.com',
      phone: '+1 (555) 234-5678',
      role: 'generalContractor',
      avatar: 'https://ui-avatars.com/api/?name=Project+Manager&background=465B7C&color=fff',
      address: '456 Manager Ave, Chicago, IL',
      skills: 'Team Leadership, Construction Planning, Budgeting',
      projects: [
        { id: 1, name: 'Project Alpha' },
        { id: 3, name: 'Metro Station' }
      ],
      joinDate: '2022-07-22'
    },
    {
      id: '3',
      name: 'Inspector',
      email: 'inspector@matrixtwin.com',
      phone: '+1 (555) 345-6789',
      role: 'supervisoryUnit',
      avatar: 'https://ui-avatars.com/api/?name=Inspector&background=BB6904&color=fff',
      address: '789 Inspector Rd, Boston, MA',
      skills: 'Safety Protocols, Building Codes, Quality Assurance',
      projects: [
        { id: 1, name: 'Project Alpha' }
      ],
      joinDate: '2022-09-10'
    },
    {
      id: '4',
      name: 'Contractor',
      email: 'contractor@matrixtwin.com',
      phone: '+1 (555) 456-7890',
      role: 'mechanicalElectrical',
      avatar: 'https://ui-avatars.com/api/?name=Contractor&background=5D5D5D&color=fff',
      address: '321 Contractor Blvd, Dallas, TX',
      skills: 'Electrical Systems, HVAC, Plumbing',
      projects: [
        { id: 2, name: 'Harbor Tower' }
      ],
      joinDate: '2025-01-15'
    },
    {
      id: '5',
      name: 'Worker',
      email: 'worker@matrixtwin.com',
      phone: '+1 (555) 567-8901',
      role: 'designInstitute',
      avatar: 'https://ui-avatars.com/api/?name=Worker&background=3D3D3D&color=fff',
      address: '654 Worker Ln, Miami, FL',
      skills: 'Carpentry, Masonry, General Labor',
      projects: [
        { id: 1, name: 'Project Alpha' }
      ],
      joinDate: '2025-02-28'
    },
    {
      id: '6',
      name: 'Steel Structure Expert',
      email: 'steel@matrixtwin.com',
      phone: '+1 (555) 222-3333',
      role: 'steelStructure',
      avatar: 'https://ui-avatars.com/api/?name=Steel+Expert&background=4D6D9D&color=fff',
      address: '789 Steel Ave, Pittsburgh, PA',
      skills: 'Steel Structure Design, Welding, Structural Analysis',
      projects: [
        { id: 2, name: 'Harbor Tower' }
      ],
      joinDate: '2023-05-18'
    },
    {
      id: '7',
      name: 'Package Manager',
      email: 'package@matrixtwin.com',
      phone: '+1 (555) 444-5555',
      role: 'package',
      avatar: 'https://ui-avatars.com/api/?name=Package+Manager&background=7D4D8D&color=fff',
      address: '456 Delivery St, Seattle, WA',
      skills: 'Logistics, Supply Chain Management, Procurement',
      projects: [
        { id: 3, name: 'Metro Station' }
      ],
      joinDate: '2023-11-10'
    },
    {
      id: '8',
      name: 'BIM Specialist',
      email: 'bim@matrixtwin.com',
      phone: '+1 (555) 666-7777',
      role: 'bimConsultant',
      avatar: 'https://ui-avatars.com/api/?name=BIM+Specialist&background=2D8D6D&color=fff',
      address: '123 BIM Blvd, San Francisco, CA',
      skills: '3D Modeling, BIM Coordination, Revit, AutoCAD',
      projects: [
        { id: 1, name: 'Project Alpha' },
        { id: 2, name: 'Harbor Tower' }
      ],
      joinDate: '2023-08-22'
    },
    {
      id: '9',
      name: 'New Applicant',
      email: 'applicant@example.com',
      phone: '+1 (555) 888-9999',
      role: 'pendingApproval',
      avatar: 'https://ui-avatars.com/api/?name=New+Applicant&background=8D8D8D&color=fff',
      address: '789 Pending St, Houston, TX',
      skills: 'Project Management, Civil Engineering',
      projects: [],
      joinDate: '2025-05-01'
    }
  ]);
  
  // Mock worker applications
  const [workerApplications, setWorkerApplications] = useState([
    {
      id: 1,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 987-6543',
      role: 'worker',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=3D3D3D&color=fff',
      skills: 'Carpentry, Drywall Installation, Painting',
      message: "I have 7 years of experience in construction and I'm looking for new opportunities.",
      status: 'pending',
      dateApplied: '2025-09-30'
    },
    {
      id: 2,
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '+1 (555) 876-5432',
      role: 'contractor',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=5D5D5D&color=fff',
      skills: 'Electrical Wiring, HVAC Systems, Building Automation',
      message: "Certified electrical contractor with 10+ years of experience in commercial projects.",
      status: 'pending',
      dateApplied: '2025-10-05'
    }
  ]);
  
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
  const getFilteredMembers = () => {
    return teamMembers.filter(member => {
      // Text search
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Project filter
      const matchesFilter = activeFilter === 'all' || 
        (activeFilter === 'myProjects' && 
          user?.role === 'projectManager' && 
          member.projects.some(project => user.id !== member.id));
      
      // Role filter
      const matchesRole = activeRoleFilter === 'all' || member.role === activeRoleFilter;
      
      return matchesSearch && matchesFilter && matchesRole;
    });
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
      phone: member.phone,
      role: member.role,
      address: member.address || '',
      skills: member.skills || ''
    });
    setShowEditMember(true);
  };
  
  // Handle delete member
  const handleDeleteMember = (memberId: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    setShowMemberDetails(false);
  };
  
  // Handle new member form input changes
  const handleNewMemberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewMemberData({
      ...newMemberData,
      [name]: value
    });
  };
  
  // Handle add new member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new member
    const newMember = {
      id: String(teamMembers.length + 1),
      name: newMemberData.name,
      email: newMemberData.email,
      phone: newMemberData.phone,
      role: newMemberData.role,
      avatar: `https://ui-avatars.com/api/?name=${newMemberData.name.replace(' ', '+')}&background=3D3D3D&color=fff`,
      address: newMemberData.address,
      skills: newMemberData.skills,
      projects: [],
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    // Add to team members
    setTeamMembers([...teamMembers, newMember]);
    
    // Reset form and close modal
    setNewMemberData({
      name: '',
      email: '',
      phone: '',
      role: 'generalContractor',
      address: '',
      skills: ''
    });
    setShowAddMember(false);
  };
  
  // Handle update member
  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember) return;
    
    // Update member data
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
  };
  
  // Handle application approval
  const handleApplicationAction = (applicationId: number, action: 'approve' | 'reject') => {
    // Find the application
    const application = workerApplications.find(app => app.id === applicationId);
    if (!application) return;
    
    if (action === 'approve') {
      // Add new member
      const newMember = {
        id: String(application.id),
        name: application.name,
        email: application.email,
        phone: application.phone,
        role: application.role,
        avatar: application.avatar,
        skills: application.skills,
        address: '123 Main St, City',
        projects: [],
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      
      setTeamMembers([...teamMembers, newMember]);
    }
    
    // Update application status
    const updatedApplications = workerApplications.map(app => 
      app.id === applicationId 
        ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' } 
        : app
    );
    setWorkerApplications(updatedApplications);
  };
  
  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch(role) {
      case 'owner': return 'Owner Unit';
      case 'generalContractor': return 'General Contractor';
      case 'mechanicalElectrical': return 'Mechanical & Electrical';
      case 'designInstitute': return 'Design Institute';
      case 'steelStructure': return 'Steel Structure';
      case 'package': return 'Package';
      case 'supervisoryUnit': return 'Supervisory Unit';
      case 'bimConsultant': return 'BIM Consultant';
      case 'pendingApproval': return 'Pending Approval';
      case 'ungrouped': return 'Ungrouped';
      default: return role;
    }
  };
  
  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
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
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  
  // Modal animation
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  };

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
      projects: [],
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

  // Role labels for the dropdown
  const roleLabels = {
    'all': t('team.allRoles'),
    'owner': 'Owner Unit',
    'generalContractor': 'General Contractor',
    'mechanicalElectrical': 'Mechanical and Electrical',
    'designInstitute': 'Design Institute',
    'steelStructure': 'Steel Structure',
    'package': 'Package',
    'supervisoryUnit': 'Supervisory Unit',
    'bimConsultant': 'BIM Consultant',
    'ungrouped': 'Ungrouped',
    'pendingApproval': 'Pending Approval'
  };

  return (
    <div className="container mx-auto px-4 sm:px-6">
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
                    roleLabels={roleLabels}
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
              {Object.keys(teamMembers.reduce((acc, member) => {
                member.projects.forEach(project => {
                  if (!acc[project.id]) acc[project.id] = true;
                });
                return acc;
              }, {} as Record<number, boolean>)).length}
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
                          <span className="text-gray-300 text-sm">Member since {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-start">
                          <RiBuilding4Line className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">
                            {member.projects.length > 0 ? (
                              <span>{member.projects.length} Projects</span>
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
                        
                        {/* Edit/Remove options only for admins */}
                        {hasPermission(['admin']) && (
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
                    
                    {member.projects.length > 0 ? (
                      <div className="flex items-start">
                        <RiBuilding4Line className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <span className="text-gray-300 text-sm block mb-1">Projects:</span>
                          <div className="flex flex-wrap gap-1">
                            {member.projects.map(project => (
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
                    
                    {/* Edit/Remove options only for admins */}
                    {hasPermission(['admin']) && (
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
                      <span className="text-gray-300 text-sm">Member since {new Date(selectedMember.joinDate).toLocaleDateString()}</span>
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
                  {selectedMember.projects.length === 0 ? (
                    <p className="text-gray-500 mb-6">Not assigned to any projects</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedMember.projects.map((project: any) => (
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
                    
                    {/* Edit button for admins */}
                    {hasPermission(['admin']) && (
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
                    )}
                    
                    {/* Delete button - admin only */}
                    {hasPermission(['admin']) && (
                      <Button
                        variant="accent"
                        onClick={() => handleDeleteMember(selectedMember.id)}
                        className="mt-6"
                      >
                        <RiDeleteBinLine className="mr-2" />
                        Remove Member
                      </Button>
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
                      >
                        {/* Admin can assign any role */}
                        {hasPermission(['admin']) && (
                          <>
                            <option value="owner">Owner Unit</option>
                            <option value="generalContractor">General Contractor</option>
                            <option value="mechanicalElectrical">Mechanical and Electrical</option>
                            <option value="designInstitute">Design Institute</option>
                            <option value="steelStructure">Steel Structure</option>
                            <option value="package">Package</option>
                            <option value="supervisoryUnit">Supervisory Unit</option>
                            <option value="bimConsultant">BIM Consultant</option>
                            <option value="ungrouped">Ungrouped</option>
                          </>
                        )}
                        
                        {/* Project Manager can only assign certain roles */}
                        {!hasPermission(['admin']) && hasPermission(['projectManager']) && (
                          <>
                            <option value="mechanicalElectrical">Mechanical and Electrical</option>
                            <option value="steelStructure">Steel Structure</option>
                            <option value="package">Package</option>
                            <option value="ungrouped">Ungrouped</option>
                          </>
                        )}
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
                        disabled={!hasPermission(['admin'])} // Only admin can change roles
                      >
                        <option value="owner">Owner Unit</option>
                        <option value="generalContractor">General Contractor</option>
                        <option value="mechanicalElectrical">Mechanical and Electrical</option>
                        <option value="designInstitute">Design Institute</option>
                        <option value="steelStructure">Steel Structure</option>
                        <option value="package">Package</option>
                        <option value="supervisoryUnit">Supervisory Unit</option>
                        <option value="bimConsultant">BIM Consultant</option>
                        <option value="ungrouped">Ungrouped</option>
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
    </div>
  );
};

export default TeamPage; 