import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RiFlashlightLine, 
  RiLightbulbLine, 
  RiTempHotLine, 
  RiWindyLine, 
  RiLightbulbFlashLine,
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiShieldCheckLine,
  RiWifiLine,
  RiAlarmWarningLine,
  RiDoorLockLine,
  RiMistLine,
  RiHistoryLine,
  RiArrowGoBackLine
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import SmartLockDashboard from '../components/SmartLockDashboard';

// Types for systems and zones
interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  icon: React.ReactNode;
  value?: string | number;
  unit?: string;
  isAuto?: boolean;
}

interface Zone {
  id: string;
  name: string;
  systems: SystemControl[];
}

interface SystemControl {
  id: string;
  type: 'hvac' | 'lighting' | 'security' | 'blinds';
  name: string;
  status: 'on' | 'off' | 'auto';
  icon: React.ReactNode;
  value?: number;
  unit?: string;
  min?: number;
  max?: number;
}

interface ScheduledTask {
  id: string;
  system: string;
  action: string;
  time: string;
  zone: string;
  recurring: string;
  enabled: boolean;
}

// Mock data
const systemStatuses: SystemStatus[] = [
  { id: 'hvac', name: 'HVAC System', status: 'online', icon: <RiTempHotLine />, value: 22, unit: '°C' },
  { id: 'lighting', name: 'Lighting System', status: 'online', icon: <RiLightbulbLine />, value: 80, unit: '%' },
  { id: 'security', name: 'Security System', status: 'online', icon: <RiShieldCheckLine /> },
  { id: 'elevator', name: 'Elevator System', status: 'warning', icon: <RiWifiLine /> },
  { id: 'fire', name: 'Fire Safety', status: 'online', icon: <RiAlarmWarningLine /> },
  { id: 'access', name: 'Access Control', status: 'offline', icon: <RiDoorLockLine /> },
];

const zones: Zone[] = [
  {
    id: 'zone1',
    name: 'Ground Floor',
    systems: [
      { id: 'hvac1', type: 'hvac', name: 'Air Conditioning', status: 'on', icon: <RiTempHotLine />, value: 22, unit: '°C', min: 16, max: 28 },
      { id: 'light1', type: 'lighting', name: 'Main Lighting', status: 'auto', icon: <RiLightbulbLine />, value: 80, unit: '%', min: 0, max: 100 },
      { id: 'light2', type: 'lighting', name: 'Accent Lighting', status: 'off', icon: <RiLightbulbFlashLine />, value: 0, unit: '%', min: 0, max: 100 },
      { id: 'security1', type: 'security', name: 'Motion Sensors', status: 'on', icon: <RiShieldCheckLine /> },
    ],
  },
  {
    id: 'zone2',
    name: 'First Floor - Office Area',
    systems: [
      { id: 'hvac2', type: 'hvac', name: 'Air Conditioning', status: 'auto', icon: <RiTempHotLine />, value: 23, unit: '°C', min: 16, max: 28 },
      { id: 'hvac3', type: 'hvac', name: 'Ventilation', status: 'on', icon: <RiWindyLine />, value: 4, unit: 'level', min: 1, max: 5 },
      { id: 'light3', type: 'lighting', name: 'Office Lighting', status: 'on', icon: <RiLightbulbLine />, value: 75, unit: '%', min: 0, max: 100 },
      { id: 'security2', type: 'security', name: 'CCTV System', status: 'on', icon: <RiShieldCheckLine /> },
    ],
  },
  {
    id: 'zone3',
    name: 'Second Floor - Meeting Rooms',
    systems: [
      { id: 'hvac4', type: 'hvac', name: 'Air Conditioning', status: 'off', icon: <RiTempHotLine />, value: 20, unit: '°C', min: 16, max: 28 },
      { id: 'light4', type: 'lighting', name: 'Meeting Room Lights', status: 'off', icon: <RiLightbulbLine />, value: 0, unit: '%', min: 0, max: 100 },
      { id: 'blinds1', type: 'blinds', name: 'Window Blinds', status: 'auto', icon: <RiMistLine /> },
    ],
  },
];

const scheduledTasks: ScheduledTask[] = [
  { id: 'task1', system: 'HVAC', action: 'Reduce temperature to 20°C', time: '18:00', zone: 'All Floors', recurring: 'Weekdays', enabled: true },
  { id: 'task2', system: 'Lighting', action: 'Turn off all lights', time: '20:00', zone: 'All Floors', recurring: 'Daily', enabled: true },
  { id: 'task3', system: 'Security', action: 'Activate night mode', time: '21:00', zone: 'All Floors', recurring: 'Daily', enabled: true },
  { id: 'task4', system: 'HVAC', action: 'Turn on', time: '07:00', zone: 'Ground Floor', recurring: 'Weekdays', enabled: false },
];

const DigitalTwinsControlPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<string>('zone1');
  const [activeTab, setActiveTab] = useState<'systems' | 'schedule'>('systems');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Systems and zones state management
  const [systemsState, setSystemsState] = useState<SystemStatus[]>(systemStatuses);
  const [zonesState, setZonesState] = useState<Zone[]>(zones);
  const [scheduledTasksState, setScheduledTasksState] = useState<ScheduledTask[]>(scheduledTasks);
  
  // Inline styles to ensure content stays visible
  const baseStyle = { zIndex: 10, position: 'relative' as const };
  
  // Get current zone
  const currentZone = zonesState.find(zone => zone.id === selectedZone) || zonesState[0];
  
  // Handle system value change
  const handleSystemValueChange = (systemId: string, newValue: number) => {
    const updatedZones = zonesState.map(zone => {
      const updatedSystems = zone.systems.map(system => {
        if (system.id === systemId) {
          return { ...system, value: newValue };
        }
        return system;
      });
      return { ...zone, systems: updatedSystems };
    });
    setZonesState(updatedZones);
  };
  
  // Handle system status toggle
  const handleSystemStatusToggle = (systemId: string) => {
    const updatedZones = zonesState.map(zone => {
      const updatedSystems = zone.systems.map(system => {
        if (system.id === systemId) {
          // Cycle through states: off -> on -> auto -> off
          const newStatus = system.status === 'off' ? 'on' : system.status === 'on' ? 'auto' : 'off';
          return { ...system, status: newStatus as 'on' | 'off' | 'auto' };
        }
        return system;
      });
      return { ...zone, systems: updatedSystems };
    });
    setZonesState(updatedZones);
  };
  
  // Handle task toggle
  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = scheduledTasksState.map(task => {
      if (task.id === taskId) {
        return { ...task, enabled: !task.enabled };
      }
      return task;
    });
    setScheduledTasksState(updatedTasks);
  };
  
  // Simulate refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Render status badge
  const renderStatusBadge = (status: 'online' | 'offline' | 'warning' | 'on' | 'off' | 'auto') => {
    const statusConfig = {
      online: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Online' },
      offline: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Offline' },
      warning: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'Warning' },
      on: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'On' },
      off: { bg: 'bg-gray-900/40', text: 'text-gray-400', label: 'Off' },
      auto: { bg: 'bg-orange-900/40', text: 'text-orange-400', label: 'Auto' },
    };
    
    const config = statusConfig[status];
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {status === 'online' || status === 'on' ? <RiCheckboxCircleLine className="mr-1" /> : 
         status === 'offline' || status === 'off' ? <RiCloseLine className="mr-1" /> : 
         <RiAlarmWarningLine className="mr-1" />}
        {config.label}
      </span>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8" style={baseStyle}>
      {/* Header */}
      <div className="dtc-header mb-6" style={baseStyle}>
        <div className="dtc-header-title flex items-center mb-4" style={baseStyle}>
          <Link to="/digital-twins" className="dtc-back-button text-gray-400 hover:text-white mr-4" style={baseStyle}>
            <RiArrowGoBackLine className="text-xl" />
          </Link>
          <RiFlashlightLine className="dtc-header-icon text-portfolio-orange text-3xl mr-3" style={baseStyle} />
          <h1 className="dtc-title text-2xl font-bold text-white" style={baseStyle}>
            Smart Control
          </h1>
          <button 
            className={`dtc-refresh-button ml-4 text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={baseStyle}
          >
            <RiRefreshLine className="text-xl" />
          </button>
        </div>
        <p className="dtc-description text-gray-400 max-w-3xl" style={baseStyle}>
          Control and automate your building's systems remotely through the digital twin interface.
        </p>
      </div>
      
      {/* System status overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6" style={baseStyle}>
        {systemsState.map(system => (
          <div 
            key={system.id} 
            className="bg-dark-800/60 border border-dark-700 rounded-xl p-4"
            style={baseStyle}
          >
            <div className="flex flex-col items-center justify-center" style={baseStyle}>
              <div className="text-gray-300 text-2xl mb-2" style={baseStyle}>
                {system.icon}
              </div>
              <h3 className="text-sm font-medium text-white text-center mb-1" style={baseStyle}>{system.name}</h3>
              <div className="mb-1" style={baseStyle}>
                {renderStatusBadge(system.status)}
              </div>
              {system.value !== undefined && (
                <div className="text-sm text-gray-400 mt-1" style={baseStyle}>
                  {system.value}{system.unit}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Control tabs */}
      <div className="mb-6" style={baseStyle}>
        <div className="flex border-b border-dark-700 mb-4" style={baseStyle}>
          <button
            onClick={() => setActiveTab('systems')}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'systems' 
                ? 'text-portfolio-orange border-b-2 border-portfolio-orange' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={baseStyle}
          >
            Zone Controls
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'schedule' 
                ? 'text-portfolio-orange border-b-2 border-portfolio-orange' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={baseStyle}
          >
            Scheduled Tasks
          </button>
        </div>
        
        {activeTab === 'systems' && (
          <>
            {/* Zone selector */}
            <div className="flex mb-4 bg-dark-800/60 rounded-lg overflow-hidden border border-dark-700" style={baseStyle}>
              {zonesState.map(zone => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`px-4 py-2 text-sm ${
                    selectedZone === zone.id
                      ? 'bg-portfolio-orange text-white'
                      : 'text-gray-300 hover:bg-dark-700'
                  }`}
                  style={baseStyle}
                >
                  {zone.name}
                </button>
              ))}
            </div>
            
            {/* Systems controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={baseStyle}>
              {currentZone.systems.map(system => (
                <div 
                  key={system.id}
                  className="bg-dark-800/60 border border-dark-700 rounded-xl p-4"
                  style={baseStyle}
                >
                  <div className="flex items-center justify-between mb-3" style={baseStyle}>
                    <div className="flex items-center" style={baseStyle}>
                      <div className="text-portfolio-orange text-xl mr-2" style={baseStyle}>
                        {system.icon}
                      </div>
                      <div style={baseStyle}>
                        <h3 className="font-medium text-white" style={baseStyle}>{system.name}</h3>
                        <p className="text-xs text-gray-400" style={baseStyle}>{currentZone.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSystemStatusToggle(system.id)}
                      className="focus:outline-none"
                      style={baseStyle}
                    >
                      {renderStatusBadge(system.status)}
                    </button>
                  </div>
                  
                  {system.value !== undefined && system.min !== undefined && system.max !== undefined && (
                    <div className="mt-3" style={baseStyle}>
                      <div className="flex items-center justify-between mb-1" style={baseStyle}>
                        <span className="text-sm text-gray-400" style={baseStyle}>Value: {system.value}{system.unit}</span>
                        <span className="text-xs text-gray-500" style={baseStyle}>Range: {system.min} - {system.max}{system.unit}</span>
                      </div>
                      <input
                        type="range"
                        min={system.min}
                        max={system.max}
                        step={system.type === 'hvac' ? 0.5 : 5}
                        value={system.value}
                        onChange={(e) => handleSystemValueChange(system.id, Number(e.target.value))}
                        disabled={system.status === 'off'}
                        className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer"
                        style={baseStyle}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        {activeTab === 'schedule' && (
          <div className="space-y-4" style={baseStyle}>
            <h2 className="text-xl font-semibold text-white mb-4" style={baseStyle}>Scheduled Tasks</h2>
            <div className="space-y-3" style={baseStyle}>
              {scheduledTasksState.map(task => (
                <div 
                  key={task.id}
                  className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 flex items-center justify-between"
                  style={baseStyle}
                >
                  <div className="flex items-center" style={baseStyle}>
                    <div className="text-portfolio-orange text-xl mr-3" style={baseStyle}>
                      <RiHistoryLine />
                    </div>
                    <div style={baseStyle}>
                      <h3 className="font-medium text-white" style={baseStyle}>{task.system} - {task.action}</h3>
                      <p className="text-sm text-gray-400" style={baseStyle}>
                        {task.time} • {task.zone} • {task.recurring}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3" style={baseStyle}>
                    <span className={`text-sm ${task.enabled ? 'text-green-400' : 'text-gray-400'}`} style={baseStyle}>
                      {task.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleTaskToggle(task.id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        task.enabled ? 'bg-portfolio-orange' : 'bg-gray-600'
                      }`}
                      style={baseStyle}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        task.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Smart Lock Dashboard Section */}
      <div className="mt-8" style={baseStyle}>
        <h2 className="text-xl font-semibold text-white mb-4" style={baseStyle}>Smart Lock Control</h2>
        <SmartLockDashboard />
      </div>
    </div>
  );
};

export default DigitalTwinsControlPage; 