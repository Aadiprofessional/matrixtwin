import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  RiPieChartLine, 
  RiLineChartLine, 
  RiBarChartLine,
  RiFilterLine,
  RiRefreshLine,
  RiDownload2Line,
  RiArrowDownSLine,
  RiCalendarLine
} from 'react-icons/ri';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [selectedProject, setSelectedProject] = useState('all');
  
  // Mock projects data
  const projects = [
    { id: 'all', name: 'All Projects' },
    { id: '1', name: 'Project Alpha' },
    { id: '2', name: 'Harbor Tower' },
    { id: '3', name: 'Metro Station' },
    { id: '4', name: 'Corporate HQ' }
  ];
  
  // Chart colors based on theme
  const chartColors = {
    primary: darkMode ? '#FF5722' : '#FF5722',
    primaryTransparent: darkMode ? 'rgba(255, 87, 34, 0.2)' : 'rgba(255, 87, 34, 0.2)',
    secondary: darkMode ? '#757575' : '#757575',
    accent: darkMode ? '#ff9800' : '#ff9800',
    success: darkMode ? '#4caf50' : '#4caf50',
    warning: darkMode ? '#ff9800' : '#ff9800',
    error: darkMode ? '#f44336' : '#f44336',
    ai: {
      blue: '#FF5722',
      purple: '#ff9800',
      teal: '#ffcc80',
      pink: '#e65100',
    },
    gridColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    textColor: darkMode ? '#e0e0e0' : '#212121',
  };
  
  // Project Progress Chart
  const progressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Planned',
        data: [10, 25, 40, 60, 75, 85],
        borderColor: chartColors.secondary,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 2,
      },
      {
        label: 'Actual',
        data: [5, 20, 35, 50, 70, 80],
        borderColor: chartColors.ai.blue,
        backgroundColor: chartColors.primaryTransparent,
        fill: true,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };
  
  const progressOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor,
        },
        title: {
          display: true,
          text: 'Completion %',
          color: chartColors.textColor,
        },
      },
      x: {
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: chartColors.textColor,
        },
      },
    },
  };
  
  // Task Status Chart
  const taskStatusData = {
    labels: ['Complete', 'In Progress', 'Not Started', 'Delayed'],
    datasets: [
      {
        data: [35, 25, 30, 10],
        backgroundColor: [
          chartColors.success,
          chartColors.ai.blue,
          chartColors.ai.teal,
          chartColors.error,
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: chartColors.textColor,
        },
      },
    },
  };
  
  // Resource Allocation Chart
  const resourceData = {
    labels: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Overhead'],
    datasets: [
      {
        label: 'Budget',
        data: [30, 25, 15, 20, 10],
        backgroundColor: chartColors.ai.purple,
      },
      {
        label: 'Actual',
        data: [28, 22, 18, 20, 12],
        backgroundColor: chartColors.ai.teal,
      },
    ],
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor,
        },
        title: {
          display: true,
          text: 'Budget %',
          color: chartColors.textColor,
        },
      },
      x: {
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: chartColors.textColor,
        },
      },
    },
  };
  
  // Incident Trends Chart
  const incidentData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    datasets: [
      {
        label: 'Safety Incidents',
        data: [3, 2, 4, 1, 0, 1, 0, 2, 1],
        borderColor: chartColors.error,
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Near Misses',
        data: [5, 4, 7, 3, 4, 2, 3, 5, 2],
        borderColor: chartColors.warning,
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };
  
  return (
    <div className="pb-8 pt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
            {t('analytics.title', 'Analytics')}
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Data insights and visualization for your projects
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Button 
            variant="outline"
            leftIcon={<RiRefreshLine />}
            className="border-white/10 hover:bg-white/5 text-white"
          >
            Refresh
          </Button>
          <Button 
            variant="primary"
            leftIcon={<RiDownload2Line />}
            className="bg-portfolio-orange hover:bg-portfolio-orange-hover text-black"
          >
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card variant="ai-dark" className="p-6 flex items-center">
          <div className="p-3 bg-portfolio-orange/20 rounded-full mr-4">
            <RiPieChartLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Insights</div>
            <div className="text-2xl font-bold text-white">24</div>
          </div>
        </Card>
        
        <Card variant="ai-dark" className="p-6 flex items-center">
          <div className="p-3 bg-portfolio-orange/20 rounded-full mr-4">
            <RiLineChartLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Performance</div>
            <div className="text-2xl font-bold text-white">92%</div>
          </div>
        </Card>
        
        <Card variant="ai-dark" className="p-6 flex items-center">
          <div className="p-3 bg-portfolio-orange/20 rounded-full mr-4">
            <RiBarChartLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Data Points</div>
            <div className="text-2xl font-bold text-white">15.2K</div>
          </div>
        </Card>
      </div>

      {/* Analytics Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-6"
      >
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Project
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-10 py-2 bg-white dark:bg-dark-800 border border-secondary-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <RiArrowDownSLine className="text-secondary-500" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Time Period
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-10 py-2 bg-white dark:bg-dark-800 border border-secondary-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <RiArrowDownSLine className="text-secondary-500" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-secondary-900 dark:text-white">
                Project Progress
              </h2>
              <div className="text-secondary-500 dark:text-secondary-400">
                <RiLineChartLine />
              </div>
            </div>
            <div className="h-64">
              <Line data={progressData} options={progressOptions} />
            </div>
          </Card>
        </motion.div>
        
        {/* Task Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-secondary-900 dark:text-white">
                Task Status Distribution
              </h2>
              <div className="text-secondary-500 dark:text-secondary-400">
                <RiPieChartLine />
              </div>
            </div>
            <div className="h-64">
              <Doughnut data={taskStatusData} options={doughnutOptions} />
            </div>
          </Card>
        </motion.div>
        
        {/* Resource Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-secondary-900 dark:text-white">
                Resource Allocation
              </h2>
              <div className="text-secondary-500 dark:text-secondary-400">
                <RiBarChartLine />
              </div>
            </div>
            <div className="h-64">
              <Bar data={resourceData} options={barOptions} />
            </div>
          </Card>
        </motion.div>
        
        {/* Safety Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-secondary-900 dark:text-white">
                Safety Incident Trends
              </h2>
              <div className="text-secondary-500 dark:text-secondary-400">
                <RiLineChartLine />
              </div>
            </div>
            <div className="h-64">
              <Line data={incidentData} options={progressOptions} />
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-6"
      >
        <Card className="p-4">
          <h2 className="text-lg font-display font-semibold text-secondary-900 dark:text-white mb-4">
            Key Performance Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary-100 dark:bg-dark-800 rounded-lg">
              <div className="text-secondary-500 dark:text-secondary-400 mb-2">
                <RiCalendarLine className="text-xl" />
              </div>
              <div className="text-2xl font-semibold text-secondary-900 dark:text-white">
                87%
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                On-Time Completion
              </div>
            </div>
            
            <div className="p-4 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <div className="text-primary-500 mb-2">
                <RiBarChartLine className="text-xl" />
              </div>
              <div className="text-2xl font-semibold text-secondary-900 dark:text-white">
                92%
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Budget Adherence
              </div>
            </div>
            
            <div className="p-4 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <div className="text-success-500 mb-2">
                <RiPieChartLine className="text-xl" />
              </div>
              <div className="text-2xl font-semibold text-secondary-900 dark:text-white">
                95%
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Quality Compliance
              </div>
            </div>
            
            <div className="p-4 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <div className="text-warning-500 mb-2">
                <RiLineChartLine className="text-xl" />
              </div>
              <div className="text-2xl font-semibold text-secondary-900 dark:text-white">
                1.2
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Incident Rate
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage; 