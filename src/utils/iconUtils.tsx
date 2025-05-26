import React, { ReactNode } from 'react';
import * as Ri from 'react-icons/ri';
import { IconContext, IconType } from 'react-icons';

/**
 * Utility function to properly render React Icons
 * This solves the error where React Icons are not valid JSX elements
 * 
 * @param Icon The React Icon component to render
 * @param props Additional props to pass to the icon container
 * @param iconProps Props to pass to the IconContext.Provider
 * @returns A properly wrapped React element containing the icon
 */
export function renderIcon(Icon: IconType, props: React.HTMLAttributes<HTMLDivElement> = {}, iconProps = {}): React.ReactElement {
  return (
    <div {...props}>
      <IconContext.Provider value={iconProps}>
        {/* @ts-ignore - Required to render React Icons properly */}
        <Icon />
      </IconContext.Provider>
    </div>
  );
}

/**
 * Simplified icon renderer that just returns the icon wrapped in a provider
 */
export function icon(Icon: IconType, iconProps = {}): React.ReactElement {
  return (
    <IconContext.Provider value={iconProps}>
      {/* @ts-ignore - Required to render React Icons properly */}
      <Icon />
    </IconContext.Provider>
  );
}

/**
 * A helper object that creates pre-wrapped icon components
 * 
 * Allows for easier importing and usage of commonly used icons
 * Example: `import { Icons } from '../utils/iconUtils'; ... <Icons.RiUserLine />`
 */
