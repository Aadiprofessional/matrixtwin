import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  RiArrowGoBackLine, 
  RiSensorLine, 
  RiBarChartBoxLine, 
  RiRemoteControlLine,
  RiInformationLine,
  RiCloseLine,
  RiTempHotLine,
  RiWaterFlashLine,
  RiLightbulbLine,
  RiUserLocationLine,
  RiCompassDiscoverLine,
  RiMapPinLine,
  RiBellLine,
  RiNotificationLine,
  RiCameraLine,
  RiVideoLine,
  RiRecordCircleLine,
  RiAlertLine,
  RiEyeLine,
  RiEyeOffLine,
  RiDoorLockLine,
  RiShieldCheckLine,
  RiHistoryLine,
  RiAlarmWarningLine,
  RiRefreshLine,
  RiSettings4Line,
  RiMoreLine,
  RiTempColdLine,
  RiLightbulbFlashLine,
  RiVolumeUpLine,
  RiVolumeDownLine,
  RiToggleLine,
  RiFilterLine,
  RiBatteryLine,
  RiTimeLine,
  RiFullscreenLine,
  RiMenuLine,
  RiAppsLine,
  RiGridLine,
  RiCloudyLine,
  RiSunLine,
  RiRainyLine,
  RiThunderstormsLine,
  RiWindyLine,
  RiDropLine,
  RiEyeCloseLine,
  RiMoonLine,
  RiSunCloudyLine,
  RiMoonCloudyLine,
  RiSnowyLine,
  RiMistLine,
  RiSettings3Line,
  RiFullscreenExitLine,
  RiDashboardLine
} from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler, ArcElement, BarElement } from 'chart.js';
import { getFreshViewToken } from '../utils/bimfaceTokenApi';
import { getAllModels, ModelRecord } from '../utils/supabaseModelsApi';
import { EventPanel } from '../components/viewer/EventPanel';
import SmartLockDashboard from '../components/SmartLockDashboard';
import StatusIndicator, { SensorStatus } from '../components/ui/StatusIndicator';
import SensorIcon, { SensorType } from '../components/ui/SensorIcon';
import StatCard from '../components/ui/StatCard';
import { Sidebar } from '../components/layout/Sidebar';
import DraggablePanelComponent from '../components/DraggablePanelComponent';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';

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

// Don't declare global types here - they're conflicting with existing ones
// We'll use type assertions instead

// Enhanced Sensor data interface
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

// Draggable Panel interface
interface DraggablePanel {
  id: string;
  type: 'iot' | 'analytics' | 'controls' | 'info' | 'cctv' | 'smartlock' | 'events' | 'weather';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
}

// CCTV Camera interface
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

// Weather interfaces based on Hong Kong Observatory API documentation
interface WeatherTemperatureData {
  place: string;
  value: number;
  unit: string;
  recordTime: string;
}

interface WeatherHumidityData {
  unit: string;
  value: number;
  place: string;
  recordTime: string;
}

interface WeatherUVIndexData {
  place: string;
  value: number;
  desc: string;
  message?: string;
  recordDesc: string;
  updateTime: string;
}

interface WeatherForecastDay {
  forecastDate: string;
  week: string;
  forecastWeather: string;
  forecastMaxtemp: number;
  forecastMintemp: number;
  forecastWind: string;
  forecastMaxrh: number;
  forecastMinrh: number;
  forecastIcon: number;
  PSR: string;
}

interface WeatherForecast {
  weatherForecast: WeatherForecastDay[];
  soilTemp: Array<{
    place: string;
    value: number;
    unit: string;
    recordTime: string;
    depth: {
      unit: string;
      value: number;
    };
  }>;
  seaTemp: Array<{
    place: string;
    value: number;
    unit: string;
    recordTime: string;
  }>;
}

interface CurrentWeather {
  temperature: WeatherTemperatureData[];
  humidity: WeatherHumidityData[];
  uvindex: WeatherUVIndexData[];
  icon: number[];
  iconUpdateTime: string;
  warningMessage?: string[];
  updateTime?: string;
}

interface LocalWeatherForecast {
  generalSituation: string;
  tcInfo?: string;
  fireDangerWarning?: string;
  forecastPeriod: string;
  forecastDesc: string;
  outlook: string;
  updateTime: string;
}

interface WeatherData {
  current: CurrentWeather | null;
  forecast: WeatherForecast | null;
  local: LocalWeatherForecast | null;
  loading: boolean;
  error: string | null;
}

// Add Smart Watch interface after other interfaces
interface SmartWatch {
  id: string;
  name: string;
  user: string;
  batteryLevel: number;
  heartRate: number;
  steps: number;
  temperature: number;
  location: string;
  lastSync: string;
  status: 'connected' | 'disconnected' | 'charging';
  notifications: { type: string; message: string; time: string }[];
}

// Add Toxic Gas Sensor interface
interface ToxicGasSensor {
  id: string;
  name: string;
  type: 'co' | 'co2' | 'no2' | 'so2' | 'h2s' | 'ch4' | 'nh3' | 'o3';
  location: string;
  floor: number;
  value: number;
  unit: string;
  threshold: number;
  status: 'safe' | 'warning' | 'danger' | 'critical';
  lastUpdated: string;
  battery: number;
  calibrationDate: string;
  alerts: { level: string; message: string; time: string }[];
}

// Comprehensive mock sensor data
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

// Add mock smart watch data
const mockSmartWatches: SmartWatch[] = [
  {
    id: 'watch001',
    name: 'Apple Watch Series 9',
    user: 'John Doe',
    batteryLevel: 78,
    heartRate: 72,
    steps: 8420,
    temperature: 36.5,
    location: 'Office Building',
    lastSync: '2 minutes ago',
    status: 'connected',
    notifications: [
      { type: 'health', message: 'Heart rate spike detected', time: '5 minutes ago' },
      { type: 'activity', message: 'Daily step goal reached', time: '1 hour ago' }
    ]
  },
  {
    id: 'watch002',
    name: 'Samsung Galaxy Watch',
    user: 'Jane Smith',
    batteryLevel: 45,
    heartRate: 68,
    steps: 6200,
    temperature: 36.2,
    location: 'Conference Room',
    lastSync: '1 minute ago',
    status: 'connected',
    notifications: [
      { type: 'meeting', message: 'Meeting reminder in 15 mins', time: '10 minutes ago' }
    ]
  },
  {
    id: 'watch003',
    name: 'Fitbit Sense',
    user: 'Mike Johnson',
    batteryLevel: 12,
    heartRate: 0,
    steps: 0,
    temperature: 0,
    location: 'Unknown',
    lastSync: '2 hours ago',
    status: 'charging',
    notifications: []
  }
];

// Add mock toxic gas sensor data
const mockToxicGasSensors: ToxicGasSensor[] = [
  {
    id: 'gas001',
    name: 'CO Monitor 1',
    type: 'co',
    location: 'Parking Garage',
    floor: 0,
    value: 15,
    unit: 'ppm',
    threshold: 50,
    status: 'safe',
    lastUpdated: '2025-04-30T19:25:00',
    battery: 85,
    calibrationDate: '2025-04-01',
    alerts: []
  },
  {
    id: 'gas002',
    name: 'CO2 Monitor 1',
    type: 'co2',
    location: 'Main Office',
    floor: 1,
    value: 850,
    unit: 'ppm',
    threshold: 1000,
    status: 'warning',
    lastUpdated: '2025-04-30T19:24:30',
    battery: 92,
    calibrationDate: '2025-04-01',
    alerts: [
      { level: 'warning', message: 'CO2 levels approaching threshold', time: '10 minutes ago' }
    ]
  },
  {
    id: 'gas003',
    name: 'NO2 Monitor 1',
    type: 'no2',
    location: 'Laboratory',
    floor: 2,
    value: 0.08,
    unit: 'ppm',
    threshold: 0.1,
    status: 'warning',
    lastUpdated: '2025-04-30T19:23:45',
    battery: 78,
    calibrationDate: '2025-04-01',
    alerts: [
      { level: 'warning', message: 'NO2 concentration elevated', time: '5 minutes ago' }
    ]
  },
  {
    id: 'gas004',
    name: 'H2S Monitor 1',
    type: 'h2s',
    location: 'Waste Treatment',
    floor: -1,
    value: 2.5,
    unit: 'ppm',
    threshold: 10,
    status: 'safe',
    lastUpdated: '2025-04-30T19:26:15',
    battery: 88,
    calibrationDate: '2025-04-01',
    alerts: []
  },
  {
    id: 'gas005',
    name: 'CH4 Monitor 1',
    type: 'ch4',
    location: 'Boiler Room',
    floor: -1,
    value: 125,
    unit: 'ppm',
    threshold: 1000,
    status: 'safe',
    lastUpdated: '2025-04-30T19:25:50',
    battery: 95,
    calibrationDate: '2025-04-01',
    alerts: []
  },
  {
    id: 'gas006',
    name: 'SO2 Monitor 1',
    type: 'so2',
    location: 'Chemical Storage',
    floor: 1,
    value: 0.15,
    unit: 'ppm',
    threshold: 0.25,
    status: 'warning',
    lastUpdated: '2025-04-30T19:22:30',
    battery: 72,
    calibrationDate: '2025-04-01',
    alerts: [
      { level: 'warning', message: 'SO2 levels increasing', time: '15 minutes ago' }
    ]
  },
  {
    id: 'gas007',
    name: 'O3 Monitor 1',
    type: 'o3',
    location: 'Server Room',
    floor: 2,
    value: 0.05,
    unit: 'ppm',
    threshold: 0.1,
    status: 'safe',
    lastUpdated: '2025-04-30T19:24:00',
    battery: 90,
    calibrationDate: '2025-04-01',
    alerts: []
  },
  {
    id: 'gas008',
    name: 'NH3 Monitor 1',
    type: 'nh3',
    location: 'Cleaning Storage',
    floor: 0,
    value: 8,
    unit: 'ppm',
    threshold: 25,
    status: 'safe',
    lastUpdated: '2025-04-30T19:26:45',
    battery: 83,
    calibrationDate: '2025-04-01',
    alerts: []
  }
];

