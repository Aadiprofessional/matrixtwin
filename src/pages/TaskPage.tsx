import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RiAddLine, RiCalendarTodoLine, RiFilterLine, RiSearchLine, RiArrowLeftLine, RiArrowRightLine, RiCheckLine, RiListCheck, RiLayoutGridLine, RiFilter3Line, RiCloseLine, RiUserLine, RiTeamLine } from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';

// Define User interface
interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

// Task types
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'to-do' | 'in-progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  project: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
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
    { id: '2', name: 'Maria Garcia', role: 'Engineer', avatar: 'MG' },
    { id: '3', name: 'Alex Johnson', role: 'Site Manager', avatar: 'AJ' },
    { id: '4', name: 'Sarah Williams', role: 'Construction Manager', avatar: 'SW' },
    { id: '5', name: 'Robert Lee', role: 'Engineer', avatar: 'RL' },
    { id: '6', name: 'Emma Wilson', role: 'Architect', avatar: 'EW' },
    { id: '7', name: 'Michael Brown', role: 'Supervisor', avatar: 'MB' },
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
        className="w-full max-w-md max-h-[80vh] bg-dark-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden"
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
                    <div className="w-10 h-10 rounded-full bg-ai-blue-100 text-ai-blue-600 dark:bg-ai-blue-900/30 dark:text-ai-blue-400 flex items-center justify-center font-medium mr-3">
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

const TaskPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Add state for multi-step form
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [assignees, setAssignees] = useState<string[]>([]);
  
  // People selector modal state
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<User | null>(null);
  
  // UI state for grid/list view and filters
  const [showGridView, setShowGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  
  // Mock tasks data
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete foundation inspection',
      description: 'Conduct thorough inspection of foundation work in Zone A.',
      dueDate: '2025-10-20',
      status: 'completed',
      priority: 'high',
      assignedTo: 'John Smith',
      project: 'Corporate HQ',
      createdBy: 'Sarah Johnson',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-18',
      tags: ['inspection', 'foundation', 'zone-a']
    },
    {
      id: '2',
      title: 'Submit electrical wiring report',
      description: 'Complete and submit the inspection report for electrical wiring in sections B2-B5.',
      dueDate: '2025-10-25',
      status: 'in-progress',
      priority: 'medium',
      assignedTo: 'Michael Chen',
      project: 'Corporate HQ',
      createdBy: 'Sarah Johnson',
      createdAt: '2025-10-18',
      updatedAt: '2025-10-18',
      tags: ['electrical', 'report', 'inspection']
    },
    {
      id: '3',
      title: 'Schedule concrete delivery',
      description: 'Coordinate with suppliers for the concrete delivery for ground floor pouring.',
      dueDate: '2025-10-22',
      status: 'to-do',
      priority: 'high',
      assignedTo: 'Emily Davis',
      project: 'Residential Complex',
      createdBy: 'Robert Johnson',
      createdAt: '2025-10-19',
      updatedAt: '2025-10-19',
      tags: ['logistics', 'concrete', 'scheduling']
    },
    {
      id: '4',
      title: 'Update safety compliance documents',
      description: 'Review and update all safety compliance documentation for quarterly audit.',
      dueDate: '2025-10-30',
      status: 'delayed',
      priority: 'medium',
      assignedTo: 'David Wilson',
      project: 'Corporate HQ',
      createdBy: 'Sarah Johnson',
      createdAt: '2025-10-10',
      updatedAt: '2025-10-15',
      tags: ['documentation', 'safety', 'compliance']
    }
  ]);
  
  // Filter tasks based on search and status
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    
    // Priority filter
    if (filterType !== 'all' && task.priority !== filterType) return false;
    
    // Date range filter
    if (filterDateFrom) {
      const taskDate = new Date(task.dueDate);
      const fromDate = new Date(filterDateFrom);
      if (taskDate < fromDate) return false;
    }
    
    if (filterDateTo) {
      const taskDate = new Date(task.dueDate);
      const toDate = new Date(filterDateTo);
      if (taskDate > toDate) return false;
    }
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.assignedTo.toLowerCase().includes(query) ||
        task.project.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Styling based on status
  const statusStyles = {
    'to-do': 'bg-amber/10 text-amber border border-amber/20',
    'in-progress': 'bg-warning/10 text-warning border border-warning/20',
    'completed': 'bg-success/10 text-success border border-success/20',
    'delayed': 'bg-error/10 text-error border border-error/20'
  };
  
  // Styling based on priority
  const priorityStyles = {
    low: 'text-success',
    medium: 'text-amber',
    high: 'text-error'
  };
  
  // Function to handle form data updates
  const updateFormData = (data: Record<string, any>) => {
    setFormData({ ...formData, ...data });
  };

  // Function to navigate between form steps
  const handleFormStepChange = (step: number) => {
    setFormStep(step);
  };

  // Function to handle form submission from any step
  const handleFormStepSubmit = (data: Record<string, any>) => {
    updateFormData(data);
    
    if (formStep < 3) {
      // Move to next step
      setFormStep(formStep + 1);
    } else {
      // Final submission
      handleSubmitTask({ ...formData, ...data });
    }
  };

  // Function to handle the task form submission
  const handleSubmitTask = (data: any) => {
    // Create new task from form data
    const newTask: Task = {
      id: Date.now().toString(),
      title: data.taskTitle || 'New Task',
      description: data.taskDescription || '',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: 'to-do',
      priority: data.priority || 'medium',
      assignedTo: selectedAssignee?.name || user?.name || 'Unassigned',
      project: selectedProject?.name || 'Project Alpha',
      createdBy: user?.name || 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
    };
    
    // Add to tasks
    setTasks([newTask, ...tasks]);
    
    // Close form and reset steps
    setShowTaskModal(false);
    setFormStep(1);
    setFormData({});
    setAssignees([]);
    setSelectedAssignee(null);
  };
  
  // Function to open people selector
  const openPeopleSelector = () => {
    setShowPeopleSelector(true);
  };
  
  // Function to handle user selection from the modal
  const handleUserSelection = (selectedUser: User) => {
    setSelectedAssignee(selectedUser);
  };
  
  return (
    <div>
      {/* Enhanced Header with gradient and pattern */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M0,0 L100,0 Q70,50 100,100 L0,100 Z"
              fill="url(#gradient)" 
              className="opacity-30"
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
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
                  <RiCalendarTodoLine className="mr-3 text-amber-300" />
                  {t('tasks.title', 'Tasks')}
                </h1>
                <p className="text-amber-200 mt-2 max-w-2xl">
                  Manage and track project tasks, assign resources, and monitor progress to ensure timely completion
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
                onClick={() => setShowTaskModal(true)}
                animated
                pulseEffect
                glowing
              >
                New Task
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiCalendarTodoLine />}
                animated
                glowing
              >
                Task Calendar
              </Button>
            </motion.div>
          </div>

          {/* Task Stats Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-amber-500/20 rounded-full mr-4">
                <RiCalendarTodoLine className="text-2xl text-amber-300" />
              </div>
              <div>
                <div className="text-sm text-amber-200">Total Tasks</div>
                <div className="text-2xl font-bold text-white">{tasks.length}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-yellow-500/20 rounded-full mr-4">
                <RiCalendarTodoLine className="text-2xl text-yellow-300" />
              </div>
              <div>
                <div className="text-sm text-amber-200">In Progress</div>
                <div className="text-2xl font-bold text-white">
                  {tasks.filter(task => task.status === 'in-progress').length}
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-green-500/20 rounded-full mr-4">
                <RiCheckLine className="text-2xl text-green-300" />
              </div>
              <div>
                <div className="text-sm text-amber-200">Completed</div>
                <div className="text-2xl font-bold text-white">
                  {tasks.filter(task => task.status === 'completed').length}
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-red-500/20 rounded-full mr-4">
                <RiCalendarTodoLine className="text-2xl text-red-300" />
              </div>
              <div>
                <div className="text-sm text-amber-200">Delayed</div>
                <div className="text-2xl font-bold text-white">
                  {tasks.filter(task => task.status === 'delayed').length}
                </div>
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
                <IconContext.Provider value={{}}>
                  <div><RiSearchLine /></div>
                </IconContext.Provider>
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
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
                variant={statusFilter === 'to-do' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('to-do')}
              >
                To Do
              </Button>
              <Button 
                variant={statusFilter === 'in-progress' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('in-progress')}
              >
                In Progress
              </Button>
              <Button 
                variant={statusFilter === 'completed' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
              <Button 
                variant={statusFilter === 'delayed' ? 'ai' : 'ai-secondary'} 
                size="sm"
                onClick={() => setStatusFilter('delayed')}
              >
                Delayed
              </Button>
              
              <div className="ml-auto flex space-x-2">
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
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                  }`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <RiFilter3Line className={`text-lg ${showFilters ? 'mr-2' : 'mr-1'}`} />
                  <span className="text-sm font-medium">{showFilters ? 'Hide Filters' : 'Filter'}</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-b border-secondary-200 dark:border-secondary-700 overflow-hidden backdrop-blur-md mb-6"
          >
            <Card variant="ai">
              <div className="p-4 bg-gradient-to-r from-secondary-50/90 to-secondary-100/90 dark:from-secondary-800/90 dark:to-secondary-900/90">
                {/* Filter tabs */}
                <div className="flex flex-wrap mb-4 border-b border-secondary-200 dark:border-secondary-700 gap-1">
                  <button
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                      activeFilterTab === 'status'
                        ? 'bg-white dark:bg-secondary-700 text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                    }`}
                    onClick={() => setActiveFilterTab('status')}
                  >
                    Status
                  </button>
                  <button
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                      activeFilterTab === 'priority'
                        ? 'bg-white dark:bg-secondary-700 text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                    }`}
                    onClick={() => setActiveFilterTab('priority')}
                  >
                    Priority
                  </button>
                  <button
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                      activeFilterTab === 'date'
                        ? 'bg-white dark:bg-secondary-700 text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                    }`}
                    onClick={() => setActiveFilterTab('date')}
                  >
                    Due Date
                  </button>
                  
                  <div className="ml-auto">
                    <button
                      className="px-3 py-1.5 text-xs bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/50 transition duration-200 flex items-center"
                      onClick={() => {
                        setStatusFilter('all');
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
                        {['all', 'to-do', 'in-progress', 'completed', 'delayed'].map((status) => (
                          <button
                            key={status}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                              statusFilter === status
                                ? status === 'all'
                                  ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                  : status === 'to-do'
                                  ? 'bg-amber-600 text-white'
                                  : status === 'in-progress'
                                  ? 'bg-yellow-600 text-white'
                                  : status === 'completed'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                                : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                            }`}
                            onClick={() => setStatusFilter(status)}
                          >
                            {status === 'all' && 'All Status'}
                            {status === 'to-do' && 'To Do'}
                            {status === 'in-progress' && 'In Progress'}
                            {status === 'completed' && 'Completed'}
                            {status === 'delayed' && 'Delayed'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    
                    {activeFilterTab === 'priority' && (
                      <motion.div
                        key="priority"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2"
                      >
                        {['all', 'low', 'medium', 'high'].map((priority) => (
                          <button
                            key={priority}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                              filterType === priority
                                ? priority === 'all'
                                  ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                  : priority === 'low'
                                  ? 'bg-green-600 text-white'
                                  : priority === 'medium'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-red-600 text-white'
                                : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                            }`}
                            onClick={() => setFilterType(priority)}
                          >
                            {priority === 'all' && 'All Priorities'}
                            {priority === 'low' && 'Low'}
                            {priority === 'medium' && 'Medium'}
                            {priority === 'high' && 'High'}
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
                              className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
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
                              className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600"
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
                  
                  {statusFilter !== 'all' && (
                    <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                      <span className="mr-1">Status: </span>
                      <span className={`font-medium ${
                        statusFilter === 'to-do' ? 'text-amber-600 dark:text-amber-400' : 
                        statusFilter === 'in-progress' ? 'text-yellow-600 dark:text-yellow-400' :
                        statusFilter === 'completed' ? 'text-green-600 dark:text-green-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {statusFilter === 'to-do' ? 'To Do' : 
                         statusFilter === 'in-progress' ? 'In Progress' : 
                         statusFilter === 'completed' ? 'Completed' : 'Delayed'}
                      </span>
                      <button 
                        className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                        onClick={() => setStatusFilter('all')}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {filterType !== 'all' && (
                    <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                      <span className="mr-1">Priority: </span>
                      <span className={`font-medium ${
                        filterType === 'low' ? 'text-green-600 dark:text-green-400' : 
                        filterType === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      </span>
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
                      <span className="mr-1">Due Date: </span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
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
                  
                  {statusFilter === 'all' && filterType === 'all' && !filterDateFrom && !filterDateTo && (
                    <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          showGridView ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    variant="ai"
                    className="overflow-hidden hover:shadow-ai-glow transition-shadow duration-300 h-full"
                    hover
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskDetails(true);
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="w-full h-1" style={{
                        backgroundColor: task.status === 'to-do' ? '#3f87ff' :
                                        task.status === 'in-progress' ? '#f59e0b' :
                                        task.status === 'completed' ? '#10b981' : '#ef4444'
                      }} />
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{task.title}</h3>
                          <div className="flex items-center gap-2 ml-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[task.status]}`}>
                              {task.status === 'to-do' ? 'To Do' :
                              task.status === 'in-progress' ? 'In Progress' :
                              task.status === 'completed' ? 'Completed' : 'Delayed'}
                            </span>
                            <span className={`text-xs font-medium ${priorityStyles[task.priority]}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-3 line-clamp-2 flex-grow">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {task.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-dark-800/50 text-gray-400 px-2 py-1 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-auto">
                          <div>
                            <span className="block text-gray-400">Project:</span>
                            {task.project}
                          </div>
                          <div>
                            <span className="block text-gray-400">Assigned to:</span>
                            {task.assignedTo}
                          </div>
                          <div className="col-span-2">
                            <span className="block text-gray-400">Due:</span>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View (Original style)
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
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
                    setSelectedTask(task);
                    setShowTaskDetails(true);
                  }}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1 w-full h-1 md:h-auto" style={{
                      backgroundColor: task.status === 'to-do' ? '#3f87ff' :
                                      task.status === 'in-progress' ? '#f59e0b' :
                                      task.status === 'completed' ? '#10b981' : '#ef4444'
                    }} />
                    <div className="p-4 flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[task.status]}`}>
                            {task.status === 'to-do' ? 'To Do' :
                            task.status === 'in-progress' ? 'In Progress' :
                            task.status === 'completed' ? 'Completed' : 'Delayed'}
                          </span>
                          <span className={`text-xs font-medium ${priorityStyles[task.priority]}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {task.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-dark-800/50 text-gray-400 px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Project: {task.project}</span>
                          <span>Assigned to: {task.assignedTo}</span>
                        </div>
                        <div>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <IconContext.Provider value={{ className: "mx-auto text-4xl text-gray-400 mb-4" }}>
              <div><RiCalendarTodoLine /></div>
            </IconContext.Provider>
            <h3 className="text-xl font-medium mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or create a new task</p>
            <Button 
              variant="ai-gradient" 
              onClick={() => setShowTaskModal(true)}
              leftIcon={<div><RiAddLine /></div>}
            >
              Create Task
            </Button>
          </motion.div>
        )}
      </div>

      {/* Multi-step Task Form Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              className="w-full max-w-4xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                {/* Form Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-800 to-yellow-800">
                  <h2 className="text-xl font-display font-semibold text-white flex items-center">
                    <RiCalendarTodoLine className="mr-3" />
                    {t('tasks.newTask', 'New Task')}
                  </h2>
                  
                  {/* Step Indicator */}
                  <div className="mt-6 mb-2">
                    <div className="flex items-center">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          formStep === 1 ? 'bg-white text-amber-700' : 
                          formStep > 1 ? 'bg-green-500 text-white' : 'bg-white/30 text-white'
                        }`}>
                          {formStep > 1 ? <RiCheckLine className="text-lg" /> : 1}
                        </div>
                        <span className={`text-xs mt-1 ${
                          formStep >= 1 ? 'text-white' : 'text-white/50'
                        }`}>Basic Info</span>
                      </div>
                      
                      {/* Connector */}
                      <div className={`flex-1 h-1 mx-2 ${
                        formStep > 1 ? 'bg-green-500' : 'bg-white/30'
                      }`}></div>
                      
                      {/* Step 2 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          formStep === 2 ? 'bg-white text-amber-700' : 
                          formStep > 2 ? 'bg-green-500 text-white' : 'bg-white/30 text-white'
                        }`}>
                          {formStep > 2 ? <RiCheckLine className="text-lg" /> : 2}
                        </div>
                        <span className={`text-xs mt-1 ${
                          formStep >= 2 ? 'text-white' : 'text-white/50'
                        }`}>Details</span>
                      </div>
                      
                      {/* Connector */}
                      <div className={`flex-1 h-1 mx-2 ${
                        formStep > 2 ? 'bg-green-500' : 'bg-white/30'
                      }`}></div>
                      
                      {/* Step 3 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          formStep === 3 ? 'bg-white text-amber-700' : 'bg-white/30 text-white'
                        }`}>
                          3
                        </div>
                        <span className={`text-xs mt-1 ${
                          formStep >= 3 ? 'text-white' : 'text-white/50'
                        }`}>Assignment</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Step Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Basic Info */}
                    {formStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Create New Task</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Start by providing basic task information.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Task Title</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              placeholder="Enter task title"
                              value={formData.taskTitle || ''}
                              onChange={(e) => updateFormData({ taskTitle: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input 
                              type="date" 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              value={formData.dueDate || new Date().toISOString().split('T')[0]}
                              onChange={(e) => updateFormData({ dueDate: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              value={formData.priority || 'medium'}
                              onChange={(e) => updateFormData({ priority: e.target.value })}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Step 2: Details */}
                    {formStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Task Details</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Provide additional information about this task.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[100px]"
                              placeholder="Enter task description"
                              value={formData.taskDescription || ''}
                              onChange={(e) => updateFormData({ taskDescription: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Tags</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              placeholder="Enter tags separated by commas"
                              value={formData.tags || ''}
                              onChange={(e) => updateFormData({ tags: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Example: design, electrical, urgent</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Related Project</label>
                            <select 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                              value={formData.project || (selectedProject?.name || 'Project Alpha')}
                              onChange={(e) => updateFormData({ project: e.target.value })}
                            >
                              <option value="Project Alpha">Project Alpha</option>
                              <option value="Harbor Tower">Harbor Tower</option>
                              <option value="Residential Complex">Residential Complex</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Step 3: Assignment */}
                    {formStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-2">Assign Task</h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            Assign this task to team members and set notifications.
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Assignee
                            </label>
                            <div className="flex items-center space-x-2">
                              <div className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                {selectedAssignee ? selectedAssignee.name : 'Select assignee'}
                              </div>
                              <Button variant="outline" size="sm" onClick={openPeopleSelector}>
                                Add
                              </Button>
                            </div>
                          </div>

                          <div className="pt-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notification Settings</p>
                            
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  checked={formData.sendEmail || true}
                                  onChange={() => updateFormData({ sendEmail: !formData.sendEmail })}
                                  className="rounded-sm border-gray-300 text-ai-blue-600 focus:ring-ai-blue-600"
                                />
                                <span className="text-sm">Send email notification</span>
                              </label>
                              
                              <label className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  checked={formData.sendApp || true}
                                  onChange={() => updateFormData({ sendApp: !formData.sendApp })}
                                  className="rounded-sm border-gray-300 text-ai-blue-600 focus:ring-ai-blue-600"
                                />
                                <span className="text-sm">Send in-app notification</span>
                              </label>

                              <label className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  checked={formData.sendReminder || false}
                                  onChange={() => updateFormData({ sendReminder: !formData.sendReminder })}
                                  className="rounded-sm border-gray-300 text-ai-blue-600 focus:ring-ai-blue-600"
                                />
                                <span className="text-sm">Send reminder before due date</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Form Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <Button 
                    variant="ghost" 
                    leftIcon={<RiArrowLeftLine />}
                    onClick={() => {
                      if (formStep > 1) {
                        setFormStep(formStep - 1);
                      } else {
                        setShowTaskModal(false);
                      }
                    }}
                  >
                    {formStep > 1 ? 'Back' : 'Cancel'}
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    rightIcon={formStep === 3 ? <RiCheckLine /> : <RiArrowRightLine />}
                    onClick={() => {
                      if (formStep < 3) {
                        setFormStep(formStep + 1);
                      } else {
                        handleSubmitTask({
                          ...formData
                        });
                      }
                    }}
                  >
                    {formStep === 3 ? 'Submit' : 'Next'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* People Selector Modal */}
      <AnimatePresence>
        {showPeopleSelector && (
          <PeopleSelectorModal
            isOpen={showPeopleSelector}
            onClose={() => setShowPeopleSelector(false)}
            onSelect={handleUserSelection}
            title="Select Assignee"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Removing the duplicate task list section */}
      </motion.div>
    </div>
  );
};

export default TaskPage; 