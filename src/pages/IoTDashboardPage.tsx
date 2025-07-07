import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RiEyeOffLine,
  RiSettings4Line,
  RiSearchLine,
  RiMoreLine,
  RiMapPinLine,
  RiTimeLine,
  RiBatteryLine
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
import StatCard from '../components/ui/StatCard';
import TabNavigation from '../components/ui/TabNavigation';
import { getAllModels, ModelRecord } from '../utils/supabaseModelsApi';
import { getFreshViewToken } from '../utils/bimfaceTokenApi';
import { useAuth } from '../contexts/AuthContext';
import SmartLockDashboard from '../components/SmartLockDashboard';

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
  const isInitializingRef = useRef<boolean>(false); // Add flag to prevent duplicate initialization
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
      // Reset initialization flag
      isInitializingRef.current = false;
      
      if (skyBoxManagerRef.current) {
        // Clean up SkyBox if it exists
        skyBoxManagerRef.current = null;
      }
      
      if (appRef.current) {
        console.log("Cleaning up previous viewer instance");
        // Properly dispose of the application
        try {
          appRef.current.destroy?.();
        } catch (e) {
          console.warn("Error destroying app:", e);
        }
        appRef.current = null;
      }
      
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy?.();
        } catch (e) {
          console.warn("Error destroying viewer:", e);
        }
        viewerRef.current = null;
      }
      
      // Clear the container content
      if (modelContainerRef.current) {
        modelContainerRef.current.innerHTML = '';
      }
      
      // Remove any existing BIMFACE container with static ID
      const existingContainer = document.getElementById('bimfaceContainer');
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.removeChild(existingContainer);
      }
      
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
    // Only initialize if we have models, container, and want to show 3D model
    if (models.length > 0 && modelContainerRef.current && show3DModel) {
      const firstModel = models[0];
      
      if (!firstModel.file_id) {
        setModelError('Model has no file ID');
        return;
      }
      
      // Prevent duplicate initialization
      if (isInitializingRef.current) {
        console.log('Viewer is already initializing, skipping duplicate initialization');
        return;
      }
      
      // Set initialization flag
      isInitializingRef.current = true;
      
      // Clean up any existing viewer first
      cleanupViewer();
      
      // Check if BIMFACE SDK is already loaded
      const isSDKLoaded = !!(window as any).BimfaceSDKLoader;
      
      // Get fresh view token and initialize viewer
      const initializeWithFreshToken = async () => {
        try {
          console.log(`Getting fresh view token for file ID: ${firstModel.file_id}`);
          const tokenResponse = await getFreshViewToken(firstModel.file_id!);
          
          if (isSDKLoaded) {
            // SDK already loaded, initialize directly
            initializeViewer(tokenResponse.viewToken);
          } else {
            // Load the BIMFACE SDK only if not already loaded
            const existingScript = document.querySelector('script[src*="BimfaceSDKLoader"]');
            if (!existingScript) {
              const script = document.createElement('script');
              script.src = "https://static.bimface.com/api/BimfaceSDKLoader/BimfaceSDKLoader@latest-release.js";
              script.async = true;
              script.onload = () => {
                initializeViewer(tokenResponse.viewToken);
              };
              script.onerror = () => {
                setModelError('Failed to load BIMFACE SDK');
                setLoadingModel(false);
              };
              document.head.appendChild(script); // Use head instead of body
            } else {
              // Script exists but may not be loaded yet
              const checkSDKLoaded = () => {
                if ((window as any).BimfaceSDKLoader) {
                  initializeViewer(tokenResponse.viewToken);
                } else {
                  setTimeout(checkSDKLoaded, 100);
                }
              };
              checkSDKLoaded();
            }
          }
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
  }, [models, show3DModel]); // Remove selectedSensor from dependencies to prevent re-initialization

  const initializeViewer = (token: string) => {
    try {
      console.log("Initializing BIMFACE Viewer with token:", token);
      
      // Use a static container ID instead of dynamic one
      const containerId = 'bimfaceContainer';
      
      // Clear the container and create a new viewer container
      if (modelContainerRef.current) {
        modelContainerRef.current.innerHTML = '';
        
        const viewerContainer = document.createElement('div');
        viewerContainer.id = containerId;
        viewerContainer.style.width = '100%';
        viewerContainer.style.height = '100%';
        viewerContainer.className = 'w-full h-full bg-dark-950';
        
        modelContainerRef.current.appendChild(viewerContainer);
        
        // Force a reflow to ensure the element is properly rendered
        const height = viewerContainer.offsetHeight; // Store the value to avoid ESLint error
        console.log(`Container height: ${height}px`);
        
        // Wait for next frame to ensure DOM is fully updated
        requestAnimationFrame(() => {
          // Double-check the element exists in DOM
          const domElement = document.getElementById(containerId);
          if (!domElement) {
            throw new Error(`Failed to create DOM element with ID: ${containerId}`);
          }
          
          // Verify the element is actually attached to the document
          if (!document.body.contains(domElement)) {
            throw new Error(`DOM element ${containerId} is not attached to document`);
          }
          
          console.log(`DOM element ${containerId} created and verified`);
          
          // Proceed with BIMFACE initialization
          initializeBIMFACE(token, containerId);
        });
      } else {
        throw new Error('Model container reference is not available');
      }
    } catch (e) {
      console.error("Error initializing viewer:", e);
      setModelError(`Error initializing BIMFACE viewer: ${e instanceof Error ? e.message : String(e)}`);
      setLoadingModel(false);
      
      // Reset initialization flag on error
      isInitializingRef.current = false;
    }
  };

  const initializeBIMFACE = (token: string, containerId: string) => {
    try {
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
            // Add a small delay to ensure DOM element is ready
            setTimeout(() => {
              // Get DOM element - use the static container ID
              const domShow = document.getElementById(containerId);
              if (!domShow) {
                console.error(`Target DOM element ${containerId} not found. Available elements:`, 
                  Array.from(document.querySelectorAll('[id*="bimfaceContainer"]')).map(el => el.id));
                throw new Error(`Target DOM element ${containerId} not found`);
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
                
                viewer.render();
                setLoadingModel(false);
                
                // Reset initialization flag on success
                isInitializingRef.current = false;
              });
            }, 100); // Small delay to ensure DOM is ready
          }
        },
        function failureCallback(error: any) {
          console.error("Failed to load model:", error);
          setModelError(`Failed to load model: ${error || 'Unknown error'}`);
          setLoadingModel(false);
          
          // Reset initialization flag on failure
          isInitializingRef.current = false;
        }
      );
    } catch (e) {
      console.error("Error in BIMFACE initialization:", e);
      setModelError(`Error in BIMFACE initialization: ${e instanceof Error ? e.message : String(e)}`);
      setLoadingModel(false);
      
      // Reset initialization flag on error
      isInitializingRef.current = false;
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
    if (selectedSensor && viewerRef.current) {
      highlightSensorInModel(selectedSensor);
    }
  }, [selectedSensor]); // Separate effect for sensor highlighting to avoid re-initializing viewer

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Modern Header */}
      <motion.div 
        className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left section */}
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 group"
              >
                <motion.div
                  whileHover={{ x: -4 }}
                  transition={{ duration: 0.2 }}
                >
            <RiArrowGoBackLine className="text-xl" />
                </motion.div>
                <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
              
              <div className="w-px h-6 bg-slate-700"></div>
              
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg"
                >
                  <RiBuilding4Line className="text-xl text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Digital Twin Dashboard
          </h1>
                  <p className="text-sm text-slate-400">
                    Real-time building intelligence & control
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right section */}
            <div className="flex items-center gap-3">
              <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
                className={`p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 ${
                  refreshing ? 'animate-spin' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RiRefreshLine className="text-lg" />
              </motion.button>
              
              <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200">
                <RiSettings4Line className="text-lg" />
              </button>
              
              <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200">
                <RiMoreLine className="text-lg" />
          </button>
        </div>
      </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
      {/* Tab Navigation */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TabNavigation
            tabs={[
              {
                id: 'iot',
                label: 'IoT Sensors',
                icon: RiSensorLine,
                badge: sensors.filter(s => s.status === 'critical' || s.status === 'warning').length || undefined
              },
              {
                id: 'analytics',
                label: 'Building Analytics',
                icon: RiBarChartBoxLine
              },
              {
                id: 'controls',
                label: 'Smart Controls',
                icon: RiRemoteControlLine
              },
              {
                id: 'cctv',
                label: 'AI CCTV',
                icon: RiCameraLine,
                badge: cctvCameras.reduce((total, cam) => total + cam.alerts.length, 0) || undefined
              }
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => handleTabChange(tab as 'iot' | 'analytics' | 'controls' | 'cctv')}
            variant="pills"
            size="md"
          />
        </motion.div>

        {/* Main Content Area - Completely Restructured */}
        <div className="dashboard-grid">
          {/* Hero Stats Cards */}
          <motion.div 
            className="stats-overview grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatCard
              title="Active Sensors"
              value={sensors.filter(s => s.status === 'online').length}
              unit={`of ${sensors.length}`}
              trend={{ value: 2, label: 'from last week', isPositive: true }}
              color="emerald"
              icon={RiSensorLine}
              size="md"
            />
            <StatCard
              title="System Health"
              value="94.2%"
              trend={{ value: 1.2, label: 'from last month', isPositive: true }}
              color="blue"
              icon={RiCheckboxCircleLine}
              size="md"
            />
            <StatCard
              title="Energy Usage"
              value="42.7"
              unit="kWh"
              trend={{ value: 8.5, label: 'from yesterday', isPositive: false }}
              color="yellow"
              icon={RiLightbulbLine}
              size="md"
            />
            <StatCard
              title="Critical Alerts"
              value={sensors.filter(s => s.status === 'critical').length}
              trend={{ value: 50, label: 'from last hour', isPositive: false }}
              color="red"
              icon={RiAlarmWarningLine}
              size="md"
            />
          </motion.div>

          {/* 3D Model Section - Full Width Landscape */}
          {models.length > 0 && show3DModel && activeTab !== 'cctv' && (
            <motion.div 
              className="digital-twin-section mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <RiBuilding4Line className="mr-3 text-indigo-400" />
                    Digital Twin - Building Overview
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={toggleSkyBox}
                      className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm transition-all"
                    >
                      {skyBoxEnabled ? 'Sky Off' : 'Sky On'}
                    </button>
                    <button 
                      onClick={handleFullscreenView}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm transition-all flex items-center"
                      title="Fullscreen View"
                    >
                      <RiFullscreenLine className="mr-2" />
                      Fullscreen View
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={modelContainerRef} 
                  className="h-96 w-full relative rounded-xl overflow-hidden bg-slate-900 mb-4"
                >
                  {loadingModel && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                      <div className="flex flex-col items-center">
                        <RiLoader4Line className="text-3xl text-indigo-500 animate-spin mb-2" />
                        <span className="text-white text-sm">Loading 3D model...</span>
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
                </div>
                
                {/* Model Controls */}
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => navigateToModelViewer('iot', selectedSensor)}
                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-400 rounded-lg transition-all flex items-center"
                    title="IoT View"
                  >
                    <RiSensorLine className="mr-2" />
                    IoT View
                  </button>
                  <button 
                    onClick={() => navigateToModelViewer('analytics', selectedSensor)}
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-lg transition-all flex items-center"
                    title="Analytics View"
                  >
                    <RiBarChartBoxLine className="mr-2" />
                    Analytics View
                  </button>
                  <button 
                    onClick={() => navigateToModelViewer('controls', selectedSensor)}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 text-purple-400 rounded-lg transition-all flex items-center"
                    title="Controls View"
                  >
                    <RiRemoteControlLine className="mr-2" />
                    Controls View
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Dashboard Content */}
          <div className="dashboard-content grid grid-cols-1 xl:grid-cols-4 gap-8">
            
            {/* Left Column - Interactive Cards */}
            <div className="dashboard-left xl:col-span-3 space-y-6">
              
              {/* Tab-specific content cards */}
              {activeTab === 'iot' && (
                <motion.div 
                  className="sensors-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Live Sensors Card */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl">
                          <RiSensorLine className="text-2xl text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Live Sensor Data</h3>
                          <p className="text-slate-400 text-sm">Real-time monitoring across all floors</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm transition-all">
                          <RiFilterLine className="mr-2 inline" />
                          Filter
                        </button>
                        <button
                          onClick={handleRefresh}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm transition-all"
                        >
                          <RiRefreshLine className={`mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                    </div>
                    
                    {/* Sensor Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedSensors.slice(0, 6).map((sensor, index) => (
                        <motion.div
                          key={sensor.id}
                          className={`sensor-card p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedSensor?.id === sensor.id 
                              ? 'bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/50' 
                              : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50'
                          }`}
                          onClick={() => setSelectedSensor(sensor)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <SensorIcon 
                                type={sensor.type} 
                                size="lg" 
                                variant="filled" 
                                animated 
                              />
                              <div>
                                <h4 className="text-white font-semibold">{sensor.name}</h4>
                                <p className="text-slate-400 text-sm flex items-center">
                                  <RiMapPinLine className="mr-1 text-xs" />
                                  {sensor.location}
                                </p>
                              </div>
                            </div>
                            <StatusIndicator status={sensor.status} size="sm" showText={false} />
                          </div>
                          
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-2xl font-bold text-white">
                                {sensor.value} 
                                <span className="text-sm font-normal text-slate-400 ml-1">{sensor.unit}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Floor {sensor.floor}</div>
                            </div>
                            {sensor.battery && (
                              <div className={`flex items-center text-xs ${
                                sensor.battery > 80 ? 'text-emerald-400' :
                                sensor.battery > 50 ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                <RiBatteryLine className="mr-1" />
                                {sensor.battery}%
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {displayedSensors.length > 6 && (
                      <div className="text-center mt-6">
                        <button className="px-6 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm transition-all">
                          View All {displayedSensors.length} Sensors
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div 
                  className="analytics-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Analytics Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <RiBarChartBoxLine className="mr-2 text-blue-400" />
                        Energy Distribution
                      </h3>
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
                    
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <RiUserLocationLine className="mr-2 text-green-400" />
                        Occupancy Trends
                      </h3>
                      <div className="h-64">
                        <Bar 
                          data={occupancyData} 
                          options={occupancyOptions}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Metrics */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                      <RiCpuLine className="mr-2 text-purple-400" />
                      Performance Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard
                        title="Efficiency Rating"
                        value="92%"
                        trend={{ value: 2.5, label: 'from last month', isPositive: true }}
                        color="emerald"
                        size="sm"
                      />
                      <StatCard
                        title="Uptime"
                        value="99.8%"
                        trend={{ value: 0.2, label: 'from last month', isPositive: true }}
                        color="emerald"
                        size="sm"
                      />
                      <StatCard
                        title="Response Time"
                        value="120ms"
                        trend={{ value: 15, label: 'from last month', isPositive: false }}
                        color="red"
                        size="sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'controls' && (
                <motion.div 
                  className="controls-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* HVAC Control Card */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl">
                            <RiTempColdLine className="text-2xl text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">HVAC Control</h3>
                            <p className="text-slate-400 text-sm">Climate management system</p>
                          </div>
                        </div>
                        <button 
                          className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors ${
                            hvacEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                          onClick={() => setHvacEnabled(!hvacEnabled)}
                        >
                          <span 
                            className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${
                              hvacEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white mb-2">{targetTemp}°C</div>
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              className="p-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-white rounded-xl transition-all"
                              onClick={() => setTargetTemp(prev => Math.max(16, prev - 0.5))}
                              disabled={!hvacEnabled}
                            >
                              <RiVolumeDownLine className="text-xl" />
                            </button>
                            <button 
                              className="p-3 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-white rounded-xl transition-all"
                              onClick={() => setTargetTemp(prev => Math.min(28, prev + 0.5))}
                              disabled={!hvacEnabled}
                            >
                              <RiVolumeUpLine className="text-xl" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button className="py-3 px-4 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-medium">
                            Cool
                          </button>
                          <button className="py-3 px-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl text-sm font-medium">
                            Auto
                          </button>
                          <button className="py-3 px-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl text-sm font-medium">
                            Heat
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lighting Control Card */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl">
                            <RiLightbulbFlashLine className="text-2xl text-yellow-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Lighting Control</h3>
                            <p className="text-slate-400 text-sm">Smart lighting system</p>
                          </div>
                        </div>
                        <button 
                          className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors ${
                            lightingEnabled ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                          onClick={() => setLightingEnabled(!lightingEnabled)}
                        >
                          <span 
                            className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${
                              lightingEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-300 font-medium">Brightness</span>
                            <span className="text-white font-bold">{lightingLevel}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={lightingLevel}
                            onChange={(e) => setLightingLevel(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            disabled={!lightingEnabled}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button className="py-3 px-4 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-sm font-medium">
                            Main Office
                          </button>
                          <button className="py-3 px-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl text-sm font-medium">
                            Conference
                          </button>
                          <button className="py-3 px-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl text-sm font-medium">
                            Lobby
                          </button>
                          <button className="py-3 px-4 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-xl text-sm font-medium">
                            All Zones
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cctv' && (
                <motion.div 
                  className="cctv-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* CCTV Grid */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-red-600/20 to-pink-600/20 rounded-xl">
                          <RiCameraLine className="text-2xl text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">CCTV Surveillance</h3>
                          <p className="text-slate-400 text-sm">Live camera feeds and monitoring</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 rounded-lg text-sm transition-all">
                          <RiRecordCircleLine className="mr-2 inline" />
                          Record All
                        </button>
                        <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg text-sm transition-all">
                          <RiFullscreenLine className="mr-2 inline" />
                          Fullscreen
                        </button>
                      </div>
                    </div>
                    
                    {/* Camera Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cctvCameras.map((camera, index) => (
                        <motion.div
                          key={camera.id}
                          className={`camera-card rounded-xl border transition-all duration-200 cursor-pointer ${
                            selectedCamera?.id === camera.id 
                              ? 'bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/50' 
                              : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/50'
                          }`}
                          onClick={() => setSelectedCamera(camera)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Camera Feed */}
                          <div className="aspect-video bg-slate-900 rounded-t-xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                              <div className="text-center">
                                <RiVideoLine className="text-4xl text-slate-600 mb-2 mx-auto" />
                                <div className="text-white text-sm font-medium">{camera.name}</div>
                              </div>
                            </div>
                            
                            {/* Status Overlays */}
                            <div className="absolute top-3 left-3 flex gap-2">
                              {camera.isRecording && (
                                <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1"></div>
                                  REC
                                </div>
                              )}
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                camera.status === 'online' || camera.status === 'recording' 
                                  ? 'bg-emerald-500/90 text-white' 
                                  : camera.status === 'maintenance'
                                    ? 'bg-amber-500/90 text-white'
                                    : 'bg-red-500/90 text-white'
                              }`}>
                                {camera.status.toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="absolute top-3 right-3">
                              <div className="bg-slate-800/90 text-slate-300 text-xs px-2 py-1 rounded-full">
                                LIVE
                              </div>
                            </div>
                          </div>
                          
                          {/* Camera Info */}
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-white font-semibold">{camera.name}</h4>
                                <p className="text-slate-400 text-sm">{camera.location} • Floor {camera.floor}</p>
                              </div>
                              <div className="flex gap-1">
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
                                    <RiAlertLine className="text-amber-400 text-sm" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">
                              {camera.resolution} • {camera.viewAngle} • {camera.lastActivity}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Right Column - Smart Lock & Details */}
            <motion.div 
              className="dashboard-right xl:col-span-1 space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {/* Smart Lock Dashboard */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <SmartLockDashboard />
              </div>

              {/* Selected Item Details */}
              {(selectedSensor || selectedCamera) && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    {selectedSensor ? (
                      <>
                        <SensorIcon type={selectedSensor.type} size="sm" className="mr-2" />
                        Sensor Details
                      </>
                    ) : (
                      <>
                        <RiCameraLine className="mr-2 text-red-400" />
                        Camera Details
                      </>
                    )}
                  </h3>
                  
                  {selectedSensor && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                        <div className="text-3xl font-bold text-white mb-1">
                          {selectedSensor.value} {selectedSensor.unit}
                        </div>
                        <div className="text-slate-400 text-sm">{selectedSensor.name}</div>
                        <StatusIndicator status={selectedSensor.status} size="sm" className="mt-2 justify-center" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400">Location</div>
                          <div className="text-white font-medium">{selectedSensor.location}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Floor</div>
                          <div className="text-white font-medium">{selectedSensor.floor}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Type</div>
                          <div className="text-white font-medium capitalize">{selectedSensor.type}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Battery</div>
                          <div className={`font-medium ${
                            selectedSensor.battery && selectedSensor.battery > 80 ? 'text-emerald-400' :
                            selectedSensor.battery && selectedSensor.battery > 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {selectedSensor.battery}%
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Recent Activity</div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedSensor.recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <RiInformationLine className="text-indigo-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-white">{activity.message}</div>
                                <div className="text-slate-500 text-xs">{activity.time}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedCamera && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-slate-800/50 rounded-xl">
                        <div className="text-2xl font-bold text-white mb-1">{selectedCamera.name}</div>
                        <div className="text-slate-400 text-sm">{selectedCamera.location}</div>
                        <StatusIndicator 
                          status={(selectedCamera.status === 'recording' || selectedCamera.status === 'online') ? 'online' : 
                                  selectedCamera.status === 'maintenance' ? 'warning' : 'offline'} 
                          size="sm" 
                          className="mt-2 justify-center" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400">Resolution</div>
                          <div className="text-white font-medium">{selectedCamera.resolution}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">View Angle</div>
                          <div className="text-white font-medium">{selectedCamera.viewAngle}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Floor</div>
                          <div className="text-white font-medium">{selectedCamera.floor}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Last Activity</div>
                          <div className="text-white font-medium">{selectedCamera.lastActivity}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">Recording</span>
                          <button 
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
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
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                selectedCamera.isRecording ? 'translate-x-6' : 'translate-x-1'
                              }`} 
                            />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">Night Vision</span>
                          <button 
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
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
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                selectedCamera.nightVision ? 'translate-x-6' : 'translate-x-1'
                              }`} 
                            />
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 text-sm">Motion Detection</span>
                          <button 
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
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
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                selectedCamera.motionDetection ? 'translate-x-6' : 'translate-x-1'
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                      
                      {selectedCamera.alerts.length > 0 && (
                        <div>
                          <div className="text-slate-400 text-sm mb-2">Recent Alerts</div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedCamera.alerts.map((alert, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <RiAlertLine className={`mt-0.5 flex-shrink-0 ${
                                  alert.type === 'motion' ? 'text-yellow-400' :
                                  alert.type === 'person' ? 'text-blue-400' :
                                  alert.type === 'vehicle' ? 'text-green-400' :
                                  'text-red-400'
                                }`} />
                                <div>
                                  <div className="text-white">{alert.message}</div>
                                  <div className="text-slate-500 text-xs">{alert.time}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chart/Analytics Panel for Selected Sensor */}
              {selectedSensor && activeTab === 'iot' && (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <RiBarChartBoxLine className="mr-2 text-blue-400" />
                    Live Data
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={getSensorTimeSeriesData(selectedSensor.type).time.map((time, index) => ({
                          time,
                          value: getSensorTimeSeriesData(selectedSensor.type).value[index]
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            borderColor: '#334155',
                            color: '#f8fafc',
                            borderRadius: '8px'
                          }} 
                        />
                        <RechartsLine 
                          type="monotone" 
                          dataKey="value" 
                          stroke={getSensorChartColor(selectedSensor.type)} 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IoTDashboardPage; 