// Generate time series data for charts
const generateTimeSeriesData = (hours = 24, baseValue = 22, variance = 2) => {
  const labels = Array.from({ length: hours }, (_, i) => 
    `${(i <= 9 ? '0' : '') + i}:00`
  );
  
  const data = Array.from({ length: hours }, () => 
    baseValue + (Math.random() * variance * 2 - variance)
  );
  
  return { labels, data };
};

const ModelViewerPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewToken, setViewToken] = useState<string | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [cctvCameras, setCctvCameras] = useState<CCTVCamera[]>(mockCCTVCameras);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera | null>(null);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Panel management state
  const [openPanels, setOpenPanels] = useState<DraggablePanel[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [skyBoxEnabled, setSkyBoxEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hvacEnabled, setHvacEnabled] = useState(true);
  const [lightingEnabled, setLightingEnabled] = useState(true);
  const [targetTemp, setTargetTemp] = useState(22);
  const [lightingLevel, setLightingLevel] = useState(75);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    current: {
      temperature: [{ value: 24, unit: 'C', place: 'Hong Kong', recordTime: new Date().toISOString() }],
      humidity: [{ value: 65, unit: '%', place: 'Hong Kong', recordTime: new Date().toISOString() }],
      uvindex: [],
      icon: [1],
      iconUpdateTime: new Date().toISOString()
    },
    forecast: null,
    local: null,
    loading: false,
    error: null
  });
  
  // Panel sizing state
  const [leftPanelWidth, setLeftPanelWidth] = useState(350);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState('Building Analytics');
  const [activeRightTab, setActiveRightTab] = useState('smartlock');
  
  // Panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  
  // Screen width calculations
  const screenWidth = window.innerWidth;
  const maxLeftWidth = screenWidth * 0.7;
  const maxRightWidth = screenWidth * 0.7;
  const minPanelWidth = 280;
  
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const skyBoxManagerRef = useRef<any>(null);
  const currentContainerIdRef = useRef<string | null>(null);

  const [smartWatches, setSmartWatches] = useState<SmartWatch[]>(mockSmartWatches);
  const [selectedWatch, setSelectedWatch] = useState<SmartWatch | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<CCTVCamera | null>(null);
  const [toxicGasSensors, setToxicGasSensors] = useState<ToxicGasSensor[]>(mockToxicGasSensors);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Panel resize handlers
  const handleResizeStart = (e: React.MouseEvent, panel: 'left' | 'right') => {
    e.preventDefault();
    setIsResizing(panel);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (panel === 'left') {
        const newWidth = Math.min(maxLeftWidth, Math.max(minPanelWidth, e.clientX));
        // Ensure right panel doesn't get squeezed
        if (newWidth + rightPanelWidth < screenWidth - 100) {
          setLeftPanelWidth(newWidth);
        }
      } else if (panel === 'right') {
        const newWidth = Math.min(maxRightWidth, Math.max(minPanelWidth, screenWidth - e.clientX));
        // Ensure left panel doesn't get squeezed
        if (leftPanelWidth + newWidth < screenWidth - 100) {
          setRightPanelWidth(newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle sky box
  const toggleSkyBox = () => {
    setSkyBoxEnabled(!skyBoxEnabled);
    
    // If we have a viewer reference, update the sky box
    if (skyBoxManagerRef.current) {
      try {
        if (!skyBoxEnabled) {
          // Enable sky box
          skyBoxManagerRef.current.enable();
    } else {
          // Disable sky box
          skyBoxManagerRef.current.disable();
        }
      } catch (error) {
        console.warn('Error toggling sky box:', error);
      }
    }
    
    // If we have a viewer but no sky box manager, try to initialize it
    if (viewerRef.current && !skyBoxManagerRef.current) {
      initializeSkyBox(viewerRef.current);
    }
  };

  // Weather data fetching
  const fetchWeatherData = async () => {
    setWeatherData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch current weather data from Hong Kong Observatory API
      const currentWeatherResponse = await fetch(
        'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en',
        { mode: 'cors' }
      );
      
      const localForecastResponse = await fetch(
        'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=flw&lang=en',
        { mode: 'cors' }
      );
      
      const forecastResponse = await fetch(
        'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=en',
        { mode: 'cors' }
      );
      
      const currentWeatherData = await currentWeatherResponse.json();
      const localForecastData = await localForecastResponse.json();
      const forecastData = await forecastResponse.json();
      
      setWeatherData({
        current: currentWeatherData,
        local: localForecastData,
        forecast: forecastData,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch weather data. Using cached data.'
      }));
    }
  };

  // Weather icon helper
  const getWeatherIcon = (iconCode: string | number) => {
    const code = typeof iconCode === 'number' ? iconCode.toString() : iconCode;
    const iconMap: { [key: string]: React.ReactNode } = {
      '01d': <RiSunLine className="text-yellow-400 text-xl" />,
      '01n': <RiMoonLine className="text-blue-300 text-xl" />,
      '02d': <RiSunCloudyLine className="text-yellow-400 text-xl" />,
      '02n': <RiMoonCloudyLine className="text-blue-300 text-xl" />,
      '03d': <RiCloudyLine className="text-gray-400 text-xl" />,
      '03n': <RiCloudyLine className="text-gray-400 text-xl" />,
      '04d': <RiCloudyLine className="text-gray-500 text-xl" />,
      '04n': <RiCloudyLine className="text-gray-500 text-xl" />,
      '09d': <RiRainyLine className="text-blue-500 text-xl" />,
      '09n': <RiRainyLine className="text-blue-500 text-xl" />,
      '10d': <RiSunCloudyLine className="text-blue-500 text-xl" />,
      '10n': <RiMoonCloudyLine className="text-blue-500 text-xl" />,
      '11d': <RiThunderstormsLine className="text-purple-500 text-xl" />,
      '11n': <RiThunderstormsLine className="text-purple-500 text-xl" />,
      '13d': <RiSnowyLine className="text-white text-xl" />,
      '13n': <RiSnowyLine className="text-white text-xl" />,
      '50d': <RiMistLine className="text-gray-400 text-xl" />,
      '50n': <RiMistLine className="text-gray-400 text-xl" />,
      '1': <RiSunLine className="text-yellow-400 text-xl" />
    };
    return iconMap[code] || <RiCloudyLine className="text-gray-400 text-xl" />;
  };

  // Parse query parameters from URL
  const getParamsFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const fileId = searchParams.get('fileId');
    const viewTokenParam = searchParams.get('viewToken');
    const sensorDataParam = searchParams.get('sensorData');
    
    // Parse sensor data if available
    let parsedSensorData = null;
    if (sensorDataParam) {
      try {
        parsedSensorData = JSON.parse(decodeURIComponent(sensorDataParam));
      } catch (e) {
        console.error("Error parsing sensor data from URL:", e);
      }
    }
    
    return {
      fileId: fileId ? parseInt(fileId, 10) : null,
      viewToken: viewTokenParam,
      sensorData: parsedSensorData
    };
  };

  // Load available models from Supabase
  const loadAvailableModels = async () => {
    try {
      const result = await getAllModels();
      if (result && Array.isArray(result)) {
        setModels(result);
        return result;
      }
      return [];
    } catch (error) {
      console.error('Error loading models:', error);
      return [];
    }
  };

  // Handle refresh functionality
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate sensor data refresh
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

  // Clean up function to remove the viewer
  const cleanupViewer = () => {
    try {
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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Remove any existing BIMFACE containers more thoroughly
      const existingContainers = document.querySelectorAll('[id*="bimfaceContainer"]');
      existingContainers.forEach(container => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
      
      // Clear the current container ID
      currentContainerIdRef.current = null;
      
      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }
      
    } catch (e) {
      console.error("Error during cleanup:", e);
    }
  };

  // Function to get a fresh view token using the MatrixBIM server API
  const fetchViewToken = async (fileId: number): Promise<string> => {
    try {
      console.log(`Getting fresh viewer token for fileId: ${fileId}`);
      
      // Try the primary API endpoint
      const tokenResponse = await getFreshViewToken(fileId);
      
      if (tokenResponse.success && tokenResponse.viewToken) {
        console.log('Successfully received fresh view token:', tokenResponse.viewToken);
        return tokenResponse.viewToken;
      } else {
        throw new Error('Failed to get fresh view token: Invalid response');
      }
    } catch (error) {
      console.error('Error getting fresh viewer token:', error);
      
      // If we get a 400 error, it might be because the fileId is invalid or the model doesn't exist
      // Let's try to load available models and use the first valid one
      if (error instanceof Error && error.message.includes('400')) {
        console.log('Received 400 error, trying to load available models...');
        try {
          const availableModels = await loadAvailableModels();
          if (availableModels.length > 0 && availableModels[0].file_id) {
            const fallbackFileId = availableModels[0].file_id;
            console.log(`Trying fallback fileId: ${fallbackFileId}`);
            const fallbackResponse = await getFreshViewToken(fallbackFileId);
            if (fallbackResponse.success && fallbackResponse.viewToken) {
              console.log('Successfully received fallback view token');
              return fallbackResponse.viewToken;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback token fetch also failed:', fallbackError);
        }
      }
      
      // If all else fails, we'll show an error message
      throw new Error(`Failed to get view token: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    // Set the page title
    document.title = "Digital Twin Viewer | MatrixTwin";
    
    // Get parameters from URL
    const { fileId, viewToken: urlViewToken, sensorData } = getParamsFromUrl();
    console.log("File ID from URL:", fileId);
    console.log("View Token from URL:", urlViewToken);
    
    // Clean up any existing viewer before creating a new one
    cleanupViewer();
    
    const getToken = async () => {
      try {
        let workingFileId = fileId;
        
        // If no fileId provided, try to load available models
        if (!workingFileId) {
          console.log("No fileId provided, loading available models...");
          const availableModels = await loadAvailableModels();
          if (availableModels.length > 0) {
            workingFileId = availableModels[0].file_id!;
            console.log(`Using first available model with fileId: ${workingFileId}`);
          } else {
            throw new Error('No valid models available');
          }
        }
        
        if (!workingFileId) {
          throw new Error('No file ID available for model loading');
        }

        const token = urlViewToken || await fetchViewToken(workingFileId);
        setViewToken(token);
        
        // Load BIMFACE SDK and initialize viewer
        const isSDKLoaded = !!(window as any).BimfaceSDKLoader;
        if (isSDKLoaded) {
          initializeViewer(token);
        } else {
          const script = document.createElement('script');
          script.src = "https://static.bimface.com/api/BimfaceSDKLoader/BimfaceSDKLoader@latest-release.js";
          script.async = true;
          script.onload = () => initializeViewer(token);
          script.onerror = () => setError('Failed to load BIMFACE SDK');
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Failed to load model:', error);
        setError(error instanceof Error ? error.message : 'Failed to load model');
        setLoading(false);
      }
    };

    const errorHandler = (event: ErrorEvent) => {
      console.error('Runtime error:', event.error);
      setError(`Runtime error: ${event.error?.message || 'Unknown error'}`);
      setLoading(false);
    };

    // Add error listener
    window.addEventListener('error', errorHandler);
    
    getToken();

    return () => {
      window.removeEventListener('error', errorHandler);
      cleanupViewer();
    };
  }, [location.search]); // Dependency on search params to reload when URL changes

  useEffect(() => {
    if (!viewToken || !containerRef.current) return;
    
    // Clean up any existing viewer before creating a new one
    cleanupViewer();
    
    // Check if BIMFACE SDK is already loaded
    const isSDKLoaded = !!(window as any).BimfaceSDKLoader;
    
    if (isSDKLoaded) {
      // SDK already loaded, initialize directly
      initializeViewer(viewToken);
    } else {
      // Load the BIMFACE SDK only if not already loaded
      const existingScript = document.querySelector('script[src*="BimfaceSDKLoader"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = "https://static.bimface.com/api/BimfaceSDKLoader/BimfaceSDKLoader@latest-release.js";
        script.async = true;
        script.onload = () => {
          initializeViewer(viewToken);
        };
        script.onerror = () => {
          setError('Failed to load BIMFACE SDK');
          setLoading(false);
        };
        document.head.appendChild(script);
      } else {
        // Script exists but may not be loaded yet
        const checkSDKLoaded = () => {
          if ((window as any).BimfaceSDKLoader) {
            initializeViewer(viewToken);
          } else {
            setTimeout(checkSDKLoaded, 100);
          }
        };
        checkSDKLoaded();
      }
    }
  }, [viewToken]);

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
        
        // Set initial state
        if (skyBoxEnabled) {
          skyBoxManager.enable();
        } else {
          skyBoxManager.disable();
        }
        
        console.log("🌥️ SkyBox initialized successfully");
      } else {
        console.warn("SkyBox plugin not available - using fallback React Three Fiber sky");
      }
    } catch (e) {
      console.error("Error initializing SkyBox:", e);
    }
  };

  const initializeViewer = (token: string) => {
    try {
      console.log("Initializing BIMFACE Viewer with token:", token);
      
      // Prevent multiple simultaneous initializations
      if (currentContainerIdRef.current) {
        console.log("Viewer initialization already in progress, skipping...");
        return;
      }
      
      // Wait for containerRef to be available
      const waitForContainer = () => {
        if (!containerRef.current) {
          console.log("Container not ready, waiting...");
          setTimeout(waitForContainer, 100);
          return;
        }
        
        console.log("Container is ready, proceeding with initialization");
      
      // Create a unique container for the viewer
      const uniqueContainerId = `bimfaceContainer-${Date.now()}`;
      currentContainerIdRef.current = uniqueContainerId;
      
      const viewerContainer = document.createElement('div');
      viewerContainer.id = uniqueContainerId;
      viewerContainer.style.width = '100%';
      viewerContainer.style.height = '100%';
        viewerContainer.className = 'w-full h-full bg-slate-950';
      
      // Clear the container and add the viewer container
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(viewerContainer);
        
        // Force multiple reflows to ensure the element is properly in the DOM
        const height = viewerContainer.offsetHeight;
        const width = viewerContainer.offsetWidth;
        console.log(`Container dimensions: ${width}x${height}`);
        
        // Use a more reliable approach with MutationObserver to ensure DOM is ready
        const observer = new MutationObserver((mutations, obs) => {
          const element = document.getElementById(uniqueContainerId);
          if (element && element.offsetParent !== null) {
            obs.disconnect();
            
            // Check if this initialization is still valid (not cancelled by cleanup)
            if (currentContainerIdRef.current !== uniqueContainerId) {
              console.log("Viewer initialization cancelled, container ID changed");
              return;
            }
            
            console.log(`DOM element ${uniqueContainerId} created and verified with MutationObserver`);
            
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
                  // Add another delay to ensure DOM element is ready
                  setTimeout(() => {
                    // Check if this initialization is still valid
                    if (currentContainerIdRef.current !== uniqueContainerId) {
                      console.log("Viewer initialization cancelled during SDK load");
                      return;
                    }
                    
                    // Get DOM element - use the unique container ID
                    const domShow = document.getElementById(uniqueContainerId);
                    if (!domShow) {
                      console.error(`Target DOM element ${uniqueContainerId} not found. Available elements:`, 
                        Array.from(document.querySelectorAll('[id*="bimfaceContainer"]')).map(el => el.id));
                      setError(`Target DOM element ${uniqueContainerId} not found`);
                      setLoading(false);
                      currentContainerIdRef.current = null;
                      return;
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
                      setLoading(false);
                    });
                  }, 200); // Increased delay to ensure DOM is ready
                }
              },
              function failureCallback(error: any) {
                console.error("Failed to load model:", error);
                setError(`Failed to load model: ${error || 'Unknown error'}`);
                setLoading(false);
                currentContainerIdRef.current = null;
              }
            );
          }
        });
        
        // Start observing
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Fallback timeout in case MutationObserver doesn't work
        setTimeout(() => {
          observer.disconnect();
          const element = document.getElementById(uniqueContainerId);
          if (element && currentContainerIdRef.current === uniqueContainerId) {
            console.log("Using fallback timeout approach");
            
            // Follow the exact example from HTML directly
            const options = new (window as any).BimfaceSDKLoaderConfig();
            options.viewToken = token;
            options.language = "en_GB";
            
            (window as any).BimfaceSDKLoader.load(
              options, 
              function successCallback(viewMetaData: any) {
                console.log("Model loaded successfully via fallback. Metadata:", viewMetaData);
                
                if (viewMetaData.viewType === "3DView") {
                  setTimeout(() => {
                    if (currentContainerIdRef.current !== uniqueContainerId) return;
                    
                    const domShow = document.getElementById(uniqueContainerId);
                    if (!domShow) {
                      setError(`Target DOM element ${uniqueContainerId} not found`);
                      setLoading(false);
                      currentContainerIdRef.current = null;
                      return;
                    }
                    
                    const Glodon = (window as any).Glodon;
                    const webAppConfig = new Glodon.Bimface.Application.WebApplication3DConfig();
                    webAppConfig.domElement = domShow;
                    webAppConfig.globalUnit = Glodon.Bimface.Common.Units.LengthUnits.Millimeter;
                    
                    const app = new Glodon.Bimface.Application.WebApplication3D(webAppConfig);
                    appRef.current = app;
                    app.addView(token);
                    
                    const viewer = app.getViewer();
                    viewerRef.current = viewer;
                    
                    viewer.addEventListener(Glodon.Bimface.Viewer.Viewer3DEvent.ViewAdded, function() {
                      console.log("View added successfully via fallback!");
                      if (skyBoxEnabled) {
                        initializeSkyBox(viewer);
                      }
                      viewer.render();
                      setLoading(false);
                    });
                  }, 300);
                }
              },
              function failureCallback(error: any) {
                console.error("Failed to load model via fallback:", error);
                setError(`Failed to load model: ${error || 'Unknown error'}`);
                setLoading(false);
                currentContainerIdRef.current = null;
              }
            );
          }
        }, 1000);
      };
      
      // Start waiting for container
      waitForContainer();
      
    } catch (e) {
      console.error("Error initializing viewer:", e);
      setError(`Error initializing BIMFACE viewer: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
      currentContainerIdRef.current = null;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const navigateTo = (path: string) => {
    if (viewToken) {
      navigate(`${path}?viewToken=${viewToken}`);
    } else {
      navigate(path);
    }
  };

  // Get status color for sensors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get icon for sensor type
  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <RiTempHotLine className="text-red-400" />;
      case 'humidity': return <RiWaterFlashLine className="text-blue-400" />;
      case 'occupancy': return <RiUserLocationLine className="text-purple-400" />;
      case 'energy': return <RiLightbulbLine className="text-yellow-400" />;
      default: return <RiSensorLine className="text-gray-400" />;
    }
  };

  // Get toxic gas icon and color
  const getToxicGasIcon = (type: string) => {
    switch (type) {
      case 'co': return <RiAlertLine className="text-red-400" />;
      case 'co2': return <RiCloudyLine className="text-orange-400" />;
      case 'no2': return <RiAlarmWarningLine className="text-yellow-400" />;
      case 'so2': return <RiAlertLine className="text-purple-400" />;
      case 'h2s': return <RiAlarmWarningLine className="text-green-400" />;
      case 'ch4': return <RiAlertLine className="text-blue-400" />;
      case 'nh3': return <RiAlarmWarningLine className="text-pink-400" />;
      case 'o3': return <RiAlertLine className="text-cyan-400" />;
      default: return <RiSensorLine className="text-gray-400" />;
    }
  };

  // Get toxic gas name
  const getToxicGasName = (type: string) => {
    switch (type) {
      case 'co': return 'Carbon Monoxide';
      case 'co2': return 'Carbon Dioxide';
      case 'no2': return 'Nitrogen Dioxide';
      case 'so2': return 'Sulfur Dioxide';
      case 'h2s': return 'Hydrogen Sulfide';
      case 'ch4': return 'Methane';
      case 'nh3': return 'Ammonia';
      case 'o3': return 'Ozone';
      default: return 'Unknown Gas';
    }
  };

  // Get gas status color
  const getGasStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Initialize weather data on component mount
  useEffect(() => {
    fetchWeatherData();
    
    // Set up interval to refresh weather data every 30 minutes
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900/20 via-slate-950/15 to-black/30 relative overflow-hidden">
      {/* 3D Viewer - Full Screen Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* BIMFACE Viewer Container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 w-full h-full bg-slate-950"
          style={{ pointerEvents: 'auto' }}
        />
        
        {/* React Three Fiber Canvas - fallback/overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            camera={{ position: [5, 5, 5], fov: 60 }}
            style={{ background: 'transparent', pointerEvents: 'none' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {skyBoxEnabled && (
              <Sky
                distance={450000}
                sunPosition={[0, 1, 0]}
                inclination={0}
                azimuth={0.25}
              />
            )}
            
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            
            {/* Removed the 3D cube - now empty for better BIMFACE viewer access */}
          </Canvas>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <div className="text-white text-lg font-medium">Loading 3D Model...</div>
              <div className="text-white/60 text-sm mt-2">Please wait while we initialize the viewer</div>
            </div>
          </div>
        )}
        
        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <div className="text-white text-lg font-medium mb-2">Unable to Load 3D Model</div>
              <div className="text-white/60 text-sm mb-4">{error}</div>
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Retry loading
                  const { fileId, viewToken: urlViewToken } = getParamsFromUrl();
                  if (fileId || urlViewToken) {
                    window.location.reload();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UI Layer - Above 3D Viewer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="h-full flex">
          {/* Left Panel */}
      <AnimatePresence>
            {leftPanelVisible && (
          <motion.div 
                initial={{ x: -leftPanelWidth }}
                animate={{ x: 0 }}
                exit={{ x: -leftPanelWidth }}
                transition={{ duration: 0.3 }}
                className="relative bg-slate-900/10 backdrop-blur-xl border-r border-slate-600/20 shadow-2xl flex flex-col z-20 pointer-events-auto"
                style={{ width: leftPanelWidth }}
              >
                {/* Context Area - Above Left Panel */}
                <div className="bg-slate-800/10 backdrop-blur-xl border-b border-slate-600/20 p-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="flex items-center gap-2 bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg px-3 py-2 text-slate-100 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                      >
                        <RiArrowGoBackLine className="text-lg" />
                        <span className="text-sm font-medium">Back</span>
                      </motion.button>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">MT</span>
                        </div>
                        <div>
                          <h1 className="text-slate-100 font-bold text-lg">MatrixTwin</h1>
                          <p className="text-slate-200 text-xs">Digital Twin Platform</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-slate-100 font-bold text-xl">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-slate-200 text-sm">
                        {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Weather */}
                      <div className="flex items-center gap-2 bg-slate-700/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-500/20 shadow-lg">
                        {getWeatherIcon('01d')}
                        <div>
                          <div className="text-slate-100 font-bold text-sm">
                            {weatherData.current?.temperature?.[0]?.value || 24}°C
                          </div>
                          <div className="text-slate-200 text-xs">Hong Kong</div>
                        </div>
                      </div>
                      
                      {/* Sky Toggle */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleSkyBox}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all shadow-lg backdrop-blur-sm ${
                          skyBoxEnabled 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                            : 'bg-slate-700/30 text-slate-100 border border-slate-500/20 hover:bg-slate-600/40'
                        }`}
                      >
                        {skyBoxEnabled ? (
                          <RiSunLine className="text-lg" />
                        ) : (
                          <RiMoonLine className="text-lg" />
                        )}
                        <span className="text-sm">{skyBoxEnabled ? 'Day' : 'Night'}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Resize Handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full bg-slate-600/50 hover:bg-blue-500/70 cursor-col-resize transition-colors z-10"
                  onMouseDown={(e) => handleResizeStart(e, 'left')}
                />
                
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-600/20 flex-shrink-0 bg-slate-800/10 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-slate-100 font-bold text-lg">Event Center</h2>
                    <button
                      onClick={() => setLeftPanelVisible(false)}
                      className="text-slate-200 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="text-xl" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['All', 'Building Analytics', 'Environmental Controls', 'Sensor Status', 'Security Dashboard'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveLeftTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeLeftTab === tab
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-700/30 text-slate-100 hover:text-white hover:bg-slate-600/40 border border-slate-500/20 backdrop-blur-sm'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 h-full overflow-y-auto bg-slate-900/10 backdrop-blur-md">
                  {activeLeftTab === 'All' && (
                    <div className="space-y-4">
                      {/* Comprehensive Dashboard */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiDashboardLine className="text-cyan-400" />
                          Comprehensive Analytics
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-blue-100 text-sm">Total Sensors</div>
                            <div className="text-white font-bold text-xl">{sensors.length + toxicGasSensors.length}</div>
                            <div className="text-blue-200 text-xs">Active Monitoring</div>
                          </div>
                          <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-green-100 text-sm">System Health</div>
                            <div className="text-white font-bold text-xl">
                              {Math.round(((sensors.filter(s => s.status === 'online').length + toxicGasSensors.filter(g => g.status === 'safe').length) / (sensors.length + toxicGasSensors.length)) * 100)}%
                            </div>
                            <div className="text-green-200 text-xs">Overall Status</div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-purple-100 text-sm">CCTV Cameras</div>
                            <div className="text-white font-bold text-xl">{cctvCameras.length}</div>
                            <div className="text-purple-200 text-xs">Security Coverage</div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-orange-100 text-sm">Gas Monitors</div>
                            <div className="text-white font-bold text-xl">{toxicGasSensors.length}</div>
                            <div className="text-orange-200 text-xs">Air Quality</div>
                          </div>
                        </div>
                      </div>

                      {/* All Systems Status */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">All Systems Status</h3>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">
                              {sensors.filter(s => s.status === 'online').length + toxicGasSensors.filter(g => g.status === 'safe').length}
                            </div>
                            <div className="text-slate-200 text-sm">Normal</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">
                              {sensors.filter(s => s.status === 'warning').length + toxicGasSensors.filter(g => g.status === 'warning').length}
                            </div>
                            <div className="text-slate-200 text-sm">Warning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">
                              {sensors.filter(s => s.status === 'critical').length + toxicGasSensors.filter(g => g.status === 'critical' || g.status === 'danger').length}
                            </div>
                            <div className="text-slate-200 text-sm">Critical</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl font-bold">
                              {sensors.filter(s => s.status === 'offline').length}
                            </div>
                            <div className="text-slate-200 text-sm">Offline</div>
                          </div>
                        </div>
                      </div>

                      {/* Combined Analytics Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">System Performance (24h)</h3>
                        <div className="h-48">
                          <Line
                            data={{
                              labels: generateTimeSeriesData(24).labels,
                              datasets: [
                                {
                                  label: 'Energy (kWh)',
                                  data: generateTimeSeriesData(24, 40, 8).data,
                                  borderColor: 'rgb(59, 130, 246)',
                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                },
                                {
                                  label: 'Temperature (°C)',
                                  data: generateTimeSeriesData(24, 22, 2).data,
                                  borderColor: 'rgb(34, 197, 94)',
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                },
                                {
                                  label: 'Air Quality Index',
                                  data: generateTimeSeriesData(24, 75, 15).data,
                                  borderColor: 'rgb(168, 85, 247)',
                                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  display: true,
                                  labels: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              },
                              scales: {
                                x: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                },
                                y: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* System Distribution */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">System Distribution</h3>
                        <div className="h-48">
                          <Doughnut
                            data={{
                              labels: ['Environmental', 'Security', 'Gas Monitoring', 'Energy', 'HVAC'],
                              datasets: [{
                                data: [
                                  sensors.filter(s => s.type === 'temperature' || s.type === 'humidity').length,
                                  cctvCameras.length,
                                  toxicGasSensors.length,
                                  sensors.filter(s => s.type === 'energy').length,
                                  2 // HVAC systems
                                ],
                                backgroundColor: [
                                  'rgba(34, 197, 94, 0.8)',
                                  'rgba(239, 68, 68, 0.8)',
                                  'rgba(251, 191, 36, 0.8)',
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(168, 85, 247, 0.8)'
                                ],
                                borderColor: [
                                  'rgb(34, 197, 94)',
                                  'rgb(239, 68, 68)',
                                  'rgb(251, 191, 36)',
                                  'rgb(59, 130, 246)',
                                  'rgb(168, 85, 247)'
                                ],
                                borderWidth: 1
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  display: true,
                                  position: 'bottom',
                                  labels: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Recent Alerts */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Recent Alerts</h3>
                        <div className="space-y-2">
                          {toxicGasSensors.filter(g => g.alerts.length > 0).slice(0, 3).map((gas) => (
                            <div key={gas.id} className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                {getToxicGasIcon(gas.type)}
                                <span className="text-yellow-300 text-sm font-medium">{getToxicGasName(gas.type)}</span>
                              </div>
                              <div className="text-yellow-200 text-xs">{gas.alerts[0]?.message}</div>
                              <div className="text-yellow-400 text-xs">{gas.location} • {gas.alerts[0]?.time}</div>
                            </div>
                          ))}
                          {cctvCameras.filter(c => c.alerts.length > 0).slice(0, 2).map((camera) => (
                            <div key={camera.id} className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <RiCameraLine className="text-red-400" />
                                <span className="text-red-300 text-sm font-medium">{camera.name}</span>
                              </div>
                              <div className="text-red-200 text-xs">{camera.alerts[0]?.message}</div>
                              <div className="text-red-400 text-xs">{camera.location} • {camera.alerts[0]?.time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeLeftTab === 'Building Analytics' && (
                    <div className="space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiBarChartBoxLine className="text-blue-400" />
                          System Overview
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-blue-100 text-sm">Energy Usage</div>
                            <div className="text-white font-bold text-xl">42.7 kWh</div>
                            <div className="text-blue-200 text-xs">Today</div>
                          </div>
                          <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-green-100 text-sm">Efficiency</div>
                            <div className="text-white font-bold text-xl">94.2%</div>
                            <div className="text-green-200 text-xs">System Performance</div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-purple-100 text-sm">Active Sensors</div>
                            <div className="text-white font-bold text-xl">{sensors.filter(s => s.status === 'online').length}</div>
                            <div className="text-purple-200 text-xs">Online Now</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Analytics Charts */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Energy Consumption (24h)</h3>
                        <div className="h-48">
                          <Line
                            data={{
                              labels: generateTimeSeriesData(24).labels,
                              datasets: [{
                                label: 'Energy (kWh)',
                                data: generateTimeSeriesData(24, 40, 8).data,
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                fill: true,
                                tension: 0.4
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false }
                              },
                              scales: {
                                x: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                },
                                y: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* System Status */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">System Status</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{sensors.filter(s => s.status === 'online').length}</div>
                            <div className="text-slate-200 text-sm">Online</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{sensors.filter(s => s.status === 'warning').length}</div>
                            <div className="text-slate-200 text-sm">Warning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{sensors.filter(s => s.status === 'critical').length}</div>
                            <div className="text-slate-200 text-sm">Critical</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl font-bold">{sensors.filter(s => s.status === 'offline').length}</div>
                            <div className="text-slate-200 text-sm">Offline</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeLeftTab === 'Environmental Controls' && (
                    <div className="space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiRemoteControlLine className="text-green-400" />
                          HVAC System
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200">Target Temperature</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-100 font-bold">{targetTemp}°C</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => setTargetTemp(Math.max(16, targetTemp - 1))}
                                  className="w-7 h-7 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg text-slate-100 text-sm transition-colors border border-slate-500/20"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => setTargetTemp(Math.min(30, targetTemp + 1))}
                                  className="w-7 h-7 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg text-slate-100 text-sm transition-colors border border-slate-500/20"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200">System Status</span>
                            <button 
                              onClick={() => setHvacEnabled(!hvacEnabled)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${
                                hvacEnabled 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-slate-700/30 text-slate-200 hover:bg-slate-600/40 border border-slate-500/20'
                              }`}
                            >
                              {hvacEnabled ? 'ONLINE' : 'OFFLINE'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200">Lighting Level</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-100 font-bold">{lightingLevel}%</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => setLightingLevel(Math.max(0, lightingLevel - 10))}
                                  className="w-7 h-7 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg text-slate-100 text-sm transition-colors border border-slate-500/20"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => setLightingLevel(Math.min(100, lightingLevel + 10))}
                                  className="w-7 h-7 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg text-slate-100 text-sm transition-colors border border-slate-500/20"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Temperature Control Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Temperature Control (24h)</h3>
                        <div className="h-48">
                          <Line
                            data={{
                              labels: generateTimeSeriesData(24).labels,
                              datasets: [
                                {
                                  label: 'Actual',
                                  data: generateTimeSeriesData(24, 22, 1.5).data,
                                  borderColor: 'rgb(34, 197, 94)',
                                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                  fill: true,
                                  tension: 0.4
                                },
                                {
                                  label: 'Target',
                                  data: Array(24).fill(targetTemp),
                                  borderColor: 'rgb(239, 68, 68)',
                                  backgroundColor: 'transparent',
                                  borderDash: [5, 5],
                                  fill: false
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  display: true,
                                  labels: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              },
                              scales: {
                                x: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                },
                                y: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeLeftTab === 'Sensor Status' && (
                    <div className="space-y-3">
                      {/* Sensor Summary */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Sensor Overview</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{sensors.filter(s => s.status === 'online').length}</div>
                            <div className="text-slate-200 text-sm">Online</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{sensors.filter(s => s.status === 'warning').length}</div>
                            <div className="text-slate-200 text-sm">Warning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{sensors.filter(s => s.status === 'critical').length}</div>
                            <div className="text-slate-200 text-sm">Critical</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl font-bold">{sensors.filter(s => s.status === 'offline').length}</div>
                            <div className="text-slate-200 text-sm">Offline</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sensor Status Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Sensor Status Distribution</h3>
                        <div className="h-48">
                          <Doughnut
                            data={{
                              labels: ['Online', 'Warning', 'Critical', 'Offline'],
                              datasets: [{
                                data: [
                                  sensors.filter(s => s.status === 'online').length,
                                  sensors.filter(s => s.status === 'warning').length,
                                  sensors.filter(s => s.status === 'critical').length,
                                  sensors.filter(s => s.status === 'offline').length
                                ],
                                backgroundColor: [
                                  'rgba(34, 197, 94, 0.8)',
                                  'rgba(251, 191, 36, 0.8)',
                                  'rgba(239, 68, 68, 0.8)',
                                  'rgba(107, 114, 128, 0.8)'
                                ],
                                borderColor: [
                                  'rgb(34, 197, 94)',
                                  'rgb(251, 191, 36)',
                                  'rgb(239, 68, 68)',
                                  'rgb(107, 114, 128)'
                                ],
                                borderWidth: 1
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  display: true,
                                  position: 'bottom',
                                  labels: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Individual Sensors */}
                      {sensors.map((sensor) => (
                        <div key={sensor.id} className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-3 border border-slate-600/20 shadow-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                sensor.status === 'online' ? 'bg-green-400' : 
                                sensor.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                              }`} />
                              <span className="text-slate-100 font-medium text-sm">{sensor.name}</span>
                            </div>
                            <span className="text-slate-100 font-bold">{sensor.value} {sensor.unit}</span>
                          </div>
                          <div className="text-slate-200 text-xs">{sensor.location}</div>
                          {sensor.battery && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-slate-700/30 rounded-full h-1.5">
                                <div 
                                  className="bg-green-400 h-1.5 rounded-full transition-all" 
                                  style={{ width: `${sensor.battery}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-300">{sensor.battery}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeLeftTab === 'Security Dashboard' && (
                    <div className="space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiShieldCheckLine className="text-purple-400" />
                          Security Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-green-100 text-sm">Access Control</div>
                            <div className="text-white font-bold text-xl">SECURE</div>
                            <div className="text-green-200 text-xs">All Systems Normal</div>
                          </div>
                          <div className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                            <div className="text-blue-100 text-sm">Active Cameras</div>
                            <div className="text-white font-bold text-xl">{cctvCameras.filter(c => c.status === 'online' || c.status === 'recording').length}</div>
                            <div className="text-blue-200 text-xs">Recording Now</div>
                          </div>
                        </div>
                        
                        {/* Security Status Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'online').length}</div>
                            <div className="text-slate-200 text-sm">Online</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'recording').length}</div>
                            <div className="text-slate-200 text-sm">Recording</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'maintenance').length}</div>
                            <div className="text-slate-200 text-sm">Maintenance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'offline').length}</div>
                            <div className="text-slate-200 text-sm">Offline</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Security Activity Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Security Activity (24h)</h3>
                        <div className="h-48">
                          <Bar
                            data={{
                              labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                              datasets: [{
                                label: 'Security Events',
                                data: [2, 1, 8, 12, 15, 6],
                                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                                borderColor: 'rgb(168, 85, 247)',
                                borderWidth: 1
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false }
                              },
                              scales: {
                                x: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                },
                                y: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
                            <RiAlertLine className="text-xl mb-1" />
                            <div className="text-sm">Emergency</div>
                          </button>
                          <button className="bg-blue-600/80 hover:bg-blue-600 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
                            <RiCameraLine className="text-xl mb-1" />
                            <div className="text-sm">View All</div>
                          </button>
                          <button className="bg-green-600/80 hover:bg-green-600 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
                            <RiDoorLockLine className="text-xl mb-1" />
                            <div className="text-sm">Lock All</div>
                          </button>
                          <button className="bg-purple-600/80 hover:bg-purple-600 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
                            <RiHistoryLine className="text-xl mb-1" />
                            <div className="text-sm">History</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center Interactive Area - CRITICAL: This must allow 3D viewer interaction */}
          <div className="flex-1 relative pointer-events-none">
            {/* This div is intentionally empty and allows pointer events to pass through */}
            {/* The 3D viewer underneath can receive all mouse/touch events */}
          </div>

          {/* Right Panel */}
      <AnimatePresence>
            {rightPanelVisible && (
          <motion.div 
                initial={{ x: rightPanelWidth }}
                animate={{ x: 0 }}
                exit={{ x: rightPanelWidth }}
                transition={{ duration: 0.3 }}
                className="relative bg-slate-900/10 backdrop-blur-xl border-l border-slate-600/20 shadow-2xl z-20 pointer-events-auto"
                style={{ width: rightPanelWidth }}
              >
                {/* Resize Handle */}
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-slate-600/50 hover:bg-blue-500/70 cursor-col-resize transition-colors z-10"
                  onMouseDown={(e) => handleResizeStart(e, 'right')}
                />
                
                {/* Header */}
                <div className="p-4 border-b border-slate-600/20 bg-slate-800/10 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-slate-100 font-bold text-lg">Smart Controls</h2>
                    <button 
                      onClick={() => setRightPanelVisible(false)}
                      className="text-slate-200 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="text-xl" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'smartlock', name: 'Smart Lock', icon: RiDoorLockLine, color: 'cyan' },
                      { id: 'cctv', name: 'CCTV', icon: RiCameraLine, color: 'red' },
                      { id: 'smartwatch', name: 'Smart Watch', icon: RiTimeLine, color: 'green' },
                      { id: 'toxicgas', name: 'Gas Monitor', icon: RiAlarmWarningLine, color: 'orange' },
                      { id: 'weather', name: 'Weather', icon: RiCloudyLine, color: 'blue' }
                    ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveRightTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          activeRightTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-700/30 text-slate-100 hover:text-white hover:bg-slate-600/40 border border-slate-500/20 backdrop-blur-sm'
                        }`}
                      >
                        <tab.icon className="text-sm" />
                        {tab.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Content */}
                <div className="h-full overflow-y-auto bg-slate-900/10 backdrop-blur-md">
                  {activeRightTab === 'smartlock' && (
                    <div className="h-full">
                      <SmartLockDashboard />
                    </div>
                  )}
                  
                  {activeRightTab === 'cctv' && (
                    <div className="p-4 space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiCameraLine className="text-red-400" />
                          CCTV Control Center
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'online').length}</div>
                            <div className="text-slate-200 text-sm">Online</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{cctvCameras.filter(c => c.status === 'recording').length}</div>
                            <div className="text-slate-200 text-sm">Recording</div>
                          </div>
                        </div>
                      </div>
                      
                      {cctvCameras.map((camera) => (
                        <div key={camera.id} className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <RiCameraLine className="text-red-400" />
                              <span className="text-slate-100 font-medium">{camera.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {camera.isRecording && (
                                <RiRecordCircleLine className="text-red-500 animate-pulse" />
                              )}
                              <div className={`w-2 h-2 rounded-full ${
                                camera.status === 'online' ? 'bg-green-400' : 
                                camera.status === 'recording' ? 'bg-red-400' : 'bg-gray-400'
                              }`} />
                            </div>
                          </div>
                          
                          {/* Camera Screen */}
                          <div className="bg-black/50 rounded-lg p-4 mb-3 aspect-video flex items-center justify-center border border-slate-600/20">
                            <div className="text-center">
                              <RiCameraLine className="text-slate-400 text-4xl mb-2 mx-auto" />
                              <div className="text-slate-300 text-sm">{camera.name}</div>
                              <div className="text-slate-400 text-xs">{camera.resolution}</div>
                            </div>
                          </div>
                          
                          {/* Camera Controls */}
                          <div className="flex gap-2 mb-3">
                            <button 
                              onClick={() => setFullscreenCamera(camera)}
                              className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white p-2 rounded-lg transition-all text-sm backdrop-blur-sm"
                            >
                              <RiFullscreenLine className="inline mr-1" />
                              Fullscreen
                            </button>
                            <button className="flex-1 bg-green-600/80 hover:bg-green-600 text-white p-2 rounded-lg transition-all text-sm backdrop-blur-sm">
                              <RiRecordCircleLine className="inline mr-1" />
                              Record
                            </button>
                          </div>
                          
                          <div className="text-slate-200 text-sm space-y-1">
                            <div>Location: {camera.location}</div>
                            <div>Status: <span className="capitalize text-slate-100">{camera.status}</span></div>
                            <div>Resolution: {camera.resolution}</div>
                            <div>Night Vision: {camera.nightVision ? 'Enabled' : 'Disabled'}</div>
                          </div>
                          
                          {/* Recent Alerts */}
                          {camera.alerts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600/20">
                              <div className="text-slate-100 text-sm font-medium mb-2">Recent Alerts</div>
                              {camera.alerts.slice(0, 2).map((alert, idx) => (
                                <div key={idx} className="bg-yellow-500/20 rounded-lg p-2 mb-1">
                                  <div className="text-yellow-300 text-xs font-medium">{alert.type}</div>
                                  <div className="text-yellow-200 text-xs">{alert.message}</div>
                                  <div className="text-yellow-400 text-xs">{alert.time}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {activeRightTab === 'smartwatch' && (
                    <div className="p-4 space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiTimeLine className="text-green-400" />
                          Smart Watch Hub
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{smartWatches.filter(w => w.status === 'connected').length}</div>
                            <div className="text-slate-200 text-sm">Connected</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{smartWatches.filter(w => w.status === 'charging').length}</div>
                            <div className="text-slate-200 text-sm">Charging</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{smartWatches.filter(w => w.status === 'disconnected').length}</div>
                            <div className="text-slate-200 text-sm">Offline</div>
                          </div>
                        </div>
                      </div>
                      
                      {smartWatches.map((watch) => (
                        <div key={watch.id} className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <RiTimeLine className="text-green-400" />
                              <div>
                                <div className="text-slate-100 font-medium">{watch.name}</div>
                                <div className="text-slate-200 text-sm">{watch.user}</div>
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              watch.status === 'connected' ? 'bg-green-400' : 
                              watch.status === 'charging' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                          </div>
                          
                          {/* Watch Screen */}
                          <div className="bg-black/50 rounded-lg p-4 mb-3 aspect-square max-w-32 mx-auto border border-slate-600/20">
                            <div className="text-center text-white">
                              <div className="text-2xl font-bold">{watch.status === 'connected' ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                              <div className="text-xs text-slate-300 mt-1">{watch.status === 'connected' ? 'Connected' : watch.status}</div>
                            </div>
                          </div>
                          
                          {watch.status === 'connected' && (
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-red-500/20 rounded-lg p-2 text-center">
                                <div className="text-red-300 text-sm">Heart Rate</div>
                                <div className="text-red-100 font-bold">{watch.heartRate} BPM</div>
                              </div>
                              <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                                <div className="text-blue-300 text-sm">Steps</div>
                                <div className="text-blue-100 font-bold">{watch.steps.toLocaleString()}</div>
                              </div>
                              <div className="bg-green-500/20 rounded-lg p-2 text-center">
                                <div className="text-green-300 text-sm">Battery</div>
                                <div className="text-green-100 font-bold">{watch.batteryLevel}%</div>
                              </div>
                              <div className="bg-yellow-500/20 rounded-lg p-2 text-center">
                                <div className="text-yellow-300 text-sm">Temp</div>
                                <div className="text-yellow-100 font-bold">{watch.temperature}°C</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-slate-200 text-sm space-y-1">
                            <div>Location: {watch.location}</div>
                            <div>Last Sync: {watch.lastSync}</div>
                          </div>
                          
                          {/* Notifications */}
                          {watch.notifications.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600/20">
                              <div className="text-slate-100 text-sm font-medium mb-2">Notifications</div>
                              {watch.notifications.slice(0, 2).map((notification, idx) => (
                                <div key={idx} className="bg-blue-500/20 rounded-lg p-2 mb-1">
                                  <div className="text-blue-300 text-xs font-medium">{notification.type}</div>
                                  <div className="text-blue-200 text-xs">{notification.message}</div>
                                  <div className="text-blue-400 text-xs">{notification.time}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeRightTab === 'toxicgas' && (
                    <div className="p-4 space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiAlarmWarningLine className="text-orange-400" />
                          Toxic Gas Monitoring
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-green-400 text-2xl font-bold">{toxicGasSensors.filter(g => g.status === 'safe').length}</div>
                            <div className="text-slate-200 text-sm">Safe</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 text-2xl font-bold">{toxicGasSensors.filter(g => g.status === 'warning').length}</div>
                            <div className="text-slate-200 text-sm">Warning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-400 text-2xl font-bold">{toxicGasSensors.filter(g => g.status === 'danger').length}</div>
                            <div className="text-slate-200 text-sm">Danger</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 text-2xl font-bold">{toxicGasSensors.filter(g => g.status === 'critical').length}</div>
                            <div className="text-slate-200 text-sm">Critical</div>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-lg transition-all text-sm">
                            <RiAlertLine className="inline mr-1" />
                            Emergency
                          </button>
                          <button className="bg-blue-600/80 hover:bg-blue-600 text-white p-2 rounded-lg transition-all text-sm">
                            <RiRefreshLine className="inline mr-1" />
                            Calibrate All
                          </button>
                        </div>
                      </div>
                      
                      {/* Gas Monitoring Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Gas Levels (24h)</h3>
                        <div className="h-48">
                          <Line
                            data={{
                              labels: generateTimeSeriesData(24).labels,
                              datasets: [
                                {
                                  label: 'CO (ppm)',
                                  data: generateTimeSeriesData(24, 15, 5).data,
                                  borderColor: 'rgb(239, 68, 68)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                },
                                {
                                  label: 'CO2 (ppm)',
                                  data: generateTimeSeriesData(24, 850, 100).data,
                                  borderColor: 'rgb(251, 191, 36)',
                                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                },
                                {
                                  label: 'NO2 (ppm)',
                                  data: generateTimeSeriesData(24, 0.08, 0.02).data,
                                  borderColor: 'rgb(168, 85, 247)',
                                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                  fill: false,
                                  tension: 0.4
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { 
                                  display: true,
                                  labels: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              },
                              scales: {
                                x: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                },
                                y: { 
                                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                                  ticks: { color: 'rgba(148, 163, 184, 0.8)' }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Individual Gas Sensors */}
                      {toxicGasSensors.map((gas) => (
                        <div key={gas.id} className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getToxicGasIcon(gas.type)}
                              <div>
                                <div className="text-slate-100 font-medium">{getToxicGasName(gas.type)}</div>
                                <div className="text-slate-200 text-sm">{gas.location}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getGasStatusColor(gas.status)}`} />
                              <span className="text-slate-100 font-bold">{gas.value} {gas.unit}</span>
                            </div>
                          </div>
                          
                          {/* Gas Level Indicator */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>Current Level</span>
                              <span>Threshold: {gas.threshold} {gas.unit}</span>
                            </div>
                            <div className="w-full bg-slate-700/30 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  gas.status === 'safe' ? 'bg-green-500' : 
                                  gas.status === 'warning' ? 'bg-yellow-500' : 
                                  gas.status === 'danger' ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, (gas.value / gas.threshold) * 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Gas Info */}
                          <div className="text-slate-200 text-sm space-y-1">
                            <div>Status: <span className={`capitalize font-medium ${
                              gas.status === 'safe' ? 'text-green-400' :
                              gas.status === 'warning' ? 'text-yellow-400' :
                              gas.status === 'danger' ? 'text-orange-400' : 'text-red-400'
                            }`}>{gas.status}</span></div>
                            <div>Battery: {gas.battery}%</div>
                            <div>Last Calibration: {gas.calibrationDate}</div>
                            <div>Last Updated: {new Date(gas.lastUpdated).toLocaleTimeString()}</div>
                          </div>
                          
                          {/* Alerts */}
                          {gas.alerts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-600/20">
                              <div className="text-slate-100 text-sm font-medium mb-2">Active Alerts</div>
                              {gas.alerts.map((alert, idx) => (
                                <div key={idx} className={`rounded-lg p-2 mb-1 ${
                                  alert.level === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                  alert.level === 'danger' ? 'bg-orange-500/20 border border-orange-500/30' :
                                  'bg-red-500/20 border border-red-500/30'
                                }`}>
                                  <div className={`text-xs font-medium ${
                                    alert.level === 'warning' ? 'text-yellow-300' :
                                    alert.level === 'danger' ? 'text-orange-300' : 'text-red-300'
                                  }`}>{alert.level.toUpperCase()}</div>
                                  <div className={`text-xs ${
                                    alert.level === 'warning' ? 'text-yellow-200' :
                                    alert.level === 'danger' ? 'text-orange-200' : 'text-red-200'
                                  }`}>{alert.message}</div>
                                  <div className={`text-xs ${
                                    alert.level === 'warning' ? 'text-yellow-400' :
                                    alert.level === 'danger' ? 'text-orange-400' : 'text-red-400'
                                  }`}>{alert.time}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeRightTab === 'weather' && (
                    <div className="p-4 space-y-4">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-slate-100 font-medium flex items-center gap-2">
                            <RiCloudyLine className="text-blue-400" />
                            Current Weather
                          </h3>
                          <button 
                            onClick={fetchWeatherData}
                            disabled={weatherData.loading}
                            className="p-2 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg text-slate-200 hover:text-white transition-all disabled:opacity-50"
                          >
                            <RiRefreshLine className={`text-sm ${weatherData.loading ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                
                        {weatherData.loading && (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-slate-200 text-sm">Loading weather data...</p>
                          </div>
                        )}
                        
                        {weatherData.error && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-3">
                            <p className="text-red-300 text-sm">{weatherData.error}</p>
                          </div>
                        )}
                        
                        {weatherData.current && !weatherData.loading && (
                          <div className="space-y-3">
                            {weatherData.current.temperature && weatherData.current.temperature[0] && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-200">Temperature</span>
                                <span className="text-slate-100 font-bold">
                                  {weatherData.current.temperature[0].value}°{weatherData.current.temperature[0].unit}
                                </span>
                              </div>
                            )}
                            
                            {weatherData.current.humidity && weatherData.current.humidity[0] && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-200">Humidity</span>
                                <span className="text-slate-100 font-bold">
                                  {weatherData.current.humidity[0].value}%
                                </span>
                              </div>
                            )}
                            
                            {weatherData.current.icon && weatherData.current.icon[0] && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-200">Conditions</span>
                                <div className="flex items-center gap-2">
                                  {getWeatherIcon(weatherData.current.icon[0])}
                                  <span className="text-slate-100 font-bold text-sm">
                                    {weatherData.current.icon[0] === 50 ? 'Sunny' : 
                                     weatherData.current.icon[0] === 51 ? 'Sunny Periods' :
                                     weatherData.current.icon[0] === 52 ? 'Sunny Intervals' :
                                     weatherData.current.icon[0] === 53 ? 'Sunny Periods with A Few Showers' :
                                     weatherData.current.icon[0] === 54 ? 'Sunny Intervals with Showers' :
                                     weatherData.current.icon[0] === 60 ? 'Cloudy' :
                                     weatherData.current.icon[0] === 61 ? 'Overcast' :
                                     weatherData.current.icon[0] === 62 ? 'Light Rain' :
                                     weatherData.current.icon[0] === 63 ? 'Rain' :
                                     weatherData.current.icon[0] === 64 ? 'Heavy Rain' :
                                     'Clear'}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {weatherData.current.uvindex && weatherData.current.uvindex[0] && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-200">UV Index</span>
                                <span className="text-slate-100 font-bold">
                                  {weatherData.current.uvindex[0].value} - {weatherData.current.uvindex[0].desc}
                                </span>
                              </div>
                            )}
                            
                            {weatherData.current.warningMessage && weatherData.current.warningMessage.length > 0 && (
                              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                                <div className="text-yellow-300 text-sm font-medium mb-1">Weather Warning</div>
                                {weatherData.current.warningMessage.map((warning, index) => (
                                  <div key={index} className="text-yellow-200 text-xs">{warning}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {weatherData.local && !weatherData.loading && (
                          <div className="mt-4 pt-4 border-t border-slate-600/20">
                            <h4 className="text-slate-100 font-medium mb-2">Local Forecast</h4>
                            <div className="text-slate-200 text-sm space-y-1">
                              <div><strong>Period:</strong> {weatherData.local.forecastPeriod}</div>
                              <div><strong>Description:</strong> {weatherData.local.forecastDesc}</div>
                              {weatherData.local.outlook && (
                                <div><strong>Outlook:</strong> {weatherData.local.outlook}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fullscreen Camera Modal */}
        <AnimatePresence>
          {fullscreenCamera && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="w-full h-full max-w-6xl max-h-4xl p-4">
                <div className="bg-slate-900/90 backdrop-blur-lg rounded-xl border border-slate-600/30 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-600/30">
                    <div className="flex items-center gap-3">
                      <RiCameraLine className="text-red-400 text-xl" />
                      <div>
                        <h3 className="text-white font-bold text-lg">{fullscreenCamera.name}</h3>
                        <p className="text-slate-300 text-sm">{fullscreenCamera.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {fullscreenCamera.isRecording && (
                          <RiRecordCircleLine className="text-red-500 animate-pulse" />
                        )}
                        <span className="text-slate-300 text-sm">
                          {fullscreenCamera.status === 'recording' ? 'Recording' : 'Live'}
                        </span>
                      </div>
                      <button
                        onClick={() => setFullscreenCamera(null)}
                        className="bg-slate-700/60 hover:bg-slate-600/70 text-white p-2 rounded-lg transition-all"
                      >
                        <RiFullscreenExitLine className="text-xl" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Camera View */}
                  <div className="flex-1 bg-black/50 m-4 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <RiCameraLine className="text-slate-400 text-8xl mb-4 mx-auto" />
                      <div className="text-slate-300 text-2xl font-bold">{fullscreenCamera.name}</div>
                      <div className="text-slate-400 text-lg">{fullscreenCamera.resolution} • {fullscreenCamera.viewAngle}</div>
                      <div className="text-slate-500 text-sm mt-2">Camera feed would appear here</div>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="p-4 border-t border-slate-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3">
                        <button className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all">
                          <RiRecordCircleLine className="inline mr-2" />
                          Record
                        </button>
                        <button className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all">
                          <RiCameraLine className="inline mr-2" />
                          Snapshot
                        </button>
                        <button className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all">
                          <RiVolumeUpLine className="inline mr-2" />
                          Audio
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <RiEyeLine className="text-sm" />
                          <span className="text-sm">Night Vision: {fullscreenCamera.nightVision ? 'On' : 'Off'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <RiSensorLine className="text-sm" />
                          <span className="text-sm">Motion: {fullscreenCamera.motionDetection ? 'On' : 'Off'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Panel Toggle Buttons */}
        {!leftPanelVisible && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => setLeftPanelVisible(true)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-md border border-slate-600/30 rounded-full p-3 text-slate-100 hover:text-white z-30 shadow-lg pointer-events-auto transition-all"
          >
            <RiMenuLine className="text-xl" />
          </motion.button>
        )}
        
        {!rightPanelVisible && (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => setRightPanelVisible(true)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-800/50 hover:bg-slate-700/60 backdrop-blur-md border border-slate-600/30 rounded-full p-3 text-slate-100 hover:text-white z-30 shadow-lg pointer-events-auto transition-all"
          >
            <RiAppsLine className="text-xl" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default ModelViewerPage; 