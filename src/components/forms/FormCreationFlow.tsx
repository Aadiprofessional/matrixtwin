import React, { useState, useEffect, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  RiArrowLeftLine, 
  RiArrowRightLine, 
  RiCheckLine, 
  RiUserLine, 
  RiAddLine,
  RiFlowChart,
  RiSettings4Line,
  RiNotificationLine,
  RiFileUserLine,
  RiSearchLine,
  RiCloseLine,
  RiTeamLine,
  RiLoader4Line,
  RiEyeLine
} from 'react-icons/ri';
import ProcessFlowBuilder from './ProcessFlowBuilder';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../contexts/ProjectContext';

// Context for sharing form state between steps
const FormEditorContext = createContext<any>(null);

export const useFormEditor = () => {
  const context = useContext(FormEditorContext);
  if (!context) {
    throw new Error('useFormEditor must be used within a FormEditorProvider');
  }
  return context;
};

// Define User interface for people selection
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

// Define ProcessNode interface for workflow
interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string;
  executorId?: string;
  ccRecipients?: User[];
  editAccess?: boolean;
  expireTime?: string;
  expireDuration?: number | null;
  settings: Record<string, any>;
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
        className="w-full max-w-md max-h-[80vh] bg-dark-800 rounded-lg shadow-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-dark-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center text-white">
            <RiUserLine className="mr-2" />
            {title}
          </h3>
          <button 
            className="text-gray-400 hover:text-gray-200"
            onClick={onClose}
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        
        <div className="p-4 border-b border-dark-700">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-4 py-2 border border-dark-600 rounded-md bg-dark-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px] p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <RiLoader4Line className="animate-spin text-2xl mx-auto mb-2" />
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="p-3 hover:bg-dark-700 rounded-md cursor-pointer transition-colors flex items-center"
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
                    <div className="w-10 h-10 rounded-full bg-ai-blue/20 text-ai-blue flex items-center justify-center font-medium mr-3">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.role}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  form_structure: any;
  created_at: string;
  fieldsCount?: number;
  pages?: any[];
}

interface FormCreationFlowProps {
  onClose: () => void;
  onSave: (formData: any) => void;
  existingForms: FormTemplate[];
  formEditor?: React.ReactNode;
  onTemplateSelect?: (templateId: number) => void;
  onSiteDiarySelect?: () => void;
  onSafetyInspectionSelect?: () => void;
  onDailyCleaningInspectionSelect?: () => void;
  onMonthlyReturnSelect?: () => void;
  onInspectionCheckSelect?: () => void;
  onSurveyCheckSelect?: () => void;
  onAddPage?: () => void;
  onPreview?: () => void;
}

