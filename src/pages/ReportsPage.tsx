import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  RiBarChartBoxLine, 
  RiFileChartLine, 
  RiFileList3Line, 
  RiDownload2Line,
  RiAddLine,
  RiFilterLine,
  RiCalendarLine,
  RiBuilding2Line,
  RiUserLine,
  RiListCheck2,
  RiPieChartLine,
  RiLineChartLine,
  RiFileTransferLine
} from 'react-icons/ri';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { Dialog } from '../components/ui/Dialog';

interface Project {
  id: string;
  name: string;
  status: string;
}

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject, setSelectedProject, projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewReport, setShowNewReport] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Stats for the reports page
  const reportStats = {
    totalReports: 28,
    generatedThisMonth: 12,
    scheduledReports: 5
  };
  
  // Mock reports data
  const reports = [
    {
      id: 1,
      title: 'Daily Site Progress Report',
      type: 'daily',
      date: '2025-10-20',
      project: 'Project Alpha',
      author: 'John Smith',
      status: 'complete'
    },
    {
      id: 2,
      title: 'Weekly Safety Inspection',
      type: 'weekly',
      date: '2025-10-15',
      project: 'Harbor Tower',
      author: 'Emily Johnson',
      status: 'complete'
    },
    {
      id: 3,
      title: 'Monthly Progress Summary',
      type: 'monthly',
      date: '2025-09-30',
      project: 'Metro Station',
      author: 'John Smith',
      status: 'complete'
    },
    {
      id: 4,
      title: 'Incident Report',
      type: 'incident',
      date: '2025-10-18',
      project: 'Project Alpha',
      author: 'David Wilson',
      status: 'pending'
    },
    {
      id: 5,
      title: 'Equipment Inspection Report',
      type: 'inspection',
      date: '2025-10-12',
      project: 'Harbor Tower',
      author: 'Sarah Miller',
      status: 'complete'
    }
  ];
  
  // Filtered reports based on search query
  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle generating a new report
  const handleGenerateReport = () => {
    // Would integrate with API in a real app
    console.log('Generating report:', {
      type: reportType,
      dateRange,
      project: selectedProject
    });
    
    setShowNewReport(false);
    setReportType('daily');
    setDateRange({ start: '', end: '' });
    setSelectedProject(null);
  };
  
  // Get icon for report type
  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <RiFileList3Line className="text-blue-500" />;
      case 'weekly': return <RiCalendarLine className="text-green-500" />;
      case 'monthly': return <RiBarChartBoxLine className="text-purple-500" />;
      case 'incident': return <RiListCheck2 className="text-red-500" />;
      case 'inspection': return <RiFileChartLine className="text-orange-500" />;
      default: return <RiFileList3Line className="text-gray-500" />;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Enhanced header with gradient background */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 bottom-0 w-1/3 h-1/2">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M50,0 L200,0 L200,200 L50,150 Q30,100 50,0"
              fill="url(#reportGradient)" 
              className="opacity-30"
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="reportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
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
                  <RiBarChartBoxLine className="mr-3 text-emerald-300" />
                  {t('reports.title', 'Reports')}
                </h1>
                <p className="text-emerald-200 mt-2 max-w-2xl">
                  Generate insightful reports, analyze project data, and track progress metrics
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
                onClick={() => setShowNewReport(true)}
                animated
                pulseEffect
                glowing
              >
                {t('reports.generate', 'Generate Report')}
              </Button>
              <Button 
                variant="futuristic"
                leftIcon={<RiFileTransferLine />}
                animated
                glowing
              >
                Export All
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
              <div className="p-3 bg-emerald-500/20 rounded-full mr-4">
                <RiFileChartLine className="text-2xl text-emerald-300" />
              </div>
              <div>
                <div className="text-sm text-emerald-200">Total Reports</div>
                <div className="text-2xl font-bold text-white">{reportStats.totalReports}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-emerald-500/20 rounded-full mr-4">
                <RiPieChartLine className="text-2xl text-emerald-300" />
              </div>
              <div>
                <div className="text-sm text-emerald-200">This Month</div>
                <div className="text-2xl font-bold text-white">{reportStats.generatedThisMonth}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-emerald-500/20 rounded-full mr-4">
                <RiLineChartLine className="text-2xl text-emerald-300" />
              </div>
              <div>
                <div className="text-sm text-emerald-200">Scheduled</div>
                <div className="text-2xl font-bold text-white">{reportStats.scheduledReports}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Search and filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<RiFilterLine className="text-secondary-500" />}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Reports list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{getReportTypeIcon(report.type)}</div>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  report.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {report.status === 'complete' ? 'Complete' : 'Pending'}
                </span>
              </div>
              
              <h3 className="font-display font-semibold text-lg text-secondary-900 dark:text-white mb-1">
                {report.title}
              </h3>
              
              <div className="flex flex-col space-y-1 text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                <div className="flex items-center">
                  <RiCalendarLine className="mr-2 text-secondary-500" />
                  {report.date}
                </div>
                <div className="flex items-center">
                  <RiBuilding2Line className="mr-2 text-secondary-500" />
                  {report.project}
                </div>
                <div className="flex items-center">
                  <RiUserLine className="mr-2 text-secondary-500" />
                  {report.author}
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  leftIcon={<RiDownload2Line />}
                  className="text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                >
                  {t('reports.download')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>
      
      {/* New Report Dialog */}
      <Dialog
        isOpen={showNewReport}
        onClose={() => setShowNewReport(false)}
        title={t('reports.newReport')}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('reports.reportType')}
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Daily Progress Report</option>
              <option value="weekly">Weekly Summary Report</option>
              <option value="monthly">Monthly Progress Report</option>
              <option value="safety">Safety Compliance Report</option>
              <option value="financial">Financial Status Report</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('reports.startDate')}
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('reports.endDate')}
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('reports.project')}
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project || null);
              }}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={() => setShowNewReport(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleGenerateReport}>
              {t('reports.generate')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ReportsPage; 