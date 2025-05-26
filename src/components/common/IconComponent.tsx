import React from 'react';
import { IconContext, IconType } from 'react-icons';

interface IconComponentProps {
  icon: IconType;
  className?: string;
  color?: string;
  size?: string | number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * A wrapper component for React Icons that ensures they work properly with TypeScript
 * by wrapping them in an IconContext.Provider
 */
const IconComponent: React.FC<IconComponentProps> = ({ 
  icon: Icon, 
  className = '',
  color,
  size,
  style,
  onClick
}) => {
  // Convert size to string when it's a number
  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  
  return (
    <span className={className} onClick={onClick} style={style}>
      <IconContext.Provider value={{ color, size: sizeValue, className }}>
        {/* @ts-ignore - This is necessary to make React Icons work with TypeScript */}
        <Icon />
      </IconContext.Provider>
    </span>
  );
};

export default IconComponent; 