export const Icons = {
  // User icons
  RiUser3Line: (props: any) => renderIcon(Ri.RiUser3Line, props),
  RiUserLine: (props: any) => renderIcon(Ri.RiUserLine, props),
  RiUserSettingsLine: (props: any) => renderIcon(Ri.RiUserSettingsLine, props),
  RiUserStarLine: (props: any) => renderIcon(Ri.RiUserStarLine, props),
  RiUserAddLine: (props: any) => renderIcon(Ri.RiUserAddLine, props),
  RiUserReceivedLine: (props: any) => renderIcon(Ri.RiUserReceivedLine, props),
  
  // UI navigation
  RiArrowLeftLine: (props: any) => renderIcon(Ri.RiArrowLeftLine, props),
  RiArrowRightLine: (props: any) => renderIcon(Ri.RiArrowRightLine, props),
  RiArrowLeftSLine: (props: any) => renderIcon(Ri.RiArrowLeftSLine, props),
  RiArrowRightSLine: (props: any) => renderIcon(Ri.RiArrowRightSLine, props),
  RiArrowDownSLine: (props: any) => renderIcon(Ri.RiArrowDownSLine, props),
  RiCloseLine: (props: any) => renderIcon(Ri.RiCloseLine, props),
  RiMenuLine: (props: any) => renderIcon(Ri.RiMenuLine, props),
  RiMoreLine: (props: any) => renderIcon(Ri.RiMore2Line, props),
  RiMore2Line: (props: any) => renderIcon(Ri.RiMore2Line, props),
  RiMore2Fill: (props: any) => renderIcon(Ri.RiMore2Fill, props),
  RiCheckLine: (props: any) => renderIcon(Ri.RiCheckLine, props),
  RiFilterLine: (props: any) => renderIcon(Ri.RiFilterLine, props),
  
  // Dashboard / Navigation
  RiDashboardLine: (props: any) => renderIcon(Ri.RiDashboardLine, props),
  RiBarChartLine: (props: any) => renderIcon(Ri.RiBarChartLine, props),
  RiBarChartBoxLine: (props: any) => renderIcon(Ri.RiBarChartBoxLine, props),
  RiLineChartLine: (props: any) => renderIcon(Ri.RiLineChartLine, props),
  RiPieChartLine: (props: any) => renderIcon(Ri.RiPieChartLine, props),
  RiAppLine: (props: any) => renderIcon(Ri.RiApps2Line, props),
  RiApps2Line: (props: any) => renderIcon(Ri.RiApps2Line, props),
  
  // Notification
  RiBellLine: (props: any) => renderIcon(Ri.RiBellLine, props),
  RiNotificationLine: (props: any) => renderIcon(Ri.RiNotification3Line, props),
  RiNotification3Line: (props: any) => renderIcon(Ri.RiNotification3Line, props),
  RiAlarmWarningLine: (props: any) => renderIcon(Ri.RiAlarmWarningLine, props),
  
  // Form / Document
  RiFileList3Line: (props: any) => renderIcon(Ri.RiFileList3Line, props),
  RiQuestionLine: (props: any) => renderIcon(Ri.RiQuestionLine, props),
  RiQuestionnaireLine: (props: any) => renderIcon(Ri.RiQuestionnaireLine, props),
  RiFileTextLine: (props: any) => renderIcon(Ri.RiFileTextLine, props),
  RiFileUserLine: (props: any) => renderIcon(Ri.RiFileUserLine, props),
  
  // Interface / Settings
  RiSettings3Line: (props: any) => renderIcon(Ri.RiSettings3Line, props),
  RiPaintLine: (props: any) => renderIcon(Ri.RiPaintLine, props),
  RiEyeLine: (props: any) => renderIcon(Ri.RiEyeLine, props),
  RiEyeOffLine: (props: any) => renderIcon(Ri.RiEyeOffLine, props),
  RiTranslate2: (props: any) => renderIcon(Ri.RiTranslate2, props),
  RiGlobalLine: (props: any) => renderIcon(Ri.RiGlobalLine, props),
  RiShieldLine: (props: any) => renderIcon(Ri.RiShieldLine, props),
  RiShieldCheckLine: (props: any) => renderIcon(Ri.RiShieldCheckLine, props),
  RiLogoutBoxRLine: (props: any) => renderIcon(Ri.RiLogoutBoxRLine, props),
  
  // Project management
  RiBuilding4Line: (props: any) => renderIcon(Ri.RiBuilding4Line, props),
  RiTeamLine: (props: any) => renderIcon(Ri.RiTeamLine, props),
  RiGroupLine: (props: any) => renderIcon(Ri.RiGroupLine, props),
  RiCalendarTodoLine: (props: any) => renderIcon(Ri.RiCalendarTodoLine, props),
  RiCalendarLine: (props: any) => renderIcon(Ri.RiCalendarLine, props),
  RiCalendarCheckLine: (props: any) => renderIcon(Ri.RiCalendarCheckLine, props),
  RiTimeLine: (props: any) => renderIcon(Ri.RiTimeLine, props),
  
  // Communication
  RiMailLine: (props: any) => renderIcon(Ri.RiMailLine, props),
  RiContactsLine: (props: any) => renderIcon(Ri.RiContactsLine, props),
  RiPhoneLine: (props: any) => renderIcon(Ri.RiPhoneLine, props),
  
  // Actions
  RiAddLine: (props: any) => renderIcon(Ri.RiAddLine, props),
  RiUpload2Line: (props: any) => renderIcon(Ri.RiUpload2Line, props),
  RiEditLine: (props: any) => renderIcon(Ri.RiEditLine, props),
  RiPencilLine: (props: any) => renderIcon(Ri.RiPencilLine, props),
  RiDeleteBinLine: (props: any) => renderIcon(Ri.RiDeleteBinLine, props),
  RiDeleteBin6Line: (props: any) => renderIcon(Ri.RiDeleteBin6Line, props),
  RiSearchLine: (props: any) => renderIcon(Ri.RiSearchLine, props),
  RiRefreshLine: (props: any) => renderIcon(Ri.RiRefreshLine, props),
  
  // Theme
  RiSunLine: (props: any) => renderIcon(Ri.RiSunLine, props),
  RiMoonLine: (props: any) => renderIcon(Ri.RiMoonLine, props),
  
  // RFI Form Icons
  RiExchangeLine: (props: any) => renderIcon(Ri.RiExchangeLine, props),
  RiSwapBoxLine: (props: any) => renderIcon(Ri.RiSwapBoxLine, props),
  RiCheckboxMultipleLine: (props: any) => renderIcon(Ri.RiCheckboxMultipleLine, props),
  
  // Activity Icons
  RiBrushLine: (props: any) => renderIcon(Ri.RiBrushLine, props),
  RiBookmarkLine: (props: any) => renderIcon(Ri.RiBookmarkLine, props),
  RiCamera2Line: (props: any) => renderIcon(Ri.RiCamera2Line, props),
  RiSpeedLine: (props: any) => renderIcon(Ri.RiSpeedLine, props),
  
  // Misc
  RiRobot2Line: (props: any) => renderIcon(Ri.RiRobot2Line, props),
  RiBrainLine: (props: any) => renderIcon(Ri.RiBrainLine, props),
  RiHome2Line: (props: any) => renderIcon(Ri.RiHome2Line, props),
  RiDragMove2Line: (props: any) => renderIcon(Ri.RiDragMove2Line, props),
  RiLockLine: (props: any) => renderIcon(Ri.RiLockLine, props),
  
  // Voice and audio icons
  RiVolumeUpLine: (props: any) => renderIcon(Ri.RiVolumeUpLine, props),
  RiVolumeMuteLine: (props: any) => renderIcon(Ri.RiVolumeMuteLine, props),
  RiMicLine: (props: any) => renderIcon(Ri.RiMicLine, props),
  RiMicOffLine: (props: any) => renderIcon(Ri.RiMicOffLine, props),
  RiSendPlaneLine: (props: any) => renderIcon(Ri.RiSendPlaneLine, props),
  RiMessageLine: (props: any) => renderIcon(Ri.RiMessageLine, props),
}; 