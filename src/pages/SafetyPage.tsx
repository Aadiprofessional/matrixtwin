import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiAddLine, RiShieldCheckLine, RiAlarmWarningLine, RiFileWarningLine, RiPercentLine, RiLineChartLine, RiArrowUpLine, RiArrowDownLine, RiFilter3Line, RiBellLine, RiErrorWarningLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiFlowChart, RiSettings4Line, RiNotificationLine, RiUserLine, RiSearchLine, RiCloseLine, RiTeamLine, RiListCheck, RiLayoutGridLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { SafetyInspectionChecklistTemplate } from '../components/forms/SafetyInspectionChecklistTemplate';
import { Input } from '../components/ui/Input';

// Define UserSelection interface
interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

// Define ProcessNode interface
interface ProcessNode {
  id: string;
  type: 'start' | 'node' | 'end';
  name: string;
  executor?: string;
  settings: Record<string, any>;
}

// People selector modal component
const PeopleSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title: string;
}> = ({ isOpen, onClose, onSelect, title }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock users data
  const users: User[] = [
    { id: '1', name: 'John Smith', role: 'Project Manager', avatar: 'JS' },
    { id: '2', name: 'Maria Garcia', role: 'Safety Officer', avatar: 'MG' },
    { id: '3', name: 'Alex Johnson', role: 'Site Manager', avatar: 'AJ' },
    { id: '4', name: 'Sarah Williams', role: 'Construction Manager', avatar: 'SW' },
    { id: '5', name: 'Robert Lee', role: 'Engineer', avatar: 'RL' },
    { id: '6', name: 'Emma Wilson', role: 'Architect', avatar: 'EW' },
    { id: '7', name: 'Michael Brown', role: 'Safety Inspector', avatar: 'MB' },
    { id: '8', name: 'David Taylor', role: 'Contractor', avatar: 'DT' }
  ];
  
  // Filter users based on search
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Search by name or role..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[400px] p-2">
          {filteredUsers.length > 0 ? (
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
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center font-medium mr-3">
                      {user.avatar}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <RiUserLine className="text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.role}</div>
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

interface SafetyInspection {
  id: number;
  date: string;
  type: string;
  score: number;
  status: 'complete' | 'pending' | 'failed';
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
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewInspection, setShowNewInspection] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionType, setInspectionType] = useState('');
  const [filter, setFilter] = useState('all');
  const [chartTimeframe, setChartTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  
  // Add state for multi-step form
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [assignees, setAssignees] = useState<string[]>([]);
  
  // People selector modal state
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [peopleModalType, setPeopleModalType] = useState<'executor' | 'cc'>('executor');
  const [selectedCcs, setSelectedCcs] = useState<User[]>([]);
  
  // Process flow state
  const [processNodes, setProcessNodes] = useState<ProcessNode[]>([
    { id: 'start', type: 'start', name: 'Start', settings: { allowCreator: true, allowStakeholder: false } },
    { id: 'node1', type: 'node', name: 'New node1', executor: '', settings: { allowCreator: false, allowStakeholder: false } },
    { id: 'node2', type: 'node', name: 'New node2', executor: '', settings: { allowCreator: false, allowStakeholder: false } },
    { id: 'end', type: 'end', name: 'End', settings: {} }
  ]);
  const [selectedNode, setSelectedNode] = useState<ProcessNode>(processNodes[0]);
  
  // Mock safety data
  const [safetyInspections, setSafetyInspections] = useState<SafetyInspection[]>([
    {
      id: 1,
      date: '2025-10-25',
      type: 'Daily Site Safety Check',
      score: 92,
      status: 'complete',
      inspector: 'John Smith',
      project: 'Project Alpha',
      findings: 2
    },
    {
      id: 2,
      date: '2025-10-24',
      type: 'Fire Safety Inspection',
      score: 88,
      status: 'complete',
      inspector: 'Jane Doe',
      project: 'Project Alpha',
      findings: 3
    },
    {
      id: 3,
      date: '2025-10-26',
      type: 'Equipment Safety Check',
      score: 0,
      status: 'pending',
      inspector: 'Alex Wilson',
      project: 'Project Alpha',
      findings: 0
    },
    {
      id: 4,
      date: '2025-10-22',
      type: 'Daily Site Safety Check',
      score: 75,
      status: 'failed',
      inspector: 'Mike Brown',
      project: 'Harbor Tower',
      findings: 8
    }
  ]);

  // Mock safety incidents
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([
    {
      id: 1,
      date: '2025-10-20',
      type: 'Near Miss',
      severity: 'medium',
      description: 'Worker nearly struck by falling material',
      status: 'investigating',
      location: 'Floor 3, Section B',
      project: 'Project Alpha'
    },
    {
      id: 2,
      date: '2025-10-15',
      type: 'Minor Injury',
      severity: 'low',
      description: 'Cut on hand while handling materials',
      status: 'resolved',
      location: 'Material Storage Area',
      project: 'Project Alpha'
    },
    {
      id: 3,
      date: '2025-09-28',
      type: 'Equipment Failure',
      severity: 'high',
      description: 'Crane malfunction during operation',
      status: 'closed',
      location: 'Main Construction Site',
      project: 'Harbor Tower'
    }
  ]);
  
  // Mock safety alerts
  const [safetyAlerts, setSafetyAlerts] = useState([
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

  // Safety trend data (for charts)
  const getTrendData = () => {
    switch(chartTimeframe) {
      case 'week':
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          scores: [88, 92, 85, 90, 94, 89, 91],
          incidents: [1, 0, 1, 0, 0, 0, 0]
        };
      case 'month':
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          scores: [87, 90, 93, 91],
          incidents: [2, 1, 1, 0]
        };
      case 'quarter':
        return {
          labels: ['Jan', 'Feb', 'Mar'],
          scores: [82, 88, 91],
          incidents: [5, 3, 1]
        };
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          scores: [88, 92, 85, 90, 94, 89, 91],
          incidents: [1, 0, 1, 0, 0, 0, 0]
        };
    }
  };

  const trendData = getTrendData();
  
  // Calculate trend direction and percentage
  const getTrend = () => {
    const data = trendData.scores;
    const currentAvg = data.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
    const prevAvg = data.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
    const change = ((currentAvg - prevAvg) / prevAvg) * 100;
    
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(change).toFixed(1)
    };
  };

  const trend = getTrend();
  
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
  
  // Function to handle the ISO19650 safety inspection form submission
  const handleSubmitInspection = (data: any) => {
    // Generate a new inspection ID
    const newId = safetyInspections.length > 0 ? Math.max(...safetyInspections.map(i => i.id)) + 1 : 1;
    
    // Create the new inspection with default values and form data
    const newInspection: SafetyInspection = {
      id: newId,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'General',
      score: data.score || Math.floor(Math.random() * 30) + 70, // random score between 70-100 if not provided
      status: 'complete',
      inspector: user?.name || 'Anonymous',
      project: selectedProject?.name || 'Unknown Project',
      findings: data.findings || Math.floor(Math.random() * 5)
    };
    
    // Add the new inspection to the list
    setSafetyInspections([newInspection, ...safetyInspections]);
    
    // Reset form and close modal
    setShowNewInspection(false);
  };

  // Function to navigate between form steps
  const handleFormStepChange = (step: number) => {
    setFormStep(step);
  };

  // Function to handle form data updates
  const updateFormData = (data: Record<string, any>) => {
    setFormData({ ...formData, ...data });
  };

  // Function to handle form submission from any step
  const handleFormStepSubmit = (data: Record<string, any>) => {
    updateFormData(data);
    
    if (formStep < 3) {
      // Move to next step
      setFormStep(formStep + 1);
    } else {
      // Final submission
      handleSubmitInspection({ ...formData, ...data, assignees });
    }
  };
  
  // Function to get inspections based on user role and project
  const getFilteredInspections = () => {
    let filtered = safetyInspections;
    
    // Filter by role and project
    if (user?.role !== 'admin' && user?.role !== 'projectManager') {
      filtered = filtered.filter(inspection => 
        inspection.project === selectedProject?.name || inspection.project === 'Project Alpha'
      );
    }
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(inspection => inspection.status === filter);
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(inspection => inspection.type === filterType);
    }
    
    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(inspection => 
        new Date(inspection.date) >= new Date(filterDateFrom)
      );
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(inspection => 
        new Date(inspection.date) <= new Date(filterDateTo)
      );
    }
    
    return filtered;
  };

  // Function to get filtered incidents
  const getFilteredIncidents = () => {
    let filtered = safetyIncidents;
    
    // Filter by role and project
    if (user?.role !== 'admin' && user?.role !== 'projectManager') {
      filtered = filtered.filter(incident => 
        incident.project === selectedProject?.name || incident.project === 'Project Alpha'
      );
    }
    
    return filtered;
  };
  
  // Calculate average safety score
  const getAverageSafetyScore = () => {
    const completedInspections = getFilteredInspections().filter(i => i.status === 'complete');
    if (completedInspections.length === 0) return 0;
    
    const totalScore = completedInspections.reduce((sum, inspection) => sum + inspection.score, 0);
    return Math.round(totalScore / completedInspections.length);
  };
  
  // Get score color class
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

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

  // Function to add a new node
  const addNewNode = () => {
    // Create a new node ID
    const newNodeId = `node${processNodes.length}`;
    
    // Create the new node
    const newNode = {
      id: newNodeId,
      type: 'node' as const,
      name: `New node${processNodes.length}`,
      executor: '',
      settings: { allowCreator: false, allowStakeholder: false }
    };
    
    // Insert the new node before the end node
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
        const updatedNode = { ...selectedNode, executor: selectedUser.name };
        const updatedNodes = processNodes.map(node => 
          node.id === selectedNode.id ? updatedNode : node
        );
        setProcessNodes(updatedNodes);
        setSelectedNode(updatedNode);
      }
    } else if (peopleModalType === 'cc') {
      setSelectedCcs([...selectedCcs, selectedUser]);
      
      if (selectedNode) {
        const updatedNode = { 
          ...selectedNode, 
          settings: { 
            ...selectedNode.settings,
            cc: [...(selectedNode.settings.cc || []), selectedUser]
          } 
        };
        const updatedNodes = processNodes.map(node => 
          node.id === selectedNode.id ? updatedNode : node
        );
        setProcessNodes(updatedNodes);
        setSelectedNode(updatedNode);
      }
    }
  };
  
  // Function to remove a CC
  const removeUserFromCc = (userId: string) => {
    const updatedCcs = selectedCcs.filter(cc => cc.id !== userId);
    setSelectedCcs(updatedCcs);
    
    if (selectedNode) {
      const updatedSettings = { 
        ...selectedNode.settings,
        cc: selectedNode.settings.cc ? selectedNode.settings.cc.filter((cc: User) => cc.id !== userId) : []
      };
      
      const updatedNode = { 
        ...selectedNode, 
        settings: updatedSettings
      };
      
      const updatedNodes = processNodes.map(node => 
        node.id === selectedNode.id ? updatedNode : node
      );
      setProcessNodes(updatedNodes);
      setSelectedNode(updatedNode);
    }
  };
  
  // New state for grid view - default to false (horizontal/table view)
  const [showGridView, setShowGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');

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
                  animate={{ strokeDashoffset: 283 - (283 * getAverageSafetyScore() / 100) }}
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
                  {getAverageSafetyScore()}%
                </motion.div>
                <div className="text-sm text-white/70">Safety Score</div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center mb-3">
                <h3 className="text-xl font-semibold text-white">Safety Trend</h3>
                <div className={`ml-3 flex items-center text-sm ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {trend.direction === 'up' ? (
                    <RiArrowUpLine className="mr-1" />
                  ) : (
                    <RiArrowDownLine className="mr-1" />
                  )}
                  {trend.percentage}%
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
                {trendData.labels.map((label, index) => (
                  <div key={label} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-red-500 to-green-500 rounded-t-sm"
                      style={{ 
                        height: `${trendData.scores[index] / 100 * 100}px`,
                        background: `linear-gradient(to top, 
                          ${trendData.scores[index] < 75 ? '#ef4444' : trendData.scores[index] < 90 ? '#eab308' : '#22c55e'}, 
                          ${trendData.scores[index] < 75 ? '#f87171' : trendData.scores[index] < 90 ? '#fcd34d' : '#4ade80'}
                        )` 
                      }}
                    />
                    <div className="text-xs text-white/70 mt-1">{label}</div>
                    {trendData.incidents[index] > 0 && (
                      <div className="mt-1 px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] text-white">
                        {trendData.incidents[index]}
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
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SafetyInspectionChecklistTemplate
                onClose={() => setShowNewInspection(false)}
                onSave={handleSubmitInspection}
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
                {getFilteredInspections().filter(i => i.status === 'complete').length}
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
                {getFilteredInspections().filter(i => i.status === 'pending').length}
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
              {getFilteredInspections().reduce((total, inspection) => total + inspection.findings, 0)}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('safety.totalFindings')}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mr-4">
            <RiPercentLine className="text-2xl" />
          </div>
          <div>
            <h3 className={`text-2xl font-display font-semibold ${getScoreColorClass(getAverageSafetyScore())}`}>
              {getAverageSafetyScore()}%
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
                {getFilteredInspections().map((inspection) => {
                  const statusColor = inspection.status === 'complete' 
                    ? 'from-green-500 to-green-600' 
                    : inspection.status === 'pending' 
                      ? 'from-yellow-500 to-yellow-600' 
                      : 'from-red-500 to-red-600';
                  
                  return (
                    <Card 
                      key={inspection.id} 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      hover
                    >
                      <div className={`h-2 w-full bg-gradient-to-r ${statusColor}`}></div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-medium">{inspection.type}</h3>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            inspection.status === 'complete' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            inspection.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-secondary-500 dark:text-secondary-400">Date</p>
                            <p className="font-medium">{inspection.date}</p>
                          </div>
                          <div>
                            <p className="text-secondary-500 dark:text-secondary-400">Score</p>
                            <p className={`font-medium ${getScoreColorClass(inspection.score)}`}>{inspection.score}%</p>
                          </div>
                          <div>
                            <p className="text-secondary-500 dark:text-secondary-400">Inspector</p>
                            <p className="font-medium">{inspection.inspector}</p>
                          </div>
                          <div>
                            <p className="text-secondary-500 dark:text-secondary-400">Findings</p>
                            <p className="font-medium">{inspection.findings}</p>
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
                        Findings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                    {getFilteredInspections().map((inspection) => (
                      <tr key={inspection.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {inspection.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {inspection.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {inspection.project}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                          {inspection.inspector}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {inspection.status === 'pending' ? (
                            <span className="text-yellow-600 dark:text-yellow-400 inline-flex items-center">
                              <span className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400 mr-1.5 animate-pulse"></span>
                              {t('status.pending')}
                            </span>
                          ) : (
                            <span className={getScoreColorClass(inspection.score)}>
                              {inspection.score}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={inspection.findings > 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-secondary-900 dark:text-white"}>
                            {inspection.findings}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            {inspection.status === 'pending' ? t('actions.continue') : t('actions.view')}
                          </Button>
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

      {/* People Selector Modal */}
      <AnimatePresence>
        {showPeopleSelector && (
          <PeopleSelectorModal
            isOpen={showPeopleSelector}
            onClose={() => setShowPeopleSelector(false)}
            onSelect={handleUserSelection}
            title={peopleModalType === 'executor' ? 'Select Executor' : 'Add People to CC'}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyPage; 