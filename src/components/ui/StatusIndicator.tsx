import React from 'react';
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiAlarmWarningLine
} from 'react-icons/ri';

// Sensor status
export type SensorStatus = 'online' | 'offline' | 'warning' | 'critical';

interface StatusIndicatorProps {
  status: SensorStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  let color = '';
  let icon = null;
  
  switch (status) {
    case 'online':
      color = 'bg-green-500';
      icon = <RiCheckboxCircleLine className="text-green-500" />;
      break;
    case 'offline':
      color = 'bg-gray-500';
      icon = <RiCloseCircleLine className="text-gray-500" />;
      break;
    case 'warning':
      color = 'bg-yellow-500';
      icon = <RiAlertLine className="text-yellow-500" />;
      break;
    case 'critical':
      color = 'bg-red-500';
      icon = <RiAlarmWarningLine className="text-red-500" />;
      break;
  }
  
  return (
    <div className="flex items-center">
      <div className={`w-2 h-2 rounded-full ${color} mr-1.5`}></div>
      <span className="text-sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
};

export default StatusIndicator; 