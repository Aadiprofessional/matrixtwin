import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import * as RiIcons from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { createForm, getForms, respondToForm, updateFormStatus, FormResponse } from '../api/forms';
import { UserSelectionModal } from '../components/modals/UserSelectionModal';
import { generateFormPdf } from '../utils/pdfUtils';

// Import only the template components we need
import { InspectionCheckFormTemplate } from '../components/forms/InspectionCheckFormTemplate';
import { SurveyCheckFormTemplate } from '../components/forms/SurveyCheckFormTemplate';

// Types
interface RfiItem extends FormResponse {
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high';
  responseDate?: string;
  response?: string;
  assignedTo?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

// RFI Page component
const RfiPage: React.FC = () => {
  // State
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      loadRfis();
      fetchUsers();
    }
  }, [selectedProject]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      if (!user?.id) return;

      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/auth/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadRfis = async () => {
    try {
      if (user && selectedProject) {
        const forms = await getForms(user.id, selectedProject.id, 'rfi');
        // Transform API response to RfiItem format
        const transformedForms = forms.map(form => ({
          ...form,
          title: form.name,
          description: form.description,
          submittedBy: form.created_by.name,
          submittedDate: form.created_at,
          status: form.status as 'pending' | 'answered' | 'closed',
          priority: form.priority as 'low' | 'medium' | 'high',
          assignedTo: form.form_assignments?.[0]?.users.name
        }));
        setRfiItems(transformedForms);
      }
    } catch (error) {
      console.error('Error loading RFIs:', error);
    }
  };
  
  // Filter RFIs based on search and status
  const filteredRfis = rfiItems.filter((rfi) => {
    // Status filter
    if (statusFilter !== 'all' && rfi.status !== statusFilter) return false;
    
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
    }
  };
  
  // Priority styles
  const priorityStyles = {
    low: 'text-success',
    medium: 'text-ai-blue',
    high: 'text-error'
  };

  // Handle form submission from templates
  const handleFormSubmit = async (data: any) => {
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

      setGeneratedPdf(pdf);
      setFormData(data);
      setShowUserSelection(true);
      setShowFormSelector(false);
      setInspectionTemplateVisible(false);
      setSurveyTemplateVisible(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  // Define available templates
  const availableTemplates = [
    {
      id: 'inspection-check',
      title: 'Inspection Check Form',
      description: 'Request inspection check for construction work',
      icon: <RiIcons.RiCheckboxLine className="text-indigo-500 mr-2 text-xl" />
    },
    {
      id: 'survey-check',
      title: 'Survey Check Form',
      description: 'Request survey verification for site measurements',
      icon: <RiIcons.RiRulerLine className="text-purple-500 mr-2 text-xl" />
    }
  ];

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
                  <RiIcons.RiFileTextLine className="mr-3 text-purple-300" />
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
                onClick={() => setShowFormSelector(true)}
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
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={statusFilter === 'all' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button 
                variant={statusFilter === 'answered' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('answered')}
              >
                Answered
              </Button>
              <Button 
                variant={statusFilter === 'closed' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('closed')}
              >
                Closed
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredRfis.length > 0 ? (
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
                variant="ai"
                className="p-0 overflow-hidden hover:shadow-ai-glow transition-shadow duration-300"
                hover
                onClick={() => {
                  setSelectedRfi(rfi);
                  setShowRfiDetails(true);
                }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1 w-full h-1 md:h-auto" style={{
                    backgroundColor: rfi.status === 'pending' ? '#3f87ff' : 
                                   rfi.status === 'answered' ? '#10b981' : '#6b7280'
                  }} />
                  <div className="p-4 flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                      <h3 className="text-lg font-semibold">{rfi.title}</h3>
                      <div className="flex items-center gap-2 mt-1 sm:mt-0">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[rfi.status].bg} ${statusStyles[rfi.status].text} border ${statusStyles[rfi.status].border}`}>
                          {rfi.status.charAt(0).toUpperCase() + rfi.status.slice(1)}
                        </span>
                        <span className={`text-xs font-medium ${priorityStyles[rfi.priority]}`}>
                          {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-3 line-clamp-2">
                      {rfi.description}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span>From: {rfi.submittedBy}</span>
                        {rfi.assignedTo && <span>To: {rfi.assignedTo}</span>}
                      </div>
                      <div className="mt-1 sm:mt-0">
                        Submitted: {new Date(rfi.submittedDate).toLocaleDateString()}
                      </div>
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
              onClick={() => setShowFormSelector(true)}
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
              className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl"
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
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <InspectionCheckFormTemplate
                onClose={() => setInspectionTemplateVisible(false)}
                onSave={handleFormSubmit}
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
                onClose={() => setSurveyTemplateVisible(false)}
                onSave={handleFormSubmit}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* RFI Details Modal */}
      <AnimatePresence>
        {showRfiDetails && selectedRfi && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowRfiDetails(false)}
          >
            <motion.div
              className="bg-dark-950 rounded-xl shadow-ai-glow border border-ai-blue/20 max-w-3xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-dark-800 flex justify-between items-center">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                    selectedRfi.status === 'pending' ? 'bg-ai-blue' : 
                    selectedRfi.status === 'answered' ? 'bg-success' : 'bg-secondary-500'
                  }`}></span>
                  <h2 className="text-xl font-display font-semibold text-white">RFI Details</h2>
                </div>
                <button 
                  onClick={() => setShowRfiDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <div><RiIcons.RiCloseLine className="text-xl" /></div>
                </button>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">{selectedRfi.title}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Submitted By</p>
                    <p>{selectedRfi.submittedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submission Date</p>
                    <p>{new Date(selectedRfi.submittedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={statusStyles[selectedRfi.status].text}>
                      {selectedRfi.status.charAt(0).toUpperCase() + selectedRfi.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className={priorityStyles[selectedRfi.priority]}>
                      {selectedRfi.priority.charAt(0).toUpperCase() + selectedRfi.priority.slice(1)}
                    </p>
                  </div>
                  {selectedRfi.assignedTo && (
                    <div>
                      <p className="text-sm text-gray-500">Assigned To</p>
                      <p>{selectedRfi.assignedTo}</p>
                    </div>
                  )}
                  {selectedRfi.responseDate && (
                    <div>
                      <p className="text-sm text-gray-500">Response Date</p>
                      <p>{new Date(selectedRfi.responseDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <Card variant="ai" className="p-4">
                    <p className="whitespace-pre-line">{selectedRfi.description}</p>
                  </Card>
                </div>
                
                {selectedRfi.response && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Response</p>
                    <Card variant="ai" className="p-4">
                      <p className="whitespace-pre-line">{selectedRfi.response}</p>
                    </Card>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-8">
                  {selectedRfi.status === 'pending' && (
                    <>
                      <Button 
                        variant="ai-secondary"
                        onClick={() => {
                          setShowResponseForm(true);
                          setShowRfiDetails(false);
                        }}
                      >
                        Respond
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-error/30 text-error hover:bg-error/10"
                        onClick={() => {
                          closeRfi(selectedRfi.id);
                        }}
                      >
                        Close RFI
                      </Button>
                    </>
                  )}
                  
                  {selectedRfi.status === 'answered' && (
                    <Button 
                      variant="outline"
                      className="border-secondary-500/30 text-secondary-500 hover:bg-secondary-500/10"
                      onClick={() => {
                        closeRfi(selectedRfi.id);
                      }}
                    >
                      Close RFI
                    </Button>
                  )}
                  
                  <Button 
                    variant="ai"
                    onClick={() => setShowRfiDetails(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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
    </div>
  );
};

export default RfiPage; 