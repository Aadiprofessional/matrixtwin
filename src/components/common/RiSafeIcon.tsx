import React from 'react';
import * as Ri from 'react-icons/ri';
import { IconType } from 'react-icons';

// Map of all Remix icons we're using
const iconMap: { [key: string]: IconType } = {
  // User icons
  RiUser3Line: Ri.RiUser3Line,
  RiUserLine: Ri.RiUserLine,
  RiUserSettingsLine: Ri.RiUserSettingsLine,
  RiUserStarLine: Ri.RiUserStarLine,
  RiUserAddLine: Ri.RiUserAddLine,
  RiUserReceivedLine: Ri.RiUserReceivedLine,
  
  // UI Navigation
  RiArrowLeftLine: Ri.RiArrowLeftLine,
  RiArrowRightLine: Ri.RiArrowRightLine,
  RiArrowLeftSLine: Ri.RiArrowLeftSLine,
  RiArrowRightSLine: Ri.RiArrowRightSLine,
  RiArrowDownSLine: Ri.RiArrowDownSLine,
  RiCloseLine: Ri.RiCloseLine,
  RiMenuLine: Ri.RiMenuLine,
  RiSearchLine: Ri.RiSearchLine,
  RiFilterLine: Ri.RiFilterLine,
  RiMore2Line: Ri.RiMore2Line,
  RiMore2Fill: Ri.RiMore2Fill,
  RiCheckLine: Ri.RiCheckLine,
  
  // Dashboard/Navigation
  RiDashboardLine: Ri.RiDashboardLine,
  RiBarChartLine: Ri.RiBarChartLine,
  RiBarChartBoxLine: Ri.RiBarChartBoxLine,
  RiLineChartLine: Ri.RiLineChartLine,
  RiPieChartLine: Ri.RiPieChartLine,
  RiApps2Line: Ri.RiApps2Line,
  
  // Notification
  RiBellLine: Ri.RiBellLine,
  RiNotification3Line: Ri.RiNotification3Line,
  RiAlarmWarningLine: Ri.RiAlarmWarningLine,
  
  // Form/Document
  RiFileList3Line: Ri.RiFileList3Line,
  RiQuestionLine: Ri.RiQuestionLine,
  RiQuestionnaireLine: Ri.RiQuestionnaireLine,
  RiFileTextLine: Ri.RiFileTextLine,
  RiFileUserLine: Ri.RiFileUserLine,
  
  // Interface/Settings
  RiSettings3Line: Ri.RiSettings3Line,
  RiPaintLine: Ri.RiPaintLine,
  RiEyeLine: Ri.RiEyeLine,
  RiEyeOffLine: Ri.RiEyeOffLine,
  RiTranslate2: Ri.RiTranslate2,
  RiGlobalLine: Ri.RiGlobalLine,
  RiShieldLine: Ri.RiShieldLine,
  RiShieldCheckLine: Ri.RiShieldCheckLine,
  RiLogoutBoxRLine: Ri.RiLogoutBoxRLine,
  
  // Project management
  RiBuilding4Line: Ri.RiBuilding4Line,
  RiTeamLine: Ri.RiTeamLine,
  RiGroupLine: Ri.RiGroupLine,
  RiCalendarTodoLine: Ri.RiCalendarTodoLine,
  RiCalendarLine: Ri.RiCalendarLine,
  RiCalendarCheckLine: Ri.RiCalendarCheckLine,
  RiTimeLine: Ri.RiTimeLine,
  
  // Communication
  RiMailLine: Ri.RiMailLine,
  RiContactsLine: Ri.RiContactsLine,
  RiPhoneLine: Ri.RiPhoneLine,
  
  // Actions
  RiAddLine: Ri.RiAddLine,
  RiUpload2Line: Ri.RiUpload2Line,
  RiEditLine: Ri.RiEditLine,
  RiPencilLine: Ri.RiPencilLine,
  RiDeleteBinLine: Ri.RiDeleteBinLine,
  RiDeleteBin6Line: Ri.RiDeleteBin6Line,
  RiRefreshLine: Ri.RiRefreshLine,
  
  // Theme
  RiSunLine: Ri.RiSunLine,
  RiMoonLine: Ri.RiMoonLine,
  
  // Misc
  RiInboxLine: Ri.RiInboxLine,
  RiRobot2Line: Ri.RiRobot2Line,
  RiBrainLine: Ri.RiBrainLine,
  RiHome2Line: Ri.RiHome2Line,
  RiBrushLine: Ri.RiBrushLine,
  RiBookmarkLine: Ri.RiBookmarkLine,
  RiDragMove2Line: Ri.RiDragMove2Line,
  RiLockLine: Ri.RiLockLine,
  
  // Additional icons
  RiInformationLine: Ri.RiInformationLine,
  RiCalendarEventLine: Ri.RiCalendarEventLine,
  RiCalendarCheckFill: Ri.RiCalendarCheckFill,
};

interface RiSafeIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
  size?: string | number;
  color?: string;
}

/**
 * A safer way to use React Icons without TypeScript errors
 * 
 * @param props Component props
 * @returns A React element with the specified icon
 */
const RiSafeIcon: React.FC<RiSafeIconProps> = ({
  name,
  className,
  style,
  onClick,
  title,
  size,
  color
}) => {
  const Icon = iconMap[name];
  
  if (!Icon) {
    console.warn(`Icon ${name} not found`);
    return null;
  }
  
  // Convert size to string if it's a number
  const sizeStr = size !== undefined ? String(size) : undefined;
  
  return (
    <span 
      className={className} 
      style={style} 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* @ts-ignore - React icons need this workaround for TypeScript */}
      <Icon size={sizeStr} color={color} title={title} />
    </span>
  );
};

export default RiSafeIcon; 