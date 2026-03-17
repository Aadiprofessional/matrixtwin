import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { RiAddLine, RiGroupLine, RiCalendarCheckLine, RiTimeLine, RiFileListLine, RiUserLine, RiCheckLine, RiCloseLine, RiFilter3Line, RiArrowLeftLine, RiArrowRightLine, RiFlowChart, RiNotificationLine, RiTeamLine, RiPercentLine, RiErrorWarningLine, RiTaskLine, RiDeleteBinLine, RiEditLine, RiDownload2Line, RiPrinterLine, RiMoreLine, RiChat3Line, RiHistoryLine, RiLoader4Line, RiSearchLine, RiBuilding4Line, RiAlertLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { projectService } from '../services/projectService';
import { MonthlyReturnTemplate } from '../components/forms/MonthlyReturnTemplate';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';
import { PeopleSelectorModal } from '../components/ui/PeopleSelectorModal';
import { ReportModal } from '../components/common/ReportModal';
import { FullReportContent } from '../components/common/FullReportContent';
import { exportReportElementToSinglePagePdf } from '../utils/pdfUtils';
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
  // Keep these for compatibility if backend differs or for other uses
  action?: string;
  changes?: string;
  performed_by?: string;
  timestamp?: string;
}

interface LabourEntry {
  id: string;
  date: string;
  project: string;
  name?: string;
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
  current_active_node?: string;
  labour_workflow_nodes?: any[];
  labour_assignments?: any[];
  labour_comments?: any[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;
  expires_at?: string;
  expiresAt?: string;
}

const LabourPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected' | 'permanently_rejected'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  // API integration states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>([]);
  const [selectedLabourEntry, setSelectedLabourEntry] = useState<LabourEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFormView, setShowFormView] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  
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
  const [renamingLabour, setRenamingLabour] = useState<Record<string, boolean>>({});

  // Process flow states
  const [showProcessFlow, setShowProcessFlow] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [pendingLabourName, setPendingLabourName] = useState('');
  const [pendingLabourExpiry, setPendingLabourExpiry] = useState('');
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
    { id: 'review', type: 'node', name: 'Labour Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
    { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(null);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleSelectorType, setPeopleSelectorType] = useState<'executor' | 'cc'>('executor');

  const formatDateTimeLocal = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };
  
  // Fetch labour entries on component mount and when project changes
  useEffect(() => {
    if (user?.id) {
      fetchLabourEntries();
      fetchUsers();
    }
  }, [user?.id, selectedProject?.id]);

  // Fetch labour entries from API with project filtering
  const fetchLabourEntries = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const response = await fetch(`https://server.matrixtwin.com/api/labour/list/${user.id}${projectParam}`, {
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
  }, [user, selectedProject?.id]);

  const fetchHistory = async (labourId: string) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${labourId}/history`, {
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
    if (!selectedLabourEntry) return;
    
    if (!window.confirm('Are you sure you want to restore this version? This will create a new history entry with the current state.')) {
      return;
    }

    try {
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${selectedLabourEntry.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ historyId: history.id })
      });

      if (response.ok) {
        alert('Labour entry restored successfully!');
        setShowHistory(false);
        fetchLabourEntries();
        setSelectedLabourEntry(null);
        setShowDetails(false);
      } else {
        const error = await response.json();
        alert(`Failed to restore labour entry: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring labour entry:', error);
      alert('Failed to restore labour entry. Please try again.');
    }
  };

  const handleViewHistory = async (entry: LabourEntry) => {
    setSelectedLabourEntry(entry);
    setShowHistory(true);
    await fetchHistory(entry.id);
  };

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

  const handleCreateReturn = (formData: any) => {
    const sourceDate = formData?.returnDate ? new Date(formData.returnDate) : new Date();
    const resolvedDate = Number.isNaN(sourceDate.getTime()) ? new Date() : sourceDate;
    const formattedDate = resolvedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
    const defaultName = `Labour Sheet - ${selectedProject?.name || 'Project'} - ${formattedDate}`;
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 10);

    setPendingFormData(formData);
    setPendingLabourName(defaultName);
    setPendingLabourExpiry(formatDateTimeLocal(defaultExpiry));
    setShowNewReturn(false);
    setShowProcessFlow(true);
    setSelectedNode(processNodes.find(node => node.type === 'node') || null);
  };

  const handleFinalSave = async () => {
    if (!pendingFormData || !user?.id) return;

    const entryName = pendingLabourName.trim();
    if (!entryName) {
      alert('Please provide a labour entry name.');
      return;
    }

    if (!pendingLabourExpiry) {
      alert('Please select an expiry date and time.');
      return;
    }

    const parsedExpiry = new Date(pendingLabourExpiry);
    if (Number.isNaN(parsedExpiry.getTime())) {
      alert('Please select a valid expiry date and time.');
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

      console.log('Sending labour entry data:', {
        formData: pendingFormData,
        processNodes: processNodesForBackend,
        createdBy: user.id,
        projectId: selectedProject?.id,
        formId: pendingFormData.formNumber,
        name: entryName,
        expiresAt: parsedExpiry.toISOString()
      });

      const response = await fetch('https://server.matrixtwin.com/api/labour/create', {
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
        console.log('Labour entry created successfully:', result);
        
        // Refresh labour entries
        await fetchLabourEntries();
        
        // Reset states
        setShowProcessFlow(false);
        setPendingFormData(null);
        setPendingLabourName('');
        setPendingLabourExpiry('');
        setSelectedNode(null);
        
        // Reset process nodes to default
        setProcessNodes([
          { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
          { id: 'review', type: 'node', name: 'Review & Approval', editAccess: true, ccRecipients: [], settings: {} },
          { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
        ]);
        
        // Show success message
        alert('Labour entry created successfully! Notifications have been sent to assigned users.');
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Failed to create labour entry:', errorData);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        alert(`Failed to create labour entry: ${errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`}`);
      }
    } catch (error) {
      console.error('Error creating labour entry:', error);
      alert('Failed to create labour entry. Please try again.');
    }
  };

  const handleCancelProcessFlow = () => {
    setPendingFormData(null);
    setPendingLabourName('');
    setPendingLabourExpiry('');
    setShowProcessFlow(false);
    setSelectedNode(null);
  };

  const handleViewDetails = async (entry: LabourEntry) => {
    try {
      // Fetch full entry details including workflow and comments
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}`, {
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

  const handleFormUpdate = async (formData: any) => {
    if (!selectedLabourEntry || !user?.id) return;
    
    try {
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${selectedLabourEntry.id}/update`, {
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
        // Refresh labour entries
        await fetchLabourEntries();
        setShowFormView(false);
        alert('Form updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update form: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Failed to update form. Please try again.');
    }
  };

  // Handle workflow actions (approve/reject/back to previous)
  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'back') => {
    if (!selectedLabourEntry || !user?.id) return;

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
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${selectedLabourEntry.id}/update`, {
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
        // Backend handles all email notifications
        
        // Refresh labour entries and entry details
        await fetchLabourEntries();
        await handleViewDetails(selectedLabourEntry);
        
        alert(`Entry ${action}d successfully! Notifications have been sent.`);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} entry: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing entry:`, error);
      alert(`Failed to ${action} entry. Please try again.`);
    }
  };
  
  // Check if user can update form data (current node executor or CC with edit access)
  const canUserUpdateForm = (entry: LabourEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected
    if (entry.status === 'permanently_rejected') {
      return false;
    }
    
    // Admin can always edit
    if (user.role === 'admin') return true;
    
    // Check if user is the executor for current workflow node
    const currentNode = entry.labour_workflow_nodes?.find((node: any) => 
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
          const isCC = entry.labour_assignments?.some((a: any) => 
            a.user_id === user.id && a.node_id === currentNode.node_id
          );
          if (isCC) return true;
        }
      }
    }
    
    return false;
  };

  // Check if user can approve/reject current workflow step (only executor)
  const canUserApproveEntry = (entry: LabourEntry) => {
    if (!user?.id) return false;
    
    // Check if entry is permanently rejected or completed
    if (entry.status === 'permanently_rejected' || entry.status === 'completed') {
      return false;
    }
    
    // Admin can always approve
    if (user.role === 'admin') return true;
    
    // Check if user is the executor for current workflow node
    const currentNode = entry.labour_workflow_nodes?.find((node: any) => 
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
  const canUserViewEntry = (entry: LabourEntry) => {
    if (!user?.id) return false;
    
    // Admin can always view
    if (user.role === 'admin') return true;
    
    // Creator can view
    if (entry.created_by === user.id) return true;
    
    // Assigned users (CC) can view
    if (entry.labour_assignments?.some((a: any) => a.user_id === user.id)) return true;
    
    // Executors can view
    if (entry.labour_workflow_nodes?.some((node: any) => node.executor_id === user.id)) return true;
    
    return false;
  };
  
  // Delete labour entry (admin only)
  const handleDeleteEntry = async (entry: LabourEntry) => {
    if (!user?.id || user.role !== 'admin') {
      alert('Only admins can delete labour entries.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete this labour entry from ${entry.date}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Refresh labour entries
        await fetchLabourEntries();
        alert('Labour entry deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete labour entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting labour entry:', error);
      alert('Failed to delete labour entry. Please try again.');
    }
  };

  const handleSetExpiry = async (entry: LabourEntry) => {
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
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}/expiry`, {
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
        await fetchLabourEntries();
        if (selectedLabourEntry?.id === entry.id) {
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

  const handleSetExpiryStatus = async (entry: LabourEntry, nextActive: boolean) => {
    if (!user?.id || user.role !== 'admin') return;
    try {
      setUpdatingExpiryStatus((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}/expiry-status`, {
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
        alert(nextActive ? 'Labour entry reactivated.' : 'Labour entry marked as expired.');
        await fetchLabourEntries();
        if (selectedLabourEntry?.id === entry.id) {
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

  const handleNodeReminder = async (entry: LabourEntry, node: any) => {
    if (!user?.id || user.role !== 'admin') return;
    const defaultMessage = `Reminder: Please action "${node.node_name}" step.`;
    const messageInput = prompt('Enter reminder message for this step:', defaultMessage);
    if (messageInput === null) return;
    const message = messageInput.trim() || defaultMessage;
    const reminderKey = `${entry.id}-${node.node_order}`;
    try {
      setSendingNodeReminder((prev) => ({ ...prev, [reminderKey]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}/nodes/${node.node_order}/delay-notify`, {
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

  const handleRenameLabour = async (entry: LabourEntry) => {
    if (!user?.id || user.role !== 'admin') return;
    const currentName = getLabourDisplayName(entry);
    const nextNamePrompt = prompt('Enter new labour form name:', currentName);
    if (nextNamePrompt === null) return;
    const nextName = nextNamePrompt.trim();
    if (!nextName) {
      alert('Name cannot be empty.');
      return;
    }
    if (nextName === currentName) return;
    try {
      setRenamingLabour((prev) => ({ ...prev, [entry.id]: true }));
      const response = await fetch(`https://server.matrixtwin.com/api/labour/${entry.id}/name`, {
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
        alert('Labour form renamed successfully.');
        await fetchLabourEntries();
        if (selectedLabourEntry?.id === entry.id) {
          await handleViewDetails(entry);
        }
      } else {
        const error = await response.json();
        alert(`Failed to rename labour form: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error renaming labour form:', error);
      alert('Failed to rename labour form. Please try again.');
    } finally {
      setRenamingLabour((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const getWorkflowStatusBadge = (entry: LabourEntry) => {
    const statusColors = {
      pending: 'bg-[#d8dee5] text-[#2f3740] dark:bg-[#4a5663]/40 dark:text-[#d2d9e0]',
      in_progress: 'bg-[#c5cdd6] text-[#2f3740] dark:bg-[#4a5663]/40 dark:text-[#d2d9e0]',
      completed: 'bg-[#b7c0ca] text-[#2a3138] dark:bg-[#586473]/50 dark:text-[#e2e7ed]',
      rejected: 'bg-[#8d99a8] text-white dark:bg-[#7d8998]/60 dark:text-[#f3f5f7]',
      permanently_rejected: 'bg-[#5a6470] text-white dark:bg-[#5a6470]/80 dark:text-[#f3f5f7]'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[entry.status as keyof typeof statusColors] || statusColors.pending}`}>
        {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1) || 'Pending'}
      </span>
    );
  };

  // Handle URL query parameters to open specific form
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && labourEntries.length > 0) {
      const entry = labourEntries.find(e => e.id === id);
      if (entry) {
        handleViewDetails(entry);
      }
    }
  }, [location.search, labourEntries]);

  const stats = useMemo(() => {
    const totalHours = labourEntries.reduce((total, entry) => total + (entry.hours_worked || 0), 0);
    const totalWorkers = labourEntries.reduce((total, entry) => total + (entry.worker_count || 0), 0);
    const thisWeekEntries = labourEntries.filter(entry => {
      const createdAt = new Date(entry.date);
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return createdAt >= weekAgo && createdAt <= now;
    }).length;

    return {
      totalEntries: labourEntries.length,
      thisWeekEntries,
      pendingEntries: labourEntries.filter(entry => entry.status === 'pending').length,
      completedEntries: labourEntries.filter(entry => entry.status === 'completed').length,
      totalWorkers,
      totalHours
    };
  }, [labourEntries]);

  const statusCounts = useMemo(() => ({
    all: labourEntries.length,
    pending: labourEntries.filter(entry => entry.status === 'pending').length,
    completed: labourEntries.filter(entry => entry.status === 'completed').length,
    rejected: labourEntries.filter(entry => entry.status === 'rejected').length,
    permanently_rejected: labourEntries.filter(entry => entry.status === 'permanently_rejected').length
  }), [labourEntries]);

  const getDefaultExpiryDate = (entry: LabourEntry) => {
    const baseDate = new Date(entry.created_at || entry.date);
    const resolvedBaseDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const defaultExpiryDate = new Date(resolvedBaseDate);
    defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 10);
    return defaultExpiryDate;
  };

  const getEntryExpiryDate = (entry: LabourEntry) => {
    const expirySource = entry.expires_at || entry.expiresAt;
    const parsedExpiry = expirySource ? new Date(expirySource) : getDefaultExpiryDate(entry);
    return Number.isNaN(parsedExpiry.getTime()) ? getDefaultExpiryDate(entry) : parsedExpiry;
  };

  const isEntryExpired = (entry: LabourEntry) => {
    return entry.active === false || getEntryExpiryDate(entry).getTime() <= Date.now();
  };

  const getLabourDisplayName = (entry: LabourEntry) => {
    const preferredName = (entry.name || entry.project || '').trim();
    if (!preferredName || preferredName.toLowerCase() === 'unknown project') {
      return 'New Labour';
    }
    return preferredName;
  };

  const getExpirySummary = (entry: LabourEntry) => {
    const expiryDate = getEntryExpiryDate(entry);
    const now = new Date();
    const msLeft = expiryDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    if (isEntryExpired(entry)) {
      const daysOverdue = Math.max(1, Math.abs(daysLeft));
      return {
        text: `Expired ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago`,
        className: 'bg-[#d2d9e0] text-[#4a5663] dark:bg-[#3a4350]/50 dark:text-[#c5cdd6]'
      };
    }

    return {
      text: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      className: 'bg-[#e2e7ed] text-[#4a5663] dark:bg-[#3a4350]/40 dark:text-[#c5cdd6]'
    };
  };

  const canSendNodeReminder = (node: any) => {
    const nodeName = String(node?.node_name || node?.name || '').toLowerCase();
    return nodeName !== 'start' && nodeName !== 'complete';
  };

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const baseFiltered = labourEntries.filter(entry => {
      const matchesSearch = !query ||
        getLabourDisplayName(entry).toLowerCase().includes(query) ||
        entry.submitter.toLowerCase().includes(query) ||
        entry.trade_type.toLowerCase().includes(query) ||
        entry.work_description.toLowerCase().includes(query) ||
        entry.date.includes(query);
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return [...baseFiltered].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return sortBy === 'newest'
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [labourEntries, searchQuery, statusFilter, sortBy]);

  const reportRows = useMemo(() => (
    filteredEntries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      project: entry.project,
      submitter: entry.submitter,
      labour_type: entry.labour_type || '-',
      trade_type: entry.trade_type || '-',
      worker_count: entry.worker_count || 0,
      hours_worked: entry.hours_worked || 0,
      status: entry.status || 'pending',
      work_description: entry.work_description || '-',
      notes: entry.notes || '-'
    }))
  ), [filteredEntries]);

  const reportHighlights = useMemo(() => {
    const topTrade = Object.entries(
      reportRows.reduce<Record<string, number>>((acc, row) => {
        const key = row.trade_type || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];
    return [
      `Total filtered returns: ${reportRows.length}`,
      `Total workers in filtered returns: ${reportRows.reduce((sum, row) => sum + Number(row.worker_count || 0), 0)}`,
      `Total worked hours in filtered returns: ${reportRows.reduce((sum, row) => sum + Number(row.hours_worked || 0), 0)}`,
      `Most frequent trade type: ${topTrade ? `${topTrade[0]} (${topTrade[1]})` : 'N/A'}`
    ];
  }, [reportRows]);

  const reportStatusCounts = useMemo(() => ({
    pending: reportRows.filter((row) => row.status === 'pending').length,
    completed: reportRows.filter((row) => row.status === 'completed').length,
    rejected: reportRows.filter((row) => row.status === 'rejected').length,
    permanentlyRejected: reportRows.filter((row) => row.status === 'permanently_rejected').length
  }), [reportRows]);

  const statusChartData = useMemo(() => ({
    labels: ['Pending', 'Completed', 'Rejected', 'Permanently Rejected'],
    datasets: [
      {
        data: [
          reportStatusCounts.pending,
          reportStatusCounts.completed,
          reportStatusCounts.rejected,
          reportStatusCounts.permanentlyRejected
        ],
        backgroundColor: ['#94a3b8', '#64748b', '#475569', '#334155'],
        borderColor: ['#cbd5e1', '#94a3b8', '#64748b', '#475569'],
        borderWidth: 1
      }
    ]
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
        label: 'Labour Returns',
        data: labels.map((label) => map[label]),
        borderColor: '#475569',
        backgroundColor: 'rgba(71, 85, 105, 0.2)',
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
        label: 'Entries',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#64748b'
      }]
    };
  }, [reportRows]);

  const tradeChartData = useMemo(() => {
    const map = reportRows.reduce<Record<string, number>>((acc, row) => {
      const key = row.trade_type || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([trade]) => trade),
      datasets: [{
        label: 'Count',
        data: sorted.map(([, count]) => count),
        backgroundColor: '#334155'
      }]
    };
  }, [reportRows]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#334155' } } },
    scales: {
      x: { ticks: { color: '#475569' }, grid: { color: 'rgba(100, 116, 139, 0.2)' } },
      y: { ticks: { color: '#475569', precision: 0 }, grid: { color: 'rgba(100, 116, 139, 0.2)' } }
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
        `labour-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } finally {
      setIsDownloadingReport(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <RiLoader4Line className="mx-auto mb-4 animate-spin text-4xl text-[#6b7785]" />
          <p className="text-secondary-600 dark:text-secondary-400">Loading labour entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-0 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2f3740] via-[#4a5663] to-[#6b7785] p-4 sm:p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-ai-dots opacity-20" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="flex items-center text-2xl sm:text-3xl font-display font-bold text-white md:text-4xl">
                <RiGroupLine className="mr-3 text-[#d2d9e0]" />
                {t('labour.title')}
              </h1>
              <p className="max-w-3xl text-sm text-white/75 md:text-base">
                Manage labour returns with faster scanning, clear workflow visibility, and complete project context.
              </p>
              <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${
                selectedProject
                  ? 'border-[#d2d9e0]/40 bg-[#d2d9e0]/10 text-[#edf1f5]'
                  : 'border-[#b7c0ca]/40 bg-[#7b8694]/20 text-[#e2e7ed]'
              }`}>
                {selectedProject ? <RiBuilding4Line className="mr-2" /> : <RiAlertLine className="mr-2" />}
                {selectedProject ? `Project: ${selectedProject.name}` : 'No project selected'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {user?.role === 'admin' && selectedProject && (
                <Button
                  variant="primary"
                  leftIcon={<RiAddLine />}
                  onClick={() => setShowNewReturn(true)}
                  className="whitespace-nowrap"
                  animated
                >
                  New Return
                </Button>
              )}
              <Button variant="outline" leftIcon={<RiFileListLine />} onClick={() => setShowReport(true)} className="whitespace-nowrap">
                Generate Report
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Total</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.totalEntries}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">This Week</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.thisWeekEntries}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Pending</div>
              <div className="mt-1 text-2xl font-semibold text-[#e2e7ed]">{stats.pendingEntries}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Completed</div>
              <div className="mt-1 text-2xl font-semibold text-[#d2d9e0]">{stats.completedEntries}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wide text-white/70">Total Hours</div>
              <div className="mt-1 text-2xl font-semibold text-white">{stats.totalHours}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="space-y-4 border border-secondary-200/60 p-4 md:p-5 dark:border-dark-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-semibold text-secondary-800 dark:text-secondary-200">
              <RiFilter3Line className="mr-2 text-[#5a6470] dark:text-[#c5cdd6]" />
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
                placeholder="Search by project, submitter, trade, or work"
                className="h-11 w-full rounded-xl border border-secondary-200 bg-white py-2.5 pl-10 pr-10 text-sm text-secondary-900 outline-none transition focus:border-[#7b8694] focus:ring-2 focus:ring-[#d2d9e0] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#7b8694]/30"
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
              className="h-11 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-900 outline-none transition focus:border-[#7b8694] focus:ring-2 focus:ring-[#d2d9e0] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#7b8694]/30"
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
              className="h-11 rounded-xl border border-secondary-200 bg-white px-3 text-sm text-secondary-900 outline-none transition focus:border-[#7b8694] focus:ring-2 focus:ring-[#d2d9e0] dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:focus:ring-[#7b8694]/30"
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
                    ? 'border-[#5a6470] bg-[#5a6470] text-white shadow-sm'
                    : 'border-secondary-200 bg-white text-secondary-700 hover:border-[#b7c0ca] hover:text-[#4a5663] dark:border-dark-600 dark:bg-dark-800 dark:text-secondary-300 dark:hover:border-[#7b8694]/40'
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
              <RiFileListLine className="mr-1.5" />
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
                <Card className="h-full border border-[#c5cdd6]/70 bg-gradient-to-b from-white to-[#eef1f4]/80 p-0 dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
                  <div className="border-b border-[#c5cdd6]/70 bg-gradient-to-r from-[#e2e7ed]/70 via-[#eef1f4]/70 to-white p-4 dark:border-dark-700 dark:from-[#3a4350]/40 dark:via-dark-800 dark:to-dark-900">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-300">
                          <RiCalendarCheckLine className="mr-2 text-[#5a6470] dark:text-[#c5cdd6]" />
                          {entry.date}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-secondary-900 dark:text-white">
                          {getLabourDisplayName(entry)}
                        </h3>
                      </div>
                      {getWorkflowStatusBadge(entry)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary-600 dark:text-secondary-300">
                      <span className="inline-flex items-center">
                        <RiUserLine className="mr-1" />
                        {entry.submitter}
                      </span>
                      <span className="inline-flex items-center">
                        <RiTimeLine className="mr-1" />
                        {entry.hours_worked} hrs
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getExpirySummary(entry).className}`}>
                        <RiTimeLine className="mr-1" />
                        {getExpirySummary(entry).text}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-[#c5cdd6]/60 bg-[#eef1f4]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                        <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                          Workers
                        </div>
                        <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-300">
                          {entry.worker_count}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#c5cdd6]/60 bg-[#eef1f4]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                        <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                          Trade
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                          {entry.trade_type || 'General Labour'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#c5cdd6]/60 bg-white/90 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                      <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        Work Description
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                        {entry.work_description || 'No description'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#c5cdd6]/60 bg-white/90 p-3 dark:border-dark-700 dark:bg-dark-800/70">
                      <div className="text-xs font-medium uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        Notes
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-secondary-700 dark:text-secondary-300">
                        {entry.notes || t('common.none')}
                      </p>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="rounded-lg border border-[#c5cdd6]/60 bg-[#eef1f4]/80 p-3 dark:border-dark-700 dark:bg-dark-800/70">
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
                              value={expiryDrafts[entry.id] || ''}
                              onChange={(e) => setExpiryDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                              className="h-9 rounded-lg border border-secondary-200 bg-white px-3 text-xs text-secondary-900 outline-none transition [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:border-dark-600 dark:bg-white dark:text-secondary-900 dark:focus:ring-[#7b8694]/20 focus:border-[#7b8694] focus:ring-2 focus:ring-[#d2d9e0]"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetExpiry(entry)}
                              isLoading={!!savingExpiry[entry.id]}
                              leftIcon={<RiCalendarCheckLine className="text-[#4a5663] dark:text-[#c5cdd6]" />}
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
                          onClick={() => handleRenameLabour(entry)}
                          isLoading={!!renamingLabour[entry.id]}
                          leftIcon={<RiEditLine />}
                          className="border-[#a8b2be] text-[#4a5663] hover:border-[#7b8694] hover:bg-[#eef1f4] dark:hover:bg-[#3a4350]/30"
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
                          className="border-[#a8b2be] text-[#4a5663] hover:border-[#7b8694] hover:bg-[#eef1f4] dark:hover:bg-[#3a4350]/30"
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
          <Card className="border border-[#c5cdd6]/70 bg-gradient-to-b from-white to-[#eef1f4]/80 p-10 text-center dark:border-dark-700 dark:from-dark-900 dark:to-dark-800/80">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d2d9e0] text-[#5a6470] dark:bg-[#3a4350]/50 dark:text-[#c5cdd6]">
              <RiGroupLine className="text-3xl" />
            </div>
            {!selectedProject ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Project Selected</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  Select a project to view and manage labour returns in one place.
                </p>
              </>
            ) : labourEntries.length === 0 ? (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Labour Returns Yet</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  {selectedProject.name} has no labour returns yet. Start by creating your first return.
                </p>
                {user?.role === 'admin' && (
                  <div className="mt-5">
                    <Button variant="primary" leftIcon={<RiAddLine />} onClick={() => setShowNewReturn(true)}>
                      Create First Return
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold text-secondary-900 dark:text-white">No Results Found</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-secondary-600 dark:text-secondary-400">
                  No labour returns match the current search or filter criteria.
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

      {showNewReturn && (
        <AnimatePresence>
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#2f3740]/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowNewReturn(false)}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-hidden rounded-t-2xl border border-[#c5cdd6]/70 bg-gradient-to-b from-white to-[#eef1f4]/90 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
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

      {/* Process Flow Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-hidden rounded-t-2xl border border-primary-200/70 bg-gradient-to-b from-white to-primary-50/40 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-7xl sm:rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-20 border-b border-primary-200/70 bg-gradient-to-r from-slate-900 to-primary-900 px-4 py-4 text-white dark:border-dark-700 sm:px-6 sm:py-5">
                <div className="mb-0 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Configure Process Flow</h2>
                    <p className="mt-1 text-primary-100">
                      Set up the approval workflow for this labour return
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    leftIcon={<RiAddLine />}
                    onClick={addNewNode}
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    Add Node
                  </Button>
                </div>
              </div>
              <div className="max-h-[calc(95dvh-78px)] overflow-y-auto p-4 sm:max-h-[calc(92vh-86px)] sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left panel - Process flow */}
                  <div className="lg:col-span-5">
                    <Card className="h-full border border-secondary-200/70 p-4 dark:border-dark-700">
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
                    <Card className="h-full border border-secondary-200/70 p-4 dark:border-dark-700">
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">Process Settings</h3>
                      <div className="mb-4 rounded-lg border border-secondary-200 p-3 dark:border-dark-700">
                        <h4 className="mb-3 text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                          Labour Setup
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            label="Labour Entry Name"
                            value={pendingLabourName}
                            onChange={(e) => setPendingLabourName(e.target.value)}
                            placeholder={selectedProject?.name || 'Enter labour entry name'}
                            className="bg-white border border-secondary-200 dark:border-dark-600 dark:bg-secondary-800"
                          />
                          <div>
                            <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                              Expiry Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={pendingLabourExpiry}
                              onChange={(e) => setPendingLabourExpiry(e.target.value)}
                              min={formatDateTimeLocal(new Date())}
                              className="input w-full border border-secondary-200 bg-white text-secondary-900 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white"
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
                                      className="mr-2 rounded border-secondary-300 dark:border-secondary-600"
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
                <div className="sticky bottom-0 mt-6 flex items-center justify-between border-t border-primary-200/70 bg-gradient-to-r from-white/95 to-primary-50/95 pt-6 backdrop-blur-sm dark:border-dark-700 dark:from-dark-900/95 dark:to-dark-800/95">
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
                      className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700"
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
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Labour Return Details"
      >
        {selectedLabourEntry && (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary-900 dark:text-primary-300 flex items-center">
                <RiTeamLine className="mr-2 text-primary-600 dark:text-primary-400" />
                Labour Return - {selectedLabourEntry.date}
              </div>
              <div className="flex items-center space-x-2">
                 <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600">
                    {selectedLabourEntry.project}
                 </span>
                 {getWorkflowStatusBadge(selectedLabourEntry)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiUserLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Submitter</span>
                </div>
                <div className="font-medium">{selectedLabourEntry.submitter}</div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiTeamLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Worker Count</span>
                </div>
                <div className="font-medium">{selectedLabourEntry.worker_count}</div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiTimeLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Hours Worked</span>
                </div>
                <div className="font-medium">{selectedLabourEntry.hours_worked}</div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiPercentLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Trade Type</span>
                </div>
                <div className="font-medium">{selectedLabourEntry.trade_type}</div>
              </div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiTaskLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Work Description</span>
              </div>
              <div className="whitespace-pre-line">{selectedLabourEntry.work_description || 'None'}</div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiErrorWarningLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Labour Type</span>
              </div>
              <div className="whitespace-pre-line">{selectedLabourEntry.labour_type || 'None'}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedLabourEntry.labour_workflow_nodes && selectedLabourEntry.labour_workflow_nodes.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiFlowChart className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedLabourEntry.labour_workflow_nodes
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
                              onClick={() => handleNodeReminder(selectedLabourEntry, node)}
                              isLoading={!!sendingNodeReminder[`${selectedLabourEntry.id}-${node.node_order}`]}
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
            {selectedLabourEntry.labour_comments && selectedLabourEntry.labour_comments.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiChat3Line className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                </div>
                
                <div className="space-y-3">
                  {selectedLabourEntry.labour_comments
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
                                'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
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
                        handleDeleteEntry(selectedLabourEntry);
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

                  {/* History Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiHistoryLine />}
                    onClick={() => {
                      setShowDetails(false);
                      handleViewHistory(selectedLabourEntry);
                    }}
                    className="hover:bg-white/5"
                  >
                    History
                  </Button>

                  {/* View/Edit Form Button */}
                  <Button 
                    variant="outline"
                    size="sm"
                    leftIcon={canUserUpdateForm(selectedLabourEntry) ? <RiEditLine /> : <RiFileListLine />}
                    onClick={() => {
                      setShowDetails(false);
                      setShowFormView(true);
                    }}
                    className="hover:bg-white/5"
                  >
                    {canUserUpdateForm(selectedLabourEntry) ? 'Edit Form' : 'View Form'}
                  </Button>

                  {/* Workflow Action Buttons */}
                  {(selectedLabourEntry.status === 'pending' || selectedLabourEntry.status === 'rejected') && (
                    <>
                      {/* Send Back (if applicable) */}
                      {canUserApproveEntry(selectedLabourEntry) && selectedLabourEntry.current_node_index > 0 && (
                        <Button 
                          variant="outline"
                          size="sm"
                          leftIcon={<RiArrowLeftLine />}
                          onClick={() => handleWorkflowAction('back')}
                          className="text-primary-500 border-primary-500/30 hover:bg-primary-500/10 hover:border-primary-500"
                        >
                          Send Back
                        </Button>
                      )}
                      
                      {/* Reject */}
                      {canUserApproveEntry(selectedLabourEntry) && (
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
                      {canUserApproveEntry(selectedLabourEntry) && (
                        <Button 
                          variant="primary"
                          size="sm"
                          leftIcon={<RiCheckLine />}
                          onClick={() => handleWorkflowAction('approve')}
                          className="border-none bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-700/20 hover:from-primary-700 hover:to-indigo-700"
                        >
                          {selectedLabourEntry.current_node_index === 1 ? 'Complete' : 'Approve'}
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
      {showFormView && selectedLabourEntry && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4"
            onClick={() => setShowFormView(false)}
          >
            <motion.div
              className="h-[95dvh] w-full overflow-hidden rounded-t-2xl border border-primary-200/70 bg-gradient-to-b from-white to-primary-50/40 shadow-2xl dark:border-dark-700 dark:from-dark-900 dark:to-dark-800 sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl"
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

      {/* History Dialog */}
      <Dialog
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title={t('labour.history', 'Update History')}
        size="lg"
      >
        {loadingHistory ? (
            <div className="flex justify-center p-8">
              <RiLoader4Line className="animate-spin text-3xl text-primary-600" />
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
                       <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-3">
                          <RiUserLine />
                        </div>
                        <div>
                          <div className="font-semibold text-primary-900 dark:text-primary-100">
                            {history.performed_by || history.users?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {/* Email not available in HistoryEntry interface, showing action instead */}
                            {history.action || history.users?.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(history.timestamp || history.changed_at || '').toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(history.timestamp || history.changed_at || '').toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary of changes if available */}
                    <div className="mb-4 space-y-2 bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-gray-500 dark:text-gray-400">Changes: </span>
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
                          className="text-primary-600 hover:bg-primary-50 hover:text-primary-700 dark:text-primary-300 dark:hover:bg-primary-500/10 dark:hover:text-primary-200"
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
                          setShowHistory(false); // Close history dialog to show form
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowHistoryForm(false);
              setShowHistory(true); // Reopen history dialog
            }}
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
                onClose={() => {
                  setShowHistoryForm(false);
                  setShowHistory(true); // Reopen history dialog
                }}
                onSave={() => {}} // Read-only for history view
                initialData={selectedHistoryEntry.form_data}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Labour Return Full Report"
        subtitle="Comprehensive report for currently listed labour return entries."
        downloadLabel="Download PDF"
        onDownload={handleDownloadReportPdf}
        isDownloading={isDownloadingReport}
        contentRef={reportContentRef}
        maxWidthClassName="max-w-[1700px]"
        theme={{
          headerGradient: 'from-[#0f172a] to-[#334155]',
          bodyBackground: 'bg-[#f8fafc]/70 dark:bg-dark-800/20'
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
            { label: 'Total Hours', value: reportRows.reduce((sum, row) => sum + Number(row.hours_worked || 0), 0) }
          ]}
          reportHighlights={reportHighlights}
          statusChartTitle="Status Distribution"
          trendChartTitle="Returns Over Time"
          contributorChartTitle="Top Submitters"
          weatherChartTitle="Trade Type Distribution"
          statusChartData={statusChartData}
          trendChartData={trendChartData}
          contributorChartData={contributorChartData}
          weatherChartData={tradeChartData}
          chartOptions={chartOptions}
          issueSectionTitle="Notes / Issues"
          issueColumns={[
            { key: 'date', label: 'Date' },
            { key: 'submitter', label: 'Submitter' },
            { key: 'project', label: 'Project' },
            { key: 'notes', label: 'Notes' }
          ]}
          issueRows={issueRows}
          issueEmptyText="No notes/issues found in the currently listed entries."
          listSectionTitle="Full Labour Return List"
          listColumns={[
            { key: 'date', label: 'Date' },
            { key: 'project', label: 'Project' },
            { key: 'submitter', label: 'Submitter' },
            { key: 'labour_type', label: 'Labour Type' },
            { key: 'trade_type', label: 'Trade Type' },
            { key: 'worker_count', label: 'Workers' },
            { key: 'hours_worked', label: 'Hours' },
            { key: 'status', label: 'Status' },
            { key: 'work_description', label: 'Work Description' },
            { key: 'notes', label: 'Notes' }
          ]}
          listRows={reportRows}
          theme={{
            cardBorder: 'border-[#cbd5e1] dark:border-dark-700',
            cardSurface: 'bg-[#f8fafc] dark:bg-dark-800',
            accentText: 'text-[#334155]',
            numberText: 'text-[#0f172a] dark:text-[#e2e8f0]'
          }}
        />
      </ReportModal>
    </div>
  );
};

export default LabourPage; 
