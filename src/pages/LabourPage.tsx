import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiAddLine, RiGroupLine, RiCalendarCheckLine, RiTimeLine, RiFileListLine, RiUserLine, RiArrowUpLine, RiArrowDownLine, RiCheckLine, RiCloseLine, RiSearchLine, RiArrowRightSLine, RiFilter3Line, RiLayoutGridLine, RiListCheck, RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { MonthlyReturnTemplate } from '../components/forms/MonthlyReturnTemplate';
import { Dialog } from '../components/ui/Dialog';

interface Worker {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  timeIn?: string;
  timeOut?: string;
  hours: number;
  role: string;
  avatar: string;
}

interface LabourRecord {
  id: number;
  date: string;
  workers: number;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  project: string;
}

const LabourPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workerCount, setWorkerCount] = useState(1);
  const [hoursWorked, setHoursWorked] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'workers'>('records');
  const [statsTimeframe, setStatsTimeframe] = useState<'day' | 'week' | 'month'>('week');
  
  // Define interface for form data
  interface LabourFormData {
    returnDate?: string;
    project?: string;
    labourType?: string;
    submitterName?: string;
    numberOfWorkers?: number;
    hoursWorked?: number;
    tradeType?: string;
    workDescription?: string;
  }
  
  // Multi-step form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState<LabourFormData>({
    returnDate: new Date().toISOString().split('T')[0],
    numberOfWorkers: 1,
    hoursWorked: 8
  } as LabourFormData);
  
  // Add state for grid/list view and filters
  const [showGridView, setShowGridView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  
  // Mock labour data
  const [labourRecords, setLabourRecords] = useState<LabourRecord[]>([
    {
      id: 1,
      date: '2025-10-25',
      workers: 12,
      hours: 96,
      status: 'approved',
      project: 'Project Alpha'
    },
    {
      id: 2,
      date: '2025-10-24',
      workers: 10,
      hours: 80,
      status: 'approved',
      project: 'Project Alpha'
    },
    {
      id: 3,
      date: '2025-10-23',
      workers: 8,
      hours: 64,
      status: 'approved',
      project: 'Harbor Tower'
    },
    {
      id: 4,
      date: '2025-10-26',
      workers: 5,
      hours: 40,
      status: 'pending',
      project: 'Project Alpha'
    }
  ]);

  // Mock workers data
  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: '1',
      name: 'John Doe',
      status: 'present',
      timeIn: '07:30',
      timeOut: '17:30',
      hours: 10,
      role: 'Carpenter',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0062C3&color=fff'
    },
    {
      id: '2',
      name: 'Jane Smith',
      status: 'present',
      timeIn: '08:00',
      timeOut: '16:00',
      hours: 8,
      role: 'Electrician',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=465B7C&color=fff'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      status: 'late',
      timeIn: '09:30',
      hours: 6.5,
      role: 'Plumber',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=BB6904&color=fff'
    },
    {
      id: '4',
      name: 'Sarah Williams',
      status: 'absent',
      hours: 0,
      role: 'Painter',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Williams&background=5D5D5D&color=fff'
    }
  ]);

  // Stats data based on timeframe
  const getStatsData = () => {
    switch(statsTimeframe) {
      case 'day':
        return { workers: 8, hours: 64, attendance: 85 };
      case 'week':
        return { workers: 12, hours: 480, attendance: 92 };
      case 'month':
        return { workers: 15, hours: 2400, attendance: 88 };
      default:
        return { workers: 12, hours: 480, attendance: 92 };
    }
  };

  const statsData = getStatsData();
  
  const updateFormData = (newData: Partial<LabourFormData>) => {
    setFormData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  // Function to navigate between form steps
  const handleFormStepChange = (step: number) => {
    setFormStep(step);
  };

  // Function to handle form submission from any step
  const handleFormStepSubmit = (data: Record<string, any>) => {
    const typedData: Partial<LabourFormData> = {};
    
    // Parse numeric fields
    if (data.numberOfWorkers !== undefined) {
      const value = parseInt(data.numberOfWorkers);
      typedData.numberOfWorkers = isNaN(value) ? 0 : value;
    }
    
    if (data.hoursWorked !== undefined) {
      const value = parseFloat(data.hoursWorked);
      typedData.hoursWorked = isNaN(value) ? 0 : value;
    }
    
    // Copy other fields
    Object.keys(data).forEach(key => {
      if (key !== 'numberOfWorkers' && key !== 'hoursWorked') {
        (typedData as any)[key] = data[key];
      }
    });
    
    updateFormData(typedData);
    
    if (formStep < 3) {
      // Move to next step
      setFormStep(formStep + 1);
    } else {
      // Final submission
      handleSubmitReturn({ ...formData, ...typedData });
    }
  };
  
  // Function to handle ISO19650 labour return form submission
  const handleSubmitReturn = (formData: any) => {
    // Generate a new record ID
    const newId = labourRecords.length > 0 ? Math.max(...labourRecords.map(r => r.id)) + 1 : 1;
    
    // Create new labour record
    const newRecord: LabourRecord = {
      id: newId,
      date: formData.returnDate || new Date().toISOString().split('T')[0],
      workers: formData.numberOfWorkers || 1,
      hours: formData.hoursWorked || 8,
      status: 'pending',
      project: selectedProject?.name || 'Unknown Project'
    };
    
    // Add the new record
    setLabourRecords([newRecord, ...labourRecords]);
    
    // Close the form
    setShowNewReturn(false);
  };
  
  // Function to get records based on user role and project
  const getFilteredRecords = () => {
    let filtered = labourRecords;
    
    // Filter by role and project
    if (user?.role === 'admin' || user?.role === 'projectManager') {
      // Admin can see all records, but may filter by project
      if (filterType !== 'all') {
        filtered = filtered.filter(record => record.project === filterType);
      }
    } else {
      // For contractors and workers, only show their own project records
      filtered = filtered.filter(record => 
        (record.project === selectedProject?.name || record.project === 'Project Alpha')
      );
      
      // Apply project filter if specified
      if (filterType !== 'all') {
        filtered = filtered.filter(record => record.project === filterType);
      }
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.status === filterStatus);
    }
    
    // Apply date range filter
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(record => new Date(record.date) >= fromDate);
    }
    
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      filtered = filtered.filter(record => new Date(record.date) <= toDate);
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.project.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Filter workers based on search term
  const getFilteredWorkers = () => {
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  // Get worker status color
  const getWorkerStatusColor = (status: string) => {
    switch(status) {
      case 'present':
        return 'text-green-500';
      case 'late':
        return 'text-yellow-500';
      case 'absent':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get worker status icon
  const getWorkerStatusIcon = (status: string) => {
    switch(status) {
      case 'present':
        return <RiCheckLine className="text-green-500" />;
      case 'late':
        return <RiArrowDownLine className="text-yellow-500" />;
      case 'absent':
        return <RiCloseLine className="text-red-500" />;
      default:
        return null;
    }
  };

  // Clock in/out worker
  const handleToggleTimeStatus = (workerId: string) => {
    setWorkers(workers.map(worker => {
      if (worker.id === workerId) {
        if (!worker.timeIn) {
          // Clock in
          return {
            ...worker,
            status: 'present',
            timeIn: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
        } else if (!worker.timeOut) {
          // Clock out
          const timeIn = new Date(`2025-01-01T${worker.timeIn}`);
          const timeOut = new Date();
          const hours = Math.round((timeOut.getTime() - timeIn.getTime()) / 36000) / 100;
          
          return {
            ...worker,
            timeOut: timeOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            hours
          };
        } else {
          // Reset for a new day
          return {
            ...worker,
            timeIn: undefined,
            timeOut: undefined,
            hours: 0
          };
        }
      }
      return worker;
    }));
  };
  
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced Header with gradient and pattern */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
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
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
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
                  <RiGroupLine className="mr-3 text-blue-400" />
                  {t('labour.title')}
                </h1>
                <p className="text-blue-200 mt-2 max-w-2xl">
                  Track workforce attendance, manage worker hours, and generate accurate labour reports for project costing
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
                onClick={() => setShowNewReturn(true)}
                animated
                pulseEffect
                glowing
              >
                New Return
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiFileListLine />}
                animated
                glowing
              >
                Generate Report
              </Button>
            </motion.div>
          </div>

          {/* Live Stats Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-blue-500/20 rounded-full mr-4">
                <RiUserLine className="text-2xl text-blue-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Workers</div>
                <div className="text-2xl font-bold text-white">{statsData.workers}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-indigo-500/20 rounded-full mr-4">
                <RiTimeLine className="text-2xl text-indigo-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Total Hours</div>
                <div className="text-2xl font-bold text-white">{statsData.hours}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiCalendarCheckLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-blue-200">Attendance Rate</div>
                <div className="text-2xl font-bold text-white">{statsData.attendance}%</div>
              </div>
            </div>
          </motion.div>

          {/* Time Period Selector */}
          <div className="mt-4 flex justify-end">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 inline-flex">
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'day' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('day')}
              >
                Today
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'week' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('week')}
              >
                This Week
              </button>
              <button 
                className={`px-3 py-1 rounded-md text-sm ${statsTimeframe === 'month' ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'}`}
                onClick={() => setStatsTimeframe('month')}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Labour Return Form Modal */}
      {showNewReturn && (
        <AnimatePresence>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewReturn(false)}
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
                onClose={() => setShowNewReturn(false)}
                onSave={handleSubmitReturn}
              />
            </motion.div>
          </div>
        </AnimatePresence>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mr-4">
            <RiUserLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {getFilteredRecords().reduce((total, record) => total + record.workers, 0)}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Workers</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mr-4">
            <RiTimeLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {getFilteredRecords().reduce((total, record) => total + record.hours, 0)}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Hours</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center">
          <div className="rounded-full p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mr-4">
            <RiCalendarCheckLine className="text-2xl" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-semibold">
              {getFilteredRecords().length}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Returns</p>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold">{t('labour.title', 'Labour')}</h2>
            <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                {t('labour.viewAll', 'View all labour records')}
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
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('status')}
                    >
                      Status
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'project'
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('project')}
                    >
                      Project
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'date'
                          ? 'bg-white dark:bg-secondary-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('date')}
                    >
                      Date Range
                    </button>
                    
                    <div className="ml-auto">
                      <button
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition duration-200 flex items-center"
                        onClick={() => {
                          setFilterStatus('all');
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
                          {['all', 'approved', 'pending', 'rejected'].map((status) => (
                            <button
                              key={status}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterStatus === status
                                  ? status === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : status === 'approved'
                                    ? 'bg-green-600 text-white'
                                    : status === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterStatus(status)}
                            >
                              {status === 'all' && 'All Status'}
                              {status === 'approved' && 'Approved'}
                              {status === 'pending' && 'Pending'}
                              {status === 'rejected' && 'Rejected'}
                            </button>
                          ))}
                        </motion.div>
                      )}
                      
                      {activeFilterTab === 'project' && (
                        <motion.div
                          key="project"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-wrap gap-2"
                        >
                          {['all', 'Project Alpha', 'Harbor Tower', 'Residential Complex'].map((project) => (
                            <button
                              key={project}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterType === project
                                  ? project === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterType(project)}
                            >
                              {project === 'all' ? 'All Projects' : project}
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600"
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600"
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
                    
                    {filterStatus !== 'all' && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Status: </span>
                        <span className={`font-medium ${
                          filterStatus === 'approved' ? 'text-green-600 dark:text-green-400' : 
                          filterStatus === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                        </span>
                        <button 
                          className="ml-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                          onClick={() => setFilterStatus('all')}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {filterType !== 'all' && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Project: </span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{filterType}</span>
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
                        <span className="font-medium text-blue-600 dark:text-blue-400">
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
                    
                    {filterStatus === 'all' && filterType === 'all' && !filterDateFrom && !filterDateTo && (
                      <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Area status cards */}
          {showGridView ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {getFilteredRecords().map((record) => {
                const statusColor = record.status === 'approved' 
                  ? 'from-green-500 to-green-600' 
                  : record.status === 'pending' 
                    ? 'from-yellow-500 to-yellow-600' 
                    : 'from-red-500 to-red-600';
                  
                return (
                  <Card 
                    key={record.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    hover
                  >
                    <div className={`h-2 w-full bg-gradient-to-r ${statusColor}`}></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">{record.project}</h3>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          record.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          record.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-secondary-500 dark:text-secondary-400">Date</p>
                          <p className="font-medium">{record.date}</p>
                        </div>
                        <div>
                          <p className="text-secondary-500 dark:text-secondary-400">Workers</p>
                          <p className="font-medium">{record.workers}</p>
                        </div>
                        <div>
                          <p className="text-secondary-500 dark:text-secondary-400">Hours</p>
                          <p className="font-medium">{record.hours}</p>
                        </div>
                        <div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mt-2"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </motion.div>
          ) : (
          <div className="overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 dark:bg-secondary-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Workers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Hours
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
                  {getFilteredRecords().length > 0 ? (
                    getFilteredRecords().map((record) => (
                  <tr key={record.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {record.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {record.workers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                      {record.hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(record.status)}`}>
                        {t(`status.${record.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      >
                        {t('actions.view')}
                      </Button>
                    </td>
                  </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <RiFileListLine className="mx-auto text-4xl text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No labour records found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your filter criteria or create a new labour return</p>
                        <Button 
                          variant="primary" 
                          onClick={() => setShowNewReturn(true)}
                          leftIcon={<RiAddLine />}
                        >
                          New Return
                        </Button>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default LabourPage; 