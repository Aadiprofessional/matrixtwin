// Smart Lock API utilities for IoT device management
const API_BASE_URL = 'http://api.hhdlink.top/hhdApi/public/api';
const ACCESS_KEY_ID = 'r7eD1NS7mJW3GNS3';
const ACCESS_SECRET = 'q6hr8k24Zp78jlFDrSO5qrNgvexql628';

// Device information
export const SMART_LOCK_DEVICE = {
  deviceCode: '019072654811',
  name: 'MatrixTwin001',
  companyId: 22222
};

// API headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'accessKeyId': ACCESS_KEY_ID,
  'accessSecret': ACCESS_SECRET
});

// Device status mapping
export const DEVICE_STATUS_MAP: { [key: string]: string } = {
  'status_10': 'GPS定位',
  'status_20': '北斗定位',
  'status_30': '基站定位',
  'status_40': '设备在线',
  'status_50': '设备离线',
  'status_61': '锁杆正常',
  'status_141': '锁杆被破坏',
  'status_151': '锁杆施封',
  'status_161700': '锁杆未施封',
  'status_161701': '锁杆施封状态',
  'status_181900': '充电状态',
  'status_202101': '正常工作模式'
};

// Event mapping
export const EVENT_MAP: { [key: string]: string } = {
  'event_0x001E': '拔除充电器',
  'event_0x001F': '连接充电器充电'
};

// Types
export interface DeviceData {
  deviceCode: string;
  deviceNewVos: Array<{
    key: string;
    name: string;
    value: string;
  }>;
}

export interface HistoryRecord {
  deviceCode: string;
  deviceName: string;
  battery: number;
  deviceStatus: string;
  deviceWarning: string;
  lat: string;
  lng: string;
  time: number;
  direction: number;
  speed: number;
}

export interface DeviceEvent {
  deviceName: string;
  createTime: string;
  deviceCode: string;
  eventType: number;
  eventId: string;
  eventName: string;
  deviceStatus: string;
  battery: number;
  lat: string;
  lng: string;
}

// Get device page information
export const getDevicePage = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/iotDevice/page`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        curPage: 1,
        pageSize: 10,
        name: SMART_LOCK_DEVICE.name,
        deviceCode: SMART_LOCK_DEVICE.deviceCode,
        companyId: SMART_LOCK_DEVICE.companyId,
        online: 0
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching device page:', error);
    throw error;
  }
};

// Get real-time device data
export const getNewDeviceData = async (): Promise<DeviceData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/iotDeviceData/getNewDataByDeviceCodes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify([SMART_LOCK_DEVICE.deviceCode])
    });

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching new device data:', error);
    throw error;
  }
};

// Get historical data
export const getHistoryData = async (startTime?: number, endTime?: number, pageSize: number = 10) => {
  try {
    const now = Date.now();
    const defaultStartTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const response = await fetch(`${API_BASE_URL}/iotDeviceData/getHistoryData`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        curPage: 1,
        pageSize,
        deviceCodes: [SMART_LOCK_DEVICE.deviceCode],
        dataType: 0,
        gpsStartTime: startTime || defaultStartTime,
        gpsEndTime: endTime || now
      })
    });

    const result = await response.json();
    return result.data || { records: [], total: 0 };
  } catch (error) {
    console.error('Error fetching history data:', error);
    throw error;
  }
};

// Get device events
export const getDeviceEvents = async (startTime?: number, endTime?: number, pageSize: number = 10) => {
  try {
    const now = Date.now();
    const defaultStartTime = now - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const response = await fetch(`${API_BASE_URL}/iotDeviceData/getEventList`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        curPage: 1,
        pageSize,
        deviceCodes: [SMART_LOCK_DEVICE.deviceCode],
        startTime: startTime || defaultStartTime,
        endTime: endTime || now,
        eventType: 0
      })
    });

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching device events:', error);
    throw error;
  }
};

// Parse device status
export const parseDeviceStatus = (statusString: string): string[] => {
  if (!statusString) return [];
  return statusString.split(',').map(status => 
    DEVICE_STATUS_MAP[status] || status
  );
};

// Get battery level from device data
export const getBatteryLevel = (deviceData: DeviceData): number => {
  const batteryItem = deviceData.deviceNewVos?.find(item => item.key === 'battery');
  return batteryItem ? parseInt(batteryItem.value) : -1;
};

// Get location from device data
export const getLocation = (deviceData: DeviceData): { lat: number; lng: number } => {
  const latItem = deviceData.deviceNewVos?.find(item => item.key === 'lat');
  const lngItem = deviceData.deviceNewVos?.find(item => item.key === 'lng');
  
  return {
    lat: latItem ? parseFloat(latItem.value) : 0,
    lng: lngItem ? parseFloat(lngItem.value) : 0
  };
};

// Check if device is online
export const isDeviceOnline = (statusString: string): boolean => {
  return statusString?.includes('status_40') || false;
};

// Check if lock is secured
export const isLockSecured = (statusString: string): boolean => {
  return statusString?.includes('status_151') || false;
};

// Check if lock is damaged
export const isLockDamaged = (statusString: string): boolean => {
  return statusString?.includes('status_141') || false;
}; 