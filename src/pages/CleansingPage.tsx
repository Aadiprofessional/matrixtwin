import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RiAddLine, RiBrushLine, RiCheckboxCircleLine, RiCalendarCheckLine, RiTaskLine, RiMapPinLine, RiPercentLine, RiCheckLine, RiArrowRightLine, RiArrowLeftLine, RiFilter3Line, RiCloseLine, RiLoader4Line, RiFlowChart, RiSettings4Line, RiUserLine, RiSearchLine, RiNotificationLine, RiFileWarningLine, RiAlertLine, RiTeamLine, RiFileTextLine, RiDownload2Line, RiPrinterLine, RiDeleteBinLine, RiFileListLine, RiHistoryLine, RiEditLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { DailyCleaningInspectionTemplate } from '../components/forms/DailyCleaningInspectionTemplate';
import { Dialog } from '../components/ui/Dialog';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';
import { projectService } from '../services/projectService';
import { PeopleSelectorModal } from '../components/ui/PeopleSelectorModal';
import { ReportModal } from '../components/common/ReportModal';
import { FullReportContent } from '../components/common/FullReportContent';
import { exportReportElementToSinglePagePdf } from '../utils/pdfUtils';
import { useFeedback } from '../contexts/FeedbackContext';
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
  executorId?: string;
  ccRecipients?: User[];
  editAccess?: boolean;
  settings: Record<string, any>;
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

interface CleansingEntry {
  id: string;
  date: string;
  project: string;
  name?: string;
  project_id?: string;
  submitter: string;
  area: string;
  cleanliness_score: number;
  cleaning_status: string;
  notes: string;
  form_data?: any;
  status: string;
  current_node_index: number;
  current_active_node?: string; // Add current active node tracking
  cleansing_workflow_nodes?: any[];
  cleansing_assignments?: any[];
  cleansing_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;
  expires_at?: string;
  expiresAt?: string;
}

// People selector modal component
// Removed: imported from ../components/ui/PeopleSelectorModal

const CleansingPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast, showConfirm, showPrompt } = useFeedback();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [selectedCleansingEntry, setSelectedCleansingEntry] = useState<CleansingEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [pendingCleansingName, setPendingCleansingName] = useState('');
  const [pendingCleansingExpiry, setPendingCleansingExpiry] = useState('');
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
    { id: 'review', type: 'node', name: 'Cleansing Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
    { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');

  const formatDateTimeLocal = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };
  
  // Cleansing entries from API
  const [cleansingEntries, setCleansingEntries] = useState<CleansingEntry[]>([]);

  // History states
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  const [expiryDrafts, setExpiryDrafts] = useState<Record<string, string>>({});
  const [savingExpiry, setSavingExpiry] = useState<Record<string, boolean>>({});
  const [updatingExpiryStatus, setUpdatingExpiryStatus] = useState<Record<string, boolean>>({});
  const [sendingNodeReminder, setSendingNodeReminder] = useState<Record<string, boolean>>({});
  const [renamingCleansing, setRenamingCleansing] = useState<Record<string, boolean>>({});

  const fetchHistory = async (cleansingId: string) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${cleansingId}/history`, {
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
    if (!selectedCleansingEntry) return;
    
    if (!(await showConfirm('Are you sure you want to restore this version? This will create a new history entry with the current state.'))) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${selectedCleansingEntry.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ historyId: history.id })
      });

      if (response.ok) {
        showToast('Cleansing entry restored successfully!');
        setShowHistory(false);
        fetchCleansingEntries();
        setSelectedCleansingEntry(null);
        setShowDetails(false);
      } else {
        const error = await response.json();
        showToast(`Failed to restore cleansing entry: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring cleansing entry:', error);
      showToast('Failed to restore cleansing entry. Please try again.');
    }
  };

  const handleViewHistory = async (entry: CleansingEntry) => {
    setSelectedCleansingEntry(entry);
    setShowHistory(true);
    await fetchHistory(entry.id);
  };

  // Fetch cleansing entries from API with project filtering
  const fetchCleansingEntries = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/list/${user.id}${projectParam}`, {
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

  // Fetch cleansing entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchCleansingEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id, fetchCleansingEntries, fetchUsers]);

  // Handle URL query parameters for direct navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && cleansingEntries.length > 0) {
      const entry = cleansingEntries.find(e => e.id === id);
      if (entry) {
        setSelectedCleansingEntry(entry);
        setShowDetails(true);
      }
    }
  }, [location.search, cleansingEntries]);
  
  // Filtered entries based on search
  const toDatetimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getDefaultExpiryDate = (entry: CleansingEntry) => {
    const baseDate = new Date(entry.created_at || entry.date);
    const resolvedBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const defaultExpiryDate = new Date(resolvedBaseDate);
    defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 10);
    return defaultExpiryDate;
  };

  const getEntryExpiryDate = (entry: CleansingEntry) => {
    const expirySource = entry.expires_at || entry.expiresAt;
    const parsedExpiry = expirySource ? new Date(expirySource) : getDefaultExpiryDate(entry);
    return Number.isNaN(parsedExpiry.getTime()) ? getDefaultExpiryDate(entry) : parsedExpiry;
  };

  const isEntryExpired = (entry: CleansingEntry) => {
    return entry.active === false || getEntryExpiryDate(entry).getTime() <= Date.now();
  };

  const getCleansingDisplayName = (entry: CleansingEntry) => {
    const preferredName = (entry.name || entry.project || '').trim();
    if (!preferredName || preferredName.toLowerCase() === 'unknown project') {
      return 'New Cleansing';
    }
    return preferredName;
  };

  const getExpirySummary = (entry: CleansingEntry) => {
    const expiryDate = getEntryExpiryDate(entry);
    const now = new Date();
    const msLeft = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (isEntryExpired(entry)) {
      const daysOverdue = Math.max(1, Math.abs(daysLeft));
      return {
        text: `Expired ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago`,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      };
    }
    return {
      text: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/25 dark:text-teal-300'
    };
  };

  const canSendNodeReminder = (node: any) => {
    const nodeName = String(node?.node_name || node?.name || '').toLowerCase();
    return nodeName !== 'start' && nodeName !== 'complete';
  };

  const filteredEntries = useMemo(() => cleansingEntries.filter(entry => 
    getCleansingDisplayName(entry).toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.submitter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.date.includes(searchQuery)
  ), [cleansingEntries, searchQuery]);
  
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
  
  // Create new cleansing entry - now shows process flow first
  const handleCreateRecord = (formData: any) => {
    const sourceDate = formData?.inspectionDate ? new Date(formData.inspectionDate) : new Date();
    const resolvedDate = Number.isNaN(sourceDate.getTime()) ? new Date() : sourceDate;
    const formattedDate = resolvedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
    const defaultName = `Cleansing Report - ${selectedProject?.name || 'Project'} - ${formattedDate}`;
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 10);

    setPendingFormData(formData);
    setPendingCleansingName(defaultName);
    setPendingCleansingExpiry(formatDateTimeLocal(defaultExpiry));
    setShowNewRecord(false);
    setShowProcessFlow(true);
    setSelectedNode(processNodes.find(node => node.type === 'node') || null);
  };
  
  // Final save after process flow configuration
  const handleFinalSave = async () => {
    if (!pendingFormData || !user?.id) return;

    const entryName = pendingCleansingName.trim();
    if (!entryName) {
      showToast('Please provide a cleansing entry name.');
      return;
    }

    if (!pendingCleansingExpiry) {
      showToast('Please select an expiry date and time.');
      return;
    }

    const parsedExpiry = new Date(pendingCleansingExpiry);
    if (Number.isNaN(parsedExpiry.getTime())) {
      showToast('Please select a valid expiry date and time.');
      return;
    }
    
    try {
      // Prepare process nodes with proper structure for backend
      const processNodesForBackend = processNodes.map(node => ({
        ...node,
        executorId: node.executorId, // Send executor ID
        executorName: node.executor, // Send executor name
        ccRecipients: node.ccRecipients || [], // Send node-specific CCs
        editAccess: node.editAccess !== false // Default to true if not set
      }));

      console.log('Sending cleansing entry data:', {
        formData: pendingFormData,
        processNodes: processNodesForBackend,
        createdBy: user.id,
        projectId: selectedProject?.id,
        formId: pendingFormData.formNumber,
        name: entryName,
        expiresAt: parsedExpiry.toISOString()
      });

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/create`, {
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
          name: entryName,
          expiresAt: parsedExpiry.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Cleansing entry created successfully:', result);
        
        // Refresh cleansing entries
        await fetchCleansingEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setPendingCleansingName('');
        setPendingCleansingExpiry('');
        setSelectedNode(null);
        
        // Reset process nodes to default
        setProcessNodes([
          { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
          { id: 'review', type: 'node', name: 'Cleansing Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
          { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
        ]);
        
        // Show success message
        showToast('Cleansing entry created successfully! Notifications have been sent to assigned users.');
      } else {
        const error = await response.json();
        console.error('Failed to create cleansing entry:', error);
        showToast(`Failed to create cleansing entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating cleansing entry:', error);
      showToast('Failed to create cleansing entry. Please try again.');
    }
  };
  
  // Cancel process flow and go back to form
  const handleCancelProcessFlow = () => {
    setShowProcessFlow(false);
    setShowNewRecord(true);
    setPendingFormData(null);
    setPendingCleansingName('');
    setPendingCleansingExpiry('');
  };
  
  // View entry details
  const handleViewDetails = async (entry: CleansingEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}`, {
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

  // View form data
  const handleViewForm = async (entry: CleansingEntry) => {
    try {
      // Fetch full entry details including form data
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}`, {
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

  // Handle workflow actions (approve/reject/back to previous)
  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'back') => {
    if (!selectedCleansingEntry || !user?.id) return;

    let comment = '';
    if (action === 'reject' || action === 'back') {
      const promptResult = await showPrompt({
        title: action === 'reject' ? 'Reason Required' : 'Comment Required',
        message: `Please provide a ${action === 'reject' ? 'reason for rejection' : 'comment for sending back'}:`,
        placeholder: action === 'reject' ? 'Enter rejection reason' : 'Enter send-back comment',
        confirmLabel: 'Submit'
      });
      if (promptResult === null || promptResult.trim() === '') {
        showToast(`A comment is required when ${action === 'reject' ? 'rejecting' : 'sending back'} an entry.`);
        return;
      }
      comment = promptResult.trim();
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${selectedCleansingEntry.id}/update`, {
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
          showToast('Entry has been permanently rejected - no more edits are allowed as all nodes have reached their completion limit.');
        } else {
          showToast(`Entry ${action}d successfully! Notifications have been sent.`);
        }
        
        // Refresh cleansing entries and entry details
        await fetchCleansingEntries();
        await handleViewDetails(selectedCleansingEntry);
      } else {
        const error = await response.json();
        
        // Handle specific error cases
        if (error.error?.includes('completion limit')) {
          showToast(`Cannot ${action}: ${error.error}\n${error.details || ''}`);
        } else if (error.error?.includes('No previous node available')) {
          showToast(`Cannot send back: ${error.error}\n${error.details || ''}`);
        } else {
          showToast(`Failed to ${action} entry: ${error.error}`);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing entry:`, error);
      showToast(`Failed to ${action} entry. Please try again.`);
    }
  };

  // Handle form update with completion limit checking
  const handleFormUpdate = async (formData: any) => {
    if (!selectedCleansingEntry || !user?.id) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${selectedCleansingEntry.id}/update`, {
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
        // Refresh cleansing entries
        await fetchCleansingEntries();
        setShowFormView(false);
        showToast('Form updated successfully!');
      } else {
        const error = await response.json();
        
        // Handle completion limit errors
        if (error.error?.includes('completion limit')) {
          showToast(`Cannot update form: ${error.error}\n${error.details || ''}`);
        } else {
          showToast(`Failed to update form: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error updating form:', error);
      showToast('Failed to update form. Please try again.');
    }
  };
  
  // Check if user can edit/approve the cleansing entry
  const canUserEditEntry = (entry: CleansingEntry) => {
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
    const currentNode = entry.cleansing_workflow_nodes?.find(
      node => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id && entry.status === 'rejected') {
      return true;
    }
    
    return false;
  };

  // Check if user can update form data (with completion limit awareness)
  const canUserUpdateForm = (entry: CleansingEntry) => {
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
    const currentNode = entry.cleansing_workflow_nodes?.find(
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
    const isAssigned = entry.cleansing_assignments?.some(
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
  const canUserApproveEntry = (entry: CleansingEntry) => {
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
    const currentNode = entry.cleansing_workflow_nodes?.find(
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
  const canUserViewEntry = (entry: CleansingEntry) => {
    if (!user?.id) return false;
    
    // Admin can always view
    if (user.role === 'admin') return true;
    
    // Creator can view
    if (entry.created_by === user.id) return true;
    
    // Assigned users (CC) can view
    if (entry.cleansing_assignments?.some((a: any) => a.user_id === user.id)) return true;
    
    // Executors can view
    if (entry.cleansing_workflow_nodes?.some((node: any) => node.executor_id === user.id)) return true;
    
    return false;
  };
  
  // Delete cleansing entry (admin only)
  const handleDeleteEntry = async (entry: CleansingEntry) => {
    if (!user?.id || user.role !== 'admin') {
      showToast('Only admins can delete cleansing entries.');
      return;
    }

    const confirmDelete = await showConfirm(`Are you sure you want to delete this cleansing entry from ${entry.date}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh cleansing entries
        await fetchCleansingEntries();
        showToast('Cleansing entry deleted successfully!');
      } else {
        const error = await response.json();
        showToast(`Failed to delete cleansing entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting cleansing entry:', error);
      showToast('Failed to delete cleansing entry. Please try again.');
    }
  };

  const handleSetExpiry = async (entry: CleansingEntry) => {
    if (!user?.id || user.role !== 'admin') return;
    const draftValue = expiryDrafts[entry.id];
    if (!draftValue) {
      showToast('Please select an expiry date and time.');
      return;
    }
    const parsedExpiry = new Date(draftValue);
    if (Number.isNaN(parsedExpiry.getTime())) {
      showToast('Invalid expiry date.');
      return;
    }
    try {
      setSavingExpiry((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}/expiry`, {
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
        showToast('Expiry date updated successfully.');
        await fetchCleansingEntries();
      } else {
        const error = await response.json();
        showToast(`Failed to set expiry date: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error setting expiry date:', error);
      showToast('Failed to set expiry date. Please try again.');
    } finally {
      setSavingExpiry((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleSetExpiryStatus = async (entry: CleansingEntry, nextActive: boolean) => {
    if (!user?.id || user.role !== 'admin') return;
    try {
      setUpdatingExpiryStatus((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}/expiry-status`, {
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
        showToast(nextActive ? 'Cleansing entry reactivated.' : 'Cleansing entry marked as expired.');
        await fetchCleansingEntries();
      } else {
        const error = await response.json();
        showToast(`Failed to update expiry status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating expiry status:', error);
      showToast('Failed to update expiry status. Please try again.');
    } finally {
      setUpdatingExpiryStatus((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleNodeReminder = async (entry: CleansingEntry, node: any) => {
    if (!user?.id || user.role !== 'admin') return;
    const defaultMessage = `Reminder: Please action "${node.node_name}" step.`;
    const messageInput = await showPrompt({
      title: 'Send Reminder',
      message: 'Enter reminder message for this step:',
      defaultValue: defaultMessage,
      placeholder: 'Enter reminder message',
      confirmLabel: 'Send'
    });
    if (messageInput === null) return;
    const message = messageInput.trim() || defaultMessage;
    const reminderKey = `${entry.id}-${node.node_order}`;
    try {
      setSendingNodeReminder((prev) => ({ ...prev, [reminderKey]: true }));
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}/nodes/${node.node_order}/delay-notify`, {
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
        showToast('Reminder sent successfully.');
      } else {
        const error = await response.json();
        showToast(`Failed to send reminder: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showToast('Failed to send reminder. Please try again.');
    } finally {
      setSendingNodeReminder((prev) => ({ ...prev, [reminderKey]: false }));
    }
  };

  const handleRenameCleansing = async (entry: CleansingEntry) => {
    if (!user?.id || user.role !== 'admin') return;
    const currentName = getCleansingDisplayName(entry);
    const nextNamePrompt = await showPrompt({
      title: 'Rename Cleansing Form',
      message: 'Enter new cleansing form name:',
      defaultValue: currentName,
      placeholder: 'Enter form name',
      confirmLabel: 'Rename'
    });
    if (nextNamePrompt === null) return;
    const nextName = nextNamePrompt.trim();
    if (!nextName) {
      showToast('Name cannot be empty.');
      return;
    }
    if (nextName === currentName) return;
    try {
      setRenamingCleansing((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/cleansing/${entry.id}/name`, {
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
        showToast('Cleansing form renamed successfully.');
        await fetchCleansingEntries();
      } else {
        const error = await response.json();
        showToast(`Failed to rename cleansing form: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error renaming cleansing form:', error);
      showToast('Failed to rename cleansing form. Please try again.');
    } finally {
      setRenamingCleansing((prev) => ({ ...prev, [entry.id]: false }));
    }
  };
  
  // Get statistics
  const getStats = () => {
    const totalEntries = cleansingEntries.length;
    const avgScore = totalEntries > 0 
      ? Math.round(cleansingEntries.reduce((sum, entry) => sum + (entry.cleanliness_score || 0), 0) / totalEntries)
      : 0;
    const cleanAreas = cleansingEntries.filter(entry => entry.cleanliness_score >= 90).length;
    
    return { totalEntries, avgScore, cleanAreas };
  };
  
  const stats = getStats();

  const reportRows = useMemo(() => (
    filteredEntries.map((entry) => ({
      id: entry.id,
      date: entry.date || '-',
      project: entry.project || '-',
      submitter: entry.submitter || '-',
      area: entry.area || '-',
      cleanliness_score: entry.cleanliness_score ?? 0,
      cleaning_status: entry.cleaning_status || '-',
      status: entry.status || 'pending',
      notes: entry.notes || '-'
    }))
  ), [filteredEntries]);

  const reportStatusCounts = useMemo(() => ({
    pending: reportRows.filter((row) => row.status === 'pending').length,
    completed: reportRows.filter((row) => row.status === 'completed').length,
    rejected: reportRows.filter((row) => row.status === 'rejected').length,
    permanentlyRejected: reportRows.filter((row) => row.status === 'permanently_rejected').length
  }), [reportRows]);

  const reportHighlights = useMemo(() => {
    const avgScore = reportRows.length
      ? Math.round(reportRows.reduce((sum, row) => sum + Number(row.cleanliness_score || 0), 0) / reportRows.length)
      : 0;
    const topArea = Object.entries(
      reportRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.area || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];
    return [
      `Average cleanliness score: ${avgScore}%`,
      `Clean areas (score >= 90): ${reportRows.filter((row) => Number(row.cleanliness_score || 0) >= 90).length}`,
      `Total listed records: ${reportRows.length}`,
      `Most frequent area: ${topArea ? `${topArea[0]} (${topArea[1]})` : 'N/A'}`
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
      backgroundColor: ['#67e8f9', '#34d399', '#2dd4bf', '#0d9488'],
      borderColor: ['#a5f3fc', '#6ee7b7', '#5eead4', '#14b8a6'],
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
        label: 'Records',
        data: labels.map((label) => map[label]),
        borderColor: '#0f766e',
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        tension: 0.3,
        fill: true
      }]
    };
  }, [reportRows]);

  const contributorChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.submitter || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        label: 'Records',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#0f766e'
      }]
    };
  }, [reportRows]);

  const areaChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.area || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([area]) => area),
      datasets: [{
        label: 'Records',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#14b8a6'
      }]
    };
  }, [reportRows]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#0f766e' } } },
    scales: {
      x: { ticks: { color: '#0f766e' }, grid: { color: 'rgba(45, 212, 191, 0.2)' } },
      y: { ticks: { color: '#0f766e', precision: 0 }, grid: { color: 'rgba(45, 212, 191, 0.2)' } }
    }
  }), []);

  const issueRows = useMemo(() => (
    reportRows.filter((row) => row.notes && row.notes !== '-')
  ), [reportRows]);

  const handleDownloadReportPdf = useCallback(async () => {
    if (!reportContentRef.current) return;
    setIsDownloadingReport(true);
    try {
      await exportReportElementToSinglePagePdf(
        reportContentRef.current,
        `cleansing-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } finally {
      setIsDownloadingReport(false);
    }
  }, []);

  // Get workflow status badge
  const getWorkflowStatusBadge = (entry: CleansingEntry) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      permanently_rejected: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
    };

    // Get current node completion info
    const currentNode = entry.cleansing_workflow_nodes?.find(
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
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-4xl text-teal-600 mx-auto mb-4" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading cleansing entries...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-0 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-800 p-4 sm:p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-ai-dots opacity-20" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center text-2xl sm:text-3xl font-display font-bold text-white md:text-4xl">
                <RiBrushLine className="mr-3 text-teal-200" />
                {t('cleansing.title')}
              </h1>
              <p className="max-w-3xl text-sm text-white/75 md:text-base">
                Manage cleansing records with clearer visibility, fast scan cards, and full process workflow context.
              </p>
              <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${
                selectedProject
                  ? 'border-teal-200/40 bg-teal-200/10 text-teal-50'
                  : 'border-emerald-200/40 bg-emerald-200/10 text-emerald-50'
              }`}>
                {selectedProject ? <RiTeamLine className="mr-2" /> : <RiAlertLine className="mr-2" />}
                {selectedProject ? `Project: ${selectedProject.name}` : 'No project selected'}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 lg:mt-0">
              <Button
                variant="primary"
                leftIcon={<RiAddLine />}
                onClick={() => setShowNewRecord(true)}
                className="whitespace-nowrap bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800"
              >
                New Record
              </Button>
              <Button
                variant="outline"
                leftIcon={<RiFileTextLine />}
                className="whitespace-nowrap border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setShowReport(true)}
              >
                Generate Report
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Total Records</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.totalEntries}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Average Score</div>
              <div className="mt-1 text-2xl font-semibold text-teal-100">{stats.avgScore}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Clean Areas</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-100">{stats.cleanAreas}</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Search and Filter Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="space-y-4 border border-secondary-200/60 p-4 md:p-5 dark:border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-200">
              <RiFilter3Line className="mr-2 text-teal-700 dark:text-teal-300" />
              Search & Filter
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                Reset
              </Button>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),170px]">
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t('common.search')} by area, submitter, notes`}
                className="h-11 w-full rounded-xl border border-secondary-200 bg-white py-2.5 pl-10 pr-10 text-sm text-secondary-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-teal-500/20"
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
            <div className="inline-flex h-11 items-center justify-center rounded-xl border border-secondary-200 bg-secondary-50 px-3 text-sm text-secondary-700 dark:border-dark-600 dark:bg-dark-800 dark:text-secondary-200">
              {filteredEntries.length} shown
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Cleansing entries list */}
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
              <Card className="h-full border border-teal-200/60 bg-gradient-to-b from-white to-teal-50/80 p-0 dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
                <div className="border-b border-teal-200/60 bg-gradient-to-r from-teal-100/60 via-teal-50/70 to-white p-4 dark:border-dark-700 dark:from-teal-900/20 dark:via-dark-800 dark:to-dark-900">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <RiCalendarCheckLine className="text-teal-700 dark:text-teal-300 mr-2" />
                      <span className="font-medium text-teal-900 dark:text-teal-200">{entry.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getWorkflowStatusBadge(entry)}
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                    {getCleansingDisplayName(entry)}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary-600 dark:text-secondary-400">
                    <RiMapPinLine className="mr-1" />
                    <span className="ml-1">{entry.project}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getExpirySummary(entry).className}`}>
                      <RiCalendarCheckLine className="mr-1" />
                      {getExpirySummary(entry).text}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 p-4">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide">
                        Cleanliness Score
                      </h4>
                      <span className={`text-lg font-bold ${
                        entry.cleanliness_score >= 90 ? 'text-green-600 dark:text-green-400' :
                        entry.cleanliness_score >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {entry.cleanliness_score}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 dark:bg-dark-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          entry.cleanliness_score >= 90 ? 'bg-green-500' :
                          entry.cleanliness_score >= 75 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${entry.cleanliness_score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-teal-200/60 bg-teal-50/70 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        Status:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.cleaning_status}
                      </p>
                    </div>
                    <div className="rounded-lg border border-teal-200/60 bg-teal-50/70 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        Notes:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {entry.notes || t('common.none')}
                      </p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="rounded-lg border border-teal-200/60 bg-teal-50/70 p-3 dark:border-dark-700 dark:bg-dark-800/70">
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
                            className="h-9 rounded-lg border border-secondary-200 bg-white px-3 text-xs text-secondary-900 outline-none transition [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:border-dark-600 dark:bg-white dark:text-secondary-900 dark:focus:ring-teal-500/20 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetExpiry(entry)}
                            isLoading={!!savingExpiry[entry.id]}
                            leftIcon={<RiCalendarCheckLine />}
                            className="h-9"
                          >
                            Set Expiry
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetExpiryStatus(entry, false)}
                            isLoading={!!updatingExpiryStatus[entry.id]}
                            leftIcon={<RiCloseLine />}
                            className="h-9"
                          >
                            Set Expired
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {canUserViewEntry(entry) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(entry)}
                          rightIcon={<RiArrowRightLine />}
                        >
                          {t('common.viewDetails')}
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
                          onClick={() => handleRenameCleansing(entry)}
                          isLoading={!!renamingCleansing[entry.id]}
                          leftIcon={<RiEditLine />}
                        >
                          Rename
                        </Button>
                      )}
                      {/* Admin delete button */}
                      {user?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteEntry(entry)}
                          leftIcon={<RiDeleteBinLine />}
                          className="border-teal-200 text-teal-700 hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20"
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
          <Card className="border border-teal-200/60 bg-gradient-to-b from-white to-teal-50/80 p-10 text-center dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              <RiBrushLine className="text-3xl" />
            </div>
            {!selectedProject ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Project Selected</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  Please select a project from the sidebar to view and manage cleansing records for that project.
                </p>
              </>
            ) : cleansingEntries.length === 0 ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Cleansing Records Found</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  No cleansing records have been created for <span className="font-semibold">{selectedProject.name}</span> yet.
                  {user?.role === 'admin' && ' Create the first record to get started.'}
                </p>
                {user?.role === 'admin' && (
                  <div className="mt-5">
                    <Button variant="primary" leftIcon={<RiAddLine />} onClick={() => setShowNewRecord(true)}>
                      Create First Record
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Results Found</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  No cleansing records found matching "{searchQuery}" in <span className="font-semibold">{selectedProject.name}</span>.
                  Try adjusting your search terms.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </motion.div>
      
      {/* New Cleansing Record Modal */}
      {showNewRecord && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-teal-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowNewRecord(false)}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-auto rounded-t-2xl border border-teal-200/40 bg-gradient-to-b from-white to-teal-50/90 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-teal-200/60 bg-gradient-to-r from-teal-800 to-emerald-800 px-4 py-3 text-white dark:border-dark-700">
                <div className="text-sm font-semibold">New Cleansing Record</div>
                <Button variant="ghost" size="sm" onClick={() => setShowNewRecord(false)} leftIcon={<RiCloseLine />}>
                  Close
                </Button>
              </div>
              <div className="max-h-[calc(95dvh-56px)] overflow-y-auto sm:max-h-[calc(92vh-56px)]">
                <DailyCleaningInspectionTemplate
                  onClose={() => setShowNewRecord(false)}
                  onSave={handleCreateRecord}
                />
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
      
      {/* Entry Details Dialog */}
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={t('cleansing.entryDetails', 'Cleansing Record Details')}
        className="w-full max-w-5xl border border-secondary-200/80 bg-white/95 shadow-2xl dark:border-dark-700 dark:bg-dark-900/95"
        disablePadding
      >
        {selectedCleansingEntry && (
          <div className="max-h-[80vh] space-y-5 overflow-y-auto p-5">
            <div className="flex items-center justify-between rounded-xl border border-secondary-200 bg-secondary-50 p-3 dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-lg font-bold text-teal-900 dark:text-teal-300">
                <RiCalendarCheckLine className="mr-2 text-teal-600 dark:text-teal-400" />
                {selectedCleansingEntry.date}
              </div>
              <div className="px-3 py-1 bg-white dark:bg-dark-800 rounded-full text-sm font-medium text-secondary-700 dark:text-secondary-300 shadow-sm">
                {selectedCleansingEntry.project}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiUserLine className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Submitter</span>
                </div>
                <div className="font-medium">{selectedCleansingEntry.submitter}</div>
              </div>
              
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiMapPinLine className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Area</span>
                </div>
                <div className="font-medium">{selectedCleansingEntry.area}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiTaskLine className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Cleaning Status</span>
                </div>
                <div className="font-medium">{selectedCleansingEntry.cleaning_status}</div>
              </div>
              
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiPercentLine className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Cleanliness Score</span>
                </div>
                <div className={`font-bold ${
                  selectedCleansingEntry.cleanliness_score >= 90 ? 'text-green-600 dark:text-green-400' :
                  selectedCleansingEntry.cleanliness_score >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {selectedCleansingEntry.cleanliness_score}%
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiFileTextLine className="mr-2 text-teal-600 dark:text-teal-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Notes</span>
              </div>
              <div className="whitespace-pre-line">{selectedCleansingEntry.notes || t('common.none')}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedCleansingEntry.cleansing_workflow_nodes && selectedCleansingEntry.cleansing_workflow_nodes.length > 0 && (
              <div className="rounded-xl border border-secondary-200 bg-secondary-50/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiFlowChart className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedCleansingEntry.cleansing_workflow_nodes
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
                            {node.status === 'completed' ? <RiCheckLine /> :
                             node.status === 'pending' ? <RiNotificationLine /> :
                             node.status === 'rejected' ? <RiCloseLine /> :
                             <RiSettings4Line />}
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
                            node.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            node.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            node.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                          </span>
                          {user?.role === 'admin' && canSendNodeReminder(node) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNodeReminder(selectedCleansingEntry, node)}
                              isLoading={!!sendingNodeReminder[`${selectedCleansingEntry.id}-${node.node_order}`]}
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
            {selectedCleansingEntry.cleansing_comments && selectedCleansingEntry.cleansing_comments.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiNotificationLine className="mr-2 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                </div>
                
                <div className="space-y-3">
                  {selectedCleansingEntry.cleansing_comments
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
                    {t('common.export')}
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiPrinterLine />}
                    className="text-secondary-400 hover:text-white hover:bg-white/5"
                  >
                    {t('common.print')}
                  </Button>
                  
                  {/* Admin delete button */}
                  {user?.role === 'admin' && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      leftIcon={<RiDeleteBinLine />}
                      onClick={() => {
                        setShowDetails(false);
                        handleDeleteEntry(selectedCleansingEntry);
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
                    {t('common.close')}
                  </Button>

                  {/* History Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDetails(false);
                      handleViewHistory(selectedCleansingEntry);
                    }}
                    leftIcon={<RiHistoryLine />}
                    className="border-white/10 hover:bg-white/5"
                  >
                    History
                  </Button>

                  {/* View/Edit Form Button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    leftIcon={canUserUpdateForm(selectedCleansingEntry) ? <RiFileWarningLine /> : <RiFileListLine />}
                    onClick={() => {
                      setShowDetails(false);
                      handleViewForm(selectedCleansingEntry);
                    }}
                    className="hover:bg-white/5"
                  >
                    {canUserUpdateForm(selectedCleansingEntry) ? 'Edit Form' : 'View Form'}
                  </Button>

                  {/* Workflow Action Buttons */}
                  {(selectedCleansingEntry.status === 'pending' || selectedCleansingEntry.status === 'rejected') && (
                    <>
                      {/* Send Back (if applicable) */}
                      {canUserApproveEntry(selectedCleansingEntry) && selectedCleansingEntry.current_node_index > 0 && (
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
                      {canUserApproveEntry(selectedCleansingEntry) && (
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
                      {canUserApproveEntry(selectedCleansingEntry) && (
                        <Button 
                          variant="primary"
                          size="sm"
                          leftIcon={<RiCheckLine />}
                          onClick={() => handleWorkflowAction('approve')}
                          className="bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white border-none shadow-lg shadow-teal-700/20"
                        >
                          {selectedCleansingEntry.current_node_index === 1 ? 'Complete' : 'Approve'}
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
      
      {/* Process Flow Configuration Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-teal-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={handleCancelProcessFlow}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-hidden rounded-t-2xl border border-teal-200/40 bg-gradient-to-b from-white to-teal-50/90 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-7xl sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-20 border-b border-teal-200/60 bg-gradient-to-r from-teal-800 to-emerald-800 px-6 py-5 text-white dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-bold flex items-center">
                      <RiFlowChart className="mr-3" />
                      Process Configuration
                    </h2>
                    <p className="text-teal-100 mt-1">
                      Configure the workflow process for this cleansing record before saving.
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={handleCancelProcessFlow}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <RiCloseLine className="text-xl" />
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="max-h-[calc(95dvh-78px)] overflow-y-auto p-6 sm:max-h-[calc(92vh-86px)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel - Flow chart */}
                  <div className="lg:col-span-5">
                    <Card className="p-4 h-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-secondary-900 dark:text-white">Process Flow</h3>
                        <Button 
                          variant="primary" 
                          size="sm"
                          leftIcon={<RiAddLine />}
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
                      <div className="mb-4 rounded-lg border border-secondary-200 p-3 dark:border-dark-700">
                        <h4 className="mb-3 text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                          Cleansing Setup
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            label="Cleansing Entry Name"
                            value={pendingCleansingName}
                            onChange={(e) => setPendingCleansingName(e.target.value)}
                            placeholder={selectedProject?.name || 'Enter cleansing entry name'}
                            className="bg-white border border-secondary-200 dark:border-dark-600 dark:bg-dark-800"
                          />
                          <div>
                            <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              Expiry Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={pendingCleansingExpiry}
                              onChange={(e) => setPendingCleansingExpiry(e.target.value)}
                              min={formatDateTimeLocal(new Date())}
                              className="input w-full border border-secondary-200 bg-white text-secondary-900 dark:border-dark-600 dark:bg-dark-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                      
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
                            className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10"
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
                                              className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-3 py-1 rounded-full flex items-center text-sm"
                                            >
                                              <span className="mr-2">{cc.name}</span>
                                              <button
                                                type="button"
                                                className="text-teal-500 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-200"
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
                                  
                                  {selectedNode.ccRecipients && selectedNode.ccRecipients.length > 0 && (
                                    <div className="text-xs text-secondary-500 dark:text-secondary-400 flex items-center">
                                      <RiTeamLine className="mr-1" />
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
                <div className="sticky bottom-0 mt-6 flex items-center justify-between border-t border-teal-200/60 bg-white/95 pt-6 backdrop-blur-sm dark:border-dark-700 dark:bg-dark-900/95">
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
                      className="bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800"
                    >
                      Save Cleansing Record
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
      {showFormView && selectedCleansingEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-teal-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowFormView(false)}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-auto rounded-t-2xl border border-teal-200/40 bg-gradient-to-b from-white to-teal-50/90 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DailyCleaningInspectionTemplate
                onClose={() => setShowFormView(false)}
                onSave={handleFormUpdate}
                initialData={selectedCleansingEntry.form_data}
                isEditMode={canUserEditEntry(selectedCleansingEntry) || canUserUpdateForm(selectedCleansingEntry)}
                readOnly={!canUserEditEntry(selectedCleansingEntry) && !canUserUpdateForm(selectedCleansingEntry)}
                title={`${
                  canUserEditEntry(selectedCleansingEntry) ? 'Edit' : 
                  canUserUpdateForm(selectedCleansingEntry) ? 'Update' : 
                  'View'
                } Cleansing Record - ${selectedCleansingEntry.date}`}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      {/* History Dialog */}
      <Dialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={t('cleansing.history') || 'Update History'}
        size="lg"
      >
        {loadingHistory ? (
            <div className="flex justify-center p-8">
              <RiLoader4Line className="animate-spin text-3xl text-teal-600" />
            </div>
         ) : (
           <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
             {historyData.length === 0 ? (
               <p className="text-center text-gray-500 py-8">No history available for this entry.</p>
             ) : (
               historyData.map((history) => (
                 <div key={history.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center">
                       <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mr-3">
                         <RiUserLine />
                       </div>
                       <div>
                         <div className="font-semibold text-secondary-900 dark:text-white">
                           {history.performed_by || history.users?.name || 'Unknown User'}
                         </div>
                         <div className="text-xs text-secondary-500 dark:text-secondary-400">
                           {history.action || history.users?.email}
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-medium text-secondary-900 dark:text-white">
                         {new Date(history.timestamp || history.changed_at || '').toLocaleDateString()}
                       </div>
                       <div className="text-xs text-secondary-500 dark:text-secondary-400">
                         {new Date(history.timestamp || history.changed_at || '').toLocaleTimeString()}
                       </div>
                     </div>
                   </div>
                   
                   {/* Summary of changes if available */}
                   <div className="mb-4 space-y-2 bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-700">
                     <div className="text-sm text-secondary-700 dark:text-secondary-300">
                       <span className="font-medium text-secondary-500 dark:text-secondary-400">Changes: </span>
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
                         className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-teal-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => {
              setShowHistoryForm(false);
              setShowHistory(true);
            }}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-auto rounded-t-2xl border border-teal-200/40 bg-gradient-to-b from-white to-teal-50/90 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DailyCleaningInspectionTemplate
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
        title="Cleansing Records Full Report"
        subtitle="Comprehensive report for currently listed cleansing records."
        downloadLabel="Download PDF"
        onDownload={handleDownloadReportPdf}
        isDownloading={isDownloadingReport}
        contentRef={reportContentRef}
        maxWidthClassName="max-w-[1700px]"
        theme={{
          headerGradient: 'from-teal-800 to-emerald-700',
          bodyBackground: 'bg-[#ecfeff]/70 dark:bg-dark-800/20'
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
              label: 'Avg Score',
              value: reportRows.length
                ? `${Math.round(reportRows.reduce((sum, row) => sum + Number(row.cleanliness_score || 0), 0) / reportRows.length)}%`
                : '0%'
            }
          ]}
          reportHighlights={reportHighlights}
          statusChartTitle="Status Distribution"
          trendChartTitle="Records Over Time"
          contributorChartTitle="Top Submitters"
          weatherChartTitle="Area Distribution"
          statusChartData={statusChartData}
          trendChartData={trendChartData}
          contributorChartData={contributorChartData}
          weatherChartData={areaChartData}
          chartOptions={chartOptions}
          issueSectionTitle="Notes / Observations"
          issueColumns={[
            { key: 'date', label: 'Date' },
            { key: 'submitter', label: 'Submitter' },
            { key: 'area', label: 'Area' },
            { key: 'notes', label: 'Notes' }
          ]}
          issueRows={issueRows}
          issueEmptyText="No notes/observations found in the currently listed records."
          listSectionTitle="Full Cleansing Records List"
          listColumns={[
            { key: 'date', label: 'Date' },
            { key: 'project', label: 'Project' },
            { key: 'submitter', label: 'Submitter' },
            { key: 'area', label: 'Area' },
            { key: 'cleanliness_score', label: 'Score' },
            { key: 'cleaning_status', label: 'Cleaning Status' },
            { key: 'status', label: 'Workflow Status' },
            { key: 'notes', label: 'Notes' }
          ]}
          listRows={reportRows}
          theme={{
            cardBorder: 'border-[#99f6e4] dark:border-dark-700',
            cardSurface: 'bg-[#f0fdfa] dark:bg-dark-800',
            accentText: 'text-[#0f766e]',
            numberText: 'text-[#134e4a] dark:text-[#99f6e4]'
          }}
        />
      </ReportModal>
    </div>
  );
};

export default CleansingPage;
