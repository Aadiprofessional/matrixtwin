import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiAddLine, RiBrushLine, RiCheckboxCircleLine, RiCloseCircleLine, RiCalendarCheckLine, RiTaskLine, RiEyeLine, RiMapPinLine, RiFilterLine, RiUploadCloud2Line, RiArrowLeftRightLine, RiPercentLine, RiCheckLine, RiArrowRightLine, RiArrowLeftLine, RiListCheck, RiLayoutGridLine, RiFilter3Line, RiCloseLine } from 'react-icons/ri';
import { IconContext } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { DailyCleaningInspectionTemplate } from '../components/forms/DailyCleaningInspectionTemplate';
import { Dialog } from '../components/ui/Dialog';

interface CleansingRecord {
  id: number;
  date: string;
  area: string;
  status: 'completed' | 'pending' | 'failed';
  notes: string;
  project: string;
  completedBy?: string;
  imageUrl?: string;
}

interface AreaStats {
  area: string;
  cleanlinessScore: number;
  lastCleaned: string;
  nextDue: string;
  status: 'clean' | 'due' | 'overdue';
}

const CleansingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [showUploadView, setShowUploadView] = useState(false);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordArea, setRecordArea] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [showGridView, setShowGridView] = useState(false);
  const [selectedAreaStats, setSelectedAreaStats] = useState<AreaStats | null>(null);
  
  // Add filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  
  // Add state for multi-step form
  const [formStep, setFormStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [assignees, setAssignees] = useState<string[]>([]);
  
  // Mock cleansing data
  const [cleansingRecords, setCleansingRecords] = useState<CleansingRecord[]>([
    {
      id: 1,
      date: '2025-10-25',
      area: 'Main Building - Ground Floor',
      status: 'completed',
      notes: 'All areas cleaned and waste removed',
      project: 'Project Alpha',
      completedBy: 'John Doe',
      imageUrl: 'https://images.unsplash.com/photo-1520277739336-7bf67edfa768?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80'
    },
    {
      id: 2,
      date: '2025-10-24',
      area: 'Exterior Pathways',
      status: 'completed',
      notes: 'Debris removed, paths swept',
      project: 'Project Alpha',
      completedBy: 'Jane Smith'
    },
    {
      id: 3,
      date: '2025-10-26',
      area: 'Materials Storage Area',
      status: 'pending',
      notes: 'Scheduled for afternoon cleaning',
      project: 'Project Alpha'
    },
    {
      id: 4,
      date: '2025-10-23',
      area: 'Site Office',
      status: 'failed',
      notes: 'Insufficient cleaning, needs to be redone',
      project: 'Harbor Tower',
      completedBy: 'Mike Johnson'
    }
  ]);

  // Mock area statistics data
  const [areaStats, setAreaStats] = useState<AreaStats[]>([
    {
      area: 'Main Building - Ground Floor',
      cleanlinessScore: 94,
      lastCleaned: '2025-10-25',
      nextDue: '2025-10-28',
      status: 'clean'
    },
    {
      area: 'Main Building - First Floor',
      cleanlinessScore: 87,
      lastCleaned: '2025-10-22',
      nextDue: '2025-10-25',
      status: 'due'
    },
    {
      area: 'Main Building - Second Floor',
      cleanlinessScore: 90,
      lastCleaned: '2025-10-23',
      nextDue: '2025-10-26',
      status: 'due'
    },
    {
      area: 'Exterior Pathways',
      cleanlinessScore: 92,
      lastCleaned: '2025-10-24',
      nextDue: '2025-10-27',
      status: 'clean'
    },
    {
      area: 'Materials Storage Area',
      cleanlinessScore: 76,
      lastCleaned: '2025-10-20',
      nextDue: '2025-10-23',
      status: 'overdue'
    },
    {
      area: 'Site Office',
      cleanlinessScore: 65,
      lastCleaned: '2025-10-18',
      nextDue: '2025-10-21',
      status: 'overdue'
    },
    {
      area: 'Worker Facilities',
      cleanlinessScore: 88,
      lastCleaned: '2025-10-24',
      nextDue: '2025-10-27',
      status: 'clean'
    },
    {
      area: 'Waste Collection Point',
      cleanlinessScore: 85,
      lastCleaned: '2025-10-23',
      nextDue: '2025-10-26',
      status: 'due'
    }
  ]);

  // Calculate cleanliness metrics
  const getCleanlinessMetrics = () => {
    const areas = areaStats.length;
    const cleanAreas = areaStats.filter(a => a.status === 'clean').length;
    const dueAreas = areaStats.filter(a => a.status === 'due').length;
    const overdueAreas = areaStats.filter(a => a.status === 'overdue').length;
    const averageScore = Math.round(areaStats.reduce((sum, a) => sum + a.cleanlinessScore, 0) / areas);
    
    return {
      cleanAreas,
      dueAreas,
      overdueAreas,
      averageScore,
      complianceRate: Math.round((cleanAreas / areas) * 100)
    };
  };

  const metrics = getCleanlinessMetrics();

  // Mock cleaning schedule histogram data
  const scheduleData = [
    { day: 'Mon', count: 3 },
    { day: 'Tue', count: 5 },
    { day: 'Wed', count: 2 },
    { day: 'Thu', count: 4 },
    { day: 'Fri', count: 6 },
    { day: 'Sat', count: 1 },
    { day: 'Sun', count: 0 }
  ];
  
  // Areas options
  const cleaningAreas = [
    'Main Building - Ground Floor',
    'Main Building - First Floor',
    'Main Building - Second Floor',
    'Exterior Pathways',
    'Materials Storage Area',
    'Site Office',
    'Worker Facilities',
    'Waste Collection Point'
  ];
  
  // Function to handle the cleansing record form submission
  const handleSubmitRecord = (formData: any) => {
    // Create new cleansing record from form data
    const newRecord: CleansingRecord = {
      id: Date.now(),
      date: formData.inspectionDate || new Date().toISOString().split('T')[0],
      area: formData.location || 'Unknown Area',
      status: 'pending',
      notes: formData.checklistItems?.map((item: any) => item.remark).filter(Boolean).join(', ') || '',
      project: selectedProject?.name || 'Project Alpha'
    };
    
    // Add the new record to the list
    setCleansingRecords([newRecord, ...cleansingRecords]);
    
    // Close the form
    setShowNewRecord(false);
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
      handleSubmitRecord({ ...formData, ...data, assignees });
    }
  };
  
  // Function to get records based on filters
  const getFilteredRecords = () => {
    return cleansingRecords.filter(record => {
      // Filter by user role and project
      if (user?.role !== 'admin' && user?.role !== 'projectManager') {
        if (record.project !== selectedProject?.name && record.project !== 'Project Alpha') {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Get status info (color, text, etc.)
  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'completed':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          icon: <RiCheckboxCircleLine className="text-green-500" />
        };
      case 'pending':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          icon: <RiTaskLine className="text-yellow-500" />
        };
      case 'failed':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          icon: <RiCloseCircleLine className="text-red-500" />
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          icon: <RiTaskLine className="text-gray-500" />
        };
    }
  };
  
  // Get area status color
  const getAreaStatusColor = (status: string) => {
    switch(status) {
      case 'clean':
        return 'from-green-500 to-green-600';
      case 'due':
        return 'from-yellow-500 to-yellow-600';
      case 'overdue':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };
  
  // Handle area card click
  const handleAreaClick = (area: AreaStats) => {
    setSelectedAreaStats(area);
  };
  
  // Get filtered area stats
  const getFilteredAreaStats = () => {
    let filtered = areaStats;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(area => area.status === filterStatus);
    }
    
    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(area => 
        new Date(area.lastCleaned) >= new Date(filterDateFrom)
      );
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(area => 
        new Date(area.lastCleaned) <= new Date(filterDateTo)
      );
    }
    
    return filtered;
  };
  
  return (
    <div className="space-y-6">
      {/* Enhanced header with cleansing dashboard */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-green-800 via-green-700 to-emerald-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M50,0 L200,0 L200,200 L100,180 Q70,160 50,120 Q30,80 50,0"
              fill="url(#cleansingGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="cleansingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
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
                  <RiBrushLine className="mr-3 text-green-300" />
                  {t('cleansing.title')}
                </h1>
                <p className="text-green-200 mt-2 max-w-2xl">
                  Monitor cleanliness standards, track cleaning activities, and maintain a clean construction environment
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
                onClick={() => setShowNewRecord(true)}
                animated
                pulseEffect
                glowing
              >
                New Record
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiUploadCloud2Line />}
                onClick={() => setShowUploadView(true)}
                animated
                glowing
              >
                Upload Evidence
              </Button>
            </motion.div>
          </div>

          {/* Cleanliness Score Visualization */}
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
                  stroke="url(#cleansinessScoreGradient)" 
                  strokeWidth="10" 
                  strokeLinecap="round"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * metrics.averageScore / 100) }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="cleansinessScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-white">{metrics.averageScore}%</div>
                <div className="text-sm text-white/80">Cleanliness Score</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.cleanAreas}</div>
                  <div className="text-sm text-white/80">Clean Areas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.dueAreas}</div>
                  <div className="text-sm text-white/80">Due Soon</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.overdueAreas}</div>
                  <div className="text-sm text-white/80">Overdue</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{metrics.complianceRate}%</div>
                  <div className="text-sm text-white/80">Compliance Rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Cleanliness metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Average Score</p>
              <h3 className="text-3xl font-semibold mt-1">{metrics.averageScore}%</h3>
            </div>
            <div className={`p-2 rounded-full bg-opacity-10 ${metrics.averageScore >= 90 ? 'bg-green-500' : metrics.averageScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}>
              <RiPercentLine className={`text-xl ${metrics.averageScore >= 90 ? 'text-green-500' : metrics.averageScore >= 80 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="mt-4 w-full h-1 bg-secondary-200 dark:bg-secondary-800 rounded-full overflow-hidden">
            <div 
              className={`h-1 rounded-full ${metrics.averageScore >= 90 ? 'bg-green-500' : metrics.averageScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${metrics.averageScore}%` }}
            ></div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Clean Areas</p>
              <h3 className="text-3xl font-semibold mt-1 text-green-500">{metrics.cleanAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-green-500 bg-opacity-10">
              <RiCheckboxCircleLine className="text-xl text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-green-500">{Math.round((metrics.cleanAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Due for Cleaning</p>
              <h3 className="text-3xl font-semibold mt-1 text-yellow-500">{metrics.dueAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-yellow-500 bg-opacity-10">
              <RiCalendarCheckLine className="text-xl text-yellow-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-yellow-500">{Math.round((metrics.dueAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
        
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">Overdue</p>
              <h3 className="text-3xl font-semibold mt-1 text-red-500">{metrics.overdueAreas}</h3>
            </div>
            <div className="p-2 rounded-full bg-red-500 bg-opacity-10">
              <RiCloseCircleLine className="text-xl text-red-500" />
            </div>
          </div>
          <p className="mt-2 text-sm text-red-500">{Math.round((metrics.overdueAreas / areaStats.length) * 100)}% of total areas</p>
        </Card>
      </motion.div>
      
      {/* Area status cards */}
        <motion.div 
        className="w-full rounded-lg overflow-hidden mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
        <Card>
          <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold">Area Status</h2>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1">
                View cleanliness status of different areas
              </p>
            </div>
            <div className="flex space-x-2">
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
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
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
                          ? 'bg-white dark:bg-secondary-700 text-green-600 dark:text-green-400 border-b-2 border-green-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('status')}
                    >
                      Status
                    </button>
                    <button
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition duration-200 ${
                        activeFilterTab === 'date'
                          ? 'bg-white dark:bg-secondary-700 text-green-600 dark:text-green-400 border-b-2 border-green-600'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-white/50 dark:hover:bg-secondary-700/50'
                      }`}
                      onClick={() => setActiveFilterTab('date')}
                    >
                      Date Range
                    </button>
                    
                    <div className="ml-auto">
                      <button
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition duration-200 flex items-center"
                        onClick={() => {
                          setFilterStatus('all');
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
                          {['all', 'clean', 'due', 'overdue'].map((status) => (
                            <button
                              key={status}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 ${
                                filterStatus === status
                                  ? status === 'all'
                                    ? 'bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white'
                                    : status === 'clean'
                                    ? 'bg-green-600 text-white'
                                    : status === 'due'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-red-600 text-white'
                                  : 'bg-white dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-600'
                              }`}
                              onClick={() => setFilterStatus(status)}
                            >
                              {status === 'all' && 'All Status'}
                              {status === 'clean' && 'Clean'}
                              {status === 'due' && 'Due Soon'}
                              {status === 'overdue' && 'Overdue'}
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-green-600/50 focus:border-green-600"
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
                                className="w-full p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 focus:ring-2 focus:ring-green-600/50 focus:border-green-600"
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
                          filterStatus === 'clean' ? 'text-green-600 dark:text-green-400' : 
                          filterStatus === 'due' ? 'text-yellow-600 dark:text-yellow-400' :
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
                    
                    {(filterDateFrom || filterDateTo) && (
                      <div className="px-2 py-1 rounded-full text-xs bg-secondary-100 dark:bg-secondary-700 flex items-center">
                        <span className="mr-1">Date: </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
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
                    
                    {filterStatus === 'all' && !filterDateFrom && !filterDateTo && (
                      <span className="text-xs italic text-secondary-500 dark:text-secondary-400">No active filters</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {showGridView ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {getFilteredAreaStats().map((area) => (
            <Card 
              key={area.area} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAreaClick(area)}
              hover
            >
              <div className={`h-2 w-full bg-gradient-to-r ${getAreaStatusColor(area.status)}`}></div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{area.area}</h3>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    area.status === 'clean' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    area.status === 'due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-secondary-500 dark:text-secondary-400">Cleanliness</p>
                    <p className="font-medium">{area.cleanlinessScore}%</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 dark:text-secondary-400">Last Cleaned</p>
                    <p className="font-medium">{area.lastCleaned}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-secondary-500 dark:text-secondary-400">Next Due</p>
                    <p className={`font-medium ${
                      area.status === 'overdue' ? 'text-red-500' : 
                      area.status === 'due' ? 'text-yellow-500' : ''
                    }`}>{area.nextDue}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
            </div>
          ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Cleanliness Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Last Cleaned
                </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      Next Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {getFilteredAreaStats().map((area) => (
                    <tr key={area.area} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 cursor-pointer" onClick={() => handleAreaClick(area)}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white font-medium">
                        {area.area}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          area.status === 'clean' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          area.status === 'due' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {area.status.charAt(0).toUpperCase() + area.status.slice(1)}
                        </span>
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          area.cleanlinessScore >= 90 ? 'text-green-600 dark:text-green-400' :
                          area.cleanlinessScore >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {area.cleanlinessScore}%
                        </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-white">
                        {area.lastCleaned}
                    </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`${
                          area.status === 'overdue' ? 'text-red-600 dark:text-red-400 font-medium' : 
                          area.status === 'due' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 
                          'text-secondary-900 dark:text-white'
                        }`}>
                          {area.nextDue}
                        </span>
                    </td>
                  </tr>
                  ))}
            </tbody>
          </table>
        </div>
          )}
      </Card>
      </motion.div>
      
      {/* ISO19650 Cleansing Record Form Modal */}
      <AnimatePresence>
        {showNewRecord && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewRecord(false)}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <DailyCleaningInspectionTemplate
                onClose={() => setShowNewRecord(false)}
                onSave={handleSubmitRecord}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CleansingPage; 