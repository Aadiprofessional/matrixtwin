"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.IconWrapper = void 0;
var react_1 = __importDefault(require("react"));
var Ri = __importStar(require("react-icons/ri"));
var react_icons_1 = require("react-icons");
// Dictionary mapping icon names to actual icon components
var iconMap = {
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
    RiErrorWarningLine: Ri.RiErrorWarningLine
};
/**
 * A component that renders any React Icon safely
 * This component takes the icon name as a string and renders the corresponding icon
 *
 * @param props The component props
 * @returns A React element containing the rendered icon
 */
var IconWrapper = function (_a) {
    var icon = _a.icon, _b = _a.className, className = _b === void 0 ? '' : _b;
    var IconComponent = iconMap[icon];
    if (!IconComponent) {
        console.warn("Icon ".concat(icon, " not found in iconMap"));
        return null;
    }
    return (react_1["default"].createElement("span", { className: className },
        react_1["default"].createElement(react_icons_1.IconContext.Provider, { value: { className: className } }, react_1["default"].createElement(IconComponent))));
};
exports.IconWrapper = IconWrapper;
exports["default"] = exports.IconWrapper;
