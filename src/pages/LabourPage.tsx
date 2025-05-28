import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RiAddLine, RiGroupLine, RiCalendarCheckLine, RiTimeLine, RiFileListLine, RiUserLine, RiArrowUpLine, RiArrowDownLine, RiCheckLine, RiCloseLine, RiSearchLine, RiArrowRightSLine, RiFilter3Line, RiLayoutGridLine, RiListCheck, RiArrowLeftLine, RiArrowRightLine, RiLoader4Line, RiFlowChart, RiSettings4Line, RiNotificationLine, RiTeamLine, RiPercentLine, RiErrorWarningLine, RiFileWarningLine, RiTaskLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { MonthlyReturnTemplate } from '../components/forms/MonthlyReturnTemplate';
import { Dialog } from '../components/ui/Dialog';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';
import { emailService } from '../services/emailService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string;
  settings: Record<string, any>;
}

interface LabourEntry {
  id: string;
  date: string;
  project: string;
  project_id?: string;
  submitter: string;
  labour_type: string;
  worker_count: number;
  hours_worked: number;
  trade_type: string;
  work_description: string;
  notes: string;
  form_data?: any;
  status: string;
  current_node_index: number;
  labour_workflow_nodes?: any[];
  labour_assignments?: any[];
  labour_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface Worker {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  hours: number;
  role: string;
  avatar: string;
}

interface LabourRecord {
  id: number;
  date: string;
  workers: number;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  project: string;
}

// People selector modal component
const PeopleSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title: string;
  users: User[];
  loading: boolean;
}> = ({ isOpen, onClose, onSelect, title, users, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter users based on search
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <RiUserLine className="mr-2" />
            {title}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px] p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              <RiLoader4Line className="animate-spin text-2xl mx-auto mb-2" />
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors flex items-center"
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-medium mr-3">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{user.role}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const LabourPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workerCount, setWorkerCount] = useState(1);
  const [hoursWorked, setHoursWorked] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'workers'>('records');
  const [statsTimeframe, setStatsTimeframe] = useState<'day' | 'week' | 'month'>('week');
  
  // API integration states
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>([]);
  const [selectedLabourEntry, setSelectedLabourEntry] = useState<LabourEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  
  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', settings: {} },
    { id: 'review', type: 'node', name: 'Labour Review & Approval', settings: {} },
    { id: 'end', type: 'end', name: 'Complete', settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [selectedCcs, setSelectedCcs] = useState<User[]>([]);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');
  
  // Define interface for form data
  interface LabourFormData {
    returnDate?: string;
    project?: string;
    labourType?: string;
    submitterName?: string;
    numberOfWorkers?: number;
    hoursWorked?: number;
    tradeType?: string;
    workDescription?: string;
  }
  
  // Multi-step form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState<LabourFormData>({
    returnDate: new Date().toISOString().split('T')[0],
    numberOfWorkers: 1,
    hoursWorked: 8
  } as LabourFormData);
  
  // Add state for grid/list view and filters
  const [showGridView, setShowGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');

  // Fetch labour entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchLabourEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id]);

  // Fetch labour entries from API with project filtering
  const fetchLabourEntries = async () => {
    try {
      setLoading(true);
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`https://matrixbim-server.onrender.com/api/labour/list/${user?.id}${projectParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLabourEntries(data);
      } else {
        console.error('Failed to fetch labour entries');
      }
    } catch (error) {
      console.error('Error fetching labour entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API (similar to Projects.tsx)
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`https://matrixbim-server.onrender.com/api/auth/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtered entries based on search
  const filteredEntries = labourEntries.filter(entry => 
    entry.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.submitter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.labour_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.date.includes(searchTerm)
  );

  const addNewNode = () => {
    const newNode: ProcessNode = {
      id: `node_${Date.now()}`,
      type: 'node',
      name: `Process Step ${processNodes.length - 1}`,
      settings: {}
    };
    
    // Insert before the end node
    const newNodes = [...processNodes];
    newNodes.splice(-1, 0, newNode);
    setProcessNodes(newNodes);
  };

  const openPeopleSelector = (type: 'executor' | 'cc') => {
    setPeopleSelectorType(type);
    setShowPeopleSelector(true);
  };

  const handleUserSelection = (selectedUser: User) => {
    if (peopleSelectorType === 'executor' && selectedNode) {
      const updatedNodes = processNodes.map(node => 
        node.id === selectedNode.id 
          ? { ...node, executor: selectedUser.name }
          : node
      );
      setProcessNodes(updatedNodes);
      setSelectedNode({ ...selectedNode, executor: selectedUser.name });
    } else if (peopleSelectorType === 'cc') {
      if (!selectedCcs.find(cc => cc.id === selectedUser.id)) {
        setSelectedCcs([...selectedCcs, selectedUser]);
      }
    }
  };

  const removeUserFromCc = (userId: string) => {
    setSelectedCcs(selectedCcs.filter(cc => cc.id !== userId));
  };

  const handleCreateReturn = (formData: any) => {
    setPendingFormData(formData);
    setShowNewReturn(false);
    setShowProcessFlow(true);
    setSelectedNode(processNodes.find(node => node.type === 'node') || null);
  };

  const handleFinalSave = async () => {
    if (!pendingFormData || !user?.id) return;
    
    try {
      const response = await fetch('https://matrixbim-server.onrender.com/api/labour/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: pendingFormData,
          processNodes: processNodes,
          selectedCcs: selectedCcs,
          createdBy: user.id,
          projectId: selectedProject?.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Send email notifications
        try {
          const ccEmails = selectedCcs.map(cc => cc.email);
          await emailService.sendLabourNotification({
            entryId: result.id || 'new',
            projectName: selectedProject?.name || 'Unknown Project',
            action: 'created',
            ccRecipients: ccEmails,
            formData: pendingFormData,
            currentNodeName: processNodes.find(node => node.type === 'node')?.name
          });
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
        }
        
        // Refresh labour entries
        await fetchLabourEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setSelectedCcs([]);
        setSelectedNode(null);
        
        // Show success message
        alert('Labour entry created successfully! Notifications have been sent to assigned users.');
      } else {
        const error = await response.json();
        alert(`Failed to create labour entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating labour entry:', error);
      alert('Failed to create labour entry. Please try again.');
    }
  };

  const handleCancelProcessFlow = () => {
    setPendingFormData(null);
    setShowProcessFlow(false);
    setSelectedCcs([]);
    setSelectedNode(null);
  };

  const handleViewDetails = async (entry: LabourEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`https://matrixbim-server.onrender.com/api/labour/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedLabourEntry(fullEntry);
        setShowDetails(true);
      } else {
        setSelectedLabourEntry(entry);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedLabourEntry(entry);
      setShowDetails(true);
    }
  };

  const handleViewForm = async (entry: LabourEntry) => {
    try {
      // Fetch full entry details including form data
      const response = await fetch(`https://matrixbim-server.onrender.com/api/labour/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedLabourEntry(fullEntry);
        setShowFormView(true);
      } else {
        setSelectedLabourEntry(entry);
        setShowFormView(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedLabourEntry(entry);
      setShowFormView(true);
    }
  };

  const handleFormUpdate = async (formData: any) => {
    if (!selectedLabourEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://matrixbim-server.onrender.com/api/labour/${selectedLabourEntry.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: formData,
          updatedBy: user.id
        })
      });

      if (response.ok) {
        // Refresh labour entries
        await fetchLabourEntries();
        setShowFormView(false);
        setSelectedLabourEntry(null);
        alert('Labour entry updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update labour entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating labour entry:', error);
      alert('Failed to update labour entry. Please try again.');
    }
  };

  const handleWorkflowAction = async (action: 'approve' | 'reject') => {
    if (!selectedLabourEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://matrixbim-server.onrender.com/api/labour/${selectedLabourEntry.id}/workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          userId: user.id,
          comment: '' // You can add a comment input if needed
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Send email notifications
        try {
          const ccEmails = selectedLabourEntry.labour_assignments?.map(assignment => assignment.user_email).filter(Boolean) || [];
          await emailService.sendLabourNotification({
            entryId: selectedLabourEntry.id,
            projectName: selectedLabourEntry.project,
            action: action === 'approve' ? 'approved' : 'rejected',
            ccRecipients: ccEmails,
            formData: selectedLabourEntry.form_data,
            currentNodeName: selectedLabourEntry.labour_workflow_nodes?.find(node => 
              node.node_order === selectedLabourEntry.current_node_index
            )?.node_name,
            comments: '' // Add comment if available
          });
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
        }
        
        // Refresh labour entries
        await fetchLabourEntries();
        setShowDetails(false);
        setSelectedLabourEntry(null);
        alert(`Labour entry ${action}d successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} labour entry: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing labour entry:`, error);
      alert(`Failed to ${action} labour entry. Please try again.`);
    }
  };

  const canUserEditEntry = (entry: LabourEntry) => {
    if (!user) return false;
    
    // Admin can edit any entry
    if (user.role === 'admin') return true;
    
    // Creator can edit their own entries
    if (entry.created_by === user.id) return true;
    
    // Check if user is assigned to this entry
    return entry.labour_assignments?.some(assignment => 
      assignment.user_id === user.id && assignment.role === 'executor'
    ) || false;
  };

  const canUserApproveEntry = (entry: LabourEntry) => {
    if (!user) return false;
    
    // Only allow approval if entry is pending and user has permission
    if (entry.status !== 'pending') return false;
    
    // Admin can approve any entry
    if (user.role === 'admin') return true;
    
    // Check if user is the current workflow executor
    const currentNode = entry.labour_workflow_nodes?.find(node => 
      node.node_order === entry.current_node_index && node.status === 'pending'
    );
    
    return currentNode?.executor_name === user.name;
  };

  const getWorkflowStatusBadge = (entry: LabourEntry) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status as keyof typeof statusColors] || statusColors.pending}`}>
        {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1) || 'Pending'}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced Header with gradient and pattern */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M0,0 L100,0 Q70,50 100,100 L0,100 Z"
              fill="url(#gradient)" 
              className="opacity-30"
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
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
                  <RiGroupLine className="mr-3 text-blue-400" />
                  {t('labour.title')}
                </h1>
                <p className="text-blue-200 mt-2 max-w-2xl">
                  Track workforce attendance, manage worker hours, and generate accurate labour reports for project costing
                </p>
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button 
                variant="futuristic" 
                leftIcon={<RiAddLine />}
                onClick={() => setShowNewReturn(true)}
                animated
                pulseEffect
                glowing
              >
                New Return
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiFileListLine />}
                animated
                glowing
              >
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Live Stats Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiUserLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Workers</div>
                <div className="text-2xl font-bold text-white">{labourEntries.length}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-indigo-500/20 rounded-full mr-4">
                <RiTimeLine className="text-2xl text-indigo-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Hours</div>
                <div className="text-2xl font-bold text-white">{labourEntries.reduce((total, entry) => total + entry.hours_worked, 0)}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiCalendarCheckLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Average Hours per Entry</div>
                <div className="text-2xl font-bold text-white">{labourEntries.length > 0 ? (labourEntries.reduce((total, entry) => total + entry.hours_worked, 0) / labourEntries.length).toFixed(2) : '0.00'}</div>
              </div>
            </div>
          </motion.div>

          {/* Time Period Selector */}
          <div className="mt-4 flex justify-end">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 inline-flex">
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'day' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('day')}
              >
                Today
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'week' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('week')}
              >
                This Week
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'month' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('month')}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Labour Return Form Modal */}
      {showNewReturn && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewReturn(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MonthlyReturnTemplate
                onClose={() => setShowNewReturn(false)}
                onSave={handleCreateReturn}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mr-4">
            <RiUserLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {labourEntries.length}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Returns</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mr-4">
            <RiTimeLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {labourEntries.reduce((total, entry) => total + entry.hours_worked, 0)}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Hours</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mr-4">
            <RiCalendarCheckLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {labourEntries.length > 0 ? (labourEntries.reduce((total, entry) => total + entry.hours_worked, 0) / labourEntries.length).toFixed(2) : '0.00'}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Average Hours per Entry</p>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold">{t('labour.title', 'Labour')}</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                {t('labour.viewAll', 'View all labour records')}
              </p>
            </div>
          
            <div className="flex space-x-2">
              {/* View Toggle Button */}
              <div className="bg-secondary-100 dark:bg-secondary-800 rounded-full flex p-1 shadow-sm">
                <button 
                  className={`px-3 py-1.5 rounded-full flex items-center transition-all duration-200 ${
                    !showGridView 
                      ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow transform scale-105' 
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/10'
                  }`}
                  onClick={() => setShowGridView(false)}
                >
                  <RiListCheck className="text-lg mr-1" />
                  <span className="text-sm font-medium">List</span>
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-full flex items-center transition-all duration-200 ${
                    showGridView 
                      ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow transform scale-105' 
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/10'
                  }`}
                  onClick={() => setShowGridView(true)}
                >
                  <RiLayoutGridLine className="text-lg mr-1" />
                  <span className="text-sm font-medium">Grid</span>
                </button>
              </div>
              
              {/* Filter Button */}
              <button 
                className={`px-4 py-2 rounded-full flex items-center transition-all duration-200 ${
                  showFilters
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <RiFilter3Line className={`text-lg ${showFilters ? 'mr-2' : 'mr-1'}`} />
                <span className="text-sm font-medium">{showFilters ? 'Hide Filters' : 'Filter'}</span>
              </button>
            </div>
          </div>
          
          {/* Filters Section */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-b border-secondary-200 dark:border-secondary-700 overflow-hidden backdrop-blur-md"
              >
                <div className="p-4 bg-gradient-to-r from-secondary-50/90 to-secondary-100/90 dark:from-secondary-800/90 dark:to-secondary-900/90">
                  {/* Filter tabs */}
                  <div className="flex flex-wrap mb-4 border-b border-secondary-200 dark:border-secondary-700 gap-1">
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'status'
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('status')}
                    >
                      Status
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'project'
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('project')}
                    >
                      Project
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'date'
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('date')}
                    >
                      Date Range
                    </button>
                    
                    <div className="ml-auto">
                      <button
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition duration-200 flex items-center"
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterType('all');
                          setFilterDateFrom('');
                          setFilterDateTo('');
                        }}
                      >
                        <RiCloseLine className="mr-1" />
                        Reset All
                      </button>
                    </div>
                  </div>
                  
                  {/* Filter content based on active tab */}
                  <div className="bg-white/80 dark:bg-secondary-800/80 rounded-lg p-4 shadow-sm">
                    <AnimatePresence mode="wait">
                      {activeFilterTab === 'status' && (
                        <motion.div
                          key="status"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-wrap gap-2"
                        >
                          {['all', 'approved', 'pending', 'rejected'].map((status) => (
                            <button
                              key={status}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterStatus === status
                                  ? status === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : status === 'approved'
                                    ? 'bg-green-600 text-white'
                                    : status === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterStatus(status)}
                            >
                              {status === 'all' && 'All Status'}
                              {status === 'approved' && 'Approved'}
                              {status === 'pending' && 'Pending'}
                              {status === 'rejected' && 'Rejected'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                      
                      {activeFilterTab === 'project' && (
                        <motion.div
                          key="project"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-wrap gap-2"
                        >
                          {['all', 'Project Alpha', 'Harbor Tower', 'Residential Complex'].map((project) => (
                            <button
                              key={project}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterType === project
                                  ? project === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterType(project)}
                            >
                              {project === 'all' ? 'All Projects' : project}
                            </button>
                          ))}
                        </motion.div>
                      )}
                      
                      {activeFilterTab === 'date' && (
                        <motion.div
                          key="date"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1 text-secondary-600 dark:text-secondary-400">
                                From Date
                              </label>
                              <input 
                                type="date" 
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-secondary-600 dark:text-secondary-400">
                                To Date
                              </label>
                              <input 
                                type="date" 
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Active filters display */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">Active filters:</span>
                    
                    {filterStatus !== 'all' && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Status: </span>
                        <span className={`font-medium ${
                          filterStatus === 'approved' ? 'text-green-600 dark:text-green-400' : 
                          filterStatus === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </span>
                        <button 
                          className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                          onClick={() => setFilterStatus('all')}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {filterType !== 'all' && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Project: </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{filterType}</span>
                        <button 
                          className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                          onClick={() => setFilterType('all')}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {(filterDateFrom || filterDateTo) && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Date: </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {filterDateFrom ? filterDateFrom : 'Any'} → {filterDateTo ? filterDateTo : 'Any'}
                        </span>
                        <button 
                          className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                          onClick={() => {
                            setFilterDateFrom('');
                            setFilterDateTo('');
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {filterStatus === 'all' && filterType === 'all' && !filterDateFrom && !filterDateTo && (
                      <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Area status cards */}
          {showGridView ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {labourEntries.map((entry) => {
                const statusColor = entry.status === 'approved' 
                  ? 'from-green-500 to-green-600' 
                  : entry.status === 'pending' 
                    ? 'from-yellow-500 to-yellow-600' 
                    : 'from-red-500 to-red-600';
                  
                return (
                  <Card 
                    key={entry.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    hover
                  >
                    <div className={`h-2 w-full bg-gradient-to-r ${statusColor}`}></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">{entry.project}</h3>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          entry.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-secondary-500 dark:text-secondary-400">Date</p>
                          <p className="font-medium">{entry.date}</p>
                        </div>
                        <div>
                          <p className="text-secondary-500 dark:text-secondary-400">Hours</p>
                          <p className="font-medium">{entry.hours_worked}</p>
                        </div>
                        <div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mt-2"
                            onClick={() => handleViewDetails(entry)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewForm(entry)}
                            leftIcon={<RiFileListLine />}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            View Form
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(entry)}
                            rightIcon={<RiArrowRightLine />}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          ) : (
          <div className="overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {labourEntries.length > 0 ? (
                    labourEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {entry.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {entry.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {entry.hours_worked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getWorkflowStatusBadge(entry)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewForm(entry)}
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        >
                          Form
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <RiFileListLine className="mx-auto text-4xl text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No labour records found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your filter criteria or create a new labour return</p>
                        <Button 
                          variant="primary" 
                          onClick={() => setShowNewReturn(true)}
                          leftIcon={<RiAddLine />}
                        >
                          New Return
                        </Button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      </motion.div>

      {/* Process Flow Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="w-full max-w-7xl max-h-[90vh] overflow-auto bg-white dark:bg-secondary-800 rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white">Configure Process Flow</h2>
                    <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                      Set up the approval workflow for this labour return
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    leftIcon={<RiAddLine />}
                    onClick={addNewNode}
                  >
                    Add Node
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel - Process flow */}
                  <div className="lg:col-span-5">
                    <Card className="p-4 h-full">
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Process Flow</h3>
                      <ProcessFlowBuilder
                        nodes={processNodes}
                        onSelectNode={setSelectedNode}
                        selectedNodeId={selectedNode?.id || null}
                      />
                    </Card>
                  </div>
                  
                  {/* Right panel - Node settings */}
                  <div className="lg:col-span-7">
                    <Card className="p-4 h-full">
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Process Settings</h3>
                      
                      {selectedNode ? (
                        <div className="space-y-4">
                          <Input
                            label="Node name"
                            value={selectedNode.name || ''}
                            onChange={(e) => {
                              const updatedNode = { ...selectedNode, name: e.target.value };
                              const updatedNodes = processNodes.map(node => 
                                node.id === selectedNode.id ? updatedNode : node
                              );
                              setProcessNodes(updatedNodes);
                              setSelectedNode(updatedNode);
                            }}
                            className="bg-white dark:bg-secondary-800"
                          />
                          
                          {selectedNode.type === 'node' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Executor
                                </label>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-grow bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-3 text-secondary-600 dark:text-secondary-400">
                                    {selectedNode.executor || 'Select executor'}
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => openPeopleSelector('executor')}>
                                    Select
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  CC Recipients
                                </label>
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-grow bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-3 min-h-[50px]">
                                      {selectedCcs.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {selectedCcs.map(cc => (
                                            <div 
                                              key={cc.id} 
                                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full flex items-center text-sm"
                                            >
                                              <span className="mr-2">{cc.name}</span>
                                              <button
                                                type="button"
                                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                                                onClick={() => removeUserFromCc(cc.id)}
                                              >
                                                <RiCloseLine />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-secondary-500 dark:text-secondary-400">No CCs selected</span>
                                      )}
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => openPeopleSelector('cc')}
                                    >
                                      Add CC
                                    </Button>
                                  </div>
                                  
                                  {selectedCcs.length > 0 && (
                                    <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center">
                                      <RiTeamLine className="mr-1" />
                                      {selectedCcs.length} {selectedCcs.length === 1 ? 'person' : 'people'} will be notified
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Execution Type
                                </label>
                                <select className="w-full bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-2 text-secondary-900 dark:text-white">
                                  <option value="standard">Standard</option>
                                  <option value="parallel">Parallel</option>
                                  <option value="sequential">Sequential</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Approval Condition
                                </label>
                                <select className="w-full bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-2 text-secondary-900 dark:text-white">
                                  <option value="none">None</option>
                                  <option value="approval">Approval required</option>
                                  <option value="review">Review required</option>
                                </select>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                          <RiFlowChart className="text-4xl mx-auto mb-2 opacity-50" />
                          <p>Select a node to configure its settings</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <Button 
                    variant="outline"
                    leftIcon={<RiArrowLeftLine />}
                    onClick={handleCancelProcessFlow}
                  >
                    Back to Form
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline"
                      onClick={handleCancelProcessFlow}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary"
                      leftIcon={<RiCheckLine />}
                      onClick={handleFinalSave}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Save Labour Return
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* People Selector Modal */}
      <AnimatePresence>
        {showPeopleSelector && (
          <PeopleSelectorModal
            isOpen={showPeopleSelector}
            onClose={() => setShowPeopleSelector(false)}
            onSelect={handleUserSelection}
            title={peopleSelectorType === 'executor' ? 'Select Executor' : 'Add People to CC'}
            users={users}
            loading={loadingUsers}
          />
        )}
      </AnimatePresence>

      {/* Entry Details Dialog */}
      <AnimatePresence>
        {showDetails && selectedLabourEntry && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center">
                    <RiTeamLine className="mr-2 text-blue-600 dark:text-blue-400" />
                    Labour Return - {selectedLabourEntry.date}
                  </div>
                  <div className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                    {selectedLabourEntry.project}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiUserLine className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Submitter</span>
                    </div>
                    <div className="font-medium">{selectedLabourEntry.submitter}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiTeamLine className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Worker Count</span>
                    </div>
                    <div className="font-medium">{selectedLabourEntry.worker_count}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiTimeLine className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Hours Worked</span>
                    </div>
                    <div className="font-medium">{selectedLabourEntry.hours_worked}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiPercentLine className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Trade Type</span>
                    </div>
                    <div className="font-medium">{selectedLabourEntry.trade_type}</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <RiTaskLine className="mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium uppercase tracking-wide">Work Description</span>
                  </div>
                  <div className="whitespace-pre-line">{selectedLabourEntry.work_description || 'None'}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <RiErrorWarningLine className="mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium uppercase tracking-wide">Labour Type</span>
                  </div>
                  <div className="whitespace-pre-line">{selectedLabourEntry.labour_type || 'None'}</div>
                </div>
                
                {/* Workflow Status Section */}
                {selectedLabourEntry.labour_workflow_nodes && selectedLabourEntry.labour_workflow_nodes.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <RiFlowChart className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedLabourEntry.labour_workflow_nodes
                        .sort((a: any, b: any) => a.node_order - b.node_order)
                        .map((node: any) => (
                          <div key={node.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                node.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                node.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                node.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {node.status === 'completed' ? <RiCheckLine /> :
                                 node.status === 'pending' ? <RiNotificationLine /> :
                                 node.status === 'rejected' ? <RiCloseLine /> :
                                 <RiSettings4Line />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{node.node_name}</div>
                                {node.executor_name && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Assigned to: {node.executor_name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              node.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              node.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              node.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Comments Section */}
                {selectedLabourEntry.labour_comments && selectedLabourEntry.labour_comments.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <RiNotificationLine className="mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedLabourEntry.labour_comments
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((comment: any) => (
                          <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 dark:text-white">{comment.user_name}</div>
                              <div className="flex items-center space-x-2">
                                {comment.action && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    comment.action === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    comment.action === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                    {comment.action.charAt(0).toUpperCase() + comment.action.slice(1)}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-700 dark:text-gray-300">{comment.comment}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Workflow Action Buttons */}
                  {selectedLabourEntry.status === 'pending' && (
                    <>
                      {canUserEditEntry(selectedLabourEntry) && (
                        <Button 
                          variant="outline"
                          leftIcon={<RiFileWarningLine />}
                          onClick={() => {
                            setShowDetails(false);
                            handleViewForm(selectedLabourEntry);
                          }}
                        >
                          Edit Form
                        </Button>
                      )}
                      
                      {canUserApproveEntry(selectedLabourEntry) && (
                        <>
                          <Button 
                            variant="outline"
                            leftIcon={<RiCloseLine />}
                            onClick={() => handleWorkflowAction('reject')}
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Reject
                          </Button>
                          <Button 
                            variant="primary"
                            leftIcon={<RiCheckLine />}
                            onClick={() => handleWorkflowAction('approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  
                  <Button 
                    variant="primary"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Form View Modal */}
      {showFormView && selectedLabourEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowFormView(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MonthlyReturnTemplate
                onClose={() => setShowFormView(false)}
                onSave={handleFormUpdate}
                initialData={selectedLabourEntry?.form_data}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default LabourPage; 