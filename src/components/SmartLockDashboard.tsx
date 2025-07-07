import React, { useState, useEffect } from 'react';
import { 
  RiShieldCheckLine, 
  RiBatteryLine, 
  RiMapPinLine, 
  RiWifiLine,
  RiRefreshLine,
  RiAlarmWarningLine,
  RiLockLine,
  RiLockUnlockLine,
  RiPlugLine,
  RiHistoryLine,
  RiLoader4Line,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine
} from 'react-icons/ri';
import { 
  getNewDeviceData, 
  getHistoryData, 
  getDeviceEvents,
  getSmartLockStatus,
  lockDevice,
  unlockDevice,
  formatEventType,
  getEventIcon,
  type DeviceData,
  type HistoryRecord,
  type DeviceEvent,
  type SmartLockStatus
} from '../utils/smartLockApiProxy';

interface SmartLockDashboardProps {
  className?: string;
}

const SmartLockDashboard: React.FC<SmartLockDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'events'>('status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [controlLoading, setControlLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Real-time data state
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [smartLockStatus, setSmartLockStatus] = useState<SmartLockStatus | null>(null);
  
  // Add optimistic state for better UX
  const [optimisticLockState, setOptimisticLockState] = useState<boolean | null>(null);
  
  // History data state
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Events data state
  const [eventsData, setEventsData] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Clear control message after 5 seconds
  useEffect(() => {
    if (controlMessage) {
      const timer = setTimeout(() => {
        setControlMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [controlMessage]);

  // Fetch real-time data
  const fetchRealTimeData = async () => {
    try {
      setError(null);
      
      // Get both real-time data and formatted status
      const [realTimeResponse, statusResponse] = await Promise.all([
        getNewDeviceData(),
        getSmartLockStatus()
      ]);
      
      if (realTimeResponse.success && realTimeResponse.data && realTimeResponse.data.length > 0) {
        setDeviceData(realTimeResponse.data[0]);
      }
      
      if (statusResponse) {
        setSmartLockStatus(statusResponse);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch history data
  const fetchHistoryData = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      
      console.log('Fetching history data...');
      
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
      const endTime = new Date().toISOString();
      
      console.log('History data time range:', { startTime, endTime });
      
      const response = await getHistoryData(startTime, endTime, 1, 20);
      
      console.log('History data response:', response);
      
      if (response.success && response.data) {
        setHistoryData(response.data);
        console.log(`Successfully loaded ${response.data.length} history records`);
      } else {
        console.warn('History data fetch was not successful or returned no data');
        setError('Failed to load history data. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Error fetching history data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history data');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch events data
  const fetchEventsData = async () => {
    try {
      setEventsLoading(true);
      setError(null);
      
      console.log('Fetching events data...');
      
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
      const endTime = new Date().toISOString();
      
      console.log('Events data time range:', { startTime, endTime });
      
      const response = await getDeviceEvents(startTime, endTime, 1, 20);
      
      console.log('Events data response:', response);
      
      if (response.success && response.data) {
        setEventsData(response.data);
        console.log(`Successfully loaded ${response.data.length} event records`);
      } else {
        console.warn('Events data fetch was not successful or returned no data');
        setError('Failed to load events data. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Error fetching events data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events data');
    } finally {
      setEventsLoading(false);
    }
  };

  // Handle lock/unlock actions with improved status checking
  const handleLockAction = async (action: 'lock' | 'unlock') => {
    if (!smartLockStatus?.deviceCode) {
      setControlMessage({
        type: 'error',
        message: 'Device code not available. Please refresh and try again.'
      });
      return;
    }

    try {
      setControlLoading(true);
      setControlMessage(null);
      
      // Set optimistic state for immediate UI feedback
      setOptimisticLockState(action === 'lock');
      
      console.log(`Attempting to ${action} device ${smartLockStatus.deviceCode}`);
      
      const response = action === 'lock' 
        ? await lockDevice(smartLockStatus.deviceCode, 'Dashboard_User')
        : await unlockDevice(smartLockStatus.deviceCode, 'Dashboard_User');
      
      console.log(`${action} command response:`, response);
      
      if (response.success) {
        setControlMessage({
          type: 'success',
          message: `${action === 'lock' ? 'Lock' : 'Unlock'} command sent successfully! Flow ID: ${response.data?.data?.data?.flowId || 'N/A'}`
        });
        
        // Wait longer for the device to process the command
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Retry status check up to 5 times with longer delays
        let retryCount = 0;
        const maxRetries = 5;
        let statusUpdated = false;
        
        while (retryCount < maxRetries && !statusUpdated) {
          try {
            console.log(`Checking device status (attempt ${retryCount + 1}/${maxRetries})...`);
            
            // Fetch fresh status
            const [realTimeResponse, statusResponse] = await Promise.all([
              getNewDeviceData(),
              getSmartLockStatus()
            ]);
            
            if (statusResponse) {
              const expectedLockState = action === 'lock';
              const actualLockState = statusResponse.security.isLocked;
              
              // Log detailed status information for debugging
              console.log(`=== Status Check Details ===`);
              console.log(`Expected lock state: ${expectedLockState}`);
              console.log(`Actual lock state: ${actualLockState}`);
              console.log(`Raw device data:`, statusResponse.rawData);
              
              // Check if we have device new vos data for more detailed logging
              if (realTimeResponse.success && realTimeResponse.data && realTimeResponse.data.length > 0) {
                const deviceData = realTimeResponse.data[0];
                console.log(`Device status string: "${deviceData.rawDeviceStatus}"`);
                console.log(`Lock status from deviceData: ${deviceData.lockStatus}`);
                console.log(`Device new vos:`, deviceData.deviceNewVos);
              }
              
              console.log(`========================`);
              
              // Check if the status matches our expectation
              if (actualLockState === expectedLockState) {
                statusUpdated = true;
                setSmartLockStatus(statusResponse);
                
                if (realTimeResponse.success && realTimeResponse.data && realTimeResponse.data.length > 0) {
                  setDeviceData(realTimeResponse.data[0]);
                }
                
                setLastUpdate(new Date());
                
                // Clear optimistic state since we have real data
                setOptimisticLockState(null);
                
                setControlMessage({
                  type: 'success',
                  message: `Device ${action}ed successfully and status confirmed!`
                });
                
                console.log(`Status successfully updated after ${retryCount + 1} attempts`);
                break;
              }
            }
            
            retryCount++;
            
            // Wait before next retry (longer delays: 5s, 10s, 15s, 20s, 25s)
            if (retryCount < maxRetries) {
              const delay = 5000 * retryCount;
              console.log(`Status not updated yet, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
          } catch (retryError) {
            console.error(`Error in status check attempt ${retryCount + 1}:`, retryError);
            retryCount++;
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
            }
          }
        }
        
        if (!statusUpdated) {
          console.warn('Device status was not confirmed after maximum retries');
          
          // Try one final manual refresh to get the latest status
          console.log('Performing final status refresh...');
          try {
            const finalStatusResponse = await getSmartLockStatus();
            if (finalStatusResponse) {
              setSmartLockStatus(finalStatusResponse);
              setLastUpdate(new Date());
              
              const finalLockState = finalStatusResponse.security.isLocked;
              const expectedLockState = action === 'lock';
              
              if (finalLockState === expectedLockState) {
                setControlMessage({
                  type: 'success',
                  message: `Device ${action}ed successfully! Status confirmed on final check.`
                });
              } else {
                setControlMessage({
                  type: 'success',
                  message: `${action === 'lock' ? 'Lock' : 'Unlock'} command sent, but device status shows ${finalLockState ? 'locked' : 'unlocked'}. The device might take more time to update or there could be a connectivity issue.`
                });
              }
            }
          } catch (finalError) {
            console.error('Final status check failed:', finalError);
            setControlMessage({
              type: 'success',
              message: `${action === 'lock' ? 'Lock' : 'Unlock'} command sent, but status confirmation timed out. Please refresh manually to check current status.`
            });
          }
          
          // Clear optimistic state
          setOptimisticLockState(null);
        }
        
      } else {
        // Clear optimistic state on failure
        setOptimisticLockState(null);
        setControlMessage({
          type: 'error',
          message: response.data?.message || `Failed to ${action} device. Please try again.`
        });
      }
    } catch (err) {
      console.error(`Error ${action}ing device:`, err);
      
      // Clear optimistic state on error
      setOptimisticLockState(null);
      
      setControlMessage({
        type: 'error',
        message: err instanceof Error ? err.message : `Failed to ${action} device`
      });
    } finally {
      setControlLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRealTimeData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'status') {
        fetchRealTimeData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'history' && historyData.length === 0) {
      fetchHistoryData();
    } else if (activeTab === 'events' && eventsData.length === 0) {
      fetchEventsData();
    }
  }, [activeTab, historyData.length, eventsData.length]);

  const handleRefresh = () => {
    if (activeTab === 'status') {
      setLoading(true);
      fetchRealTimeData();
    } else if (activeTab === 'history') {
      fetchHistoryData();
    } else if (activeTab === 'events') {
      fetchEventsData();
    }
  };

  const getBatteryIcon = (level: number, isCharging: boolean) => {
    if (isCharging) return <RiPlugLine className="text-green-400" />;
    if (level > 75) return <RiBatteryLine className="text-green-400" />;
    if (level > 50) return <RiBatteryLine className="text-yellow-400" />;
    if (level > 25) return <RiBatteryLine className="text-orange-400" />;
    return <RiBatteryLine className="text-red-400" />;
  };

  const getBatteryColor = (level: number) => {
    if (level > 75) return 'text-green-400';
    if (level > 50) return 'text-yellow-400';
    if (level > 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSecurityStatusColor = (isLocked: boolean, isDamaged: boolean, isOnline: boolean) => {
    if (!isOnline) return 'text-gray-400';
    if (isDamaged) return 'text-red-400';
    if (isLocked) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getSecurityStatusText = (isLocked: boolean, isDamaged: boolean, isOnline: boolean) => {
    if (!isOnline) return 'Offline';
    if (isDamaged) return 'Damaged';
    if (isLocked) return 'Secured';
    return 'Unlocked';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`smart-lock-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl">
            <RiLockLine className="text-2xl text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Smart Lock</h2>
            <p className="text-slate-400 text-sm">{smartLockStatus?.deviceName || 'HHD_SmartLock_001'}</p>
            <p className="text-slate-500 text-xs">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 rounded-lg transition-all ${
            loading ? 'animate-spin' : ''
          }`}
        >
          <RiRefreshLine />
        </button>
      </div>

      {/* Control Message */}
      {controlMessage && (
        <div className={`mx-6 mb-4 border rounded-xl p-4 ${
          controlMessage.type === 'success' 
            ? 'bg-emerald-900/20 border-emerald-800/50' 
            : 'bg-red-900/20 border-red-800/50'
        }`}>
          <div className="flex items-center">
            {controlMessage.type === 'success' ? (
              <RiCheckboxCircleLine className="text-emerald-400 text-lg mr-2 flex-shrink-0" />
            ) : (
              <RiErrorWarningLine className="text-red-400 text-lg mr-2 flex-shrink-0" />
            )}
            <p className={`text-sm ${controlMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
              {controlMessage.message}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 bg-red-900/20 border border-red-800/50 rounded-xl p-4">
          <div className="flex items-center">
            <RiAlertLine className="text-red-400 text-lg mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium text-sm">Error</h3>
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mx-6 mb-6">
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'status' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <RiShieldCheckLine className="mr-1.5 text-sm" />
            Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <RiHistoryLine className="mr-1.5 text-sm" />
            History
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'events' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <RiAlarmWarningLine className="mr-1.5 text-sm" />
            Events
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {activeTab === 'status' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RiLoader4Line className="text-2xl text-blue-400 animate-spin mr-2" />
                <span className="text-white text-sm">Loading...</span>
              </div>
            ) : smartLockStatus ? (
              <>
                {/* Control Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleLockAction('lock')}
                    disabled={controlLoading || !smartLockStatus.isOnline}
                    className="flex-1 flex items-center justify-center bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-600/30 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    {controlLoading ? (
                      <RiLoader4Line className="animate-spin mr-1.5 text-sm" />
                    ) : (
                      <RiLockLine className="mr-1.5 text-sm" />
                    )}
                    {controlLoading ? 'Processing...' : 'Lock'}
                  </button>
                  
                  <button
                    onClick={() => handleLockAction('unlock')}
                    disabled={controlLoading || !smartLockStatus.isOnline}
                    className="flex-1 flex items-center justify-center bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 border border-amber-600/30 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    {controlLoading ? (
                      <RiLoader4Line className="animate-spin mr-1.5 text-sm" />
                    ) : (
                      <RiLockUnlockLine className="mr-1.5 text-sm" />
                    )}
                    {controlLoading ? 'Processing...' : 'Unlock'}
                  </button>
                </div>

                {/* Current Status Display */}
                {smartLockStatus && (
                  <div className="flex items-center justify-center mb-4 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="text-slate-400 text-xs mr-2">Status:</span>
                    <span className={`font-medium text-sm ${
                      optimisticLockState !== null 
                        ? (optimisticLockState ? 'text-emerald-400' : 'text-amber-400')
                        : (smartLockStatus.security.isLocked ? 'text-emerald-400' : 'text-amber-400')
                    }`}>
                      {optimisticLockState !== null 
                        ? (optimisticLockState ? 'Locked' : 'Unlocked')
                        : (smartLockStatus.security.isLocked ? 'Locked' : 'Unlocked')
                      }
                      {optimisticLockState !== null && (
                        <span className="text-slate-500 text-xs ml-1">(Pending)</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Status Cards */}
                <div className="space-y-3">
                  {/* Security Status */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-slate-300 font-medium text-sm">Security</h3>
                      {(optimisticLockState !== null ? optimisticLockState : smartLockStatus.security.isLocked) ? (
                        <RiLockLine className={getSecurityStatusColor(
                          optimisticLockState !== null ? optimisticLockState : smartLockStatus.security.isLocked, 
                          smartLockStatus.security.isDamaged, 
                          smartLockStatus.isOnline
                        )} />
                      ) : (
                        <RiLockUnlockLine className={getSecurityStatusColor(
                          optimisticLockState !== null ? optimisticLockState : smartLockStatus.security.isLocked, 
                          smartLockStatus.security.isDamaged, 
                          smartLockStatus.isOnline
                        )} />
                      )}
                    </div>
                    <div className={`text-lg font-bold ${getSecurityStatusColor(
                      optimisticLockState !== null ? optimisticLockState : smartLockStatus.security.isLocked, 
                      smartLockStatus.security.isDamaged, 
                      smartLockStatus.isOnline
                    )}`}>
                      {getSecurityStatusText(
                        optimisticLockState !== null ? optimisticLockState : smartLockStatus.security.isLocked, 
                        smartLockStatus.security.isDamaged, 
                        smartLockStatus.isOnline
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      Signal: {smartLockStatus.security.signalStrength}%
                    </div>
                  </div>

                  {/* Battery Level */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-slate-300 font-medium text-sm">Battery</h3>
                      {getBatteryIcon(smartLockStatus.battery.level, smartLockStatus.battery.isCharging)}
                    </div>
                    <div className={`text-lg font-bold ${getBatteryColor(smartLockStatus.battery.level)}`}>
                      {smartLockStatus.battery.level}%
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {smartLockStatus.battery.isCharging ? 'Charging' : `${smartLockStatus.battery.voltage}V`}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-slate-300 font-medium text-sm">Location</h3>
                      <RiMapPinLine className="text-blue-400" />
                    </div>
                    <div className="text-white font-medium text-sm">
                      {smartLockStatus.location.latitude.toFixed(6)}, {smartLockStatus.location.longitude.toFixed(6)}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {smartLockStatus.location.address || 'Address not available'}
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <RiWifiLine className={smartLockStatus.isOnline ? 'text-emerald-400' : 'text-red-400'} />
                        <span className="text-white font-medium ml-2 text-sm">
                          {smartLockStatus.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        Last sync: {formatDateTime(smartLockStatus.lastUpdate)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No device data available</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <RiLoader4Line className="text-2xl text-blue-400 animate-spin mr-2" />
                <span className="text-white text-sm">Loading history...</span>
              </div>
            ) : historyData.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {historyData.map((record, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="text-blue-400 mr-2 mt-0.5">
                          <RiHistoryLine className="text-sm" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {record.eventType || 'Device Event'}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {formatDateTime(record.timestamp)}
                          </div>
                          {record.data && (
                            <div className="text-slate-300 text-xs mt-1">
                              {JSON.stringify(record.data)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No history data available</div>
                <button
                  onClick={fetchHistoryData}
                  className="mt-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 rounded-lg text-xs transition-all"
                >
                  Refresh History
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RiLoader4Line className="text-2xl text-blue-400 animate-spin mr-2" />
                <span className="text-white text-sm">Loading events...</span>
              </div>
            ) : eventsData.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {eventsData.map((event, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="text-amber-400 mr-2 mt-0.5">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {formatEventType(event.eventType)}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {formatDateTime(event.timestamp)}
                          </div>
                          {event.data && (
                            <div className="text-slate-300 text-xs mt-1">
                              {JSON.stringify(event.data)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No events available</div>
                <button
                  onClick={fetchEventsData}
                  className="mt-2 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 rounded-lg text-xs transition-all"
                >
                  Refresh Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartLockDashboard; 