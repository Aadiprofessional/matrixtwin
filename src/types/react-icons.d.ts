// Type definitions for react-icons
import * as React from 'react';

// Override the IconType from react-icons
declare module 'react-icons' {
  export interface IconType extends React.FC<React.SVGProps<SVGSVGElement>> {}
  
  export interface IconContextProps {
    color?: string;
    size?: string;
    className?: string;
    style?: React.CSSProperties;
    attr?: React.SVGAttributes<SVGElement>;
    [key: string]: any;
  }
  
  export const IconContext: React.Context<IconContextProps> & {
    Provider: React.Provider<IconContextProps>;
    Consumer: React.Consumer<IconContextProps>;
  };
}

// Override for each icon set
declare module 'react-icons/ri' {
  export interface IconType extends React.FC<React.SVGProps<SVGSVGElement>> {}
  export const RiUser3Line: IconType;
  export const RiUserLine: IconType;
  export const RiUserSettingsLine: IconType;
  export const RiUserStarLine: IconType;
  export const RiUserAddLine: IconType;
  export const RiUserReceivedLine: IconType;
  export const RiArrowLeftLine: IconType;
  export const RiArrowRightLine: IconType;
  export const RiArrowLeftSLine: IconType;
  export const RiArrowRightSLine: IconType;
  export const RiArrowDownSLine: IconType;
  export const RiCloseLine: IconType;
  export const RiMenuLine: IconType;
  export const RiSearchLine: IconType;
  export const RiFilterLine: IconType;
  export const RiMore2Line: IconType;
  export const RiMore2Fill: IconType;
  export const RiCheckLine: IconType;
  export const RiDashboardLine: IconType;
  export const RiBarChartLine: IconType;
  export const RiBarChartBoxLine: IconType;
  export const RiLineChartLine: IconType;
  export const RiPieChartLine: IconType;
  export const RiApps2Line: IconType;
  export const RiBellLine: IconType;
  export const RiNotification3Line: IconType;
  export const RiAlarmWarningLine: IconType;
  export const RiFileList3Line: IconType;
  export const RiQuestionLine: IconType;
  export const RiQuestionnaireLine: IconType;
  export const RiFileTextLine: IconType;
  export const RiFileUserLine: IconType;
  export const RiSettings3Line: IconType;
  export const RiPaintLine: IconType;
  export const RiEyeLine: IconType;
  export const RiEyeOffLine: IconType;
  export const RiTranslate2: IconType;
  export const RiGlobalLine: IconType;
  export const RiShieldLine: IconType;
  export const RiShieldCheckLine: IconType;
  export const RiLogoutBoxRLine: IconType;
  export const RiBuilding4Line: IconType;
  export const RiTeamLine: IconType;
  export const RiGroupLine: IconType;
  export const RiCalendarTodoLine: IconType;
  export const RiCalendarLine: IconType;
  export const RiCalendarCheckLine: IconType;
  export const RiTimeLine: IconType;
  export const RiMailLine: IconType;
  export const RiContactsLine: IconType;
  export const RiPhoneLine: IconType;
  export const RiAddLine: IconType;
  export const RiUpload2Line: IconType;
  export const RiEditLine: IconType;
  export const RiPencilLine: IconType;
  export const RiDeleteBinLine: IconType;
  export const RiDeleteBin6Line: IconType;
  export const RiRefreshLine: IconType;
  export const RiSunLine: IconType;
  export const RiMoonLine: IconType;
  export const RiInboxLine: IconType;
  export const RiRobot2Line: IconType;
  export const RiBrainLine: IconType;
  export const RiHome2Line: IconType;
  export const RiBrushLine: IconType;
  export const RiBookmarkLine: IconType;
  export const RiDragMove2Line: IconType;
  export const RiLockLine: IconType;
  export const RiExchangeLine: IconType;
  export const RiSwapBoxLine: IconType;
  export const RiCheckboxMultipleLine: IconType;
  export const RiCamera2Line: IconType;
  export const RiSpeedLine: IconType;
} 