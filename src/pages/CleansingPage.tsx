import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiAddLine, RiBrushLine, RiCheckboxCircleLine, RiCloseCircleLine, RiCalendarCheckLine, RiTaskLine, RiEyeLine, RiMapPinLine, RiFilterLine, RiUploadCloud2Line, RiArrowLeftRightLine, RiPercentLine, RiCheckLine, RiArrowRightLine, RiArrowLeftLine, RiListCheck, RiLayoutGridLine, RiFilter3Line, RiCloseLine, RiLoader4Line, RiFlowChart, RiSettings4Line, RiUserLine, RiSearchLine, RiArrowDownLine, RiDropLine, RiNotificationLine, RiErrorWarningLine, RiFileWarningLine, RiAlertLine, RiMapPin2Line, RiCalendarLine, RiTeamLine, RiFileTextLine } from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { DailyCleaningInspectionTemplate } from '../components/forms/DailyCleaningInspectionTemplate';
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

interface CleansingEntry {
  id: string;
  date: string;
  project: string;
  project_id?: string;
  submitter: string;
  area: string;
  cleanliness_score: number;
  cleaning_status: string;
  notes: string;
  form_data?: any;
  status: string;
  current_node_index: number;
  cleansing_workflow_nodes?: any[];
  cleansing_assignments?: any[];
  cleansing_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface CleansingRecord {
  id: number;
  date: string;
  area: string;
  status: 'completed' | 'pending' | 'failed';
  notes: string;
  project: string;
  completedBy?: string;
  imageUrl?: string;
}

interface AreaStats {
  area: string;
  cleanlinessScore: number;
  lastCleaned: string;
  nextDue: string;
  status: 'clean' | 'due' | 'overdue';
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

const CleansingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [showUploadView, setShowUploadView] = useState(false);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordArea, setRecordArea] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [showGridView, setShowGridView] = useState(false);
  const [selectedAreaStats, setSelectedAreaStats] = useState<AreaStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // API integration states
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [cleansingEntries, setCleansingEntries] = useState<CleansingEntry[]>([]);
  const [selectedCleansingEntry, setSelectedCleansingEntry] = useState<CleansingEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  
  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', settings: {} },
    { id: 'review', type: 'node', name: 'Cleansing Review & Approval', settings: {} },
    { id: 'end', type: 'end', name: 'Complete', settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [selectedCcs, setSelectedCcs] = useState<User[]>([]);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');
  
  // Add filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  
  // Add state for multi-step form
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [assignees, setAssignees] = useState<string[]>([]);

  // Fetch cleansing entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchCleansingEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id]);

  // Calculate metrics from cleansing entries
  const getMetrics = () => {
    const totalEntries = cleansingEntries.length;
    const averageScore = totalEntries > 0 
      ? Math.round(cleansingEntries.reduce((sum, entry) => sum + (entry.cleanliness_score || 0), 0) / totalEntries)
      : 0;
    
    // Mock area statistics for now - in a real app this would come from API
    const cleanAreas = cleansingEntries.filter(entry => entry.cleanliness_score >= 90).length;
    const dueAreas = cleansingEntries.filter(entry => entry.cleanliness_score >= 70 && entry.cleanliness_score < 90).length;
    const overdueAreas = cleansingEntries.filter(entry => entry.cleanliness_score < 70).length;
    const complianceRate = totalEntries > 0 ? Math.round((cleanAreas / totalEntries) * 100) : 0;
    
    return {
      averageScore,
      cleanAreas,
      dueAreas,
      overdueAreas,
      complianceRate
    };
  };

  const metrics = getMetrics();

  // Mock area statistics for now - in a real app this would come from API
  const areaStats: AreaStats[] = [
    { area: 'Main Entrance', cleanlinessScore: 95, lastCleaned: '2024-01-15', nextDue: '2024-01-22', status: 'clean' },
    { area: 'Office Area', cleanlinessScore: 88, lastCleaned: '2024-01-14', nextDue: '2024-01-21', status: 'due' },
    { area: 'Storage Room', cleanlinessScore: 65, lastCleaned: '2024-01-10', nextDue: '2024-01-17', status: 'overdue' },
    { area: 'Break Room', cleanlinessScore: 92, lastCleaned: '2024-01-15', nextDue: '2024-01-22', status: 'clean' }
  ];

  // Fetch cleansing entries from API with project filtering
  const fetchCleansingEntries = async () => {
    try {
      setLoading(true);
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`https://matrixbim-server.onrender.com/api/cleansing/list/${user?.id}${projectParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCleansingEntries(data);
      } else {
        console.error('Failed to fetch cleansing entries');
      }
    } catch (error) {
      console.error('Error fetching cleansing entries:', error);
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
  const filteredEntries = cleansingEntries.filter(entry => 
    entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.submitter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.date.includes(searchQuery)
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

  const handleCreateRecord = (formData: any) => {
    setPendingFormData(formData);
    setShowNewRecord(false);
    setShowProcessFlow(true);
  };

  const handleFinalSave = async () => {
    if (!pendingFormData || !user?.id) return;
    
    try {
      const response = await fetch('https://matrixbim-server.onrender.com/api/cleansing/create', {
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
          await emailService.sendCleansingNotification({
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
        
        // Refresh cleansing entries
        await fetchCleansingEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setSelectedCcs([]);
        setSelectedNode(null);
        
        // Show success message
        alert('Cleansing entry created successfully! Notifications have been sent to assigned users.');
      } else {
        const error = await response.json();
        alert(`Failed to create cleansing entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating cleansing entry:', error);
      alert('Failed to create cleansing entry. Please try again.');
    }
  };

  const handleCancelProcessFlow = () => {
    setPendingFormData(null);
    setShowProcessFlow(false);
    setSelectedCcs([]);
    setSelectedNode(null);
  };

  const handleViewDetails = async (entry: CleansingEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`https://matrixbim-server.onrender.com/api/cleansing/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedCleansingEntry(fullEntry);
        setShowDetails(true);
      } else {
        setSelectedCleansingEntry(entry);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedCleansingEntry(entry);
      setShowDetails(true);
    }
  };

  const handleViewForm = async (entry: CleansingEntry) => {
    try {
      // Fetch full entry details including form data
      const response = await fetch(`https://matrixbim-server.onrender.com/api/cleansing/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedCleansingEntry(fullEntry);
        setShowFormView(true);
      } else {
        setSelectedCleansingEntry(entry);
        setShowFormView(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedCleansingEntry(entry);
      setShowFormView(true);
    }
  };

  const handleFormUpdate = async (formData: any) => {
    if (!selectedCleansingEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://matrixbim-server.onrender.com/api/cleansing/${selectedCleansingEntry.id}/update`, {
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
        // Refresh cleansing entries
        await fetchCleansingEntries();
        setShowFormView(false);
        setSelectedCleansingEntry(null);
        alert('Cleansing entry updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update cleansing entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating cleansing entry:', error);
      alert('Failed to update cleansing entry. Please try again.');
    }
  };

  const handleWorkflowAction = async (action: 'approve' | 'reject') => {
    if (!selectedCleansingEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://matrixbim-server.onrender.com/api/cleansing/${selectedCleansingEntry.id}/workflow`, {
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
          const ccEmails = selectedCleansingEntry.cleansing_assignments?.map(assignment => assignment.user_email).filter(Boolean) || [];
          await emailService.sendCleansingNotification({
            entryId: selectedCleansingEntry.id,
            projectName: selectedCleansingEntry.project,
            action: action === 'approve' ? 'approved' : 'rejected',
            ccRecipients: ccEmails,
            formData: selectedCleansingEntry.form_data,
            currentNodeName: selectedCleansingEntry.cleansing_workflow_nodes?.find(node => 
              node.node_order === selectedCleansingEntry.current_node_index
            )?.node_name,
            comments: '' // Add comment if available
          });
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
        }
        
        // Refresh cleansing entries
        await fetchCleansingEntries();
        setShowDetails(false);
        setSelectedCleansingEntry(null);
        alert(`Cleansing entry ${action}d successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} cleansing entry: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing cleansing entry:`, error);
      alert(`Failed to ${action} cleansing entry. Please try again.`);
    }
  };

