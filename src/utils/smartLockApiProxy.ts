import { apiRequest } from './api';

// Updated interfaces based on actual API responses
export interface DeviceData {
  deviceCode: string;
  deviceName: string;
  isOnline: boolean;
  lastDataTime: string;
  latitude: number;
  longitude: number;
  batteryLevel: number;
  batteryVoltage: number;
  isCharging: boolean;
  lockStatus: number;
  damageStatus: number;
  signalStrength: number;
  address?: string;
  deviceNewVos?: Array<{
    key: string;
    name: string;
    value: string;
  }>;
  [key: string]: any;
}

export interface HistoryRecord {
  id: string;
  deviceCode: string;
  deviceName: string;
  dataTime: string;
  time: number;
  latitude: number;
  longitude: number;
  lat: string;
  lng: string;
  batteryLevel: number;
  battery: number;
  batteryVoltage?: number;
  lockStatus: number;
  damageStatus: number;
  signalStrength: number;
  deviceStatus: string;
  deviceWarning: string;
  direction: number;
  speed: number;
  attributes?: string;
  [key: string]: any;
}

export interface DeviceEvent {
  id: string;
  deviceCode: string;
  deviceName: string;
  eventType: number;
  eventId: string;
  eventName: string;
  eventTime: string;
  createTime: string;
  upTime: number;
  gpsTime: number;
  deviceStatus: string;
  battery: number;
  lat: string;
  lng: string;
  icCard?: string;
  description?: string;
  [key: string]: any;
}

