import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { RiAddLine, RiShieldCheckLine, RiAlarmWarningLine, RiFileWarningLine, RiPercentLine, RiFilter3Line, RiErrorWarningLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiFlowChart, RiSettings4Line, RiNotificationLine, RiUserLine, RiCloseLine, RiTeamLine, RiListCheck, RiDownload2Line, RiPrinterLine, RiDeleteBinLine, RiEditLine, RiFileListLine, RiMoreLine, RiChat3Line, RiHistoryLine, RiLoader4Line, RiSearchLine, RiBuilding4Line, RiAlertLine, RiTimeLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { SafetyInspectionChecklistTemplate } from '../components/forms/SafetyInspectionChecklistTemplate';
import { Input } from '../components/ui/Input';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';
import { projectService } from '../services/projectService';
import { PeopleSelectorModal } from '../components/ui/PeopleSelectorModal';
import { ReportModal } from '../components/common/ReportModal';
import { FullReportContent } from '../components/common/FullReportContent';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

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
  name?: string;
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
  active?: boolean;
  expires_at?: string;
  expiresAt?: string;
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

interface HistoryEntry {
  id: string;
  changed_at: string;
  form_data: any;
  users?: {
    name: string;
    email: string;
  };
  // Compatibility fields
  action?: string;
  changes?: string;
  performed_by?: string;
  timestamp?: string;
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
  const [showReport, setShowReport] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const reportContentRef = useRef<HTMLDivElement | null>(null);
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

  // History states
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});
  const [savingExpiry, setSavingExpiry] = useState<Record<string, boolean>>({});
  const [updatingExpiryStatus, setUpdatingExpiryStatus] = useState<Record<string, boolean>>({});
  const [sendingNodeReminder, setSendingNodeReminder] = useState<Record<string, boolean>>({});
  const [renamingSafety, setRenamingSafety] = useState<Record<string, boolean>>({});

  const fetchHistory = async (safetyId: string) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${safetyId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        console.error('Failed to fetch history');
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestore = async (history: HistoryEntry) => {
    if (!selectedSafetyEntry) return;
    
    if (!window.confirm('Are you sure you want to restore this version? This will create a new history entry with the current state.')) {
      return;
    }

    try {
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${selectedSafetyEntry.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ historyId: history.id })
      });

      if (response.ok) {
        alert('Safety entry restored successfully!');
        setShowHistory(false);
        fetchSafetyEntries();
        setSelectedSafetyEntry(null);
        setShowDetails(false);
      } else {
        const error = await response.json();
        alert(`Failed to restore safety entry: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring safety entry:', error);
      alert('Failed to restore safety entry. Please try again.');
    }
  };

  const handleViewHistory = async (entry: SafetyEntry) => {
    setSelectedSafetyEntry(entry);
    setShowHistory(true);
    await fetchHistory(entry.id);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected' | 'permanently_rejected'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

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

  // Fetch safety entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchSafetyEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id, fetchSafetyEntries, fetchUsers]);

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
          action: 'update',
          userId: user.id
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

  const stats = useMemo(() => {
    const totalInspections = safetyEntries.length;
    const averageScore = totalInspections > 0
      ? Math.round(safetyEntries.reduce((sum, entry) => sum + (entry.safety_score || 0), 0) / totalInspections)
      : 0;
    const pendingInspections = safetyEntries.filter((entry) => entry.status === 'pending').length;
    const completedInspections = safetyEntries.filter((entry) => entry.status === 'completed').length;
    const thisWeekInspections = safetyEntries.filter((entry) => {
      const createdDate = new Date(entry.created_at || entry.date);
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return createdDate >= sevenDaysAgo && createdDate <= now;
    }).length;
    const uniqueInspectors = new Set(safetyEntries.map((entry) => entry.inspector).filter(Boolean)).size;

    return {
      totalInspections,
      averageScore,
      pendingInspections,
      completedInspections,
      thisWeekInspections,
      uniqueInspectors
    };
  }, [safetyEntries]);

  const statusCounts = useMemo(() => ({
    all: safetyEntries.length,
    pending: safetyEntries.filter((entry) => entry.status === 'pending').length,
    completed: safetyEntries.filter((entry) => entry.status === 'completed').length,
    rejected: safetyEntries.filter((entry) => entry.status === 'rejected').length,
    permanently_rejected: safetyEntries.filter((entry) => entry.status === 'permanently_rejected').length
  }), [safetyEntries]);

  const toDatetimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getDefaultExpiryDate = (entry: SafetyEntry) => {
    const baseDate = new Date(entry.created_at || entry.date);
    const resolvedBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const defaultExpiryDate = new Date(resolvedBaseDate);
    defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 10);
    return defaultExpiryDate;
  };

  const getEntryExpiryDate = (entry: SafetyEntry) => {
    const expirySource = entry.expires_at || entry.expiresAt;
    const parsedExpiry = expirySource ? new Date(expirySource) : getDefaultExpiryDate(entry);
    return Number.isNaN(parsedExpiry.getTime()) ? getDefaultExpiryDate(entry) : parsedExpiry;
  };

  const isEntryExpired = (entry: SafetyEntry) => {
    return entry.active === false || getEntryExpiryDate(entry).getTime() <= Date.now();
  };

  const getSafetyDisplayName = (entry: SafetyEntry) => {
    const preferredName = (entry.name || entry.project || '').trim();
    if (!preferredName || preferredName.toLowerCase() === 'unknown project') {
      return 'New Safety';
    }
    return preferredName;
  };

  const getExpirySummary = (entry: SafetyEntry) => {
    const expiryDate = getEntryExpiryDate(entry);
    const now = new Date();
    const msLeft = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (isEntryExpired(entry)) {
      const daysOverdue = Math.max(1, Math.abs(daysLeft));
      return {
        text: `Expired ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago`,
        className: 'bg-[#ffe9b8] text-[#8a4b14] dark:bg-[#8a4b14]/30 dark:text-[#ffd978]'
      };
    }
    return {
      text: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      className: 'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/25 dark:text-[#f2cd6f]'
    };
  };

  const canSendNodeReminder = (node: any) => {
    const nodeName = String(node?.node_name || node?.name || '').toLowerCase();
    return nodeName !== 'start' && nodeName !== 'complete';
  };

  const filteredEntries = useMemo(() => {
    let entries = [...safetyEntries];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      entries = entries.filter((entry) =>
        getSafetyDisplayName(entry).toLowerCase().includes(query) ||
        entry.inspector?.toLowerCase().includes(query) ||
        entry.inspection_type?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      entries = entries.filter((entry) => entry.status === statusFilter);
    }

    entries.sort((a, b) => {
      const dateA = new Date(a.created_at || a.date).getTime();
      const dateB = new Date(b.created_at || b.date).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return entries;
  }, [safetyEntries, searchQuery, statusFilter, sortBy]);

  const reportRows = useMemo(() => (
    filteredEntries.map((entry) => ({
      id: entry.id,
      date: entry.date || (entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '-'),
      project: entry.project || '-',
      inspector: entry.inspector || '-',
      inspection_type: entry.inspection_type || '-',
      safety_score: entry.safety_score ?? 0,
      findings_count: entry.findings_count ?? 0,
      incidents_reported: entry.incidents_reported || '-',
      corrective_actions: entry.corrective_actions || '-',
      notes: entry.notes || '-',
      status: entry.status || 'pending'
    }))
  ), [filteredEntries]);

  const reportStatusCounts = useMemo(() => ({
    pending: reportRows.filter((row) => row.status === 'pending').length,
    completed: reportRows.filter((row) => row.status === 'completed').length,
    rejected: reportRows.filter((row) => row.status === 'rejected').length,
    permanentlyRejected: reportRows.filter((row) => row.status === 'permanently_rejected').length
  }), [reportRows]);

  const reportHighlights = useMemo(() => {
    const avg = reportRows.length
      ? Math.round(reportRows.reduce((sum, row) => sum + Number(row.safety_score || 0), 0) / reportRows.length)
      : 0;
    const topType = Object.entries(
      reportRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.inspection_type || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];
    return [
      `Average safety score: ${avg}%`,
      `Total findings in filtered inspections: ${reportRows.reduce((sum, row) => sum + Number(row.findings_count || 0), 0)}`,
      `Inspections with incidents: ${reportRows.filter((row) => row.incidents_reported && row.incidents_reported !== '-').length}`,
      `Most frequent inspection type: ${topType ? `${topType[0]} (${topType[1]})` : 'N/A'}`
    ];
  }, [reportRows]);

  const statusChartData = useMemo(() => ({
    labels: ['Pending', 'Completed', 'Rejected', 'Permanently Rejected'],
    datasets: [{
      data: [
        reportStatusCounts.pending,
        reportStatusCounts.completed,
        reportStatusCounts.rejected,
        reportStatusCounts.permanentlyRejected
      ],
      backgroundColor: ['#ffd978', '#c27a1b', '#9f5818', '#7a410f'],
      borderColor: ['#ffe9b8', '#d8a126', '#c27a1b', '#8a4b14'],
      borderWidth: 1
    }]
  }), [reportStatusCounts]);

  const trendChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.date || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(map).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return {
      labels,
      datasets: [{
        label: 'Inspections',
        data: labels.map((label) => map[label]),
        borderColor: '#a56a1f',
        backgroundColor: 'rgba(197, 122, 27, 0.2)',
        tension: 0.3,
        fill: true
      }]
    };
  }, [reportRows]);

  const contributorChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.inspector || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        label: 'Inspections',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#c27a1b'
      }]
    };
  }, [reportRows]);

  const inspectionTypeChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.inspection_type || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([type]) => type),
      datasets: [{
        label: 'Count',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#8a4b14'
      }]
    };
  }, [reportRows]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8a4b14' } } },
    scales: {
      x: { ticks: { color: '#8a4b14' }, grid: { color: 'rgba(197, 122, 27, 0.2)' } },
      y: { ticks: { color: '#8a4b14', precision: 0 }, grid: { color: 'rgba(197, 122, 27, 0.2)' } }
    }
  }), []);

  const issueRows = useMemo(() => (
    reportRows.filter((row) => row.incidents_reported && row.incidents_reported !== '-')
  ), [reportRows]);

  const handleDownloadReportPdf = useCallback(async () => {
    if (!reportContentRef.current) return;
    setIsDownloadingReport(true);
    try {
      const canvas = await html2canvas(reportContentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      let position = 0;
      let remaining = height;
      pdf.addImage(imageData, 'PNG', 0, position, width, height);
      remaining -= pdf.internal.pageSize.getHeight();
      while (remaining > 0) {
        position = remaining - height;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', 0, position, width, height);
        remaining -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`safety-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsDownloadingReport(false);
    }
  }, []);

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-[#8a4b14]';
    if (score >= 75) return 'text-[#c27a1b]';
    return 'text-[#d8a126]';
  };

  const getWorkflowStatusBadge = (entry: SafetyEntry) => {
    const statusColors = {
      pending: 'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/25 dark:text-[#f2cd6f]',
      completed: 'bg-[#ffe9b8] text-[#8a4b14] dark:bg-[#8a4b14]/35 dark:text-[#ffd978]',
      rejected: 'bg-[#ffe4a8] text-[#9f5818] dark:bg-[#8a4b14]/30 dark:text-[#f2cd6f]',
      permanently_rejected: 'bg-[#ffd978] text-[#7a410f] dark:bg-[#8a4b14]/45 dark:text-[#ffe9b8]'
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
          <span className="text-xs text-[#a56a1f] dark:text-[#f2cd6f] mt-1">
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

  const handleSetExpiry = async (entry: SafetyEntry) => {
    if (!user?.id || user.role !== 'admin') return;
    const draftValue = expiryDrafts[entry.id];
    if (!draftValue) {
      alert('Please select an expiry date and time.');
      return;
    }
    const parsedExpiry = new Date(draftValue);
    if (Number.isNaN(parsedExpiry.getTime())) {
      alert('Invalid expiry date.');
      return;
    }
    try {
      setSavingExpiry((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}/expiry`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          expiresAt: parsedExpiry.toISOString()
        })
      });
      if (response.ok) {
        alert('Expiry date updated successfully.');
        await fetchSafetyEntries();
        if (selectedSafetyEntry?.id === entry.id) {
          await handleViewDetails(entry);
        }
      } else {
        const error = await response.json();
        alert(`Failed to set expiry date: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error setting expiry date:', error);
      alert('Failed to set expiry date. Please try again.');
    } finally {
      setSavingExpiry((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleSetExpiryStatus = async (entry: SafetyEntry, nextActive: boolean) => {
    if (!user?.id || user.role !== 'admin') return;
    try {
      setUpdatingExpiryStatus((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}/expiry-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          active: nextActive
        })
      });
      if (response.ok) {
        alert(nextActive ? 'Safety entry reactivated.' : 'Safety entry marked as expired.');
        await fetchSafetyEntries();
        if (selectedSafetyEntry?.id === entry.id) {
          await handleViewDetails(entry);
        }
      } else {
        const error = await response.json();
        alert(`Failed to update expiry status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating expiry status:', error);
      alert('Failed to update expiry status. Please try again.');
    } finally {
      setUpdatingExpiryStatus((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleNodeReminder = async (entry: SafetyEntry, node: any) => {
    if (!user?.id || user.role !== 'admin') return;
    const defaultMessage = `Reminder: Please action "${node.node_name}" step.`;
    const messageInput = prompt('Enter reminder message for this step:', defaultMessage);
    if (messageInput === null) return;
    const message = messageInput.trim() || defaultMessage;
    const reminderKey = `${entry.id}-${node.node_order}`;
    try {
      setSendingNodeReminder((prev) => ({ ...prev, [reminderKey]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}/nodes/${node.node_order}/delay-notify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          message
        })
      });
      if (response.ok) {
        alert('Reminder sent successfully.');
      } else {
        const error = await response.json();
        alert(`Failed to send reminder: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setSendingNodeReminder((prev) => ({ ...prev, [reminderKey]: false }));
    }
  };

  const handleRenameSafety = async (entry: SafetyEntry) => {
    if (!user?.id || user.role !== 'admin') return;
    const currentName = getSafetyDisplayName(entry);
    const nextNamePrompt = prompt('Enter new safety form name:', currentName);
    if (nextNamePrompt === null) return;
    const nextName = nextNamePrompt.trim();
    if (!nextName) {
      alert('Name cannot be empty.');
      return;
    }
    if (nextName === currentName) return;
    try {
      setRenamingSafety((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/safety/${entry.id}/name`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          name: nextName
        })
      });
      if (response.ok) {
        alert('Safety form renamed successfully.');
        await fetchSafetyEntries();
        if (selectedSafetyEntry?.id === entry.id) {
          await handleViewDetails(entry);
        }
      } else {
        const error = await response.json();
        alert(`Failed to rename safety form: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error renaming safety form:', error);
      alert('Failed to rename safety form. Please try again.');
    } finally {
      setRenamingSafety((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#5a2f0f] via-[#8a4b14] to-[#d8a126] p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-ai-dots opacity-20" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center text-3xl font-display font-bold text-white md:text-4xl">
                <RiShieldCheckLine className="mr-3 text-[#ffe9b8]" />
                {t('safety.title')}
              </h1>
              <p className="max-w-3xl text-sm text-white/80 md:text-base">
                Manage safety inspections with faster scanning, stronger status visibility, and cleaner project context.
              </p>
              <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${
                selectedProject
                  ? 'border-[#ffd978]/50 bg-[#ffd978]/20 text-[#fff2d1]'
                  : 'border-[#ffe9b8]/40 bg-[#8a4b14]/30 text-[#fff2d1]'
              }`}>
                {selectedProject ? <RiBuilding4Line className="mr-2" /> : <RiAlertLine className="mr-2" />}
                {selectedProject ? `Project: ${selectedProject.name}` : 'No project selected'}
              </div>
            </div>
            <div className="mt-2 flex flex-nowrap items-center gap-3 lg:mt-0">
              {user?.role === 'admin' && selectedProject && (
                <Button
                  variant="primary"
                  leftIcon={<RiAddLine />}
                  onClick={() => setShowNewInspection(true)}
                  className="whitespace-nowrap"
                  animated
                >
                  New Inspection
                </Button>
              )}
              <Button variant="outline" leftIcon={<RiFileWarningLine />} onClick={() => setShowReport(true)} className="whitespace-nowrap">
                Generate Report
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Total</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.totalInspections}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">This Week</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.thisWeekInspections}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Pending</div>
              <div className="mt-1 text-2xl font-semibold text-[#ffe9b8]">{stats.pendingInspections}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Completed</div>
              <div className="mt-1 text-2xl font-semibold text-[#ffd978]">{stats.completedInspections}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Inspectors</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.uniqueInspectors}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ISO19650 Safety Inspection Form Modal */}
      <AnimatePresence>
        {showNewInspection && (
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#3a2009]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowNewInspection(false)}
          >
            <motion.div
              className="h-[95dvh] w-full max-w-6xl overflow-hidden rounded-t-2xl border border-[#ffd978]/40 bg-gradient-to-b from-white to-[#fff7df] shadow-2xl dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="space-y-4 border border-secondary-200/60 p-4 md:p-5 dark:border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-200">
              <RiFilter3Line className="mr-2 text-[#a56a1f] dark:text-[#ffd978]" />
              Search & Filter
            </div>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),200px,190px]">
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project, inspector, inspection type"
                className="h-11 w-full rounded-xl border border-secondary-200 bg-white py-2.5 pl-10 pr-10 text-sm text-secondary-900 outline-none transition focus:border-[#a56a1f] focus:ring-2 focus:ring-[#ffe9b8] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#8a4b14]/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300"
                >
                  <RiCloseLine />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-11 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-900 outline-none transition focus:border-[#a56a1f] focus:ring-2 focus:ring-[#ffe9b8] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#8a4b14]/30"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="permanently_rejected">Permanently Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="h-11 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-900 outline-none transition focus:border-[#a56a1f] focus:ring-2 focus:ring-[#ffe9b8] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#8a4b14]/30"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Completed' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'permanently_rejected', label: 'Permanent' }
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key as typeof statusFilter)}
                className={`inline-flex min-w-max items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === filter.key
                    ? 'border-[#8a4b14] bg-[#8a4b14] text-white shadow-sm'
                    : 'border-secondary-200 bg-white text-secondary-700 hover:border-[#d8a126] hover:text-[#8a4b14] dark:border-dark-600 dark:bg-dark-800 dark:text-secondary-300 dark:hover:border-[#c27a1b]/40'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                  statusFilter === filter.key
                    ? 'bg-white/20 text-white'
                    : 'bg-secondary-100 text-secondary-600 dark:bg-dark-700 dark:text-secondary-300'
                }`}>
                  {statusCounts[filter.key as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
            <div className="ml-auto inline-flex min-w-max items-center rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-xs text-secondary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-secondary-200">
              <RiListCheck className="mr-1.5" />
              {filteredEntries.length} shown
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        {filteredEntries.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.06, 0.4) }}
              >
                <Card className="h-full border border-[#ffe9b8]/60 bg-gradient-to-b from-white to-[#fff9e8]/90 p-0 dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
                  <div className="border-b border-[#ffe9b8]/70 bg-gradient-to-r from-[#fff4cc]/80 via-[#fff9e8]/80 to-white p-4 dark:border-dark-700 dark:from-[#5a2f0f]/20 dark:via-dark-800 dark:to-dark-900">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-300">
                          <RiShieldCheckLine className="mr-2 text-[#a56a1f] dark:text-[#ffd978]" />
                          {entry.date}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-secondary-900 dark:text-white">
                          {getSafetyDisplayName(entry)}
                        </h3>
                      </div>
                      {getWorkflowStatusBadge(entry)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-600 dark:text-secondary-300">
                      <span className="inline-flex items-center">
                        <RiUserLine className="mr-1" />
                        {entry.inspector}
                      </span>
                      <span className="inline-flex items-center">
                        <RiFileWarningLine className="mr-1" />
                        {entry.inspection_type}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getExpirySummary(entry).className}`}>
                        <RiAlarmWarningLine className="mr-1" />
                        {getExpirySummary(entry).text}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        Safety Score
                      </div>
                      <p className={`line-clamp-1 text-lg font-semibold ${getScoreColorClass(entry.safety_score)}`}>
                        {entry.safety_score}%
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-[#ffe9b8]/60 bg-[#fff9e8]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                        <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                          Incidents
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                          {entry.incidents_reported || 'None'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#ffe9b8]/60 bg-[#fff9e8]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                        <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                          Findings
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                          {entry.findings_count} issues
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#ffe9b8]/60 bg-white/90 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                      <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        Notes
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                        {entry.notes || 'None'}
                      </p>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="rounded-lg border border-[#ffe9b8]/60 bg-[#fff9e8]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                          {isEntryExpired(entry) ? 'Activation' : 'Expiry Controls'}
                        </div>
                        {isEntryExpired(entry) ? (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetExpiryStatus(entry, true)}
                              isLoading={!!updatingExpiryStatus[entry.id]}
                              leftIcon={<RiCheckLine />}
                              className="h-9"
                            >
                              Set Active
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr),auto,auto]">
                            <input
                              type="datetime-local"
                              value={expiryDrafts[entry.id] || toDatetimeLocalValue(getEntryExpiryDate(entry))}
                              onChange={(e) => setExpiryDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                              className="h-9 rounded-lg border border-secondary-200 bg-white px-3 text-xs text-secondary-900 outline-none transition [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:border-dark-600 dark:bg-white dark:text-secondary-900 dark:focus:ring-[#8a4b14]/25 focus:border-[#a56a1f] focus:ring-2 focus:ring-[#ffe9b8]"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetExpiry(entry)}
                              isLoading={!!savingExpiry[entry.id]}
                              leftIcon={<RiAlarmWarningLine className="text-[#8a4b14] dark:text-[#ffd978]" />}
                              className="h-9"
                            >
                              Set Expiry
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetExpiryStatus(entry, false)}
                              isLoading={!!updatingExpiryStatus[entry.id]}
                              leftIcon={<RiTimeLine />}
                              className="h-9"
                            >
                              Set Expired
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      {canUserViewEntry(entry) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          rightIcon={<RiArrowRightLine />}
                        >
                          View Details
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(entry)}
                        leftIcon={<RiHistoryLine />}
                      >
                        History
                      </Button>
                      {user?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenameSafety(entry)}
                          isLoading={!!renamingSafety[entry.id]}
                          leftIcon={<RiEditLine />}
                          className="border-[#d8a126] text-[#8a4b14] hover:border-[#c27a1b] hover:bg-[#fff4cc] dark:hover:bg-[#8a4b14]/30"
                        >
                          Rename
                        </Button>
                      )}
                      {user?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry)}
                          leftIcon={<RiDeleteBinLine />}
                          className="border-[#d8a126] text-[#8a4b14] hover:border-[#c27a1b] hover:bg-[#fff4cc] dark:hover:bg-[#8a4b14]/30"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border border-[#ffe9b8]/60 bg-gradient-to-b from-white to-[#fff9e8]/90 p-10 text-center dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/40 dark:text-[#ffd978]">
              <RiShieldCheckLine className="text-3xl" />
            </div>
            {!selectedProject ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Project Selected</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  Select a project to view and manage safety inspections in one place.
                </p>
              </>
            ) : safetyEntries.length === 0 ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Safety Entries Yet</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  {selectedProject.name} has no safety inspections yet. Start with your first inspection record.
                </p>
                {user?.role === 'admin' && (
                  <div className="mt-5">
                    <Button variant="primary" leftIcon={<RiAddLine />} onClick={() => setShowNewInspection(true)}>
                      Create First Inspection
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Results Found</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  No inspections match the current search or filter criteria.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Reset Filter
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </motion.div>

      {/* Process Flow Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#3a2009]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="h-[95dvh] w-full max-w-7xl overflow-auto rounded-t-2xl border border-[#ffd978]/40 bg-gradient-to-b from-white to-[#fff7df] shadow-xl dark:bg-secondary-800 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
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
                                              className="flex items-center rounded-full bg-[#fff4cc] px-3 py-1 text-sm text-[#8a4b14] dark:bg-[#8a4b14]/30 dark:text-[#ffd978]"
                                            >
                                              <span className="mr-2">{cc.name}</span>
                                              <button
                                                type="button"
                                                className="text-[#a56a1f] hover:text-[#8a4b14] dark:text-[#f2cd6f] dark:hover:text-[#ffe9b8]"
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
                                    className="rounded border-secondary-300 text-[#8a4b14] focus:ring-[#8a4b14] dark:border-secondary-600"
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
                      className="bg-gradient-to-r from-[#8a4b14] to-[#a56a1f] hover:from-[#7a410f] hover:to-[#8a4b14]"
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
        className="w-full max-w-5xl border border-secondary-200/80 bg-white/95 shadow-2xl dark:border-dark-700 dark:bg-dark-900/95"
        disablePadding
      >
        {selectedSafetyEntry && (
          <div className="max-h-[80vh] space-y-5 overflow-y-auto p-5">
            <div className="flex items-center justify-between rounded-xl border border-[#ffe9b8] bg-[#fff7df] p-3 dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-lg font-bold text-[#7a410f] dark:text-[#ffd978]">
                <RiShieldCheckLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                Safety Inspection - {selectedSafetyEntry.date}
              </div>
              <div className="flex items-center space-x-2">
                 {getWorkflowStatusBadge(selectedSafetyEntry)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiUserLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                  <span className="text-sm font-medium uppercase tracking-wide">Inspector</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.inspector}</div>
              </div>
              
              <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <div className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]">
                    <RiShieldCheckLine />
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wide">Inspection Type</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.inspection_type}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiPercentLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                  <span className="text-sm font-medium uppercase tracking-wide">Safety Score</span>
                </div>
                <div className={`font-medium text-lg ${getScoreColorClass(selectedSafetyEntry.safety_score)}`}>
                  {selectedSafetyEntry.safety_score}%
                </div>
              </div>
              
              <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiAlarmWarningLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                  <span className="text-sm font-medium uppercase tracking-wide">Findings Count</span>
                </div>
                <div className="font-medium">{selectedSafetyEntry.findings_count}</div>
              </div>
            </div>
            
            <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiErrorWarningLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                <span className="text-sm font-medium uppercase tracking-wide">Incidents Reported</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.incidents_reported || 'None'}</div>
            </div>
            
            <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiSettings4Line className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                <span className="text-sm font-medium uppercase tracking-wide">Corrective Actions</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.corrective_actions || 'None'}</div>
            </div>
            
            <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiFileWarningLine className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                <span className="text-sm font-medium uppercase tracking-wide">Notes</span>
              </div>
              <div className="whitespace-pre-line">{selectedSafetyEntry.notes || 'None'}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedSafetyEntry.safety_workflow_nodes && selectedSafetyEntry.safety_workflow_nodes.length > 0 && (
              <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiFlowChart className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedSafetyEntry.safety_workflow_nodes
                    .sort((a: any, b: any) => a.node_order - b.node_order)
                    .map((node: any) => (
                      <div key={node.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-dark-700 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            node.status === 'completed' ? 'bg-[#ffe9b8] text-[#8a4b14] dark:bg-[#8a4b14]/30 dark:text-[#ffd978]' :
                            node.status === 'pending' ? 'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/25 dark:text-[#f2cd6f]' :
                            node.status === 'rejected' ? 'bg-[#ffe4a8] text-[#9f5818] dark:bg-[#8a4b14]/30 dark:text-[#f2cd6f]' :
                            'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/20 dark:text-[#f2cd6f]'
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
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            node.status === 'completed' ? 'bg-[#ffe9b8] text-[#8a4b14] dark:bg-[#8a4b14]/30 dark:text-[#ffd978]' :
                            node.status === 'pending' ? 'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/25 dark:text-[#f2cd6f]' :
                            node.status === 'rejected' ? 'bg-[#ffe4a8] text-[#9f5818] dark:bg-[#8a4b14]/30 dark:text-[#f2cd6f]' :
                            'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/20 dark:text-[#f2cd6f]'
                          }`}>
                            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                          </span>
                          {user?.role === 'admin' && canSendNodeReminder(node) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNodeReminder(selectedSafetyEntry, node)}
                              isLoading={!!sendingNodeReminder[`${selectedSafetyEntry.id}-${node.node_order}`]}
                              leftIcon={<RiNotificationLine />}
                              className="h-8"
                            >
                              Reminder
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Comments Section */}
            {selectedSafetyEntry.safety_comments && selectedSafetyEntry.safety_comments.length > 0 && (
              <div className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiChat3Line className="mr-2 text-[#a56a1f] dark:text-[#f2cd6f]" />
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
                                comment.action === 'approve' ? 'bg-[#ffe9b8] text-[#8a4b14] dark:bg-[#8a4b14]/30 dark:text-[#ffd978]' :
                                comment.action === 'reject' ? 'bg-[#ffe4a8] text-[#9f5818] dark:bg-[#8a4b14]/30 dark:text-[#f2cd6f]' :
                                'bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/20 dark:text-[#f2cd6f]'
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
                      className="text-[#a56a1f] hover:bg-[#fff4cc] hover:text-[#8a4b14]"
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

                  {/* History Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiHistoryLine />}
                    onClick={() => {
                      setShowDetails(false);
                      handleViewHistory(selectedSafetyEntry);
                    }}
                    className="hover:bg-white/5"
                  >
                    History
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
                          className="border-[#c27a1b]/40 text-[#c27a1b] hover:border-[#a56a1f] hover:bg-[#fff4cc]"
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
                          className="border-[#d8a126]/40 text-[#9f5818] hover:border-[#c27a1b] hover:bg-[#fff4cc]"
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
                          className="border-none bg-gradient-to-r from-[#8a4b14] to-[#c27a1b] text-white shadow-lg shadow-[#8a4b14]/25 hover:from-[#7a410f] hover:to-[#a56a1f]"
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#3a2009]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowFormView(false)}
          >
            <motion.div
              className="h-[95dvh] w-full max-w-6xl overflow-auto rounded-t-2xl border border-[#ffd978]/40 bg-gradient-to-b from-white to-[#fff7df] shadow-2xl dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
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

      {/* History Dialog */}
      <Dialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={t('safety.history') || 'Update History'}
        size="lg"
        className="w-full max-w-4xl border border-secondary-200/80 bg-white/95 shadow-2xl dark:border-dark-700 dark:bg-dark-900/95"
        disablePadding
      >
        {loadingHistory ? (
            <div className="flex justify-center p-8">
              <RiLoader4Line className="animate-spin text-3xl text-[#a56a1f]" />
            </div>
         ) : (
           <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
             {historyData.length === 0 ? (
               <p className="py-8 text-center text-[#a56a1f]">No history available for this entry.</p>
             ) : (
               historyData.map((history) => (
                 <div key={history.id} className="rounded-xl border border-[#ffe9b8] bg-[#fff9e8]/80 p-4 transition-shadow hover:shadow-md dark:border-dark-700 dark:bg-dark-800/60">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center">
                       <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4cc] text-[#a56a1f] dark:bg-[#8a4b14]/35 dark:text-[#ffd978]">
                         <RiUserLine />
                       </div>
                       <div>
                         <div className="font-semibold text-[#7a410f] dark:text-[#ffe9b8]">
                           {history.performed_by || history.users?.name || 'Unknown User'}
                         </div>
                         <div className="text-xs text-[#a56a1f] dark:text-[#f2cd6f]">
                           {history.action || history.users?.email}
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-medium text-[#7a410f] dark:text-[#ffe9b8]">
                         {new Date(history.timestamp || history.changed_at || '').toLocaleDateString()}
                       </div>
                       <div className="text-xs text-[#a56a1f] dark:text-[#f2cd6f]">
                         {new Date(history.timestamp || history.changed_at || '').toLocaleTimeString()}
                       </div>
                     </div>
                   </div>
                   
                   {/* Summary of changes if available */}
                   <div className="mb-4 space-y-2 rounded-lg border border-[#ffe9b8] bg-white p-3 dark:border-dark-700 dark:bg-dark-900">
                     <div className="text-sm text-[#8a4b14] dark:text-[#f2cd6f]">
                       <span className="font-medium text-[#a56a1f] dark:text-[#ffd978]">Changes: </span>
                       <span>{history.changes || 'Form updated'}</span>
                     </div>
                   </div>
 
                   <div className="flex justify-end space-x-2">
                      {user?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(history)}
                          leftIcon={<RiHistoryLine />}
                          className="text-[#a56a1f] hover:bg-[#fff4cc] hover:text-[#8a4b14] dark:text-[#f2cd6f] dark:hover:bg-[#8a4b14]/25 dark:hover:text-[#ffe9b8]"
                        >
                          Restore
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedHistoryEntry(history);
                          setShowHistoryForm(true);
                          setShowHistory(false);
                        }}
                        leftIcon={<RiFileListLine />}
                        className="w-full sm:w-auto"
                      >
                        View Form Snapshot
                      </Button>
                    </div>
                 </div>
               ))
             )}
           </div>
         )}
       </Dialog>

      {/* History Form View Modal */}
      {showHistoryForm && selectedHistoryEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#3a2009]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => {
              setShowHistoryForm(false);
              setShowHistory(true);
            }}
          >
            <motion.div
              className="h-[95dvh] w-full max-w-6xl overflow-auto rounded-t-2xl border border-[#ffd978]/40 bg-gradient-to-b from-white to-[#fff7df] shadow-2xl dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SafetyInspectionChecklistTemplate
                onClose={() => {
                  setShowHistoryForm(false);
                  setShowHistory(true);
                }}
                onSave={() => {}} // Read-only
                initialData={selectedHistoryEntry.form_data}
                isEditMode={false}
                readOnly={true}
                title={`History Snapshot - ${new Date(selectedHistoryEntry.timestamp || selectedHistoryEntry.changed_at || '').toLocaleString()}`}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Safety Inspections Full Report"
        subtitle="Comprehensive report for currently listed safety inspections."
        downloadLabel="Download PDF"
        onDownload={handleDownloadReportPdf}
        isDownloading={isDownloadingReport}
        contentRef={reportContentRef}
        maxWidthClassName="max-w-[1700px]"
        theme={{
          headerGradient: 'from-[#7a410f] to-[#c27a1b]',
          bodyBackground: 'bg-[#fff8e5]/60 dark:bg-dark-800/20'
        }}
      >
        <FullReportContent
          generatedOn={new Date().toLocaleString()}
          projectName={selectedProject?.name || 'All Projects'}
          summaryCards={[
            { label: 'Total Listed', value: reportRows.length },
            { label: 'Pending', value: reportStatusCounts.pending },
            { label: 'Completed', value: reportStatusCounts.completed },
            { label: 'Rejected', value: reportStatusCounts.rejected },
            { label: 'Permanent Rejected', value: reportStatusCounts.permanentlyRejected },
            {
              label: 'Avg Safety Score',
              value: reportRows.length
                ? `${Math.round(reportRows.reduce((sum, row) => sum + Number(row.safety_score || 0), 0) / reportRows.length)}%`
                : '0%'
            }
          ]}
          reportHighlights={reportHighlights}
          statusChartTitle="Status Distribution"
          trendChartTitle="Inspections Over Time"
          contributorChartTitle="Top Inspectors"
          weatherChartTitle="Inspection Type Distribution"
          statusChartData={statusChartData}
          trendChartData={trendChartData}
          contributorChartData={contributorChartData}
          weatherChartData={inspectionTypeChartData}
          chartOptions={chartOptions}
          issueSectionTitle="Incident Details"
          issueColumns={[
            { key: 'date', label: 'Date' },
            { key: 'inspector', label: 'Inspector' },
            { key: 'project', label: 'Project' },
            { key: 'incidents_reported', label: 'Incident' }
          ]}
          issueRows={issueRows}
          issueEmptyText="No incidents found in the currently listed inspections."
          listSectionTitle="Full Safety Inspection List"
          listColumns={[
            { key: 'date', label: 'Date' },
            { key: 'project', label: 'Project' },
            { key: 'inspector', label: 'Inspector' },
            { key: 'inspection_type', label: 'Inspection Type' },
            { key: 'safety_score', label: 'Safety Score' },
            { key: 'findings_count', label: 'Findings' },
            { key: 'status', label: 'Status' },
            { key: 'corrective_actions', label: 'Corrective Actions' },
            { key: 'notes', label: 'Notes' }
          ]}
          listRows={reportRows}
          theme={{
            cardBorder: 'border-[#ffe9b8] dark:border-dark-700',
            cardSurface: 'bg-[#fffdf4] dark:bg-dark-800',
            accentText: 'text-[#a56a1f]',
            numberText: 'text-[#7a410f] dark:text-[#ffe9b8]'
          }}
        />
      </ReportModal>
    </div>
  );
};

export default SafetyPage; 
