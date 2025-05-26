import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  RiCalendarCheckLine,
  RiAlarmWarningLine,
  RiShieldCheckLine,
  RiMore2Fill,
  RiArrowRightLine,
  RiTimeLine,
  RiPieChartLine,
  RiLineChartLine,
  RiBarChartLine,
  RiRobot2Line,
  RiBrainLine,
  RiDashboardLine,
  RiGroupLine,
  RiBrushLine,
  RiBuilding4Line,
  RiFileList3Line
} from 'react-icons/ri';
import { IconContext } from 'react-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects } from '../contexts/ProjectContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getUserInfo } from '../utils/userInfo';

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

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { selectedProject } = useProjects();
  const [localSelectedProject, setLocalSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);
  const { projectId } = useParams();
  
  useEffect(() => {
    console.log('Selected Project ID:', selectedProject?.id);
  }, [selectedProject]);
  
  // Filter projects based on user role
  const filteredProjects = React.useMemo(() => {
    if (!user) return [];
    
    // Mock projects data with user assignments
    const projectsWithAssignments = [
      {
        id: 1,
        name: 'Project Alpha',
        location: 'New York, NY',
        client: 'ABC Corporation',
        progress: 80,
        status: 'active',
        deadline: '2025-12-31',
        workers: ['5'], // Worker ID assigned to this project
        managers: ['2'] // Project Manager ID assigned to this project
      },
      {
        id: 2,
        name: 'Harbor Tower',
        location: 'San Francisco, CA',
        client: 'Harbor Development Inc.',
        progress: 45,
        status: 'active',
        deadline: '2024-03-15',
        workers: [],
        managers: ['2']
      },
      {
        id: 3,
        name: 'Metro Station',
        location: 'Chicago, IL',
        client: 'City Transport Authority',
        progress: 65,
        status: 'active',
        deadline: '2024-01-20',
        workers: [],
        managers: ['2']
      },
      {
        id: 4,
        name: 'Corporate HQ',
        location: 'Dallas, TX',
        client: 'XYZ Enterprises',
        progress: 20,
        status: 'planning',
        deadline: '2024-06-30',
        workers: [],
        managers: []
      },
      {
        id: 5,
        name: 'Shopping Mall',
        location: 'Miami, FL',
        client: 'Retail Properties Group',
        progress: 95,
        status: 'completing',
        deadline: '2025-11-15',
        workers: [],
        managers: []
      }
    ];
    
    let projectsList = [];
    
    // Admin and site inspectors can see all projects
    if (user.role === 'admin' || user.role === 'siteInspector') {
      projectsList = projectsWithAssignments;
    }
    // Project Managers see projects they manage
    else if (user.role === 'projectManager') {
      projectsList = projectsWithAssignments.filter(project => 
        project.managers.includes(user.id)
      );
    }
    // Contractors see all active projects they can bid on or are assigned to
    else if (user.role === 'contractor') {
      projectsList = projectsWithAssignments.filter(project => 
        project.status === 'active' || project.status === 'planning'
      );
    }
    // Workers only see projects they are assigned to
    else if (user.role === 'worker') {
      projectsList = projectsWithAssignments.filter(project => 
        project.workers.includes(user.id)
      );
    }
    else {
      projectsList = projectsWithAssignments;
    }
    
    // If a specific project is selected in the sidebar, only show that project
    if (selectedProject) {
      projectsList = projectsList.filter(project => 
        project.id.toString() === selectedProject.id.toString()
      );
    }
    
    return projectsList;
  }, [user, selectedProject]);
  
  // Set default selected project based on role
  useEffect(() => {
    if (filteredProjects.length > 0) {
      // For workers, auto-select their only project
      if (user?.role === 'worker' && filteredProjects.length === 1) {
        setLocalSelectedProject(filteredProjects[0].name);
      } else {
        // For others, select the first project in the list
        setLocalSelectedProject(filteredProjects[0].name);
      }
    }
  }, [filteredProjects, user]);
  
  useEffect(() => {
    const fetchProjectData = async () => {
      if (selectedProject) {
        try {
          setLoading(true);
          const userInfo = getUserInfo();
          if (!userInfo) return;

          const response = await fetch(`https://matrixbim-server.onrender.com/api/projects/${selectedProject.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setProjectData(data);
            setLocalSelectedProject(data.name);
          }
        } catch (error) {
          console.error('Error fetching project:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [selectedProject]);
  
  // Chart colors based on theme
  const chartColors = {
    primary: darkMode ? 'rgba(0, 153, 255, 1)' : 'rgba(0, 153, 255, 1)',
    primaryTransparent: darkMode ? 'rgba(0, 153, 255, 0.2)' : 'rgba(0, 153, 255, 0.2)',
    secondary: darkMode ? 'rgba(86, 112, 151, 1)' : 'rgba(86, 112, 151, 1)',
    accent: darkMode ? 'rgba(25, 179, 177, 1)' : 'rgba(25, 179, 177, 1)',
    success: darkMode ? 'rgba(5, 194, 123, 1)' : 'rgba(5, 194, 123, 1)',
    warning: darkMode ? 'rgba(255, 165, 0, 1)' : 'rgba(255, 165, 0, 1)',
    error: darkMode ? 'rgba(255, 69, 93, 1)' : 'rgba(255, 69, 93, 1)',
    ai: {
      blue: 'rgba(30, 144, 255, 1)',
      purple: 'rgba(157, 0, 255, 1)',
      teal: 'rgba(0, 226, 226, 1)',
      pink: 'rgba(255, 0, 229, 1)',
    },
    gridColor: darkMode ? 'rgba(50, 56, 69, 0.2)' : 'rgba(209, 213, 219, 0.5)',
    textColor: darkMode ? 'rgba(229, 231, 235, 1)' : 'rgba(26, 31, 44, 1)',
  };
  
  // Project Progress Chart
  const projectProgressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Planned',
        data: [10, 25, 40, 60, 75, 85],
        borderColor: chartColors.secondary,
        backgroundColor: 'transparent',
        borderDashed: [5, 5],
        borderWidth: 2,
      },
      {
        label: 'Actual',
        data: [5, 20, 35, 50, 70, 80],
        borderColor: chartColors.ai.blue,
        backgroundColor: `rgba(30, 144, 255, 0.15)`,
        fill: true,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };
  
  const projectProgressOptions = {
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
          chartColors.ai.purple,
          chartColors.error,
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const taskStatusOptions = {
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
  
  // Sales In-progress Chart
  const salesInProgressData = {
    labels: ['Safety Inspection', 'Site Diary', '3rd Qtr', '4th Qtr'],
    datasets: [
      {
        data: [40, 25, 20, 15],
        backgroundColor: [
          chartColors.ai.blue,
          chartColors.success,
          chartColors.ai.teal,
          chartColors.ai.purple,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Sales Completed Chart
  const salesCompletedData = {
    labels: ['Safety Inspection', 'Site Diary', '3rd Qtr', '4th Qtr'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          chartColors.ai.blue,
          chartColors.success,
          chartColors.ai.teal,
          chartColors.ai.purple,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Overall Sales Chart
  const overallSalesData = {
    labels: ['Safety Inspection', 'Site Diary', '3rd Qtr', '4th Qtr'],
    datasets: [
      {
        data: [35, 25, 22, 18],
        backgroundColor: [
          chartColors.ai.blue,
          chartColors.success,
          chartColors.ai.teal,
          chartColors.ai.purple,
        ],
        borderWidth: 0,
      },
    ],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: chartColors.textColor,
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          }
        },
      },
    },
  };
  
  // Daily Activity Chart
  const activityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Form Submissions',
        data: [15, 20, 18, 25, 22, 10, 5],
        backgroundColor: chartColors.ai.blue,
      },
      {
        label: 'Inspections',
        data: [8, 12, 10, 17, 15, 5, 2],
        backgroundColor: chartColors.ai.teal,
      },
    ],
  };
  
  const activityOptions = {
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
  
  // Mock data for the dashboard
  const summaryData = [
    { 
      title: t('dashboard.pendingInspections'), 
      value: 12, 
      icon: <RiAlarmWarningLine />, 
      color: 'text-warning bg-warning/10 border border-warning/20' 
    },
    { 
      title: t('dashboard.dailyLogs'), 
      value: 8, 
      icon: <RiCalendarCheckLine />, 
      color: 'text-ai-blue bg-ai-blue/10 border border-ai-blue/20' 
    },
    { 
      title: t('dashboard.safetyScore'), 
      value: '85%', 
      icon: <RiShieldCheckLine />, 
      color: 'text-success bg-success/10 border border-success/20' 
    }
  ];

  // Recent activity based on user role
  const getRecentActivity = () => {
    if (user?.role === 'worker') {
      return [
        {
          id: 1,
          title: 'Completed Safety Training',
          time: '2 hours ago',
          type: 'safety'
        },
        {
          id: 2,
          title: 'Submitted Daily Attendance',
          time: '5 hours ago',
          type: 'labour'
        },
        {
          id: 3,
          title: 'Cleaning Schedule Updated',
          time: '1 day ago',
          type: 'cleansing'
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: 'New Safety Inspection Added',
          time: '2 hours ago',
          type: 'safety'
        },
        {
          id: 2,
          title: 'Worker Attendance Updated',
          time: '3 hours ago',
          type: 'labour'
        },
        {
          id: 3,
          title: 'Cleaning Schedule Updated',
          time: '1 day ago',
          type: 'cleansing'
        },
        {
          id: 4,
          title: 'Project Timeline Adjusted',
          time: '2 days ago',
          type: 'project'
        }
      ];
    }
  };

  const recentActivity = getRecentActivity();
  
  // Activity type icons
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'safety':
        return <RiShieldCheckLine className="text-primary-500" />;
      case 'labour':
        return <RiGroupLine className="text-warning" />;
      case 'cleansing':
        return <RiBrushLine className="text-success" />;
      case 'project':
        return <RiBuilding4Line className="text-ai-blue" />;
      default:
        return <RiCalendarCheckLine className="text-secondary-500" />;
    }
  };
  
  // Return appropriate module cards based on user role
  const getModuleCards = () => {
    const modules = [
      {
        title: t('forms.title'),
        description: t('dashboard.moduleDescriptions.forms', 'Create and manage forms for project documentation'),
        icon: <RiFileList3Line />,
        link: '/forms',
        color: 'from-blue-500 to-blue-700'
      },
      {
        title: 'AI Assistant',
        icon: <RiBrainLine />,
        description: 'Ask AI about your projects and get intelligent insights',
        link: '/ask-ai',
        color: 'from-ai-blue to-ai-purple',
        requiredRoles: undefined
      },
      {
        title: 'Safety Module',
        icon: <RiShieldCheckLine />,
        description: 'Conduct safety inspections and track compliance metrics',
        link: '/safety',
        color: 'from-red-500 to-orange-400',
        requiredRoles: ['admin', 'projectManager', 'siteInspector']
      },
      {
        title: 'Labour Module',
        icon: <RiGroupLine />,
        description: 'Track worker attendance and manage labour resources',
        link: '/labour',
        color: 'from-blue-500 to-indigo-600',
        requiredRoles: ['admin', 'projectManager', 'contractor', 'worker']
      },
      {
        title: 'Cleansing Module',
        icon: <RiBrushLine />,
        description: 'Manage site cleanliness and waste management',
        link: '/cleansing',
        color: 'from-green-500 to-emerald-400',
        requiredRoles: ['admin', 'projectManager', 'siteInspector', 'contractor', 'worker']
      }
    ];
    
    return modules.filter(module => 
      !module.requiredRoles || 
      (user?.role && module.requiredRoles.includes(user.role))
    );
  };
  
  return (
    <div className="relative overflow-hidden pb-8">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-ai-dots opacity-30 pointer-events-none"></div>
      
      {/* Welcome section with AI assistant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Card variant="ai-gradient" className="p-6 overflow-visible">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai-blue via-ai-purple to-ai-teal animate-gradient-flow">
                  {t('dashboard.welcomeBack')}, {user?.name}
                </span>
              </h1>
              <p className="text-secondary-600 dark:text-secondary-300 mt-1">
                {t('dashboard.todayDate')}: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <motion.div 
              className="mt-4 md:mt-0 flex items-center bg-dark-800/80 backdrop-blur-md rounded-xl p-3 border border-ai-blue/20 shadow-ai-glow"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-ai-blue to-ai-purple flex items-center justify-center mr-3 shadow-ai-glow">
                <IconContext.Provider value={{ className: "text-white text-xl" }}>
                  <RiBrainLine />
                </IconContext.Provider>
              </div>
              <div>
                <div className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal font-medium">
                  AI Assistant
                </div>
                <div className="text-xs text-white/80">
                  How can I help you today?
                </div>
              </div>
              <Link to="/ask-ai">
                <Button variant="ai" size="sm" className="ml-4">
                  Ask AI
                </Button>
              </Link>
            </motion.div>
          </div>
        </Card>
      </motion.div>
      
      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold flex items-center">
            <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
              <RiRobot2Line />
            </IconContext.Provider>
            <span>AI Insights</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Insights content would be populated here */}
        </div>
      </motion.div>
      
      {/* Summary Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">{t('dashboard.projectSummary')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <Card variant="ai" className="p-4">
                <div className="flex items-start">
                  <div className={`p-3 rounded-lg ${item.color} mr-4`}>
                    <div className="text-xl">{item.icon}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-display font-bold">{item.value}</div>
                    <div className="text-sm text-secondary-600 dark:text-secondary-400">{item.title}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Chart Sections */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card variant="ai" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                  <RiLineChartLine />
                </IconContext.Provider>
                <span>{t('dashboard.projectProgress')}</span>
              </h3>
              <Button variant="ghost" size="sm" rightIcon={
                <IconContext.Provider value={{}}>
                  <RiArrowRightLine />
                </IconContext.Provider>
              }>
                {t('dashboard.viewAll')}
              </Button>
            </div>
            <div className="h-[300px]">
              <Line data={projectProgressData} options={projectProgressOptions} />
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="ai" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                  <RiBarChartLine />
                </IconContext.Provider>
                <span>{t('dashboard.weeklyActivity')}</span>
              </h3>
              <Button variant="ghost" size="sm" rightIcon={
                <IconContext.Provider value={{}}>
                  <RiArrowRightLine />
                </IconContext.Provider>
              }>
                {t('dashboard.viewAll')}
              </Button>
            </div>
            <div className="h-[300px]">
              <Bar data={activityData} options={activityOptions} />
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Sales Charts Row */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card variant="ai" className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                  <RiPieChartLine />
                </IconContext.Provider>
                <span>Sales In-progress</span>
              </h3>
            </div>
            <div className="h-[200px] flex items-center justify-center">
              <Doughnut data={salesInProgressData} options={salesChartOptions} />
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="ai" className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-success" }}>
                  <RiPieChartLine />
                </IconContext.Provider>
                <span>Sales Completed</span>
              </h3>
            </div>
            <div className="h-[200px] flex items-center justify-center">
              <Doughnut data={salesCompletedData} options={salesChartOptions} />
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card variant="ai" className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-teal" }}>
                  <RiPieChartLine />
                </IconContext.Provider>
                <span>Overall Sales</span>
              </h3>
            </div>
            <div className="h-[200px] flex items-center justify-center">
              <Doughnut data={overallSalesData} options={salesChartOptions} />
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card variant="ai" className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                  <RiPieChartLine />
                </IconContext.Provider>
                <span>{t('dashboard.taskStatus')}</span>
              </h3>
            </div>
            <div className="h-[200px] flex items-center justify-center">
              <Doughnut data={taskStatusData} options={taskStatusOptions} />
            </div>
          </Card>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card variant="ai" className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold flex items-center">
                <IconContext.Provider value={{ className: "mr-2 text-ai-blue" }}>
                  <RiTimeLine />
                </IconContext.Provider>
                <span>{t('dashboard.recentActivity')}</span>
              </h3>
              <Button variant="ghost" size="sm" rightIcon={
                <IconContext.Provider value={{}}>
                  <RiArrowRightLine />
                </IconContext.Provider>
              }>
                {t('dashboard.viewAll')}
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="p-3 rounded-lg bg-secondary-50/50 dark:bg-dark-800/50 border border-secondary-100 dark:border-dark-700 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-secondary-900 dark:text-white">{activity.title}</span>
                    <div className="text-xs text-secondary-500 dark:text-secondary-500">
                      {activity.time}
                    </div>
                  </div>
                  <button className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300">
                    <IconContext.Provider value={{}}>
                      {getActivityIcon(activity.type)}
                    </IconContext.Provider>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
      
      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getModuleCards().map((module, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 mb-4 rounded-full bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                  <IconContext.Provider value={{ className: "text-xl" }}>
                    {module.icon}
                  </IconContext.Provider>
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{module.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                  {module.description}
                </p>
              </div>
              <Link to={module.link}>
                <Button variant="outline" size="sm" rightIcon={<RiArrowRightLine />}>
                  {t('dashboard.access')}
                </Button>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 