import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiSensorLine, 
  RiTempHotLine, 
  RiWaterFlashLine,
  RiLightbulbLine,
  RiUserLocationLine,
  RiRefreshLine,
  RiInformationLine,
  RiCloseCircleLine,
  RiEyeOffLine,
  RiCloseLine
} from 'react-icons/ri';

// Sensor types from IoTDashboardPage
export type SensorType = 'temperature' | 'humidity' | 'occupancy' | 'energy' | 'water' | 'security' | 'air';
export type SensorStatus = 'online' | 'offline' | 'warning' | 'critical';

// Sensor interface
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
}

// Mock sensor data based on the IoTDashboardPage
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
    battery: 85
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
    battery: 90
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
    battery: 75
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
    battery: 100
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
    battery: 95
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
    battery: 80
  }
];

// Helper function to get status color
const getStatusColor = (status: SensorStatus): string => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    case 'offline':
    default:
      return 'bg-gray-500';
  }
};

// Helper to get icon by sensor type
const getSensorIcon = (type: SensorType) => {
  switch (type) {
    case 'temperature':
      return <RiTempHotLine className="text-red-400" />;
    case 'humidity':
      return <RiWaterFlashLine className="text-blue-400" />;
    case 'energy':
      return <RiLightbulbLine className="text-yellow-400" />;
    case 'occupancy':
      return <RiUserLocationLine className="text-green-400" />;
    case 'water':
      return <RiWaterFlashLine className="text-cyan-400" />;
    default:
      return <RiSensorLine className="text-gray-400" />;
  }
};

// Calculate averages for quick stats
const calculateAverages = (sensors: Sensor[]) => {
  const temperatureSensors = sensors.filter(sensor => sensor.type === 'temperature');
  const humiditySensors = sensors.filter(sensor => sensor.type === 'humidity');
  const energySensors = sensors.filter(sensor => sensor.type === 'energy');
  const occupancySensors = sensors.filter(sensor => sensor.type === 'occupancy');

  const temperatureAvg = temperatureSensors.length
    ? temperatureSensors.reduce((sum, sensor) => sum + sensor.value, 0) / temperatureSensors.length
    : 0;

  const humidityAvg = humiditySensors.length
    ? humiditySensors.reduce((sum, sensor) => sum + sensor.value, 0) / humiditySensors.length
    : 0;

  const energyTotal = energySensors.length
    ? energySensors.reduce((sum, sensor) => sum + sensor.value, 0)
    : 0;

  const occupancyTotal = occupancySensors.length
    ? occupancySensors.reduce((sum, sensor) => sum + sensor.value, 0)
    : 0;

  return {
    temperature: temperatureAvg.toFixed(1),
    humidity: Math.round(humidityAvg),
    energy: energyTotal.toFixed(1),
    occupancy: Math.round(occupancyTotal)
  };
};

// Add fullscreen prop to the interface
interface IoTSidebarProps {
  modelId: string | null;
  selectedFloor: number | null;
  isOpen: boolean;
  onClose: () => void;
  fullscreen?: boolean;
}

