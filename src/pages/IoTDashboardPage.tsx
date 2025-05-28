import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  RiSensorLine, 
  RiArrowGoBackLine, 
  RiTempHotLine, 
  RiWaterFlashLine,
  RiLightbulbLine,
  RiFireLine,
  RiDoorLockLine,
  RiAlarmWarningLine,
  RiUserLocationLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiInformationLine,
  RiDashboardLine,
  RiWifiLine,
  RiThermometerLine,
  RiCpuLine,
  RiFilterLine,
  RiShuffleLine,
  RiBrainLine,
  RiLoader4Line,
  RiFullscreenLine,
  RiBarChartBoxLine,
  RiRemoteControlLine,
  RiLightbulbFlashLine,
  RiToggleLine,
  RiTempColdLine,
  RiVolumeUpLine,
  RiVolumeDownLine,
  RiBuilding4Line,
  RiCameraLine,
  RiVideoLine,
  RiRecordCircleLine,
  RiPlayLine,
  RiPauseLine,
  RiStopLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiScreenshotLine,
  RiEyeLine,
  RiEyeOffLine
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  Filler,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Line as RechartsLine 
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatusIndicator, { SensorStatus } from '../components/ui/StatusIndicator';
import SensorIcon, { SensorType } from '../components/ui/SensorIcon';
import { getAllModels, ModelRecord } from '../utils/supabaseModelsApi';
import { getFreshViewToken } from '../utils/bimfaceTokenApi';
import { useAuth } from '../contexts/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  ArcElement,
  BarElement,
  Title, 
  ChartTooltip, 
  Legend,
  Filler
);

// Sensor data interface
interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  floor: number;
  value: number;
  unit: string;
  status: SensorStatus;
  lastUpdated: string;
  battery?: number;
  recentActivity: { message: string; time: string }[];
}

// Add CCTV Camera interface
interface CCTVCamera {
  id: string;
  name: string;
  location: string;
  floor: number;
  status: 'online' | 'offline' | 'recording' | 'maintenance';
  isRecording: boolean;
  lastActivity: string;
  resolution: string;
  viewAngle: string;
  nightVision: boolean;
  motionDetection: boolean;
  alerts: { type: string; message: string; time: string }[];
}

