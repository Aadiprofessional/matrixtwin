import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  RiCloseLine, 
  RiSaveLine, 
  RiLoader4Line,
  RiCalendarLine,
  RiUserLine,
  RiCheckLine,
  RiArrowRightLine,
  RiUpload2Line,
  RiDeleteBinLine,
  RiImageLine
} from 'react-icons/ri';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Dialog } from '../ui/Dialog';
import ExcelGrid from './ExcelGrid';
import { 
  FormPage, 
  FormField, 
  EXCEL_GRID_CONFIG,
  ExcelGrid as ExcelGridType,
  GridCell
} from '../../types/formTypes';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../contexts/ProjectContext';
import { projectService } from '../../services/projectService';

// Define User interface for people selection
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

// People selector modal component (reused/adapted)
const PeopleSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title: string;
  users: User[];
  loading: boolean;
}> = ({ isOpen, onClose, onSelect, title, users, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  if (!isOpen) return null;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="p-4">
        <Input
          placeholder="Search by name, role, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />
        
        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="p-3 hover:bg-dark-700 rounded-md cursor-pointer flex items-center transition-colors"
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-ai-blue/20 text-ai-blue flex items-center justify-center mr-3 font-medium">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.role}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">No users found</div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

interface FormRendererProps {
  formTemplate: {
    id: string;
    name: string;
    description: string;
    formStructure: {
      pages: FormPage[];
    };
    processNodes?: any[]; // Workflow nodes
  };
  initialData?: any;
  onSave: (data: any) => void;
  onClose: () => void;
  readOnly?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formTemplate,
  initialData,
  onSave,
  onClose,
  readOnly = false
}) => {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.data || {});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Process Config State
  const [executor, setExecutor] = useState<User | null>(null);
  const [ccRecipients, setCcRecipients] = useState<User[]>([]);
  
  // Users for selection
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleModalType, setPeopleModalType] = useState<'executor' | 'cc'>('executor');

  // Initialize process config from initialData or Template defaults
  useEffect(() => {
    console.log('FormRenderer received formTemplate:', formTemplate);
    if (initialData) {
      if (initialData.executor) setExecutor(initialData.executor);
      if (initialData.ccRecipients) setCcRecipients(initialData.ccRecipients);
    } else if (formTemplate.processNodes) {
      // Find the first 'node' type which usually has the executor
      const firstNode = formTemplate.processNodes.find((n: any) => n.type === 'node');
      if (firstNode) {
        // Here we might pre-fill if the template has a specific user ID fixed,
        // but typically templates define ROLES or leave it blank.
        // If the template has executorId, we might need to fetch that user.
        // For now, we leave it blank for the user to select, unless it's fixed.
      }
    }
  }, [initialData, formTemplate]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedProject?.id) return;
      try {
        setLoadingUsers(true);
        const members = await projectService.getProjectMembers(selectedProject.id);
        const mappedUsers: User[] = members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          role: m.role,
          email: m.user.email,
          avatar: m.user.avatar
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [selectedProject?.id]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(fieldId, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare the payload
      const payload = {
        templateId: formTemplate.id,
        data: formData,
        executorId: executor?.id,
        executorName: executor?.name,
        executor: executor, // Pass full object
        ccRecipients: ccRecipients, // Pass full objects
      };
      
      await onSave(payload);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const openPeopleSelector = (type: 'executor' | 'cc') => {
    setPeopleModalType(type);
    setShowPeopleSelector(true);
  };

  const handleUserSelect = (selectedUser: User) => {
    if (peopleModalType === 'executor') {
      setExecutor(selectedUser);
    } else {
      if (!ccRecipients.find(u => u.id === selectedUser.id)) {
        setCcRecipients([...ccRecipients, selectedUser]);
      }
    }
  };

  const removeCc = (userId: string) => {
    setCcRecipients(prev => prev.filter(u => u.id !== userId));
  };

  // Handle potential nested structure from backend
  const pages = React.useMemo(() => {
    // If formTemplate is null/undefined
    if (!formTemplate) return [];
    
    // Sometimes the entire formTemplate might be wrapped oddly or formStructure itself is the object
    let struct = formTemplate.formStructure;
    
    // If formStructure is missing, maybe formTemplate itself has the structure?
    if (!struct && (formTemplate as any).pages) {
      struct = formTemplate as any;
    }
    
    if (!struct) return [];
    
    // Case 1: struct.pages is the array
    if (Array.isArray(struct.pages)) {
      return struct.pages;
    }
    
    // Case 2: struct.pages is an object with a pages array (nested)
    if (struct.pages && typeof struct.pages === 'object' && Array.isArray((struct.pages as any).pages)) {
      return (struct.pages as any).pages;
    }
    
    // Case 3: maybe struct itself has a 'pages' property that is the object wrapper?
    // handled by Case 2 if struct.pages exists.
    
    return [];
  }, [formTemplate]);

  const currentPage = pages[currentPageIndex];

  // Handle both grid and structure property (backend sometimes sends 'structure')
  const rawGridData = currentPage?.grid || (currentPage as any)?.structure;
  
  // Prepare grid data with correct types
  const gridData = React.useMemo(() => {
    if (!rawGridData) return null;
    
    // Check if mergedCells needs conversion from Object to Map
    let mergedCells = rawGridData.mergedCells;
    if (mergedCells && !(mergedCells instanceof Map) && typeof mergedCells === 'object') {
       try {
         // If it's a plain object, convert to Map
         mergedCells = new Map(Object.entries(mergedCells));
       } catch (e) {
         console.warn('Failed to convert mergedCells to Map', e);
         mergedCells = new Map();
       }
    }
    
    return {
      ...rawGridData,
      mergedCells
    };
  }, [rawGridData]);

  // Render a field based on its type
  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const settings = field.settings || {};
    
    // Style for positioning
    const style: React.CSSProperties = {
      position: 'absolute',
      left: field.x,
      top: field.y,
      width: field.width,
      height: field.height,
      minHeight: (field.type === 'signature' || field.type === 'image') ? 80 : undefined,
      zIndex: field.zIndex || 1,
      pointerEvents: readOnly ? 'none' : 'auto'
    };

    // Common props
    const commonProps = {
      disabled: readOnly
    };

    const renderLabel = () => {
      if (settings.hideTitle) return null;
      return (
        <label className={`text-sm font-medium text-gray-700 ${settings.titleLayout === 'horizontal' ? 'mr-2 shrink-0' : 'mb-1'}`}>
          {field.label}
          {settings.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      );
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <div style={style} className={`flex ${settings.titleLayout === 'horizontal' ? 'flex-row items-center' : 'flex-col'}`}>
            {renderLabel()}
            <input
              type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={settings.placeholder || ''}
              className="flex-grow w-full px-2 py-1 bg-transparent border-b border-gray-300 focus:border-portfolio-orange outline-none text-gray-900 text-sm placeholder-gray-400"
              {...commonProps}
            />
          </div>
        );
      case 'textarea':
        return (
          <div style={style} className={`flex ${settings.titleLayout === 'horizontal' ? 'flex-row items-start' : 'flex-col'}`}>
            {renderLabel()}
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={settings.placeholder || ''}
              className="flex-grow w-full p-2 bg-transparent border border-gray-300 rounded focus:border-portfolio-orange outline-none text-gray-900 text-sm resize-none placeholder-gray-400"
              {...commonProps}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div style={style} className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="mr-2 rounded text-portfolio-orange focus:ring-portfolio-orange border-gray-300"
              disabled={readOnly}
            />
            <span className="text-gray-900 text-sm font-medium">{field.label}</span>
          </div>
        );
      case 'date':
      case 'time':
      case 'datetime-local':
      case 'datetime':
        return (
          <div style={style} className={`flex ${settings.titleLayout === 'horizontal' ? 'flex-row items-center' : 'flex-col'}`}>
            {renderLabel()}
            <input
              type={field.type === 'datetime' ? 'datetime-local' : field.type}
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="flex-grow w-full px-2 py-1 bg-transparent border-b border-gray-300 focus:border-portfolio-orange outline-none text-gray-900 text-sm"
              {...commonProps}
            />
          </div>
        );
      case 'signature':
      case 'image':
        return (
          <div style={style} className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/50 overflow-hidden">
            {settings.hideTitle ? null : (
              <label className={`text-xs font-medium text-gray-500 px-1 pt-1 ${settings.titleLayout === 'horizontal' ? 'mr-1 shrink-0' : ''}`}>
                {field.label}
                {settings.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="flex-grow border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
              {value ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={value} 
                    alt="Uploaded" 
                    className="w-full h-full object-contain" 
                  />
                  {!readOnly && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange(field.id, '');
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>
              ) : (
                <label className={`cursor-pointer w-full h-full flex flex-col items-center justify-center ${readOnly ? 'cursor-not-allowed' : ''}`}>
                  <RiUpload2Line className="text-xl text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 text-center px-1 leading-tight">
                    {field.type === 'signature' ? 'Sign' : 'Image'}
                  </span>
                  {!readOnly && (
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(field.id, e)}
                    />
                  )}
                </label>
              )}
            </div>
          </div>
        );
      case 'label':
      case 'header':
        return (
          <div style={style} className="flex items-center">
             <span className={`text-gray-900 ${field.type === 'header' ? 'font-bold text-lg' : 'text-sm'}`}>
               {field.label}
             </span>
          </div>
        );
      // Add more field types as needed (select, radio, etc.)
      default:
        return (
          <div style={style} className={`flex ${settings.titleLayout === 'horizontal' ? 'flex-row items-center' : 'flex-col'}`}>
            {renderLabel()}
            {/* Fallback input */}
            <input
               type="text"
               value={value}
               onChange={(e) => handleInputChange(field.id, e.target.value)}
               className="flex-grow w-full bg-transparent border-b border-gray-300 outline-none text-gray-900 text-sm placeholder-gray-400"
               {...commonProps}
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-900 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-800">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onClose} className="mr-4">
            <RiCloseLine className="text-xl" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">{formTemplate.name}</h1>
            <p className="text-sm text-gray-400">{formTemplate.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {formTemplate.formStructure.pages.length > 1 && (
            <div className="flex items-center mr-4 bg-dark-700 rounded-lg p-1">
              <span className="text-sm text-gray-400 mx-2">
                Page {currentPageIndex + 1} of {formTemplate.formStructure.pages.length}
              </span>
              <div className="flex">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   disabled={currentPageIndex === 0}
                   onClick={() => setCurrentPageIndex(prev => prev - 1)}
                 >
                   Prev
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   disabled={currentPageIndex === formTemplate.formStructure.pages.length - 1}
                   onClick={() => setCurrentPageIndex(prev => prev + 1)}
                 >
                   Next
                 </Button>
              </div>
            </div>
          )}
          
          {!readOnly && (
            <Button 
              variant="primary" 
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<RiSaveLine />}
            >
              Save Form
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-grow overflow-auto p-8 bg-dark-900 flex justify-center items-start">
        <div className="space-y-8"> {/* Removed max-w constraint to allow full form width */}
          
          {/* Form Page Container */}
          <div className="bg-white shadow-xl relative" 
                style={{ 
                  width: currentPage?.dimensions?.width || 595, 
                  height: currentPage?.dimensions?.height || 842,
                  margin: '0 auto',
                  overflow: 'hidden', // Ensure nothing goes outside
                  boxSizing: 'border-box'
                }}>
             {/* Render Grid Lines (Visual Reference) - Only show if fields are present, otherwise show grid content */}
             <div className="absolute inset-0 pointer-events-none"></div>

             {/* Render Fields - overlay on top with slight scale to ensure safety margin */}
             <div className="absolute inset-0 w-full h-full" style={{ transform: 'scale(0.93)', transformOrigin: 'top left' }}>
               {currentPage?.fields?.map((field: FormField) => (
                 <React.Fragment key={field.id}>
                   {renderField(field)}
                 </React.Fragment>
               ))}
             </div>
          </div>

          {/* Process Configuration Section (Bottom) */}
          {!readOnly && (
            <Card className="p-6 bg-dark-800 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <RiCheckLine className="mr-2 text-portfolio-orange" />
                Process Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Executor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Executor <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow bg-dark-700 border border-dark-600 rounded-md p-2 flex items-center min-h-[42px]">
                      {executor ? (
                        <div className="flex items-center text-white">
                          <div className="w-6 h-6 rounded-full bg-ai-blue/20 text-ai-blue flex items-center justify-center mr-2 text-xs">
                             {executor.avatar ? (
                               <img src={executor.avatar} alt={executor.name} className="w-full h-full rounded-full" />
                             ) : (
                               executor.name.charAt(0).toUpperCase()
                             )}
                          </div>
                          <span>{executor.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Select executor...</span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => openPeopleSelector('executor')}
                      leftIcon={<RiUserLine />}
                    >
                      Select
                    </Button>
                  </div>
                </div>

                {/* CC Recipients Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    CC Recipients
                  </label>
                  <div className="flex flex-col space-y-2">
                    <div className="bg-dark-700 border border-dark-600 rounded-md p-2 min-h-[42px] flex flex-wrap gap-2">
                      {ccRecipients.length > 0 ? (
                        ccRecipients.map(cc => (
                          <div key={cc.id} className="bg-dark-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <span className="mr-1">{cc.name}</span>
                            <button onClick={() => removeCc(cc.id)} className="hover:text-red-400">
                              <RiCloseLine />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm py-1">No CC recipients</span>
                      )}
                    </div>
                    <div className="flex justify-end">
                       <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openPeopleSelector('cc')}
                        leftIcon={<RiUserLine />}
                      >
                        Add CC
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* People Selector Modal */}
      <PeopleSelectorModal
        isOpen={showPeopleSelector}
        onClose={() => setShowPeopleSelector(false)}
        onSelect={handleUserSelect}
        title={peopleModalType === 'executor' ? 'Select Executor' : 'Add CC Recipient'}
        users={users}
        loading={loadingUsers}
      />
    </div>
  );
};
