import React from 'react';
import {
  RiTempHotLine, 
  RiWaterFlashLine,
  RiLightbulbLine,
  RiFireLine,
  RiDoorLockLine,
  RiUserLocationLine,
  RiSensorLine
} from 'react-icons/ri';

// Sensor types
type SensorType = 'temperature' | 'humidity' | 'occupancy' | 'energy' | 'water' | 'security' | 'air';

interface SensorIconProps {
  type: SensorType;
  className?: string;
}

const SensorIcon: React.FC<SensorIconProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'temperature':
      return <RiTempHotLine className={className} />;
    case 'humidity':
      return <RiWaterFlashLine className={className} />;
    case 'energy':
      return <RiLightbulbLine className={className} />;
    case 'water':
      return <RiWaterFlashLine className={className} />;
    case 'security':
      return <RiDoorLockLine className={className} />;
    case 'occupancy':
      return <RiUserLocationLine className={className} />;
    case 'air':
      return <RiFireLine className={className} />;
    default:
      return <RiSensorLine className={className} />;
  }
};

export default SensorIcon; 