// Mock sensor data
const mockSensors: Sensor[] = [
  {
    id: 's1',
    name: 'Temp Sensor 1',
    type: 'temperature',
    location: 'Conference Room',
    floor: 1,
    value: 22.5,
    unit: '°C',
    status: 'online',
    lastUpdated: '2025-04-30T19:22:31',
    battery: 85,
    recentActivity: [
      { message: 'Temperature reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's2',
    name: 'Temp Sensor 2',
    type: 'temperature',
    location: 'Main Office',
    floor: 1,
    value: 23.1,
    unit: '°C',
    status: 'online',
    lastUpdated: '2025-04-30T19:24:12',
    battery: 90,
    recentActivity: [
      { message: 'Temperature reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's3',
    name: 'Humidity 1',
    type: 'humidity',
    location: 'Server Room',
    floor: 2,
    value: 35,
    unit: '%',
    status: 'warning',
    lastUpdated: '2025-04-30T19:20:45',
    battery: 75,
    recentActivity: [
      { message: 'Humidity reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's4',
    name: 'Occupancy 1',
    type: 'occupancy',
    location: 'Lobby',
    floor: 1,
    value: 12,
    unit: 'people',
    status: 'online',
    lastUpdated: '2025-04-30T19:25:02',
    battery: 100,
    recentActivity: [
      { message: 'Occupancy reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's5',
    name: 'Energy Meter',
    type: 'energy',
    location: 'Main Supply',
    floor: 0,
    value: 42.7,
    unit: 'kWh',
    status: 'online',
    lastUpdated: '2025-04-30T19:15:33',
    battery: 95,
    recentActivity: [
      { message: 'Energy reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's6',
    name: 'Water Sensor',
    type: 'water',
    location: 'Restroom',
    floor: 2,
    value: 0.5,
    unit: 'm³/h',
    status: 'online',
    lastUpdated: '2025-04-30T19:18:19',
    battery: 80,
    recentActivity: [
      { message: 'Water flow reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's7',
    name: 'Door Sensor',
    type: 'security',
    location: 'Main Entrance',
    floor: 1,
    value: 1,
    unit: 'status',
    status: 'online',
    lastUpdated: '2025-04-30T19:26:50',
    battery: 100,
    recentActivity: [
      { message: 'Door status reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
  {
    id: 's8',
    name: 'Air Quality',
    type: 'air',
    location: 'Open Space',
    floor: 3,
    value: 850,
    unit: 'ppm CO2',
    status: 'critical',
    lastUpdated: '2025-04-30T19:10:27',
    battery: 70,
    recentActivity: [
      { message: 'Air quality reading', time: '10 minutes ago' },
      { message: 'Battery level low', time: '1 hour ago' }
    ]
  },
];

// Mock CCTV data
const mockCCTVCameras: CCTVCamera[] = [
  {
    id: 'cam001',
    name: 'Main Entrance',
    location: 'Front Door',
    floor: 1,
    status: 'recording',
    isRecording: true,
    lastActivity: '2 minutes ago',
    resolution: '4K',
    viewAngle: '120°',
    nightVision: true,
    motionDetection: true,
    alerts: [
      { type: 'motion', message: 'Motion detected at entrance', time: '2 minutes ago' },
      { type: 'person', message: 'Person identified', time: '5 minutes ago' }
    ]
  },
  {
    id: 'cam002',
    name: 'Parking Lot',
    location: 'Outdoor Parking',
    floor: 0,
    status: 'online',
    isRecording: false,
    lastActivity: '10 minutes ago',
    resolution: '1080p',
    viewAngle: '90°',
    nightVision: true,
    motionDetection: true,
    alerts: [
      { type: 'vehicle', message: 'Vehicle entered parking', time: '10 minutes ago' }
    ]
  },
  {
    id: 'cam003',
    name: 'Conference Room',
    location: 'Meeting Room A',
    floor: 2,
    status: 'online',
    isRecording: false,
    lastActivity: '1 hour ago',
    resolution: '1080p',
    viewAngle: '110°',
    nightVision: false,
    motionDetection: true,
    alerts: []
  },
  {
    id: 'cam004',
    name: 'Server Room',
    location: 'IT Infrastructure',
    floor: 2,
    status: 'recording',
    isRecording: true,
    lastActivity: 'Live',
    resolution: '4K',
    viewAngle: '180°',
    nightVision: true,
    motionDetection: true,
    alerts: [
      { type: 'access', message: 'Authorized access detected', time: '30 minutes ago' }
    ]
  },
  {
    id: 'cam005',
    name: 'Emergency Exit',
    location: 'Back Exit',
    floor: 1,
    status: 'maintenance',
    isRecording: false,
    lastActivity: '2 hours ago',
    resolution: '1080p',
    viewAngle: '100°',
    nightVision: true,
    motionDetection: false,
    alerts: [
      { type: 'maintenance', message: 'Camera offline for maintenance', time: '2 hours ago' }
    ]
  },
  {
    id: 'cam006',
    name: 'Lobby Area',
    location: 'Main Lobby',
    floor: 1,
    status: 'online',
    isRecording: true,
    lastActivity: 'Live',
    resolution: '4K',
    viewAngle: '360°',
    nightVision: false,
    motionDetection: true,
    alerts: [
      { type: 'crowd', message: 'High occupancy detected', time: '15 minutes ago' }
    ]
  }
];

// Time series data for charts
const generateTimeSeriesData = (hours = 24, baseValue = 22, variance = 2) => {
  const labels = Array.from({ length: hours }, (_, i) => 
    `${(i <= 9 ? '0' : '') + i}:00`
  );
  
  const data = Array.from({ length: hours }, () => 
    baseValue + (Math.random() * variance * 2 - variance)
  );
  
  return { labels, data };
};

const getSensorTypeColor = (type: SensorType) => {
  switch (type) {
    case 'temperature':
      return 'bg-red-500/20 text-red-500';
    case 'humidity':
      return 'bg-blue-500/20 text-blue-500';
    case 'occupancy':
      return 'bg-green-500/20 text-green-500';
    case 'energy':
      return 'bg-yellow-500/20 text-yellow-500';
    case 'water':
      return 'bg-cyan-500/20 text-cyan-500';
    case 'security':
      return 'bg-purple-500/20 text-purple-500';
    case 'air':
      return 'bg-indigo-500/20 text-indigo-500';
    default:
      return 'bg-gray-500/20 text-gray-500';
  }
};

// Main IoT Dashboard component
const IoTDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<SensorType | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showEnergy, setShowEnergy] = useState(true);
  const [showMotion, setShowMotion] = useState(true);
  const [show3DModel, setShow3DModel] = useState(true);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const { user } = useAuth();
  const modelContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const skyBoxManagerRef = useRef<any>(null);
  const [skyBoxEnabled, setSkyBoxEnabled] = useState<boolean>(true);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hvacEnabled, setHvacEnabled] = useState(true);
  const [lightingEnabled, setLightingEnabled] = useState(true);
  const [targetTemp, setTargetTemp] = useState(22);
  const [lightingLevel, setLightingLevel] = useState(80);
  const [activeTab, setActiveTab] = useState<'iot' | 'analytics' | 'controls' | 'cctv'>('iot');
  
  // CCTV specific state
  const [cctvCameras, setCctvCameras] = useState<CCTVCamera[]>(mockCCTVCameras);
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera | null>(null);
  const [cctvRecordingAll, setCctvRecordingAll] = useState(false);
  const [cctvNightVisionAll, setCctvNightVisionAll] = useState(true);
  const [cctvMotionDetectionAll, setCctvMotionDetectionAll] = useState(true);
  
  // Generate time series data for charts
  const temperatureData = generateTimeSeriesData(24, 22, 2);
  const humidityData = generateTimeSeriesData(24, 45, 15);
  const energyData = generateTimeSeriesData(24, 35, 20);
  
  // Fetch models from Supabase
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadingModel(true);
        const fetchedModels = await getAllModels();
        // Filter for completed models with file_id (we'll get fresh tokens as needed)
        const validModels = fetchedModels.filter(model => 
          (model.status === 'success' || model.status === 'completed') && model.file_id
        );
        setModels(validModels);
        if (validModels.length === 0) {
          setModelError('No valid models found');
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModelError('Failed to fetch models');
      } finally {
        setLoadingModel(false);
      }
    };
    
    fetchModels();
  }, []);

  useEffect(() => {
    // Update page title to reflect Digital Twin dashboard
    document.title = "Digital Twin Dashboard | MatrixTwin";
  }, []);

  // Clean up function to remove the viewer
  const cleanupViewer = () => {
    try {
      if (skyBoxManagerRef.current) {
        // Clean up SkyBox if it exists
        skyBoxManagerRef.current = null;
      }
      
      if (appRef.current) {
        console.log("Cleaning up previous viewer instance");
        appRef.current = null;
      }
      if (viewerRef.current) {
        viewerRef.current = null;
      }
      
      // Remove any BIMFACE scripts that might have been added
      const bimfaceScripts = document.querySelectorAll('script[src*="bimface"]');
      bimfaceScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    } catch (e) {
      console.error("Error during cleanup:", e);
    }
  };

  // Function to initialize the SkyBox
  const initializeSkyBox = (viewer: any) => {
    try {
      console.log("🌥️ Initializing SkyBox...");
      
      // Check if the SkyBox plugin is available
      if ((window as any).Glodon?.Bimface?.Plugins?.SkyBox) {
        const Glodon = (window as any).Glodon;
        
        // Create SkyBox configuration
        const skyBoxManagerConfig = new Glodon.Bimface.Plugins.SkyBox.SkyBoxManagerConfig();
        skyBoxManagerConfig.viewer = viewer;
        skyBoxManagerConfig.style = Glodon.Bimface.Plugins.SkyBox.SkyBoxStyle.CloudySky;
        
        // Create SkyBox manager
        const skyBoxManager = new Glodon.Bimface.Plugins.SkyBox.SkyBoxManager(skyBoxManagerConfig);
        skyBoxManagerRef.current = skyBoxManager;
        
        console.log("🌥️ SkyBox initialized successfully");
      } else {
        console.error("SkyBox plugin not available");
      }
    } catch (e) {
      console.error("Error initializing SkyBox:", e);
    }
  };

  // Toggle SkyBox on/off
  const toggleSkyBox = () => {
    const newState = !skyBoxEnabled;
    setSkyBoxEnabled(newState);
    
    if (viewerRef.current) {
      if (newState) {
        // Enable SkyBox
        if (!skyBoxManagerRef.current) {
          initializeSkyBox(viewerRef.current);
        }
      } else {
        // Disable SkyBox
        if (skyBoxManagerRef.current) {
          skyBoxManagerRef.current = null;
          // Re-render to update the view without skybox
          viewerRef.current.render();
        }
      }
    }
  };

  // Initialize the viewer when a valid model is available
  useEffect(() => {
    if (models.length > 0 && modelContainerRef.current && show3DModel) {
      const firstModel = models[0];
      
      if (!firstModel.file_id) {
        setModelError('Model has no file ID');
        return;
      }
      
      // Clean up any existing viewer
      cleanupViewer();
      
      // Create a container for the viewer
      const viewerContainer = document.createElement('div');
      viewerContainer.id = 'bimfaceContainer';
      viewerContainer.style.width = '100%';
      viewerContainer.style.height = '100%';
      
      // Clear the container and add the viewer container
      if (modelContainerRef.current) {
        modelContainerRef.current.innerHTML = '';
        modelContainerRef.current.appendChild(viewerContainer);
      }
      
      // Get fresh view token and initialize viewer
      const initializeWithFreshToken = async () => {
        try {
          console.log(`Getting fresh view token for file ID: ${firstModel.file_id}`);
          const tokenResponse = await getFreshViewToken(firstModel.file_id!);
          
          // Load the BIMFACE SDK
          const script = document.createElement('script');
          script.src = "https://static.bimface.com/api/BimfaceSDKLoader/BimfaceSDKLoader@latest-release.js";
          script.async = true;
          script.onload = () => {
            initializeViewer(tokenResponse.viewToken);
          };
          document.body.appendChild(script);
        } catch (error) {
          console.error('Error getting fresh view token:', error);
          setModelError(`Failed to get fresh view token: ${error instanceof Error ? error.message : String(error)}`);
          setLoadingModel(false);
        }
      };
      
      initializeWithFreshToken();
    }
    
    return () => {
      cleanupViewer();
    };
  }, [models, show3DModel]);

  const initializeViewer = (token: string) => {
    try {
      console.log("Initializing BIMFACE Viewer with token:", token);
      
      // Follow the exact example from HTML directly
      const options = new (window as any).BimfaceSDKLoaderConfig();
      options.viewToken = token;
      // Set language to English explicitly
      options.language = "en_GB";
      
      console.log("Config created with language set to English, starting to load SDK...");
      
      // Use the load function exactly as in the example
      (window as any).BimfaceSDKLoader.load(
        options, 
        function successCallback(viewMetaData: any) {
          console.log("Model loaded successfully. Metadata:", viewMetaData);
          
          if (viewMetaData.viewType === "3DView") {
            // Get DOM element
            const domShow = document.getElementById('bimfaceContainer');
            if (!domShow) {
              throw new Error("Target DOM element not found");
            }
            
            // Setup web app config
            const Glodon = (window as any).Glodon;
            const webAppConfig = new Glodon.Bimface.Application.WebApplication3DConfig();
            webAppConfig.domElement = domShow;
            
            // Set global unit to millimeters
            webAppConfig.globalUnit = Glodon.Bimface.Common.Units.LengthUnits.Millimeter;
            
            // Create WebApplication
            const app = new Glodon.Bimface.Application.WebApplication3D(webAppConfig);
            appRef.current = app;
            
            // Add view
            app.addView(token);
            
            // Get viewer
            const viewer = app.getViewer();
            viewerRef.current = viewer;
            
            // Add event listener for view added
            viewer.addEventListener(Glodon.Bimface.Viewer.Viewer3DEvent.ViewAdded, function() {
              console.log("View added successfully!");
              
              // Initialize SkyBox after view is added
              if (skyBoxEnabled) {
                initializeSkyBox(viewer);
              }
              
              // Initialize component highlighting for any selected sensor
              if (selectedSensor) {
                try {
                  console.log(`Highlighting sensor ${selectedSensor.id} in the 3D model`);
                  
                  // Sample highlighting mechanism - in a real implementation, 
                  // you would map the sensor location to actual component IDs
                  const randomComponentId = Math.floor(Math.random() * 1000) + 1;
                  
                  viewer.highlightComponentsByObjectData([{
                    id: randomComponentId,
                    color: new Glodon.Web.Graphics.Color(255, 99, 71, 0.7) // Tomato color with transparency
                  }]);
                  
                  // Zoom to the highlighted component
                  viewer.jumpToComponent({
                    id: randomComponentId,
                    margin: 1.2
                  });
                } catch (e) {
                  console.error("Error highlighting sensor in model:", e);
                }
              }
              
              viewer.render();
              setLoadingModel(false);
            });
          }
        },
        function failureCallback(error: any) {
          console.error("Failed to load model:", error);
          setModelError(`Failed to load model: ${error || 'Unknown error'}`);
          setLoadingModel(false);
        }
      );
    } catch (e) {
      console.error("Error initializing viewer:", e);
      setModelError(`Error initializing BIMFACE viewer: ${e instanceof Error ? e.message : String(e)}`);
      setLoadingModel(false);
    }
  };
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prevSensors => 
        prevSensors.map(sensor => ({
          ...sensor,
          value: sensor.type === 'temperature' 
            ? parseFloat((sensor.value + (Math.random() * 0.6 - 0.3)).toFixed(1))
            : sensor.type === 'humidity'
              ? Math.floor(sensor.value + (Math.random() * 6 - 3))
              : sensor.type === 'occupancy'
                ? Math.max(0, Math.floor(sensor.value + (Math.random() * 3 - 1)))
                : sensor.value,
          lastUpdated: new Date().toISOString()
        }))
      );
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Filter sensors based on floor and type
  const filteredSensors = sensors.filter(sensor => 
    (selectedFloor === null || sensor.floor === selectedFloor) &&
    (filterType === null || sensor.type === filterType)
  );
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate a refresh delay
    setTimeout(() => {
      setSensors(mockSensors.map(sensor => ({
        ...sensor,
        value: sensor.type === 'temperature' 
          ? parseFloat((sensor.value + (Math.random() * 0.6 - 0.3)).toFixed(1))
          : sensor.type === 'humidity'
            ? Math.floor(sensor.value + (Math.random() * 6 - 3))
            : sensor.type === 'occupancy'
              ? Math.max(0, Math.floor(sensor.value + (Math.random() * 3 - 1)))
              : sensor.value,
        lastUpdated: new Date().toISOString()
      })));
      setRefreshing(false);
    }, 1000);
  };
  
  // Chart configurations
  const temperatureChartData = {
    labels: temperatureData.labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData.data,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
      },
    ],
  };
  
  const temperatureChartOptions = {
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
      },
    },
  };
  
  const energyConsumptionData = {
    labels: ['HVAC', 'Lighting', 'Equipment', 'Others'],
    datasets: [
      {
        label: 'Energy Consumption',
        data: [42, 23, 25, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const occupancyData = {
    labels: ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
    datasets: [
      {
        label: 'Occupancy',
        data: [4, 12, 20, 18, 15, 6],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };
  
  const occupancyOptions = {
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
  
  const getSensorTimeSeriesData = (type: SensorType) => {
    switch (type) {
      case 'temperature':
        return { time: temperatureData.labels, value: temperatureData.data };
      case 'humidity':
        return { time: humidityData.labels, value: humidityData.data };
      case 'energy':
        return { time: energyData.labels, value: energyData.data };
      default:
        return { time: [], value: [] };
    }
  };

  const getSensorChartColor = (type: SensorType) => {
    switch (type) {
      case 'temperature':
        return 'rgb(255, 99, 132)';
      case 'humidity':
        return 'rgb(54, 162, 235)';
      case 'energy':
        return 'rgb(255, 206, 86)';
      default:
        return 'rgb(255, 99, 132)';
    }
  };

  const displayedSensors = filteredSensors.filter(sensor => 
    (showTemperature && sensor.type === 'temperature') ||
    (showHumidity && sensor.type === 'humidity') ||
    (showEnergy && sensor.type === 'energy') ||
    (showMotion && sensor.type === 'occupancy')
  );

  // Inline styles to ensure content stays visible
  const baseStyle = { zIndex: 10, position: 'relative' as const };

  // Functions to handle 3D model interactions
  const highlightSensorInModel = (sensor: Sensor) => {
    // This would interact with your 3D model library
    console.log(`Highlighting sensor ${sensor.id} at ${sensor.location} on floor ${sensor.floor}`);
    
    // If we have a viewer reference, we could highlight objects in the model
    if (viewerRef.current && sensor.type === 'temperature') {
      try {
        // This is a simplified example - in a real implementation, you would
        // need to map sensor locations to actual model objects
        const Glodon = (window as any).Glodon;
        if (Glodon && Glodon.Bimface) {
          // Reset any previous highlighting
          viewerRef.current.clearHighlightComponents();
          
          // In a real implementation, you would look up the component ID
          // based on the sensor location
          // For now, just highlight a random component for demonstration
          viewerRef.current.highlightComponentsByObjectData([{
            id: Math.floor(Math.random() * 1000) + 1,
            color: new Glodon.Web.Graphics.Color(255, 0, 0, 0.8)
          }]);
          
          viewerRef.current.render();
        }
      } catch (e) {
        console.error("Error highlighting sensor in model:", e);
      }
    }
  };

  // When a sensor is selected, highlight it in the 3D model
  useEffect(() => {
    if (selectedSensor) {
      highlightSensorInModel(selectedSensor);
    }
  }, [selectedSensor]);

  // Navigate to ModelViewerPage with proper data and active overlay
  const navigateToModelViewer = (
    activeTab: 'iot' | 'analytics' | 'controls' | 'info', 
    sensorData?: Sensor | null
  ) => {
    if (models.length > 0 && models[0].file_id) {
      // Prepare sensors data to be passed to the model viewer
      const sensorParam = sensorData ? encodeURIComponent(JSON.stringify(sensorData)) : '';
      
      navigate(
        `/digital-twins/viewer?fileId=${models[0].file_id}&activeOverlay=${activeTab}${sensorData ? `&sensorData=${sensorParam}` : ''}`
      );
    } else {
      alert('No valid model available for viewing');
    }
  };

  // Improve the handleFullscreenView function to make it pass the active tab and selected sensor
  const handleFullscreenView = () => {
    if (models.length > 0 && models[0].file_id) {
      navigateToModelViewer(activeTab === 'iot' ? 'iot' : activeTab === 'analytics' ? 'analytics' : 'controls', selectedSensor || undefined);
    } else {
      alert('No valid model available for full-screen view');
    }
  };

  // Handle tab selection from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'analytics') {
      setActiveTab('analytics');
    } else if (tab === 'controls') {
      setActiveTab('controls');
    } else if (tab === 'cctv') {
      setActiveTab('cctv');
    } else {
      setActiveTab('iot');
    }
  }, [location.search]);

  // Update URL when tab changes
  const handleTabChange = (tab: 'iot' | 'analytics' | 'controls' | 'cctv') => {
    setActiveTab(tab);
    navigate(`/digital-twins/iot-dashboard?tab=${tab}`, { replace: true });
  };

  return (
    <div className="iot-container mx-auto px-4 py-8" style={baseStyle}>
      {/* Header */}
      <div className="iot-header mb-6" style={baseStyle}>
        <div className="iot-header-title flex items-center mb-4" style={baseStyle}>
          <Link to="/dashboard" className="iot-back-button text-gray-400 hover:text-white mr-4" style={baseStyle}>
            <RiArrowGoBackLine className="text-xl" />
          </Link>
          <RiBuilding4Line className="iot-header-icon text-ai-blue text-3xl mr-3" style={baseStyle} />
          <h1 className="iot-header-text text-2xl font-bold text-white" style={baseStyle}>
            Digital Twin Dashboard
          </h1>
          <button 
            className={`iot-refresh-button ml-4 text-gray-400 hover:text-white ${refreshing ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            style={baseStyle}
          >
            <RiRefreshLine className="text-xl" />
          </button>
        </div>
        <p className="iot-header-description text-gray-400 max-w-3xl" style={baseStyle}>
          Comprehensive digital representation of your building with integrated IoT sensors, analytics, and smart controls.
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1 border border-slate-700">
        <button
          onClick={() => handleTabChange('iot')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
            activeTab === 'iot' 
              ? 'bg-gradient-to-r from-ai-blue/20 to-ai-purple/20 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RiSensorLine className={`mr-2 ${activeTab === 'iot' ? 'text-ai-blue' : ''}`} />
          <span>IoT Sensors</span>
        </button>
        <button
          onClick={() => handleTabChange('analytics')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
            activeTab === 'analytics' 
              ? 'bg-gradient-to-r from-ai-blue/20 to-ai-purple/20 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RiBarChartBoxLine className={`mr-2 ${activeTab === 'analytics' ? 'text-ai-blue' : ''}`} />
          <span>Building Analytics</span>
        </button>
        <button
          onClick={() => handleTabChange('controls')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
            activeTab === 'controls' 
              ? 'bg-gradient-to-r from-ai-blue/20 to-ai-purple/20 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RiRemoteControlLine className={`mr-2 ${activeTab === 'controls' ? 'text-ai-blue' : ''}`} />
          <span>Smart Controls</span>
        </button>
        <button
          onClick={() => handleTabChange('cctv')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg transition-all ${
            activeTab === 'cctv' 
              ? 'bg-gradient-to-r from-ai-blue/20 to-ai-purple/20 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RiCameraLine className={`mr-2 ${activeTab === 'cctv' ? 'text-ai-blue' : ''}`} />
          <span>AI CCTV</span>
        </button>
      </div>
      
      {/* Quick stats */}
      {activeTab === 'iot' && (
        <div className="iot-quick-stats grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="iot-stat-card iot-stat-temp bg-gradient-to-br from-blue-900/40 to-blue-700/20 border border-blue-800/50 rounded-xl p-4">
            <div className="iot-stat-header flex items-center mb-2">
              <RiTempHotLine className="iot-stat-icon text-blue-400 text-2xl mr-2" />
              <h3 className="iot-stat-title text-white font-medium">Temperature</h3>
            </div>
            <div className="iot-stat-value-row flex items-end">
              <span className="iot-stat-value text-3xl font-bold text-white">22.8</span>
              <span className="iot-stat-unit text-blue-300 ml-1 pb-1">°C</span>
            </div>
            <div className="iot-stat-desc text-blue-300 text-sm">Average across all sensors</div>
          </div>
          
          <div className="iot-stat-card iot-stat-humidity bg-gradient-to-br from-green-900/40 to-green-700/20 border border-green-800/50 rounded-xl p-4">
            <div className="iot-stat-header flex items-center mb-2">
              <RiWaterFlashLine className="iot-stat-icon text-green-400 text-2xl mr-2" />
              <h3 className="iot-stat-title text-white font-medium">Humidity</h3>
            </div>
            <div className="iot-stat-value-row flex items-end">
              <span className="iot-stat-value text-3xl font-bold text-white">45</span>
              <span className="iot-stat-unit text-green-300 ml-1 pb-1">%</span>
            </div>
            <div className="iot-stat-desc text-green-300 text-sm">Average across all sensors</div>
          </div>
          
          <div className="iot-stat-card iot-stat-energy bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border border-yellow-800/50 rounded-xl p-4">
            <div className="iot-stat-header flex items-center mb-2">
              <RiLightbulbLine className="iot-stat-icon text-yellow-400 text-2xl mr-2" />
              <h3 className="iot-stat-title text-white font-medium">Energy</h3>
            </div>
            <div className="iot-stat-value-row flex items-end">
              <span className="iot-stat-value text-3xl font-bold text-white">142.5</span>
              <span className="iot-stat-unit text-yellow-300 ml-1 pb-1">kWh</span>
            </div>
            <div className="iot-stat-desc text-yellow-300 text-sm">Today's consumption</div>
          </div>
          
          <div className="iot-stat-card iot-stat-occupancy bg-gradient-to-br from-purple-900/40 to-purple-700/20 border border-purple-800/50 rounded-xl p-4">
            <div className="iot-stat-header flex items-center mb-2">
              <RiUserLocationLine className="iot-stat-icon text-purple-400 text-2xl mr-2" />
              <h3 className="iot-stat-title text-white font-medium">Occupancy</h3>
            </div>
            <div className="iot-stat-value-row flex items-end">
              <span className="iot-stat-value text-3xl font-bold text-white">18</span>
              <span className="iot-stat-unit text-purple-300 ml-1 pb-1">people</span>
            </div>
            <div className="iot-stat-desc text-purple-300 text-sm">Current building occupancy</div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-quick-stats grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-gradient-to-br from-indigo-900/40 to-indigo-700/20 border border-indigo-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiBarChartBoxLine className="stat-icon text-indigo-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Energy Usage</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">142.5</span>
              <span className="stat-unit text-indigo-300 ml-1 pb-1">kWh</span>
            </div>
            <div className="stat-desc text-indigo-300 text-sm">Today's consumption</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-purple-900/40 to-purple-700/20 border border-purple-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiUserLocationLine className="stat-icon text-purple-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Peak Occupancy</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">24</span>
              <span className="stat-unit text-purple-300 ml-1 pb-1">people</span>
            </div>
            <div className="stat-desc text-purple-300 text-sm">At 11:30 AM today</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-cyan-900/40 to-cyan-700/20 border border-cyan-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiThermometerLine className="stat-icon text-cyan-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">HVAC Efficiency</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">92</span>
              <span className="stat-unit text-cyan-300 ml-1 pb-1">%</span>
            </div>
            <div className="stat-desc text-cyan-300 text-sm">System performance</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-amber-900/40 to-amber-700/20 border border-amber-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiLightbulbLine className="stat-icon text-amber-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Lighting Usage</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">35.2</span>
              <span className="stat-unit text-amber-300 ml-1 pb-1">kWh</span>
            </div>
            <div className="stat-desc text-amber-300 text-sm">Today's consumption</div>
          </div>
        </div>
      )}

      {activeTab === 'controls' && (
        <div className="controls-quick-stats grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-gradient-to-br from-blue-900/40 to-blue-700/20 border border-blue-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center justify-between mb-2">
              <h3 className="stat-title text-white font-medium">HVAC System</h3>
              <div className={`w-3 h-3 rounded-full ${hvacEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">{targetTemp}</span>
              <span className="stat-unit text-blue-300 ml-1 pb-1">°C</span>
            </div>
            <div className="stat-desc text-blue-300 text-sm">Target temperature</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border border-yellow-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center justify-between mb-2">
              <h3 className="stat-title text-white font-medium">Lighting</h3>
              <div className={`w-3 h-3 rounded-full ${lightingEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">{lightingLevel}</span>
              <span className="stat-unit text-yellow-300 ml-1 pb-1">%</span>
            </div>
            <div className="stat-desc text-yellow-300 text-sm">Brightness level</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-green-900/40 to-green-700/20 border border-green-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center justify-between mb-2">
              <h3 className="stat-title text-white font-medium">Security</h3>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">Armed</span>
            </div>
            <div className="stat-desc text-green-300 text-sm">All doors secure</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-red-900/40 to-red-700/20 border border-red-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <h3 className="stat-title text-white font-medium">Fire Safety</h3>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">Normal</span>
            </div>
            <div className="stat-desc text-red-300 text-sm">All systems operational</div>
          </div>
        </div>
      )}

      {activeTab === 'cctv' && (
        <div className="cctv-quick-stats grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-gradient-to-br from-red-900/40 to-red-700/20 border border-red-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiCameraLine className="stat-icon text-red-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Active Cameras</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">{cctvCameras.filter(cam => cam.status === 'online' || cam.status === 'recording').length}</span>
              <span className="stat-unit text-red-300 ml-1 pb-1">/ {cctvCameras.length}</span>
            </div>
            <div className="stat-desc text-red-300 text-sm">Cameras operational</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-orange-900/40 to-orange-700/20 border border-orange-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiRecordCircleLine className="stat-icon text-orange-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Recording</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">{cctvCameras.filter(cam => cam.isRecording).length}</span>
              <span className="stat-unit text-orange-300 ml-1 pb-1">cameras</span>
            </div>
            <div className="stat-desc text-orange-300 text-sm">Currently recording</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border border-yellow-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiAlertLine className="stat-icon text-yellow-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Alerts</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">{cctvCameras.reduce((total, cam) => total + cam.alerts.length, 0)}</span>
              <span className="stat-unit text-yellow-300 ml-1 pb-1">today</span>
            </div>
            <div className="stat-desc text-yellow-300 text-sm">Security alerts</div>
          </div>
          
          <div className="stat-card bg-gradient-to-br from-green-900/40 to-green-700/20 border border-green-800/50 rounded-xl p-4">
            <div className="stat-header flex items-center mb-2">
              <RiEyeLine className="stat-icon text-green-400 text-2xl mr-2" />
              <h3 className="stat-title text-white font-medium">Coverage</h3>
            </div>
            <div className="stat-value-row flex items-end">
              <span className="stat-value text-3xl font-bold text-white">98</span>
              <span className="stat-unit text-green-300 ml-1 pb-1">%</span>
            </div>
            <div className="stat-desc text-green-300 text-sm">Building coverage</div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="iot-main-content grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - always visible for sensor list */}
        <div className="iot-sensor-list lg:col-span-1">
          <div className="iot-sensor-list-header flex items-center justify-between mb-4">
            <h2 className="iot-section-title text-xl font-bold text-white">
              {activeTab === 'iot' ? 'Sensors' : activeTab === 'analytics' ? 'Building Zones' : activeTab === 'controls' ? 'Control Zones' : 'CCTV Cameras'}
            </h2>
            <div className="iot-controls flex space-x-2">
              <div className="iot-filter-dropdown relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="iot-filter-btn flex items-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm"
                >
                  <RiFilterLine className="iot-filter-icon mr-1" />
                  Filter
                </button>
                {isFilterOpen && (
                  <div className="iot-filter-menu absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 p-2">
                    {activeTab === 'iot' ? (
                      <>
                        <div className="iot-filter-option mb-2">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={showTemperature}
                              onChange={() => setShowTemperature(!showTemperature)}
                            />
                            Temperature
                          </label>
                        </div>
                        <div className="iot-filter-option mb-2">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={showHumidity}
                              onChange={() => setShowHumidity(!showHumidity)}
                            />
                            Humidity
                          </label>
                        </div>
                        <div className="iot-filter-option mb-2">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={showEnergy}
                              onChange={() => setShowEnergy(!showEnergy)}
                            />
                            Energy
                          </label>
                        </div>
                        <div className="iot-filter-option">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={showMotion}
                              onChange={() => setShowMotion(!showMotion)}
                            />
                            Motion
                          </label>
                        </div>
                      </>
                    ) : activeTab === 'cctv' ? (
                      <>
                        <div className="iot-filter-option mb-2">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={true}
                              onChange={() => {}}
                            />
                            Online
                          </label>
                        </div>
                        <div className="iot-filter-option mb-2">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={true}
                              onChange={() => {}}
                            />
                            Recording
                          </label>
                        </div>
                        <div className="iot-filter-option">
                          <label className="iot-filter-label flex items-center text-slate-300 text-sm">
                            <input
                              type="checkbox"
                              className="iot-filter-checkbox mr-2"
                              checked={true}
                              onChange={() => {}}
                            />
                            Motion Detection
                          </label>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <button 
                onClick={handleRefresh}
                className="iot-refresh-btn flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                <RiRefreshLine className="iot-refresh-icon mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="iot-sensor-items space-y-3">
            {activeTab === 'cctv' ? (
              cctvCameras.map(camera => (
                <div 
                  key={camera.id}
                  className={`iot-sensor-item flex items-center justify-between bg-slate-800/50 border ${
                    selectedCamera?.id === camera.id ? 'border-indigo-500' : 'border-slate-700'
                  } rounded-xl p-3 cursor-pointer hover:bg-slate-800 transition-all`}
                  onClick={() => setSelectedCamera(camera)}
                >
                  <div className="iot-sensor-info flex items-center">
                    <div className={`iot-sensor-icon-wrapper p-2 rounded-lg mr-3 ${
                      camera.status === 'recording' ? 'bg-red-500/20 text-red-500' :
                      camera.status === 'online' ? 'bg-green-500/20 text-green-500' :
                      camera.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      <RiCameraLine className="iot-sensor-icon text-xl" />
                    </div>
                    <div>
                      <h3 className="iot-sensor-name text-white font-medium">{camera.name}</h3>
                      <div className="iot-sensor-location text-slate-400 text-sm">{camera.location}</div>
                    </div>
                  </div>
                  <div className="iot-sensor-status flex flex-col items-end">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      camera.status === 'recording' ? 'bg-red-500/20 text-red-400' :
                      camera.status === 'online' ? 'bg-green-500/20 text-green-400' :
                      camera.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {camera.status}
                    </div>
                    <div className="iot-sensor-last-updated text-slate-400 text-xs mt-1">{camera.lastActivity}</div>
                  </div>
                </div>
              ))
            ) : (
              displayedSensors.map(sensor => (
                <div 
                  key={sensor.id}
                  className={`iot-sensor-item flex items-center justify-between bg-slate-800/50 border ${
                    selectedSensor?.id === sensor.id ? 'border-indigo-500' : 'border-slate-700'
                  } rounded-xl p-3 cursor-pointer hover:bg-slate-800 transition-all`}
                  onClick={() => setSelectedSensor(sensor)}
                >
                  <div className="iot-sensor-info flex items-center">
                    <div className={`iot-sensor-icon-wrapper p-2 rounded-lg mr-3 ${getSensorTypeColor(sensor.type)}`}>
                      <SensorIcon type={sensor.type} className="iot-sensor-icon text-xl" />
                    </div>
                    <div>
                      <h3 className="iot-sensor-name text-white font-medium">{sensor.name}</h3>
                      <div className="iot-sensor-location text-slate-400 text-sm">{sensor.location}</div>
                    </div>
                  </div>
                  <div className="iot-sensor-status flex flex-col items-end">
                    <StatusIndicator status={sensor.status} />
                    <div className="iot-sensor-last-updated text-slate-400 text-xs mt-1">Updated {sensor.lastUpdated}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Right content area - changes based on active tab */}
        <div className="iot-chart-section lg:col-span-2">
          {/* Always show 3D model at the top if available */}
          {models.length > 0 && show3DModel && activeTab !== 'cctv' && (
            <div className="iot-3d-model-container bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 h-72">
              <div 
                ref={modelContainerRef} 
                className="h-full w-full relative"
              >
                {loadingModel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                    <div className="flex flex-col items-center">
                      <RiLoader4Line className="text-3xl text-indigo-500 animate-spin mb-2" />
                      <span className="text-white">Loading 3D model...</span>
                    </div>
                  </div>
                )}
                
                {modelError && !loadingModel && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-red-400 font-medium mb-2">Error loading model</div>
                      <div className="text-slate-400 text-sm">{modelError}</div>
                    </div>
                  </div>
                )}
                
                {!models.length && !modelError && !loadingModel && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white font-medium mb-2">3D Building Model</div>
                      <div className="text-slate-400 text-sm">
                        No 3D models available. Please upload a model in the Digital Twins section.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overlay navigation buttons */}
          {show3DModel && models.length > 0 && models[0].file_id && activeTab !== 'cctv' && (
            <div className="overlay-nav-buttons grid grid-cols-4 gap-2 mb-6">
              <button 
                onClick={() => navigateToModelViewer('iot', selectedSensor || undefined)}
                className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
              >
                <RiSensorLine className="mr-1" /> IoT Sensors
              </button>
              <button 
                onClick={() => navigateToModelViewer('analytics', selectedSensor || undefined)}
                className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
              >
                <RiBarChartBoxLine className="mr-1" /> Building Analytics
              </button>
              <button 
                onClick={() => navigateToModelViewer('controls', selectedSensor || undefined)}
                className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
              >
                <RiRemoteControlLine className="mr-1" /> Smart Controls
              </button>
              <button 
                onClick={() => navigateToModelViewer('info', selectedSensor || undefined)}
                className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm"
              >
                <RiInformationLine className="mr-1" /> Model Info
              </button>
            </div>
          )}

          {/* 3D Model Control Buttons */}
          {show3DModel && models.length > 0 && models[0].file_id && activeTab !== 'cctv' && (
            <div className="flex justify-end space-x-2 mb-4">
              <button 
                onClick={toggleSkyBox}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                {skyBoxEnabled ? 'Disable Sky' : 'Enable Sky'}
              </button>
              <button 
                onClick={handleFullscreenView}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center"
                title="View in fullscreen"
              >
                <RiFullscreenLine className="mr-1" /> Fullscreen
              </button>
            </div>
          )}

          {selectedSensor ? (
            <>
              <div className="iot-chart-header mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="iot-chart-title text-xl font-bold text-white">
                    {selectedSensor.name} - {activeTab === 'iot' ? 'Data Visualization' : activeTab === 'analytics' ? 'Analytics' : 'Controls'}
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShow3DModel(!show3DModel)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm"
                    >
                      {show3DModel ? 'Hide 3D View' : 'Show 3D View'}
                    </button>
                  </div>
                </div>
                <div className="iot-chart-subtitle text-slate-400 text-sm">
                  {selectedSensor.location} · Floor {selectedSensor.floor}
                </div>
              </div>
              
              {/* IoT Tab Content */}
              {activeTab === 'iot' && (
                <>
                  {/* Sensor Chart */}
                  <div className="iot-chart-container bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getSensorTimeSeriesData(selectedSensor.type).time.map((time, index) => ({
                          time,
                          value: getSensorTimeSeriesData(selectedSensor.type).value[index]
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="time" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            borderColor: '#334155',
                            color: '#f8fafc' 
                          }} 
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="value" 
                          stroke={getSensorChartColor(selectedSensor.type)} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Sensor Details */}
                  <div className="iot-sensor-details grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="iot-details-card bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <h3 className="iot-details-title text-md font-semibold text-white mb-3">Details</h3>
                      <div className="iot-details-grid grid grid-cols-2 gap-2">
                        <div className="iot-details-label text-slate-400 text-sm">ID:</div>
                        <div className="iot-details-value text-white text-sm">{selectedSensor.id}</div>
                        <div className="iot-details-label text-slate-400 text-sm">Type:</div>
                        <div className="iot-details-value text-white text-sm">{selectedSensor.type}</div>
                        <div className="iot-details-label text-slate-400 text-sm">Status:</div>
                        <div className="iot-details-value text-white text-sm">{selectedSensor.status}</div>
                        <div className="iot-details-label text-slate-400 text-sm">Battery:</div>
                        <div className="iot-details-value text-white text-sm">{selectedSensor.battery}%</div>
                      </div>
                    </div>
                    
                    <div className="iot-activity-card bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <h3 className="iot-activity-title text-md font-semibold text-white mb-3">Recent Activity</h3>
                      <div className="iot-activity-list space-y-2">
                        {selectedSensor.recentActivity.map((activity, idx) => (
                          <div key={idx} className="iot-activity-item flex items-start space-x-2">
                            <div className="iot-activity-icon text-indigo-400 mt-0.5">
                              <RiInformationLine />
                            </div>
                            <div className="iot-activity-content">
                              <div className="iot-activity-text text-white text-sm">{activity.message}</div>
                              <div className="iot-activity-time text-slate-400 text-xs">{activity.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Analytics Tab Content */}
              {activeTab === 'analytics' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <h3 className="text-md font-semibold text-white mb-3">Energy Consumption</h3>
                      <div className="h-64">
                        <Doughnut 
                          data={energyConsumptionData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: { color: 'rgb(229, 231, 235)' }
                              }
                            }
                          }} 
                        />
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <h3 className="text-md font-semibold text-white mb-3">Historical Data</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={Array.from({ length: 30 }, (_, i) => ({
                              day: `Day ${i + 1}`,
                              value: Math.floor(20 + Math.random() * 10)
                            }))}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="day" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1e293b', 
                                borderColor: '#334155',
                                color: '#f8fafc' 
                              }} 
                            />
                            <RechartsLine 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
                    <h3 className="text-md font-semibold text-white mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Efficiency Rating</div>
                        <div className="text-xl font-bold text-white">92%</div>
                        <div className="text-xs text-green-400">+2.5% from last month</div>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Uptime</div>
                        <div className="text-xl font-bold text-white">99.8%</div>
                        <div className="text-xs text-green-400">+0.2% from last month</div>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Response Time</div>
                        <div className="text-xl font-bold text-white">120ms</div>
                        <div className="text-xs text-red-400">+15ms from last month</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Controls Tab Content */}
              {activeTab === 'controls' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <RiTempColdLine className="text-blue-400 text-xl mr-2" />
                          <h3 className="text-md font-semibold text-white">HVAC Control</h3>
                        </div>
                        <button 
                          className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                            hvacEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                          onClick={() => setHvacEnabled(!hvacEnabled)}
                        >
                          <span 
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                              hvacEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-sm text-slate-400 mb-1">Temperature</label>
                        <div className="flex items-center">
                          <button 
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
                            onClick={() => setTargetTemp(prev => Math.max(16, prev - 0.5))}
                            disabled={!hvacEnabled}
                          >
                            <RiVolumeDownLine />
                          </button>
                          <div className="flex-1 mx-3 text-center">
                            <span className="text-3xl font-bold text-white">{targetTemp}°C</span>
                          </div>
                          <button 
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
                            onClick={() => setTargetTemp(prev => Math.min(28, prev + 0.5))}
                            disabled={!hvacEnabled}
                          >
                            <RiVolumeUpLine />
                          </button>
                        </div>
                        
                        <div className="mt-6">
                          <label className="block text-sm text-slate-400 mb-2">Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button className="bg-blue-500/20 text-blue-400 py-2 rounded-lg border border-blue-500/30">Cool</button>
                            <button className="bg-slate-700 text-slate-300 py-2 rounded-lg">Auto</button>
                            <button className="bg-slate-700 text-slate-300 py-2 rounded-lg">Heat</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <RiLightbulbFlashLine className="text-yellow-400 text-xl mr-2" />
                          <h3 className="text-md font-semibold text-white">Lighting Control</h3>
                        </div>
                        <button 
                          className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                            lightingEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                          onClick={() => setLightingEnabled(!lightingEnabled)}
                        >
                          <span 
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                              lightingEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-sm text-slate-400 mb-1">Brightness ({lightingLevel}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={lightingLevel}
                          onChange={(e) => setLightingLevel(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          disabled={!lightingEnabled}
                        />
                        
                        <div className="flex justify-between mt-2 text-xs text-slate-400">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-sm text-slate-400 mb-2">Zones</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-yellow-500/20 text-yellow-400 py-2 rounded-lg border border-yellow-500/30">Main Office</button>
                          <button className="bg-slate-700 text-slate-300 py-2 rounded-lg">Conference Room</button>
                          <button className="bg-slate-700 text-slate-300 py-2 rounded-lg">Lobby</button>
                          <button className="bg-slate-700 text-slate-300 py-2 rounded-lg">All Zones</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <h3 className="text-md font-semibold text-white mb-4">Quick Controls</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <RiLightbulbLine className="text-2xl text-yellow-400 mb-2" />
                        <span className="text-sm text-white">All Lights</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <RiTempHotLine className="text-2xl text-red-400 mb-2" />
                        <span className="text-sm text-white">HVAC</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <RiDoorLockLine className="text-2xl text-green-400 mb-2" />
                        <span className="text-sm text-white">Security</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                        <RiAlarmWarningLine className="text-2xl text-red-400 mb-2" />
                        <span className="text-sm text-white">Alarms</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : activeTab === 'cctv' && selectedCamera ? (
            <>
              <div className="iot-chart-header mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="iot-chart-title text-xl font-bold text-white">
                    {selectedCamera.name} - Camera Feed
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShow3DModel(!show3DModel)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm"
                    >
                      {show3DModel ? 'Hide 3D View' : 'Show 3D View'}
                    </button>
                  </div>
                </div>
                <div className="iot-chart-subtitle text-slate-400 text-sm">
                  {selectedCamera.location} · Floor {selectedCamera.floor}
                </div>
              </div>

              {/* Camera Feed Simulation */}
              <div className="cctv-feed-container bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 h-72">
                <div className="h-full w-full relative bg-slate-900 rounded-lg overflow-hidden">
                  {/* Simulated camera feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <RiVideoLine className="text-6xl text-slate-600 mb-4 mx-auto" />
                      <div className="text-white font-medium mb-2">{selectedCamera.name}</div>
                      <div className="text-slate-400 text-sm">{selectedCamera.location} • {selectedCamera.resolution}</div>
                      <div className="flex items-center justify-center mt-4 space-x-2">
                        {selectedCamera.isRecording && (
                          <div className="flex items-center text-red-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                            <span className="text-xs">REC</span>
                          </div>
                        )}
                        <div className="text-slate-400 text-xs">LIVE</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Camera controls overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiPlayLine />
                      </button>
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiPauseLine />
                      </button>
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiRecordCircleLine />
                      </button>
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiScreenshotLine />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiZoomInLine />
                      </button>
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiZoomOutLine />
                      </button>
                      <button className="bg-slate-800/80 hover:bg-slate-700/80 text-white p-2 rounded">
                        <RiFullscreenLine />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Camera Details and Controls */}
              <div className="cctv-details grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-md font-semibold text-white mb-3">Camera Details</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-slate-400 text-sm">Status:</div>
                    <div className={`text-sm font-medium ${
                      selectedCamera.status === 'recording' ? 'text-red-400' :
                      selectedCamera.status === 'online' ? 'text-green-400' :
                      selectedCamera.status === 'maintenance' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>{selectedCamera.status}</div>
                    <div className="text-slate-400 text-sm">Resolution:</div>
                    <div className="text-white text-sm">{selectedCamera.resolution}</div>
                    <div className="text-slate-400 text-sm">View Angle:</div>
                    <div className="text-white text-sm">{selectedCamera.viewAngle}</div>
                    <div className="text-slate-400 text-sm">Night Vision:</div>
                    <div className="text-white text-sm">{selectedCamera.nightVision ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Recording</span>
                      <button 
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          selectedCamera.isRecording ? 'bg-red-600' : 'bg-slate-600'
                        }`}
                        onClick={() => {
                          setCctvCameras(prev => prev.map(cam => 
                            cam.id === selectedCamera.id 
                              ? { ...cam, isRecording: !cam.isRecording }
                              : cam
                          ));
                          setSelectedCamera(prev => prev ? { ...prev, isRecording: !prev.isRecording } : null);
                        }}
                      >
                        <span 
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                            selectedCamera.isRecording ? 'translate-x-6' : 'translate-x-1'
                          }`} 
                        />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Motion Detection</span>
                      <button 
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          selectedCamera.motionDetection ? 'bg-indigo-600' : 'bg-slate-600'
                        }`}
                        onClick={() => {
                          setCctvCameras(prev => prev.map(cam => 
                            cam.id === selectedCamera.id 
                              ? { ...cam, motionDetection: !cam.motionDetection }
                              : cam
                          ));
                          setSelectedCamera(prev => prev ? { ...prev, motionDetection: !prev.motionDetection } : null);
                        }}
                      >
                        <span 
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                            selectedCamera.motionDetection ? 'translate-x-6' : 'translate-x-1'
                          }`} 
                        />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Night Vision</span>
                      <button 
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          selectedCamera.nightVision ? 'bg-indigo-600' : 'bg-slate-600'
                        }`}
                        onClick={() => {
                          setCctvCameras(prev => prev.map(cam => 
                            cam.id === selectedCamera.id 
                              ? { ...cam, nightVision: !cam.nightVision }
                              : cam
                          ));
                          setSelectedCamera(prev => prev ? { ...prev, nightVision: !prev.nightVision } : null);
                        }}
                      >
                        <span 
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                            selectedCamera.nightVision ? 'translate-x-6' : 'translate-x-1'
                          }`} 
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-md font-semibold text-white mb-3">Recent Alerts</h3>
                  <div className="space-y-3">
                    {selectedCamera.alerts.length > 0 ? (
                      selectedCamera.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <div className={`text-sm mt-0.5 ${
                            alert.type === 'motion' ? 'text-yellow-400' :
                            alert.type === 'person' ? 'text-blue-400' :
                            alert.type === 'vehicle' ? 'text-green-400' :
                            alert.type === 'access' ? 'text-purple-400' :
                            'text-red-400'
                          }`}>
                            <RiAlertLine />
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-sm">{alert.message}</div>
                            <div className="text-slate-400 text-xs">{alert.time}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-sm">No recent alerts</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Global CCTV Controls */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-md font-semibold text-white mb-4">System Controls</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      const newState = !cctvRecordingAll;
                      setCctvRecordingAll(newState);
                      setCctvCameras(prev => prev.map(cam => ({ ...cam, isRecording: newState })));
                    }}
                  >
                    <RiRecordCircleLine className={`text-2xl mb-2 ${cctvRecordingAll ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-sm text-white">{cctvRecordingAll ? 'Stop All' : 'Record All'}</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      const newState = !cctvNightVisionAll;
                      setCctvNightVisionAll(newState);
                      setCctvCameras(prev => prev.map(cam => ({ ...cam, nightVision: newState })));
                    }}
                  >
                    {cctvNightVisionAll ? (
                      <RiEyeLine className="text-2xl text-indigo-400 mb-2" />
                    ) : (
                      <RiEyeOffLine className="text-2xl text-slate-400 mb-2" />
                    )}
                    <span className="text-sm text-white">Night Vision</span>
                  </button>
                  <button 
                    className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      const newState = !cctvMotionDetectionAll;
                      setCctvMotionDetectionAll(newState);
                      setCctvCameras(prev => prev.map(cam => ({ ...cam, motionDetection: newState })));
                    }}
                  >
                    <RiUserLocationLine className={`text-2xl mb-2 ${cctvMotionDetectionAll ? 'text-green-400' : 'text-slate-400'}`} />
                    <span className="text-sm text-white">Motion Detection</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                    <RiAlarmWarningLine className="text-2xl text-yellow-400 mb-2" />
                    <span className="text-sm text-white">Alert Settings</span>
                  </button>
                </div>
              </div>
            </>
          ) : activeTab === 'cctv' && !selectedCamera ? (
            <div className="cctv-grid-container">
              {/* CCTV Grid Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">CCTV Surveillance</h2>
                <div className="flex space-x-2">
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                    <RiRecordCircleLine className="mr-2" />
                    Record All
                  </button>
                  <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                    <RiFullscreenLine className="mr-2" />
                    Fullscreen
                  </button>
                </div>
              </div>

              {/* 6 TV Screens Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {cctvCameras.map((camera, index) => (
                  <div 
                    key={camera.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 cursor-pointer hover:border-indigo-500 transition-all"
                    onClick={() => setSelectedCamera(camera)}
                  >
                    {/* TV Screen */}
                    <div className="aspect-video bg-slate-900 rounded-lg mb-3 relative overflow-hidden">
                      {/* Simulated video feed */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <div className="text-center">
                          <RiVideoLine className="text-3xl text-slate-600 mb-2 mx-auto" />
                          <div className="text-white text-sm font-medium">{camera.name}</div>
                          <div className="text-slate-400 text-xs">{camera.location}</div>
                        </div>
                      </div>
                      
                      {/* Status indicators */}
                      <div className="absolute top-2 left-2 flex space-x-1">
                        {camera.isRecording && (
                          <div className="bg-red-500/80 text-white text-xs px-2 py-1 rounded flex items-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                            REC
                          </div>
                        )}
                        <div className={`text-xs px-2 py-1 rounded ${
                          camera.status === 'online' || camera.status === 'recording' 
                            ? 'bg-green-500/80 text-white' 
                            : camera.status === 'maintenance'
                              ? 'bg-yellow-500/80 text-white'
                              : 'bg-red-500/80 text-white'
                        }`}>
                          {camera.status.toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Live indicator */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-slate-800/80 text-slate-300 text-xs px-2 py-1 rounded">
                          LIVE
                        </div>
                      </div>
                      
                      {/* Camera info overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-slate-800/80 text-white text-xs px-2 py-1 rounded">
                          {camera.resolution} • {camera.viewAngle}
                        </div>
                      </div>
                    </div>
                    
                    {/* Camera details */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium text-sm">{camera.name}</h3>
                        <p className="text-slate-400 text-xs">Floor {camera.floor}</p>
                      </div>
                      <div className="flex space-x-1">
                        {camera.nightVision && (
                          <div title="Night Vision">
                            <RiEyeLine className="text-indigo-400 text-sm" />
                          </div>
                        )}
                        {camera.motionDetection && (
                          <div title="Motion Detection">
                            <RiUserLocationLine className="text-green-400 text-sm" />
                          </div>
                        )}
                        {camera.alerts.length > 0 && (
                          <div className="relative" title="Alerts">
                            <RiAlertLine className="text-yellow-400 text-sm" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation and Controls */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm">
                    Previous
                  </button>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm">
                    Next
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 text-sm">Page 1 of 1</span>
                  <div className="flex space-x-2">
                    <button 
                      className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm"
                      onClick={() => {
                        const newState = !cctvRecordingAll;
                        setCctvRecordingAll(newState);
                        setCctvCameras(prev => prev.map(cam => ({ ...cam, isRecording: newState })));
                      }}
                    >
                      {cctvRecordingAll ? 'Stop All Recording' : 'Start All Recording'}
                    </button>
                    <button className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm">
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show the 3D model as the default view instead of "No Sensor Selected"
            <div className="iot-welcome-message bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-3">Digital Twin Dashboard</h2>
              <p className="text-slate-300 mb-4">
                Welcome to your building's digital twin. Select a sensor from the list to view detailed information and control your building systems.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-indigo-900/30 rounded-lg border border-indigo-800/50 p-4">
                  <div className="flex items-center mb-2">
                    <RiSensorLine className="text-indigo-400 text-xl mr-2" />
                    <h3 className="text-white font-medium">Real-Time Monitoring</h3>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Monitor IoT sensors in real-time and visualize their data with interactive charts.
                  </p>
                </div>
                
                <div className="bg-indigo-900/30 rounded-lg border border-indigo-800/50 p-4">
                  <div className="flex items-center mb-2">
                    <RiBarChartBoxLine className="text-indigo-400 text-xl mr-2" />
                    <h3 className="text-white font-medium">Advanced Analytics</h3>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Analyze building performance and find opportunities for optimization and energy savings.
                  </p>
                </div>
                
                <div className="bg-indigo-900/30 rounded-lg border border-indigo-800/50 p-4">
                  <div className="flex items-center mb-2">
                    <RiRemoteControlLine className="text-indigo-400 text-xl mr-2" />
                    <h3 className="text-white font-medium">Smart Controls</h3>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Control HVAC, lighting, and security systems with precision from a centralized dashboard.
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-1">Select a sensor from the list to get started →</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IoTDashboardPage; 