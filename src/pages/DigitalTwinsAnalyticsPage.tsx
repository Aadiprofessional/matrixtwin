import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RiDashboardLine, 
  RiArrowGoBackLine, 
  RiBuilding2Line,
  RiTempHotLine,
  RiWaterFlashLine,
  RiLightbulbLine,
  RiWindyLine,
  RiRefreshLine,
  RiAlertLine,
  RiDownload2Line
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import PageHeader from '../components/common/PageHeader';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Generate random data for charts
const generateMonthlyData = (months = 12, baseValue = 100, variance = 20) => {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, months);
  const data = Array.from({ length: months }, () => baseValue + Math.random() * variance * 2 - variance);
  return { labels, data };
};

const generateDailyData = (days = 30, baseValue = 50, variance = 10) => {
  const labels = Array.from({ length: days }, (_, i) => `Day ${i + 1}`);
  const data = Array.from({ length: days }, () => baseValue + Math.random() * variance * 2 - variance);
  return { labels, data };
};

const energyBreakdown = {
  labels: ['HVAC', 'Lighting', 'Equipment', 'Elevators', 'Other'],
  values: [38, 22, 20, 12, 8]
};

const waterUsageByFloor = {
  labels: ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor'],
  values: [28, 35, 15, 12, 10]
};

// Mock analytics data
const buildingStats = {
  energyUsage: {
    current: 124.7,
    previous: 132.5,
    unit: 'kWh',
    trend: 'down',
    percentage: 5.9
  },
  waterConsumption: {
    current: 320,
    previous: 345,
    unit: 'gal',
    trend: 'down',
    percentage: 7.2
  },
  occupancy: {
    current: 78,
    previous: 72,
    unit: '%',
    trend: 'up',
    percentage: 8.3
  },
  temperature: {
    current: 22.4,
    previous: 21.8,
    unit: '°C',
    trend: 'up',
    percentage: 2.8
  },
  co2Levels: {
    current: 650,
    previous: 700,
    unit: 'ppm',
    trend: 'down',
    percentage: 7.1
  }
};

const DigitalTwinsAnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [buildingModel, setBuildingModel] = useState<string>('office-hq');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Inline styles to ensure content stays visible
  const baseStyle = { zIndex: 10, position: 'relative' as const };
  
  // Energy usage chart data
  const energyUsageData = timeRange === 'year' ? generateMonthlyData(12, 130, 30) : generateDailyData(30, 130, 30);
  const energyChartData = {
    labels: energyUsageData.labels,
    datasets: [
      {
        label: 'Energy Usage (kWh)',
        data: energyUsageData.data,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Water consumption chart data
  const waterUsageData = timeRange === 'year' ? generateMonthlyData(12, 300, 80) : generateDailyData(30, 300, 80);
  const waterChartData = {
    labels: waterUsageData.labels,
    datasets: [
      {
        label: 'Water Usage (gallons)',
        data: waterUsageData.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  // Energy breakdown chart data
  const energyBreakdownData = {
    labels: energyBreakdown.labels,
    datasets: [
      {
        data: energyBreakdown.values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Water usage by floor chart data
  const waterByFloorData = {
    labels: waterUsageByFloor.labels,
    datasets: [
      {
        label: 'Water Usage by Floor (%)',
        data: waterUsageByFloor.values,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };
  
  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(229, 231, 235)',
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
        ticks: {
          color: 'rgb(229, 231, 235)',
        },
      },
      y: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
        ticks: {
          color: 'rgb(229, 231, 235)',
        },
      },
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(229, 231, 235)',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
        ticks: {
          color: 'rgb(229, 231, 235)',
        },
      },
      y: {
        grid: {
          color: 'rgba(100, 116, 139, 0.2)',
        },
        ticks: {
          color: 'rgb(229, 231, 235)',
        },
        beginAtZero: true,
      },
    },
  };
  
  // Simulate data refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8" style={baseStyle}>
      {/* Header */}
      <div className="dta-header mb-6" style={baseStyle}>
        <div className="dta-header-title flex items-center mb-4" style={baseStyle}>
          <Link to="/digital-twins" className="dta-back-button text-gray-400 hover:text-white mr-4" style={baseStyle}>
            <RiArrowGoBackLine className="text-xl" />
          </Link>
          <RiDashboardLine className="dta-header-icon text-ai-blue text-3xl mr-3" style={baseStyle} />
          <h1 className="dta-title text-2xl font-bold text-white" style={baseStyle}>
            Building Analytics
          </h1>
          <button 
            className={`dta-refresh-button ml-4 text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={baseStyle}
          >
            <RiRefreshLine className="text-xl" />
          </button>
        </div>
        <p className="dta-description text-gray-400 max-w-3xl" style={baseStyle}>
          Monitor and analyze building performance metrics to optimize energy usage, occupancy, and maintenance.
        </p>
      </div>
      
      {/* Control panel */}
      <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 mb-6" style={baseStyle}>
        <div className="flex flex-wrap items-center justify-between gap-4" style={baseStyle}>
          <div className="flex items-center" style={baseStyle}>
            <span className="text-gray-300 mr-2" style={baseStyle}>Building Model:</span>
            <select 
              value={buildingModel}
              onChange={(e) => setBuildingModel(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-ai-blue focus:border-transparent"
              style={baseStyle}
            >
              <option value="office-hq">Office HQ</option>
              <option value="factory-a">Factory A</option>
              <option value="warehouse-central">Warehouse Central</option>
            </select>
          </div>
          
          <div className="flex items-center" style={baseStyle}>
            <span className="text-gray-300 mr-2" style={baseStyle}>Time Range:</span>
            <div className="flex bg-dark-700 rounded-lg overflow-hidden" style={baseStyle}>
              {['day', 'week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-3 py-1.5 text-sm ${
                    timeRange === range 
                      ? 'bg-ai-blue text-white' 
                      : 'text-gray-300 hover:bg-dark-600'
                  }`}
                  style={baseStyle}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="flex items-center bg-dark-700 hover:bg-dark-600 px-3 py-1.5 rounded-lg text-white text-sm"
            style={baseStyle}
          >
            <RiDownload2Line className="mr-1" />
            Export Data
          </button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6" style={baseStyle}>
        {Object.entries(buildingStats).map(([key, stat]) => {
          // Determine icon based on metric type
          let icon;
          let gradientColors;
          switch (key) {
            case 'energyUsage':
              icon = <RiLightbulbLine className="text-2xl" />;
              gradientColors = 'from-yellow-500/30 to-amber-600/20';
              break;
            case 'waterConsumption':
              icon = <RiWaterFlashLine className="text-2xl" />;
              gradientColors = 'from-blue-500/30 to-cyan-600/20';
              break;
            case 'occupancy':
              icon = <RiBuilding2Line className="text-2xl" />;
              gradientColors = 'from-purple-500/30 to-indigo-600/20';
              break;
            case 'temperature':
              icon = <RiTempHotLine className="text-2xl" />;
              gradientColors = 'from-red-500/30 to-orange-600/20';
              break;
            case 'co2Levels':
              icon = <RiWindyLine className="text-2xl" />;
              gradientColors = 'from-green-500/30 to-emerald-600/20';
              break;
            default:
              icon = <RiDashboardLine className="text-2xl" />;
              gradientColors = 'from-gray-500/30 to-gray-600/20';
          }
          
          // Format the title from camelCase
          const title = key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          
          return (
            <div 
              key={key}
              className={`bg-dark-800/60 border border-dark-700 rounded-xl p-4 bg-gradient-to-br ${gradientColors}`}
              style={baseStyle}
            >
              <div className="flex items-center justify-between mb-2" style={baseStyle}>
                <div className="flex items-center" style={baseStyle}>
                  <div className="mr-2 text-gray-300" style={baseStyle}>
                    {icon}
                  </div>
                  <h3 className="text-sm font-medium text-gray-300" style={baseStyle}>{title}</h3>
                </div>
                <div className={`text-xs px-1.5 py-0.5 rounded ${
                  stat.trend === 'down' 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`} style={baseStyle}>
                  {stat.trend === 'down' ? '↓' : '↑'} {stat.percentage}%
                </div>
              </div>
              <div className="flex items-baseline" style={baseStyle}>
                <div className="text-2xl font-bold text-white" style={baseStyle}>{stat.current}</div>
                <div className="ml-1 text-sm text-gray-400" style={baseStyle}>{stat.unit}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1" style={baseStyle}>
                Previous: {stat.previous} {stat.unit}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={baseStyle}>
        <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4" style={baseStyle}>
          <h3 className="text-lg font-medium text-white mb-3" style={baseStyle}>Energy Usage Over Time</h3>
          <div className="h-64" style={baseStyle}>
            <Line options={lineChartOptions} data={energyChartData} />
          </div>
        </div>
        
        <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4" style={baseStyle}>
          <h3 className="text-lg font-medium text-white mb-3" style={baseStyle}>Water Consumption Over Time</h3>
          <div className="h-64" style={baseStyle}>
            <Line options={lineChartOptions} data={waterChartData} />
          </div>
        </div>
        
        <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4" style={baseStyle}>
          <h3 className="text-lg font-medium text-white mb-3" style={baseStyle}>Energy Consumption Breakdown</h3>
          <div className="h-64 flex items-center justify-center" style={baseStyle}>
            <div style={{ width: '80%', maxWidth: '300px' }}>
              <Doughnut data={energyBreakdownData} />
            </div>
          </div>
        </div>
        
        <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4" style={baseStyle}>
          <h3 className="text-lg font-medium text-white mb-3" style={baseStyle}>Water Usage by Floor</h3>
          <div className="h-64" style={baseStyle}>
            <Bar options={barChartOptions} data={waterByFloorData} />
          </div>
        </div>
      </div>
      
      {/* Efficiency Recommendations */}
      <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 mb-6" style={baseStyle}>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center" style={baseStyle}>
          <RiAlertLine className="text-amber-500 mr-2" /> 
          Efficiency Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={baseStyle}>
          <div className="bg-dark-700/80 p-3 rounded-lg border border-dark-600" style={baseStyle}>
            <h4 className="font-medium text-white mb-1" style={baseStyle}>HVAC Optimization</h4>
            <p className="text-sm text-gray-400" style={baseStyle}>Reduce HVAC usage during non-peak hours to save up to 12% on energy consumption.</p>
          </div>
          <div className="bg-dark-700/80 p-3 rounded-lg border border-dark-600" style={baseStyle}>
            <h4 className="font-medium text-white mb-1" style={baseStyle}>Water Leak Detection</h4>
            <p className="text-sm text-gray-400" style={baseStyle}>Possible water leak detected on 2nd floor. Check plumbing near restrooms.</p>
          </div>
          <div className="bg-dark-700/80 p-3 rounded-lg border border-dark-600" style={baseStyle}>
            <h4 className="font-medium text-white mb-1" style={baseStyle}>Lighting Schedule</h4>
            <p className="text-sm text-gray-400" style={baseStyle}>Adjust lighting schedule on 4th floor to match actual occupancy patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinsAnalyticsPage; 