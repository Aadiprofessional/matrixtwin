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
  RiDashboardLine,
  RiCalendarEventLine,
  RiSearchLine,
  RiPieChartLine,
  RiFileTextLine,
  RiCheckLine,
  RiExpandDiagonalLine
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
  {
    id: 'temp-001',
    name: 'Temperature Sensor 1',
    type: 'temperature' as SensorType,
    location: 'Conference Room',
    floor: 1,
    value: 22.5,
    unit: '°C',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:23:00Z',
    battery: 87,
    recentActivity: [
      { message: 'Temperature reading', time: '3 minutes ago' },
      { message: 'Normal operation', time: '15 minutes ago' }
    ]
  },
  {
    id: 'temp-002',
    name: 'Temperature Sensor 2',
    type: 'temperature' as SensorType,
    location: 'Meeting Room B',
    floor: 12,
    value: 23.8,
    unit: '°C',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:21:00Z',
    battery: 92,
    recentActivity: [
      { message: 'Temperature reading', time: '5 minutes ago' },
      { message: 'Calibration check', time: '2 hours ago' }
    ]
  },
  {
    id: 'hum-001',
    name: 'Humidity Sensor 1',
    type: 'humidity' as SensorType,
    location: 'Server Room',
    floor: 10,
    value: 45.2,
    unit: '%',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:20:00Z',
    battery: 78,
    recentActivity: [
      { message: 'Humidity reading', time: '4 minutes ago' },
      { message: 'Normal operation', time: '30 minutes ago' }
    ]
  },
  {
    id: 'occ-001',
    name: 'Occupancy Sensor 1',
    type: 'occupancy' as SensorType,
    location: 'Conference Hall',
    floor: 15,
    value: 12,
    unit: 'people',
    status: 'warning' as SensorStatus,
    lastUpdated: '2025-07-08T14:19:00Z',
    battery: 65,
    recentActivity: [
      { message: 'Occupancy reading', time: '6 minutes ago' },
      { message: 'High occupancy alert', time: '45 minutes ago' }
    ]
  },
  {
    id: 'energy-001',
    name: 'Energy Monitor 1',
    type: 'energy' as SensorType,
    location: 'Main Distribution',
    floor: 1,
    value: 1247.5,
    unit: 'kWh',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:18:00Z',
    battery: 95,
    recentActivity: [
      { message: 'Energy reading', time: '7 minutes ago' },
      { message: 'Peak usage detected', time: '1 hour ago' }
    ]
  },
  {
    id: 'water-001',
    name: 'Water Flow Sensor',
    type: 'water' as SensorType,
    location: 'Utility Room',
    floor: 2,
    value: 15.8,
    unit: 'L/min',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:17:00Z',
    battery: 83,
    recentActivity: [
      { message: 'Water flow reading', time: '8 minutes ago' },
      { message: 'Normal flow rate', time: '1 hour ago' }
    ]
  },
  {
    id: 'door-001',
    name: 'Smart Door Sensor',
    type: 'door' as SensorType,
    location: 'Main Entrance',
    floor: 1,
    value: 1,
    unit: 'open',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:16:00Z',
    battery: 71,
    recentActivity: [
      { message: 'Door status reading', time: '9 minutes ago' },
      { message: 'Access granted', time: '25 minutes ago' }
    ]
  },
  {
    id: 'air-001',
    name: 'Air Quality Monitor',
    type: 'air' as SensorType,
    location: 'Lobby',
    floor: 1,
    value: 42,
    unit: 'AQI',
    status: 'online' as SensorStatus,
    lastUpdated: '2025-07-08T14:15:00Z',
    battery: 88,
    recentActivity: [
      { message: 'Air quality reading', time: '10 minutes ago' },
      { message: 'Good air quality', time: '2 hours ago' }
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
    id: 'watch-001',
    name: 'Apple Watch Series 9',
    user: 'John Smith',
    batteryLevel: 78,
    heartRate: 72,
    steps: 8543,
    temperature: 36.5,
    location: 'Floor 12',
    lastSync: '1 minute ago',
    status: 'connected',
    notifications: [
      { type: 'health', message: 'Heart rate spike detected', time: '2 minutes ago' },
      { type: 'activity', message: 'Daily step goal achieved', time: '1 hour ago' }
    ]
  },
  {
    id: 'watch-002',
    name: 'Samsung Galaxy Watch',
    user: 'Sarah Johnson',
    batteryLevel: 45,
    heartRate: 68,
    steps: 6234,
    temperature: 36.2,
    location: 'Floor 8',
    lastSync: '3 minutes ago',
    status: 'connected',
    notifications: [
      { type: 'calendar', message: 'Meeting in 10 minutes', time: '4 minutes ago' },
      { type: 'meeting', message: 'Meeting reminder in 15 mins', time: '6 minutes ago' }
    ]
  }
];

