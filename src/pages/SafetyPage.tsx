import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { RiAddLine, RiShieldCheckLine, RiAlarmWarningLine, RiFileWarningLine, RiPercentLine, RiArrowUpLine, RiArrowDownLine, RiFilter3Line, RiBellLine, RiErrorWarningLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiFlowChart, RiSettings4Line, RiNotificationLine, RiUserLine, RiCloseLine, RiTeamLine, RiListCheck, RiLayoutGridLine, RiDownload2Line, RiPrinterLine, RiDeleteBinLine, RiEditLine, RiFileListLine, RiMoreLine, RiChat3Line } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { SafetyInspectionChecklistTemplate } from '../components/forms/SafetyInspectionChecklistTemplate';
import { Input } from '../components/ui/Input';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';
import { projectService } from '../services/projectService';
import { PeopleSelectorModal } from '../components/ui/PeopleSelectorModal';

// Define UserSelection interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Define ProcessNode interface
interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string; // Keep as string for compatibility
  executorId?: string; // Add executor ID for backend
  ccRecipients?: User[]; // Add node-specific CC recipients
  editAccess?: boolean; // Add edit access flag
  expireTime?: string; // Add expire time field
  expireDuration?: number | null; // Add expire duration in hours (null = unlimited)
  settings: Record<string, any>;
}

interface SafetyEntry {
  id: string;
  date: string;
  project: string;
  project_id?: string;
  inspector: string;
  inspection_type: string;
  safety_score: number;
  findings_count: number;
  incidents_reported: string;
  corrective_actions: string;
  notes: string;
  form_data?: any;
  status: string;
  current_node_index: number;
  current_active_node?: string; // Add current active node tracking
  safety_workflow_nodes?: any[];
  safety_assignments?: any[];
  safety_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
}

interface SafetyInspection {
  id: number;
  date: string;
  type: string;
  score: number;
  inspector: string;
  project: string;
  findings: number;
}

interface SafetyIncident {
  id: number;
  date: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'investigating' | 'resolved' | 'closed';
  location: string;
  project: string;
}

const SafetyPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewInspection, setShowNewInspection] = useState(false);
  const [selectedSafetyEntry, setSelectedSafetyEntry] = useState<SafetyEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
    { id: 'review', type: 'node', name: 'Safety Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
    { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');
  
  // Safety entries from API
  const [safetyEntries, setSafetyEntries] = useState<SafetyEntry[]>([]);

  // View and filter states
  const [showGridView, setShowGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('week');
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  const [filter, setFilter] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Mock safety alerts for now
  const [safetyAlerts] = useState([
    {
      id: 1,
      message: 'High wind alert: Take precautions with scaffolding',
      type: 'weather',
      timestamp: new Date().getTime() - 1000 * 60 * 30 // 30 minutes ago
    },
    {
      id: 2,
      message: 'PPE compliance dropping below threshold (84%)',
      type: 'compliance',
      timestamp: new Date().getTime() - 1000 * 60 * 60 * 2 // 2 hours ago
    }
  ]);

  // Inspection types
  const inspectionTypes = [
    'Daily Site Safety Check',
    'Fire Safety Inspection',
    'Equipment Safety Check',
    'Personal Protective Equipment (PPE) Compliance',
    'Electrical Safety Inspection',
    'Hazardous Materials Check',
    'Fall Protection Audit',
    'Emergency Preparedness Review'
  ];

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: number) => {
    const diff = new Date().getTime() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return `${minutes}m ago`;
    }
  };

  // Fetch safety entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchSafetyEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id]);

  // Handle URL query parameters for direct navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && safetyEntries.length > 0) {
      const entry = safetyEntries.find(e => e.id === id);
      if (entry) {
        setSelectedSafetyEntry(entry);
        setShowDetails(true);
      }
    }
  }, [location.search, safetyEntries]);

  // Fetch safety entries from API with project filtering
  const fetchSafetyEntries = useCallback(async () => {
    if (!user) return;
    try {
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`https://server.matrixtwin.com/api/safety/list/${user.id}${projectParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSafetyEntries(data);
      } else {
        console.error('Failed to fetch safety entries');
      }
    } catch (error) {
      console.error('Error fetching safety entries:', error);
    }
  }, [user, selectedProject?.id]);

  // Fetch users from API (using project members)
  const fetchUsers = useCallback(async () => {
    if (!selectedProject?.id) return;
    
    try {
      setLoadingUsers(true);
      // Use projectService to fetch project members
      const members = await projectService.getProjectMembers(selectedProject.id);
      
      // Map ProjectMember to User interface
      const mappedUsers: User[] = members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        avatar: member.user.avatar
      }));
      
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching project members:', error);
      // Fallback to current user if fetch fails
      if (user) {
        setUsers([{
          id: user.id,
          name: user.name || 'Current User',
          email: user.email || 'user@example.com',
          role: user.role || 'admin'
        }]);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedProject?.id, user]);

  // Filtered entries based on search - Simplified since search is removed
  const filteredEntries = safetyEntries;

  const addNewNode = () => {
    const newNode: ProcessNode = {
      id: `node_${Date.now()}`,
      type: 'node',
      name: 'New Process Step',
      editAccess: true,
      ccRecipients: [],
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

  const handleCreateInspection = (formData: any) => {
    setPendingFormData(formData);
    setShowNewInspection(false);
    setShowProcessFlow(true);
    setSelectedNode(processNodes.find(node => node.type === 'node') || null);
  };

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

      console.log('Sending safety entry data:', {
        formData: pendingFormData,
        processNodes: processNodesForBackend,
        createdBy: user.id,
        projectId: selectedProject?.id,
        formId: pendingFormData.formNumber,
        name: pendingFormData.formNumber
      });

      const response = await fetch('https://server.matrixtwin.com/api/safety/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: pendingFormData,
          processNodes: processNodesForBackend,
          createdBy: user.id,
          projectId: selectedProject?.id,
          formId: pendingFormData.formNumber,
          name: pendingFormData.formNumber
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Safety entry created successfully:', result);
        
        // Refresh safety entries
        await fetchSafetyEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setSelectedNode(null);
        
        // Reset process nodes to default
        setProcessNodes([
          { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
          { id: 'review', type: 'node', name: 'Safety Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
          { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
        ]);
        
        // Show success message
        alert('Safety entry created successfully! Notifications have been sent to assigned users.');
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Failed to create safety entry:', errorData);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        alert(`Failed to create safety entry: ${errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`}`);
      }
    } catch (error) {
      console.error('Error creating safety entry:', error);
      alert('Failed to create safety entry. Please try again.');
    }
  };

  const handleCancelProcessFlow = () => {
    setPendingFormData(null);
    setShowProcessFlow(false);
    setSelectedNode(null);
  };

  const handleViewDetails = async (entry: SafetyEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedSafetyEntry(fullEntry);
        setShowDetails(true);
      } else {
        setSelectedSafetyEntry(entry);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedSafetyEntry(entry);
      setShowDetails(true);
    }
  };

  const handleViewForm = async (entry: SafetyEntry) => {
    try {
      // Fetch full entry details including form data
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/safety/${entry.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fullEntry = await response.json();
        setSelectedSafetyEntry(fullEntry);
        setShowFormView(true);
      } else {
        setSelectedSafetyEntry(entry);
        setShowFormView(true);
      }
    } catch (error) {
      console.error('Error fetching entry details:', error);
      setSelectedSafetyEntry(entry);
      setShowFormView(true);
    }
  };

  const handleFormUpdate = async (formData: any) => {
    if (!selectedSafetyEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${selectedSafetyEntry.id}/update`, {
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
        // Refresh safety entries
        await fetchSafetyEntries();
        setShowFormView(false);
        setSelectedSafetyEntry(null);
        alert('Safety entry updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update safety entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating safety entry:', error);
      alert('Failed to update safety entry. Please try again.');
    }
  };

  // Handle workflow actions (approve/reject/back to previous)
  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'back') => {
    if (!selectedSafetyEntry || !user?.id) return;

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
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${selectedSafetyEntry.id}/update`, {
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
        
        // Refresh safety entries and entry details
        await fetchSafetyEntries();
        await handleViewDetails(selectedSafetyEntry);
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

  // Check if user can edit/approve the safety entry
  const canUserEditEntry = (entry: SafetyEntry) => {
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
    const currentNode = entry.safety_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id && entry.status === 'rejected') {
      return true;
    }
    
    return false;
  };

  // Check if user can update form data (current node executor or CC with edit access)
  const canUserUpdateForm = (entry: SafetyEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected
    if (entry.status === 'permanently_rejected') {
      return false;
    }
    
    // Admin can always edit
    if (user.role === 'admin') return true;
    
    // Check if user is the executor for current workflow node
    const currentNode = entry.safety_workflow_nodes?.find((node: any) => 
      node.node_order === entry.current_node_index
    );
    
    if (currentNode) {
      // If entry status is 'rejected', the current node should have full access
      if (entry.status === 'rejected' && currentNode.executor_id === user.id) {
        return true;
      }
      
      // For pending status, check normal permissions
      if (entry.status === 'pending') {
        // Executor can always edit
        if (currentNode.executor_id === user.id) return true;
        
        // CC can edit if edit access is enabled for this node
        if (currentNode.edit_access) {
          const isCC = entry.safety_assignments?.some((a: any) => 
            a.user_id === user.id && a.node_id === currentNode.node_id
          );
          if (isCC) return true;
        }
      }
    }
    
    return false;
  };

  // Check if user can approve/reject current workflow step (only executor)
  const canUserApproveEntry = (entry: SafetyEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected or completed
    if (entry.status === 'permanently_rejected' || entry.status === 'completed') {
      return false;
    }
    
    // Admin can always approve
    if (user.role === 'admin') return true;
    
    // Check if user is the executor for current workflow node
    const currentNode = entry.safety_workflow_nodes?.find((node: any) => 
      node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id) {
      // If entry status is 'rejected', the current node should have full access
      if (entry.status === 'rejected') {
        return true;
      }
      
      // For pending status, allow approval
      if (entry.status === 'pending') {
        return true;
      }
    }
    
    return false;
  };

  // Check if user can view entry (all assigned users, executors, and admin)
  const canUserViewEntry = (entry: SafetyEntry) => {
    if (!user?.id) return false;
    
    // Admin can always view
    if (user.role === 'admin') return true;
    
    // Creator can view
    if (entry.created_by === user.id) return true;
    
    // Assigned users (CC) can view
    if (entry.safety_assignments?.some((a: any) => a.user_id === user.id)) return true;
    
    // Executors can view
    if (entry.safety_workflow_nodes?.some((node: any) => node.executor_id === user.id)) return true;
    
    return false;
  };

  const getStats = () => {
    const totalInspections = safetyEntries.length;
    const averageScore = totalInspections > 0 
      ? Math.round(safetyEntries.reduce((sum, entry) => sum + (entry.safety_score || 0), 0) / totalInspections)
      : 0;
    const pendingInspections = safetyEntries.filter(entry => entry.status === 'pending').length;
    const completedInspections = safetyEntries.filter(entry => entry.status === 'completed').length;
    
    return {
      totalInspections,
      averageScore,
      pendingInspections,
      completedInspections
    };
  };

  const getTrendData = () => {
    // Mock trend data for now - in a real app this would come from API
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      scores: [88, 92, 85, 90, 94, 89, 91],
      incidents: [1, 0, 1, 0, 0, 0, 0]
    };
  };

  const getTrend = () => {
    const data = getTrendData().scores;
    const currentAvg = data.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
    const prevAvg = data.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
    const change = ((currentAvg - prevAvg) / prevAvg) * 100;
    
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkflowStatusBadge = (entry: SafetyEntry) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      permanently_rejected: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
    };

    // Get current node completion info
    const currentNode = entry.safety_workflow_nodes?.find(
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

  // Delete safety entry (admin only)
  const handleDeleteEntry = async (entry: SafetyEntry) => {
    if (!user?.id || user.role !== 'admin') {
      alert('Only admins can delete safety entries.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete this safety entry from ${entry.date}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh safety entries
        await fetchSafetyEntries();
        alert('Safety entry deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete safety entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting safety entry:', error);
      alert('Failed to delete safety entry. Please try again.');
    }
  };

  return (
    <div>
      {/* Enhanced header with safety dashboard */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-red-800 via-red-700 to-orange-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M50,0 L200,0 L200,200 L100,180 Q70,160 50,120 Q30,80 50,0"
              fill="url(#safetyGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="safetyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
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
                  <RiShieldCheckLine className="mr-3 text-red-300" />
                  {t('safety.title')}
                </h1>
                <p className="text-red-200 mt-2 max-w-2xl">
                  Monitor safety compliance, track incidents, and identify potential hazards to maintain a safe construction environment
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
                onClick={() => setShowNewInspection(true)}
                animated
                pulseEffect
                glowing
              >
                New Inspection
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiFileWarningLine />}
                animated
                glowing
              >
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Safety Score Visualization */}
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
                  stroke="url(#safetyScoreGradient)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * getStats().averageScore / 100) }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="safetyScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                  className="text-4xl font-bold text-white"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: 'spring' }}
                >
                  {getStats().averageScore}%
                </motion.div>
                <div className="text-sm text-white/70">Safety Score</div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center mb-3">
                <h3 className="text-xl font-semibold text-white">Safety Trend</h3>
                <div className={`ml-3 flex items-center text-sm ${getTrend().direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {getTrend().direction === 'up' ? (
                    <RiArrowUpLine className="mr-1" />
                  ) : (
                    <RiArrowDownLine className="mr-1" />
                  )}
                  {getTrend().percentage}%
                </div>
                <div className="ml-auto flex space-x-2">
                  <button 
                    className={`px-2 py-1 rounded-md text-xs ${chartTimeframe === 'week' ? 'bg-white/20 text-white' : 'text-red-200 hover:bg-white/10'}`}
                    onClick={() => setChartTimeframe('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-md text-xs ${chartTimeframe === 'month' ? 'bg-white/20 text-white' : 'text-red-200 hover:bg-white/10'}`}
                    onClick={() => setChartTimeframe('month')}
                  >
                    Month
                  </button>
                  <button 
                    className={`px-2 py-1 rounded-md text-xs ${chartTimeframe === 'quarter' ? 'bg-white/20 text-white' : 'text-red-200 hover:bg-white/10'}`}
                    onClick={() => setChartTimeframe('quarter')}
                  >
                    Quarter
                  </button>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 h-32 flex items-end justify-between">
                {getTrendData().labels.map((label, index) => (
                  <div key={label} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-red-500 to-green-500 rounded-t-sm"
                      style={{ 
                        height: `${getTrendData().scores[index] / 100 * 100}px`,
                        background: `linear-gradient(to top, 
                          ${getTrendData().scores[index] < 75 ? '#ef4444' : getTrendData().scores[index] < 90 ? '#eab308' : '#22c55e'}, 
                          ${getTrendData().scores[index] < 75 ? '#f87171' : getTrendData().scores[index] < 90 ? '#fcd34d' : '#4ade80'}
                        )` 
                      }}
                    />
                    <div className="text-xs text-white/70 mt-1">{label}</div>
                    {getTrendData().incidents[index] > 0 && (
                      <div className="mt-1 px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] text-white">
                        {getTrendData().incidents[index]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Safety Alerts Section */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center mb-2">
              <RiBellLine className="text-red-300 mr-2" />
              <h3 className="text-lg font-semibold text-white">Safety Alerts</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {safetyAlerts.map(alert => (
                <div key={alert.id} className="min-w-[250px] bg-white/10 backdrop-blur-sm rounded-lg p-3 border-l-4 border-red-500">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium text-white">{alert.message}</div>
                    <div className="text-xs text-white/60">{formatRelativeTime(alert.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ISO19650 Safety Inspection Form Modal */}
      <AnimatePresence>
        {showNewInspection && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewInspection(false)}
          >
            <motion.div
              className="bg-dark-900/80 backdrop-blur-md border border-white/10 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SafetyInspectionChecklistTemplate
                onClose={() => setShowNewInspection(false)}
                onSave={handleCreateInspection}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mr-4">
            <RiShieldCheckLine className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-2xl font-display font-semibold">
                {getStats().completedInspections}
              </h3>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full">
                Complete
              </span>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('safety.completedInspections')}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 mr-4">
            <RiShieldCheckLine className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="text-2xl font-display font-semibold">
                {getStats().pendingInspections}
              </h3>
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full">
                In Progress
              </span>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('safety.pendingInspections')}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mr-4">
            <RiFileWarningLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {safetyEntries.reduce((total, entry) => total + entry.findings_count, 0)}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('safety.totalFindings')}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mr-4">
            <RiPercentLine className="text-2xl" />
          </div>
          <div>
            <h3 className={`text-2xl font-display font-semibold ${getScoreColorClass(getStats().averageScore)}`}>
              {getStats().averageScore}%
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('safety.averageSafetyScore')}</p>
          </div>
        </Card>
      </motion.div>

      {/* Inspection Cards/Table */}
      {!showIncidents && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-display font-semibold">Safety Inspections</h2>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                  View recent safety inspections and compliance reports
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
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
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
                            ? 'bg-white dark:bg-secondary-700 text-red-600 dark:text-red-400 border-b-2 border-red-600'
                            : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                        }`}
                        onClick={() => setActiveFilterTab('status')}
                      >
                        Status
                      </button>
                      <button
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                          activeFilterTab === 'type'
                            ? 'bg-white dark:bg-secondary-700 text-red-600 dark:text-red-400 border-b-2 border-red-600'
                            : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                        }`}
                        onClick={() => setActiveFilterTab('type')}
                      >
                        Type
                      </button>
                      <button
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                          activeFilterTab === 'date'
                            ? 'bg-white dark:bg-secondary-700 text-red-600 dark:text-red-400 border-b-2 border-red-600'
                            : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                        }`}
                        onClick={() => setActiveFilterTab('date')}
                      >
                        Date Range
                      </button>
                      
                      <div className="ml-auto">
                        <button
                          className="px-3 py-1.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition duration-200 flex items-center"
                          onClick={() => {
                            setFilter('all');
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
                            {['all', 'complete', 'pending', 'failed'].map((status) => (
                              <button
                                key={status}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                  filter === status
                                    ? status === 'all'
                                      ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                      : status === 'complete'
                                      ? 'bg-green-600 text-white'
                                      : status === 'pending'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-red-600 text-white'
                                    : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                                }`}
                                onClick={() => setFilter(status)}
                              >
                                {status === 'all' && 'All Status'}
                                {status === 'complete' && 'Complete'}
                                {status === 'pending' && 'Pending'}
                                {status === 'failed' && 'Failed'}
                              </button>
                            ))}
                          </motion.div>
                        )}
                        
                        {activeFilterTab === 'type' && (
                          <motion.div
                            key="type"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-wrap gap-2"
                          >
                            <button
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterType === 'all'
                                  ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterType('all')}
                            >
                              All Types
                            </button>
                            {inspectionTypes.map((type) => (
                              <button
                                key={type}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                  filterType === type
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                                }`}
                                onClick={() => setFilterType(type)}
                              >
                                {type.length > 20 ? `${type.substring(0, 20)}...` : type}
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
                                  className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-red-600/50 focus:border-red-600"
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
                                  className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-red-600/50 focus:border-red-600"
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
                      
                      {filter !== 'all' && (
                        <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                          <span className="mr-1">Status: </span>
                          <span className={`font-medium ${
                            filter === 'complete' ? 'text-green-600 dark:text-green-400' : 
                            filter === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                          </span>
                          <button 
                            className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                            onClick={() => setFilter('all')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      
                      {filterType !== 'all' && (
                        <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                          <span className="mr-1">Type: </span>
                          <span className="font-medium text-red-600 dark:text-red-400">{filterType.length > 15 ? `${filterType.substring(0, 15)}...` : filterType}</span>
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
                          <span className="font-medium text-red-600 dark:text-red-400">
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
                      
                      {filter === 'all' && filterType === 'all' && !filterDateFrom && !filterDateTo && (
                        <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inspection Grid/List View */}
            {showGridView ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {filteredEntries.map((entry) => {
                  return (
                    <Card 
                      key={entry.id} 
                      className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border border-secondary-100 dark:border-dark-700"
                    >
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-800/20 p-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <RiShieldCheckLine className="text-red-600 dark:text-red-400 mr-2" />
                            <span className="font-medium text-red-900 dark:text-red-300">{entry.date}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getWorkflowStatusBadge(entry)}
                          </div>
                        </div>
                        
                        <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                          {entry.inspection_type}
                        </h3>
                        
                        <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                          <RiUserLine className="mr-1" />
                          <span className="ml-1">Inspector: {entry.inspector}</span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                              Safety Score:
                            </h4>
                            <p className={`font-medium text-lg ${getScoreColorClass(entry.safety_score)}`}>
                              {entry.safety_score}%
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                              Findings:
                            </h4>
                            <p className="text-secondary-600 dark:text-secondary-400 font-medium">
                              {entry.findings_count} Issues
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-2">
                            Project:
                          </h4>
                          <p className="text-secondary-600 dark:text-secondary-400 line-clamp-1">
                            {entry.project}
                          </p>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <div className="flex space-x-2">
                            {canUserViewEntry(entry) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(entry)}
                                rightIcon={<RiArrowRightLine />}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                View Details
                              </Button>
                            )}
                            {/* Admin delete button */}
                            {user?.role === 'admin' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteEntry(entry)}
                                leftIcon={<RiDeleteBinLine />}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-300 hover:border-red-400"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50 dark:bg-secondary-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Inspector
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Score
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
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {entry.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {entry.inspection_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {entry.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {entry.inspector}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {entry.status === 'pending' ? (
                            <span className="text-yellow-600 dark:text-yellow-400 inline-flex items-center">
                              <span className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400 mr-1.5 animate-pulse"></span>
                              Pending
                            </span>
                          ) : (
                            <span className={getScoreColorClass(entry.safety_score)}>
                              {entry.safety_score}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getWorkflowStatusBadge(entry)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className="flex justify-end space-x-2">
                            {canUserViewEntry(entry) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(entry)}
                                rightIcon={<RiArrowRightLine />}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                View Details
                              </Button>
                            )}
                            {/* Admin delete button */}
                            {user?.role === 'admin' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteEntry(entry)}
                                leftIcon={<RiCloseLine />}
                                className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-300 hover:border-red-400"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      )}

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
                      Set up the approval workflow for this safety inspection
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
                                      {(selectedNode.ccRecipients || []).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                          {(selectedNode.ccRecipients || []).map(cc => (
                                            <div 
                                              key={cc.id} 
                                              className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full flex items-center text-sm"
                                            >
                                              <span className="mr-2">{cc.name}</span>
                                              <button
                                                type="button"
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
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
                                  
                                  {(selectedNode.ccRecipients || []).length > 0 && (
                                    <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center">
                                      <RiTeamLine className="mr-1" />
                                      {(selectedNode.ccRecipients || []).length} {(selectedNode.ccRecipients || []).length === 1 ? 'person' : 'people'} will be notified
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Edit Access Toggle */}
                              <div>
                                <label className="flex items-center space-x-2">
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
                                    className="rounded border-secondary-300 dark:border-secondary-600 text-red-600 focus:ring-red-500"
                                  />
                                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                                    Allow CC recipients to edit when this node is active
                                  </span>
                                </label>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                                  When enabled, CC recipients can edit the form data when this workflow node is active. Executors can always edit.
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
                                      className="flex-1 bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-2 text-secondary-900 dark:text-white"
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
                                          className="flex-1 bg-white dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded p-2 text-secondary-900 dark:text-white"
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
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      Save Safety Inspection
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
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Safety Inspection Details"
      >
        {selectedSafetyEntry && (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary-900 dark:text-primary-300 flex items-center">
                <RiShieldCheckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                Safety Inspection - {selectedSafetyEntry.date}
              </div>
              <div className="flex items-center space-x-2">
                 {getWorkflowStatusBadge(selectedSafetyEntry)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiUserLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Inspector</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.inspector}</div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <div className="mr-2 text-primary-600 dark:text-primary-400">
                    <RiShieldCheckLine />
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wide">Inspection Type</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.inspection_type}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiPercentLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Safety Score</span>
                </div>
                <div className={`font-medium text-lg ${getScoreColorClass(selectedSafetyEntry.safety_score)}`}>
                  {selectedSafetyEntry.safety_score}%
                </div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiAlarmWarningLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Findings Count</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.findings_count}</div>
              </div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiErrorWarningLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Incidents Reported</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.incidents_reported || 'None'}</div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiSettings4Line className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Corrective Actions</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.corrective_actions || 'None'}</div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiFileWarningLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Notes</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.notes || 'None'}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedSafetyEntry.safety_workflow_nodes && selectedSafetyEntry.safety_workflow_nodes.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiFlowChart className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedSafetyEntry.safety_workflow_nodes
                    .sort((a: any, b: any) => a.node_order - b.node_order)
                    .map((node: any) => (
                      <div key={node.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            node.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                            node.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            node.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {node.status === 'completed' ? <RiCheckLine /> :
                             node.status === 'pending' ? <RiNotificationLine /> :
                             node.status === 'rejected' ? <RiCloseLine /> :
                             <RiMoreLine />}
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
            {selectedSafetyEntry.safety_comments && selectedSafetyEntry.safety_comments.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiChat3Line className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                </div>
                
                <div className="space-y-3">
                  {selectedSafetyEntry.safety_comments
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
            
            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
                {/* Left side: Utility actions */}
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                   <Button 
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiDownload2Line />}
                    className="text-secondary-400 hover:text-white hover:bg-white/5"
                  >
                    Export
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiPrinterLine />}
                    className="text-secondary-400 hover:text-white hover:bg-white/5"
                  >
                    Print
                  </Button>
                  
                  {/* Admin delete button */}
                  {user?.role === 'admin' && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      leftIcon={<RiDeleteBinLine />}
                      onClick={() => {
                        setShowDetails(false);
                        handleDeleteEntry(selectedSafetyEntry);
                      }}
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      Delete
                    </Button>
                  )}
                </div>

                {/* Right side: Workflow actions */}
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                    className="border-white/10 hover:bg-white/5"
                  >
                    Close
                  </Button>

                  {/* View/Edit Form Button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    leftIcon={canUserUpdateForm(selectedSafetyEntry) ? <RiEditLine /> : <RiFileListLine />}
                    onClick={() => {
                      setShowDetails(false);
                      handleViewForm(selectedSafetyEntry);
                    }}
                    className="hover:bg-white/5"
                  >
                    {canUserUpdateForm(selectedSafetyEntry) ? 'Edit Form' : 'View Form'}
                  </Button>

                  {/* Workflow Action Buttons */}
                  {(selectedSafetyEntry.status === 'pending' || selectedSafetyEntry.status === 'rejected') && (
                    <>
                      {/* Send Back (if applicable) */}
                      {canUserApproveEntry(selectedSafetyEntry) && (selectedSafetyEntry.current_node_index || 0) > 0 && (
                        <Button 
                          variant="outline"
                          size="sm"
                          leftIcon={<RiArrowLeftLine />}
                          onClick={() => handleWorkflowAction('back')}
                          className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500"
                        >
                          Send Back
                        </Button>
                      )}
                      
                      {/* Reject */}
                      {canUserApproveEntry(selectedSafetyEntry) && (
                        <Button 
                          variant="outline"
                          size="sm"
                          leftIcon={<RiCloseLine />}
                          onClick={() => handleWorkflowAction('reject')}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
                        >
                          Reject
                        </Button>
                      )}

                      {/* Approve/Complete */}
                      {canUserApproveEntry(selectedSafetyEntry) && (
                        <Button 
                          variant="primary"
                          size="sm"
                          leftIcon={<RiCheckLine />}
                          onClick={() => handleWorkflowAction('approve')}
                          className="bg-portfolio-orange hover:bg-portfolio-orange/80 text-white border-none shadow-lg shadow-portfolio-orange/20"
                        >
                          {(selectedSafetyEntry.current_node_index === 1) ? 'Complete' : 'Approve'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Form View Modal */}
      {showFormView && selectedSafetyEntry && (
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
              <SafetyInspectionChecklistTemplate
                onClose={() => setShowFormView(false)}
                onSave={handleFormUpdate}
                initialData={selectedSafetyEntry?.form_data}
                isEditMode={canUserEditEntry(selectedSafetyEntry) || canUserUpdateForm(selectedSafetyEntry)}
                readOnly={!canUserEditEntry(selectedSafetyEntry) && !canUserUpdateForm(selectedSafetyEntry)}
                title={`${
                  canUserEditEntry(selectedSafetyEntry) ? 'Edit' : 
                  canUserUpdateForm(selectedSafetyEntry) ? 'Update' : 
                  'View'
                } Safety Inspection - ${selectedSafetyEntry.date}`}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default SafetyPage; 