const FormCreationFlow: React.FC<FormCreationFlowProps> = ({ 
  onClose, 
  onSave,
  existingForms,
  formEditor,
  onTemplateSelect,
  onSiteDiarySelect,
  onSafetyInspectionSelect,
  onDailyCleaningInspectionSelect,
  onMonthlyReturnSelect,
  onInspectionCheckSelect,
  onSurveyCheckSelect,
  onAddPage,
  onPreview
}) => {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  
  // State for tracking current step
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Template step state
  const [templateName, setTemplateName] = useState<string>('');
  const [useExistingForm, setUseExistingForm] = useState<boolean>(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  // Form step state (will be populated if using existing form)
  const [formPages, setFormPages] = useState<any[]>([{ id: '1', fields: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>('');
  
  // API state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [customFormTemplates, setCustomFormTemplates] = useState<FormTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // People selector modal state
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleModalType, setPeopleModalType] = useState<'executor' | 'cc'>('executor');
  const [selectedCcs, setSelectedCcs] = useState<User[]>([]);
  
  // Process step state
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', editAccess: true, settings: {} },
    { id: 'node1', type: 'node', name: 'Review & Approval', executor: '', executorId: '', editAccess: true, ccRecipients: [], settings: {} },
    { id: 'end', type: 'end', name: 'Complete', editAccess: false, settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode | null>(processNodes[1]);

  // Fetch users on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUsers();
      fetchCustomFormTemplates();
    }
  }, [user?.id]);

  // Fetch users from API
  const fetchUsers = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingUsers(true);
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle the response structure - data should be an array of users
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.log('Unexpected users API response structure:', data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch custom form templates from API
  const fetchCustomFormTemplates = async () => {
    if (!selectedProject?.id) return;
    
    try {
      setLoadingTemplates(true);
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/custom-forms/templates?projectId=${selectedProject.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const templates = await response.json();
        setCustomFormTemplates(templates || []);
      }
    } catch (error) {
      console.error('Error fetching custom form templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };
  
  // Function to add a new node
  const addNewNode = () => {
    const newNodeId = `node${processNodes.length}`;
    const newNode: ProcessNode = {
      id: newNodeId,
      type: 'node',
      name: `New node${processNodes.length}`,
      executor: '',
      executorId: '',
      editAccess: true,
      ccRecipients: [],
      settings: {}
    };
    
    const endNodeIndex = processNodes.findIndex(node => node.type === 'end');
    if (endNodeIndex !== -1) {
      const updatedNodes = [...processNodes];
      updatedNodes.splice(endNodeIndex, 0, newNode);
      setProcessNodes(updatedNodes);
      setSelectedNode(newNode);
    }
  };
  
  // Function to open people selector
  const openPeopleSelector = (type: 'executor' | 'cc') => {
    setPeopleModalType(type);
    setShowPeopleSelector(true);
  };
  
  // Function to handle user selection from the modal
  const handleUserSelection = (selectedUser: User) => {
    if (peopleModalType === 'executor') {
      if (selectedNode) {
        const updatedNode = { 
          ...selectedNode, 
          executor: selectedUser.name,
          executorId: selectedUser.id
        };
        const updatedNodes = processNodes.map(node => 
          node.id === selectedNode.id ? updatedNode : node
        );
        setProcessNodes(updatedNodes);
        setSelectedNode(updatedNode);
      }
    } else if (peopleModalType === 'cc') {
      if (selectedNode) {
        const currentCcs = selectedNode.ccRecipients || [];
        if (!currentCcs.some((cc: User) => cc.id === selectedUser.id)) {
          const updatedCcs = [...currentCcs, selectedUser];
          const updatedNode = { 
            ...selectedNode, 
            ccRecipients: updatedCcs
          };
          
          const updatedNodes = processNodes.map(node => 
            node.id === selectedNode.id ? updatedNode : node
          );
          
          setProcessNodes(updatedNodes);
          setSelectedNode(updatedNode);
          setSelectedCcs(updatedCcs);
        }
      }
    }
  };
  
  // Function to remove a CC
  const removeUserFromCc = (userId: string) => {
    if (selectedNode) {
      const currentCcs = selectedNode.ccRecipients || [];
      const updatedCcs = currentCcs.filter((cc: User) => cc.id !== userId);
      
      const updatedNode = { 
        ...selectedNode, 
        ccRecipients: updatedCcs
      };
      
      const updatedNodes = processNodes.map(node => 
        node.id === selectedNode.id ? updatedNode : node
      );
      
      setProcessNodes(updatedNodes);
      setSelectedNode(updatedNode);
      setSelectedCcs(updatedCcs);
    }
  };
  
  // Animation variants
  const variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };
  
  useEffect(() => {
    // If a form is selected, load its data
    if (selectedFormId && useExistingForm) {
      const selectedForm = customFormTemplates.find(form => form.id === selectedFormId);
      if (selectedForm) {
        setTemplateName(selectedForm.name);
        setFormDescription(selectedForm.description);
        
        // Load form structure if available
        if (selectedForm.form_structure && selectedForm.form_structure.pages) {
          setFormPages(selectedForm.form_structure.pages);
        }
        
        // Load workflow if available
        if (selectedForm.form_structure && selectedForm.form_structure.workflow) {
          setProcessNodes(selectedForm.form_structure.workflow);
        }
        
        if (onTemplateSelect) {
          onTemplateSelect(parseInt(selectedFormId));
        }
      }
    }
  }, [selectedFormId, useExistingForm, customFormTemplates, onTemplateSelect]);
  
  // Update selected CCs when selectedNode changes
  useEffect(() => {
    if (selectedNode && selectedNode.ccRecipients) {
      setSelectedCcs(selectedNode.ccRecipients);
    } else {
      setSelectedCcs([]);
    }
  }, [selectedNode]);
  
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize and save
      handleFinalSave();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  // Final save function that creates the custom form template
  const handleFinalSave = async () => {
    if (!user?.id || !selectedProject?.id) {
      alert('User or project not found');
      return;
    }

    try {
      setSaving(true);

      // Prepare process nodes with proper structure for backend
      const processNodesForBackend = processNodes.map(node => ({
        ...node,
        executorId: node.executorId,
        executorName: node.executor,
        ccRecipients: node.ccRecipients || [],
        editAccess: node.editAccess !== false
      }));

      const templateData = {
        name: templateName,
        description: formDescription,
        formStructure: formPages,
        processNodes: processNodesForBackend,
        projectId: selectedProject.id
      };

      console.log('Creating custom form template:', templateData);

      const response = await fetch('https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/custom-forms/templates/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Custom form template created successfully:', result);
        
        // Call the onSave callback with the form data
        const formData = {
          templateName,
          formDescription,
          formPages,
          processNodes: processNodesForBackend
        };
        onSave(formData);
        
        alert('Custom form template created successfully!');
        onClose();
      } else {
        const error = await response.json();
        console.error('Failed to create custom form template:', error);
        alert(`Failed to create custom form template: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating custom form template:', error);
      alert('Failed to create custom form template. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Validate if user can proceed to next step
  const canProceed = () => {
    if (currentStep === 1) {
      if (!useExistingForm) {
        return templateName.trim() !== '';
      } else {
        return selectedFormId !== null;
      }
    }
    return true;
  };
  
  // Step 1: Template selection
  const renderTemplateStep = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Left Panel - Create New Form */}
          <div className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl border border-dark-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-ai-blue to-ai-teal flex items-center justify-center mr-3">
                <RiAddLine className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Create New Form</h3>
                <p className="text-gray-400 text-sm">Start with a blank form template</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <Input
                  label="Form Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter a name for your form template"
                  className="bg-dark-700/50 border-dark-600/50 focus:border-ai-blue/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Form Description <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter a brief description of this form template"
                  className="resize-none w-full h-32 bg-dark-700/50 border border-dark-600/50 rounded-lg shadow-sm focus:border-ai-blue/50 focus:ring-1 focus:ring-ai-blue/30 p-3 text-white placeholder-gray-500 transition-all duration-200"
                />
              </div>
              
              <div className="pt-4">
                <div className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg border border-dark-600/30">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-ai-blue/20 flex items-center justify-center mr-3">
                      <RiFileUserLine className="text-ai-blue text-sm" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Blank Template</p>
                      <p className="text-gray-400 text-xs">Start from scratch</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-ai-blue bg-ai-blue flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel - Recent Forms */}
          <div className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl border border-dark-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                <RiFileUserLine className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Use Existing Form</h3>
                <p className="text-gray-400 text-sm">Start from a previous template</p>
              </div>
            </div>
            
            {existingForms.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {existingForms.map(form => (
                  <Card 
                    key={form.id} 
                    variant="ai-dark" 
                    className={`border transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                      selectedFormId === form.id.toString() 
                        ? 'border-ai-blue bg-ai-blue/10 shadow-lg shadow-ai-blue/20' 
                        : 'border-dark-600/50 hover:border-ai-blue/50 hover:bg-dark-700/30'
                    }`}
                    onClick={() => {
                      setSelectedFormId(form.id.toString());
                      setUseExistingForm(true);
                      if (onTemplateSelect) {
                        onTemplateSelect(typeof form.id === 'string' ? parseInt(form.id) : form.id);
                      }
                    }}
                  >
                    <div className="p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{form.name}</h4>
                        <p className="text-xs text-gray-400 mb-2">{form.description || 'No description'}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="bg-dark-600/50 px-2 py-1 rounded-full">
                            {form.fieldsCount || 0} fields
                          </span>
                          <span className="ml-2">
                            {new Date(form.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        selectedFormId === form.id.toString() 
                          ? 'border-ai-blue bg-ai-blue' 
                          : 'border-gray-500'
                      }`}>
                        {selectedFormId === form.id.toString() && (
                          <RiCheckLine className="text-white text-sm" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
                  <RiFileUserLine className="text-gray-500 text-2xl" />
                </div>
                <p className="text-gray-400 mb-2">No existing forms found</p>
                <p className="text-gray-500 text-sm">Create your first form template to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Step 2: Form configuration
  const renderFormStep = () => {
    // Form editor context value
    const formEditorContextValue = {
      formPages,
      setFormPages,
      currentPageIndex,
      setCurrentPageIndex,
      templateName,
      formDescription
    };
    
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        className="h-full flex flex-col"
      >
        <FormEditorContext.Provider value={formEditorContextValue}>
          <div className="flex-1 h-full">
            {formEditor}
          </div>
        </FormEditorContext.Provider>
      </motion.div>
    );
  };
  
  // Step 3: Process configuration
  const renderProcessStep = () => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        className="space-y-6"
      >
        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal mb-2">
            Process Configuration
          </h2>
          <p className="text-gray-400">
            Define the workflow process for this form.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left panel - Flow chart */}
          <div className="md:col-span-5">
            <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Process Flow</h3>
                <Button 
                  variant="ai-secondary" 
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
            </div>
          </div>
          
          {/* Right panel - Node settings */}
          <div className="md:col-span-7">
            <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 p-4">
              <h3 className="font-medium mb-4">Process Settings</h3>
              
              <div className="border-b border-dark-700/50 mb-4">
                <div className="flex space-x-4 mb-1">
                  <button 
                    className={`py-2 px-3 border-b-2 text-sm font-medium ${
                      true ? 'border-ai-blue text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Basic settings
                  </button>
                  <button 
                    className={`py-2 px-3 border-b-2 text-sm font-medium ${
                      false ? 'border-ai-blue text-white' : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Field settings
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Node name"
                  value={selectedNode?.name || ''}
                  onChange={(e) => {
                    if (selectedNode) {
                      const updatedNode = { ...selectedNode, name: e.target.value };
                      const updatedNodes = processNodes.map(node => 
                        node.id === selectedNode.id ? updatedNode : node
                      );
                      setProcessNodes(updatedNodes);
                      setSelectedNode(updatedNode);
                    }
                  }}
                  className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                />
                
                {selectedNode?.type === 'node' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Executor
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-grow bg-dark-700/40 border border-dark-600/50 rounded p-2 text-gray-400">
                          {selectedNode.executor || 'Select executor'}
                        </div>
                        <Button variant="ai-secondary" size="sm" onClick={() => openPeopleSelector('executor')}>
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Cc
                      </label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-grow bg-dark-700/40 border border-dark-600/50 rounded p-2 text-gray-400 min-h-[40px]">
                            {selectedCcs.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedCcs.map(cc => (
                                  <div 
                                    key={cc.id} 
                                    className="bg-dark-600 px-2 py-1 rounded-md flex items-center"
                                  >
                                    <span className="text-sm mr-1">{cc.name}</span>
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-gray-200 ml-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeUserFromCc(cc.id);
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>No CCs selected</span>
                            )}
                          </div>
                          <Button 
                            variant="ai-secondary" 
                            size="sm" 
                            onClick={() => openPeopleSelector('cc')}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {selectedCcs.length > 0 && (
                          <div className="text-xs text-gray-400 flex items-center">
                            <RiTeamLine className="mr-1" />
                            {selectedCcs.length} {selectedCcs.length === 1 ? 'person' : 'people'} added
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Execution types
                      </label>
                      <select className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white">
                        <option value="standard">Standard</option>
                        <option value="parallel">Parallel</option>
                        <option value="sequential">Sequential</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Adoption condition
                      </label>
                      <select className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white">
                        <option value="none">None</option>
                        <option value="approval">Approval required</option>
                        <option value="review">Review required</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-400 mb-2">Edit settings</p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedNode?.editAccess !== false} 
                        onChange={(e) => {
                          if (selectedNode) {
                            const updatedNode = { ...selectedNode, editAccess: e.target.checked };
                            const updatedNodes = processNodes.map(node => 
                              node.id === selectedNode.id ? updatedNode : node
                            );
                            setProcessNodes(updatedNodes);
                            setSelectedNode(updatedNode);
                          }
                        }}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                      <span className="text-sm">Allow creator</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={false} 
                        onChange={() => {}}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                      <span className="text-sm">Allow stakeholder (creator, executor, Cc)</span>
                    </label>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-400 mb-2">Notification Settings</p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={true} 
                        onChange={() => {}}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                      <span className="text-sm">Send email notification</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={true} 
                        onChange={() => {}}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                      <span className="text-sm">Send in-app notification</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTemplateStep();
      case 2:
        return renderFormStep();
      case 3:
        return renderProcessStep();
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full h-full bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-dark-700/50 p-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
              Create Form - Step {currentStep} of 3
            </h2>
            <div className="flex space-x-2">
              <Button 
                variant="ai-secondary" 
                size="sm"
                onClick={handleBack}
                leftIcon={<RiArrowLeftLine />}
                disabled={saving}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              
              <Button 
                variant="ai-gradient" 
                size="sm"
                onClick={handleNext}
                rightIcon={currentStep === 3 ? <RiCheckLine /> : <RiArrowRightLine />}
                disabled={!canProceed() || saving}
                glowing
              >
                {saving ? 'Saving...' : (currentStep === 3 ? 'Save' : 'Next')}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentStep === 2 && (
              <>
                <Button 
                  variant="ai-secondary" 
                  size="sm"
                  onClick={onAddPage}
                  leftIcon={<RiAddLine />}
                >
                  Add Page
                </Button>
                <Button 
                  variant="ai-secondary" 
                  size="sm"
                  onClick={onPreview}
                  leftIcon={<RiEyeLine />}
                >
                  Preview
                </Button>
              </>
            )}
            <Button 
              variant="ai-secondary" 
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center justify-between mt-3">
          <div className="w-full flex items-center">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
              currentStep >= 1 ? 'border-ai-blue bg-ai-blue/20' : 'border-dark-600 bg-dark-700'
            }`}>
              <RiFileUserLine className={`text-xs ${currentStep >= 1 ? 'text-ai-blue' : 'text-gray-500'}`} />
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${
              currentStep > 1 ? 'bg-ai-blue' : 'bg-dark-700'
            }`}></div>
            
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
              currentStep >= 2 ? 'border-ai-blue bg-ai-blue/20' : 'border-dark-600 bg-dark-700'
            }`}>
              <RiSettings4Line className={`text-xs ${currentStep >= 2 ? 'text-ai-blue' : 'text-gray-500'}`} />
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${
              currentStep > 2 ? 'bg-ai-blue' : 'bg-dark-700'
            }`}></div>
            
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
              currentStep >= 3 ? 'border-ai-blue bg-ai-blue/20' : 'border-dark-600 bg-dark-700'
            }`}>
              <RiFlowChart className={`text-xs ${currentStep >= 3 ? 'text-ai-blue' : 'text-gray-500'}`} />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
          <span className={currentStep === 1 ? 'text-ai-blue font-medium' : ''}>Template</span>
          <span className={currentStep === 2 ? 'text-ai-blue font-medium' : ''}>Set Form</span>
          <span className={currentStep === 3 ? 'text-ai-blue font-medium' : ''}>Set Process</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </div>
      


      {/* People Selector Modal */}
      <AnimatePresence>
        {showPeopleSelector && (
          <PeopleSelectorModal
            isOpen={showPeopleSelector}
            onClose={() => setShowPeopleSelector(false)}
            onSelect={handleUserSelection}
            title={peopleModalType === 'executor' ? 'Select Executor' : 'Add People to CC'}
            users={users}
            loading={loadingUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FormCreationFlow;