import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { projectService } from '../services/projectService';
import { createForm, getForms, respondToForm, updateFormStatus, FormResponse } from '../api/forms';
import { UserSelectionModal } from '../components/modals/UserSelectionModal';
import { generateFormPdf } from '../utils/pdfUtils';
import { API_BASE_URL } from '../utils/api';
import ProcessFlowBuilder from '../components/forms/ProcessFlowBuilder';

// Import only the template components we need
import { InspectionCheckFormTemplate } from '../components/forms/InspectionCheckFormTemplate';
import { SurveyCheckFormTemplate } from '../components/forms/SurveyCheckFormTemplate';

// Add interfaces for process flow (similar to diary page)
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
  role?: string;
  avatar_url?: string;
}

// Types
interface RfiItem {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'answered' | 'closed' | 'rejected' | 'completed' | 'permanently_rejected';
  priority: 'low' | 'medium' | 'high';
  responseDate?: string;
  response?: string;
  assignedTo?: string;
  // Add workflow related fields
  current_node_index?: number;
  current_active_node?: string;
  rfi_workflow_nodes?: any[];
  rfi_assignments?: any[];
  rfi_comments?: any[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  form_data?: any;
  form_type?: 'inspection' | 'survey'; // Add form type to distinguish between inspection and survey
  // Add any other fields from FormResponse that we need
  name?: string;
  project_id?: string;
  pdf_url?: string;
  form_assignments?: any[];
}

// People selector modal component (similar to diary page)
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
        user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          className="w-full max-w-md max-h-[80vh] bg-dark-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <RiIcons.RiUserLine className="mr-2" />
              {title}
            </h3>
            <button 
              className="text-secondary-400 hover:text-white transition-colors"
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
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
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

// RFI Page component
const RfiPage: React.FC = () => {
  // State
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formTypeFilter, setFormTypeFilter] = useState<'all' | 'inspection' | 'survey'>('all');
  const [selectedRfi, setSelectedRfi] = useState<RfiItem | null>(null);
  const [showRfiDetails, setShowRfiDetails] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showFormSelector, setShowFormSelector] = useState(false);

  const [inspectionTemplateVisible, setInspectionTemplateVisible] = useState(false);
  const [surveyTemplateVisible, setSurveyTemplateVisible] = useState(false);

  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [generatedPdf, setGeneratedPdf] = useState<File | null>(null);
  const [formData, setFormData] = useState<any>(null);

  // Mock RFI data
  const [rfiItems, setRfiItems] = useState<RfiItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Process flow states (similar to diary page)
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

  useEffect(() => {
    if (selectedProject) {
      loadRfis();
      fetchUsers();
    }
  }, [selectedProject]);

  // Handle URL query parameters to open specific form
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id && rfiItems.length > 0) {
      const item = rfiItems.find(i => i.id === id);
      if (item) {
        setSelectedRfi(item);
        setShowRfiDetails(true);
      }
    }
  }, [location.search, rfiItems]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      if (!selectedProject?.id) return;

      // Use projectService to fetch project members
      const members = await projectService.getProjectMembers(selectedProject.id);
      
      // Map ProjectMember to User interface
      const mappedUsers: User[] = members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        avatar_url: member.user.avatar
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
      setIsLoadingUsers(false);
    }
  };

  // Load RFIs from API - with separate functions for surveys and inspections
  const loadSurveys = async () => {
    try {
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const surveyResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/survey/list/${user?.id}${projectParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (surveyResponse.ok) {
        const surveyData = await surveyResponse.json();
        const transformedSurveys = surveyData.map((survey: any) => ({
          id: survey.id,
          title: `Survey Check - ${survey.project}`,
          description: survey.survey_field || survey.survey || 'Survey check form',
          submittedBy: survey.surveyor || survey.created_by,
          submittedDate: survey.date || survey.created_at,
          status: survey.status || 'pending',
          priority: 'medium' as const,
          form_type: 'survey' as const,
          form_data: survey.form_data || survey,
          current_node_index: survey.current_node_index || 0,
          current_active_node: survey.current_active_node,
          rfi_workflow_nodes: survey.survey_workflow_nodes || [],
          rfi_assignments: survey.survey_assignments || [],
          rfi_comments: survey.survey_comments || [],
          created_by: survey.created_by,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          project_id: survey.project_id,
          name: survey.project
        }));
        return transformedSurveys;
      } else if (surveyResponse.status === 404) {
        console.log('Survey list endpoint not found - this is expected if no surveys exist yet');
        return [];
      } else {
        console.error('Failed to fetch survey entries:', surveyResponse.status);
        return [];
      }
    } catch (surveyError) {
      console.error('Error fetching survey entries:', surveyError);
      return [];
    }
  };

  const loadInspections = async () => {
    try {
      const projectParam = selectedProject?.id ? `?projectId=${selectedProject.id}` : '';
      const inspectionUrl = `${process.env.REACT_APP_API_BASE_URL}/api/inspection/list/${user?.id}${projectParam}`;
      
      console.log('Loading inspections from:', inspectionUrl);
      
      const inspectionResponse = await fetch(inspectionUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Inspection response status:', inspectionResponse.status);

      if (inspectionResponse.ok) {
        const inspectionData = await inspectionResponse.json();
        console.log('Raw inspection data:', inspectionData);
        
        const transformedInspections = inspectionData.map((inspection: any) => ({
          id: inspection.id,
          title: `Inspection Check - ${inspection.project}`,
          description: inspection.works_to_be_inspected || 'Inspection check form',
          submittedBy: inspection.inspector || inspection.created_by,
          submittedDate: inspection.date || inspection.created_at,
          status: inspection.status || 'pending',
          priority: 'medium' as const,
          form_type: 'inspection' as const,
          form_data: inspection.form_data || inspection,
          current_node_index: inspection.current_node_index || 0,
          current_active_node: inspection.current_active_node,
          rfi_workflow_nodes: inspection.inspection_workflow_nodes || [],
          rfi_assignments: inspection.inspection_assignments || [],
          rfi_comments: inspection.inspection_comments || [],
          created_by: inspection.created_by,
          created_at: inspection.created_at,
          updated_at: inspection.updated_at,
          project_id: inspection.project_id,
          name: inspection.project
        }));
        console.log('Transformed inspections:', transformedInspections);
        return transformedInspections;
      } else if (inspectionResponse.status === 404) {
        console.log('Inspection list endpoint not found - this is expected if no inspections exist yet');
        return [];
      } else {
        const errorText = await inspectionResponse.text();
        console.error('Failed to fetch inspection entries:', {
          status: inspectionResponse.status,
          statusText: inspectionResponse.statusText,
          response: errorText
        });
        return [];
      }
    } catch (inspectionError) {
      console.error('Error fetching inspection entries:', inspectionError);
      return [];
    }
  };

  // Load all RFIs (both surveys and inspections)
  const loadRfis = async () => {
    try {
      setLoading(true);
      console.log('Loading RFIs - starting parallel loading of surveys and inspections...');
      
      const [surveys, inspections] = await Promise.all([loadSurveys(), loadInspections()]);
      
      console.log('Loaded surveys:', surveys.length);
      console.log('Loaded inspections:', inspections.length);
      
      const allRfis = [...surveys, ...inspections];
      
      console.log('Total RFIs loaded:', allRfis.length);
      
      // Sort by date (newest first)
      allRfis.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
      
      setRfiItems(allRfis);
    } catch (error) {
      console.error('Error loading RFIs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load only surveys
  const loadSurveysOnly = async () => {
    try {
      setLoading(true);
      const surveys = await loadSurveys();
      surveys.sort((a: RfiItem, b: RfiItem) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
      setRfiItems(surveys);
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load only inspections
  const loadInspectionsOnly = async () => {
    try {
      setLoading(true);
      const inspections = await loadInspections();
      inspections.sort((a: RfiItem, b: RfiItem) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
      setRfiItems(inspections);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter RFIs based on search and status
  const filteredRfis = rfiItems.filter((rfi) => {
    // Status filter
    if (statusFilter !== 'all' && rfi.status !== statusFilter) return false;
    
    // Form Type filter
    if (formTypeFilter !== 'all' && rfi.form_type !== formTypeFilter) return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        rfi.title.toLowerCase().includes(query) ||
        rfi.description.toLowerCase().includes(query) ||
        rfi.submittedBy.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getWorkflowStatusBadge = (rfi: RfiItem) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      answered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      permanently_rejected: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300'
    };
    
    // Get current node completion info
    const currentNode = rfi.rfi_workflow_nodes?.find(
      (node: any) => node.node_order === rfi.current_node_index
    );
    
    let statusText = rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1);
    let completionInfo = '';
    
    if (rfi.status === 'permanently_rejected') {
      statusText = 'Permanently Rejected';
    } else if (currentNode && rfi.status === 'pending') {
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      completionInfo = ` (${completionCount}/${maxCompletions})`;
      
      if (completionCount >= maxCompletions && !currentNode.can_re_edit) {
        statusText = 'Limit Reached';
      }
    }

    return (
      <div className="flex flex-col items-start">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rfi.status as keyof typeof statusColors] || statusColors.pending}`}>
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

  // Priority styles
  const priorityStyles = {
    low: 'text-success',
    medium: 'text-ai-blue', 
    high: 'text-error'
  };
  
  // Handle RFI response submission
  const handleResponseSubmit = async () => {
    try {
      if (selectedRfi && responseText && user && selectedProject) {
        // Generate PDF from response
        const responseFields = [
          {
            label: 'Response',
            value: responseText
          },
          {
            label: 'Responded By',
            value: user.name
          },
          {
            label: 'Response Date',
            value: new Date().toLocaleDateString()
          }
        ];

        const responsePdf = await generateFormPdf(
          `Response to ${selectedRfi.title}`,
          'RFI Response',
          responseFields,
          selectedProject.name,
          user.name
        );

        await respondToForm(
          selectedRfi.id,
          responsePdf,
          user.id,
          selectedProject.id
        );

        // Update local state
        const updatedRfiItems = rfiItems.map(rfi => {
          if (rfi.id === selectedRfi.id) {
            return {
              ...rfi,
              status: 'answered' as const,
              response: responseText,
              responseDate: new Date().toISOString()
            };
          }
          return rfi;
        });
        
        setRfiItems(updatedRfiItems);
        setShowResponseForm(false);
        setResponseText('');
        
        // Update the selected RFI
        const updatedSelectedRfi = {
          ...selectedRfi,
          status: 'answered' as const,
          response: responseText,
          responseDate: new Date().toISOString()
        };
        setSelectedRfi(updatedSelectedRfi);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };
  
  // Close an RFI
  const closeRfi = async (id: string) => {
    try {
      if (!user) return;

      await updateFormStatus(id, user.id, 'closed');

      const updatedRfiItems = rfiItems.map(rfi => {
        if (rfi.id === id) {
          return {
            ...rfi,
            status: 'closed' as const
          };
        }
        return rfi;
      });
      
      setRfiItems(updatedRfiItems);
      
      // Update selectedRfi if it's the one being closed
      if (selectedRfi && selectedRfi.id === id) {
        setSelectedRfi({
          ...selectedRfi,
          status: 'closed'
        });
      }
    } catch (error) {
      console.error('Error closing RFI:', error);
    }
  };
  
  // Style mapping based on status
  const statusStyles = {
    pending: {
      bg: 'bg-ai-blue/10',
      text: 'text-ai-blue',
      border: 'border-ai-blue/20'
    },
    answered: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20'
    },
    closed: {
      bg: 'bg-secondary-500/10',
      text: 'text-secondary-500',
      border: 'border-secondary-500/20'
    },
    rejected: {
      bg: 'bg-red-100/10',
      text: 'text-red-600',
      border: 'border-red-600/20'
    },
    completed: {
      bg: 'bg-green-100/10',
      text: 'text-green-600',
      border: 'border-green-600/20'
    },
    permanently_rejected: {
      bg: 'bg-red-200/10',
      text: 'text-red-800',
      border: 'border-red-800/20'
    }
  };
  
  // Process flow helper functions (similar to diary page)
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
  
  const handleWorkflowUserSelection = (selectedUser: User) => {
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

  // Define available templates
  const availableTemplates = [
    {
      id: 'inspection-check',
      title: 'Inspection Check Form',
      description: 'Request inspection check for construction work',
      icon: <RiIcons.RiCheckboxLine className="text-indigo-500 mr-2 text-xl" />,
      form_type: 'inspection'
    },
    {
      id: 'survey-check',
      title: 'Survey Check Form',
      description: 'Request survey verification for site measurements',
      icon: <RiIcons.RiRulerLine className="text-purple-500 mr-2 text-xl" />,
      form_type: 'survey'
    }
  ];

  // Handle form submission from templates - now shows process flow first
  const handleFormSubmit = async (data: any, formType: 'inspection' | 'survey' = 'inspection') => {
    try {
      if (!user || !selectedProject) return;

      // Generate PDF from form data
      const formFields = Object.entries(data)
        .filter(([key]) => key !== 'attachments' && key !== 'pdf')
        .map(([key, value]) => ({
          label: key,
          value: value as string | string[] | boolean
        }));

      const pdf = await generateFormPdf(
        data.title || 'New RFI',
        data.description || '',
        formFields,
        selectedProject.name,
        user.name
      );

      // Store form data and PDF with form type, then show process flow
      setPendingFormData({ ...data, pdf, formType: formType });
      setGeneratedPdf(pdf);
      setShowFormSelector(false);
      setInspectionTemplateVisible(false);
      setSurveyTemplateVisible(false);
      setShowProcessFlow(true);
      setSelectedNode(processNodes.find(node => node.type === 'node') || null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Handle inspection form update
  const handleUpdateInspection = async (formData: any) => {
    if (!selectedRfi || !user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/inspection/${selectedRfi.id}/update`, {
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
        setInspectionTemplateVisible(false);
        loadRfis();
        alert('Inspection updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update inspection: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
      alert('Failed to update inspection. Please try again.');
    }
  };

  // Handle survey form update
  const handleUpdateSurvey = async (formData: any) => {
    if (!selectedRfi || !user?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/survey/${selectedRfi.id}/update`, {
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
        setSurveyTemplateVisible(false);
        loadRfis();
        alert('Survey updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update survey: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating survey:', error);
      alert('Failed to update survey. Please try again.');
    }
  };

  // Delete RFI (admin only)
  const handleDeleteRfi = async (rfi: RfiItem) => {
    if (!user?.id || user.role !== 'admin') {
      alert('Only admins can delete RFIs.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete this RFI: ${rfi.title}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const endpoint = rfi.form_type === 'survey' 
        ? `${API_BASE_URL}/survey/${rfi.id}`
        : `${API_BASE_URL}/inspection/${rfi.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadRfis();
        alert('RFI deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete RFI: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting RFI:', error);
      alert('Failed to delete RFI. Please try again.');
    }
  };

  // Handle inspection form submission
  const handleInspectionFormSubmit = (data: any) => {
    if (selectedRfi) {
      handleUpdateInspection(data);
    } else {
      handleFormSubmit(data, 'inspection');
    }
  };

  // Handle survey form submission
  const handleSurveyFormSubmit = (data: any) => {
    if (selectedRfi) {
      handleUpdateSurvey(data);
    } else {
      handleFormSubmit(data, 'survey');
    }
  };
  
  const handleUserSelection = async (selectedUserIds: string[]) => {
    try {
      if (!generatedPdf || !formData || !user || !selectedProject) return;

      await createForm(
        generatedPdf,
        user.id,
        formData.title || 'New RFI',
        formData.description || '',
        selectedUserIds,
        selectedProject.id,
        formData.priority || 'medium',
        'rfi'
      );

      // Reset state
      setGeneratedPdf(null);
      setFormData(null);
      setSelectedUsers([]);
      setShowUserSelection(false);

      // Reload RFIs
      await loadRfis();
    } catch (error) {
      console.error('Error creating form:', error);
    }
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

      // Get form type from pending data
      const formType = pendingFormData.formType || 'inspection';
      
      // Generate RISC number if missing
      const generatedRiscNo = pendingFormData.riscNo || `RISC-${Math.floor(100000 + Math.random() * 900000)}`;

      // Map form data to match API expectations
      const mappedFormData = {
        ...pendingFormData,
        project: selectedProject?.name || 'Unknown Project',
        projectId: selectedProject?.id,
        riscNo: generatedRiscNo
      };

      // Remove inspectionTime field for survey forms as it doesn't exist in survey_entries table
      if (formType === 'survey') {
        delete mappedFormData.inspectionTime;
      } else {
        // For inspection forms, ensure all required fields are present and map field names correctly
        mappedFormData.inspectionTime = pendingFormData.inspectionTime || '09:00';
        mappedFormData.inspectionDate = pendingFormData.inspectionDate || new Date().toISOString().split('T')[0];
        mappedFormData.inspector = pendingFormData.inspectedBy || user?.name || 'Unknown Inspector';
        
        // Ensure required fields have default values
        mappedFormData.contractNo = mappedFormData.contractNo || 'N/A';
        // mappedFormData.riscNo is already set above
        mappedFormData.revision = mappedFormData.revision || 'Rev-1';
        mappedFormData.supervisor = mappedFormData.supervisor || 'N/A';
        mappedFormData.attention = mappedFormData.attention || 'N/A';
        mappedFormData.location = mappedFormData.location || 'N/A';
        mappedFormData.worksToBeInspected = mappedFormData.worksToBeInspected || 'General inspection';
        mappedFormData.worksCategory = mappedFormData.worksCategory || 'General';
        mappedFormData.nextOperation = mappedFormData.nextOperation || 'N/A';
        mappedFormData.generalCleaning = mappedFormData.generalCleaning || 'N/A';
        mappedFormData.scheduledTime = mappedFormData.scheduledTime || '10:00';
        mappedFormData.scheduledDate = mappedFormData.scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        mappedFormData.equipment = mappedFormData.equipment || 'N/A';
        mappedFormData.noObjection = mappedFormData.noObjection !== undefined ? mappedFormData.noObjection : false;
        mappedFormData.deficienciesNoted = mappedFormData.deficienciesNoted !== undefined ? mappedFormData.deficienciesNoted : false;
        mappedFormData.deficiencies = mappedFormData.deficiencies || [];
      }

      console.log('Sending RFI data:', {
        formData: mappedFormData,
        processNodes: processNodesForBackend,
        createdBy: user.id,
        projectId: selectedProject?.id,
        formType,
        formId: generatedRiscNo,
        name: generatedRiscNo,
        endpoint: formType === 'survey' 
          ? `${API_BASE_URL}/survey/create`
          : `${API_BASE_URL}/inspection/create`
      });

      // Additional validation logging for inspection forms
      if (formType === 'inspection') {
        console.log('Inspection form validation:', {
          hasInspectionDate: !!mappedFormData.inspectionDate,
          hasInspectionTime: !!mappedFormData.inspectionTime,
          hasInspector: !!mappedFormData.inspector,
          hasProjectId: !!mappedFormData.projectId,
          hasWorksToBeInspected: !!mappedFormData.worksToBeInspected,
          requiredFields: {
            inspectionDate: mappedFormData.inspectionDate,
            inspectionTime: mappedFormData.inspectionTime,
            inspector: mappedFormData.inspector,
            projectId: mappedFormData.projectId,
            worksToBeInspected: mappedFormData.worksToBeInspected
          }
        });
      }

      // Use the correct API endpoint based on form type
      const apiEndpoint = formType === 'survey' 
        ? `${API_BASE_URL}/survey/create`
        : `${API_BASE_URL}/inspection/create`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: mappedFormData,
          processNodes: processNodesForBackend,
          createdBy: user.id,
          projectId: selectedProject?.id,
          formId: generatedRiscNo,
          name: generatedRiscNo
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('RFI created successfully:', result);
        
        // Refresh RFI list
        await loadRfis();
        
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
        alert(`${formType === 'survey' ? 'Survey' : 'Inspection'} check created successfully! Notifications have been sent to assigned users.`);
      } else {
        const errorText = await response.text();
        console.error('Failed to create RFI:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        });
        
        let errorMessage = 'Unknown error';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || 'Unknown error';
        } catch (e) {
          errorMessage = errorText || 'Server error';
        }
        
        alert(`Failed to create ${formType === 'survey' ? 'survey' : 'inspection'} check: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating RFI:', error);
      alert('Failed to create RFI. Please try again.');
    }
  };
  
  // Handle workflow actions (approve/reject/back to previous)
  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'back') => {
    if (!selectedRfi || !user?.id) return;

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
      const endpoint = selectedRfi.form_type === 'survey' 
        ? `${API_BASE_URL}/survey/${selectedRfi.id}/update`
        : `${API_BASE_URL}/inspection/${selectedRfi.id}/update`;

      const response = await fetch(endpoint, {
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
        
        if (result.permanently_rejected) {
          alert('Entry has been permanently rejected - no more edits are allowed as all nodes have reached their completion limit.');
        } else {
          alert(`Entry ${action}d successfully! Notifications have been sent.`);
        }
        
        await loadRfis();
        setShowRfiDetails(false);
      } else {
        const error = await response.json();
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

  // Check permissions
  const canUserEditEntry = (entry: RfiItem) => {
    if (!user?.id) return false;
    if (entry.status === 'permanently_rejected' || entry.status === 'closed') return false;
    
    if (user.role === 'admin' && (entry.status === 'pending' || entry.status === 'rejected')) return true;
    
    const currentNode = entry.rfi_workflow_nodes?.find(
      (node: any) => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id && entry.status === 'rejected') return true;
    
    return false;
  };

  const canUserUpdateForm = (entry: RfiItem) => {
    if (!user?.id) return false;
    if (entry.status === 'permanently_rejected' || entry.status === 'closed') return false;
    
    if (user.role === 'admin' && entry.created_by === user.id) return true;

    const currentNode = entry.rfi_workflow_nodes?.find(
      (node: any) => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id) {
      if (entry.status === 'rejected') return true;
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      const canReEdit = currentNode.can_re_edit !== false;
      return canReEdit && completionCount < maxCompletions;
    }
    
    const isAssigned = entry.rfi_assignments?.some(
      (assignment: any) => assignment.user_id === user.id && 
                   assignment.node_id === currentNode?.node_id
    );
    
    if (isAssigned && entry.status === 'rejected') return true;
    
    return isAssigned;
  };

  const canUserApproveEntry = (entry: RfiItem) => {
    if (!user?.id) return false;
    if (entry.status === 'permanently_rejected' || entry.status === 'completed' || entry.status === 'closed') return false;
    if (user.role === 'admin') return true;
    
    const currentNode = entry.rfi_workflow_nodes?.find(
      (node: any) => node.node_order === entry.current_node_index
    );
    
    if (currentNode && currentNode.executor_id === user.id) {
      if (entry.status === 'rejected') return true;
      const completionCount = currentNode.completion_count || 0;
      const maxCompletions = currentNode.max_completions || 2;
      const canReEdit = currentNode.can_re_edit !== false;
      return canReEdit && completionCount < maxCompletions;
    }
    return false;
  };

  const canUserViewEntry = (entry: RfiItem) => {
    // Basic view permission - everyone in project can view usually, or restrict
    return true; 
  };

  // Cancel process flow and go back to form
  const handleCancelProcessFlow = () => {
    setShowProcessFlow(false);
    setShowFormSelector(true);
    setPendingFormData(null);
    setGeneratedPdf(null);
  };


  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced Header with gradient and pattern */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-indigo-900 via-purple-800 to-violet-900">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M0,0 L100,0 L100,100 Q60,80 30,100 L0,100 Z"
              fill="url(#gradient)" 
              className="opacity-30"
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
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
                  <RiIcons.RiBellLine className="mr-3 text-purple-300" />
                  Requests for Information
                </h1>
                <p className="text-purple-200 mt-2 max-w-2xl">
                  Manage information requests, track responses, and streamline communication for your construction project
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
                leftIcon={<RiIcons.RiAddLine />}
                onClick={() => {
                  setSelectedRfi(null);
                  setShowFormSelector(true);
                }}
                animated
                pulseEffect
                glowing
              >
                New Request
              </Button>
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
              <div className="p-3 bg-indigo-500/20 rounded-full mr-4">
                <RiIcons.RiFileTextLine className="text-2xl text-indigo-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Total Requests</div>
                <div className="text-2xl font-bold text-white">{rfiItems.length}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiIcons.RiTimeLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Pending Responses</div>
                <div className="text-2xl font-bold text-white">{rfiItems.filter(item => item.status === 'pending').length}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-violet-500/20 rounded-full mr-4">
                <RiIcons.RiCheckLine className="text-2xl text-violet-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Closed Requests</div>
                <div className="text-2xl font-bold text-white">{rfiItems.filter(item => item.status === 'closed').length}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <Card variant="ai" className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Data Type Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <div><RiIcons.RiSearchLine /></div>
                </div>
                <input
                  type="text"
                  placeholder="Search RFIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-ai pl-10 w-full"
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value as any)}
                  className="input-ai py-2 px-4 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700"
                >
                  <option value="all">All Forms</option>
                  <option value="inspection">Inspections</option>
                  <option value="survey">Surveys</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-ai py-2 px-4 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div><RiIcons.RiLoader4Line className="animate-spin text-4xl text-gray-400 mx-auto mb-4" /></div>
            <h3 className="text-xl font-medium mb-2">Loading RFIs...</h3>
            <p className="text-gray-500 mb-6">Please wait while we fetch the requests for information.</p>
          </motion.div>
        ) : filteredRfis.length > 0 ? (
          filteredRfis.map((rfi) => (
            <motion.div
              key={rfi.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border border-secondary-100 dark:border-dark-700"
              >
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <RiIcons.RiCalendarLine className="text-primary-600 dark:text-primary-400 mr-2" />
                      <span className="font-medium text-primary-900 dark:text-primary-300">
                        {new Date(rfi.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getWorkflowStatusBadge(rfi)}
                    </div>
                  </div>
                  
                  <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                    {rfi.title}
                  </h3>
                  
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    <RiIcons.RiUserLine className="mr-1" />
                    <span className="ml-1">From: {rfi.submittedBy}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-2">
                      Description:
                    </h4>
                    <p className="text-secondary-600 dark:text-secondary-400 line-clamp-2">
                      {rfi.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        Type:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {rfi.form_type ? rfi.form_type.charAt(0).toUpperCase() + rfi.form_type.slice(1) : 'RFI'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-secondary-900 dark:text-white text-sm uppercase tracking-wide mb-1">
                        Assigned To:
                      </h4>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm line-clamp-1">
                        {rfi.assignedTo || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRfi(rfi);
                          setShowRfiDetails(true);
                        }}
                        rightIcon={<RiIcons.RiArrowRightLine />}
                        className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      >
                        View Details
                      </Button>
                      {/* Admin delete button */}
                      {user?.role === 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRfi(rfi)}
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
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div><RiIcons.RiQuestionLine className="mx-auto text-4xl text-gray-400 mb-4" /></div>
            <h3 className="text-xl font-medium mb-2">No RFIs found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or create a new RFI</p>
            <Button 
              variant="ai-gradient" 
              onClick={() => {
                setSelectedRfi(null);
                setShowFormSelector(true);
              }}
              leftIcon={<div><RiIcons.RiAddLine /></div>}
            >
              Create RFI
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Form selector modal */}
      <AnimatePresence>
        {showFormSelector && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowFormSelector(false)}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-dark-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Select Form Template</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose the type of request form you need
                </p>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setShowFormSelector(false);
                      if (template.id === 'inspection-check') {
                        setInspectionTemplateVisible(true);
                      } else if (template.id === 'survey-check') {
                        setSurveyTemplateVisible(true);
                      }
                    }}
                  >
                    <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center">
                      {template.icon}
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-7">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button variant="ghost" onClick={() => setShowFormSelector(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspection Check Form Template Modal */}
      <AnimatePresence>
        {inspectionTemplateVisible && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setInspectionTemplateVisible(false)}
          >
            <motion.div
              className="bg-dark-900/80 backdrop-blur-md border border-white/10 shadow-lg rounded-xl overflow-hidden w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <InspectionCheckFormTemplate
                onClose={() => {
                  setInspectionTemplateVisible(false);
                  setSelectedRfi(null);
                }}
                onSave={handleInspectionFormSubmit}
                initialData={selectedRfi?.form_data}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Survey Check Form Template Modal */}
      <AnimatePresence>
        {surveyTemplateVisible && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSurveyTemplateVisible(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SurveyCheckFormTemplate
                onClose={() => {
                  setSurveyTemplateVisible(false);
                  setSelectedRfi(null);
                }}
                onSave={handleSurveyFormSubmit}
                initialData={selectedRfi?.form_data}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* RFI Details Dialog */}
      <Dialog
        isOpen={showRfiDetails}
        onClose={() => setShowRfiDetails(false)}
        title="RFI Details"
      >
        {selectedRfi && (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
              <div className="text-lg font-bold text-primary-900 dark:text-primary-300 flex items-center">
                <RiIcons.RiCalendarCheckLine className="mr-2 text-primary-600 dark:text-primary-400" />
                {new Date(selectedRfi.submittedDate).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                 {getWorkflowStatusBadge(selectedRfi)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <RiIcons.RiUserLine className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Submitted By</span>
                </div>
                <div className="font-medium">{selectedRfi.submittedBy}</div>
              </div>
              
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                  <div className="mr-2 text-primary-600 dark:text-primary-400">
                    <RiIcons.RiFlagLine />
                  </div>
                  <span className="text-sm font-medium uppercase tracking-wide">Priority</span>
                </div>
                <div className={`font-medium ${priorityStyles[selectedRfi.priority]}`}>
                    {selectedRfi.priority.charAt(0).toUpperCase() + selectedRfi.priority.slice(1)}
                </div>
              </div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiFileTextLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Description</span>
              </div>
              <div className="whitespace-pre-line">{selectedRfi.description}</div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiUserFollowLine className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Assigned To</span>
              </div>
              <div>{selectedRfi.assignedTo || 'Unassigned'}</div>
            </div>
            
            <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
              <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-2">
                <RiIcons.RiChat3Line className="mr-2 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium uppercase tracking-wide">Response</span>
              </div>
              <div>{selectedRfi.response || 'No response yet'}</div>
            </div>
            
            {/* Workflow Status Section */}
            {selectedRfi.rfi_workflow_nodes && selectedRfi.rfi_workflow_nodes.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiIcons.RiFlowChart className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Workflow Status</span>
                </div>
                
                <div className="space-y-3">
                  {selectedRfi.rfi_workflow_nodes
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
            {selectedRfi.rfi_comments && selectedRfi.rfi_comments.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-800/50 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center text-secondary-600 dark:text-secondary-400 mb-4">
                  <RiIcons.RiChat3Line className="mr-2 text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-medium uppercase tracking-wide">Comments & Actions</span>
                </div>
                
                <div className="space-y-3">
                  {selectedRfi.rfi_comments
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
                              'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
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
                    leftIcon={<RiIcons.RiDownload2Line />}
                    className="text-secondary-400 hover:text-white hover:bg-white/5"
                  >
                    Export
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    leftIcon={<RiIcons.RiPrinterLine />}
                    className="text-secondary-400 hover:text-white hover:bg-white/5"
                  >
                    Print
                  </Button>
                  
                  {/* Admin delete button */}
                  {user?.role === 'admin' && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      leftIcon={<RiIcons.RiDeleteBinLine />}
                      onClick={() => {
                        setShowRfiDetails(false);
                        handleDeleteRfi(selectedRfi);
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
                    onClick={() => setShowRfiDetails(false)}
                    className="border-white/10 hover:bg-white/5"
                  >
                    Close
                  </Button>

                  {/* View/Edit Form Button */}
                  {(canUserEditEntry(selectedRfi) || canUserUpdateForm(selectedRfi) || canUserViewEntry(selectedRfi)) && (
                    <Button 
                      variant="outline"
                      size="sm"
                      leftIcon={canUserUpdateForm(selectedRfi) ? <RiIcons.RiEditLine /> : <RiIcons.RiFileListLine />}
                      onClick={() => {
                        setShowRfiDetails(false);
                         if (selectedRfi.form_type === 'inspection') {
                            setInspectionTemplateVisible(true);
                          } else if (selectedRfi.form_type === 'survey') {
                            setSurveyTemplateVisible(true);
                          } else {
                            // Fallback for generic RFI
                             setShowFormSelector(true);
                          }
                      }}
                      className="hover:bg-white/5"
                    >
                      {canUserUpdateForm(selectedRfi) ? 'Edit Form' : 'View Form'}
                    </Button>
                  )}

                  {/* Workflow Action Buttons */}
                  {(selectedRfi.status === 'pending' || selectedRfi.status === 'rejected') && (
                    <>
                      {/* Send Back (if applicable) */}
                      {canUserApproveEntry(selectedRfi) && (selectedRfi.current_node_index || 0) > 0 && (
                        <Button 
                          variant="outline"
                          size="sm"
                          leftIcon={<RiIcons.RiArrowLeftLine />}
                          onClick={() => handleWorkflowAction('back')}
                          className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500"
                        >
                          Send Back
                        </Button>
                      )}
                      
                      {/* Reject */}
                      {canUserApproveEntry(selectedRfi) && (
                        <Button 
                          variant="outline"
                          size="sm"
                          leftIcon={<RiIcons.RiCloseLine />}
                          onClick={() => handleWorkflowAction('reject')}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
                        >
                          Reject
                        </Button>
                      )}

                      {/* Approve/Complete */}
                      {canUserApproveEntry(selectedRfi) && (
                        <Button 
                          variant="primary"
                          size="sm"
                          leftIcon={<RiIcons.RiCheckLine />}
                          onClick={() => handleWorkflowAction('approve')}
                          className="bg-portfolio-orange hover:bg-portfolio-orange/80 text-white border-none shadow-lg shadow-portfolio-orange/20"
                        >
                          {(selectedRfi.current_node_index === 1) ? 'Complete' : 'Approve'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Keep old Respond button for fallback if workflow not active */}
                  {selectedRfi.status === 'pending' && !selectedRfi.rfi_workflow_nodes?.length && (
                     <Button 
                        variant="ai-secondary"
                        onClick={() => {
                          setShowResponseForm(true);
                          setShowRfiDetails(false);
                        }}
                      >
                        Respond
                      </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      
      {/* RFI Response Form Modal */}
      <AnimatePresence>
        {showResponseForm && selectedRfi && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowResponseForm(false);
              setShowRfiDetails(true);
            }}
          >
            <motion.div
              className="bg-dark-950 rounded-xl shadow-ai-glow border border-ai-blue/20 max-w-2xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-dark-800 flex justify-between items-center">
                <h2 className="text-xl font-display font-semibold text-white">Respond to RFI</h2>
                <button 
                  onClick={() => {
                    setShowResponseForm(false);
                    setShowRfiDetails(true);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <div><RiIcons.RiCloseLine className="text-xl" /></div>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">{selectedRfi.title}</h3>
                  <p className="text-sm text-gray-500">{selectedRfi.description}</p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Your Response
                  </label>
                  <textarea
                    rows={8}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-full"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="ai-secondary"
                    onClick={() => {
                      setShowResponseForm(false);
                      setShowRfiDetails(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="ai-gradient"
                    onClick={handleResponseSubmit}
                    disabled={!responseText.trim()}
                    glowing
                  >
                    Submit Response
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add UserSelectionModal */}
      <UserSelectionModal
        isOpen={showUserSelection}
        onClose={() => setShowUserSelection(false)}
        onSubmit={handleUserSelection}
        users={users}
        title="Assign RFI"
        description="Select users to assign this RFI to"
      />

      {/* Process Flow Configuration Modal */}
      {showProcessFlow && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCancelProcessFlow}
          >
            <motion.div
              className="bg-dark-900/80 backdrop-blur-md border border-white/10 shadow-lg rounded-xl overflow-hidden w-full max-w-7xl max-h-[90vh] overflow-auto"
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
                      Configure the workflow process for this RFI before saving.
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
                      Save RFI
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
        onSelect={handleWorkflowUserSelection}
        title={peopleSelectorType === 'executor' ? 'Select Executor' : 'Add CC Recipient'}
        users={users}
        loading={isLoadingUsers}
      />
    </div>
  );
};

export default RfiPage; 