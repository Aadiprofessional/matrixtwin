import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import * as RiIcons from 'react-icons/ri';
import { SiteDiaryFormTemplate } from '../components/forms/SiteDiaryFormTemplate';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';

// Add interfaces for process flow
interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string; // Keep as string for compatibility
  executorId?: string; // Add executor ID for backend
  ccRecipients?: User[]; // Add node-specific CC recipients
  editAccess?: boolean; // Add edit access flag
  expireTime?: string; // Add expire time field - can be 'unlimited' or ISO datetime string
  expireDuration?: number | null; // Add expire duration in hours (null = unlimited)
  settings: Record<string, any>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  project: string;
  project_id?: string;
  author: string;
  weather: string;
  temperature: string;
  work_completed: string;
  incidents_reported: string;
  materials_delivered: string;
  notes: string;
  form_data?: any;
  status: string;
  current_node_index: number;
  current_active_node?: string; // Add current active node tracking
  diary_workflow_nodes?: any[];
  diary_assignments?: any[];
  diary_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
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
        className="w-full max-w-md max-h-[80vh] bg-white dark:bg-dark-800 rounded-lg shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-secondary-200 dark:border-dark-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-secondary-900 dark:text-white">
            <RiIcons.RiUserLine className="mr-2" />
            {title}
          </h3>
          <button 
            className="text-secondary-400 hover:text-secondary-600 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <RiIcons.RiCloseLine className="text-xl" />
          </button>
        </div>
        
        <div className="p-4 border-b border-secondary-200 dark:border-dark-700">
          <div className="relative">
            <RiIcons.RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-dark-600 rounded-md bg-white dark:bg-dark-700 text-secondary-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px] p-2">
          {loading ? (
            <div className="p-4 text-center text-secondary-600 dark:text-secondary-400">
              <RiIcons.RiLoader4Line className="animate-spin text-2xl mx-auto mb-2" />
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="p-3 hover:bg-secondary-50 dark:hover:bg-dark-700 rounded-md cursor-pointer transition-colors flex items-center"
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
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-medium mr-3">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-secondary-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">{user.role}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-secondary-600 dark:text-secondary-400">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const DiaryPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
    { id: 'review', type: 'node', name: 'Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
    { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [selectedCcs, setSelectedCcs] = useState<User[]>([]);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');
  
  // Diary entries from API
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  // Fetch diary entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchDiaryEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id]);

  // Fetch diary entries from API with project filtering
  const fetchDiaryEntries = async () => {
    try {
      setLoading(true);
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/list/${user?.id}${projectParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiaryEntries(data);
      } else {
        console.error('Failed to fetch diary entries');
      }
    } catch (error) {
      console.error('Error fetching diary entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users from API (similar to Projects.tsx)
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/users/${user?.id}`, {
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
  const filteredEntries = diaryEntries.filter(entry => 
    entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.work_completed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.date.includes(searchQuery)
  );
  
  // Process flow helper functions
  const addNewNode = () => {
    const newNode: ProcessNode = {
      id: `node_${Date.now()}`,
      type: 'node',
      name: 'New Process Step',
      settings: {}
    };
    
    // Insert before the end node
    const endNodeIndex = processNodes.findIndex(node => node.type === 'end');
    const updatedNodes = [...processNodes];
    updatedNodes.splice(endNodeIndex, 0, newNode);
    setProcessNodes(updatedNodes);
    setSelectedNode(newNode);
  };
  
  const openPeopleSelector = (type: 'executor' | 'cc') => {
    setPeopleSelectorType(type);
    setShowPeopleSelector(true);
  };
  
  const handleUserSelection = (selectedUser: User) => {
    if (peopleSelectorType === 'executor' && selectedNode) {
      const updatedNode = { 
        ...selectedNode, 
        executor: selectedUser.name,
        executorId: selectedUser.id // Store executor ID for backend
      };
      const updatedNodes = processNodes.map(node => 
        node.id === selectedNode.id ? updatedNode : node
      );
      setProcessNodes(updatedNodes);
      setSelectedNode(updatedNode);
    } else if (peopleSelectorType === 'cc' && selectedNode) {
      // Add to node-specific CC recipients instead of global
      const currentCcs = selectedNode.ccRecipients || [];
      if (!currentCcs.find(cc => cc.id === selectedUser.id)) {
        const updatedNode = {
          ...selectedNode,
          ccRecipients: [...currentCcs, selectedUser]
        };
        const updatedNodes = processNodes.map(node => 
          node.id === selectedNode.id ? updatedNode : node
        );
        setProcessNodes(updatedNodes);
        setSelectedNode(updatedNode);
      }
    }
  };
  
  const removeUserFromCc = (userId: string) => {
    if (selectedNode) {
      const updatedCcs = (selectedNode.ccRecipients || []).filter(cc => cc.id !== userId);
      const updatedNode = {
        ...selectedNode,
        ccRecipients: updatedCcs
      };
      const updatedNodes = processNodes.map(node => 
        node.id === selectedNode.id ? updatedNode : node
      );
      setProcessNodes(updatedNodes);
      setSelectedNode(updatedNode);
    }
  };
  
  // Create new diary entry - now shows process flow first
  const handleCreateEntry = (formData: any) => {
    setPendingFormData(formData);
    setShowNewEntry(false);
    setShowProcessFlow(true);
    setSelectedNode(processNodes.find(node => node.type === 'node') || null);
  };
  
  // Final save after process flow configuration
  const handleFinalSave = async () => {
    if (!pendingFormData || !user?.id) return;
    
    try {
      // Prepare process nodes with proper structure for backend
      const processNodesForBackend = processNodes.map(node => ({
        ...node,
        executorId: node.executorId, // Send executor ID
        executorName: node.executor, // Send executor name
        ccRecipients: node.ccRecipients || [], // Send node-specific CCs
        editAccess: node.editAccess !== false // Default to true if not set
      }));

      console.log('Sending diary entry data:', {
        formData: pendingFormData,
        processNodes: processNodesForBackend,
        createdBy: user.id,
        projectId: selectedProject?.id
      });

      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: pendingFormData,
          processNodes: processNodesForBackend,
          createdBy: user.id,
          projectId: selectedProject?.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Diary entry created successfully:', result);
        
        // Refresh diary entries
        await fetchDiaryEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setSelectedCcs([]);
        setSelectedNode(null);
        
        // Reset process nodes to default
        setProcessNodes([
          { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
          { id: 'review', type: 'node', name: 'Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
          { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
        ]);
        
        // Show success message
        alert('Diary entry created successfully! Notifications have been sent to assigned users.');
      } else {
        const error = await response.json();
        console.error('Failed to create diary entry:', error);
        alert(`Failed to create diary entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating diary entry:', error);
      alert('Failed to create diary entry. Please try again.');
    }
  };
  
  // Cancel process flow and go back to form
  const handleCancelProcessFlow = () => {
    setShowProcessFlow(false);
    setShowNewEntry(true);
    setPendingFormData(null);
  };
  
  // View entry details
  const handleViewDetails = async (entry: DiaryEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedDiaryEntry(fullEntry);
        setShowDetails(true);
      } else {
        setSelectedDiaryEntry(entry);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedDiaryEntry(entry);
      setShowDetails(true);
    }
  };

  // View form data
  const handleViewForm = async (entry: DiaryEntry) => {
    try {
      // Fetch full entry details including form data
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedDiaryEntry(fullEntry);
        setShowFormView(true);
      } else {
        setSelectedDiaryEntry(entry);
        setShowFormView(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedDiaryEntry(entry);
      setShowFormView(true);
    }
  };

  // Handle workflow actions (approve/reject/back to previous)
  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'back') => {
    if (!selectedDiaryEntry || !user?.id) return;

    let comment = '';
    if (action === 'reject' || action === 'back') {
      const promptResult = prompt(`Please provide a ${action === 'reject' ? 'reason for rejection' : 'comment for sending back'}:`);
      if (promptResult === null || promptResult.trim() === '') {
        alert(`A comment is required when ${action === 'reject' ? 'rejecting' : 'sending back'} an entry.`);
        return;
      }
      comment = promptResult.trim();
    }

    try {
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/${selectedDiaryEntry.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          comment: comment,
          userId: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle permanent rejection
        if (result.permanently_rejected) {
          alert('Entry has been permanently rejected - no more edits are allowed as all nodes have reached their completion limit.');
        } else {
          alert(`Entry ${action}d successfully! Notifications have been sent.`);
        }
        
        // Refresh diary entries and entry details
        await fetchDiaryEntries();
        await handleViewDetails(selectedDiaryEntry);
      } else {
        const error = await response.json();
        
        // Handle specific error cases
        if (error.error?.includes('completion limit')) {
          alert(`Cannot ${action}: ${error.error}\n${error.details || ''}`);
        } else if (error.error?.includes('No previous node available')) {
          alert(`Cannot send back: ${error.error}\n${error.details || ''}`);
        } else {
          alert(`Failed to ${action} entry: ${error.error}`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing entry:`, error);
      alert(`Failed to ${action} entry. Please try again.`);
    }
  };

  // Handle form update with completion limit checking
  const handleFormUpdate = async (formData: any) => {
    if (!selectedDiaryEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/${selectedDiaryEntry.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: formData,
          action: 'update',
          userId: user.id
        })
      });

      if (response.ok) {
        // Refresh diary entries
        await fetchDiaryEntries();
        setShowFormView(false);
        alert('Form updated successfully!');
      } else {
        const error = await response.json();
        
        // Handle completion limit errors
        if (error.error?.includes('completion limit')) {
          alert(`Cannot update form: ${error.error}\n${error.details || ''}`);
        } else {
          alert(`Failed to update form: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Failed to update form. Please try again.');
    }
  };
  
  // Check if user can edit/approve the diary entry
  const canUserEditEntry = (entry: DiaryEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected
    if (entry.status === 'permanently_rejected') {
      return false;
    }
    
    // Admin can edit when entry is in initial state, rejected, or pending
    if (user.role === 'admin' && (entry.status === 'pending' || entry.status === 'rejected')) {
      return true;
    }
    
    // Check if user is executor of current node and entry is rejected
    const currentNode = entry.diary_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id && entry.status === 'rejected') {
      return true;
    }
    
    return false;
  };

  // Check if user can update form data (with completion limit awareness)
  const canUserUpdateForm = (entry: DiaryEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected
    if (entry.status === 'permanently_rejected') {
      return false;
    }
    
    // Admin can always edit their own entries
    if (user.role === 'admin' && entry.created_by === user.id) {
      return true;
    }
    
    // Check if user is assigned to current node
    const currentNode = entry.diary_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id) {
      // If entry status is 'rejected', the current node should have full access
      // regardless of completion limits (fresh chance after rejection)
      if (entry.status === 'rejected') {
        return true;
      }
      
      // For other statuses, check completion limits
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      const canReEdit = currentNode.can_re_edit !== false;
      
      return canReEdit && completionCount < maxCompletions;
    }
    
    // Check if user is in assignments for current node
    const isAssigned = entry.diary_assignments?.some(
      assignment => assignment.user_id === user.id && 
                   assignment.node_id === currentNode?.node_id
    );
    
    // If assigned and entry is rejected, give full access
    if (isAssigned && entry.status === 'rejected') {
      return true;
    }
    
    return isAssigned;
  };

  // Check if user can approve entry (with completion limit awareness)
  const canUserApproveEntry = (entry: DiaryEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected or completed
    if (entry.status === 'permanently_rejected' || entry.status === 'completed') {
      return false;
    }
    
    // Admin can approve any entry
    if (user.role === 'admin') {
      return true;
    }
    
    // Check if user is executor of current node
    const currentNode = entry.diary_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id) {
      // If entry status is 'rejected', the current node should have full access
      // regardless of completion limits (fresh chance after rejection)
      if (entry.status === 'rejected') {
        return true;
      }
      
      // For other statuses, check completion limits
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      const canReEdit = currentNode.can_re_edit !== false;
      
      return canReEdit && completionCount < maxCompletions;
    }
    
    return false;
  };

  // Check if user can view entry (all assigned users, executors, and admin)
  const canUserViewEntry = (entry: DiaryEntry) => {
    if (!user?.id) return false;
    
    // Admin can always view
    if (user.role === 'admin') return true;
    
    // Creator can view
    if (entry.created_by === user.id) return true;
    
    // Assigned users (CC) can view
    if (entry.diary_assignments?.some((a: any) => a.user_id === user.id)) return true;
    
    // Executors can view
    if (entry.diary_workflow_nodes?.some((node: any) => node.executor_id === user.id)) return true;
    
    return false;
  };
  
  // Delete diary entry (admin only)
  const handleDeleteEntry = async (entry: DiaryEntry) => {
    if (!user?.id || user.role !== 'admin') {
      alert('Only admins can delete diary entries.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete this diary entry from ${entry.date}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/diary/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh diary entries
        await fetchDiaryEntries();
        alert('Diary entry deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete diary entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting diary entry:', error);
      alert('Failed to delete diary entry. Please try again.');
    }
  };
  
  // Get the weather icon based on condition
  const getWeatherIcon = (weather: string) => {
    if (weather.toLowerCase().includes('sun') || weather.toLowerCase().includes('clear')) {
      return <RiIcons.RiSunLine className="text-amber-500" />;
    } else if (weather.toLowerCase().includes('cloud')) {
      return <RiIcons.RiCloudyLine className="text-gray-500" />;
    } else if (weather.toLowerCase().includes('rain')) {
      return <RiIcons.RiRainyLine className="text-blue-500" />;
    } else if (weather.toLowerCase().includes('snow')) {
      return <RiIcons.RiSnowflakeLine className="text-blue-300" />;
    } else {
      return <RiIcons.RiSunCloudyLine className="text-amber-400" />;
    }
  };
  
  // Stats for the header section
  const getStats = () => {
    const totalEntries = diaryEntries.length;
    const thisWeekEntries = diaryEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return entryDate >= startOfWeek;
    }).length;
    
    const uniqueAuthors = new Set(diaryEntries.map(entry => entry.author)).size;
    
    return { totalEntries, thisWeekEntries, uniqueAuthors };
  };
  
  const stats = getStats();

  // Get workflow status badge
  const getWorkflowStatusBadge = (entry: DiaryEntry) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      permanently_rejected: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
    };

    // Get current node completion info
    const currentNode = entry.diary_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    let statusText = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
    let completionInfo = '';
    
    if (entry.status === 'permanently_rejected') {
      statusText = 'Permanently Rejected';
    } else if (currentNode && entry.status === 'pending') {
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      completionInfo = ` (${completionCount}/${maxCompletions})`;
      
      if (completionCount >= maxCompletions && !currentNode.can_re_edit) {
        statusText = 'Limit Reached';
      }
    }

    return (
      <div className="flex flex-col items-start">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status as keyof typeof statusColors] || statusColors.pending}`}>
          {statusText}
        </span>
        {completionInfo && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Completions{completionInfo}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RiIcons.RiLoader4Line className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading diary entries...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced header with gradient background */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M30,0 L200,0 L200,200 L0,150 Q10,100 30,0"
              fill="url(#diaryGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="diaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#3b82f6" />
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
                  <RiIcons.RiBookmarkLine className="mr-3 text-blue-300" />
                  {t('diary.title')}
                </h1>
                <p className="text-blue-200 mt-2 max-w-2xl">
                  Record daily site activities, track progress, and maintain a comprehensive record of your construction project
                </p>
                {/* Project indicator */}
                {selectedProject ? (
                  <div className="mt-3 flex items-center text-blue-100">
                    <RiIcons.RiBuilding4Line className="mr-2" />
                    <span className="text-sm">
                      Showing diary entries for: <span className="font-semibold">{selectedProject.name}</span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center text-yellow-200">
                    <RiIcons.RiInformationLine className="mr-2" />
                    <span className="text-sm">
                      No project selected. Please select a project to view diary entries.
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Only admin can see new entry button */}
              {user?.role === 'admin' && selectedProject && (
                <Button 
                  variant="futuristic" 
                  leftIcon={<RiIcons.RiAddLine />}
                  onClick={() => setShowNewEntry(true)}
                  animated
                  pulseEffect
                  glowing
                >
                  New Entry
                </Button>
              )}
              <Button 
                variant="futuristic"
                leftIcon={<RiIcons.RiFileTextLine />}
                animated
                glowing
              >
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Statistics Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiBookmarkLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Entries</div>
                <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiCalendarLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">This Week</div>
                <div className="text-2xl font-bold text-white">{stats.thisWeekEntries}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiIcons.RiUser3Line className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Contributors</div>
                <div className="text-2xl font-bold text-white">{stats.uniqueAuthors}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <Card className="p-5 border-none shadow-md bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow relative">
              <Input
                type="text"
                placeholder={t('common.search') + " diary entries..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<RiIcons.RiSearchLine className="text-secondary-500" />}
                className="w-full pl-10 pr-4 py-3 text-base"
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setSearchQuery('')}
                >
                  <RiIcons.RiCloseLine />
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center text-secondary-500 dark:text-secondary-400">
              <RiIcons.RiInformationLine className="mr-2" />
              <span className="text-sm">
                {filteredEntries.length} {filteredEntries.length === 1 ? t('diary.entry') : t('diary.entries')} {t('common.found')}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Diary entries list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <Card 
                className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border border-secondary-100 dark:border-dark-700"
              >
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <RiIcons.RiCalendarLine className="text-primary-600 dark:text-primary-400 mr-2" />
                      <span className="font-medium text-primary-900 dark:text-primary-300">{entry.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getWorkflowStatusBadge(entry)}
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                    Daily Log by {entry.author}
                  </h3>
                  
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    {getWeatherIcon(entry.weather)}
                    <span className="ml-1">{entry.weather}, {entry.temperature}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-2">
                      {t('diary.workCompleted')}:
                    </h4>
                    <p className="text-secondary-600 dark:text-secondary-400 line-clamp-2">
                      {entry.work_completed}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        {t('diary.incidents')}:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.incidents_reported || t('common.none')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        {t('diary.materials')}:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.materials_delivered || t('common.none')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <div className="flex space-x-2">
                      {canUserViewEntry(entry) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewForm(entry)}
                          leftIcon={<RiIcons.RiFileTextLine />}
                          className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          {canUserUpdateForm(entry) ? 'Edit Form' : 'View Form'}
                        </Button>
                      )}
                      {canUserViewEntry(entry) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          rightIcon={<RiIcons.RiArrowRightLine />}
                          className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        >
                          {t('common.viewDetails')}
                        </Button>
                      )}
                      {/* Admin delete button */}
                      {user?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteEntry(entry)}
                          leftIcon={<RiIcons.RiDeleteBinLine />}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-300 hover:border-red-400"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {filteredEntries.length === 0 && (
          <Card className="p-8 text-center bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm shadow-md">
            <div className="text-6xl mx-auto mb-4 text-primary-500 opacity-70">
              <RiIcons.RiBookmarkLine />
            </div>
            {!selectedProject ? (
              <>
                <h2 className="text-xl font-display font-semibold mb-2">No Project Selected</h2>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-lg mx-auto">
                  Please select a project from the sidebar to view and manage diary entries for that project.
                </p>
              </>
            ) : diaryEntries.length === 0 ? (
              <>
                <h2 className="text-xl font-display font-semibold mb-2">No Diary Entries Found</h2>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-lg mx-auto">
                  No diary entries have been created for <span className="font-semibold">{selectedProject.name}</span> yet.
                  {user?.role === 'admin' && ' Create the first entry to get started.'}
                </p>
                {user?.role === 'admin' && (
                  <Button 
                    variant="primary" 
                    leftIcon={<RiIcons.RiAddLine />}
                    onClick={() => setShowNewEntry(true)}
                    className="shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Create First Entry
                  </Button>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold mb-2">No Entries Match Your Search</h2>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-lg mx-auto">
                  No diary entries found matching "{searchQuery}" in <span className="font-semibold">{selectedProject.name}</span>.
                  Try adjusting your search terms.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Clear Search
                </Button>
              </>
            )}
          </Card>
        )}
      </motion.div>
      
      {/* New Diary Entry Modal */}
      {showNewEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewEntry(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SiteDiaryFormTemplate
                onClose={() => setShowNewEntry(false)}
                onSave={handleCreateEntry}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
      
      {/* Entry Details Dialog */}
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={t('diary.entryDetails')}
      >
        {selectedDiaryEntry && (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary-900 dark:text-primary-300 flex items-center">
                <RiIcons.RiCalendarCheckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                {selectedDiaryEntry.date}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiIcons.RiUserLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">{t('diary.author')}</span>
                </div>
                <div className="font-medium">{selectedDiaryEntry.author}</div>
              </div>
              
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <div className="mr-2 text-primary-600 dark:text-primary-400">
                    {getWeatherIcon(selectedDiaryEntry.weather)}
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wide">{t('diary.weatherConditions')}</span>
                </div>
                <div className="font-medium">{selectedDiaryEntry.weather}, {selectedDiaryEntry.temperature}</div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiTaskLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.workCompleted')}</span>
              </div>
              <div className="whitespace-pre-line">{selectedDiaryEntry.work_completed}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiAlertLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.incidentsReported')}</span>
              </div>
              <div>{selectedDiaryEntry.incidents_reported || t('common.none')}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiTruckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.materialsDelivered')}</span>
              </div>
              <div>{selectedDiaryEntry.materials_delivered || t('common.none')}</div>
            </div>
            
            <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiFileTextLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">{t('diary.notes')}</span>
              </div>
              <div>{selectedDiaryEntry.notes || t('common.none')}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedDiaryEntry.diary_workflow_nodes && selectedDiaryEntry.diary_workflow_nodes.length > 0 && (
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiIcons.RiFlowChart className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedDiaryEntry.diary_workflow_nodes
                    .sort((a: any, b: any) => a.node_order - b.node_order)
                    .map((node: any, index: number) => (
                      <div key={node.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            node.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            node.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            node.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {node.status === 'completed' ? <RiIcons.RiCheckLine /> :
                             node.status === 'pending' ? <RiIcons.RiTimeLine /> :
                             node.status === 'rejected' ? <RiIcons.RiCloseLine /> :
                             <RiIcons.RiMoreLine />}
                          </div>
                          <div>
                            <div className="font-medium text-secondary-900 dark:text-white">{node.node_name}</div>
                            {node.executor_name && (
                              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                                Assigned to: {node.executor_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          node.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          node.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          node.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Comments Section */}
            {selectedDiaryEntry.diary_comments && selectedDiaryEntry.diary_comments.length > 0 && (
              <div className="bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm border border-secondary-100 dark:border-dark-700">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiIcons.RiChat3Line className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                </div>
                
                <div className="space-y-3">
                  {selectedDiaryEntry.diary_comments
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((comment: any) => (
                      <div key={comment.id} className="p-3 bg-secondary-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-secondary-900 dark:text-white">{comment.user_name}</div>
                          <div className="flex items-center space-x-2">
                            {comment.action && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                comment.action === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                comment.action === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              }`}>
                                {comment.action.charAt(0).toUpperCase() + comment.action.slice(1)}
                              </span>
                            )}
                            <span className="text-xs text-secondary-500 dark:text-secondary-400">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-secondary-700 dark:text-secondary-300">{comment.comment}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-secondary-200 dark:border-dark-700">
              {/* First row - Primary action buttons */}
              <div className="flex justify-end space-x-3 mb-3">
                <Button 
                  variant="outline"
                  leftIcon={<RiIcons.RiDownload2Line />}
                >
                  {t('common.export')}
                </Button>
                <Button 
                  variant="outline"
                  leftIcon={<RiIcons.RiPrinterLine />}
                >
                  {t('common.print')}
                </Button>
                
                {/* Admin delete button */}
                {user?.role === 'admin' && (
                  <Button 
                    variant="outline"
                    leftIcon={<RiIcons.RiDeleteBinLine />}
                    onClick={() => {
                      setShowDetails(false);
                      handleDeleteEntry(selectedDiaryEntry);
                    }}
                    className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Entry
                  </Button>
                )}
              </div>

              {/* Second row - Workflow action buttons */}
              <div className="flex justify-end space-x-3">
                {/* Workflow Action Buttons - show for pending entries and rejected entries where user has permissions */}
                {(selectedDiaryEntry.status === 'pending' || selectedDiaryEntry.status === 'rejected') && (
                  <>
                    {/* Admin can edit when entry is pending or rejected */}
                    {canUserEditEntry(selectedDiaryEntry) && (
                      <Button 
                        variant="outline"
                        leftIcon={<RiIcons.RiEditLine />}
                        onClick={() => {
                          setShowDetails(false);
                          setShowFormView(true);
                        }}
                      >
                        Edit Form
                      </Button>
                    )}
                    
                    {/* Current node executor can approve, reject, or send back */}
                    {canUserApproveEntry(selectedDiaryEntry) && (
                      <>
                        {/* Back to previous node button (only if not first node) */}
                        {selectedDiaryEntry.current_node_index > 0 && (
                          <Button 
                            variant="outline"
                            leftIcon={<RiIcons.RiArrowLeftLine />}
                            onClick={() => handleWorkflowAction('back')}
                            className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          >
                            Send Back
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline"
                          leftIcon={<RiIcons.RiCloseLine />}
                          onClick={() => handleWorkflowAction('reject')}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Reject
                        </Button>
                        <Button 
                          variant="primary"
                          leftIcon={<RiIcons.RiCheckLine />}
                          onClick={() => handleWorkflowAction('approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {selectedDiaryEntry.current_node_index === 1 ? 'Complete' : 'Approve'}
                        </Button>
                      </>
                    )}
                  </>
                )}
                
                <Button 
                  variant="primary"
                  onClick={() => setShowDetails(false)}
                >
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      
      {/* Process Flow Configuration Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCancelProcessFlow}
          >
            <motion.div
              className="w-full max-w-7xl max-h-[90vh] overflow-auto bg-white dark:bg-dark-900 rounded-xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-display font-bold flex items-center">
                      <RiIcons.RiFlowChart className="mr-3" />
                      Process Configuration
                    </h2>
                    <p className="text-primary-100 mt-1">
                      Configure the workflow process for this diary entry before saving.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleCancelProcessFlow}
                    className="text-white border-white hover:bg-white/10"
                  >
                    <RiIcons.RiCloseLine className="text-xl" />
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel - Flow chart */}
                  <div className="lg:col-span-5">
                    <Card className="p-4 h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-secondary-900 dark:text-white">Process Flow</h3>
                        <Button 
                          variant="primary" 
                          size="sm"
                          leftIcon={<RiIcons.RiAddLine />}
                          onClick={addNewNode}
                        >
                          Add Node
                        </Button>
                      </div>
                      
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
                            className="bg-white dark:bg-dark-800"
                          />
                          
                          {selectedNode.type === 'node' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Executor
                                </label>
                                <div className="flex items-center space-x-2">
                                  <div className="flex-grow bg-secondary-50 dark:bg-dark-700 border border-secondary-200 dark:border-dark-600 rounded p-3 text-secondary-600 dark:text-secondary-400">
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
                                    <div className="flex-grow bg-secondary-50 dark:bg-dark-700 border border-secondary-200 dark:border-dark-600 rounded p-3 min-h-[50px]">
                                      {selectedNode.ccRecipients && selectedNode.ccRecipients.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {selectedNode.ccRecipients.map(cc => (
                                            <div 
                                              key={cc.id} 
                                              className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full flex items-center text-sm"
                                            >
                                              <span className="mr-2">{cc.name}</span>
                                              <button
                                                type="button"
                                                className="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200"
                                                onClick={() => removeUserFromCc(cc.id)}
                                              >
                                                <RiIcons.RiCloseLine />
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
                                  
                                  {selectedNode.ccRecipients && selectedNode.ccRecipients.length > 0 && (
                                    <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center">
                                      <RiIcons.RiTeamLine className="mr-1" />
                                      {selectedNode.ccRecipients.length} {selectedNode.ccRecipients.length === 1 ? 'person' : 'people'} will be notified
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Edit Access
                                </label>
                                <div className="flex items-center space-x-3">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedNode.editAccess !== false}
                                      onChange={(e) => {
                                        const updatedNode = { ...selectedNode, editAccess: e.target.checked };
                                        const updatedNodes = processNodes.map(node => 
                                          node.id === selectedNode.id ? updatedNode : node
                                        );
                                        setProcessNodes(updatedNodes);
                                        setSelectedNode(updatedNode);
                                      }}
                                      className="mr-2 rounded border-secondary-300 dark:border-dark-600"
                                    />
                                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                                      Allow editing when this node is active
                                    </span>
                                  </label>
                                </div>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                                  When enabled, both executor and CC recipients can edit the form when this node is active
                                </p>
                              </div>

                              {/* Expire Time Configuration */}
                              <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                                  Task Expiration
                                </label>
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <select 
                                      value={selectedNode.expireTime === 'unlimited' || !selectedNode.expireTime ? 'unlimited' : 'custom'}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const updatedNode = { 
                                          ...selectedNode, 
                                          expireTime: value === 'unlimited' ? 'unlimited' : '',
                                          expireDuration: value === 'unlimited' ? null : (selectedNode.expireDuration || 24)
                                        };
                                        const updatedNodes = processNodes.map(node => 
                                          node.id === selectedNode.id ? updatedNode : node
                                        );
                                        setProcessNodes(updatedNodes);
                                        setSelectedNode(updatedNode);
                                      }}
                                      className="flex-1 bg-white dark:bg-dark-700 border border-secondary-200 dark:border-dark-600 rounded p-2 text-secondary-900 dark:text-white"
                                    >
                                      <option value="unlimited">Unlimited</option>
                                      <option value="custom">Custom Date & Time</option>
                                    </select>
                                  </div>
                                  
                                  {(selectedNode.expireTime !== 'unlimited' && selectedNode.expireTime !== undefined) && (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="datetime-local"
                                          value={selectedNode.expireTime && selectedNode.expireTime !== 'unlimited' ? 
                                            (selectedNode.expireTime.includes('T') ? selectedNode.expireTime.slice(0, 16) : '') : ''}
                                          onChange={(e) => {
                                            const updatedNode = { 
                                              ...selectedNode, 
                                              expireTime: e.target.value ? new Date(e.target.value).toISOString() : '',
                                              expireDuration: null
                                            };
                                            const updatedNodes = processNodes.map(node => 
                                              node.id === selectedNode.id ? updatedNode : node
                                            );
                                            setProcessNodes(updatedNodes);
                                            setSelectedNode(updatedNode);
                                          }}
                                          min={new Date().toISOString().slice(0, 16)}
                                          className="flex-1 bg-white dark:bg-dark-700 border border-secondary-200 dark:border-dark-600 rounded p-2 text-secondary-900 dark:text-white"
                                        />
                                      </div>
                                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                        Select the date and time when this task should expire
                                      </p>
                                    </div>
                                  )}
                                  
                                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                                    {selectedNode.expireTime === 'unlimited' 
                                      ? 'This task will not expire automatically.'
                                      : selectedNode.expireTime && selectedNode.expireTime !== 'unlimited'
                                        ? `This task will expire on ${new Date(selectedNode.expireTime).toLocaleString()}`
                                        : 'Select a custom expiration date and time above.'
                                    }
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
                          <RiIcons.RiFlowChart className="text-4xl mx-auto mb-2 opacity-50" />
                          <p>Select a node to configure its settings</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-secondary-200 dark:border-dark-700">
                  <Button 
                    variant="outline"
                    leftIcon={<RiIcons.RiArrowLeftLine />}
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
                      leftIcon={<RiIcons.RiCheckLine />}
                      onClick={handleFinalSave}
                      className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                    >
                      Save Diary Entry
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
      
      {/* People Selector Modal */}
      <PeopleSelectorModal
        isOpen={showPeopleSelector}
        onClose={() => setShowPeopleSelector(false)}
        onSelect={handleUserSelection}
        title={peopleSelectorType === 'executor' ? 'Select Executor' : 'Add CC Recipient'}
        users={users}
        loading={loadingUsers}
      />

      {/* Form View Modal */}
      {showFormView && selectedDiaryEntry && (
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
              <SiteDiaryFormTemplate
                onClose={() => setShowFormView(false)}
                onSave={handleFormUpdate}
                initialData={selectedDiaryEntry.form_data}
                isEditMode={canUserEditEntry(selectedDiaryEntry) || canUserUpdateForm(selectedDiaryEntry)}
                readOnly={!canUserEditEntry(selectedDiaryEntry) && !canUserUpdateForm(selectedDiaryEntry)}
                title={`${
                  canUserEditEntry(selectedDiaryEntry) ? 'Edit' : 
                  canUserUpdateForm(selectedDiaryEntry) ? 'Update' : 
                  'View'
                } Diary Entry - ${selectedDiaryEntry.date}`}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default DiaryPage; 