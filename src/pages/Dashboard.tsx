import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
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
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  RiCalendarCheckLine,
  RiAlarmWarningLine,
  RiShieldCheckLine,
  RiBarChartLine,
  RiFileList3Line,
  RiLoader4Line,
  RiPieChartLine
} from 'react-icons/ri';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects } from '../contexts/ProjectContext';

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
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = 'Dashboard | MatrixTwin';
    const fetchDashboardStats = async () => {
      if (!selectedProject || !user) return;
      
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://server.matrixtwin.com'}/api/global-forms/dashboard?projectId=${selectedProject.id}&userId=${user.id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [selectedProject, user]);
  
  const { projectId } = useParams();

  // Loading state
  if ((projectId && (!selectedProject || selectedProject.id.toString() !== projectId)) || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-md bg-portfolio-orange/30 animate-pulse"></div>
          <RiLoader4Line className="text-5xl text-portfolio-orange animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-gray-400 font-mono text-sm tracking-widest uppercase">Loading Matrix Data...</p>
      </div>
    );
  }

  // Use the API data or a default structure matching the API
  const stats = dashboardData || {
    total_forms: 0,
    pending_total: 0,
    completed_total: 0,
    by_type: {}
  };

  // Modern Orange/Black Theme Colors
  const themeColors = {
    primary: '#FF5722',      // Portfolio Orange
    primaryGlow: 'rgba(255, 87, 34, 0.5)',
    secondary: '#212121',    // Dark Grey
    surface: '#111111',      // Card Background
    background: '#0a0a0a',   // Main Background
    text: '#ffffff',
    textSecondary: '#9e9e9e',
    grid: 'rgba(255, 255, 255, 0.05)',
    success: '#00E676',      // Bright Green for contrast
    warning: '#FFC400',      // Bright Amber
  };
  
  // Prepare data for charts
  const types = Object.values(stats.by_type || {}) as any[];
  const labels = types.map((t: any) => t.label || t.type);
  const totalData = types.map((t: any) => t.total);
  const pendingData = types.map((t: any) => t.pending);
  const completedData = types.map((t: any) => t.completed);

  // Bar Chart Data
  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Pending',
        data: pendingData,
        backgroundColor: 'rgba(255, 196, 0, 0.8)', // Warning Color
        borderColor: 'rgba(255, 196, 0, 1)',
        borderWidth: 1,
        borderRadius: 2,
        barPercentage: 0.6,
      },
      {
        label: 'Completed',
        data: completedData,
        backgroundColor: 'rgba(255, 87, 34, 0.8)', // Primary Orange
        borderColor: '#FF5722',
        borderWidth: 1,
        borderRadius: 2,
        barPercentage: 0.6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { 
          color: themeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 17, 17, 0.9)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(255, 87, 34, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { color: themeColors.grid, display: false },
        ticks: { color: themeColors.textSecondary, font: { family: 'Space Grotesk' } }
      },
      y: {
        grid: { color: themeColors.grid, borderDash: [5, 5] },
        ticks: { color: themeColors.textSecondary, font: { family: 'Space Grotesk' } },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  // Doughnut Chart Data
  const doughnutData = {
    labels,
    datasets: [
      {
        data: totalData,
        backgroundColor: [
          '#FF5722', // Primary Orange
          '#FF8A65', // Lighter Orange
          '#E64A19', // Darker Orange
          '#FFCCBC', // Very Light Orange
          '#BF360C', // Very Dark Orange
          '#FFAB91',
          '#FBE9E7'
        ],
        borderColor: themeColors.surface,
        borderWidth: 2,
        hoverOffset: 10
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { 
          color: themeColors.textSecondary,
          font: { family: 'Space Grotesk', size: 11 },
          boxWidth: 12,
          padding: 15
        }
      },
    },
    cutout: '75%',
  };

  // Summary Cards Data
  const summaryCards = [
    {
      title: 'TOTAL FORMS',
      value: stats.total_forms,
      icon: <RiFileList3Line />,
      color: 'text-white',
      bg: 'bg-gradient-to-br from-portfolio-orange to-orange-700',
      border: 'border-portfolio-orange/50',
      glow: 'shadow-ai-glow'
    },
    {
      title: 'PENDING',
      value: stats.pending_total,
      icon: <RiAlarmWarningLine />,
      color: 'text-warning',
      bg: 'bg-dark-800',
      border: 'border-warning/30',
      glow: 'shadow-none'
    },
    {
      title: 'COMPLETED',
      value: stats.completed_total,
      icon: <RiShieldCheckLine />,
      color: 'text-portfolio-orange',
      bg: 'bg-dark-800',
      border: 'border-portfolio-orange/30',
      glow: 'shadow-none'
    }
  ];

  // Custom plugin to draw text in center of doughnut
  const textCenter = {
    id: 'textCenter',
    beforeDatasetsDraw(chart: any) {
      const { ctx } = chart;
      const x = chart.getDatasetMeta(0).data[0]?.x;
      const y = chart.getDatasetMeta(0).data[0]?.y;
      
      if (x === undefined || y === undefined) return;

      ctx.save();
      
      // Draw Total Number
      ctx.font = 'bold 30px "Space Grotesk", sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stats.total_forms.toString(), x, y - 5);
      
      // Draw Label
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillStyle = '#9ca3af'; // gray-400
      ctx.fillText('TOTAL', x, y + 20);
      
      ctx.restore();
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 p-3 sm:p-6 md:p-8 pt-20 sm:pt-24 md:pt-4 space-y-6 sm:space-y-8 text-white font-sans relative z-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
            {selectedProject?.name?.toUpperCase() || 'PROJECT'} <span className="text-portfolio-orange">DASHBOARD</span>
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-xs uppercase tracking-widest">
            Real-time Matrix Data Stream
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-dark-900 px-3 sm:px-4 py-2 rounded-lg border border-white/5">
          <div className="w-2 h-2 rounded-full bg-portfolio-orange animate-pulse"></div>
          <span className="text-sm font-mono text-gray-400">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div 
              className={`relative overflow-hidden rounded-2xl p-6 h-full border ${card.border} ${card.bg} ${card.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <div className="text-8xl transform rotate-12">{card.icon}</div>
              </div>
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-black/20 backdrop-blur-sm ${card.color}`}>
                    <div className="text-2xl">{card.icon}</div>
                  </div>
                  {index === 0 && (
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-mono font-medium text-white/60 tracking-widest mb-1">{card.title}</p>
                  <p className="text-3xl sm:text-4xl font-display font-bold text-white">{card.value}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="bg-dark-900/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/5 h-[320px] sm:h-[400px] shadow-xl relative overflow-hidden group">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-portfolio-orange/30 rounded-tl-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-portfolio-orange/30 rounded-br-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center">
              <RiBarChartLine className="mr-2 text-portfolio-orange" /> 
              FORM STATUS ANALYTICS
            </h3>
            <div className="h-[220px] sm:h-[300px] w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <div className="bg-dark-900/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/5 h-[320px] sm:h-[400px] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-portfolio-orange/30 rounded-tr-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-portfolio-orange/30 rounded-bl-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

            <h3 className="text-lg font-display font-bold text-white mb-6 flex items-center">
              <RiPieChartLine className="mr-2 text-portfolio-orange" /> 
              DISTRIBUTION
            </h3>
            <div className="h-[200px] sm:h-[280px] w-full flex items-center justify-center relative">
              <Doughnut data={doughnutData} options={doughnutOptions} plugins={[textCenter]} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Grid Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-dark-900/30 rounded-2xl p-1 border border-white/5">
          <div className="p-5 border-b border-white/5 mb-4">
             <h3 className="text-lg font-display font-bold text-white flex items-center">
              <RiFileList3Line className="mr-2 text-portfolio-orange" /> 
              DETAILED BREAKDOWN
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pt-0">
            {types.map((type: any, index: number) => (
              <div 
                key={index} 
                className="group bg-dark-800 hover:bg-dark-800/80 rounded-xl p-5 border border-white/5 hover:border-portfolio-orange/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-portfolio-orange opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <h4 className="font-display font-bold text-white mb-4 text-lg border-b border-white/5 pb-2">
                  {type.label}
                </h4>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">{type.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Pending</span>
                    <span className="font-bold text-warning">{type.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-bold text-portfolio-orange">{type.completed}</span>
                  </div>
                </div>
                
                {/* Visual Indicator */}
                <div className="mt-4 h-1 w-full bg-dark-950 rounded-full overflow-hidden flex">
                   <div 
                     style={{ width: `${type.total > 0 ? (type.completed / type.total) * 100 : 0}%` }} 
                     className="bg-portfolio-orange h-full shadow-[0_0_10px_rgba(255,87,34,0.5)]"
                   />
                   <div 
                     style={{ width: `${type.total > 0 ? (type.pending / type.total) * 100 : 0}%` }} 
                     className="bg-warning h-full opacity-70"
                   />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
