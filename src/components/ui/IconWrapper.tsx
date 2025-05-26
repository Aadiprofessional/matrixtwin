import React from 'react';
import * as Ri from 'react-icons/ri';
import { IconContext, IconType } from 'react-icons';

// Dictionary mapping icon names to actual icon components
const iconMap: {[key: string]: IconType} = {
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
  RiBuilding3Line: Ri.RiBuilding3Line,
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
  
  // RFI Form Icons
  RiExchangeLine: Ri.RiExchangeLine,
  RiSwapBoxLine: Ri.RiSwapBoxLine,
  RiCheckboxMultipleLine: Ri.RiCheckboxMultipleLine,
  
  // Activity Icons
  RiBrushLine: Ri.RiBrushLine,
  RiBookmarkLine: Ri.RiBookmarkLine,
  RiCamera2Line: Ri.RiCamera2Line,
  RiSpeedLine: Ri.RiSpeedLine,
  
  // Misc
  RiRobot2Line: Ri.RiRobot2Line,
  RiBrainLine: Ri.RiBrainLine,
  RiHome2Line: Ri.RiHome2Line,
  RiDragMove2Line: Ri.RiDragMove2Line,
  RiMore2Fill: Ri.RiMore2Fill,
  RiLockLine: Ri.RiLockLine,
  
  // Voice and audio icons
  RiVolumeUpLine: Ri.RiVolumeUpLine,
  RiVolumeMuteLine: Ri.RiVolumeMuteLine,
  RiMicLine: Ri.RiMicLine,
  RiMicOffLine: Ri.RiMicOffLine,
  RiSendPlaneLine: Ri.RiSendPlaneLine,
  RiMessageLine: Ri.RiMessageLine,
  RiInformationLine: Ri.RiInformationLine,
  RiLoader4Line: Ri.RiLoader4Line,
  RiWifiLine: Ri.RiWifiLine,
  RiWifiOffLine: Ri.RiWifiOffLine,
  RiErrorWarningLine: Ri.RiErrorWarningLine,
};

interface IconWrapperProps {
  icon: string;
  className?: string;
}

/**
 * A component that renders any React Icon safely
 * This component takes the icon name as a string and renders the corresponding icon
 * 
 * @param props The component props
 * @returns A React element containing the rendered icon
 */
export const IconWrapper = ({ icon, className = '' }: IconWrapperProps) => {
  const IconComponent = iconMap[icon];
  
  if (!IconComponent) {
    console.warn(`Icon ${icon} not found in iconMap`);
    return null;
  }
  
  return (
    <span className={className}>
      <IconContext.Provider value={{ className }}>
        {/* @ts-ignore - Required to render React Icons properly */}
        <IconComponent />
      </IconContext.Provider>
    </span>
  );
};

export default IconWrapper; 