// Add mock toxic gas sensor data
const mockToxicGasSensors: ToxicGasSensor[] = [
  {
    id: 'gas-001',
    name: 'CO2 Monitor',
    type: 'co2',
    location: 'Conference Room A',
    floor: 12,
    value: 850,
    unit: 'ppm',
    threshold: 1000,
    status: 'safe',
    lastUpdated: '2025-07-08T14:22:00Z',
    battery: 92,
    calibrationDate: '2025-06-15',
    alerts: [
      { level: 'warning', message: 'CO2 levels approaching threshold', time: '45 minutes ago' }
    ]
  },
  {
    id: 'gas-002',
    name: 'NO2 Sensor',
    type: 'no2',
    location: 'Laboratory',
    floor: 8,
    value: 0.08,
    unit: 'ppm',
    threshold: 0.1,
    status: 'warning',
    lastUpdated: '2025-07-08T14:21:00Z',
    battery: 78,
    calibrationDate: '2025-06-20',
    alerts: [
      { level: 'warning', message: 'NO2 concentration elevated', time: '20 minutes ago' }
    ]
  },
  {
    id: 'gas-003',
    name: 'CO Monitor',
    type: 'co',
    location: 'Parking Garage',
    floor: -1,
    value: 12,
    unit: 'ppm',
    threshold: 30,
    status: 'safe',
    lastUpdated: '2025-07-08T14:20:00Z',
    battery: 85,
    calibrationDate: '2025-06-10',
    alerts: []
  },
  {
    id: 'gas-004',
    name: 'H2S Detector',
    type: 'h2s',
    location: 'Utility Room',
    floor: 2,
    value: 0.5,
    unit: 'ppm',
    threshold: 10,
    status: 'safe',
    lastUpdated: '2025-07-08T14:19:00Z',
    battery: 67,
    calibrationDate: '2025-06-25',
    alerts: []
  },
  {
    id: 'gas-005',
    name: 'SO2 Monitor',
    type: 'so2',
    location: 'Chemical Storage',
    floor: 3,
    value: 0.15,
    unit: 'ppm',
    threshold: 0.5,
    status: 'warning',
    lastUpdated: '2025-07-08T14:18:00Z',
    battery: 71,
    calibrationDate: '2025-06-05',
    alerts: [
      { level: 'warning', message: 'SO2 levels increasing', time: '30 minutes ago' }
    ]
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
  const [activeLeftTab, setActiveLeftTab] = useState('All Events');
  const [activeRightTab, setActiveRightTab] = useState('overview');
  const [timelineFilter, setTimelineFilter] = useState('Today');
  
  // New filter states for All Events
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Panel visibility state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [assetPanelVisible, setAssetPanelVisible] = useState(false);
  
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

  // Notification and modal state
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alarm', message: 'HVAC System Alert - Temperature threshold exceeded', time: '3 min ago', read: false },
    { id: 2, type: 'warning', message: 'Sensor battery low - Floor 15', time: '8 min ago', read: false },
    { id: 3, type: 'info', message: 'Maintenance scheduled for tomorrow', time: '1 hour ago', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFullEventPanel, setShowFullEventPanel] = useState(false);

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

  // Function to get all combined events data
  const getAllCombinedEvents = () => {
    const allEvents = [];
    
    // Add Alarms
    const alarms = [
      {
        id: 'alarm-001',
        title: 'R/F ES1 BMS:ES1_BM_RM19_VENT_TRI',
        location: 'ES1.BMS.URGENT',
        time: '2025-07-08T11:14:00Z',
        status: 'NOT ACKNOWLEDGED',
        priority: 'Urgent',
        building: 'E2',
        description: 'HVAC ventilation system triggered alarm',
        eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518',
        type: 'Alarm',
        category: 'Alarms'
      },
      {
        id: 'alarm-002',
        title: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm',
        location: 'CH.BMS.URGENT',
        time: '2025-07-08T11:03:00Z',
        status: 'CLOSED',
        priority: 'Urgent',
        building: 'CH',
        description: 'Flush tank water level critically low',
        eventId: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm_175185743',
        type: 'Alarm',
        category: 'Alarms'
      },
      {
        id: 'alarm-003',
        title: 'ES3_BMS:NiagaraNetwork',
        location: 'ES3.DDC.BF_01_05',
        time: '2025-07-08T11:02:00Z',
        status: 'CLOSED',
        priority: 'Urgent',
        building: 'E3',
        description: 'Network connectivity issue detected',
        eventId: 'ES3_BMS:NiagaraNetwork_ES3_DDC_BF_01_05_175185732',
        type: 'Alarm',
        category: 'Alarms'
      }
    ];
    
    // Add Predictive Analytics
    const predictive = [
      {
        id: 'pred-001',
        title: 'HVAC Filter Replacement Due',
        location: 'Building A - AHU-01',
        time: '2025-07-10T09:00:00Z',
        status: 'PREDICTED',
        priority: 'Medium',
        building: 'A',
        description: 'AI analysis indicates filter efficiency dropping below 85%',
        eventId: 'PRED_HVAC_FILTER_AHU01_20250710',
        type: 'Maintenance',
        category: 'Predictive',
        confidence: '94%'
      },
      {
        id: 'pred-002',
        title: 'Pump Bearing Wear Detection',
        location: 'Building B - Pump Room',
        time: '2025-07-12T14:30:00Z',
        status: 'PREDICTED',
        priority: 'High',
        building: 'B',
        description: 'Vibration analysis shows bearing wear pattern',
        eventId: 'PRED_PUMP_BEARING_B01_20250712',
        type: 'Critical',
        category: 'Predictive',
        confidence: '87%'
      }
    ];
    
    // Add Service Requests
    const serviceRequests = [
      {
        id: 'sr-001',
        title: 'Air Conditioning Repair',
        location: 'Building A - Office 12F',
        time: '2025-07-08T10:30:00Z',
        status: 'IN PROGRESS',
        priority: 'Medium',
        building: 'A',
        description: 'AC unit not cooling properly',
        eventId: 'SR_AC_REPAIR_A12_20250708',
        type: 'Maintenance',
        category: 'Service Request',
        requestor: 'John Doe',
        assignee: 'HVAC Team'
      },
      {
        id: 'sr-002',
        title: 'Lighting Fixture Replacement',
        location: 'Building B - Corridor 5F',
        time: '2025-07-08T09:15:00Z',
        status: 'PENDING',
        priority: 'Low',
        building: 'B',
        description: 'LED light fixture flickering',
        eventId: 'SR_LIGHT_REPLACE_B05_20250708',
        type: 'Electrical',
        category: 'Service Request',
        requestor: 'Jane Smith',
        assignee: 'Electrical Team'
      }
    ];
    
    // Add Work Orders
    const workOrders = [
      {
        id: 'wo-001',
        title: 'Monthly HVAC Maintenance',
        location: 'Building A - Rooftop',
        time: '2025-07-09T08:00:00Z',
        status: 'SCHEDULED',
        priority: 'Medium',
        building: 'A',
        description: 'Routine maintenance of HVAC systems',
        eventId: 'WO_HVAC_MAINT_A_20250709',
        type: 'Maintenance',
        category: 'Work Order',
        assignee: 'Maintenance Team',
        estimatedDuration: '4 hours'
      },
      {
        id: 'wo-002',
        title: 'Fire Safety System Check',
        location: 'Building C - All Floors',
        time: '2025-07-10T07:00:00Z',
        status: 'SCHEDULED',
        priority: 'High',
        building: 'C',
        description: 'Quarterly fire safety system inspection',
        eventId: 'WO_FIRE_CHECK_C_20250710',
        type: 'Safety',
        category: 'Work Order',
        assignee: 'Safety Team',
        estimatedDuration: '6 hours'
      }
    ];
    
    // Add Sensor Events
    const sensorEvents = sensors.map(sensor => ({
      id: `sensor-${sensor.id}`,
      title: `${sensor.name} Status Update`,
      location: `${sensor.location} - Floor ${sensor.floor}`,
      time: sensor.lastUpdated,
      status: sensor.status.toUpperCase(),
      priority: sensor.status === 'critical' ? 'High' : sensor.status === 'warning' ? 'Medium' : 'Low',
      building: sensor.location.split(' ')[0],
      description: `${sensor.type} sensor reading: ${sensor.value} ${sensor.unit}`,
      eventId: `SENSOR_${sensor.id}`,
      type: 'Sensor',
      category: 'Sensor Status',
      value: sensor.value,
      unit: sensor.unit
    }));
    
    // Add CCTV Events
    const cctvEvents = cctvCameras.map(camera => ({
      id: `cctv-${camera.id}`,
      title: `${camera.name} Status`,
      location: `${camera.location} - Floor ${camera.floor}`,
      time: camera.lastActivity,
      status: camera.status.toUpperCase(),
      priority: camera.status === 'offline' ? 'High' : 'Low',
      building: camera.location.split(' ')[0],
      description: `CCTV camera ${camera.status} - ${camera.resolution}`,
      eventId: `CCTV_${camera.id}`,
      type: 'Security',
      category: 'Security Dashboard',
      isRecording: camera.isRecording
    }));
    
    // Add Gas Sensor Events
    const gasEvents = toxicGasSensors.map(gas => ({
      id: `gas-${gas.id}`,
      title: `${gas.name} Gas Level Alert`,
      location: `${gas.location} - Floor ${gas.floor}`,
      time: gas.lastUpdated,
      status: gas.status.toUpperCase(),
      priority: gas.status === 'critical' || gas.status === 'danger' ? 'High' : gas.status === 'warning' ? 'Medium' : 'Low',
      building: gas.location.split(' ')[0],
      description: `${gas.type.toUpperCase()} level: ${gas.value} ${gas.unit}`,
      eventId: `GAS_${gas.id}`,
      type: 'Gas Monitor',
      category: 'Environmental',
      value: gas.value,
      unit: gas.unit,
      threshold: gas.threshold
    }));
    
    // Add Smart Watch Events
    const watchEvents = smartWatches.map(watch => ({
      id: `watch-${watch.id}`,
      title: `${watch.name} Health Data`,
      location: watch.location,
      time: watch.lastSync,
      status: watch.status.toUpperCase(),
      priority: watch.status === 'disconnected' ? 'Medium' : 'Low',
      building: watch.location.split(' ')[0],
      description: `Heart rate: ${watch.heartRate} BPM, Steps: ${watch.steps}`,
      eventId: `WATCH_${watch.id}`,
      type: 'Health',
      category: 'Smart Watch',
      heartRate: watch.heartRate,
      steps: watch.steps,
      batteryLevel: watch.batteryLevel
    }));
    
    // Combine all events
    allEvents.push(...alarms, ...predictive, ...serviceRequests, ...workOrders, ...sensorEvents, ...cctvEvents, ...gasEvents, ...watchEvents);
    
    // Apply filters
    let filteredEvents = allEvents;
    
    if (eventTypeFilter !== 'All') {
      filteredEvents = filteredEvents.filter(event => event.category === eventTypeFilter);
    }
    
    if (priorityFilter !== 'All') {
      filteredEvents = filteredEvents.filter(event => event.priority === priorityFilter);
    }
    
    if (statusFilter !== 'All') {
      filteredEvents = filteredEvents.filter(event => event.status === statusFilter);
    }
    
    if (buildingFilter !== 'All') {
      filteredEvents = filteredEvents.filter(event => event.building === buildingFilter);
    }
    
    // Sort by time (newest first)
    filteredEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    return filteredEvents;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900/20 via-slate-950/15 to-black/30 relative overflow-hidden">
      {/* UI Layer - Above 3D Viewer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top Header Bar - Solid Style */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-600/30 h-12">
          <div className="flex items-center justify-between px-4 h-full">
            {/* Left Section - Back Button and Date/Time */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="flex items-center gap-2 bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg px-3 py-1.5 text-slate-100 hover:text-white transition-all shadow-lg backdrop-blur-sm pointer-events-auto"
              >
                <RiArrowGoBackLine className="text-sm" />
                <span className="text-xs font-medium">Back</span>
              </motion.button>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xs">UAT</span>
                </div>
                <div>
                  <div className="text-slate-100 font-bold text-xs">
                    {currentTime.toLocaleDateString('en-US', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      weekday: 'short' 
                    })} {currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="text-slate-300 text-xs">28°C | 72%</div>
                </div>
              </div>
            </div>
            
            {/* Center Section - Connection Status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">PQM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">Chiller</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">AHU</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">AFA</span>
                  </div>
            </div>
            
            {/* Right Section - System Controls */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 text-slate-400 hover:text-white transition-colors pointer-events-auto"
                >
                  <RiBellLine className="w-4 h-4" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-slate-600/30 shadow-2xl z-50"
                    >
                      <div className="p-3 border-b border-slate-600/30">
                        <h3 className="text-white font-medium text-sm">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {[
                          {
                            id: 1,
                            type: 'R/F ES1',
                            title: 'BMS:ES1_BM_RM19_VENT_TRI',
                            location: 'ES1.BMS.URGENT',
                            description: 'HVAC ventilation system triggered alarm',
                            time: '3 min ago',
                            status: 'NOT ACKNOWLEDGED',
                            priority: 'urgent'
                          },
                          {
                            id: 2,
                            type: 'CH_BMS_NEW',
                            title: 'CH_BMS_B3F_FlushTank_Low',
                            location: 'CH.BMS.URGENT',
                            description: 'Flush tank water level critically low',
                            time: '8 min ago',
                            status: 'NOT ACKNOWLEDGED',
                            priority: 'urgent'
                          },
                          {
                            id: 3,
                            type: 'ES3_BMS',
                            title: 'NiagaraNetwork',
                            location: 'ES3.DDC.BF_01_05',
                            description: 'Network connectivity issue detected',
                            time: '1 hour ago',
                            status: 'ACKNOWLEDGED',
                            priority: 'warning'
                          }
                        ].map((notification) => (
                          <div 
                            key={notification.id}
                            className="p-3 border-b border-slate-600/20 hover:bg-slate-800/30 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedEvent(notification);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1 ${notification.priority === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-orange-300 text-xs font-medium">{notification.type}</span>
                                  <span className="text-slate-400 text-xs">{notification.time}</span>
                                </div>
                                <div className="text-white text-sm font-medium truncate">{notification.title}</div>
                                <div className="text-slate-400 text-xs">{notification.location}</div>
                                <div className="text-slate-300 text-xs mt-1">{notification.description}</div>
                                <div className="mt-2">
                                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                                    notification.status === 'NOT ACKNOWLEDGED' 
                                      ? 'bg-red-600 text-white' 
                                      : 'bg-gray-600 text-gray-300'
                                  }`}>
                                    {notification.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* System Dropdown */}
              <select className="bg-slate-700/30 border border-slate-500/20 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500/50 text-sm">
                <option>System</option>
                <option>HVAC</option>
                <option>Lighting</option>
                <option>Security</option>
              </select>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg p-2 text-slate-100 hover:text-white transition-all">
                  <RiSettings3Line className="text-lg" />
                </button>
                <button className="bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg p-2 text-slate-100 hover:text-white transition-all">
                  <RiRefreshLine className="text-lg" />
                </button>
                <button className="bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg p-2 text-slate-100 hover:text-white transition-all">
                  <RiFullscreenLine className="text-lg" />
                </button>
                <button className="bg-slate-700/30 hover:bg-slate-600/40 border border-slate-500/20 rounded-lg p-2 text-slate-100 hover:text-white transition-all">
                  <RiMoreLine className="text-lg" />
                </button>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center gap-2 bg-slate-700/30 border border-slate-500/20 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <span className="text-slate-100 text-sm font-medium">Admin</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full flex" style={{ top: '48px', position: 'absolute', left: 0, right: 0, bottom: 0 }}>
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
                {/* Resize Handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full bg-slate-600/50 hover:bg-blue-500/70 cursor-col-resize transition-colors z-10"
                  onMouseDown={(e) => handleResizeStart(e, 'left')}
                />
                
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-600/20 flex-shrink-0 bg-slate-800/10 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <RiCalendarEventLine className="text-blue-400 text-xl" />
                      <h2 className="text-slate-100 font-bold text-lg">Event Panel</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowFullEventPanel(true)}
                        className="text-slate-400 hover:text-blue-400 transition-colors"
                        title="Open Full Event Analysis"
                      >
                        <RiExpandDiagonalLine className="text-lg" />
                      </button>
                    <button
                      onClick={() => setLeftPanelVisible(false)}
                      className="text-slate-200 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="text-xl" />
                    </button>
                  </div>
                  </div>
                  
                  {/* Event Summary Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-2 border border-slate-600/20">
                      <div className="text-slate-100 font-bold text-lg">128</div>
                      <div className="text-slate-300 text-xs">All</div>
                    </div>
                    <div className="bg-red-900/30 backdrop-blur-sm rounded-lg p-2 border border-red-500/20">
                      <div className="text-red-400 font-bold text-lg">14</div>
                      <div className="text-red-300 text-xs">Alarm</div>
                    </div>
                    <div className="bg-orange-900/30 backdrop-blur-sm rounded-lg p-2 border border-orange-500/20">
                      <div className="text-orange-400 font-bold text-lg">23</div>
                      <div className="text-orange-300 text-xs">Warning</div>
                    </div>
                    <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-2 border border-blue-500/20">
                      <div className="text-blue-400 font-bold text-lg">91</div>
                      <div className="text-blue-300 text-xs">Info</div>
                    </div>
                  </div>
                  
                  {/* Timeline Filter */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <RiTimeLine className="text-slate-400" />
                      <span className="text-slate-200 text-sm font-medium">Timeline Filter</span>
                    </div>
                    <div className="flex gap-2">
                      {['Today', 'Week', 'Month'].map((period) => (
                        <button 
                          key={period}
                          onClick={() => setTimelineFilter(period)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            timelineFilter === period
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700/30 text-slate-100 hover:bg-slate-600/40 border border-slate-500/20'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Event Type Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    {['All Events', 'Alarms', 'Predictive', 'Service Request', 'Work Order', 'Sensor Status', 'Security Dashboard', 'Environmental Controls', 'Building Analytics'].map((tab) => (
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
                
                {/* Content - Made scrollable */}
                <div className="flex-1 overflow-y-auto bg-slate-900/10 backdrop-blur-md">
                  <div className="p-4">
                    {activeLeftTab === 'All Events' && (
                    <div className="space-y-4">
                        {/* Comprehensive Filter Section */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                            <RiFilterLine className="text-blue-400" />
                            Event Filters
                        </h3>
                          
                          {/* Filter Controls */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Event Type Filter */}
                            <div>
                              <label className="text-slate-300 text-xs mb-1 block">Event Type</label>
                              <select
                                value={eventTypeFilter}
                                onChange={(e) => setEventTypeFilter(e.target.value)}
                                className="w-full bg-slate-700/40 border border-slate-600/30 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500/50"
                              >
                                <option value="All">All Types</option>
                                <option value="Alarms">Alarms</option>
                                <option value="Predictive">Predictive</option>
                                <option value="Service Request">Service Request</option>
                                <option value="Work Order">Work Order</option>
                                <option value="Sensor Status">Sensor Status</option>
                                <option value="Security Dashboard">Security</option>
                                <option value="Environmental">Environmental</option>
                                <option value="Smart Watch">Smart Watch</option>
                              </select>
                          </div>
                            
                            {/* Priority Filter */}
                            <div>
                              <label className="text-slate-300 text-xs mb-1 block">Priority</label>
                              <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full bg-slate-700/40 border border-slate-600/30 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500/50"
                              >
                                <option value="All">All Priorities</option>
                                <option value="Urgent">Urgent</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </div>
                            
                            {/* Status Filter */}
                            <div>
                              <label className="text-slate-300 text-xs mb-1 block">Status</label>
                              <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full bg-slate-700/40 border border-slate-600/30 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500/50"
                              >
                                <option value="All">All Status</option>
                                <option value="NOT ACKNOWLEDGED">Not Acknowledged</option>
                                <option value="IN PROGRESS">In Progress</option>
                                <option value="PENDING">Pending</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="PREDICTED">Predicted</option>
                                <option value="CLOSED">Closed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ONLINE">Online</option>
                                <option value="OFFLINE">Offline</option>
                              </select>
                          </div>
                            
                            {/* Building Filter */}
                            <div>
                              <label className="text-slate-300 text-xs mb-1 block">Building</label>
                              <select
                                value={buildingFilter}
                                onChange={(e) => setBuildingFilter(e.target.value)}
                                className="w-full bg-slate-700/40 border border-slate-600/30 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-blue-500/50"
                              >
                                <option value="All">All Buildings</option>
                                <option value="A">Building A</option>
                                <option value="B">Building B</option>
                                <option value="C">Building C</option>
                                <option value="E2">Building E2</option>
                                <option value="E3">Building E3</option>
                                <option value="CH">Building CH</option>
                              </select>
                          </div>
                          </div>
                          
                          {/* Clear Filters Button */}
                          <button
                            onClick={() => {
                              setEventTypeFilter('All');
                              setPriorityFilter('All');
                              setStatusFilter('All');
                              setBuildingFilter('All');
                            }}
                            className="mt-3 px-4 py-2 bg-slate-600/50 hover:bg-slate-600/70 text-slate-100 rounded-lg text-sm transition-colors"
                          >
                            Clear All Filters
                          </button>
                      </div>

                        {/* Events Summary Stats */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                          <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                            <RiDashboardLine className="text-cyan-400" />
                            Events Overview
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-r from-blue-600/80 to-cyan-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                              <div className="text-blue-100 text-sm">Total Events</div>
                              <div className="text-white font-bold text-xl">{getAllCombinedEvents().length}</div>
                              <div className="text-blue-200 text-xs">All Systems</div>
                            </div>
                            <div className="bg-gradient-to-r from-red-600/80 to-orange-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                              <div className="text-red-100 text-sm">Critical Events</div>
                              <div className="text-white font-bold text-xl">
                                {getAllCombinedEvents().filter(e => e.priority === 'Urgent' || e.priority === 'High').length}
                          </div>
                              <div className="text-red-200 text-xs">Needs Attention</div>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-600/80 to-amber-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                              <div className="text-yellow-100 text-sm">Pending Actions</div>
                              <div className="text-white font-bold text-xl">
                                {getAllCombinedEvents().filter(e => e.status === 'NOT ACKNOWLEDGED' || e.status === 'PENDING' || e.status === 'IN PROGRESS').length}
                          </div>
                              <div className="text-yellow-200 text-xs">Active Items</div>
                            </div>
                            <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 rounded-xl p-3 shadow-lg backdrop-blur-sm">
                              <div className="text-green-100 text-sm">Resolved</div>
                              <div className="text-white font-bold text-xl">
                                {getAllCombinedEvents().filter(e => e.status === 'CLOSED' || e.status === 'COMPLETED').length}
                          </div>
                              <div className="text-green-200 text-xs">Completed</div>
                          </div>
                        </div>
                      </div>

                        {/* All Events List - Scrollable */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                          <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                            <RiCalendarEventLine className="text-blue-400" />
                            All Events ({getAllCombinedEvents().length})
                          </h3>
                          
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {getAllCombinedEvents().map((event) => (
                              <div 
                                key={event.id}
                                className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-blue-500/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedEvent(event)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      event.priority === 'Urgent' ? 'bg-red-500' :
                                      event.priority === 'High' ? 'bg-orange-500' :
                                      event.priority === 'Medium' ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }`}></div>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                      event.category === 'Alarms' ? 'bg-red-600 text-white' :
                                      event.category === 'Predictive' ? 'bg-purple-600 text-white' :
                                      event.category === 'Service Request' ? 'bg-blue-600 text-white' :
                                      event.category === 'Work Order' ? 'bg-green-600 text-white' :
                                      event.category === 'Sensor Status' ? 'bg-cyan-600 text-white' :
                                      event.category === 'Security Dashboard' ? 'bg-red-600 text-white' :
                                      event.category === 'Environmental' ? 'bg-orange-600 text-white' :
                                      'bg-slate-600 text-white'
                                    }`}>
                                      {event.category}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                                      event.status === 'NOT ACKNOWLEDGED' ? 'bg-red-500 text-white' :
                                      event.status === 'IN PROGRESS' ? 'bg-yellow-500 text-black' :
                                      event.status === 'PENDING' ? 'bg-orange-500 text-white' :
                                      event.status === 'SCHEDULED' ? 'bg-blue-500 text-white' :
                                      event.status === 'PREDICTED' ? 'bg-purple-500 text-white' :
                                      event.status === 'CLOSED' || event.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                                      'bg-slate-500 text-white'
                                    }`}>
                                      {event.status}
                                    </span>
                                  </div>
                                  <div className="text-slate-400 text-xs">
                                    {new Date(event.time).toLocaleString()}
                        </div>
                      </div>

                                <div className="mb-2">
                                  <div className="text-slate-100 font-medium text-sm mb-1">{event.title}</div>
                                  <div className="text-slate-300 text-xs">{event.description}</div>
                      </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="text-slate-400 text-xs">
                                      <span className="font-medium">Location:</span> {event.location}
                              </div>
                                    <div className="text-slate-400 text-xs">
                                      <span className="font-medium">Building:</span> {event.building}
                            </div>
                              </div>
                                  <div className="text-slate-400 text-xs">
                                    Priority: <span className={`font-medium ${
                                      event.priority === 'Urgent' ? 'text-red-400' :
                                      event.priority === 'High' ? 'text-orange-400' :
                                      event.priority === 'Medium' ? 'text-yellow-400' :
                                      'text-green-400'
                                    }`}>{event.priority}</span>
                                  </div>
                                </div>
                            </div>
                          ))}
                            
                            {getAllCombinedEvents().length === 0 && (
                              <div className="text-center py-8 text-slate-400">
                                <RiSearchLine className="text-4xl mx-auto mb-2 opacity-50" />
                                <p>No events found matching the selected filters.</p>
                              </div>
                            )}
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
                  
                  {activeLeftTab === 'Alarms' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-red-400 font-medium">Active Alarms</h3>
                        <div className="text-slate-400 text-sm">Total: 14</div>
                      </div>
                      
                      {/* Critical Alarms */}
                      <div className="space-y-2">
                        {[
                          {
                            id: 'alarm-001',
                            title: 'R/F ES1 BMS:ES1_BM_RM19_VENT_TRI',
                            location: 'ES1.BMS.URGENT',
                            time: '2025-07-08T11:14:00Z',
                            status: 'NOT ACKNOWLEDGED',
                            priority: 'Urgent',
                            building: 'E2',
                            description: 'HVAC ventilation system triggered alarm',
                            eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518',
                            type: 'R/F'
                          },
                          {
                            id: 'alarm-002',
                            title: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm',
                            location: 'CH.BMS.URGENT',
                            time: '2025-07-08T11:03:00Z',
                            status: 'CLOSED',
                            priority: 'Urgent',
                            building: 'CH',
                            description: 'Flush tank water level critically low',
                            eventId: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm_175185743',
                            type: 'B3/F'
                          },
                          {
                            id: 'alarm-003',
                            title: 'ES3_BMS:NiagaraNetwork',
                            location: 'ES3.DDC.BF_01_05',
                            time: '2025-07-08T11:02:00Z',
                            status: 'CLOSED',
                            priority: 'Urgent',
                            building: 'E3',
                            description: 'Network connectivity issue detected',
                            eventId: 'ES3_BMS:NiagaraNetwork_ES3_DDC_BF_01_05_175185732',
                            type: 'R/F'
                          }
                        ].map((alarm) => (
                          <div 
                            key={alarm.id}
                            className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-red-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedEvent(alarm)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${alarm.status === 'NOT ACKNOWLEDGED' ? 'bg-red-500 animate-pulse' : 'bg-red-600'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-red-300 font-medium text-sm break-words">{alarm.title}</div>
                                  <div className="text-slate-300 text-xs break-words">{alarm.location}</div>
                                  <div className="text-slate-400 text-xs mt-1 break-words">{alarm.description}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-slate-100 text-xs">{new Date(alarm.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-slate-400 text-xs">Jul 8</div>
                                <div className={`text-xs px-2 py-1 rounded mt-1 whitespace-nowrap ${alarm.status === 'NOT ACKNOWLEDGED' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                  {alarm.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeLeftTab === 'Predictive' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-purple-400 font-medium">Predictive Analytics</h3>
                        <div className="text-slate-400 text-sm">Predictions: 8</div>
                      </div>
                      
                      {/* Predictive Maintenance Alerts */}
                      <div className="space-y-2">
                        {[
                          {
                            id: 'pred-001',
                            title: 'HVAC Filter Replacement Due',
                            location: 'Building A - AHU-01',
                            time: '2025-07-10T09:00:00Z',
                            status: 'PREDICTED',
                            priority: 'Medium',
                            building: 'A',
                            description: 'AI analysis indicates filter efficiency dropping below 85%',
                            eventId: 'PRED_HVAC_FILTER_AHU01_20250710',
                            type: 'Maintenance',
                            category: 'Predictive',
                            confidence: '94%'
                          },
                          {
                            id: 'pred-002',
                            title: 'Pump Bearing Wear Detection',
                            location: 'Building B - Pump Room',
                            time: '2025-07-12T14:30:00Z',
                            status: 'PREDICTED',
                            priority: 'High',
                            building: 'B',
                            description: 'Vibration analysis shows bearing wear pattern',
                            eventId: 'PRED_PUMP_BEARING_B01_20250712',
                            type: 'Critical',
                            category: 'Predictive',
                            confidence: '87%'
                          },
                          {
                            id: 'pred-003',
                            title: 'Elevator Cable Inspection Due',
                            location: 'Building C - Elevator 3',
                            time: '2025-07-15T11:00:00Z',
                            status: 'SCHEDULED',
                            priority: 'Medium',
                            building: 'C',
                            description: 'Usage pattern analysis suggests early inspection',
                            eventId: 'PRED_ELEVATOR_CABLE_C03_20250715',
                            type: 'Inspection',
                            category: 'Predictive',
                            confidence: '91%'
                          }
                        ].map((pred) => (
                          <div 
                            key={pred.id}
                            className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-purple-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedEvent(pred)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-purple-300 font-medium text-sm">{pred.title}</div>
                                  <div className="text-slate-300 text-xs">{pred.location}</div>
                                  <div className="text-slate-400 text-xs mt-1">{pred.description}</div>
                                  <div className="text-purple-200 text-xs mt-1">Confidence: {pred.confidence}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-slate-100 text-xs">{new Date(pred.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                <div className="text-slate-400 text-xs">{new Date(pred.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className={`text-xs px-2 py-1 rounded mt-1 ${pred.priority === 'High' ? 'bg-orange-600 text-white' : 'bg-purple-600 text-white'}`}>
                                  {pred.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLeftTab === 'Service Request' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-blue-400 font-medium">Service Requests</h3>
                        <div className="text-slate-400 text-sm">Open: 12</div>
                      </div>
                      
                      {/* Service Requests */}
                      <div className="space-y-2">
                        {[
                          {
                            id: 'sr-001',
                            title: 'Air Conditioning Repair',
                            location: 'Building A - Floor 15',
                            time: '2025-07-08T09:30:00Z',
                            status: 'IN PROGRESS',
                            priority: 'High',
                            building: 'A',
                            description: 'AC unit not cooling properly in conference room',
                            eventId: 'SR_AC_REPAIR_A15_20250708',
                            type: 'Repair',
                            requestor: 'John Smith',
                            assignee: 'HVAC Team'
                          },
                          {
                            id: 'sr-002',
                            title: 'Lighting Fixture Replacement',
                            location: 'Building B - Corridor 8',
                            time: '2025-07-08T10:15:00Z',
                            status: 'NEW',
                            priority: 'Medium',
                            building: 'B',
                            description: 'Fluorescent lights flickering in main corridor',
                            eventId: 'SR_LIGHT_REPLACE_B08_20250708',
                            type: 'Maintenance',
                            requestor: 'Sarah Johnson',
                            assignee: 'Electrical Team'
                          },
                          {
                            id: 'sr-003',
                            title: 'Plumbing Leak Fix',
                            location: 'Building C - Restroom 3F',
                            time: '2025-07-08T08:45:00Z',
                            status: 'COMPLETED',
                            priority: 'High',
                            building: 'C',
                            description: 'Water leak detected under sink',
                            eventId: 'SR_PLUMB_LEAK_C03_20250708',
                            type: 'Emergency',
                            requestor: 'Mike Wilson',
                            assignee: 'Plumbing Team'
                          }
                        ].map((sr) => (
                          <div 
                            key={sr.id}
                            className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-blue-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedEvent(sr)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${sr.status === 'IN PROGRESS' ? 'bg-yellow-500 animate-pulse' : sr.status === 'NEW' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                <div className="flex-1">
                                  <div className="text-blue-300 font-medium text-sm">{sr.title}</div>
                                  <div className="text-slate-300 text-xs">{sr.location}</div>
                                  <div className="text-slate-400 text-xs mt-1">{sr.description}</div>
                                  <div className="text-blue-200 text-xs mt-1">Assigned to: {sr.assignee}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-slate-100 text-xs">{new Date(sr.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-slate-400 text-xs">Jul 8</div>
                                <div className={`text-xs px-2 py-1 rounded mt-1 ${sr.status === 'IN PROGRESS' ? 'bg-yellow-600 text-white' : sr.status === 'NEW' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                  {sr.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLeftTab === 'Work Order' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-green-400 font-medium">Work Orders</h3>
                        <div className="text-slate-400 text-sm">Active: 18</div>
                      </div>
                      
                      {/* Work Orders */}
                      <div className="space-y-2">
                        {[
                          {
                            id: 'wo-001',
                            title: 'Monthly HVAC Maintenance',
                            location: 'Building A - Rooftop',
                            time: '2025-07-08T07:00:00Z',
                            status: 'IN PROGRESS',
                            priority: 'Medium',
                            building: 'A',
                            description: 'Routine monthly maintenance of HVAC systems',
                            eventId: 'WO_HVAC_MAINT_A_20250708',
                            type: 'Preventive',
                            requestor: 'System Auto',
                            assignee: 'HVAC Team',
                            estimatedHours: '4h'
                          },
                          {
                            id: 'wo-002',
                            title: 'Fire Safety System Check',
                            location: 'Building B - All Floors',
                            time: '2025-07-08T14:00:00Z',
                            status: 'SCHEDULED',
                            priority: 'High',
                            building: 'B',
                            description: 'Quarterly fire safety system inspection',
                            eventId: 'WO_FIRE_CHECK_B_20250708',
                            type: 'Safety',
                            requestor: 'Safety Officer',
                            assignee: 'Fire Safety Team',
                            estimatedHours: '6h'
                          },
                          {
                            id: 'wo-003',
                            title: 'Elevator Maintenance',
                            location: 'Building C - Elevator 1',
                            time: '2025-07-08T06:00:00Z',
                            status: 'COMPLETED',
                            priority: 'Medium',
                            building: 'C',
                            description: 'Monthly elevator maintenance and inspection',
                            eventId: 'WO_ELEVATOR_MAINT_C1_20250708',
                            type: 'Preventive',
                            requestor: 'Facilities',
                            assignee: 'Elevator Team',
                            estimatedHours: '3h'
                          }
                        ].map((wo) => (
                          <div 
                            key={wo.id}
                            className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-green-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedEvent(wo)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${wo.status === 'IN PROGRESS' ? 'bg-yellow-500 animate-pulse' : wo.status === 'SCHEDULED' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                <div className="flex-1">
                                  <div className="text-green-300 font-medium text-sm">{wo.title}</div>
                                  <div className="text-slate-300 text-xs">{wo.location}</div>
                                  <div className="text-slate-400 text-xs mt-1">{wo.description}</div>
                                  <div className="text-green-200 text-xs mt-1">Team: {wo.assignee} | Est: {wo.estimatedHours}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-slate-100 text-xs">{new Date(wo.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-slate-400 text-xs">Jul 8</div>
                                <div className={`text-xs px-2 py-1 rounded mt-1 ${wo.status === 'IN PROGRESS' ? 'bg-yellow-600 text-white' : wo.status === 'SCHEDULED' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                  {wo.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                   
                    <button 
                      onClick={() => setRightPanelVisible(false)}
                      className="text-slate-200 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="text-xl" />
                    </button>
                  </div>
                  
                  {/* Work Order Overview Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-2 border border-slate-600/20 text-center">
                      <div className="text-slate-100 font-bold text-lg">0</div>
                      <div className="text-slate-300 text-xs">In Progress</div>
                    </div>
                    <div className="bg-orange-900/30 backdrop-blur-sm rounded-lg p-2 border border-orange-500/20 text-center">
                      <div className="text-orange-400 font-bold text-lg">0</div>
                      <div className="text-orange-300 text-xs">Pending for Action</div>
                    </div>
                    <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-2 border border-blue-500/20 text-center">
                      <div className="text-blue-400 font-bold text-lg">0</div>
                      <div className="text-blue-300 text-xs">Pending for Closure</div>
                    </div>
                    <div className="bg-green-900/30 backdrop-blur-sm rounded-lg p-2 border border-green-500/20 text-center">
                      <div className="text-green-400 font-bold text-lg">0</div>
                      <div className="text-green-300 text-xs">Completed</div>
                    </div>
                  </div>
                  
                  {/* Tab Navigation */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'overview', name: 'Overview', icon: RiDashboardLine },
                      { id: 'smartwatch', name: 'Smart Watch', icon: RiTimeLine },
                      { id: 'smartlock', name: 'Smart Lock', icon: RiDoorLockLine },
                      { id: 'cctv', name: 'CCTV', icon: RiCameraLine },
                      { id: 'toxicgas', name: 'Gas Monitor', icon: RiAlarmWarningLine },
                      { id: 'weather', name: 'Weather', icon: RiCloudyLine },
                      ...(rightPanelVisible ? [{ id: 'asset', name: 'Asset Info', icon: RiInformationLine }] : [])
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
                <div className="flex-1 overflow-y-auto">
                  {/* Overview Tab */}
                  {activeRightTab === 'overview' && (
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
                      {/* Work Order Distribution Chart */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiPieChartLine className="text-blue-400" />
                          Work Order Distribution (Last 30 Days)
                        </h3>
                        <div className="flex items-center justify-center h-48">
                          <div className="relative">
                            {/* Pie Chart Placeholder */}
                            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">100%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-300 text-sm">HVAC (40%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-slate-300 text-sm">Electrical (25%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                            <span className="text-slate-300 text-sm">Plumbing (20%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-slate-300 text-sm">Others (15%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Asset Information */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiInformationLine className="text-green-400" />
                          Asset Information
                        </h3>
                        <div className="space-y-3">
                          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-200 font-medium">ES1-LIFT-L18</span>
                              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">ON</span>
                            </div>
                            <div className="text-slate-300 text-sm">E1-LIFT2_4-LIFT_18</div>
                          </div>
                          <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-200 font-medium">Lift & Escalator</span>
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">ACTIVE</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <div className="text-slate-400 text-xs">Passenger Lift</div>
                                <div className="text-slate-100 font-bold">5</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Service Lift</div>
                                <div className="text-slate-100 font-bold">2</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">Escalator</div>
                                <div className="text-slate-100 font-bold">3</div>
                              </div>
                              <div>
                                <div className="text-slate-400 text-xs">VIP Shuttle Lift</div>
                                <div className="text-slate-100 font-bold">1</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overall Asset Availability */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiBarChartBoxLine className="text-yellow-400" />
                          Overall Asset Availability
                        </h3>
                        <div className="text-center mb-4">
                          <div className="text-4xl font-bold text-yellow-400 mb-2">100%</div>
                          <div className="text-slate-300 text-sm">Consider Maintenance Downtime (From Maxime)</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Electrical</span>
                            <span className="text-green-400">100%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Plumbing & Drainage</span>
                            <span className="text-green-400">100%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">HVAC</span>
                            <span className="text-green-400">100%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Lift & Escalator</span>
                            <span className="text-green-400">100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRightTab === 'smartlock' && (
                    <div className="h-full overflow-y-auto">
                      <SmartLockDashboard />
                    </div>
                  )}
                  
                  {activeRightTab === 'cctv' && (
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
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
                      
                      {/* Camera List - Scrollable */}
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3">Camera Feed</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cctvCameras.map((camera) => (
                            <div
                              key={camera.id}
                              className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 border border-slate-600/20 hover:border-blue-500/30 transition-colors cursor-pointer"
                              onClick={() => setSelectedCamera(camera)}
                            >
                              <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)}`}></div>
                                  <span className="text-slate-100 font-medium text-sm">{camera.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                  {camera.isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    camera.status === 'online' ? 'bg-green-600 text-white' :
                                    camera.status === 'recording' ? 'bg-red-600 text-white' :
                                    camera.status === 'offline' ? 'bg-red-600 text-white' :
                                    'bg-yellow-600 text-white'
                                  }`}>
                                    {camera.status.toUpperCase()}
                                  </span>
                            </div>
                          </div>
                              <div className="text-slate-300 text-xs mb-1">{camera.location} - Floor {camera.floor}</div>
                              <div className="text-slate-400 text-xs">
                                Resolution: {camera.resolution} | Last Activity: {new Date(camera.lastActivity).toLocaleString()}
                            </div>
                                </div>
                              ))}
                            </div>
                        </div>
                    </div>
                  )}
                  
                  {activeRightTab === 'smartwatch' && (
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
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
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
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
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
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

                  {activeRightTab === 'asset' && (
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
                      <div className="bg-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                        <h3 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                          <RiInformationLine className="text-cyan-400" />
                          Asset Information
                        </h3>
                        
                        {/* Search Bar */}
                        <div className="relative mb-4">
                          <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search assets..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-700/30 border border-slate-600/20 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
                          />
                        </div>
                        
                        {/* Asset Categories */}
                        <div className="space-y-3">
                          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-slate-100 font-medium text-sm">General</h4>
                              <RiExpandDiagonalLine className="text-slate-400 text-sm" />
                            </div>
                            <div className="text-slate-300 text-xs">Building systems and infrastructure</div>
                          </div>
                          
                          <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-slate-100 font-medium text-sm">Documentations</h4>
                              <RiExpandDiagonalLine className="text-slate-400 text-sm" />
                            </div>
                            <div className="text-slate-300 text-xs">Technical manuals and specifications</div>
                          </div>
                          
                          {/* Asset List */}
                          <div className="space-y-2">
                            <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-slate-100 text-sm">ES1-PLIFT-L18</span>
                                </div>
                                <div className="text-green-400 text-xs">ON</div>
                              </div>
                              <div className="text-slate-300 text-xs mt-1">E1-LFTZ_4-LIFT_18</div>
                            </div>
                            
                            <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-slate-100 text-sm">HVAC-AHU-01</span>
                                </div>
                                <div className="text-green-400 text-xs">ON</div>
                              </div>
                              <div className="text-slate-300 text-xs mt-1">Air Handling Unit - Floor 1</div>
                            </div>
                            
                            <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                  <span className="text-slate-100 text-sm">PUMP-WS-02</span>
                                </div>
                                <div className="text-yellow-400 text-xs">MAINTENANCE</div>
                              </div>
                              <div className="text-slate-300 text-xs mt-1">Water Supply Pump - Basement</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Events Button */}
                        <div className="mt-4 pt-4 border-t border-slate-600/20">
                          <button className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all text-sm font-medium">
                            Events
                          </button>
                        </div>
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

        {/* Enhanced Event Detail Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-slate-600/30 shadow-2xl w-96 max-h-[80vh] overflow-hidden pointer-events-auto z-[9999]"
                drag
                dragMomentum={false}
                dragConstraints={{
                  left: -400,
                  right: 400,
                  top: -50,
                  bottom: 300
                }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-600/20 bg-slate-800/20 cursor-move">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-slate-100 font-medium text-sm">Alarm</span>
                    </div>
                    <div className="text-slate-400 text-xs">Details</div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RiCloseLine className="text-lg" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {/* Alert Info */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      <span className="text-red-400 font-medium text-sm">R/F</span>
                      <span className="text-slate-400 text-xs">ES1</span>
                    </div>
                    <div className="text-slate-100 font-medium text-sm mb-1">
                      {selectedEvent.title}
                    </div>
                    <div className="text-slate-400 text-xs mb-2">
                      ES1.BMS.URGENT
                    </div>
                    <div className="text-slate-400 text-xs">
                      {new Date(selectedEvent.time).toLocaleString('en-US', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      selectedEvent.status === 'NOT ACKNOWLEDGED' ? 'bg-red-600 text-white' :
                      selectedEvent.status === 'IN PROGRESS' ? 'bg-yellow-600 text-white' :
                      selectedEvent.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {selectedEvent.status}
                    </span>
                  </div>

                  {/* Remarks Section */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Please leave remarks here..."
                      className="w-full p-3 bg-slate-800/30 border border-slate-600/20 rounded text-slate-100 placeholder-slate-400 text-sm resize-none focus:outline-none focus:border-blue-500/50"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button className="px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition-colors">
                        Submit
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button 
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        // Handle create work order
                        console.log('Create Work Order clicked');
                      }}
                    >
                      Create Work Order
                    </button>
                    <button 
                      className="w-full px-3 py-2 bg-slate-700 text-slate-100 rounded text-sm hover:bg-slate-600 transition-colors"
                      onClick={() => {
                        // Handle asset information
                        console.log('Asset Information clicked');
                      }}
                    >
                      Asset Information
                    </button>
                    <button 
                      className="w-full px-3 py-2 bg-slate-700 text-slate-100 rounded text-sm hover:bg-slate-600 transition-colors"
                      onClick={() => {
                        // Handle surrounding events
                        console.log('Surrounding Events clicked');
                      }}
                    >
                      Surrounding Events
                    </button>
                    {selectedEvent.status === 'NOT ACKNOWLEDGED' && (
                      <button 
                        className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        onClick={() => {
                          // Handle acknowledge
                          console.log('Acknowledge clicked');
                        }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Event Panel Modal */}
        <AnimatePresence>
          {showFullEventPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto"
              onClick={() => setShowFullEventPanel(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl w-[95vw] h-[90vh] overflow-hidden relative z-[10000]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Full Panel Header */}
                <div className="p-6 border-b border-slate-600/20 bg-slate-800/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <RiBarChartBoxLine className="text-blue-400 text-2xl" />
                      <div>
                        <h2 className="text-slate-100 font-bold text-2xl">Events Summary</h2>
                        <div className="text-slate-400 text-sm">Total Events: 1872 | Current Period: 07-Jul-25 11:45:23</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        onClick={() => {
                          console.log('Export clicked');
                          // Handle export functionality
                        }}
                      >
                        EXPORT
                      </button>
                      <button
                        onClick={() => setShowFullEventPanel(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <RiCloseLine className="text-2xl" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full Panel Content */}
                <div className="p-6 h-full overflow-y-auto">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/20">
                      <div className="text-slate-400 text-sm">Total</div>
                      <div className="text-slate-100 font-bold text-2xl">1872</div>
                      <div className="text-slate-400 text-xs">Current Period</div>
                    </div>
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/20">
                      <div className="text-slate-400 text-sm">Severity Summary</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-slate-100 font-bold text-xl">1871</div>
                        <div className="text-yellow-400 text-sm">⚠ Action</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-slate-100 font-bold text-xl">1</div>
                        <div className="text-blue-400 text-sm">📢 Notification</div>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/20">
                      <div className="text-slate-400 text-sm">Status Summary</div>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div className="text-center">
                          <div className="text-slate-100 font-bold">84</div>
                          <div className="text-xs text-slate-400">New</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-100 font-bold">218</div>
                          <div className="text-xs text-slate-400">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-slate-100 font-bold">1570</div>
                          <div className="text-xs text-slate-400">Completed</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/20">
                      <div className="text-slate-400 text-sm">Actions</div>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            console.log('Action clicked');
                            // Handle action functionality
                          }}
                        >
                          ACTION
                        </button>
                        <button 
                          className="px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition-colors"
                          onClick={() => {
                            console.log('Reset clicked');
                            // Handle reset functionality
                          }}
                        >
                          RESET
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Date Range and Filters */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <RiCalendarEventLine className="text-slate-400" />
                        <span className="text-slate-400 text-sm">30 Jun 25</span>
                        <span className="text-slate-400">—</span>
                        <span className="text-slate-400 text-sm">07 Jul 25</span>
                      </div>
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Reset date range clicked');
                          // Handle reset functionality
                        }}
                      >
                        RESET
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Filter presets clicked');
                          // Handle filter presets
                        }}
                      >
                        FILTER PRESETS
                      </button>
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Case clicked');
                          // Handle case functionality
                        }}
                      >
                        CASE
                      </button>
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Sort by clicked');
                          // Handle sort functionality
                        }}
                      >
                        SORT BY
                      </button>
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Filter clicked');
                          // Handle filter functionality
                        }}
                      >
                        FILTER
                      </button>
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('View completed clicked');
                          // Handle view completed functionality
                        }}
                      >
                        VIEW COMPLETED NOTIFY ME WO
                      </button>
                    </div>
                  </div>

                  {/* Events Table */}
                  <div className="bg-slate-800/20 backdrop-blur-sm rounded-lg border border-slate-600/20 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-700/30 border-b border-slate-600/20">
                          <tr>
                            <th className="text-left p-3 text-slate-300 font-medium">Building</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Event Type</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Priority</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Event Time / Permit Start</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Location</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Event ID</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Last Updated Time</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Time Spent</th>
                            <th className="text-left p-3 text-slate-300 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              building: 'E2',
                              eventType: 'ALARM',
                              status: 'ACKNOWLEDGED',
                              priority: 'Urgent',
                              eventTime: '07-Jul-2025 11:11:14 AM',
                              location: 'B/F',
                              eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518 57874988',
                              lastUpdated: '07-Jul-2025 11:19:22 AM',
                              timeSpent: 'N/A',
                              description: 'ES2_BMS:ES2_BM_RM19_VENT_TRI'
                            },
                            {
                              building: 'E2',
                              eventType: 'ALARM',
                              status: 'CLOSED',
                              priority: 'Urgent',
                              eventTime: '07-Jul-2025 11:10:35 AM',
                              location: 'B/F',
                              eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518 57835746',
                              lastUpdated: '07-Jul-2025 11:19:22 AM',
                              timeSpent: '0:8:46',
                              description: 'ES2_BMS:ES2_BM_RM19_VENT_TRI'
                            },
                            {
                              building: 'E2',
                              eventType: 'ALARM',
                              status: 'CLOSED',
                              priority: 'Urgent',
                              eventTime: '07-Jul-2025 11:10:04 AM',
                              location: 'B/F',
                              eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518 57800729',
                              lastUpdated: '07-Jul-2025 11:19:22 AM',
                              timeSpent: '0:9:17',
                              description: 'ES2_BMS:ES2_BM_RM19_VENT_TRI'
                            },
                            {
                              building: 'E2',
                              eventType: 'ALARM',
                              status: 'CLOSED',
                              priority: 'Urgent',
                              eventTime: '07-Jul-2025 11:09:18 AM',
                              location: 'B/F',
                              eventId: 'ES2_BMS:ES2_BM_RM19_VENT_TRI_17518 57758670',
                              lastUpdated: '07-Jul-2025 11:19:22 AM',
                              timeSpent: '0:10:3',
                              description: 'ES2_BMS:ES2_BM_RM19_VENT_TRI'
                            },
                            {
                              building: 'CH',
                              eventType: 'ALARM',
                              status: 'CLOSED',
                              priority: 'Urgent',
                              eventTime: '07-Jul-2025 11:03:56 AM',
                              location: 'B3/F',
                              eventId: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm_175185743',
                              lastUpdated: '07-Jul-2025 11:18:58 AM',
                              timeSpent: '0:15:1',
                              description: 'CH_BMS_NEW:CH_BMS_B3F_FlushTank_Low_Alarm'
                            }
                          ].map((event, index) => (
                            <tr key={index} className="border-b border-slate-600/10 hover:bg-slate-700/20 transition-colors">
                              <td className="p-3 text-slate-300">{event.building}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  event.eventType === 'ALARM' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                  {event.eventType}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  event.status === 'ACKNOWLEDGED' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                                }`}>
                                  {event.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300">{event.priority}</td>
                              <td className="p-3 text-slate-300">{event.eventTime}</td>
                              <td className="p-3 text-slate-300">{event.location}</td>
                              <td className="p-3 text-slate-300 text-xs">{event.eventId}</td>
                              <td className="p-3 text-slate-300">{event.lastUpdated}</td>
                              <td className="p-3 text-slate-300">{event.timeSpent}</td>
                              <td className="p-3 text-slate-300 text-xs">{event.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-slate-400 text-sm">Selected Events Count: 0</div>
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-500 transition-colors"
                        onClick={() => {
                          console.log('Deselect all clicked');
                          // Handle deselect all functionality
                        }}
                      >
                        Deselect All
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          className="w-8 h-8 bg-slate-600 text-white rounded flex items-center justify-center hover:bg-slate-500 transition-colors"
                          onClick={() => {
                            console.log('Page 1 clicked');
                            // Handle page navigation
                          }}
                        >
                          1
                        </button>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Page 2 clicked');
                            // Handle page navigation
                          }}
                        >
                          2
                        </button>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Page 3 clicked');
                            // Handle page navigation
                          }}
                        >
                          3
                        </button>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Page 4 clicked');
                            // Handle page navigation
                          }}
                        >
                          4
                        </button>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Page 5 clicked');
                            // Handle page navigation
                          }}
                        >
                          5
                        </button>
                        <span className="text-slate-400">...</span>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Page 188 clicked');
                            // Handle page navigation
                          }}
                        >
                          188
                        </button>
                        <button 
                          className="w-8 h-8 bg-slate-700 text-slate-300 rounded flex items-center justify-center hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            console.log('Next page clicked');
                            // Handle next page navigation
                          }}
                        >
                          →
                        </button>
                      </div>
                      <select 
                        className="bg-slate-700 text-slate-300 rounded px-2 py-1 text-sm hover:bg-slate-600 transition-colors"
                        onChange={(e) => {
                          console.log('Items per page changed:', e.target.value);
                          // Handle items per page change
                        }}
                      >
                        <option>10 per view</option>
                        <option>25 per view</option>
                        <option>50 per view</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Panel Toggle Buttons - Centered below header */}
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4">
          {/* Left Panel Button */}
        {!leftPanelVisible && (
          <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            onClick={() => setLeftPanelVisible(true)}
              className="bg-slate-800/40 hover:bg-slate-700/50 backdrop-blur-md border border-slate-600/30 rounded-lg px-4 py-2 text-slate-100 hover:text-white shadow-lg pointer-events-auto transition-all"
          >
              <div className="flex items-center gap-2">
                <RiMenuLine className="text-lg" />
                <span className="text-sm font-medium">Left Panel</span>
              </div>
          </motion.button>
        )}
        
          {/* Right Panel Button */}
        {!rightPanelVisible && !assetPanelVisible && (
          <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            onClick={() => setRightPanelVisible(true)}
              className="bg-slate-800/40 hover:bg-slate-700/50 backdrop-blur-md border border-slate-600/30 rounded-lg px-4 py-2 text-slate-100 hover:text-white shadow-lg pointer-events-auto transition-all"
          >
              <div className="flex items-center gap-2">
                <RiAppsLine className="text-lg" />
                <span className="text-sm font-medium">Right Panel</span>
              </div>
          </motion.button>
        )}
        
          {/* Asset Information Button */}
        {!rightPanelVisible && !assetPanelVisible && (
          <motion.button
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            onClick={() => setAssetPanelVisible(true)}
              className="bg-slate-800/40 hover:bg-slate-700/50 backdrop-blur-md border border-slate-600/30 rounded-lg px-4 py-2 text-slate-100 hover:text-white shadow-lg pointer-events-auto transition-all"
          >
            <div className="flex items-center gap-2">
              <RiInformationLine className="text-lg" />
              <span className="text-sm font-medium">Asset Information</span>
            </div>
          </motion.button>
        )}
        </div>
        
        {/* Asset Panel */}
        <AnimatePresence>
          {assetPanelVisible && !rightPanelVisible && (
            <motion.div
              initial={{ x: rightPanelWidth }}
              animate={{ x: 0 }}
              exit={{ x: rightPanelWidth }}
              transition={{ duration: 0.3 }}
              className="absolute right-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-l border-slate-600/30 shadow-2xl z-40 pointer-events-auto"
              style={{ width: rightPanelWidth, top: '48px' }}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-600/20 bg-slate-800/20 backdrop-blur-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                    <RiInformationLine className="text-cyan-400" />
                    Asset Information
                  </h2>
                  <button 
                    onClick={() => setAssetPanelVisible(false)}
                    className="text-slate-200 hover:text-white transition-colors"
                  >
                    <RiCloseLine className="text-xl" />
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/40 border border-slate-600/30 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-slate-700/60"
                  />
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4 h-full overflow-y-auto">
                {/* Asset Categories */}
                <div className="space-y-3">
                  {/* General Category */}
                  <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-slate-100 font-medium flex items-center gap-2">
                        <RiGridLine className="text-blue-400" />
                        General
                      </h4>
                      <RiExpandDiagonalLine className="text-slate-400 hover:text-slate-200 cursor-pointer" />
                    </div>
                    <div className="text-slate-300 text-sm">Building systems and infrastructure</div>
                  </div>
                  
                  {/* Documentations Category */}
                  <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-slate-100 font-medium flex items-center gap-2">
                        <RiFileTextLine className="text-green-400" />
                        Documentations
                      </h4>
                      <RiExpandDiagonalLine className="text-slate-400 hover:text-slate-200 cursor-pointer" />
                    </div>
                    <div className="text-slate-300 text-sm">Technical manuals and specifications</div>
                  </div>
                  
                  {/* Asset List */}
                  <div className="space-y-2">
                    <h4 className="text-slate-100 font-medium mb-3 flex items-center gap-2">
                      <RiDashboardLine className="text-purple-400" />
                      Active Assets
                    </h4>
                    
                    <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg hover:bg-slate-800/40 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <div>
                            <div className="text-slate-100 font-medium">ES1-PLIFT-L18</div>
                            <div className="text-slate-400 text-xs">E1-LFTZ_4-LIFT_18</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm font-medium bg-green-400/20 px-2 py-1 rounded">ON</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg hover:bg-slate-800/40 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <div>
                            <div className="text-slate-100 font-medium">HVAC-AHU-01</div>
                            <div className="text-slate-400 text-xs">Air Handling Unit - Floor 1</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm font-medium bg-green-400/20 px-2 py-1 rounded">ON</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-600/20 shadow-lg hover:bg-slate-800/40 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                          <div>
                            <div className="text-slate-100 font-medium">PUMP-WS-02</div>
                            <div className="text-slate-400 text-xs">Water Supply Pump - Basement</div>
                          </div>
                        </div>
                        <div className="text-yellow-400 text-sm font-medium bg-yellow-400/20 px-2 py-1 rounded">MAINTENANCE</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Events Button */}
                <div className="pt-4 border-t border-slate-600/20">
                  <button className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-all font-medium flex items-center justify-center gap-2">
                    <RiCalendarEventLine />
                    Events
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Viewer - Below Header */}
      <div className="absolute left-0 right-0 bottom-0 z-0" style={{ top: '48px' }}>
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
    </div>
  );
};

export default ModelViewerPage; 