  const canUserEditEntry = (entry: CleansingEntry) => {
    if (!user) return false;
    
    // Admin can edit any entry
    if (user.role === 'admin') return true;
    
    // Creator can edit their own entries
    if (entry.created_by === user.id) return true;
    
    // Check if user is assigned to this entry
    return entry.cleansing_assignments?.some(assignment => 
      assignment.user_id === user.id && assignment.role === 'executor'
    ) || false;
  };

  const canUserApproveEntry = (entry: CleansingEntry) => {
    if (!user) return false;
    
    // Only allow approval if entry is pending and user has permission
    if (entry.status !== 'pending') return false;
    
    // Admin can approve any entry
    if (user.role === 'admin') return true;
    
    // Check if user is the current workflow executor
    const currentNode = entry.cleansing_workflow_nodes?.find(node => 
      node.node_order === entry.current_node_index && node.status === 'pending'
    );
    
    return currentNode?.executor_name === user.name;
  };

  const getWorkflowStatusBadge = (entry: CleansingEntry) => {
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

  // ProcessFlowBuilder component
  const ProcessFlowBuilder: React.FC<{
    nodes: ProcessNode[];
    selectedNodeId: string | null;
    onSelectNode: (node: ProcessNode) => void;
  }> = ({ nodes, selectedNodeId, onSelectNode }) => {
    const getNodeColor = (type: string) => {
      switch (type) {
        case 'start':
          return 'bg-green-100 border-green-600 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'end':
          return 'bg-red-100 border-red-600 text-red-600 dark:bg-red-900/30 dark:text-red-400';
        default:
          return 'bg-blue-100 border-blue-600 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      }
    };
    
    return (
      <div className="py-2">
        <div className="flex flex-col items-center">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                className={`w-full max-w-sm rounded-lg p-3 border-2 cursor-pointer transition-colors ${
                  selectedNodeId === node.id ? 'ring-2 ring-offset-2 ring-blue-600' : ''
                } ${getNodeColor(node.type)}`}
                onClick={() => onSelectNode(node)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{node.name}</div>
                  <div className="text-xs px-2 py-1 rounded-full bg-white/20 dark:bg-gray-800/50">
                    {node.type === 'start' ? 'Start' : node.type === 'end' ? 'End' : 'Process'}
                  </div>
                </div>
                
                {node.type === 'node' && (
                  <div className="mt-1 text-sm opacity-80">
                    {node.executor ? `Executor: ${node.executor}` : 'No executor assigned'}
                  </div>
                )}
              </motion.div>
              
              {/* Connector line between nodes */}
              {index < nodes.length - 1 && (
                <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 flex justify-center items-center my-1">
                  <div className="bg-white dark:bg-gray-800 rounded-full p-1">
                    <RiArrowDownLine className="text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Helper functions
  const getFilteredAreaStats = () => {
    return areaStats; // For now, return all areas. Can add filtering logic later
  };

  const handleAreaClick = (area: AreaStats) => {
    console.log('Area clicked:', area);
    // Add area-specific actions here
  };

  const getAreaStatusColor = (status: string) => {
    switch (status) {
      case 'clean':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleSubmitRecord = (formData: any) => {
    handleCreateRecord(formData);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced header with cleansing dashboard */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-green-800 via-green-700 to-emerald-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M50,0 L200,0 L200,200 L100,180 Q70,160 50,120 Q30,80 50,0"
              fill="url(#cleansingGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="cleansingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
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
                  <RiBrushLine className="mr-3 text-green-300" />
                  {t('cleansing.title')}
                </h1>
                <p className="text-green-200 mt-2 max-w-2xl">
                  Monitor cleanliness standards, track cleaning activities, and maintain a clean construction environment
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
                onClick={() => setShowNewRecord(true)}
                animated
                pulseEffect
                glowing
              >
                New Record
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiUploadCloud2Line />}
                onClick={() => setShowUploadView(true)}
                animated
                glowing
              >
                Upload Evidence
              </Button>
            </motion.div>
          </div>

          {/* Cleanliness Score Visualization */}
          <motion.div 
            className="mt-8 flex flex-col md:flex-row items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative h-40 w-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="10" 
                />
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="url(#cleansinessScoreGradient)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * metrics.averageScore / 100) }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="cleansinessScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-white">{metrics.averageScore}%</div>
                <div className="text-sm text-white/80">Cleanliness Score</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.cleanAreas}</div>
                  <div className="text-sm text-white/80">Clean Areas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.dueAreas}</div>
                  <div className="text-sm text-white/80">Due Soon</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.overdueAreas}</div>
                  <div className="text-sm text-white/80">Overdue</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.complianceRate}%</div>
                  <div className="text-sm text-white/80">Compliance Rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Cleanliness metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Average Score</p>
              <h3 className="text-3xl font-semibold mt-1">{metrics.averageScore}%</h3>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10 ${metrics.averageScore >= 90 ? 'bg-green-500' : metrics.averageScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              <RiPercentLine className={`text-xl ${metrics.averageScore >= 90 ? 'text-green-500' : metrics.averageScore >= 80 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="mt-4 w-full h-1 bg-secondary-200 dark:bg-secondary-800 rounded-full overflow-hidden">
            <div 
              className={`h-1 rounded-full ${metrics.averageScore >= 90 ? 'bg-green-500' : metrics.averageScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${metrics.averageScore}%` }}
            ></div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Clean Areas</p>
              <h3 className="text-3xl font-semibold mt-1 text-green-500">{metrics.cleanAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-green-500 bg-opacity-10">
              <RiCheckboxCircleLine className="text-xl text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-green-500">{Math.round((metrics.cleanAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Due for Cleaning</p>
              <h3 className="text-3xl font-semibold mt-1 text-yellow-500">{metrics.dueAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-yellow-500 bg-opacity-10">
              <RiCalendarCheckLine className="text-xl text-yellow-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-yellow-500">{Math.round((metrics.dueAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Overdue</p>
              <h3 className="text-3xl font-semibold mt-1 text-red-500">{metrics.overdueAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-red-500 bg-opacity-10">
              <RiCloseCircleLine className="text-xl text-red-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-red-500">{Math.round((metrics.overdueAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
      </motion.div>
      
      {/* Area status cards */}
        <motion.div 
        className="w-full rounded-lg overflow-hidden mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
        <Card>
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold">Area Status</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                View cleanliness status of different areas
              </p>
            </div>
            <div className="flex space-x-2">
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
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
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
                          ? 'bg-white dark:bg-secondary-700 text-green-600 dark:text-green-400 border-b-2 border-green-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('status')}
                    >
                      Status
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'date'
                          ? 'bg-white dark:bg-secondary-700 text-green-600 dark:text-green-400 border-b-2 border-green-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('date')}
                    >
                      Date Range
                    </button>
                    
                    <div className="ml-auto">
                      <button
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition duration-200 flex items-center"
                        onClick={() => {
                          setFilterStatus('all');
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
                          {['all', 'clean', 'due', 'overdue'].map((status) => (
                            <button
                              key={status}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterStatus === status
                                  ? status === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : status === 'clean'
                                    ? 'bg-green-600 text-white'
                                    : status === 'due'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterStatus(status)}
                            >
                              {status === 'all' && 'All Status'}
                              {status === 'clean' && 'Clean'}
                              {status === 'due' && 'Due Soon'}
                              {status === 'overdue' && 'Overdue'}
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-green-600/50 focus:border-green-600"
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-green-600/50 focus:border-green-600"
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
                          filterStatus === 'clean' ? 'text-green-600 dark:text-green-400' : 
                          filterStatus === 'due' ? 'text-yellow-600 dark:text-yellow-400' :
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
                    
                    {(filterDateFrom || filterDateTo) && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Date: </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
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
                    
                    {filterStatus === 'all' && !filterDateFrom && !filterDateTo && (
                      <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {showGridView ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {getFilteredAreaStats().map((area) => (
            <Card 
              key={area.area} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAreaClick(area)}
              hover
            >
              <div className={`h-2 w-full bg-gradient-to-r ${getAreaStatusColor(area.status)}`}></div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{area.area}</h3>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    area.status === 'clean' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    area.status === 'due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-secondary-500 dark:text-secondary-400">Cleanliness</p>
                    <p className="font-medium">{area.cleanlinessScore}%</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 dark:text-secondary-400">Last Cleaned</p>
                    <p className="font-medium">{area.lastCleaned}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-secondary-500 dark:text-secondary-400">Next Due</p>
                    <p className={`font-medium ${
                      area.status === 'overdue' ? 'text-red-500' : 
                      area.status === 'due' ? 'text-yellow-500' : ''
                    }`}>{area.nextDue}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
            </div>
          ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Cleanliness Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Last Cleaned
                </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Next Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {getFilteredAreaStats().map((area) => (
                    <tr key={area.area} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 cursor-pointer" onClick={() => handleAreaClick(area)}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white font-medium">
                        {area.area}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          area.status === 'clean' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          area.status === 'due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                        </span>
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          area.cleanlinessScore >= 90 ? 'text-green-600 dark:text-green-400' :
                          area.cleanlinessScore >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {area.cleanlinessScore}%
                        </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {area.lastCleaned}
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`${
                          area.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-medium' : 
                          area.status === 'due' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 
                          'text-secondary-900 dark:text-white'
                        }`}>
                          {area.nextDue}
                        </span>
                    </td>
                  </tr>
                  ))}
            </tbody>
          </table>
        </div>
          )}
      </Card>
      </motion.div>
      
      {/* Cleansing Entries Section */}
      <motion.div 
        className="w-full rounded-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold">Cleansing Records</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                View and manage cleansing inspection records
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <RiLoader4Line className="animate-spin text-3xl mx-auto mb-4 text-secondary-400" />
                <p className="text-secondary-600 dark:text-secondary-400">Loading cleansing records...</p>
              </div>
            ) : filteredEntries.length > 0 ? (
              <table className="w-full">
                <thead className="bg-secondary-50 dark:bg-secondary-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Submitter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {entry.date}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {entry.project}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {entry.area}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {entry.submitter}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          entry.cleanliness_score >= 90 ? 'text-green-600 dark:text-green-400' :
                          entry.cleanliness_score >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {entry.cleanliness_score}%
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getWorkflowStatusBadge(entry)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RiEyeLine />}
                          onClick={() => handleViewDetails(entry)}
                        >
                          View
                        </Button>
                        {canUserEditEntry(entry) && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<RiFileTextLine />}
                            onClick={() => handleViewForm(entry)}
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <RiDropLine className="text-4xl mx-auto mb-4 text-secondary-400" />
                <p className="text-secondary-600 dark:text-secondary-400">No cleansing records found</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-500 mt-1">
                  Create your first cleansing record to get started
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
      
      {/* Process Flow Modal */}
      <AnimatePresence>
        {showProcessFlow && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCancelProcessFlow}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Setup Workflow</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Configure the approval process for this cleansing record</p>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={handleCancelProcessFlow}
                  >
                    <RiCloseLine className="text-2xl" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Process Flow Builder */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workflow Steps</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<RiAddLine />}
                        onClick={addNewNode}
                      >
                        Add Step
                      </Button>
                    </div>
                    
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <ProcessFlowBuilder
                        nodes={processNodes}
                        selectedNodeId={selectedNode?.id || null}
                        onSelectNode={setSelectedNode}
                      />
                    </div>
                  </div>
                  
                  {/* Node Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedNode ? `Configure: ${selectedNode.name}` : 'Select a step to configure'}
                    </h3>
                    
                    {selectedNode && selectedNode.type === 'node' && (
                      <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Step Name
                          </label>
                          <input
                            type="text"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={selectedNode.name}
                            onChange={(e) => {
                              const updatedNodes = processNodes.map(node => 
                                node.id === selectedNode.id 
                                  ? { ...node, name: e.target.value }
                                  : node
                              );
                              setProcessNodes(updatedNodes);
                              setSelectedNode({ ...selectedNode, name: e.target.value });
                            }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Executor
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              value={selectedNode.executor || ''}
                              placeholder="Select executor..."
                              readOnly
                            />
                            <Button
                              variant="outline"
                              onClick={() => openPeopleSelector('executor')}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* CC Recipients */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">CC Recipients</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RiUserLine />}
                          onClick={() => openPeopleSelector('cc')}
                        >
                          Add People
                        </Button>
                      </div>
                      
                      {selectedCcs.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {selectedCcs.map(cc => (
                              <div key={cc.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-md p-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-medium mr-2">
                                    {cc.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{cc.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{cc.email}</div>
                                  </div>
                                </div>
                                <button
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  onClick={() => removeUserFromCc(cc.id)}
                                >
                                  <RiCloseLine />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleCancelProcessFlow}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleFinalSave}
                    disabled={!processNodes.some(node => node.type === 'node' && node.executor)}
                  >
                    Create Record
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* ISO19650 Cleansing Record Form Modal */}
      <AnimatePresence>
        {showNewRecord && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewRecord(false)}
          >
            <motion.div
              className="w-full max-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DailyCleaningInspectionTemplate
                onClose={() => setShowNewRecord(false)}
                onSave={handleSubmitRecord}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        {showDetails && selectedCleansingEntry && (
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
                <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-lg font-bold text-green-900 dark:text-green-300 flex items-center">
                    <RiDropLine className="mr-2 text-green-600 dark:text-green-400" />
                    Cleansing Record - {selectedCleansingEntry.date}
                  </div>
                  <div className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                    {selectedCleansingEntry.project}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiUserLine className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Submitter</span>
                    </div>
                    <div className="font-medium">{selectedCleansingEntry.submitter}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiMapPinLine className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Area</span>
                    </div>
                    <div className="font-medium">{selectedCleansingEntry.area}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiDropLine className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Cleaning Status</span>
                    </div>
                    <div className="font-medium">{selectedCleansingEntry.cleaning_status}</div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <RiPercentLine className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Cleanliness Score</span>
                    </div>
                    <div className="font-medium">{selectedCleansingEntry.cleanliness_score}%</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <RiSettings4Line className="mr-2 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium uppercase tracking-wide">Notes</span>
                  </div>
                  <div className="whitespace-pre-line">{selectedCleansingEntry.notes || 'None'}</div>
                </div>
                
                {/* Workflow Status Section */}
                {selectedCleansingEntry.cleansing_workflow_nodes && selectedCleansingEntry.cleansing_workflow_nodes.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <RiFlowChart className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedCleansingEntry.cleansing_workflow_nodes
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
                {selectedCleansingEntry.cleansing_comments && selectedCleansingEntry.cleansing_comments.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                      <RiNotificationLine className="mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedCleansingEntry.cleansing_comments
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
                  {selectedCleansingEntry.status === 'pending' && (
                    <>
                      {canUserEditEntry(selectedCleansingEntry) && (
                        <Button 
                          variant="outline"
                          leftIcon={<RiFileWarningLine />}
                          onClick={() => {
                            setShowDetails(false);
                            handleViewForm(selectedCleansingEntry);
                          }}
                        >
                          Edit Form
                        </Button>
                      )}
                      
                      {canUserApproveEntry(selectedCleansingEntry) && (
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
      {showFormView && selectedCleansingEntry && (
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
              <DailyCleaningInspectionTemplate
                onClose={() => setShowFormView(false)}
                onSave={handleFormUpdate}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CleansingPage; 