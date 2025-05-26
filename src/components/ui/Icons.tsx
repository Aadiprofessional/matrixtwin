import React from 'react';
import * as Ri from 'react-icons/ri';
import IconComponent from '../common/IconComponent';

type IconProps = {
  className?: string;
  color?: string;
  size?: string | number;
  style?: React.CSSProperties;
  onClick?: () => void;
};

// Create wrapped components for each icon
const RiUser3Line = (props: IconProps) => <IconComponent icon={Ri.RiUser3Line} {...props} />;
const RiUserLine = (props: IconProps) => <IconComponent icon={Ri.RiUserLine} {...props} />;
const RiUserSettingsLine = (props: IconProps) => <IconComponent icon={Ri.RiUserSettingsLine} {...props} />;
const RiUserStarLine = (props: IconProps) => <IconComponent icon={Ri.RiUserStarLine} {...props} />;
const RiUserAddLine = (props: IconProps) => <IconComponent icon={Ri.RiUserAddLine} {...props} />;
const RiUserReceivedLine = (props: IconProps) => <IconComponent icon={Ri.RiUserReceivedLine} {...props} />;
const RiArrowLeftLine = (props: IconProps) => <IconComponent icon={Ri.RiArrowLeftLine} {...props} />;
const RiArrowRightLine = (props: IconProps) => <IconComponent icon={Ri.RiArrowRightLine} {...props} />;
const RiArrowLeftSLine = (props: IconProps) => <IconComponent icon={Ri.RiArrowLeftSLine} {...props} />;
const RiArrowRightSLine = (props: IconProps) => <IconComponent icon={Ri.RiArrowRightSLine} {...props} />;
const RiArrowDownSLine = (props: IconProps) => <IconComponent icon={Ri.RiArrowDownSLine} {...props} />;
const RiCloseLine = (props: IconProps) => <IconComponent icon={Ri.RiCloseLine} {...props} />;
const RiMenuLine = (props: IconProps) => <IconComponent icon={Ri.RiMenuLine} {...props} />;
const RiSearchLine = (props: IconProps) => <IconComponent icon={Ri.RiSearchLine} {...props} />;
const RiFilterLine = (props: IconProps) => <IconComponent icon={Ri.RiFilterLine} {...props} />;
const RiMore2Line = (props: IconProps) => <IconComponent icon={Ri.RiMore2Line} {...props} />;
const RiMore2Fill = (props: IconProps) => <IconComponent icon={Ri.RiMore2Fill} {...props} />;
const RiCheckLine = (props: IconProps) => <IconComponent icon={Ri.RiCheckLine} {...props} />;
const RiDashboardLine = (props: IconProps) => <IconComponent icon={Ri.RiDashboardLine} {...props} />;
const RiBarChartLine = (props: IconProps) => <IconComponent icon={Ri.RiBarChartLine} {...props} />;
const RiBarChartBoxLine = (props: IconProps) => <IconComponent icon={Ri.RiBarChartBoxLine} {...props} />;
const RiLineChartLine = (props: IconProps) => <IconComponent icon={Ri.RiLineChartLine} {...props} />;
const RiPieChartLine = (props: IconProps) => <IconComponent icon={Ri.RiPieChartLine} {...props} />;
const RiApps2Line = (props: IconProps) => <IconComponent icon={Ri.RiApps2Line} {...props} />;
const RiBellLine = (props: IconProps) => <IconComponent icon={Ri.RiBellLine} {...props} />;
const RiNotification3Line = (props: IconProps) => <IconComponent icon={Ri.RiNotification3Line} {...props} />;
const RiAlarmWarningLine = (props: IconProps) => <IconComponent icon={Ri.RiAlarmWarningLine} {...props} />;
const RiFileList3Line = (props: IconProps) => <IconComponent icon={Ri.RiFileList3Line} {...props} />;
const RiQuestionLine = (props: IconProps) => <IconComponent icon={Ri.RiQuestionLine} {...props} />;
const RiQuestionnaireLine = (props: IconProps) => <IconComponent icon={Ri.RiQuestionnaireLine} {...props} />;
const RiFileTextLine = (props: IconProps) => <IconComponent icon={Ri.RiFileTextLine} {...props} />;
const RiFileUserLine = (props: IconProps) => <IconComponent icon={Ri.RiFileUserLine} {...props} />;
const RiSettings3Line = (props: IconProps) => <IconComponent icon={Ri.RiSettings3Line} {...props} />;
const RiPaintLine = (props: IconProps) => <IconComponent icon={Ri.RiPaintLine} {...props} />;
const RiEyeLine = (props: IconProps) => <IconComponent icon={Ri.RiEyeLine} {...props} />;
const RiEyeOffLine = (props: IconProps) => <IconComponent icon={Ri.RiEyeOffLine} {...props} />;
const RiTranslate2 = (props: IconProps) => <IconComponent icon={Ri.RiTranslate2} {...props} />;
const RiGlobalLine = (props: IconProps) => <IconComponent icon={Ri.RiGlobalLine} {...props} />;
const RiShieldLine = (props: IconProps) => <IconComponent icon={Ri.RiShieldLine} {...props} />;
const RiShieldCheckLine = (props: IconProps) => <IconComponent icon={Ri.RiShieldCheckLine} {...props} />;
const RiLogoutBoxRLine = (props: IconProps) => <IconComponent icon={Ri.RiLogoutBoxRLine} {...props} />;
const RiBuilding4Line = (props: IconProps) => <IconComponent icon={Ri.RiBuilding4Line} {...props} />;
const RiTeamLine = (props: IconProps) => <IconComponent icon={Ri.RiTeamLine} {...props} />;
const RiGroupLine = (props: IconProps) => <IconComponent icon={Ri.RiGroupLine} {...props} />;
const RiCalendarTodoLine = (props: IconProps) => <IconComponent icon={Ri.RiCalendarTodoLine} {...props} />;
const RiCalendarLine = (props: IconProps) => <IconComponent icon={Ri.RiCalendarLine} {...props} />;
const RiCalendarCheckLine = (props: IconProps) => <IconComponent icon={Ri.RiCalendarCheckLine} {...props} />;
const RiTimeLine = (props: IconProps) => <IconComponent icon={Ri.RiTimeLine} {...props} />;
const RiMailLine = (props: IconProps) => <IconComponent icon={Ri.RiMailLine} {...props} />;
const RiContactsLine = (props: IconProps) => <IconComponent icon={Ri.RiContactsLine} {...props} />;
const RiPhoneLine = (props: IconProps) => <IconComponent icon={Ri.RiPhoneLine} {...props} />;
const RiAddLine = (props: IconProps) => <IconComponent icon={Ri.RiAddLine} {...props} />;
const RiUpload2Line = (props: IconProps) => <IconComponent icon={Ri.RiUpload2Line} {...props} />;
const RiEditLine = (props: IconProps) => <IconComponent icon={Ri.RiEditLine} {...props} />;
const RiPencilLine = (props: IconProps) => <IconComponent icon={Ri.RiPencilLine} {...props} />;
const RiDeleteBinLine = (props: IconProps) => <IconComponent icon={Ri.RiDeleteBinLine} {...props} />;
const RiDeleteBin6Line = (props: IconProps) => <IconComponent icon={Ri.RiDeleteBin6Line} {...props} />;
const RiRefreshLine = (props: IconProps) => <IconComponent icon={Ri.RiRefreshLine} {...props} />;
const RiSunLine = (props: IconProps) => <IconComponent icon={Ri.RiSunLine} {...props} />;
const RiMoonLine = (props: IconProps) => <IconComponent icon={Ri.RiMoonLine} {...props} />;
const RiInboxLine = (props: IconProps) => <IconComponent icon={Ri.RiInboxLine} {...props} />;
const RiRobot2Line = (props: IconProps) => <IconComponent icon={Ri.RiRobot2Line} {...props} />;
const RiBrainLine = (props: IconProps) => <IconComponent icon={Ri.RiBrainLine} {...props} />;
const RiHome2Line = (props: IconProps) => <IconComponent icon={Ri.RiHome2Line} {...props} />;
const RiBrushLine = (props: IconProps) => <IconComponent icon={Ri.RiBrushLine} {...props} />;
const RiBookmarkLine = (props: IconProps) => <IconComponent icon={Ri.RiBookmarkLine} {...props} />;
const RiDragMove2Line = (props: IconProps) => <IconComponent icon={Ri.RiDragMove2Line} {...props} />;
const RiLockLine = (props: IconProps) => <IconComponent icon={Ri.RiLockLine} {...props} />;
const RiExchangeLine = (props: IconProps) => <IconComponent icon={Ri.RiExchangeLine} {...props} />;
const RiSwapBoxLine = (props: IconProps) => <IconComponent icon={Ri.RiSwapBoxLine} {...props} />;
const RiCheckboxMultipleLine = (props: IconProps) => <IconComponent icon={Ri.RiCheckboxMultipleLine} {...props} />;
const RiCamera2Line = (props: IconProps) => <IconComponent icon={Ri.RiCamera2Line} {...props} />;
const RiSpeedLine = (props: IconProps) => <IconComponent icon={Ri.RiSpeedLine} {...props} />;
const RiBuilding3Line = (props: IconProps) => <IconComponent icon={Ri.RiBuilding3Line} {...props} />;
const RiBuilding2Line = (props: IconProps) => <IconComponent icon={Ri.RiBuilding2Line} {...props} />;
const RiTempHotLine = (props: IconProps) => <IconComponent icon={Ri.RiTempHotLine} {...props} />;
const RiWaterFlashLine = (props: IconProps) => <IconComponent icon={Ri.RiWaterFlashLine} {...props} />;
const RiLightbulbLine = (props: IconProps) => <IconComponent icon={Ri.RiLightbulbLine} {...props} />;
const RiWindyLine = (props: IconProps) => <IconComponent icon={Ri.RiWindyLine} {...props} />;
const RiDownload2Line = (props: IconProps) => <IconComponent icon={Ri.RiDownload2Line} {...props} />;
const RiFlashlightLine = (props: IconProps) => <IconComponent icon={Ri.RiFlashlightLine} {...props} />;
const RiSensorLine = (props: IconProps) => <IconComponent icon={Ri.RiSensorLine} {...props} />;

