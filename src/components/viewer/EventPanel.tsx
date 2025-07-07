import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiNotificationLine, 
  RiAlarmWarningLine, 
  RiLockLine, 
  RiLockUnlockLine,
  RiCloseLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiTimeLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiWifiLine,
  RiSignalWifiOffLine,
  RiSettings4Line,
  RiRefreshLine,
  RiBellLine,
  RiFireLine,
  RiTempHotLine,
  RiDropLine,
  RiUserLocationLine
} from 'react-icons/ri';

interface Event {
  id: string;
  type: 'info' | 'warning' | 'error' | 'urgent' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  location?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  acknowledged?: boolean;
  source?: string;
}

interface SmartLock {
  id: string;
  name: string;
  location: string;
  status: 'locked' | 'unlocked' | 'error' | 'offline';
  batteryLevel: number;
  lastUpdated: Date;
  accessLevel: 'admin' | 'manager' | 'user' | 'restricted';
}

interface EventPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const EventPanel: React.FC<EventPanelProps> = ({ isOpen, onClose, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'locks' | 'alerts'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [smartLocks, setSmartLocks] = useState<SmartLock[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data initialization
  useEffect(() => {
    if (isOpen) {
      loadMockData();
    }
  }, [isOpen]);

  const loadMockData = () => {
    setLoading(true);
    
    // Mock events
    const mockEvents: Event[] = [
      {
        id: '1',
        type: 'urgent',
        title: 'Temperature Alert',
        message: 'Server room temperature exceeded 85°F',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        location: 'Server Room B-12',
        priority: 'critical',
        source: 'HVAC System'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Access Denied',
        message: 'Unauthorized access attempt detected',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        location: 'Main Entrance',
        priority: 'high',
        source: 'Security System'
      },
      {
        id: '3',
        type: 'info',
        title: 'System Update',
        message: 'IoT sensors updated successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        location: 'All Zones',
        priority: 'low',
        acknowledged: true,
        source: 'System'
      },
      {
        id: '4',
        type: 'error',
        title: 'Sensor Offline',
        message: 'Humidity sensor in Zone C is not responding',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        location: 'Zone C-03',
        priority: 'medium',
        source: 'IoT Network'
      }
    ];

    // Mock smart locks
    const mockLocks: SmartLock[] = [
      {
        id: 'lock1',
        name: 'Main Entrance',
        location: 'Building A - Main Door',
        status: 'locked',
        batteryLevel: 85,
        lastUpdated: new Date(),
        accessLevel: 'admin'
      },
      {
        id: 'lock2',
        name: 'Server Room',
        location: 'Building B - Server Room',
        status: 'locked',
        batteryLevel: 62,
        lastUpdated: new Date(Date.now() - 2 * 60 * 1000),
        accessLevel: 'admin'
      },
      {
        id: 'lock3',
        name: 'Storage Area',
        location: 'Building C - Storage',
        status: 'unlocked',
        batteryLevel: 91,
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
        accessLevel: 'manager'
      },
      {
        id: 'lock4',
        name: 'Emergency Exit',
        location: 'Building A - Emergency Exit',
        status: 'error',
        batteryLevel: 15,
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
        accessLevel: 'admin'
      }
    ];

    setEvents(mockEvents);
    setSmartLocks(mockLocks);
    setLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <RiFireLine className="text-red-600" />;
      case 'warning':
        return <RiAlarmWarningLine className="text-yellow-600" />;
      case 'error':
        return <RiErrorWarningLine className="text-red-500" />;
      case 'info':
        return <RiInformationLine className="text-blue-500" />;
      case 'system':
        return <RiSettings4Line className="text-gray-500" />;
      default:
        return <RiNotificationLine className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLockStatusIcon = (status: string) => {
    switch (status) {
      case 'locked':
        return <RiLockLine className="text-green-600" />;
      case 'unlocked':
        return <RiLockUnlockLine className="text-yellow-600" />;
      case 'error':
        return <RiErrorWarningLine className="text-red-600" />;
      case 'offline':
        return <RiSignalWifiOffLine className="text-gray-400" />;
      default:
        return <RiLockLine className="text-gray-400" />;
    }
  };

  const toggleLock = (lockId: string) => {
    setSmartLocks(prev => prev.map(lock => {
      if (lock.id === lockId && lock.status !== 'error' && lock.status !== 'offline') {
        return {
          ...lock,
          status: lock.status === 'locked' ? 'unlocked' : 'locked',
          lastUpdated: new Date()
        };
      }
      return lock;
    }));
  };

  const acknowledgeEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, acknowledged: true } : event
    ));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const urgentEvents = events.filter(e => e.type === 'urgent' || e.priority === 'critical');
  const unacknowledgedEvents = events.filter(e => !e.acknowledged);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RiBellLine className="text-xl text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Event Center
          </h2>
          {unacknowledgedEvents.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unacknowledgedEvents.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <RiCloseLine className="text-xl" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'events', label: 'Events', count: unacknowledgedEvents.length },
          { key: 'alerts', label: 'Alerts', count: urgentEvents.length },
          { key: 'locks', label: 'Smart Locks', count: smartLocks.filter(l => l.status === 'unlocked' || l.status === 'error').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'events' && (
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <RiRefreshLine className="animate-spin text-2xl mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <RiNotificationLine className="text-4xl mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No events to display</p>
              </div>
            ) : (
              events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border transition-all ${
                    event.acknowledged 
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(event.priority)}`}>
                          {event.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {event.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          {event.location && (
                            <span className="flex items-center">
                              <RiMapPinLine className="mr-1" />
                              {event.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <RiTimeLine className="mr-1" />
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {!event.acknowledged && (
                          <button
                            onClick={() => acknowledgeEvent(event.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <RiCheckLine />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-4 space-y-3">
            {urgentEvents.length === 0 ? (
              <div className="text-center py-8">
                <RiShieldCheckLine className="text-4xl mx-auto mb-4 text-green-400" />
                <p className="text-gray-500">No urgent alerts</p>
              </div>
            ) : (
              urgentEvents.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                >
                  <div className="flex items-start space-x-3">
                    <RiFireLine className="text-red-600 text-xl flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-red-700 dark:text-red-300 text-sm mb-2">
                        {event.message}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-600 dark:text-red-400">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        {!event.acknowledged && (
                          <button
                            onClick={() => acknowledgeEvent(event.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'locks' && (
          <div className="p-4 space-y-3">
            {smartLocks.map(lock => (
              <motion.div
                key={lock.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getLockStatusIcon(lock.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {lock.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lock.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${
                      lock.status === 'locked' ? 'text-green-600' :
                      lock.status === 'unlocked' ? 'text-yellow-600' :
                      lock.status === 'error' ? 'text-red-600' :
                      'text-gray-400'
                    }`}>
                      {lock.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500 dark:text-gray-400">
                      Battery: {lock.batteryLevel}%
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatTimestamp(lock.lastUpdated)}
                    </span>
                  </div>
                  
                  {lock.status !== 'error' && lock.status !== 'offline' && (
                    <button
                      onClick={() => toggleLock(lock.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        lock.status === 'locked'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {lock.status === 'locked' ? 'Unlock' : 'Lock'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 