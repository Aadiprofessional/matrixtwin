import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCloseLine, 
  RiSubtractLine, 
  RiAddLine,
  RiSensorLine,
  RiBarChartBoxLine,
  RiRemoteControlLine,
  RiInformationLine,
  RiCameraLine,
  RiDoorLockLine,
  RiBellLine,
  RiCloudyLine,
  RiTempHotLine,
  RiWaterFlashLine,
  RiLightbulbLine,
  RiUserLocationLine,
  RiLightbulbFlashLine,
  RiTempColdLine,
  RiRecordCircleLine,
  RiEyeLine,
  RiAlertLine,
  RiRefreshLine,
  RiSunLine,
  RiRainyLine,
  RiThunderstormsLine,
  RiWindyLine,
  RiDropLine
} from 'react-icons/ri';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import StatusIndicator, { SensorStatus } from './ui/StatusIndicator';
import SensorIcon, { SensorType } from './ui/SensorIcon';
import StatCard from './ui/StatCard';
import { EventPanel } from './viewer/EventPanel';
import SmartLockDashboard from './SmartLockDashboard';

// Types
interface DraggablePanel {
  id: string;
  type: 'iot' | 'analytics' | 'controls' | 'info' | 'cctv' | 'smartlock' | 'events' | 'weather';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
}

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

interface WeatherData {
  current: any;
  forecast: any;
  local: any;
  loading: boolean;
  error: string | null;
}