export interface SmartLockStatus {
  deviceCode: string;
  deviceName: string;
  isOnline: boolean;
  lastUpdate: string;
  battery: {
    level: number;
    voltage: number;
    isCharging: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  security: {
    isLocked: boolean;
    isDamaged: boolean;
    signalStrength: number;
  };
  rawData: any;
}

// Utility function to parse device status string
const parseDeviceStatusString = (statusString: string): {
  isLocked: boolean;
  isDamaged: boolean;
  signalStrength: number;
} => {
  const statuses = statusString ? statusString.split(',') : [];
  
  console.log(`Parsing device status string: "${statusString}"`);
  console.log(`Status array:`, statuses);
  
  // Check for lock status - need to understand the actual status codes
  // Common lock status codes might include:
  // - status_30: Device Locked
  // - status_50: Lock Secured  
  // - status_20: Unlocked/Open
  // - status_10: Unlocked/Available
  
  const lockStatuses = statuses.filter(status => 
    status.includes('status_30') || 
    status.includes('status_50') ||
    status.includes('status_20') ||
    status.includes('status_10') ||
    status.includes('lock') ||
    status.includes('unlock')
  );
  
  console.log(`Lock-related statuses found:`, lockStatuses);
  
  // Assume locked if we find status_30 or status_50
  // Assume unlocked if we find status_20 or status_10 without lock indicators
  const hasLockIndicator = statuses.some(status => 
    status.includes('status_30') || status.includes('status_50')
  );
  
  const hasUnlockIndicator = statuses.some(status => 
    status.includes('status_20') || status.includes('status_10')
  );
  
  // Default logic: if we have lock indicators, it's locked
  // If we have unlock indicators without lock indicators, it's unlocked
  // If we have both or neither, default to the original logic
  let isLocked;
  if (hasLockIndicator && !hasUnlockIndicator) {
    isLocked = true;
  } else if (hasUnlockIndicator && !hasLockIndicator) {
    isLocked = false;
  } else {
    // Fallback to original logic
    isLocked = statuses.some(status => 
      status.includes('status_30') || status.includes('status_50')
    );
  }
  
  console.log(`Lock status determination: hasLockIndicator=${hasLockIndicator}, hasUnlockIndicator=${hasUnlockIndicator}, isLocked=${isLocked}`);
  
  // Check for damage status
  const isDamaged = statuses.some(status => 
    status.includes('damage') || status.includes('broken')
  );
  
  // Extract signal strength (simplified)
  let signalStrength = 75; // Default value
  const signalStatus = statuses.find(status => status.includes('signal'));
  if (signalStatus) {
    const match = signalStatus.match(/\d+/);
    if (match) {
      signalStrength = parseInt(match[0]);
    }
  }
  
  const result = { isLocked, isDamaged, signalStrength };
  console.log(`Final parsed result:`, result);
  
  return result;
};

// API functions using correct endpoints
export const getDeviceInfo = async (): Promise<any> => {
  try {
    const response = await apiRequest('/smartlock/device-info');
    return response;
  } catch (error) {
    console.error('Error fetching device info:', error);
    throw error;
  }
};

export const getNewDeviceData = async (): Promise<{ success: boolean; data: DeviceData[] }> => {
  try {
    const response = await apiRequest('/smartlock/latest-data', {
      method: 'POST',
      body: JSON.stringify({
        deviceCodes: ["019072654811"] // Default device code
      })
    });
    
    if (response.success && response.data?.data?.length > 0) {
      const transformedData = response.data.data.map((device: any) => {
        const deviceNewVos = device.deviceNewVos || [];
        
        // Extract data from deviceNewVos array
        const getValueByKey = (key: string): string => {
          const item = deviceNewVos.find((item: any) => item.key === key);
          return item ? item.value : '';
        };
        
        const lat = parseFloat(getValueByKey('lat')) || 0;
        const lng = parseFloat(getValueByKey('lng')) || 0;
        const battery = parseInt(getValueByKey('battery')) || 0;
        const voltage = parseFloat(getValueByKey('para_0x94')) || 0;
        const deviceStatus = getValueByKey('deviceStatus') || '';
        
        const statusInfo = parseDeviceStatusString(deviceStatus);
        
        return {
          deviceCode: device.deviceCode,
          deviceName: device.deviceCode,
          isOnline: true, // Assume online if we got data
          lastDataTime: new Date(parseInt(getValueByKey('time')) || Date.now()).toISOString(),
          latitude: lat,
          longitude: lng,
          batteryLevel: battery,
          batteryVoltage: voltage,
          isCharging: false, // Would need specific status to determine
          lockStatus: statusInfo.isLocked ? 1 : 0,
          damageStatus: statusInfo.isDamaged ? 1 : 0,
          signalStrength: statusInfo.signalStrength,
          deviceNewVos: deviceNewVos,
          rawDeviceStatus: deviceStatus
        };
      });
      
      return { success: true, data: transformedData };
    }
    
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error fetching new device data:', error);
    throw error;
  }
};

export const getHistoryData = async (
  startTime?: string,
  endTime?: string,
  pageIndex: number = 1,
  pageSize: number = 20
): Promise<{ success: boolean; data: HistoryRecord[] }> => {
  try {
    const requestBody: any = {
      curPage: pageIndex,
      pageSize: pageSize,
      deviceCodes: ["019072654811"],
      dataType: 0
    };
    
    if (startTime) {
      requestBody.gpsStartTime = startTime;
    }
    if (endTime) {
      requestBody.gpsEndTime = endTime;
    }
    
    console.log('History data request body:', requestBody);
    
    const response = await apiRequest('/smartlock/history-data', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    console.log('History data response:', response);
    
    if (response.success && response.data?.data?.records) {
      const transformedData = response.data.data.records.map((record: any, index: number) => {
        const statusInfo = parseDeviceStatusString(record.deviceStatus || '');
        
        return {
          id: `${record.deviceCode}-${record.time}-${index}`,
          deviceCode: record.deviceCode,
          deviceName: record.deviceName || record.deviceCode,
          dataTime: new Date(record.time).toISOString(),
          time: record.time,
          latitude: parseFloat(record.lat) || 0,
          longitude: parseFloat(record.lng) || 0,
          lat: record.lat,
          lng: record.lng,
          batteryLevel: record.battery || 0,
          battery: record.battery || 0,
          batteryVoltage: 0, // Not provided in history data
          lockStatus: statusInfo.isLocked ? 1 : 0,
          damageStatus: statusInfo.isDamaged ? 1 : 0,
          signalStrength: statusInfo.signalStrength,
          deviceStatus: record.deviceStatus,
          deviceWarning: record.deviceWarning || '',
          direction: record.direction || 0,
          speed: record.speed || 0,
          attributes: record.attributes
        };
      });
      
      return { success: true, data: transformedData };
    }
    
    console.warn('History data response format unexpected:', response);
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error fetching history data:', error);
    
    // If it's a 500 error, try to provide more helpful error message
    if (error instanceof Error && error.message.includes('500')) {
      console.error('Server error - this might be due to authentication or server configuration issues');
    }
    
    // Return empty data instead of throwing to prevent UI crashes
    return { success: false, data: [] };
  }
};

export const getDeviceEvents = async (
  startTime?: string,
  endTime?: string,
  pageIndex: number = 1,
  pageSize: number = 20
): Promise<{ success: boolean; data: DeviceEvent[] }> => {
  try {
    const requestBody: any = {
      curPage: pageIndex,
      pageSize: pageSize,
      deviceCodes: ["019072654811"]
    };
    
    if (startTime) {
      requestBody.gpsStartTime = startTime;
    }
    if (endTime) {
      requestBody.gpsEndTime = endTime;
    }
    
    console.log('Events data request body:', requestBody);
    
    const response = await apiRequest('/smartlock/event-list', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    
    console.log('Events data response:', response);
    
    if (response.success && response.data?.data) {
      const events = Array.isArray(response.data.data) ? response.data.data : [];
      
      const transformedData = events.map((event: any, index: number) => ({
        id: `${event.deviceCode}-${event.upTime}-${index}`,
        deviceCode: event.deviceCode,
        deviceName: event.deviceName || event.deviceCode,
        eventType: event.eventType.toString(),
        eventId: event.eventId,
        eventName: event.eventName,
        eventTime: new Date(event.gpsTime).toISOString(),
        createTime: event.createTime,
        upTime: event.upTime,
        gpsTime: event.gpsTime,
        deviceStatus: event.deviceStatus,
        battery: event.battery,
        lat: event.lat,
        lng: event.lng,
        icCard: event.icCard,
        description: event.eventName
      }));
      
      return { success: true, data: transformedData };
    }
    
    console.warn('Events data response format unexpected:', response);
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error fetching device events:', error);
    
    // If it's a 500 error, try to provide more helpful error message
    if (error instanceof Error && error.message.includes('500')) {
      console.error('Server error - this might be due to authentication or server configuration issues');
    }
    
    // Return empty data instead of throwing to prevent UI crashes
    return { success: false, data: [] };
  }
};

export const getSmartLockStatus = async (): Promise<SmartLockStatus | null> => {
  try {
    const response = await apiRequest('/smartlock/status');
    
    if (response.success && response.data) {
      const data = response.data;
      const deviceInfo = data.deviceInfo?.data;
      const latestData = data.latestData?.data?.[0];
      
      if (!deviceInfo || !latestData) {
        return null;
      }
      
      // Extract latest sensor data
      const deviceNewVos = latestData.deviceNewVos || [];
      const getValueByKey = (key: string): string => {
        const item = deviceNewVos.find((item: any) => item.key === key);
        return item ? item.value : '';
      };
      
      const lat = parseFloat(getValueByKey('lat')) || 0;
      const lng = parseFloat(getValueByKey('lng')) || 0;
      const battery = parseInt(getValueByKey('battery')) || 0;
      const voltage = parseFloat(getValueByKey('para_0x94')) || 0;
      const deviceStatus = getValueByKey('deviceStatus') || '';
      
      const statusInfo = parseDeviceStatusString(deviceStatus);
      
      return {
        deviceCode: data.deviceCode,
        deviceName: data.deviceName,
        isOnline: deviceInfo.online === 1,
        lastUpdate: new Date(parseInt(getValueByKey('time')) || Date.now()).toISOString(),
        battery: {
          level: battery,
          voltage: voltage,
          isCharging: false // Would need specific status to determine
        },
        location: {
          latitude: lat,
          longitude: lng,
          address: 'Location not available' // API doesn't provide address
        },
        security: {
          isLocked: statusInfo.isLocked,
          isDamaged: statusInfo.isDamaged,
          signalStrength: statusInfo.signalStrength
        },
        rawData: data
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching smart lock status:', error);
    throw error;
  }
};

export const getSmartLockConfig = async (): Promise<{ success: boolean; data: { deviceCode: string; deviceName: string; baseUrl: string } }> => {
  try {
    const response = await apiRequest('/smartlock/config');
    return response;
  } catch (error) {
    console.error('Error fetching smart lock config:', error);
    throw error;
  }
};

// Lock/Unlock control functions
export const unlockDevice = async (deviceCode?: string, userName?: string): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await apiRequest('/smartlock/unlock', {
      method: 'POST',
      body: JSON.stringify({
        deviceCode: deviceCode || "019072654811",
        userName: userName || "API_User"
      })
    });
    return response;
  } catch (error) {
    console.error('Error unlocking device:', error);
    throw error;
  }
};

export const lockDevice = async (deviceCode?: string, userName?: string): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await apiRequest('/smartlock/lock', {
      method: 'POST',
      body: JSON.stringify({
        deviceCode: deviceCode || "019072654811",
        userName: userName || "API_User"
      })
    });
    return response;
  } catch (error) {
    console.error('Error locking device:', error);
    throw error;
  }
};

// Helper functions
export const parseDeviceStatus = (statusCode: string): string => {
  const statusMap: { [key: string]: string } = {
    'status_10': 'GPS Active',
    'status_20': 'GPRS Connected',
    'status_30': 'Device Locked',
    'status_40': 'Power Normal',
    'status_50': 'Lock Secured',
    'status_60': 'Signal Good',
    'status_61': 'Signal Weak',
    'status_141': 'Battery Normal',
    'status_151': 'System Normal',
    'status_161700': 'Location Updated',
    'status_181900': 'Status Normal',
    'status_202101': 'Device Active'
  };
  
  return statusMap[statusCode] || statusCode;
};

export const getBatteryLevel = (data: DeviceData): number => {
  return data.batteryLevel || 0;
};

export const getLocation = (data: DeviceData): { lat: number; lng: number; address?: string } => {
  return {
    lat: data.latitude || 0,
    lng: data.longitude || 0,
    address: data.address
  };
};

export const isDeviceOnline = (data: DeviceData): boolean => {
  return data.isOnline || false;
};

export const isLockSecured = (data: DeviceData): boolean => {
  return data.lockStatus === 1;
};

export const isLockDamaged = (data: DeviceData): boolean => {
  return data.damageStatus === 1;
};

export const getSignalStrength = (data: DeviceData): number => {
  return data.signalStrength || 0;
};

export const formatEventType = (eventType: string | number): string => {
  const eventMap: { [key: string]: string } = {
    '2': 'Lock Event',
    'event_0x0007': 'Platform Lock Success',
    'event_0x0008': 'Platform Unlock Success',
    'event_0x001E': 'Charging Started',
    'event_0x001F': 'Charging Stopped',
    'event_0x0020': 'Lock Opened',
    'event_0x0021': 'Lock Closed',
    'event_0x0022': 'Low Battery Alert',
    'event_0x0023': 'GPS Signal Lost',
    'event_0x0024': 'Device Reconnected',
    'event_0x0025': 'Unauthorized Access Attempt',
    'event_0x0026': 'System Maintenance',
    'event_0x0027': 'Firmware Update'
  };
  
  const key = eventType.toString();
  return eventMap[key] || `Event ${key}`;
};

export const getEventIcon = (eventType: string | number): string => {
  const iconMap: { [key: string]: string } = {
    '2': '🔒',
    'event_0x0007': '🔒', // Platform Lock Success
    'event_0x0008': '🔓', // Platform Unlock Success
    'event_0x001E': '🔌', // Charging Started
    'event_0x001F': '🔋', // Charging Stopped
    'event_0x0020': '🔓', // Lock Opened
    'event_0x0021': '🔒', // Lock Closed
    'event_0x0022': '⚠️', // Low Battery Alert
    'event_0x0023': '📡', // GPS Signal Lost
    'event_0x0024': '✅', // Device Reconnected
    'event_0x0025': '🚨', // Unauthorized Access Attempt
    'event_0x0026': '🔧', // System Maintenance
    'event_0x0027': '⬆️'  // Firmware Update
  };
  
  const key = eventType.toString();
  return iconMap[key] || '📋';
}; 