// Update component definition to include fullscreen prop
const IoTSidebar: React.FC<IoTSidebarProps> = ({ 
  modelId, 
  selectedFloor, 
  isOpen, 
  onClose,
  fullscreen = false
}) => {
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [loading, setLoading] = useState(false);
  const [filteredSensors, setFilteredSensors] = useState<Sensor[]>(mockSensors);
  
  // Filter sensors when selected floor changes
  useEffect(() => {
    if (selectedFloor !== null && selectedFloor !== undefined) {
      setFilteredSensors(sensors.filter(sensor => sensor.floor === selectedFloor));
    } else {
      setFilteredSensors(sensors);
    }
  }, [selectedFloor, sensors]);
  
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
  
  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    
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
      setLoading(false);
    }, 1000);
  };
  
  // Calculate average values and totals
  const stats = calculateAverages(sensors);
  
  // Format the lastUpdated time to a more readable format
  const formatLastUpdated = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className={`fixed ${fullscreen ? 'right-0 top-0 z-[100]' : 'right-0 top-[72px]'} h-full w-80 bg-dark-800/95 backdrop-blur-sm border-l border-dark-700 overflow-y-auto z-40 shadow-lg`}
        >
          {/* Add a closer icon for fullscreen */}
          {fullscreen && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <RiCloseLine className="text-xl" />
            </button>
          )}
          
          {/* Rest of the sidebar content */}
          <div className="p-4">
            <div className="iot-sidebar-header flex items-center justify-between mb-4">
              <div className="flex items-center">
                <RiSensorLine className="iot-header-icon text-ai-blue text-xl mr-2" />
                <h2 className="text-lg font-semibold text-white">IoT Sensor Data</h2>
              </div>
              <div className="flex space-x-2">
                <motion.button 
                  onClick={handleRefresh}
                  className={`text-gray-400 hover:text-white p-1.5 rounded hover:bg-dark-700/50`}
                  disabled={loading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RiRefreshLine className={loading ? 'animate-spin' : ''} />
                </motion.button>
                <motion.button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-dark-700/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RiCloseCircleLine />
                </motion.button>
              </div>
            </div>
            
            {selectedFloor !== null && (
              <motion.div 
                className="iot-floor-info mb-3 bg-dark-700/50 px-3 py-2 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-sm text-gray-300 flex items-center">
                  <RiInformationLine className="mr-1" /> 
                  {selectedFloor !== null 
                    ? `Showing sensors for Floor ${selectedFloor}` 
                    : 'Showing all sensors'}
                </p>
              </motion.div>
            )}
            
            {/* Quick stats */}
            <div className="iot-quick-stats grid grid-cols-2 gap-3 mb-4">
              <motion.div 
                className="iot-stat-card bg-gradient-to-br from-blue-900/40 to-blue-700/20 border border-blue-800/50 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="iot-stat-header flex items-center mb-1">
                  <RiTempHotLine className="text-blue-400 text-sm mr-1" />
                  <h3 className="text-xs font-medium text-white">Temperature</h3>
                </div>
                <div className="flex items-end">
                  <span className="text-xl font-bold text-white">{stats.temperature}</span>
                  <span className="text-blue-300 ml-1 pb-0.5 text-sm">°C</span>
                </div>
                <div className="text-blue-300 text-xs">Avg across sensors</div>
              </motion.div>
              
              <motion.div 
                className="iot-stat-card bg-gradient-to-br from-green-900/40 to-green-700/20 border border-green-800/50 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="iot-stat-header flex items-center mb-1">
                  <RiWaterFlashLine className="text-green-400 text-sm mr-1" />
                  <h3 className="text-xs font-medium text-white">Humidity</h3>
                </div>
                <div className="flex items-end">
                  <span className="text-xl font-bold text-white">{stats.humidity}</span>
                  <span className="text-green-300 ml-1 pb-0.5 text-sm">%</span>
                </div>
                <div className="text-green-300 text-xs">Avg across sensors</div>
              </motion.div>
              
              <motion.div 
                className="iot-stat-card bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border border-yellow-800/50 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="iot-stat-header flex items-center mb-1">
                  <RiLightbulbLine className="text-yellow-400 text-sm mr-1" />
                  <h3 className="text-xs font-medium text-white">Energy</h3>
                </div>
                <div className="flex items-end">
                  <span className="text-xl font-bold text-white">{stats.energy}</span>
                  <span className="text-yellow-300 ml-1 pb-0.5 text-sm">kWh</span>
                </div>
                <div className="text-yellow-300 text-xs">Today's consumption</div>
              </motion.div>
              
              <motion.div 
                className="iot-stat-card bg-gradient-to-br from-purple-900/40 to-purple-700/20 border border-purple-800/50 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="iot-stat-header flex items-center mb-1">
                  <RiUserLocationLine className="text-purple-400 text-sm mr-1" />
                  <h3 className="text-xs font-medium text-white">Occupancy</h3>
                </div>
                <div className="flex items-end">
                  <span className="text-xl font-bold text-white">{stats.occupancy}</span>
                  <span className="text-purple-300 ml-1 pb-0.5 text-sm">people</span>
                </div>
                <div className="text-purple-300 text-xs">Current occupancy</div>
              </motion.div>
            </div>
            
            {/* Sensors list */}
            <div className="iot-sensor-list flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Sensors</h3>
                <span className="text-xs text-gray-400">
                  {filteredSensors.length} {filteredSensors.length === 1 ? 'sensor' : 'sensors'}
                </span>
              </div>
              
              {filteredSensors.length > 0 ? (
                <div className="iot-sensor-items space-y-2">
                  {filteredSensors.map((sensor, index) => (
                    <motion.div 
                      key={sensor.id}
                      className="iot-sensor-item flex justify-between bg-dark-700/50 border border-dark-600 rounded-lg p-2 hover:bg-dark-700/80 transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (index * 0.05) }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="iot-sensor-info">
                        <div className="flex items-center mb-1">
                          {getSensorIcon(sensor.type)}
                          <span className="text-sm font-medium text-white ml-1">{sensor.name}</span>
                          <div className={`ml-2 w-2 h-2 rounded-full ${getStatusColor(sensor.status)}`}></div>
                        </div>
                        <div className="text-xs text-gray-400">{sensor.location}</div>
                      </div>
                      <div className="iot-sensor-value text-right">
                        <div className="text-lg font-semibold text-white">{sensor.value} {sensor.unit}</div>
                        <div className="text-xs text-gray-400">Updated: {formatLastUpdated(sensor.lastUpdated)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="iot-no-sensors text-center py-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <RiEyeOffLine className="text-gray-600 text-4xl mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No sensors available</p>
                  {selectedFloor !== null && (
                    <p className="text-gray-500 text-xs mt-1">Try selecting a different floor</p>
                  )}
                </motion.div>
              )}
            </div>
            
            <motion.div 
              className="iot-sidebar-footer mt-4 pt-3 border-t border-dark-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>BuildSphere IoT Data</span>
                <motion.button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white px-2 py-1 rounded text-xs hover:bg-dark-700/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IoTSidebar; 