// Default export as a namespace
const Icons = {
  RiUser3Line,
  RiUserLine,
  RiUserSettingsLine,
  RiUserStarLine,
  RiUserAddLine,
  RiUserReceivedLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiMenuLine,
  RiSearchLine,
  RiFilterLine,
  RiMore2Line,
  RiMore2Fill,
  RiCheckLine,
  RiDashboardLine,
  RiBarChartLine,
  RiBarChartBoxLine,
  RiLineChartLine,
  RiPieChartLine,
  RiApps2Line,
  RiBellLine,
  RiNotification3Line,
  RiAlarmWarningLine,
  RiFileList3Line,
  RiQuestionLine,
  RiQuestionnaireLine,
  RiFileTextLine,
  RiFileUserLine,
  RiSettings3Line,
  RiPaintLine,
  RiEyeLine,
  RiEyeOffLine,
  RiTranslate2,
  RiGlobalLine,
  RiShieldLine,
  RiShieldCheckLine,
  RiLogoutBoxRLine,
  RiBuilding4Line,
  RiBuilding3Line,
  RiBuilding2Line,
  RiTeamLine,
  RiGroupLine,
  RiCalendarTodoLine,
  RiCalendarLine,
  RiCalendarCheckLine,
  RiTimeLine,
  RiMailLine,
  RiContactsLine,
  RiPhoneLine,
  RiAddLine,
  RiUpload2Line,
  RiEditLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiDeleteBin6Line,
  RiRefreshLine,
  RiSunLine,
  RiMoonLine,
  RiInboxLine,
  RiRobot2Line,
  RiBrainLine,
  RiHome2Line,
  RiBrushLine,
  RiBookmarkLine,
  RiDragMove2Line,
  RiLockLine,
  RiExchangeLine,
  RiSwapBoxLine,
  RiCheckboxMultipleLine,
  RiCamera2Line,
  RiSpeedLine,
  RiTempHotLine,
  RiWaterFlashLine,
  RiLightbulbLine,
  RiWindyLine,
  RiDownload2Line,
  RiFlashlightLine,
  RiSensorLine,
};

export default Icons; 