interface ModelRecord {
  id?: string;
  file_id?: number;
  file_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface DraggablePanelComponentProps {
  panel: DraggablePanel;
  onClose: () => void;
  onMinimize: () => void;
  onBringToFront: () => void;
  onUpdatePosition: (newPosition: { x: number; y: number }) => void;
  sensors: Sensor[];
  cctvCameras: CCTVCamera[];
  selectedSensor: Sensor | null;
  selectedCamera: CCTVCamera | null;
  setSelectedSensor: (sensor: Sensor | null) => void;
  setSelectedCamera: (camera: CCTVCamera | null) => void;
  hvacEnabled: boolean;
  setHvacEnabled: (enabled: boolean) => void;
  lightingEnabled: boolean;
  setLightingEnabled: (enabled: boolean) => void;
  targetTemp: number;
  setTargetTemp: (temp: number) => void;
  lightingLevel: number;
  setLightingLevel: (level: number) => void;
  weatherData: WeatherData;
  fetchWeatherData: () => void;
  getWeatherIcon: (iconCode: number) => React.ReactNode;
  models: ModelRecord[];
  viewToken: string | null;
  getSensorIcon: (type: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  generateTimeSeriesData: (hours?: number, baseValue?: number, variance?: number) => { labels: string[]; data: number[] };
}

const DraggablePanelComponent: React.FC<DraggablePanelComponentProps> = ({
  panel,
  onClose,
  onMinimize,
  onBringToFront,
  onUpdatePosition,
  sensors,
  cctvCameras,
  selectedSensor,
  selectedCamera,
  setSelectedSensor,
  setSelectedCamera,
  hvacEnabled,
  setHvacEnabled,
  lightingEnabled,
  setLightingEnabled,
  targetTemp,
  setTargetTemp,
  lightingLevel,
  setLightingLevel,
  weatherData,
  fetchWeatherData,
  getWeatherIcon,
  models,
  viewToken,
  getSensorIcon,
  getStatusColor,
  generateTimeSeriesData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      onBringToFront();
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - panel.size.width)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - (panel.isMinimized ? 60 : panel.size.height)))
      };
      onUpdatePosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getPanelIcon = (type: string) => {
    switch (type) {
      case 'iot': return <RiSensorLine />;
      case 'analytics': return <RiBarChartBoxLine />;
      case 'controls': return <RiRemoteControlLine />;
      case 'info': return <RiInformationLine />;
      case 'cctv': return <RiCameraLine />;
      case 'smartlock': return <RiDoorLockLine />;
      case 'events': return <RiBellLine />;
      case 'weather': return <RiCloudyLine />;
      default: return <RiInformationLine />;
    }
  };

  const renderPanelContent = () => {
    switch (panel.type) {
      case 'iot':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {sensors.map((sensor) => (
                <motion.div
                  key={sensor.id}
                  className="bg-slate-800/20 rounded-lg p-3 border border-slate-700/20 hover:border-slate-600/30 transition-all cursor-pointer"
                  onClick={() => setSelectedSensor(sensor)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSensorIcon(sensor.type)}
                      <span className="text-white font-medium text-sm">{sensor.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.status)}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{sensor.location}</span>
                    <span className="text-white font-bold">{sensor.value} {sensor.unit}</span>
                  </div>
                  {sensor.battery && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-full bg-slate-700 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full" 
                          style={{ width: `${sensor.battery}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400">{sensor.battery}%</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'analytics':
        const tempData = generateTimeSeriesData(24, 22, 2);
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Temperature Trend</h3>
              <Line
                data={{
                  labels: tempData.labels,
                  datasets: [{
                    label: 'Temperature (°C)',
                    data: tempData.data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { ticks: { color: '#94a3b8' } },
                    y: { ticks: { color: '#94a3b8' } }
                  },
                  plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                  }
                }}
                height={200}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Avg Temperature"
                value="22.8°C"
                icon={RiTempHotLine}
                trend={{
                  value: 0.5,
                  label: "+0.5°C from yesterday",
                  isPositive: true
                }}
                color="red"
              />
              <StatCard
                title="Energy Usage"
                value="42.7 kWh"
                icon={RiLightbulbLine}
                trend={{
                  value: 2.1,
                  label: "-2.1 kWh from yesterday",
                  isPositive: false
                }}
                color="yellow"
              />
            </div>
          </div>
        );
        
      case 'controls':
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <RiTempHotLine className="text-red-400" />
                HVAC Control
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">System Status</span>
                  <button
                    onClick={() => setHvacEnabled(!hvacEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      hvacEnabled 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {hvacEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Target Temperature</span>
                    <span className="text-white font-bold">{targetTemp}°C</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="30"
                    value={targetTemp}
                    onChange={(e) => setTargetTemp(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <RiLightbulbLine className="text-yellow-400" />
                Lighting Control
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">System Status</span>
                  <button
                    onClick={() => setLightingEnabled(!lightingEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      lightingEnabled 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {lightingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Brightness Level</span>
                    <span className="text-white font-bold">{lightingLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lightingLevel}
                    onChange={(e) => setLightingLevel(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'cctv':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {cctvCameras.map((camera) => (
                <motion.div
                  key={camera.id}
                  className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all cursor-pointer"
                  onClick={() => setSelectedCamera(camera)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RiCameraLine className="text-blue-400" />
                      <span className="text-white font-medium text-sm">{camera.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {camera.isRecording && (
                        <RiRecordCircleLine className="text-red-500 animate-pulse" />
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        camera.status === 'online' ? 'bg-green-500' :
                        camera.status === 'recording' ? 'bg-red-500' :
                        camera.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span>{camera.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolution:</span>
                      <span>{camera.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="capitalize">{camera.status}</span>
                    </div>
                  </div>
                  {camera.alerts.length > 0 && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                      <div className="text-xs text-red-400">
                        Latest Alert: {camera.alerts[0].message}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'smartlock':
        return <SmartLockDashboard />;
        
      case 'events':
        return <EventPanel isOpen={true} onClose={() => {}} />;
        
      case 'weather':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Weather Forecast</h3>
              <button
                onClick={fetchWeatherData}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <RiRefreshLine className="text-sm" />
              </button>
            </div>
            
            {weatherData.loading && (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-slate-400 text-sm">Loading weather data...</p>
              </div>
            )}
            
            {weatherData.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{weatherData.error}</p>
              </div>
            )}
            
            {weatherData.current && (
              <div className="bg-slate-800/20 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Current Weather</h4>
                <div className="space-y-2">
                  {weatherData.current.temperature && weatherData.current.temperature[0] && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Temperature</span>
                      <span className="text-white font-bold">
                        {weatherData.current.temperature[0].value}°{weatherData.current.temperature[0].unit}
                      </span>
                    </div>
                  )}
                  {weatherData.current.humidity && weatherData.current.humidity[0] && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Humidity</span>
                      <span className="text-white font-bold">
                        {weatherData.current.humidity[0].value}%
                      </span>
                    </div>
                  )}
                  {weatherData.current.icon && weatherData.current.icon[0] && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Conditions</span>
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(weatherData.current.icon[0])}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
        
      case 'info':
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/20 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Model Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">View Token:</span>
                  <span className="text-white font-mono text-xs">
                    {viewToken ? `${viewToken.substring(0, 8)}...` : 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Models Available:</span>
                  <span className="text-white">{models.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensors Active:</span>
                  <span className="text-white">{sensors.filter(s => s.status === 'online').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CCTV Cameras:</span>
                  <span className="text-white">{cctvCameras.length}</span>
                </div>
              </div>
            </div>
            
            {models.length > 0 && (
              <div className="bg-slate-800/20 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Available Models</h4>
                <div className="space-y-2">
                  {models.slice(0, 3).map((model) => (
                    <div key={model.id} className="text-sm">
                      <div className="text-white font-medium">{model.file_name}</div>
                      {model.description && (
                        <div className="text-slate-400 text-xs">{model.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return <div className="text-slate-400">Panel content not available</div>;
    }
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bg-slate-900/60 backdrop-blur-lg border border-slate-700/30 rounded-lg shadow-2xl overflow-hidden"
      style={{
        left: panel.position.x,
        top: panel.position.y,
        width: panel.size.width,
        height: panel.isMinimized ? 'auto' : panel.size.height,
        zIndex: panel.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Panel Header */}
      <div className="drag-handle bg-slate-800/30 border-b border-slate-700/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-blue-400">
            {getPanelIcon(panel.type)}
          </div>
          <span className="text-white font-medium text-sm">{panel.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1 hover:bg-slate-700/30 rounded text-slate-400 hover:text-white transition-all"
          >
            {panel.isMinimized ? <RiAddLine /> : <RiSubtractLine />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-slate-700/30 rounded text-slate-400 hover:text-white transition-all"
          >
            <RiCloseLine />
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      {!panel.isMinimized && (
        <div className="p-4 overflow-y-auto" style={{ maxHeight: panel.size.height - 60 }}>
          {renderPanelContent()}
        </div>
      )}
    </motion.div>
  );
};

export default DraggablePanelComponent; 