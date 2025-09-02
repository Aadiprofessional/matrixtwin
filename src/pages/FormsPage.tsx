import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import FormCreationFlow from '../components/forms/FormCreationFlow';
import { SiteDiaryFormTemplate } from '../components/forms/SiteDiaryFormTemplate';
import { SafetyInspectionChecklistTemplate } from '../components/forms/SafetyInspectionChecklistTemplate';
import { DailyCleaningInspectionTemplate } from '../components/forms/DailyCleaningInspectionTemplate';
import { MonthlyReturnTemplate } from '../components/forms/MonthlyReturnTemplate';
import { InspectionCheckFormTemplate } from '../components/forms/InspectionCheckFormTemplate';
import { SurveyCheckFormTemplate } from '../components/forms/SurveyCheckFormTemplate';
import { 
  RiAddLine, 
  RiSearchLine, 
  RiFilterLine, 
  RiMoreLine, 
  RiFileTextLine, 
  RiCalendarLine, 
  RiUserLine, 
  RiTeamLine, 
  RiDownloadLine, 
  RiDeleteBinLine, 
  RiEditLine, 
  RiEyeLine, 
  RiShareLine, 
  RiStarLine, 
  RiStarFill, 
  RiText, 
  RiCheckboxLine, 
  RiCheckboxMultipleLine, 
  RiListOrdered, 
  RiImageLine, 
  RiAttachmentLine, 
  RiPencilLine, 
  RiApps2Line, 
  RiSettings4Line, 
  RiLayoutLine, 
  RiTableLine, 
  RiSignalWifiLine, 
  RiArrowUpLine, 
  RiArrowDownLine, 
  RiDeleteBin6Line, 
  RiDragMove2Line, 
  RiArrowGoBackLine, 
  RiArrowGoForwardLine, 
  RiCloseLine,
  RiRobotLine,
  RiUploadLine,
  RiFileEditLine,
  RiFilePdfLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiPrinterLine
} from 'react-icons/ri';
import { IconType } from 'react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';

interface FormField {
  id: string;
  type: string;
  label: string;
  settings: Record<string, any>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  zIndex?: number;
  gridRow?: number;
  gridCol?: number;
}

// Grid system constants
const GRID_CONSTANTS = {
  ROWS: 9,
  COLS: 2,
  WIDGET_WIDTH_PERCENT: 45, // 45% of page width
  MAX_WIDGETS_PER_ROW: 2,
  GRID_GAP: 10 // Gap between grid cells in pixels
} as const;

// Grid cell interface
interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  occupied: boolean;
  fieldId?: string;
}

// Grid layout interface
interface GridLayout {
  cells: GridCell[][];
  rowHeights: number[];
  pageWidth: number;
  pageHeight: number;
}

interface FormPage {
  id: string;
  fields: FormField[];
  dimensions: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    size: 'A4' | 'A3' | 'A5';
  };
}

// Grid system utility functions
const calculateGridLayout = (pageWidth: number, pageHeight: number, fields: FormField[]): GridLayout => {
  const cellWidth = (pageWidth * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
  const availableHeight = pageHeight - (GRID_CONSTANTS.GRID_GAP * (GRID_CONSTANTS.ROWS + 1));
  const baseCellHeight = availableHeight / GRID_CONSTANTS.ROWS;
  
  // Initialize grid cells
  const cells: GridCell[][] = [];
  const rowHeights: number[] = new Array(GRID_CONSTANTS.ROWS).fill(baseCellHeight);
  
  for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
    cells[row] = [];
    for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
      const x = col === 0 ? GRID_CONSTANTS.GRID_GAP : pageWidth - cellWidth - GRID_CONSTANTS.GRID_GAP;
      const y = GRID_CONSTANTS.GRID_GAP + (row * (baseCellHeight + GRID_CONSTANTS.GRID_GAP));
      
      cells[row][col] = {
        row,
        col,
        x,
        y,
        width: cellWidth,
        height: baseCellHeight,
        occupied: false
      };
    }
  }
  
  // Mark occupied cells and calculate row heights based on widgets
  const rowMaxHeights: number[] = new Array(GRID_CONSTANTS.ROWS).fill(baseCellHeight);
  
  fields.forEach(field => {
    let row: number, col: number;
    
    if (field.gridRow !== undefined && field.gridCol !== undefined) {
      // Use existing grid coordinates
      row = field.gridRow;
      col = field.gridCol;
    } else if (field.x !== undefined && field.y !== undefined) {
      // Calculate grid position from x/y coordinates for fields without grid coordinates
      const fieldCenterX = field.x + (field.width || cellWidth) / 2;
      const fieldCenterY = field.y + (field.height || baseCellHeight) / 2;
      
      // Determine which column based on x position
      col = fieldCenterX < pageWidth / 2 ? 0 : 1;
      
      // Determine which row based on y position
      row = Math.floor((fieldCenterY - GRID_CONSTANTS.GRID_GAP) / (baseCellHeight + GRID_CONSTANTS.GRID_GAP));
      row = Math.max(0, Math.min(row, GRID_CONSTANTS.ROWS - 1));
    } else {
      // Skip fields without position information
      return;
    }
    
    if (row >= 0 && row < GRID_CONSTANTS.ROWS && col >= 0 && col < GRID_CONSTANTS.COLS) {
      cells[row][col].occupied = true;
      cells[row][col].fieldId = field.id;
      
      // Update row height based on widget height
      const widgetHeight = field.height || baseCellHeight;
      rowMaxHeights[row] = Math.max(rowMaxHeights[row], widgetHeight);
    }
  });
  
  // Update cell heights and positions based on calculated row heights
  let currentY = GRID_CONSTANTS.GRID_GAP;
  for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
    rowHeights[row] = rowMaxHeights[row];
    
    for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
      cells[row][col].y = currentY;
      cells[row][col].height = rowHeights[row];
    }
    
    currentY += rowHeights[row] + GRID_CONSTANTS.GRID_GAP;
  }
  
  return {
    cells,
    rowHeights,
    pageWidth,
    pageHeight
  };
};

const findAvailableGridCell = (gridLayout: GridLayout): { row: number; col: number } | null => {
  for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
    for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
      if (!gridLayout.cells[row][col].occupied) {
        return { row, col };
      }
    }
  }
  return null;
};

const getGridCellFromPosition = (x: number, y: number, gridLayout: GridLayout): { row: number; col: number } | null => {
  for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
    for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
      const cell = gridLayout.cells[row][col];
      if (x >= cell.x && x <= cell.x + cell.width && 
          y >= cell.y && y <= cell.y + cell.height) {
        return { row, col };
      }
    }
  }
  return null;
};

const snapToGridCell = (row: number, col: number, gridLayout: GridLayout): { x: number; y: number; width: number; height: number } => {
  const cell = gridLayout.cells[row][col];
  return {
    x: cell.x,
    y: cell.y,
    width: cell.width,
    height: cell.height
  };
};

// Calculate field accuracy based on dimensions, positioning, and typography
const calculateFieldAccuracy = (field: any): number => {
  let accuracy = 100;
  
  // Check if field has proper dimensions
  if (!field.width || !field.height) {
    accuracy -= 20;
  }
  
  // Check if field has proper positioning
  if (!field.x || !field.y) {
    accuracy -= 15;
  }
  
  // Check if field has typography information
  if (!field.typography?.fontSize) {
    accuracy -= 10;
  }
  
  // Check if field has spacing information
  if (!field.spacing) {
    accuracy -= 10;
  }
  
  // Check if field has border information
  if (!field.border) {
    accuracy -= 5;
  }
  
  // Bonus points for table fields with proper structure
  if (field.type === 'table' && field.settings?.tableData) {
    const tableData = field.settings.tableData;
    if (tableData.rows && tableData.columns && tableData.cellDimensions) {
      accuracy += 10;
    }
  }
  
  // Ensure accuracy is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(accuracy)));
};

// Validate field dimensions and proportions against document analysis
const validateFieldDimensions = (field: any, documentAnalysis: any): { isValid: boolean; issues: string[]; adjustedField?: any } => {
  const issues: string[] = [];
  let adjustedField = { ...field };
  
  // Check if field dimensions are reasonable for the document
  const pageWidth = documentAnalysis?.pageDimensions?.width || 595;
  const pageHeight = documentAnalysis?.pageDimensions?.height || 842;
  
  // Validate field doesn't exceed page boundaries
  if (field.x + field.width > pageWidth) {
    issues.push(`Field '${field.label}' extends beyond page width`);
    adjustedField.width = Math.max(50, pageWidth - field.x - 10);
  }
  
  if (field.y + field.height > pageHeight) {
    issues.push(`Field '${field.label}' extends beyond page height`);
    adjustedField.height = Math.max(20, pageHeight - field.y - 10);
  }
  
  // Validate font size proportions
  const detectedFontSize = parseInt(field.typography?.fontSize) || 12;
  const documentFontSize = parseInt(documentAnalysis?.primaryFontSize) || 12;
  
  if (Math.abs(detectedFontSize - documentFontSize) > 6) {
    issues.push(`Field '${field.label}' font size (${detectedFontSize}px) differs significantly from document font (${documentFontSize}px)`);
    adjustedField.typography = {
      ...adjustedField.typography,
      fontSize: `${documentFontSize}px`
    };
  }
  
  // Validate table dimensions if applicable
  if (field.type === 'table' && field.settings?.tableData) {
    const tableData = field.settings.tableData;
    const expectedWidth = (tableData.columns || 3) * 100; // Minimum 100px per column
    const expectedHeight = (tableData.rows || 3) * 30; // Minimum 30px per row
    
    if (field.width < expectedWidth * 0.8) {
      issues.push(`Table '${field.label}' width may be too small for ${tableData.columns} columns`);
      adjustedField.width = Math.min(expectedWidth, pageWidth - field.x - 10);
    }
    
    if (field.height < expectedHeight * 0.8) {
      issues.push(`Table '${field.label}' height may be too small for ${tableData.rows} rows`);
      adjustedField.height = Math.min(expectedHeight, pageHeight - field.y - 10);
    }
  }
  
  // Check field overlap with margins
  const margins = documentAnalysis?.margins || { top: 50, bottom: 50, left: 50, right: 50 };
  
  if (field.x < margins.left) {
    issues.push(`Field '${field.label}' is positioned within left margin`);
    adjustedField.x = margins.left;
  }
  
  if (field.y < margins.top) {
    issues.push(`Field '${field.label}' is positioned within top margin`);
    adjustedField.y = margins.top;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    adjustedField: issues.length > 0 ? adjustedField : undefined
  };
};

// Grid-based widget auto-arrangement algorithm
// Returns JSON format as specified in requirements
const autoArrangeWidgetsGrid = (widgets: any[], pageWidth: number, pageHeight: number, gridGap: number = 1): any[] => {
  if (!widgets || widgets.length === 0) return [];
  
  // Convert pixel dimensions to grid units (assuming 1 grid unit = ~50px)
  const gridUnitSize = 50;
  const gridWidth = Math.floor(pageWidth / gridUnitSize);
  const gridHeight = Math.floor(pageHeight / gridUnitSize);
  
  // Create a 2D grid to track occupied spaces
  const grid: boolean[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(false));
  
  // Check if a widget can be placed at given grid position
  const canPlaceWidget = (x: number, y: number, width: number, height: number): boolean => {
    if (x < 0 || y < 0 || x + width > gridWidth || y + height > gridHeight) {
      return false;
    }
    
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        if (grid[row][col]) {
          return false;
        }
      }
    }
    return true;
  };
  
  // Mark grid cells as occupied
  const markOccupied = (x: number, y: number, width: number, height: number): void => {
    for (let row = y; row < y + height; row++) {
      for (let col = x; col < x + width; col++) {
        if (row >= 0 && row < gridHeight && col >= 0 && col < gridWidth) {
          grid[row][col] = true;
        }
      }
    }
  };
  
  // Find next available position for a widget
  const findNextPosition = (width: number, height: number): { x: number; y: number } | null => {
    for (let y = 0; y <= gridHeight - height; y++) {
      for (let x = 0; x <= gridWidth - width; x++) {
        if (canPlaceWidget(x, y, width, height)) {
          return { x, y };
        }
      }
    }
    return null;
  };
  
  // Sort widgets by area (largest first) for better packing
  const sortedWidgets = [...widgets].sort((a, b) => {
    const areaA = (a.width || 2) * (a.height || 1);
    const areaB = (b.width || 2) * (b.height || 1);
    return areaB - areaA;
  });
  
  const arrangedWidgets: any[] = [];
  
  sortedWidgets.forEach((widget, index) => {
    // Ensure widget has valid dimensions
    const widgetWidth = Math.max(1, Math.min(widget.width || 2, gridWidth));
    const widgetHeight = Math.max(1, Math.min(widget.height || 1, gridHeight));
    
    // Find position for this widget
    const position = findNextPosition(widgetWidth, widgetHeight);
    
    if (position) {
      // Mark the area as occupied
      markOccupied(position.x, position.y, widgetWidth, widgetHeight);
      
      // Add arranged widget to result
      arrangedWidgets.push({
        type: widget.type || 'text input',
        x: position.x,
        y: position.y,
        width: widgetWidth,
        height: widgetHeight,
        id: widget.id || `widget-${index}`,
        label: widget.label || widget.type || 'Widget'
      });
    } else {
      // If no space available, try to resize and place
      let placed = false;
      for (let newHeight = Math.max(1, widgetHeight - 1); newHeight >= 1 && !placed; newHeight--) {
        for (let newWidth = Math.max(1, widgetWidth - 1); newWidth >= 1 && !placed; newWidth--) {
          const resizedPosition = findNextPosition(newWidth, newHeight);
          if (resizedPosition) {
            markOccupied(resizedPosition.x, resizedPosition.y, newWidth, newHeight);
            arrangedWidgets.push({
              type: widget.type || 'text input',
              x: resizedPosition.x,
              y: resizedPosition.y,
              width: newWidth,
              height: newHeight,
              id: widget.id || `widget-${index}`,
              label: widget.label || widget.type || 'Widget'
            });
            placed = true;
          }
        }
      }
      
      // If still can't place, add to overflow (could be handled by creating new page)
      if (!placed) {
        console.warn(`Widget ${widget.type} could not be placed on page`);
      }
    }
  });
  
  return arrangedWidgets;
};

// Example usage of the grid-based auto-arrangement algorithm
// This demonstrates the solution to the user's requirements
/*
Example Input:
const exampleWidgets = [
  {"type": "text input", "width": 2, "height": 1},
  {"type": "dropdown", "width": 2, "height": 1},
  {"type": "checkbox", "width": 1, "height": 1},
  {"type": "image", "width": 3, "height": 2}
];

const pageWidth = 6; // grid units
const pageHeight = 10; // grid units
const gridGap = 1;

// Auto-arrange the widgets
const arrangedWidgets = autoArrangeWidgetsGrid(exampleWidgets, pageWidth * 50, pageHeight * 50, gridGap);

// Generate visualization
const diagram = generateLayoutDiagram(arrangedWidgets, pageWidth * 50, pageHeight * 50);

Example Output JSON:
[
  {"type": "image", "x": 0, "y": 0, "width": 3, "height": 2, "id": "widget-0", "label": "image"},
  {"type": "text input", "x": 3, "y": 0, "width": 2, "height": 1, "id": "widget-1", "label": "text input"},
  {"type": "dropdown", "x": 3, "y": 1, "width": 2, "height": 1, "id": "widget-2", "label": "dropdown"},
  {"type": "checkbox", "x": 0, "y": 2, "width": 1, "height": 1, "id": "widget-3", "label": "checkbox"}
]

Example ASCII Diagram:
Layout Diagram (6x10 grid):
  0123456
0 IIITT
1 IIIDD
2 C.....
3 ......
4 ......
5 ......
6 ......
7 ......
8 ......
9 ......

Legend:
I = image
T = text input
D = dropdown
C = checkbox
. = empty space
*/

// Generate ASCII diagram for visualization
const generateLayoutDiagram = (widgets: any[], pageWidth: number, pageHeight: number): string => {
  const gridUnitSize = 50;
  const gridWidth = Math.floor(pageWidth / gridUnitSize);
  const gridHeight = Math.floor(pageHeight / gridUnitSize);
  
  // Create ASCII grid
  const grid: string[][] = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill('.'));
  
  // Map widget types to single characters
  const typeMap: { [key: string]: string } = {
    'text input': 'T',
    'dropdown': 'D',
    'checkbox': 'C',
    'image': 'I',
    'textarea': 'A',
    'table': '#',
    'button': 'B',
    'select': 'S'
  };
  
  // Place widgets on grid
  widgets.forEach((widget, index) => {
    const char = typeMap[widget.type] || (index + 1).toString().slice(-1);
    
    for (let y = widget.y; y < widget.y + widget.height && y < gridHeight; y++) {
      for (let x = widget.x; x < widget.x + widget.width && x < gridWidth; x++) {
        if (y >= 0 && x >= 0) {
          grid[y][x] = char;
        }
      }
    }
  });
  
  // Convert to string
  let diagram = `Layout Diagram (${gridWidth}x${gridHeight} grid):\n`;
  diagram += '  ' + Array.from({length: gridWidth}, (_, i) => (i % 10).toString()).join('') + '\n';
  
  grid.forEach((row, y) => {
    diagram += (y % 10).toString().padStart(2) + row.join('') + '\n';
  });
  
  diagram += '\nLegend:\n';
  Object.entries(typeMap).forEach(([type, char]) => {
    diagram += `${char} = ${type}\n`;
  });
  diagram += '. = empty space\n';
  
  return diagram;
};

// Auto-arrange fields to prevent overlaps and ensure proper layout
const autoArrangeFields = (fields: any[], documentAnalysis: any): any[] => {
  if (!fields || fields.length === 0) return fields;
  
  // Get page dimensions and margins
  const pageWidth = documentAnalysis?.pageWidth || 595;
  const pageHeight = documentAnalysis?.pageHeight || 842;
  const margins = documentAnalysis?.margins || { top: 50, bottom: 50, left: 50, right: 50 };
  const gridGap = 10; // Minimum spacing between fields
  
  // Calculate available space
  const availableWidth = pageWidth - margins.left - margins.right;
  const availableHeight = pageHeight - margins.top - margins.bottom;
  
  // Group fields by page number
  const fieldsByPage: { [key: number]: any[] } = {};
  fields.forEach(field => {
    const pageNum = field.pageNumber || 1;
    if (!fieldsByPage[pageNum]) {
      fieldsByPage[pageNum] = [];
    }
    fieldsByPage[pageNum].push({ ...field });
  });
  
  const arrangedFields: any[] = [];
  
  // Process each page separately
  Object.keys(fieldsByPage).forEach(pageNumStr => {
    const pageNum = parseInt(pageNumStr);
    const pageFields = fieldsByPage[pageNum];
    
    // Sort fields by original y position to maintain reading order
    pageFields.sort((a, b) => (a.y || 0) - (b.y || 0));
    
    // Track occupied areas to prevent overlaps
    const occupiedAreas: Array<{ x: number; y: number; width: number; height: number; fieldId: string }> = [];
    
    // Check if a position is available
    const isPositionAvailable = (x: number, y: number, width: number, height: number, excludeFieldId?: string): boolean => {
      // Check boundaries
      if (x < margins.left || y < margins.top || 
          x + width > pageWidth - margins.right || 
          y + height > pageHeight - margins.bottom) {
        return false;
      }
      
      // Check overlaps with existing fields
      return !occupiedAreas.some(area => {
        if (excludeFieldId && area.fieldId === excludeFieldId) return false;
        
        return !(
          x + width + gridGap <= area.x ||
          area.x + area.width + gridGap <= x ||
          y + height + gridGap <= area.y ||
          area.y + area.height + gridGap <= y
        );
      });
    };
    
    // Find next available position
    const findNextAvailablePosition = (preferredX: number, preferredY: number, width: number, height: number): { x: number; y: number } => {
      // Try preferred position first
      if (isPositionAvailable(preferredX, preferredY, width, height)) {
        return { x: preferredX, y: preferredY };
      }
      
      // Search in a grid pattern starting from preferred position
      const stepSize = 20;
      let currentY = Math.max(margins.top, preferredY);
      
      while (currentY + height <= pageHeight - margins.bottom) {
        let currentX = margins.left;
        
        while (currentX + width <= pageWidth - margins.right) {
          if (isPositionAvailable(currentX, currentY, width, height)) {
            return { x: currentX, y: currentY };
          }
          currentX += stepSize;
        }
        
        currentY += stepSize;
      }
      
      // If no position found, place at bottom with minimal overlap
      const lastOccupiedY = Math.max(...occupiedAreas.map(area => area.y + area.height), margins.top);
      return {
        x: margins.left,
        y: Math.min(lastOccupiedY + gridGap, pageHeight - margins.bottom - height)
      };
    };
    
    // Arrange fields on this page
    pageFields.forEach(field => {
      // Ensure field has valid dimensions
      const fieldWidth = Math.max(50, Math.min(field.width || 200, availableWidth));
      const fieldHeight = Math.max(20, Math.min(field.height || 40, availableHeight));
      
      // Find best position for this field
      const originalX = field.x || margins.left;
      const originalY = field.y || margins.top;
      
      const newPosition = findNextAvailablePosition(originalX, originalY, fieldWidth, fieldHeight);
      
      // Update field position and dimensions
      const arrangedField = {
        ...field,
        x: newPosition.x,
        y: newPosition.y,
        width: fieldWidth,
        height: fieldHeight
      };
      
      // Add to occupied areas
      occupiedAreas.push({
        x: newPosition.x,
        y: newPosition.y,
        width: fieldWidth,
        height: fieldHeight,
        fieldId: field.id
      });
      
      arrangedFields.push(arrangedField);
    });
  });
  
  return arrangedFields;
};

// Validate entire form structure and field relationships
const validateFormStructure = (fields: any[], documentAnalysis: any): { validationReport: any; adjustedFields: any[] } => {
  const validationReport = {
    totalFields: fields.length,
    validFields: 0,
    issuesFound: [] as string[],
    fieldValidations: [] as any[]
  };
  
  const adjustedFields = fields.map((field, index) => {
    const validation = validateFieldDimensions(field, documentAnalysis);
    
    validationReport.fieldValidations.push({
      fieldId: field.id,
      fieldLabel: field.label,
      isValid: validation.isValid,
      issues: validation.issues
    });
    
    if (validation.isValid) {
      validationReport.validFields++;
    } else {
      validationReport.issuesFound.push(...validation.issues);
    }
    
    return validation.adjustedField || field;
  });
  
  // Check for field overlaps
  for (let i = 0; i < adjustedFields.length; i++) {
    for (let j = i + 1; j < adjustedFields.length; j++) {
      const field1 = adjustedFields[i];
      const field2 = adjustedFields[j];
      
      // Check if fields overlap
      const overlap = !(
        field1.x + field1.width <= field2.x ||
        field2.x + field2.width <= field1.x ||
        field1.y + field1.height <= field2.y ||
        field2.y + field2.height <= field1.y
      );
      
      if (overlap) {
        validationReport.issuesFound.push(`Fields '${field1.label}' and '${field2.label}' overlap`);
      }
    }
  }
  
  return { validationReport, adjustedFields };
};

interface FormBuilderProps {
  formPages: FormPage[];
  setFormPages: React.Dispatch<React.SetStateAction<FormPage[]>>;
  currentPageIndex: number;
  setCurrentPageIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedField: FormField | null;
  setSelectedField: React.Dispatch<React.SetStateAction<FormField | null>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ResizeData {
  isResizing: boolean;
  fieldId: string | null;
  initialWidth: number;
  initialHeight: number;
  currentWidth: number;
  currentHeight: number;
  startX: number;
  startY: number;
}

interface ResizableWrapperProps {
  fieldId: string;
  children: React.ReactNode;
  onUpdateSize: (fieldId: string, width: number, height: number) => void;
  onUpdatePosition?: (fieldId: string, x: number, y: number) => void;
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  currentFields: FormField[];
  pageWidth: number;
  pageHeight: number;
}

interface AIFormGeneratorProps {
  onFormGenerated: (formData: any) => void;
  onClose: () => void;
}

// PDF to Image conversion utility
const convertPdfToImages = async (pdfFile: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const images: string[] = [];
        
        for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          images.push(canvas.toDataURL('image/png'));
        }
        
        resolve(images);
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// AI Form Generator Component with PDF support
const AIFormGenerator: React.FC<AIFormGeneratorProps> = ({ onFormGenerated, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedForm, setGeneratedForm] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
    } else {
      alert('Please select an image or PDF file');
    }
  };

  // Helper function to convert LaTeX to form fields
  const convertLatexToFormFields = async (latexCode: string): Promise<FormField[]> => {
    const fields: FormField[] = [];
    let yPosition = 50;
    let fieldCounter = 0;

    // Simple LaTeX parsing to extract form elements
    const lines = latexCode.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Extract text labels
      if (line.includes('\\textbf{') || line.includes('\\large') || line.includes('\\section{')) {
        const labelMatch = line.match(/\{([^}]+)\}/);
        if (labelMatch) {
          const label = labelMatch[1];
          fields.push({
            id: `label-${fieldCounter++}`,
            type: 'text',
            label: label,
            x: 50,
            y: yPosition,
            width: 300,
            height: 30,
            settings: {
              hideTitle: true,
              required: false,
              placeholder: '',
              readonly: true
            }
          });
          yPosition += 40;
        }
      }
      
      // Extract text input fields
      if (line.includes('\\underline{\\hspace{') || line.includes('\\framebox[')) {
        const widthMatch = line.match(/\{(\d+)cm\}/) || line.match(/\[(\d+)cm\]/);
        const width = widthMatch ? parseInt(widthMatch[1]) * 28 : 200; // Convert cm to pixels
        
        fields.push({
          id: `input-${fieldCounter++}`,
          type: 'text',
          label: 'Input Field',
          x: 50,
          y: yPosition,
          width: Math.max(width, 150),
          height: 35,
          settings: {
            hideTitle: false,
            required: false,
            placeholder: 'Enter text...'
          }
        });
        yPosition += 50;
      }
      
      // Extract checkboxes
      if (line.includes('$\\square$') || line.includes('\\checkbox')) {
        const labelMatch = line.match(/\$\\square\$\s*(.+)/) || line.match(/\\checkbox\s*(.+)/);
        const label = labelMatch ? labelMatch[1].trim() : 'Checkbox';
        
        fields.push({
          id: `checkbox-${fieldCounter++}`,
          type: 'checkbox',
          label: label,
          x: 50,
          y: yPosition,
          width: 200,
          height: 30,
          settings: {
            hideTitle: false,
            required: false,
            options: [label]
          }
        });
        yPosition += 40;
      }
      
      // Extract tables
      if (line.includes('\\begin{tabular}') || line.includes('\\begin{longtable}')) {
        const tableLines = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('\\end{tabular}') && !lines[j].includes('\\end{longtable}')) {
          tableLines.push(lines[j]);
          j++;
        }
        
        // Parse table structure
        const rows = tableLines.filter(line => line.includes('&') || line.includes('\\\\'));
        const numRows = Math.max(rows.length, 3);
        const numCols = Math.max(rows[0]?.split('&').length || 3, 3);
        
        fields.push({
          id: `table-${fieldCounter++}`,
          type: 'layoutTable',
          label: 'Table',
          x: 50,
          y: yPosition,
          width: Math.min(numCols * 100, 500),
          height: Math.min(numRows * 35, 300),
          settings: {
            hideTitle: false,
            required: false,
            rows: numRows,
            columns: numCols,
            showHeader: true,
            showBorders: true
          }
        });
        yPosition += Math.min(numRows * 35, 300) + 20;
        i = j; // Skip processed table lines
      }
    }
    
    return fields;
  };

  const generateFormFromImage = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      let imagesToProcess: string[] = [];
      
      if (selectedFile.type === 'application/pdf') {
        setProcessingPdf(true);
        setGenerationProgress(10);
        
        // Convert PDF to images
        const pdfImages = await convertPdfToImages(selectedFile);
        imagesToProcess = pdfImages;
        setProcessingPdf(false);
        setGenerationProgress(30);
      } else {
        // Handle regular image files
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
        imagesToProcess = [base64];
        setGenerationProgress(30);
      }

      // Process each image with AI to generate fieldPairs
      let allFieldsData: any[] = [];
      let formName = '';
      let formDescription = '';
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const image = imagesToProcess[i];
        setGenerationProgress(30 + (i / imagesToProcess.length) * 50);
        
        const messages = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert form analysis AI. Analyze this form image and identify all form fields, then organize them into PAIRS for optimal layout.

IMPORTANT: Group related fields into pairs that can be placed side-by-side (like "First Name" + "Last Name", "Date" + "Time", "Address" + "City", etc.). If there's an odd number of fields, the last field can be alone.

Respond with ONLY a JSON object in this exact format:

{
  "formName": "Descriptive form name",
  "formDescription": "Brief description",
  "fieldPairs": [
    {
      "pairId": "pair_1",
      "fields": [
        {
          "type": "text",
          "label": "Field Label 1",
          "settings": {
            "required": false,
            "placeholder": "Enter text...",
            "hideTitle": false
          }
        },
        {
          "type": "text", 
          "label": "Field Label 2",
          "settings": {
            "required": false,
            "placeholder": "Enter text...",
            "hideTitle": false
          }
        }
      ]
    }
  ]
}

Supported field types: text, email, number, date, time, select, checkbox, multipleChoice, textarea, file, signature, layoutTable

For select/checkbox/multipleChoice fields, add "options": ["Option 1", "Option 2"] in settings.
For textarea fields, add "rows": 3 in settings.
For file fields, add "allowedTypes": ["image/*"] and "maxSize": "10MB" in settings.

Analyze the form systematically and create logical pairs of related fields.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ];

        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-9f7b91a0bb81406b9da7ff884ddd2592',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "qwen-vl-plus",
            messages: messages,
            stream: false,
            temperature: 0.1,
            max_tokens: 4000
          })
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        console.log('AI fieldPairs Response for page', i + 1, ':', aiResponse);
        
        try {
          // Clean the AI response by removing markdown code blocks
          let cleanedResponse = aiResponse.trim();
          if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Parse the JSON response
          const parsedResponse = JSON.parse(cleanedResponse);
          
          if (i === 0) {
            formName = parsedResponse.formName || `Generated Form ${Date.now()}`;
            formDescription = parsedResponse.formDescription || 'AI-generated form from image analysis';
          }
          
          // Process fieldPairs and convert to form fields
          if (parsedResponse.fieldPairs && Array.isArray(parsedResponse.fieldPairs)) {
            let currentY = 50;
            const convertedFields = parsedResponse.fieldPairs.flatMap((pair: any, pairIndex: number) => {
              if (pair.fields && Array.isArray(pair.fields)) {
                const pairFields = pair.fields.map((field: any, fieldIndex: number) => {
                  const isTableField = field.type === 'layoutTable' || field.type === 'dataTable';
                  
                  if (isTableField) {
                    // Table fields take full width and their own row
                    const tableField = {
                      id: `field-${Date.now()}-${pairIndex}-${fieldIndex}`,
                      type: field.type || 'layoutTable',
                      label: field.label || 'Untitled Table',
                      settings: field.settings || {},
                      x: 20, // Small margin from left
                      y: currentY,
                      width: 555, // Full width minus margins (595 - 40)
                      height: field.type === 'dataTable' ? 200 : 150,
                      pageNumber: i + 1
                    };
                    currentY += (field.type === 'dataTable' ? 220 : 170); // Add spacing after table
                    return tableField;
                  } else {
                    // Regular fields follow the paired layout
                    const regularField = {
                      id: `field-${Date.now()}-${pairIndex}-${fieldIndex}`,
                      type: field.type || 'text',
                      label: field.label || 'Untitled Field',
                      settings: field.settings || {},
                      x: fieldIndex === 0 ? 50 : 320, // First field left, second field right
                      y: currentY,
                      width: 250,
                      height: 40,
                      pageNumber: i + 1
                    };
                    return regularField;
                  }
                });
                
                // Update Y position for next pair (only if not table fields)
                const hasTableField = pair.fields.some((field: any) => field.type === 'layoutTable' || field.type === 'dataTable');
                if (!hasTableField) {
                  currentY += 80; // Standard spacing for regular field pairs
                }
                
                return pairFields;
              }
              return [];
            });
            
            // Accumulate all fields
             allFieldsData = allFieldsData.concat(convertedFields);
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          console.log('Raw AI response:', aiResponse);
        }
      }
      
      setGenerationProgress(80);
      
      // Use the accumulated field data
      const convertedFields = allFieldsData;
      
      // Create form structure
      const formStructure = {
        name: formName,
        description: formDescription,
        pages: [{
          id: `page-${Date.now()}`,
          fields: convertedFields,
          dimensions: {
            width: 595,
            height: 842,
            orientation: 'portrait' as const,
            size: 'A4' as const
          }
        }]
      };
      
      setGenerationProgress(100);
      
      console.log('Generated form structure:', formStructure);
      setGeneratedForm(formStructure);
      setPreviewMode(true);
      
    } catch (error) {
      console.error('Error generating form from image:', error);
      setError(`Failed to generate form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setProcessingPdf(false);
    }
  };

  const handleUseGeneratedForm = () => {
    if (generatedForm) {
      onFormGenerated(generatedForm);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] overflow-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal flex items-center">
              <RiRobotLine className="mr-2" />
              AI Form Generator
            </h2>
            <Button variant="ai-secondary" size="sm" onClick={onClose}>
              <RiCloseLine />
            </Button>
          </div>

          {!previewMode ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Upload an image or PDF of a form, and our AI will automatically generate a digital version for you.
                </p>
                <div className="border-2 border-dashed border-ai-blue/30 rounded-lg p-8 hover:border-ai-blue/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    {selectedFile?.type === 'application/pdf' ? (
                      <RiFilePdfLine className="text-4xl text-red-500 mb-4" />
                    ) : (
                      <RiUploadLine className="text-4xl text-ai-blue mb-4" />
                    )}
                    <p className="text-lg font-medium mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports images (PNG, JPG, JPEG) and PDF files (up to 5 pages)
                    </p>
                    <Button
                      variant="ai"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RiUploadLine className="mr-2" />
                      Select File
                    </Button>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {selectedFile.type === 'application/pdf' ? (
                        <RiFilePdfLine className="text-red-500 mr-2" />
                      ) : (
                        <RiFileTextLine className="text-ai-blue mr-2" />
                      )}
                      <span className="font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ai-secondary"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {selectedFile.type.startsWith('image/') && (
                    <div className="mb-4">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="max-w-full max-h-48 object-contain rounded-lg border border-dark-600"
                      />
                    </div>
                  )}

                  {selectedFile.type === 'application/pdf' && (
                    <div className="mb-4 p-4 bg-dark-700/30 rounded-lg">
                      <div className="flex items-center text-gray-300">
                        <RiFilePdfLine className="text-red-500 mr-2" />
                        <span>PDF file ready for processing</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        The PDF will be converted to images for AI analysis
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ai"
                    fullWidth
                    onClick={generateFormFromImage}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RiRobotLine className="mr-2 animate-spin" />
                        {processingPdf ? 'Converting PDF...' : `Generating Form... ${generationProgress}%`}
                      </>
                    ) : (
                      <>
                        <RiRobotLine className="mr-2" />
                        Generate Form with AI
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="mt-4">
                      <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-ai-blue to-ai-teal h-full transition-all duration-500"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 mt-2 text-center">
                        {processingPdf ? 'Converting PDF pages to images...' : 'AI is analyzing your form and generating digital components...'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-dark-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-ai-blue">
                  Generated Form Preview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Form Name</label>
                    <p className="text-gray-300">{generatedForm?.name || 'AI Generated Form'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <p className="text-gray-300">{generatedForm?.description || 'Generated from uploaded file'}</p>
                  </div>
                </div>
                

                
                <div className="border border-dark-600 rounded-lg p-4 bg-dark-900/50">
                  <h4 className="font-medium mb-3">Form Fields ({generatedForm?.pages?.reduce((total: number, page: {fields: any[]}) => total + page.fields.length, 0) || 0})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedForm?.pages?.map((page: {fields: any[]}, pageIndex: number) => (
                      <React.Fragment key={`page-${pageIndex}`}>
                        <div className="text-sm font-medium text-ai-teal mb-2 mt-3 first:mt-0">
                          Page {pageIndex + 1} ({page.fields.length} fields)
                        </div>
                        {page.fields.map((field: any, fieldIndex: number) => {
                          const accuracy = calculateFieldAccuracy(field);
                          return (
                            <div key={`${pageIndex}-${fieldIndex}`} className="flex items-center justify-between p-2 bg-dark-800/50 rounded">
                              <div className="flex items-center">
                                <span className="text-ai-blue mr-2">{field.type}</span>
                                <span>{field.label}</span>
                                <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                  accuracy >= 90 ? 'bg-green-500/20 text-green-400' :
                                  accuracy >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {accuracy}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 text-right">
                                <div>{field.width}×{field.height}px</div>
                                <div>{field.x && field.y ? `(${field.x}, ${field.y})` : 'Auto-position'}</div>
                                {field.typography?.fontSize && (
                                  <div>Font: {field.typography.fontSize}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="ai-secondary"
                  onClick={() => setPreviewMode(false)}
                >
                  Back to Upload
                </Button>
                <Button
                  variant="ai"
                  onClick={handleUseGeneratedForm}
                  className="flex-1"
                >
                  <RiCheckboxLine className="mr-2" />
                  Use This Form
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced ResizableWrapper with MS Word-like positioning
const ResizableWrapper: React.FC<ResizableWrapperProps> = ({ 
  fieldId, 
  children, 
  onUpdateSize, 
  onUpdatePosition, 
  field, 
  isSelected, 
  onSelect,
  currentFields,
  pageWidth,
  pageHeight
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  // Calculate effective dimensions based on field type for consistent sizing
  const getEffectiveDimensions = useCallback(() => {
    const baseWidth = field.width || 200;
    const baseHeight = field.height || 40;
    
    switch (field.type) {
      case 'layoutTable':
      case 'dataTable':
        return {
          width: Math.max(baseWidth, (field.settings?.columns || 3) * 100),
          height: Math.max(baseHeight, (field.settings?.rows || 3) * 30)
        };
      case 'textarea':
        const textLines = field.settings?.rows || 4;
        return {
          width: Math.max(baseWidth, 200),
          height: Math.max(baseHeight, textLines * 20 + 20)
        };
      case 'select':
      case 'multiselect':
        const optionCount = field.settings?.options?.length || 1;
        // Enhanced multiselect sizing - calculate based on actual options
        const multiSelectHeight = field.type === 'multiselect' ? 
          Math.min(optionCount * 28 + 50, Math.max(200, optionCount * 20)) : Math.max(baseHeight, 40);
        return {
          width: Math.max(baseWidth, 150),
          height: multiSelectHeight
        };
      case 'checkbox':
      case 'multipleChoice':
        const checkboxOptions = field.settings?.options?.length || 1;
        // Enhanced checkbox/radio sizing - calculate based on number of options
        const checkboxHeight = Math.max(baseHeight, Math.min(
          checkboxOptions * 32 + 20, // 32px per option + padding
          Math.max(200, checkboxOptions * 25)
        ));
        return {
          width: Math.max(baseWidth, 120),
          height: checkboxHeight
        };
      case 'date':
      case 'time':
        return {
          width: Math.max(baseWidth, 150),
          height: Math.max(baseHeight, 35)
        };
      case 'number':
        return {
          width: Math.max(baseWidth, 100),
          height: Math.max(baseHeight, 35)
        };
      case 'signature':
        return {
          width: Math.max(baseWidth, 250),
          height: Math.max(baseHeight, 80)
        };
      case 'image':
      case 'attachment':
        return {
          width: Math.max(baseWidth, 200),
          height: Math.max(baseHeight, 100)
        };
      default: // text, email, etc.
        return {
          width: Math.max(baseWidth, 150),
          height: Math.max(baseHeight, 35)
        };
    }
  }, [field.type, field.width, field.height, field.settings]);

  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the field first
    onSelect();
    
    if (!onUpdatePosition) return;
    
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate effective dimensions based on field type
    const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();
    
    // Check if the click is within the effective dimensions
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    if (relativeX >= 0 && relativeX <= effectiveWidth && relativeY >= 0 && relativeY <= effectiveHeight) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPosition({ x: field.x || 0, y: field.y || 0 });
      
      // Enhanced cursor and visual feedback
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      // Add visual feedback for better UX
      if (wrapperRef.current) {
        wrapperRef.current.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        wrapperRef.current.style.transform = 'scale(1.02)';
        wrapperRef.current.style.transition = 'box-shadow 0.2s ease, transform 0.2s ease';
      }
    }
  }, [field.x, field.y, field.width, field.height, field.type, field.settings, onSelect, onUpdatePosition, getEffectiveDimensions]);
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate effective dimensions based on field type
    const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: effectiveWidth, height: effectiveHeight });
    setInitialPosition({ x: field.x || 0, y: field.y || 0 });
    
    document.body.style.cursor = getResizeCursor(direction);
    document.body.style.userSelect = 'none';
  }, [field.width, field.height, field.x, field.y, field.type, field.settings, getEffectiveDimensions]);
  
  const getResizeCursor = (direction: string) => {
    const cursors: { [key: string]: string } = {
      'nw': 'nw-resize',
      'ne': 'ne-resize',
      'sw': 'sw-resize',
      'se': 'se-resize',
      'n': 'n-resize',
      's': 's-resize',
      'w': 'w-resize',
      'e': 'e-resize'
    };
    return cursors[direction] || 'default';
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!wrapperRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate effective dimensions based on field type
    const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();
    
    if (isDragging && onUpdatePosition) {
      // Get the page container element and its dimensions
      const pageContainer = wrapperRef.current.closest('[data-page-container]') as HTMLElement;
      let pageWidth = 595; // Default A4 width
      let pageHeight = 842; // Default A4 height
      
      if (pageContainer) {
        // Try to get dimensions from the container's computed style
        const computedStyle = window.getComputedStyle(pageContainer);
        pageWidth = parseInt(computedStyle.width) || 595;
        pageHeight = parseInt(computedStyle.height) || 842;
      } else {
        // Fallback: use parent container but with more conservative boundaries
        const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
        if (parentRect) {
          pageWidth = parentRect.width;
          pageHeight = parentRect.height;
        }
      }
      
      // Calculate desired position
      const desiredX = initialPosition.x + deltaX;
      const desiredY = initialPosition.y + deltaY;
      
      // Create grid layout for positioning
      const gridLayout = calculateGridLayout(pageWidth, pageHeight, currentFields);
      
      // Get the nearest grid cell for the desired position
      const gridCell = getGridCellFromPosition(desiredX, desiredY, gridLayout);
      if (gridCell) {
        const snapPosition = snapToGridCell(gridCell.row, gridCell.col, gridLayout);
      
        // Apply smooth transition and update position immediately for responsive dragging
        wrapperRef.current.style.transition = 'none'; // Disable transition during drag for immediate response
        wrapperRef.current.style.transform = `translate(${snapPosition.x - (field.x || 0)}px, ${snapPosition.y - (field.y || 0)}px)`;
        wrapperRef.current.style.left = `${field.x || 0}px`;
        wrapperRef.current.style.top = `${field.y || 0}px`;
        wrapperRef.current.style.zIndex = '1000'; // Bring to front while dragging
      }
      
    } else if (isResizing) {
      // Get page dimensions for width calculation
      const pageContainer = wrapperRef.current.closest('[data-page-container]') as HTMLElement;
      let pageWidth = 595;
      
      if (pageContainer) {
        const computedStyle = window.getComputedStyle(pageContainer);
        pageWidth = parseInt(computedStyle.width) || 595;
      }
      
      // Enforce fixed width constraint (45% of page width)
      const fixedWidth = pageWidth * (GRID_CONSTANTS.WIDGET_WIDTH_PERCENT / 100);
      
      let newWidth = fixedWidth; // Always use fixed width
      let newHeight = initialSize.height;
      let newX = initialPosition.x;
      let newY = initialPosition.y;
      
      // Only allow height resizing to maintain grid constraints
      switch (resizeDirection) {
        case 'se':
        case 's':
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'sw':
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'ne':
        case 'n':
          newHeight = Math.max(20, initialSize.height - deltaY);
          newY = initialPosition.y + Math.min(deltaY, initialSize.height - 20);
          break;
        case 'nw':
          newHeight = Math.max(20, initialSize.height - deltaY);
          newY = initialPosition.y + Math.min(deltaY, initialSize.height - 20);
          break;
        case 'e':
        case 'w':
          // Width resizing disabled - maintain fixed width
          break;
      }
      
      // Check for page expansion during resize with intelligent space calculation
      if (pageContainer) {
        const computedStyle = window.getComputedStyle(pageContainer);
        const pageWidth = parseInt(computedStyle.width) || 595;
        const pageHeight = parseInt(computedStyle.height) || 842;
        const padding = 24;
        
        // Calculate additional space requirements for content-heavy widgets during resize
        let additionalWidth = 0;
        let additionalHeight = 0;
        
        if (field.type === 'checkbox' || field.type === 'multipleChoice') {
          const options = field.settings?.options?.length || 1;
          // Add extra space for checkbox labels and spacing
          additionalWidth = Math.max(0, options * 15); // Extra width for longer option lists
          additionalHeight = Math.max(0, (options - 3) * 10); // Extra height for more than 3 options
        } else if (field.type === 'multiselect') {
          const options = field.settings?.options?.length || 1;
          // Add extra space for dropdown expansion
          additionalHeight = Math.max(0, (options - 5) * 8); // Extra height for more than 5 options
        } else if (field.type === 'textarea') {
          const rows = field.settings?.rows || 4;
          additionalHeight = Math.max(0, (rows - 4) * 5); // Extra height for more than 4 rows
        }
        
        // Check if resized widget would exceed page boundaries with additional space
        const totalWidth = newWidth + additionalWidth;
        const totalHeight = newHeight + additionalHeight;
        const wouldExceedRight = newX + totalWidth + padding > pageWidth;
        const wouldExceedBottom = newY + totalHeight + padding > pageHeight;
        
        // Page expansion disabled - maintain fixed page size
        // if (wouldExceedRight || wouldExceedBottom) {
        //   const newPageWidth = wouldExceedRight ? Math.max(pageWidth, newX + totalWidth + padding * 2) : pageWidth;
        //   const newPageHeight = wouldExceedBottom ? Math.max(pageHeight, newY + totalHeight + padding * 2) : pageHeight;
        //   const pageIndex = parseInt(pageContainer.getAttribute('data-page-index') || '0');
        //   const expandEvent = new CustomEvent('expandPage', {
        //     detail: {
        //       pageIndex,
        //       newWidth: newPageWidth,
        //       newHeight: newPageHeight
        //     }
        //   });
        //   window.dispatchEvent(expandEvent);
        // }
      }
      
      // Apply changes immediately
      wrapperRef.current.style.width = `${newWidth}px`;
      wrapperRef.current.style.height = `${newHeight}px`;
      wrapperRef.current.style.left = `${newX}px`;
      wrapperRef.current.style.top = `${newY}px`;
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, resizeDirection, field.width, field.height, onUpdatePosition, getEffectiveDimensions]);
  

  
  const handleMouseUp = useCallback(() => {
    // Calculate effective dimensions based on field type - use the same calculation as in the render function
    const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();
    
    if (isDragging && wrapperRef.current && onUpdatePosition) {
      // Calculate the final position based on the current transform
      const currentTransform = wrapperRef.current.style.transform;
      let finalX = initialPosition.x;
      let finalY = initialPosition.y;
      
      // Extract position from transform if it exists
      if (currentTransform && currentTransform.includes('translate')) {
        const matches = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (matches) {
          const deltaX = parseFloat(matches[1]) || 0;
          const deltaY = parseFloat(matches[2]) || 0;
          finalX = initialPosition.x + deltaX;
          finalY = initialPosition.y + deltaY;
        }
      }
      
      // For table widgets, implement row-based positioning with 100% width
      if (field.type === 'layoutTable' || field.type === 'dataTable') {
        // Tables take full width and position themselves in rows
        const tableWidth = pageWidth - 24; // Full width minus padding
        const tableX = 12; // Standard left padding
        
        // Reset all visual enhancements and apply final position
        wrapperRef.current.style.transform = 'none';
        wrapperRef.current.style.transition = 'all 0.3s ease-out';
        wrapperRef.current.style.zIndex = field.zIndex?.toString() || '1';
        wrapperRef.current.style.boxShadow = '';
        
        // Update field with full width and constrained Y position
        onUpdateSize(fieldId, tableWidth, effectiveHeight);
        onUpdatePosition(fieldId, tableX, Math.max(0, Math.min(finalY, pageHeight - effectiveHeight - 24)));
      } else {
        // For non-table widgets, allow free positioning without grid constraints
        // Ensure the widget stays within page bounds
        const constrainedX = Math.max(0, Math.min(finalX, pageWidth - effectiveWidth - 24));
        const constrainedY = Math.max(0, Math.min(finalY, pageHeight - effectiveHeight - 24));
        
        // Reset all visual enhancements and apply final position
        wrapperRef.current.style.transform = 'none';
        wrapperRef.current.style.transition = 'all 0.3s ease-out';
        wrapperRef.current.style.zIndex = field.zIndex?.toString() || '1';
        wrapperRef.current.style.boxShadow = '';
        
        // Update the field position to the free position (no grid snapping)
        onUpdatePosition(fieldId, constrainedX, constrainedY);
      }
    }
    
    if (isResizing && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        // Get page dimensions for width calculation
        const pageContainer = wrapperRef.current.closest('[data-page-container]') as HTMLElement;
        let pageWidth = 595;
        
        if (pageContainer) {
          const computedStyle = window.getComputedStyle(pageContainer);
          pageWidth = parseInt(computedStyle.width) || 595;
        }
        
        // Enforce fixed width constraint
        const fixedWidth = pageWidth * (GRID_CONSTANTS.WIDGET_WIDTH_PERCENT / 100);
        const newHeight = rect.height;
        
        // Snap position to grid
        const currentX = rect.left - parentRect.left - 12;
        const currentY = rect.top - parentRect.top - 12;
        const gridLayout = calculateGridLayout(pageWidth, pageHeight, currentFields);
        const gridCell = getGridCellFromPosition(currentX, currentY, gridLayout);
        if (gridCell) {
          const snapPosition = snapToGridCell(gridCell.row, gridCell.col, gridLayout);
        
          onUpdateSize(fieldId, fixedWidth, newHeight);
          if (onUpdatePosition) {
            onUpdatePosition(fieldId, snapPosition.x, snapPosition.y);
          }
        } else {
          onUpdateSize(fieldId, fixedWidth, newHeight);
        }
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [isDragging, isResizing, fieldId, field.type, field.width, field.height, field.settings, onUpdateSize, onUpdatePosition, getEffectiveDimensions]);
  
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();

  return (
    <div 
      ref={wrapperRef} 
      className={`absolute transition-all duration-200 group ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'} ${isResizing ? 'z-50' : ''}`}
      style={{ 
        // Use effective dimensions for both width/height and min-width/min-height
        // This ensures the border properly follows the content boundaries
        width: effectiveWidth,
        height: effectiveHeight,
        minWidth: effectiveWidth,
        minHeight: effectiveHeight,
        left: field.x || 0,
        top: field.y || 0,
        zIndex: isSelected ? 10 : (field.zIndex || 1),
        boxSizing: 'border-box', // Ensure consistent box sizing
        padding: '0', // Remove any padding that might affect positioning
        overflow: 'visible' // Allow resize handles to extend outside
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Main content area - using consistent effective dimensions */}
      <div 
        className="w-full h-full pointer-events-none"
        style={{
          // Use 100% to fill the parent container which now has the correct effective dimensions
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: '0', // Remove any padding that might affect content positioning
          margin: '0', // Remove any margin that might affect content positioning
          position: 'absolute', // Ensure absolute positioning
          top: '0',
          left: '0',
          right: '0',
          bottom: '0'
        }}
      >
        {children}
      </div>
      

      
      {/* Resize handles - only visible when selected */}
      {isSelected && (
        <>
          {/* Corner handles - larger and easier to grab */}
          <div 
            className="absolute -top-3 -left-3 w-6 h-6 bg-ai-blue border-2 border-white cursor-nw-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            title="Resize northwest"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -top-3 -right-3 w-6 h-6 bg-ai-blue border-2 border-white cursor-ne-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            title="Resize northeast"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 -left-3 w-6 h-6 bg-ai-blue border-2 border-white cursor-sw-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            title="Resize southwest"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-ai-blue border-2 border-white cursor-se-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            title="Resize southeast"
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Edge handles */}
          <div 
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-ai-blue border-2 border-white cursor-n-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            title="Resize north"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-ai-blue border-2 border-white cursor-s-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            title="Resize south"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-ai-blue border-2 border-white cursor-w-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            title="Resize west"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-ai-blue border-2 border-white cursor-e-resize z-30 rounded-full shadow-lg hover:bg-ai-blue-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            title="Resize east"
            style={{ pointerEvents: 'auto' }}
          />
          

          
          {/* Resize instructions */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded text-xs font-medium pointer-events-none z-30 shadow-lg whitespace-nowrap">
            <div className="text-center">
              <div>Hold <span className="font-bold">Shift</span> for proportional resize</div>
              <div>Hold <span className="font-bold">Ctrl/Cmd</span> for zoom-like scaling</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Draggable Widget with proper drag and drop
const DraggableWidget = ({ type, icon, label, onDragStart, onDragEnd }: { 
  type: string, 
  icon: React.ReactNode, 
  label: string,
  onDragStart?: () => void,
  onDragEnd?: () => void
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onDragStart?.(); // Notify parent component
    e.dataTransfer.setData('application/json', JSON.stringify({ type, label }));
    e.dataTransfer.setData('text/plain', type); // Also set as text/plain for compatibility
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.(); // Notify parent component
  };
  
  return (
    <div
      className={`flex items-center p-3 bg-dark-700/50 rounded-md cursor-grab hover:bg-dark-600/50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {icon}
      <span className="text-sm ml-2">{label}</span>
    </div>
  );
};

const FormBuilder: React.FC<FormBuilderProps> = ({ 
  formPages, 
  setFormPages, 
  currentPageIndex, 
  setCurrentPageIndex, 
  selectedField, 
  setSelectedField, 
  isDragging, 
  setIsDragging, 
  activeTab, 
  setActiveTab,
  showPreview,
  setShowPreview
}) => {
  // Zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1);
  const minZoom = 0.5; // Two A4 pages side by side
  const maxZoom = 1.5; // One page zoomed in
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(maxZoom, prev + 0.1));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(minZoom, prev - 0.1));
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Handle trackpad zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
    }
  }, [minZoom, maxZoom]);

  // Enhanced page expansion with automatic content-based sizing
  useEffect(() => {
    const handlePageExpansion = (event: CustomEvent) => {
      const { pageIndex, newWidth, newHeight } = event.detail;
      
      setFormPages(prev => prev.map((page, index) => 
        index === pageIndex 
          ? {
              ...page,
              dimensions: {
                ...page.dimensions,
                width: newWidth,
                height: newHeight
              }
            }
          : page
      ));
    };

    document.addEventListener('expandPage', handlePageExpansion as EventListener);
    
    return () => {
      document.removeEventListener('expandPage', handlePageExpansion as EventListener);
    };
  }, [setFormPages]);
  
  // Auto-fit page size based on content
  const autoFitPageToContent = useCallback((pageIndex: number) => {
    const page = formPages[pageIndex];
    if (!page || page.fields.length === 0) return;
    
    let maxX = 0;
    let maxY = 0;
    const padding = 48; // Extra padding around content
    
    page.fields.forEach(field => {
      const x = field.x || 0;
      const y = field.y || 0;
      let width = field.width || 200;
      let height = field.height || 40;
      
      // Calculate additional space for content-heavy widgets
      if (field.type === 'checkbox' || field.type === 'multipleChoice') {
        const options = field.settings?.options?.length || 1;
        width += Math.max(0, options * 15);
        height += Math.max(0, (options - 3) * 10);
      } else if (field.type === 'multiselect') {
        const options = field.settings?.options?.length || 1;
        height += Math.max(0, (options - 5) * 8);
      } else if (field.type === 'textarea') {
        const rows = field.settings?.rows || 4;
        height += Math.max(0, (rows - 4) * 5);
      } else if (field.type === 'layoutTable' || field.type === 'dataTable') {
        width = Math.max(width, (field.settings?.columns || 3) * 100);
        height = Math.max(height, (field.settings?.rows || 3) * 30);
      }
      
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    const newWidth = Math.max(page.dimensions.width, maxX + padding);
    const newHeight = Math.max(page.dimensions.height, maxY + padding);
    
    // Only update if size needs to increase
    if (newWidth > page.dimensions.width || newHeight > page.dimensions.height) {
      setFormPages(prev => prev.map((p, index) => 
        index === pageIndex 
          ? {
              ...p,
              dimensions: {
                ...p.dimensions,
                width: newWidth,
                height: newHeight
              }
            }
          : p
      ));
    }
  }, [formPages, setFormPages]);
  
  // Auto-fit disabled - maintain fixed page size
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     autoFitPageToContent(currentPageIndex);
  //   }, 100);
  //   return () => clearTimeout(timeoutId);
  // }, [formPages[currentPageIndex]?.fields, currentPageIndex, autoFitPageToContent]);

  // Handle keyboard delete
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedField) {
      e.preventDefault();
      setFormPages(prev => prev.map((page, index) => 
        index === currentPageIndex 
          ? { ...page, fields: page.fields.filter(field => field.id !== selectedField.id) }
          : page
      ));
      setSelectedField(null);
    }
  }, [selectedField, currentPageIndex]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Add state for AI modal
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  
  // Add page dimension controls
  const [currentPageSize, setCurrentPageSize] = useState<'A4' | 'A3' | 'A5'>('A4');
  const [currentPageOrientation, setCurrentPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // Page dimensions mapping
  const pageDimensions = {
    A4: { portrait: { width: 595, height: 842 }, landscape: { width: 842, height: 595 } },
    A3: { portrait: { width: 842, height: 1191 }, landscape: { width: 1191, height: 842 } },
    A5: { portrait: { width: 420, height: 595 }, landscape: { width: 595, height: 420 } }
  };
  
  // Get current page dimensions
  const getCurrentPageDimensions = () => {
    const currentPage = formPages[currentPageIndex];
    if (currentPage?.dimensions) {
      return currentPage.dimensions;
    }
    return {
      ...pageDimensions[currentPageSize][currentPageOrientation],
      size: currentPageSize,
      orientation: currentPageOrientation
    };
  };
  
  // Update page dimensions
  const updatePageDimensions = (size: 'A4' | 'A3' | 'A5', orientation: 'portrait' | 'landscape') => {
    const newDimensions = pageDimensions[size][orientation];
    setFormPages(prev => prev.map((page) => ({ 
      ...page, 
      dimensions: { 
        ...newDimensions, 
        size, 
        orientation 
      } 
    })));
    setCurrentPageSize(size);
    setCurrentPageOrientation(orientation);
  };
  
  // Helper functions for form builder
  const formHistoryRef = useRef<{past: FormPage[][], future: FormPage[][]}>(
    {past: [], future: []}
  );
  
  // Add state for resizing
  const [resizeData, setResizeData] = useState<ResizeData>({
    isResizing: false,
    fieldId: null,
    initialWidth: 0,
    initialHeight: 0,
    currentWidth: 0,
    currentHeight: 0,
    startX: 0,
    startY: 0
  });
  
  // Function to update field size with grid constraints
  const updateFieldSize = (fieldId: string, width: number, height: number) => {
    saveToHistory();
    const currentDimensions = getCurrentPageDimensions();
    
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      const updatedFields = page.fields.map(field => {
        if (field.id === fieldId) {
          // Enforce fixed width constraint (45% of page width)
          const fixedWidth = (currentDimensions.width * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
          return { ...field, width: fixedWidth, height };
        }
        return field;
      });
      
      // Recalculate grid layout with updated fields
      const gridLayout = calculateGridLayout(currentDimensions.width, currentDimensions.height, updatedFields);
      
      // Update field positions based on new grid layout
      const finalFields = updatedFields.map(field => {
        if (field.gridRow !== undefined && field.gridCol !== undefined) {
          const cellPosition = snapToGridCell(field.gridRow, field.gridCol, gridLayout);
          return {
            ...field,
            x: cellPosition.x,
            y: cellPosition.y,
            width: cellPosition.width
          };
        }
        return field;
      });
      
      return { ...page, fields: finalFields };
    }));
  };
  
  // Function to update field position with grid constraints
  const updateFieldPosition = (fieldId: string, x: number, y: number) => {
    saveToHistory();
    const currentDimensions = getCurrentPageDimensions();
    
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      const currentFields = page.fields;
      // Exclude the field being moved from collision detection
      const otherFields = currentFields.filter(field => field.id !== fieldId);
      const gridLayout = calculateGridLayout(currentDimensions.width, currentDimensions.height, otherFields);
      
      // Find the target grid cell from the new position
      const targetCell = getGridCellFromPosition(x, y, gridLayout);
      
      const updatedFields = currentFields.map(field => {
        if (field.id === fieldId) {
          if (targetCell && !gridLayout.cells[targetCell.row][targetCell.col].occupied) {
            // Snap to the target grid cell
            const cellPosition = snapToGridCell(targetCell.row, targetCell.col, gridLayout);
            return {
              ...field,
              x: cellPosition.x,
              y: cellPosition.y,
              gridRow: targetCell.row,
              gridCol: targetCell.col
            };
          } else {
            // Find the nearest available cell
            const availableCell = findAvailableGridCell(gridLayout);
            if (availableCell) {
              const cellPosition = snapToGridCell(availableCell.row, availableCell.col, gridLayout);
              return {
                ...field,
                x: cellPosition.x,
                y: cellPosition.y,
                gridRow: availableCell.row,
                gridCol: availableCell.col
              };
            }
          }
        }
        return field;
      });
      
      // Recalculate grid layout with updated positions
      const finalGridLayout = calculateGridLayout(currentDimensions.width, currentDimensions.height, updatedFields);
      
      // Update all field positions to reflect new row heights
      const finalFields = updatedFields.map(field => {
        if (field.gridRow !== undefined && field.gridCol !== undefined) {
          const cellPosition = snapToGridCell(field.gridRow, field.gridCol, finalGridLayout);
          return {
            ...field,
            x: cellPosition.x,
            y: cellPosition.y
          };
        }
        return field;
      });
      
      return { ...page, fields: finalFields };
    }));
  };
  
  const saveToHistory = () => {
    formHistoryRef.current.past.push(JSON.parse(JSON.stringify(formPages)));
    formHistoryRef.current.future = [];
    // Limit history to 50 items
    if (formHistoryRef.current.past.length > 50) {
      formHistoryRef.current.past.shift();
    }
  };
  
  const undo = () => {
    if (formHistoryRef.current.past.length === 0) return;
    const previous = formHistoryRef.current.past.pop();
    formHistoryRef.current.future.push(JSON.parse(JSON.stringify(formPages)));
    if (previous) setFormPages(previous);
  };
  
  const redo = () => {
    if (formHistoryRef.current.future.length === 0) return;
    const next = formHistoryRef.current.future.pop();
    formHistoryRef.current.past.push(JSON.parse(JSON.stringify(formPages)));
    if (next) setFormPages(next);
  };
  
  // Enhanced addFormField function with grid-based positioning
  const addFormField = (type: string, x?: number, y?: number, targetGridRow?: number, targetGridCol?: number) => {
    saveToHistory();
    const currentDimensions = getCurrentPageDimensions();
    
    // Calculate grid layout for current page
    const currentFields = formPages[currentPageIndex].fields;
    const gridLayout = calculateGridLayout(currentDimensions.width, currentDimensions.height, currentFields);
    
    // Fixed widget width (45% of page width) for all widgets
    const widgetWidth = (currentDimensions.width * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
    
    // Default field height based on type
    const defaultHeight = type === 'layoutTable' || type === 'dataTable' ? 200 : 
                          type === 'signature' ? 80 : 
                          type === 'textarea' ? 80 :
                          type === 'image' || type === 'attachment' ? 120 : 40;
    
    // Find available grid cell
    const findAvailableCell = (preferredRow?: number, preferredCol?: number): {row: number, col: number, x: number, y: number} | null => {
      // If specific cell is requested, check if it's available
      if (preferredRow !== undefined && preferredCol !== undefined) {
        if (preferredRow >= 0 && preferredRow < GRID_CONSTANTS.ROWS && 
            preferredCol >= 0 && preferredCol < GRID_CONSTANTS.COLS &&
            !gridLayout.cells[preferredRow][preferredCol].occupied) {
          const cell = gridLayout.cells[preferredRow][preferredCol];
          return { row: preferredRow, col: preferredCol, x: cell.x, y: cell.y };
        }
      }
      
      // If drop coordinates are provided, find nearest available cell
      if (x !== undefined && y !== undefined) {
        let nearestCell = null;
        let minDistance = Infinity;
        
        for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
          for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
            if (!gridLayout.cells[row][col].occupied) {
              const cell = gridLayout.cells[row][col];
              const distance = Math.sqrt(Math.pow(cell.x - x, 2) + Math.pow(cell.y - y, 2));
              if (distance < minDistance) {
                minDistance = distance;
                nearestCell = { row, col, x: cell.x, y: cell.y };
              }
            }
          }
        }
        
        if (nearestCell) return nearestCell;
      }
      
      // Find first available cell (top to bottom, left to right)
      for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
        for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
          if (!gridLayout.cells[row][col].occupied) {
            const cell = gridLayout.cells[row][col];
            return { row, col, x: cell.x, y: cell.y };
          }
        }
      }
      
      // If no cells available, return null to prevent overlap
      return null;
    };
    
    // Get the target cell
    const targetCell = findAvailableCell(targetGridRow, targetGridCol);
    
    // If no available cell found, show alert and return
    if (!targetCell) {
      alert('No available grid cells. Please remove some widgets to add new ones.');
      return;
    }
    
    const finalX = targetCell.x;
    const finalY = targetCell.y;
    const gridRow = targetCell.row;
    const gridCol = targetCell.col;
    
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      settings: {
        required: false,
        placeholder: '',
        hideTitle: false,
        titleLayout: 'horizontal',
        options: type === 'multipleChoice' || type === 'checkbox' || type === 'select' ? ['Option 1', 'Option 2'] : [],
        allowMultiple: false,
        allowSearch: false,
        maxSize: '10MB',
        rows: 3,
        columns: 3,
        hiddenFrameLine: false,
        showHeader: true,
        showBorders: true,
        stripedRows: false,
        resizableColumns: false,
        sortableColumns: false,
        filterableColumns: false,
        pagination: false
      },
      width: widgetWidth,
      height: defaultHeight,
      x: finalX,
      y: finalY,
      zIndex: 1,
      gridRow,
      gridCol
    };

    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? { ...page, fields: [...page.fields, newField] }
        : page
    ));
  };
  
  // Handle drop event with proper positioning
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      // Check if this is a new widget being dropped (has dataTransfer data)
      const dataTransferData = e.dataTransfer.getData('application/json');
      if (!dataTransferData) {
        // This might be an existing widget being dragged, let the ResizableWrapper handle it
        return;
      }
      
      const data = JSON.parse(dataTransferData);
      const rect = e.currentTarget.getBoundingClientRect();
      const currentDimensions = getCurrentPageDimensions();
      
      // Calculate position relative to the canvas with better precision
      const canvasElement = e.currentTarget.querySelector('[data-canvas="true"]');
      const canvasRect = canvasElement?.getBoundingClientRect() || rect;
      
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      
      // Use grid-based positioning
      addFormField(data.type, x, y);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Only set isDragging to true if this is a new widget being dragged from the palette
    try {
      const dataTransferData = e.dataTransfer.getData('application/json');
      if (dataTransferData) {
        setIsDragging(true);
      }
    } catch (error) {
      // Ignore error, might be dragging existing widget
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set isDragging to false if we're leaving the drop zone completely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };
  
  const removeField = (fieldId: string) => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? { ...page, fields: page.fields.filter(field => field.id !== fieldId) }
        : page
    ));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(null);
    }
  };
  
  const updateFieldSettings = (fieldId: string, settings: Record<string, any>) => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            fields: page.fields.map(field => 
              field.id === fieldId 
                ? { ...field, settings: { ...field.settings, ...settings } }
                : field
            )
          }
        : page
    ));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : null);
    }
  };
  
  const updateFieldLabel = (fieldId: string, label: string) => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            fields: page.fields.map(field => 
              field.id === fieldId 
                ? { ...field, label }
                : field
            )
          }
        : page
    ));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, label } : null);
    }
  };
  
  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      const fieldIndex = page.fields.findIndex(field => field.id === fieldId);
      if (fieldIndex === -1) return page;
      
      const newFields = [...page.fields];
      const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
      
      if (newIndex >= 0 && newIndex < newFields.length) {
        [newFields[fieldIndex], newFields[newIndex]] = [newFields[newIndex], newFields[fieldIndex]];
      }
      
      return { ...page, fields: newFields };
    }));
  };
  
  const addPage = () => {
    saveToHistory();
    const newPage: FormPage = {
      id: `page_${Date.now()}`,
      fields: [],
      dimensions: {
        width: 595,
        height: 842,
        orientation: 'portrait',
        size: 'A4'
      }
    };
    setFormPages(prev => [...prev, newPage]);
  };
  
  const deletePage = () => {
    if (formPages.length > 1) {
      saveToHistory();
      setFormPages(prev => prev.filter((_, index) => index !== currentPageIndex));
      if (currentPageIndex >= formPages.length - 1) {
        setCurrentPageIndex(formPages.length - 2);
      }
    }
  };
  
  // Function to check if a field would overflow the page
  const checkFieldOverflow = (field: any, pageHeight: number) => {
    const fieldBottom = (field.y || 0) + (field.height || 40);
    return fieldBottom > pageHeight - 20; // 20px bottom margin
  };

  // Function to detect and group fields into logical rows
  const detectFieldRows = (fields: any[]) => {
    if (fields.length === 0) return [];
    
    // Sort fields by Y position first
    const sortedFields = [...fields].sort((a, b) => (a.y || 0) - (b.y || 0));
    
    const rows: any[][] = [];
    let currentRow: any[] = [];
    let currentRowY = sortedFields[0].y || 0;
    const rowTolerance = 20; // Fields within 20px vertically are considered same row
    
    sortedFields.forEach((field) => {
      const fieldY = field.y || 0;
      const fieldHeight = field.height || 40;
      
      // Check if this field belongs to the current row
      // A field belongs to the same row if its Y position is within tolerance
      // or if it overlaps vertically with the current row
      const rowBottom = currentRowY + Math.max(...currentRow.map(f => f.height || 40));
      const fieldBottom = fieldY + fieldHeight;
      
      const isInSameRow = 
        Math.abs(fieldY - currentRowY) <= rowTolerance || // Same Y level
        (fieldY < rowBottom && fieldBottom > currentRowY); // Vertical overlap
      
      if (currentRow.length === 0 || isInSameRow) {
        // Add to current row
        currentRow.push(field);
        // Update row Y to be the minimum Y of all fields in the row
        currentRowY = Math.min(currentRowY, fieldY);
      } else {
        // Start a new row
        if (currentRow.length > 0) {
          // Sort current row by X position before adding
          currentRow.sort((a, b) => (a.x || 0) - (b.x || 0));
          rows.push([...currentRow]);
        }
        currentRow = [field];
        currentRowY = fieldY;
      }
    });
    
    // Add the last row
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => (a.x || 0) - (b.x || 0));
      rows.push(currentRow);
    }
    
    return rows;
  };
  
  // Function to calculate row height including spacing
  const calculateRowHeight = (row: any[]) => {
    if (row.length === 0) return 0;
    const maxHeight = Math.max(...row.map(field => field.height || 40));
    const verticalSpacing = 15; // Space between rows
    return maxHeight + verticalSpacing;
  };
  
  // Function to position fields within a row with proper spacing
  const positionFieldsInRow = (row: any[], startY: number, pageWidth: number) => {
    if (row.length === 0) return row;
    
    const margins = { left: 50, right: 50 };
    const availableWidth = pageWidth - margins.left - margins.right;
    const fieldSpacing = 10; // Horizontal spacing between fields
    
    // Calculate total width needed for all fields
    const totalFieldWidth = row.reduce((sum, field) => sum + (field.width || 300), 0);
    const totalSpacingWidth = (row.length - 1) * fieldSpacing;
    const totalNeededWidth = totalFieldWidth + totalSpacingWidth;
    
    let currentX = margins.left;
    
    // If fields don't fit in one row, stack them or adjust positioning
    if (totalNeededWidth > availableWidth && row.length > 1) {
      // Try to fit fields by reducing spacing or wrapping to next line
      const adjustedSpacing = Math.max(5, (availableWidth - totalFieldWidth) / (row.length - 1));
      
      return row.map((field, index) => {
        const positionedField = {
          ...field,
          x: currentX,
          y: startY
        };
        currentX += (field.width || 300) + adjustedSpacing;
        return positionedField;
      });
    } else {
      // Normal positioning with standard spacing
      return row.map((field, index) => {
        const positionedField = {
          ...field,
          x: currentX,
          y: startY
        };
        currentX += (field.width || 300) + fieldSpacing;
        return positionedField;
      });
    }
  };

  // Function to distribute fields across pages with intelligent row-based layout
  const distributeFieldsAcrossPages = (fields: any[], pageDimensions: any = {
    width: 595,
    height: 842,
    orientation: 'portrait' as const,
    size: 'A4' as const
  }) => {
    const pages: FormPage[] = [];
    let currentPageFields: any[] = [];
    let currentY = 50; // Start with top margin
    const pageHeight = pageDimensions.height;
    const pageWidth = pageDimensions.width;
    const bottomMargin = 50;
    
    // Detect rows from the input fields
    const rows = detectFieldRows(fields);
    
    console.log('Detected rows:', rows.length, rows);

    // Process each row
    rows.forEach((row, rowIndex) => {
      const rowHeight = calculateRowHeight(row);
      const rowBottom = currentY + rowHeight;

      // Check if row would overflow the page
      if (rowBottom > pageHeight - bottomMargin) {
        // Create a new page with current fields
        if (currentPageFields.length > 0) {
          pages.push({
            id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fields: [...currentPageFields],
            dimensions: { ...pageDimensions }
          });
        }
        
        // Start a new page
        currentPageFields = [];
        currentY = 50; // Reset Y position for new page with top margin
      }

      // Position all fields in this row
      const positionedFields = positionFieldsInRow(row, currentY, pageWidth);
      
      // Add all fields from this row to current page
      positionedFields.forEach(field => {
        const updatedField = {
          ...field,
          pageNumber: pages.length + 1
        };
        currentPageFields.push(updatedField);
      });
      
      // Move to next row position
      currentY += rowHeight;
    });

    // Add the last page if it has fields
    if (currentPageFields.length > 0) {
      pages.push({
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fields: [...currentPageFields],
        dimensions: { ...pageDimensions }
      });
    }

    return pages;
  };

  // Process paired fields from AI response
  const processPairedFields = (formData: any): FormPage[] => {
    console.log('processPairedFields called with:', formData);
    const { formName, formDescription, fieldPairs } = formData;
    console.log('Extracted fieldPairs:', fieldPairs);
    const processedFields: FormField[] = [];
    
    const defaultDimensions = {
      width: 595,
      height: 842,
      orientation: 'portrait' as const,
      size: 'A4' as const
    };
    
    // Fixed widget width (45% of page width) for all widgets
    const widgetWidth = (defaultDimensions.width * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
    console.log('Widget width calculated:', widgetWidth);
    
    let currentRow = 0;
    let currentCol = 0;
    let currentPageIndex = 0;
    const pages: FormPage[] = [];
    
    // Initialize first page
    pages.push({
      id: `page_${Date.now()}_${currentPageIndex}`,
      fields: [],
      dimensions: defaultDimensions
    });
    console.log('Initialized first page');
    
    // Process each pair
    fieldPairs.forEach((pair: any, pairIndex: number) => {
      console.log(`Processing pair ${pairIndex}:`, pair);
      const { fields } = pair;
      
      // Check if we need to move to next row (if current row is full)
      if (currentCol >= GRID_CONSTANTS.COLS) {
        currentRow++;
        currentCol = 0;
      }
      
      // Check if we need a new page
      if (currentRow >= GRID_CONSTANTS.ROWS) {
        // Create new page
        currentPageIndex++;
        pages.push({
          id: `page_${Date.now()}_${currentPageIndex}`,
          fields: [],
          dimensions: defaultDimensions
        });
        currentRow = 0;
        currentCol = 0;
      }
      
      // Calculate grid layout for current page
      const gridLayout = calculateGridLayout(
        defaultDimensions.width, 
        defaultDimensions.height, 
        pages[currentPageIndex].fields
      );
      
      // Place fields in the pair side by side
      fields.forEach((field: any, fieldIndex: number) => {
        // Ensure we don't exceed column limit
        if (currentCol >= GRID_CONSTANTS.COLS) {
          currentRow++;
          currentCol = 0;
          
          // Check if we need a new page again
          if (currentRow >= GRID_CONSTANTS.ROWS) {
            currentPageIndex++;
            pages.push({
              id: `page_${Date.now()}_${currentPageIndex}`,
              fields: [],
              dimensions: defaultDimensions
            });
            currentRow = 0;
            currentCol = 0;
          }
        }
        
        const cell = gridLayout.cells[currentRow][currentCol];
        
        // Default field height based on type
        const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                              field.type === 'signature' ? 80 : 
                              field.type === 'textarea' ? 80 :
                              field.type === 'image' || field.type === 'attachment' ? 120 : 40;
        
        const processedField: FormField = {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          width: widgetWidth,
          height: defaultHeight,
          x: cell.x,
          y: cell.y,
          zIndex: 1,
          gridRow: currentRow,
          gridCol: currentCol,
          settings: {
            required: field.settings?.required || false,
            placeholder: field.settings?.placeholder || 'Enter text...',
            hideTitle: field.settings?.hideTitle || false,
            titleLayout: field.settings?.titleLayout || 'horizontal',
            ...field.settings
          }
        };
        
        // Field-specific settings processing
        switch (field.type) {
          case 'select':
          case 'checkbox':
          case 'multipleChoice':
            processedField.settings.options = field.settings?.options || ['Option 1', 'Option 2', 'Option 3'];
            processedField.settings.allowMultiple = field.type === 'checkbox';
            break;
            
          case 'textarea':
            processedField.settings.rows = field.settings?.rows || 3;
            break;
            
          case 'file':
            processedField.settings.maxSize = field.settings?.maxSize || '10MB';
            processedField.settings.allowedTypes = field.settings?.allowedTypes || ['image/*'];
            break;
        }
        
        // Add field to current page
        pages[currentPageIndex].fields.push(processedField);
        console.log(`Added field to page ${currentPageIndex}:`, processedField.label);
        
        // Move to next column for next field in pair
        currentCol++;
      });
      
      // After processing a pair, move to next row
      currentRow++;
      currentCol = 0;
    });
    
    console.log('Final pages before filtering:', pages.map(p => ({ id: p.id, fieldCount: p.fields.length })));
    const filteredPages = pages.filter(page => page.fields.length > 0);
    console.log('Filtered pages:', filteredPages.map(p => ({ id: p.id, fieldCount: p.fields.length })));
    return filteredPages; // Remove empty pages
  };

  const handleAIFormGenerated = (formData: any) => {
    console.log('Received AI generated form data:', formData);
    saveToHistory();
    
    // Handle new paired field structure
    if (formData.fieldPairs && formData.fieldPairs.length > 0) {
      const processedPages = processPairedFields(formData);
      setFormPages(processedPages);
      setCurrentPageIndex(0);
      setShowAIGenerator(false);
      return;
    }
    
    if (formData.pages && formData.pages.length > 0) {
      // The form data already has pages structure, process each page
      const processedPages = formData.pages.map((page: any) => {
        // Process the fields in each page using grid positioning
        const processedFields: FormField[] = [];
        const currentDimensions = page.dimensions || {
          width: 595,
          height: 842,
          orientation: 'portrait' as const,
          size: 'A4' as const
        };
        
        // Calculate grid layout for this page
        const gridLayout = calculateGridLayout(currentDimensions.width, currentDimensions.height, []);
        
        page.fields.forEach((field: any, index: number) => {
          // Find available grid cell for this field
          const findAvailableCell = (): {row: number, col: number, x: number, y: number} | null => {
            for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
              for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
                if (!gridLayout.cells[row][col].occupied) {
                  const cell = gridLayout.cells[row][col];
                  // Mark this cell as occupied for subsequent fields
                  gridLayout.cells[row][col].occupied = true;
                  return { row, col, x: cell.x, y: cell.y };
                }
              }
            }
            return null;
          };
          
          const targetCell = findAvailableCell();
          if (!targetCell) {
            console.warn(`No available grid cell for AI-generated field ${index + 1}. Skipping field.`);
            return;
          }
          
          // Fixed widget width (45% of page width) for all widgets
          const widgetWidth = (currentDimensions.width * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
          
          // Default field height based on type
          const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                                field.type === 'signature' ? 80 : 
                                field.type === 'textarea' ? 80 :
                                field.type === 'image' || field.type === 'attachment' ? 120 : 40;
          
          const baseField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: field.type || 'text',
            label: field.label || 'Generated Field',
            width: widgetWidth,
            height: field.height || defaultHeight,
            x: targetCell.x,
            y: targetCell.y,
            zIndex: 1,
            gridRow: targetCell.row,
            gridCol: targetCell.col
          };

          // Process settings based on field type
          let settings: Record<string, any> = {
            required: field.settings?.required || false,
            placeholder: field.settings?.placeholder || '',
            hideTitle: field.settings?.hideTitle || false,
            titleLayout: field.settings?.titleLayout || 'horizontal',
            ...field.settings
          };

          // Field-specific settings processing
          switch (field.type) {
            case 'select':
            case 'checkbox':
            case 'multipleChoice':
              settings.options = field.settings?.options || ['Option 1', 'Option 2', 'Option 3'];
              settings.allowMultiple = field.type === 'checkbox';
              settings.allowSearch = field.settings?.allowSearch || false;
              break;
              
            case 'layoutTable':
            case 'dataTable':
              settings.rows = field.settings?.rows || 3;
              settings.columns = field.settings?.columns || 3;
              settings.headers = field.settings?.headers || [];
              settings.data = field.settings?.data || [];
              settings.showHeader = field.settings?.showHeader !== false;
              settings.hiddenFrameLine = field.settings?.hiddenFrameLine || false;
              
              // Ensure minimum table size
              baseField.width = Math.max(400, baseField.width);
              baseField.height = Math.max(150, baseField.height);
              
              // If headers are provided but data is empty, create empty data structure
              if (settings.headers.length > 0 && settings.data.length === 0) {
                settings.columns = settings.headers.length;
                settings.data = Array.from({ length: settings.rows }, () => 
                  Array.from({ length: settings.columns }, () => '')
                );
              }
              
              // If data is provided, adjust rows/columns to match
              if (settings.data.length > 0) {
                settings.rows = settings.data.length;
                settings.columns = Math.max(settings.columns, Math.max(...settings.data.map((row: any[]) => row.length)));
              }
              break;
              
            case 'number':
              settings.min = field.settings?.min;
              settings.max = field.settings?.max;
              settings.step = field.settings?.step || 1;
              settings.numberFormat = field.settings?.numberFormat || 'integer';
              break;
              
            case 'text':
              settings.inputType = field.settings?.inputType || 'text';
              settings.maxLength = field.settings?.maxLength;
              settings.pattern = field.settings?.pattern || '';
              break;
              
            case 'textarea':
              settings.rows = field.settings?.rows || 3;
              baseField.height = Math.max(80, baseField.height);
              break;
              
            case 'date':
              settings.dateFormat = field.settings?.dateFormat || 'YYYY-MM-DD';
              settings.includeTime = field.settings?.includeTime || false;
              break;
              
            case 'image':
            case 'attachment':
              settings.maxSize = field.settings?.maxSize || '10MB';
              settings.allowedTypes = field.settings?.allowedTypes || (field.type === 'image' ? ['image/*'] : ['*/*']);
              baseField.height = Math.max(80, baseField.height);
              break;
              
            case 'signature':
              baseField.height = Math.max(80, baseField.height);
              break;
              
            default:
              // Keep default settings for other field types
              break;
          }

          const finalField = {
            ...baseField,
            settings
          };
          
          processedFields.push(finalField);
        });

        return {
          id: page.id || `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fields: processedFields,
          dimensions: page.dimensions || {
            width: 595,
            height: 842,
            orientation: 'portrait' as const,
            size: 'A4' as const
          }
        };
      });
      
      // Check each page for overflow and redistribute fields if needed
      const finalPages: FormPage[] = [];
      
      processedPages.forEach((page: FormPage) => {
        // Check if any field overflows the page height
        let hasOverflow = false;
        for (const field of page.fields) {
          if (checkFieldOverflow(field, page.dimensions.height)) {
            hasOverflow = true;
            break;
          }
        }
        
        if (hasOverflow) {
          // If overflow detected, redistribute this page's fields
          const redistributedPages = distributeFieldsAcrossPages(page.fields, page.dimensions);
          finalPages.push(...redistributedPages);
        } else {
          // No overflow, keep the page as is
          finalPages.push(page);
        }
      });
      
      // Replace the current form pages with the processed pages
      setFormPages(finalPages);
      setCurrentPageIndex(0); // Set to the first page
    } else if (formData.fields && formData.fields.length > 0) {
      // Legacy support for form data with only fields property
      // Process the form data using grid positioning
      const processedFields: FormField[] = [];
      const defaultDimensions = {
        width: 595,
        height: 842,
        orientation: 'portrait' as const,
        size: 'A4' as const
      };
      
      // Calculate grid layout
      const gridLayout = calculateGridLayout(defaultDimensions.width, defaultDimensions.height, []);
      
      formData.fields.forEach((field: any, index: number) => {
        // Find available grid cell for this field
        const findAvailableCell = (): {row: number, col: number, x: number, y: number} | null => {
          for (let row = 0; row < GRID_CONSTANTS.ROWS; row++) {
            for (let col = 0; col < GRID_CONSTANTS.COLS; col++) {
              if (!gridLayout.cells[row][col].occupied) {
                const cell = gridLayout.cells[row][col];
                // Mark this cell as occupied for subsequent fields
                gridLayout.cells[row][col].occupied = true;
                return { row, col, x: cell.x, y: cell.y };
              }
            }
          }
          return null;
        };
        
        const targetCell = findAvailableCell();
        if (!targetCell) {
          console.warn(`No available grid cell for AI-generated field ${index + 1}. Skipping field.`);
          return;
        }
        
        // Fixed widget width (45% of page width) for all widgets
        const widgetWidth = (defaultDimensions.width * GRID_CONSTANTS.WIDGET_WIDTH_PERCENT) / 100;
        
        // Default field height based on type
        const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                              field.type === 'signature' ? 80 : 
                              field.type === 'textarea' ? 80 :
                              field.type === 'image' || field.type === 'attachment' ? 120 : 40;
        
        const baseField = {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          width: widgetWidth,
          height: field.height || defaultHeight,
          x: targetCell.x,
          y: targetCell.y,
          zIndex: 1,
          gridRow: targetCell.row,
          gridCol: targetCell.col
        };

        // Process settings based on field type (same as above)
        let settings: Record<string, any> = {
          required: field.settings?.required || false,
          placeholder: field.settings?.placeholder || '',
          hideTitle: field.settings?.hideTitle || false,
          titleLayout: field.settings?.titleLayout || 'horizontal',
          ...field.settings
        };

        // Field-specific settings processing (simplified for brevity)
        const finalField = {
          ...baseField,
          settings
        };
        
        processedFields.push(finalField);
      });

      // Check for overflow and distribute fields across multiple pages if needed
      // Create pages with overflow handling
      const pages = distributeFieldsAcrossPages(processedFields, defaultDimensions);
      
      setFormPages(pages); // Replace with the new pages
      setCurrentPageIndex(0); // Set to the first page
    } else {
      console.warn('AI generated form data has no fields or pages');
    }
    
    setShowAIGenerator(false);
  };
  
  const renderWidgetPreview = (field: FormField) => {
    const requiredMark = field.settings.required ? <span className="text-red-500 ml-1">*</span> : null;
    
    switch (field.type) {
      case 'text':
        return (
          <div className={`p-2 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-1 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'flex-grow'}`}>
              <span className="text-gray-500">{field.settings.placeholder || 'Enter text...'}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className={`p-2 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-1 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'w-20'}`}>
              <span className="text-gray-500">{field.settings.placeholder || '0'}</span>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div className={`p-2 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-2 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'flex-grow'}`}>
              <div className="text-gray-500 leading-relaxed" style={{ minHeight: `${(field.settings.rows || 3) * 1.2}em` }}>
                {field.settings.placeholder || 'Enter multiple lines of text...'}
              </div>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className={`p-2 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-1 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'w-32'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Select date</span>
                <RiCalendarLine className="text-gray-400 text-xs" />
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className={`p-2 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-1 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'w-32'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">
                  {field.settings.options && field.settings.options.length > 0 ? 
                    field.settings.options[0] : 'Select option'}
                </span>
                <RiListOrdered className="text-gray-400 text-xs" />
              </div>
              {field.settings.options && field.settings.options.length > 1 && (
                <div className="text-xs text-gray-400 mt-1">
                  +{field.settings.options.length - 1} more options
                </div>
              )}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-1">
              {field.settings.options && field.settings.options.length > 0 ? (
                field.settings.options.slice(0, Math.min(field.settings.options.length, 4)).map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-gray-400 rounded bg-white flex-shrink-0"></div>
                    <div className="text-sm text-gray-800">{option}</div>
                  </div>
                ))
              ) : (
                field.settings.options.slice(0, 2).map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-gray-400 rounded bg-white flex-shrink-0"></div>
                    <div className="text-sm text-gray-800">{option}</div>
                  </div>
                ))
              )}
              {field.settings.options && field.settings.options.length > 4 && (
                <div className="text-xs text-gray-500 italic">
                  +{field.settings.options.length - 4} more options
                </div>
              )}
            </div>
          </div>
        );

      case 'multipleChoice':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-1">
              {field.settings.options && field.settings.options.length > 0 ? (
                field.settings.options.slice(0, Math.min(field.settings.options.length, 4)).map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-gray-400 bg-white flex-shrink-0"></div>
                    <div className="text-sm text-gray-800">{option}</div>
                  </div>
                ))
              ) : (
                field.settings.options.slice(0, 2).map((option: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-gray-400 bg-white flex-shrink-0"></div>
                    <div className="text-sm text-gray-800">{option}</div>
                  </div>
                ))
              )}
              {field.settings.options && field.settings.options.length > 4 && (
                <div className="text-xs text-gray-500 italic">
                  +{field.settings.options.length - 4} more options
                </div>
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex flex-col items-center justify-center text-gray-500 text-xs">
              <RiImageLine className="text-lg mb-1" />
              <div>Upload image</div>
            </div>
          </div>
        );

      case 'attachment':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex flex-col items-center justify-center text-gray-500 text-xs">
              <RiAttachmentLine className="text-lg mb-1" />
              <div>Upload files</div>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-gray-300 rounded p-2 bg-gray-50 h-12 flex items-center justify-center text-gray-500 text-xs">
              Sign here
            </div>
          </div>
        );

      case 'layoutTable':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className={`w-full text-xs ${field.settings.showBorders !== false ? 'border-collapse' : 'border-separate border-spacing-0'}`}>
                {field.settings.showHeader !== false && (
                  <thead className="bg-gray-100">
                    <tr>
                      {field.settings.headers && field.settings.headers.length > 0 ? (
                        field.settings.headers.map((header: string, i: number) => (
                          <th key={i} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center font-medium text-gray-800`}>
                            {header}
                          </th>
                        ))
                      ) : (
                        Array.from({ length: field.settings.columns || 3 }).map((_, i) => (
                          <th key={i} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-800`}>
                            Header {i + 1}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {field.settings.data && field.settings.data.length > 0 ? (
                    field.settings.data.map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {row.map((cell: string, colIndex: number) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-800`}>
                            {cell || ''}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-500`}>
                            
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'dataTable':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className={`w-full text-xs ${field.settings.showBorders !== false ? 'border-collapse' : 'border-separate border-spacing-0'}`}>
                <thead className="bg-gray-200">
                  <tr>
                    {field.settings.headers && field.settings.headers.length > 0 ? (
                      field.settings.headers.map((header: string, i: number) => (
                        <th key={i} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center font-medium text-gray-800`}>
                          {header}
                        </th>
                      ))
                    ) : (
                      Array.from({ length: field.settings.columns || 3 }).map((_, i) => (
                        <th key={i} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-800`}>
                          Column {i + 1}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {field.settings.data && field.settings.data.length > 0 ? (
                    field.settings.data.map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {row.map((cell: string, colIndex: number) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-800`}>
                            {cell || ''}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-500`}>
                            
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {field.settings.pagination && (
                <div className="flex justify-between items-center p-1 bg-gray-100 text-xs">
                  <button className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="text-gray-600">Page 1 of 1</span>
                  <button className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'intervalData':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-300 rounded p-2 text-xs">
              <div className="flex items-center gap-2">
                <RiSignalWifiLine className="text-gray-400" />
                <span className="text-gray-500">Interval data collection</span>
              </div>
            </div>
          </div>
        );

      case 'annotation':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex flex-col items-center justify-center text-gray-500 text-xs">
              <RiPencilLine className="text-lg mb-1" />
              <div>Add annotation</div>
            </div>
          </div>
        );

      case 'subform':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-gray-300 rounded p-2 bg-gray-50 text-xs">
              <div className="flex items-center gap-2">
                <RiApps2Line className="text-gray-400" />
                <span className="text-gray-500">Subform component</span>
              </div>
            </div>
          </div>
        );

      case 'member':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-300 rounded p-2 text-xs">
              <div className="flex items-center gap-2">
                <RiUserLine className="text-gray-400" />
                <span className="text-gray-500">Select member/department</span>
              </div>
            </div>
          </div>
        );

      case 'approvalKit':
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-gray-300 rounded p-2 bg-gray-50 text-xs">
              <div className="flex items-center gap-2">
                <RiSettings4Line className="text-gray-400" />
                <span className="text-gray-500">Approval workflow</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="text-gray-500 text-xs">
              {field.type} field
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="flex h-screen gap-4">
      {/* Left panel - Widget palette - Fixed 20% */}
      <div className="w-1/5 flex-shrink-0 flex-grow-0" style={{ width: '20%' }}>
        <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 h-full flex flex-col">
          <div className="p-4 border-b border-dark-700/50">
            <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
            
            {/* Tab navigation */}
            <div className="flex space-x-1 mb-4 bg-dark-700/30 rounded-md p-1">
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'fields' ? 'bg-ai-blue text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('fields')}
              >
                Fields
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'kit' ? 'bg-ai-blue text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('kit')}
              >
                Kit
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'table' ? 'bg-ai-blue text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('table')}
              >
                Table
              </button>
            </div>
          </div>
          
          {/* Widget list - Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
            {activeTab === 'fields' && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-gray-500 font-medium mb-2">WidgetKitTable</div>
                <div className="space-y-2">
                  <DraggableWidget 
                    type="text"
                    icon={<RiText className="mr-2" />}
                    label="Text Field"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="textarea"
                    icon={<RiFileEditLine className="mr-2" />}
                    label="Textarea"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="number"
                    icon={<span className="mr-2">123</span>}
                    label="Input Box"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="multipleChoice"
                    icon={<RiCheckboxMultipleLine className="mr-2" />}
                    label="Multiple Choice"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="checkbox"
                    icon={<RiCheckboxLine className="mr-2" />}
                    label="Checkbox"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="select"
                    icon={<RiListOrdered className="mr-2" />}
                    label="Dropdown"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="date"
                    icon={<RiCalendarLine className="mr-2" />}
                    label="Date"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="intervalData"
                    icon={<RiSignalWifiLine className="mr-2" />}
                    label="Interval Data"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="image"
                    icon={<RiImageLine className="mr-2" />}
                    label="Image"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="attachment"
                    icon={<RiAttachmentLine className="mr-2" />}
                    label="Attachment"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="annotation"
                    icon={<RiPencilLine className="mr-2" />}
                    label="Annotation"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="signature"
                    icon={<span className="mr-2">✍️</span>}
                    label="Signature"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="subform"
                    icon={<RiApps2Line className="mr-2" />}
                    label="Subform"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                  <DraggableWidget 
                    type="member"
                    icon={<RiUserLine className="mr-2" />}
                    label="Member/Department"
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'kit' && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-gray-500 font-medium mb-2">WidgetKitTable</div>
                <DraggableWidget 
                  type="approvalKit"
                  icon={<RiSettings4Line className="mr-2" />}
                  label="Approval Kit"
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
              </div>
            )}
            
            {activeTab === 'table' && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-gray-500 font-medium mb-2">WidgetKitTable</div>
                <DraggableWidget 
                  type="layoutTable"
                  icon={<RiLayoutLine className="mr-2" />}
                  label="Layout Tables"
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
                <DraggableWidget 
                  type="dataTable"
                  icon={<RiTableLine className="mr-2" />}
                  label="Data Tables"
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Center panel - MS Word-like Form builder - Fixed 50% */}
      <div className="flex-shrink-0 flex-grow-0 flex flex-col" style={{ width: '50%' }}>
        <div className="bg-dark-800/30 rounded-lg border border-dark-700/50 flex flex-col h-full">
          {/* Enhanced Toolbar with AI and Preview buttons */}
          <div className="flex justify-between items-center border-b border-dark-700/50 p-2 flex-shrink-0">
            <div className="flex gap-2">
              <Button 
                variant="ai-secondary" 
                size="sm" 
                onClick={undo}
                disabled={formHistoryRef.current.past.length === 0}
                title="Undo"
              >
                <RiArrowGoBackLine />
              </Button>
              <Button 
                variant="ai-secondary" 
                size="sm" 
                onClick={redo}
                disabled={formHistoryRef.current.future.length === 0}
                title="Redo"
              >
                <RiArrowGoForwardLine />
              </Button>
              
              {/* Page Dimension Controls */}
              <div className="flex items-center gap-2 ml-4">
                <select 
                  value={currentPageSize}
                  onChange={(e) => updatePageDimensions(e.target.value as 'A4' | 'A3' | 'A5', currentPageOrientation)}
                  className="bg-dark-700/40 border border-dark-600/50 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                </select>
                
                <select 
                  value={currentPageOrientation}
                  onChange={(e) => updatePageDimensions(currentPageSize, e.target.value as 'portrait' | 'landscape')}
                  className="bg-dark-700/40 border border-dark-600/50 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              
              {/* AI Form Generator Button */}
              <Button 
                variant="ai" 
                size="sm" 
                onClick={() => setShowAIGenerator(true)}
                title="Generate form from image/PDF using AI"
                leftIcon={<RiRobotLine />}
                glowing
              >
                AI Generate
              </Button>
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 ml-4 border-l border-dark-600/50 pl-4">
                <Button 
                  variant="ai-secondary" 
                  size="sm" 
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= minZoom}
                  title="Zoom out"
                >
                  <RiArrowDownLine />
                </Button>
                <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button 
                  variant="ai-secondary" 
                  size="sm" 
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= maxZoom}
                  title="Zoom in"
                >
                  <RiArrowUpLine />
                </Button>
                <Button 
                  variant="ai-secondary" 
                  size="sm" 
                  onClick={resetZoom}
                  title="Reset zoom (100%)"
                  className="ml-1"
                >
                  <RiApps2Line />
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {isDragging ? 'Drop widget here' : `${getCurrentPageDimensions().width}×${getCurrentPageDimensions().height}px`}
            </div>
          </div>
          
          {/* MS Word-like Form content area - Continuous scrollable pages */}
          <div 
            className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-0"
            onWheel={handleWheel}
          >
            <div 
              className={`transition-transform duration-300 ease-out ${
                zoomLevel <= minZoom && formPages.length > 1 
                  ? 'grid grid-cols-2 gap-8 justify-items-center max-w-none' 
                  : 'flex flex-col items-center space-y-6'
              }`}
              style={{ 
                transform: `scale(${zoomLevel})`,
                transformOrigin: zoomLevel <= minZoom ? 'top left' : 'top center',
                width: zoomLevel <= minZoom && formPages.length > 1 ? 'fit-content' : 'auto',
                minWidth: zoomLevel <= minZoom && formPages.length > 1 ? '1400px' : 'auto'
              }}
            >
              {formPages.map((page, pageIndex) => {
                const pageHeight = page.dimensions.height;
                const pageWidth = page.dimensions.width;
                const cumulativeHeight = formPages.slice(0, pageIndex).reduce((sum, p) => sum + p.dimensions.height + 24, 0); // 24px for spacing
                
                return (
                  <div key={page.id} className="relative">
                    {/* Page number indicator */}
                    <div className="absolute -left-16 top-4 text-sm text-gray-400 font-medium">
                      Page {pageIndex + 1}
                    </div>
                    
                    <div 
                      className={`relative bg-white rounded-lg shadow-lg transition-all duration-300 ${
                        isDragging ? 'ring-2 ring-ai-blue ring-opacity-50 shadow-ai-blue/20' : ''
                      }`}
                      style={{
                        width: `${pageWidth}px`,
                        minHeight: `${pageHeight}px`,
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        
                        // Try to get data from both formats
                        let draggedData = null;
                        let draggedType = null;
                        
                        try {
                          const jsonData = e.dataTransfer.getData('application/json');
                          if (jsonData) {
                            draggedData = JSON.parse(jsonData);
                            draggedType = draggedData.type;
                          }
                        } catch (error) {
                          // Fallback to text/plain
                          draggedType = e.dataTransfer.getData('text/plain');
                        }
                        
                        if (!draggedType) return;
                        
                        // Calculate drop position relative to the page
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left - 24; // Account for padding
                        const y = e.clientY - rect.top - 24;
                        
                        // Define field dimensions
                        const defaultWidth = draggedType === 'layoutTable' || draggedType === 'dataTable' ? 400 : 300;
                        const defaultHeight = draggedType === 'layoutTable' || draggedType === 'dataTable' ? 200 : 
                                            draggedType === 'signature' ? 80 : 
                                            draggedType === 'textarea' ? 80 :
                                            draggedType === 'image' || draggedType === 'attachment' ? 120 : 40;
                        
                        // Create new field with proper positioning
                        const newField: FormField = {
                          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          type: draggedType,
                          label: draggedData?.label || `${draggedType.charAt(0).toUpperCase() + draggedType.slice(1)} Field`,
                          x: Math.max(0, Math.min(x, pageWidth - defaultWidth - 24)),
                          y: Math.max(0, Math.min(y, pageHeight - defaultHeight - 24)),
                          width: defaultWidth,
                          height: defaultHeight,
                          zIndex: 1,
                          settings: {
                            required: false,
                            placeholder: '',
                            hideTitle: false,
                            titleLayout: 'horizontal',
                            options: draggedType === 'multipleChoice' || draggedType === 'checkbox' || draggedType === 'select' ? ['Option 1', 'Option 2'] : []
                          }
                        };
                        
                        // Add field to the specific page
                        setFormPages(prev => {
                          const newPages = [...prev];
                          newPages[pageIndex] = {
                            ...newPages[pageIndex],
                            fields: [...newPages[pageIndex].fields, newField]
                          };
                          return newPages;
                        });
                        
                        setSelectedField(newField);
                        setCurrentPageIndex(pageIndex);
                        setIsDragging(false);
                        e.preventDefault();
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      {/* Canvas content */}
                      <div 
                        className="relative w-full h-full"
                        data-canvas="true"
                        data-page-container="true"
                        data-page-index={pageIndex}
                        style={{ 
                          minHeight: `${pageHeight - 48}px`,
                          width: `${pageWidth}px`,
                          height: `${pageHeight}px`
                        }}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            setSelectedField(null);
                            setCurrentPageIndex(pageIndex);
                          }
                        }}
                      >
                        {/* Grid Overlay - Show only available cells */}
                        {isDragging && (() => {
                          const gridLayout = calculateGridLayout(pageWidth, pageHeight, page.fields);
                          
                          return (
                            <div className="absolute inset-0 pointer-events-none z-40">
                              {gridLayout.cells.map((row, rowIndex) => 
                                row.map((cell, colIndex) => {
                                  // Only render available (non-occupied) cells
                                  if (cell.occupied) return null;
                                  
                                  return (
                                    <div
                                      key={`grid-${pageIndex}-${rowIndex}-${colIndex}`}
                                      className="absolute border border-green-400 bg-green-50/30 transition-colors duration-200"
                                      style={{
                                        left: cell.x,
                                        top: cell.y,
                                        width: cell.width,
                                        height: cell.height,
                                        borderStyle: 'dashed',
                                        borderWidth: '2px'
                                      }}
                                    >
                                      <div className="absolute top-1 left-1 text-xs text-green-700 bg-white/90 px-1 rounded font-medium">
                                        {rowIndex + 1},{colIndex + 1}
                                      </div>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-green-600 text-xs font-medium bg-white/80 px-2 py-1 rounded">
                                          Available
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Drop zone indicator */}
                        {isDragging && (
                          <div className="absolute inset-0 bg-ai-blue/5 border-2 border-dashed border-ai-blue rounded-lg flex items-center justify-center z-50">
                            <div className="text-ai-blue font-medium text-lg">
                              Drop widget here
                            </div>
                          </div>
                        )}
                        
                        {page.fields.length === 0 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                            <RiDragMove2Line className="text-6xl mb-4" />
                            <p className="text-lg font-medium">Drop form fields here</p>
                            <p className="text-sm mt-2">Drag widgets from the left panel to create your form</p>
                            <p className="text-xs mt-1 text-gray-500">
                              Page {pageIndex + 1}: {page.dimensions.size} {page.dimensions.orientation}
                            </p>
                            {pageIndex === 0 && (
                              <div className="mt-4 flex gap-2">
                                <Button 
                                  variant="ai" 
                                  size="sm" 
                                  onClick={() => setShowAIGenerator(true)}
                                  leftIcon={<RiRobotLine />}
                                >
                                  Generate with AI
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          page.fields.map((field: FormField) => (
                            <ResizableWrapper 
                              key={field.id}
                              fieldId={field.id}
                              onUpdateSize={updateFieldSize}
                              onUpdatePosition={(fieldId, x, y) => {
                                // Update field position within the specific page
                                setFormPages(prev => {
                                  const newPages = [...prev];
                                  const pageToUpdate = newPages[pageIndex];
                                  const fieldIndex = pageToUpdate.fields.findIndex(f => f.id === fieldId);
                                  if (fieldIndex !== -1) {
                                    pageToUpdate.fields[fieldIndex] = {
                                      ...pageToUpdate.fields[fieldIndex],
                                      x,
                                      y
                                    };
                                  }
                                  return newPages;
                                });
                              }}
                              field={field}
                              isSelected={selectedField?.id === field.id}
                              onSelect={() => {
                                setSelectedField(field);
                                setCurrentPageIndex(pageIndex);
                              }}
                              currentFields={page.fields}
                              pageWidth={page.dimensions.width}
                              pageHeight={page.dimensions.height}
                            >
                              <div className="w-full h-full">
                                {renderWidgetPreview(field)}
                              </div>
                            </ResizableWrapper>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          

        </div>
      </div>
      
      {/* Right panel - Widget settings - Fixed 30% */}
      <div className="flex-shrink-0 flex-grow-0 min-w-0" style={{ width: '30%' }}>
        <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 h-full flex flex-col overflow-hidden">
          <div className="p-4 border-b border-dark-700/50">
            <h3 className="text-lg font-semibold flex items-center">
              <RiSettings4Line className="mr-2" /> Widget Settings
            </h3>
          </div>
          
          {selectedField ? (
            <div className="flex-1 overflow-y-auto p-4 pr-12">
              <div className="space-y-4">
              {/* Common settings for all fields */}
              <div className="mb-3">
                <Input
                  label="Title"
                  value={selectedField.label}
                  onChange={(e) => updateFieldLabel(selectedField.id, e.target.value)}
                  className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                />
              </div>
              
              <div className="mb-3">
                <Input
                  label="Placeholder"
                  value={selectedField.settings.placeholder || ''}
                  onChange={(e) => updateFieldSettings(selectedField.id, { placeholder: e.target.value })}
                  className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm">Required</label>
                <input 
                  type="checkbox" 
                  checked={selectedField.settings.required}
                  onChange={(e) => updateFieldSettings(selectedField.id, { required: e.target.checked })}
                  className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm">Hide title</label>
                <input 
                  type="checkbox" 
                  checked={selectedField.settings.hideTitle}
                  onChange={(e) => updateFieldSettings(selectedField.id, { hideTitle: e.target.checked })}
                  className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title layout
                </label>
                <select 
                  value={selectedField.settings.titleLayout}
                  onChange={(e) => updateFieldSettings(selectedField.id, { titleLayout: e.target.value })}
                  className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
              
              {/* Position and size controls */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">X Position</label>
                  <Input
                    type="number"
                    value={selectedField.x || 0}
                    onChange={(e) => updateFieldPosition(selectedField.id, parseInt(e.target.value) || 0, selectedField.y || 0)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Y Position</label>
                  <Input
                    type="number"
                    value={selectedField.y || 0}
                    onChange={(e) => updateFieldPosition(selectedField.id, selectedField.x || 0, parseInt(e.target.value) || 0)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Width</label>
                  <Input
                    type="number"
                    value={selectedField.width || 200}
                    onChange={(e) => updateFieldSize(selectedField.id, parseInt(e.target.value) || 200, selectedField.height || 40)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                  <Input
                    type="number"
                    value={selectedField.height || 40}
                    onChange={(e) => updateFieldSize(selectedField.id, selectedField.width || 200, parseInt(e.target.value) || 40)}
                    className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                  />
                </div>
              </div>
              
              {/* Field movement controls */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="ai-secondary"
                  size="sm"
                  onClick={() => selectedField && moveField(selectedField.id, 'up')}
                  leftIcon={<RiArrowUpLine />}
                  className="text-xs"
                >
                  Move Up
                </Button>
                <Button
                  variant="ai-secondary"
                  size="sm"
                  onClick={() => selectedField && moveField(selectedField.id, 'down')}
                  leftIcon={<RiArrowDownLine />}
                  className="text-xs"
                >
                  Move Down
                </Button>
              </div>
              
              {/* Field-specific settings */}
              
              {/* Text field specific settings */}
              {selectedField.type === 'text' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Input Type
                    </label>
                    <select 
                      value={selectedField.settings.inputType || 'text'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { inputType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="tel">Phone</option>
                      <option value="password">Password</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Length</label>
                    <Input
                      type="number"
                      value={selectedField.settings.maxLength || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { maxLength: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Pattern (RegEx)</label>
                    <Input
                      value={selectedField.settings.pattern || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { pattern: e.target.value })}
                      placeholder="e.g., ^[A-Za-z]+$"
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Number field specific settings */}
              {selectedField.type === 'number' && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Min Value</label>
                      <Input
                        type="number"
                        value={selectedField.settings.min || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { min: e.target.value })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Max Value</label>
                      <Input
                        type="number"
                        value={selectedField.settings.max || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { max: e.target.value })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Step</label>
                    <Input
                      type="number"
                      value={selectedField.settings.step || '1'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { step: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Number Format</label>
                    <select 
                      value={selectedField.settings.numberFormat || 'decimal'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { numberFormat: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="decimal">Decimal</option>
                      <option value="integer">Integer</option>
                      <option value="percentage">Percentage</option>
                      <option value="currency">Currency</option>
                    </select>
                  </div>
                </>
              )}
              
              {/* Date field specific settings */}
              {selectedField.type === 'date' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Date Format</label>
                    <select 
                      value={selectedField.settings.dateFormat || 'yyyy-mm-dd'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { dateFormat: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="dd-mm-yyyy">DD-MM-YYYY</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Min Date</label>
                      <Input
                        type="date"
                        value={selectedField.settings.minDate || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { minDate: e.target.value })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Max Date</label>
                      <Input
                        type="date"
                        value={selectedField.settings.maxDate || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { maxDate: e.target.value })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Include time</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.includeTime}
                      onChange={(e) => updateFieldSettings(selectedField.id, { includeTime: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                </>
              )}
              
              {/* Select field specific settings */}
              {selectedField.type === 'select' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow search</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowSearch}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowSearch: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple selection</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultiple}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultiple: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="mb-3">
                    <Input
                      label="Default Value"
                      value={selectedField.settings.defaultValue || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { defaultValue: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Checkbox field specific settings */}
              {selectedField.type === 'checkbox' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple selection</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultiple}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultiple: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Layout</label>
                    <select 
                      value={selectedField.settings.layout || 'vertical'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { layout: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>
                </>
              )}
              
              {/* File upload specific settings */}
              {(selectedField.type === 'image' || selectedField.type === 'attachment') && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Max File Size
                    </label>
                    <select 
                      value={selectedField.settings.maxSize || '10MB'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { maxSize: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="1MB">1MB</option>
                      <option value="5MB">5MB</option>
                      <option value="10MB">10MB</option>
                      <option value="25MB">25MB</option>
                      <option value="50MB">50MB</option>
                      <option value="100MB">100MB</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <Input
                      label="Accepted File Types"
                      value={selectedField.settings.acceptedTypes || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { acceptedTypes: e.target.value })}
                      placeholder="e.g., .jpg,.png,.pdf"
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple files</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultipleFiles}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultipleFiles: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Files</label>
                    <Input
                      type="number"
                      value={selectedField.settings.maxFiles || '1'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { maxFiles: parseInt(e.target.value) || 1 })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Signature field specific settings */}
              {selectedField.type === 'signature' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Signature Type
                    </label>
                    <select 
                      value={selectedField.settings.signatureType || 'draw'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { signatureType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="draw">Draw</option>
                      <option value="type">Type</option>
                      <option value="upload">Upload</option>
                      <option value="all">All Methods</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Background Color</label>
                    <Input
                      type="color"
                      value={selectedField.settings.backgroundColor || '#ffffff'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { backgroundColor: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Pen Color</label>
                    <Input
                      type="color"
                      value={selectedField.settings.penColor || '#000000'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { penColor: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Table field specific settings */}
              {(selectedField.type === 'layoutTable' || selectedField.type === 'dataTable') && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Rows</label>
                      <Input
                        type="number"
                        value={selectedField.settings.rows || 3}
                        onChange={(e) => {
                          const newRows = parseInt(e.target.value) || 3;
                          const oldRows = selectedField.settings.rows || 3;
                          const columns = selectedField.settings.columns || 3;
                          let newData = [...(selectedField.settings.data || [])];
                          
                          // Adjust data array for new row count
                          if (newRows > oldRows) {
                            // Add new rows
                            for (let i = oldRows; i < newRows; i++) {
                              const newRow = [];
                              for (let j = 0; j < columns; j++) {
                                newRow.push('');
                              }
                              newData.push(newRow);
                            }
                          } else if (newRows < oldRows) {
                            // Remove rows
                            newData = newData.slice(0, newRows);
                          }
                          
                          updateFieldSettings(selectedField.id, { 
                            rows: newRows,
                            data: newData
                          });
                        }}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Columns</label>
                      <Input
                        type="number"
                        value={selectedField.settings.columns || 3}
                        onChange={(e) => {
                          const newColumns = parseInt(e.target.value) || 3;
                          const oldColumns = selectedField.settings.columns || 3;
                          const rows = selectedField.settings.rows || 3;
                          
                          // Adjust headers for new column count
                          let newHeaders = [...(selectedField.settings.headers || [])];
                          if (newColumns > oldColumns) {
                            // Add new headers
                            for (let i = oldColumns; i < newColumns; i++) {
                              newHeaders.push(`Header ${i+1}`);
                            }
                          } else if (newColumns < oldColumns) {
                            // Remove headers
                            newHeaders = newHeaders.slice(0, newColumns);
                          }
                          
                          // Adjust data array for new column count
                          const newData = [];
                          const currentData = selectedField.settings.data || [];
                          
                          for (let i = 0; i < rows; i++) {
                            const currentRow = currentData[i] || [];
                            const newRow = [];
                            
                            for (let j = 0; j < newColumns; j++) {
                              if (j < oldColumns && i < currentData.length) {
                                newRow.push(currentRow[j] || '');
                              } else {
                                newRow.push('');
                              }
                            }
                            
                            newData.push(newRow);
                          }
                          
                          updateFieldSettings(selectedField.id, { 
                            columns: newColumns,
                            headers: newHeaders,
                            data: newData
                          });
                        }}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Table Headers Editor */}
                  {selectedField.settings.showHeader !== false && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Table Headers</label>
                      <div className="flex flex-wrap gap-2">
                        {(selectedField.settings.headers || []).map((header: string, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <Input
                              value={header}
                              onChange={(e) => {
                                const newHeaders = [...(selectedField.settings.headers || [])];
                                newHeaders[index] = e.target.value;
                                updateFieldSettings(selectedField.id, { headers: newHeaders });
                              }}
                              className="input-ai bg-dark-800/50 border-ai-blue/30 text-white text-sm w-24"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Table Data Editor */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Table Data</label>
                    <div className="max-h-60 overflow-y-auto border border-dark-600 rounded">
                      <table className="w-full text-sm">
                        {selectedField.settings.showHeader !== false && (
                          <thead className="bg-dark-700">
                            <tr>
                              {(selectedField.settings.headers || []).map((header: string, index: number) => (
                                <th key={index} className="p-1 text-center text-xs font-medium text-gray-300 border-b border-dark-600">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {(selectedField.settings.data || []).map((row: string[], rowIndex: number) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-dark-800/50' : 'bg-dark-800'}>
                              {row.map((cell: string, colIndex: number) => (
                                <td key={colIndex} className="border border-dark-600 p-1">
                                  <Input
                                    value={cell}
                                    onChange={(e) => {
                                      const newData = [...(selectedField.settings.data || [])];
                                      if (!newData[rowIndex]) {
                                        newData[rowIndex] = [];
                                      }
                                      newData[rowIndex][colIndex] = e.target.value;
                                      updateFieldSettings(selectedField.id, { data: newData });
                                    }}
                                    className="input-ai bg-transparent border-0 text-white text-xs w-full p-0"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={() => {
                          const columns = selectedField.settings.columns || 3;
                          const newRow = [];
                          for (let i = 0; i < columns; i++) {
                            newRow.push('');
                          }
                          const newData = [...(selectedField.settings.data || []), newRow];
                          updateFieldSettings(selectedField.id, { 
                            data: newData,
                            rows: newData.length
                          });
                        }}
                        className="text-xs flex items-center text-ai-blue hover:text-ai-blue-light"
                      >
                        <RiAddLine className="mr-1" /> Add Row
                      </button>
                      <button
                        onClick={() => {
                          if ((selectedField.settings.data || []).length > 1) {
                            const newData = [...(selectedField.settings.data || [])];
                            newData.pop();
                            updateFieldSettings(selectedField.id, { 
                              data: newData,
                              rows: newData.length
                            });
                          }
                        }}
                        className="text-xs flex items-center text-red-400 hover:text-red-300"
                        disabled={(selectedField.settings.data || []).length <= 1}
                      >
                        <RiDeleteBin6Line className="mr-1" /> Remove Last Row
                      </button>
                    </div>
                  </div>
                  
                  {/* Table Display Options */}
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Show header row</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.showHeader !== false}
                      onChange={(e) => updateFieldSettings(selectedField.id, { showHeader: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Show borders</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.showBorders !== false}
                      onChange={(e) => updateFieldSettings(selectedField.id, { showBorders: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Striped rows</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.stripedRows}
                      onChange={(e) => updateFieldSettings(selectedField.id, { stripedRows: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Resizable columns</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.resizableColumns}
                      onChange={(e) => updateFieldSettings(selectedField.id, { resizableColumns: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  {selectedField.type === 'dataTable' && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm">Sortable columns</label>
                        <input 
                          type="checkbox" 
                          checked={selectedField.settings.sortableColumns}
                          onChange={(e) => updateFieldSettings(selectedField.id, { sortableColumns: e.target.checked })}
                          className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm">Filterable columns</label>
                        <input 
                          type="checkbox" 
                          checked={selectedField.settings.filterableColumns}
                          onChange={(e) => updateFieldSettings(selectedField.id, { filterableColumns: e.target.checked })}
                          className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm">Pagination</label>
                        <input 
                          type="checkbox" 
                          checked={selectedField.settings.pagination}
                          onChange={(e) => updateFieldSettings(selectedField.id, { pagination: e.target.checked })}
                          className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              
              {/* Interval Data field specific settings */}
              {selectedField.type === 'intervalData' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Interval Type</label>
                    <select 
                      value={selectedField.settings.intervalType || 'time'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { intervalType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="time">Time-based</option>
                      <option value="count">Count-based</option>
                      <option value="event">Event-based</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Collection Frequency</label>
                    <Input
                      value={selectedField.settings.frequency || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { frequency: e.target.value })}
                      placeholder="e.g., 5 minutes, 1 hour"
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Annotation field specific settings */}
              {selectedField.type === 'annotation' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Annotation Type</label>
                    <select 
                      value={selectedField.settings.annotationType || 'text'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { annotationType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="text">Text</option>
                      <option value="drawing">Drawing</option>
                      <option value="highlight">Highlight</option>
                      <option value="arrow">Arrow</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Default Color</label>
                    <Input
                      type="color"
                      value={selectedField.settings.defaultColor || '#ff0000'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { defaultColor: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* Subform field specific settings */}
              {selectedField.type === 'subform' && (
                <>
                  <div className="mb-3">
                    <Input
                      label="Subform Template ID"
                      value={selectedField.settings.subformTemplateId || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { subformTemplateId: e.target.value })}
                      className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple entries</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultipleEntries}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultipleEntries: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                </>
              )}
              
              {/* Member field specific settings */}
              {selectedField.type === 'member' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Selection Type</label>
                    <select 
                      value={selectedField.settings.selectionType || 'member'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { selectionType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="member">Member</option>
                      <option value="department">Department</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple selection</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultiple}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultiple: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                </>
              )}
              
              {/* Approval Kit field specific settings */}
              {selectedField.type === 'approvalKit' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Approval Type</label>
                    <select 
                      value={selectedField.settings.approvalType || 'sequential'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { approvalType: e.target.value })}
                      className="w-full bg-dark-700/40 border border-dark-600/50 rounded p-2 text-white"
                    >
                      <option value="sequential">Sequential</option>
                      <option value="parallel">Parallel</option>
                      <option value="any">Any Approver</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow comments</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowComments !== false}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowComments: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Require rejection reason</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.requireRejectionReason}
                      onChange={(e) => updateFieldSettings(selectedField.id, { requireRejectionReason: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                </>
              )}
              
              {/* Options for select, checkbox, and multipleChoice fields */}
              {(selectedField.type === 'select' || selectedField.type === 'checkbox' || selectedField.type === 'multipleChoice') && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {selectedField.settings.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...selectedField.settings.options];
                            newOptions[index] = e.target.value;
                            updateFieldSettings(selectedField.id, { options: newOptions });
                          }}
                          className="input-ai bg-dark-800/50 border-ai-blue/30 text-white flex-1"
                        />
                        <button
                          onClick={() => {
                            const newOptions = selectedField.settings.options.filter((_: string, i: number) => i !== index);
                            updateFieldSettings(selectedField.id, { options: newOptions });
                          }}
                          className="p-1 rounded hover:bg-dark-700"
                          aria-label="Remove option"
                        >
                          <RiCloseLine className="text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const newOptions = [...selectedField.settings.options, `Option ${selectedField.settings.options.length + 1}`];
                      updateFieldSettings(selectedField.id, { options: newOptions });
                    }}
                    className="text-sm flex items-center text-ai-blue hover:text-ai-blue-light mt-2"
                  >
                    <RiAddLine className="mr-1" /> Add Option
                  </button>
                </div>
              )}
              
              {/* Delete field button */}
              <div className="pt-4 border-t border-dark-700/50">
                <Button
                  variant="ai-secondary"
                  size="sm"
                  onClick={() => removeField(selectedField.id)}
                  leftIcon={<RiDeleteBin6Line />}
                  className="w-full text-red-400 hover:text-red-300"
                >
                  Delete Field
                </Button>
              </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a field to view and edit its settings</p>
            </div>
          )}
          
          {/* Field movement controls */}
          <div className="p-4 border-t border-dark-700/50">
            <div className="flex gap-2">
              <Button
                variant="ai-secondary"
                size="sm"
                onClick={() => selectedField && moveField(selectedField.id, 'up')}
                leftIcon={<RiArrowUpLine />}
                className="flex-1"
              >
                Move Up
              </Button>
              <Button
                variant="ai-secondary"
                size="sm"
                onClick={() => selectedField && moveField(selectedField.id, 'down')}
                leftIcon={<RiArrowDownLine />}
                className="flex-1"
              >
                Move Down
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Form Generator Modal */}
      <AnimatePresence>
        {showAIGenerator && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="w-full max-w-2xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <AIFormGenerator
                onFormGenerated={handleAIFormGenerated}
                onClose={() => setShowAIGenerator(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full h-full bg-white flex flex-col">
            {/* Enhanced Preview Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <RiEyeLine className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Form Preview</h2>
                    <div className="text-sm text-gray-300">
                      {getCurrentPageDimensions().width}×{getCurrentPageDimensions().height}px • {getCurrentPageDimensions().size} {getCurrentPageDimensions().orientation}
                    </div>
                  </div>
                </div>
                
                {/* Total Pages Counter */}
                <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">Total Pages:</span>
                  <span className="text-lg font-bold text-white">{formPages.length}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                
                {/* Action Buttons */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Print Form"
                >
                  <RiPrinterLine />
                  Print
                </button>
                
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Close Preview"
                >
                  <RiCloseLine />
                  Close
                </button>
              </div>
            </div>
            
            {/* Enhanced Preview Content - Continuous Scrollable Pages */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-8">
              <div className="flex flex-col items-center space-y-8">
                {formPages.map((page, pageIndex) => (
                  <div key={page.id} className="relative">
                    {/* Page number indicator */}
                    <div className="absolute -left-20 top-4 text-sm text-gray-500 font-medium bg-white px-2 py-1 rounded shadow">
                      Page {pageIndex + 1}
                    </div>
                    
                    <div 
                      className="bg-white shadow-2xl rounded-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-200 transform transition-all duration-300 hover:shadow-3xl"
                      style={{
                        width: `${page.dimensions.width}px`,
                        minHeight: `${page.dimensions.height}px`,
                      }}
                    >
                      {/* Print-ready content */}
                      <div className="relative w-full h-full" style={{ minHeight: `${page.dimensions.height - 48}px` }}>
                        {page.fields.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RiFileTextLine className="text-4xl text-gray-400" />
                              </div>
                              <p className="text-xl font-medium text-gray-600">No fields added to page {pageIndex + 1}</p>
                              <p className="text-sm mt-2 text-gray-500">Add form fields to see the preview</p>
                              <p className="text-xs mt-1 text-gray-400">
                                {page.dimensions.size} {page.dimensions.orientation}
                              </p>
                              {pageIndex === 0 && (
                                <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                                  💡 Tip: Use the "Demo Form" button to see an example
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          page.fields.map((field: FormField) => (
                            <div 
                              key={field.id}
                              className="absolute transition-all duration-200 hover:z-10"
                              style={{ 
                                left: field.x || 0,
                                top: field.y || 0,
                                width: field.width || 200,
                                height: field.height || 40,
                              }}
                            >
                              <div className="w-full h-full">
                                {renderWidgetPreview(field)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced Preview Footer */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 px-6 py-4 flex items-center justify-between print:hidden shadow-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <RiApps2Line className="text-lg" />
                  <span className="text-sm">
                    {formPages[currentPageIndex].fields.length} field{formPages[currentPageIndex].fields.length !== 1 ? 's' : ''} on this page
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <RiLayoutLine className="text-lg" />
                  <span className="text-sm">
                    {getCurrentPageDimensions().size} {getCurrentPageDimensions().orientation}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-sm">Zoom: 100%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Jump to page:</span>
                  <select 
                    value={currentPageIndex}
                    onChange={(e) => setCurrentPageIndex(parseInt(e.target.value))}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {formPages.map((_, index) => (
                      <option key={index} value={index}>
                        Page {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const FormsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedProject } = useProjects();
  
  // Add form history reference
  const formHistoryRef = useRef<{past: FormPage[][], future: FormPage[][]}>(
    {past: [], future: []}
  );
  
  // Add the missing state variables for template handling
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formName, setFormName] = useState('New Form');
  const [formDescription, setFormDescription] = useState('');
  
  // Add back the formPages state that was removed
  const [formPages, setFormPages] = useState<FormPage[]>([{ 
    id: 'page_1', 
    fields: [], 
    dimensions: { 
      width: 595, 
      height: 842, 
      orientation: 'portrait' as const, 
      size: 'A4' as const 
    } 
  }]);

  // Migrate existing fields to grid system on component mount
  useEffect(() => {
    const migrateFieldsToGrid = () => {
      setFormPages(prevPages => {
        return prevPages.map(page => {
          const fieldsNeedingMigration = page.fields.filter(field => 
            field.gridRow === undefined || field.gridCol === undefined
          );
          
          if (fieldsNeedingMigration.length === 0) {
            return page; // No migration needed
          }
          
          const currentDimensions = page.dimensions;
          const pageWidth = currentDimensions.width;
          const pageHeight = currentDimensions.height;
          
          // Calculate grid layout for existing fields that already have grid coordinates
          const fieldsWithGrid = page.fields.filter(field => 
            field.gridRow !== undefined && field.gridCol !== undefined
          );
          const gridLayout = calculateGridLayout(pageWidth, pageHeight, fieldsWithGrid);
          
          // Migrate fields without grid coordinates
          const migratedFields = page.fields.map(field => {
            if (field.gridRow === undefined || field.gridCol === undefined) {
              // Find an available cell for this field
              const availableCell = findAvailableGridCell(gridLayout);
              if (availableCell) {
                const cellPosition = snapToGridCell(availableCell.row, availableCell.col, gridLayout);
                // Mark this cell as occupied for subsequent fields
                gridLayout.cells[availableCell.row][availableCell.col].occupied = true;
                
                return {
                  ...field,
                  x: cellPosition.x,
                  y: cellPosition.y,
                  width: cellPosition.width,
                  gridRow: availableCell.row,
                  gridCol: availableCell.col
                };
              }
            }
            return field;
          });
          
          return { ...page, fields: migratedFields };
        });
      });
    };
    
    // Run migration after component mounts
    migrateFieldsToGrid();
  }, []); // Empty dependency array - run only once on mount
  
  // Add formsList state
  const [formsList, setFormsList] = useState([
    {
      id: '1',
      name: 'Site Inspection Form',
      description: 'Form for site safety inspections',
      form_structure: { pages: [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: 12
    },
    {
      id: '2',
      name: 'Incident Report',
      description: 'Document safety incidents on site',
      form_structure: { pages: [
        { 
          id: 'page_1', 
          fields: [], 
          dimensions: { 
            width: 595, 
            height: 842, 
            orientation: 'portrait' as const, 
            size: 'A4' as const 
          } 
        }, 
        { 
          id: 'page_2', 
          fields: [], 
          dimensions: { 
            width: 595, 
            height: 842, 
            orientation: 'portrait' as const, 
            size: 'A4' as const 
          } 
        }
      ] },
      created_at: new Date().toISOString(),
      fieldsCount: 18
    },
    {
      id: '3',
      name: 'Equipment Checklist',
      description: 'Verify equipment status before use',
      form_structure: { pages: [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: 8
    }
  ]);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formFlowOpen, setFormFlowOpen] = useState(false);
  
  // State for template display
  const [showSiteDiaryTemplate, setShowSiteDiaryTemplate] = useState(false);
  const [showSafetyInspectionTemplate, setShowSafetyInspectionTemplate] = useState(false);
  const [showDailyCleaningInspectionTemplate, setShowDailyCleaningInspectionTemplate] = useState(false);
  const [showMonthlyReturnTemplate, setShowMonthlyReturnTemplate] = useState(false);
  const [showInspectionCheckTemplate, setShowInspectionCheckTemplate] = useState(false);
  const [showSurveyCheckTemplate, setShowSurveyCheckTemplate] = useState(false);

  // Stats for the header section
  const [stats] = useState({
    totalForms: 18,
    formsThisMonth: 5,
    templatesAvailable: 6
  });
  
  // Add SiteDiaryForm custom component
  const SiteDiaryForm = () => {
    return (
      <div className="site-diary-form" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <tbody>
            {/* Header section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '33%', verticalAlign: 'top', padding: '5px' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '10px' }}>Contract No.:</div>
                          <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '10px' }}>Date:</div>
                          <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '10px' }}>Day:</div>
                          <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '10px' }}>Contract Date:</div>
                          <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px' }}>(To be insert)</div>
                        </div>
                      </td>
                      <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'middle', padding: '5px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>SITE DIARY</div>
                        <div style={{ marginBottom: '5px' }}>Client Department:</div>
                        <div>Contractor:</div>
                      </td>
                      <td style={{ width: '33%', verticalAlign: 'top', padding: '5px' }}>
                        <div>
                          <div style={{ display: 'flex', marginBottom: '10px' }}>
                            <div style={{ width: '120px' }}>Weather (A.M.):</div>
                            <div style={{ borderBottom: '1px solid #000', flexGrow: 1 }}></div>
                          </div>
                          <div style={{ display: 'flex', marginBottom: '10px' }}>
                            <div style={{ width: '120px' }}>Weather (P.M.):</div>
                            <div style={{ borderBottom: '1px solid #000', flexGrow: 1 }}></div>
                          </div>
                          <div style={{ display: 'flex', marginBottom: '10px' }}>
                            <div style={{ width: '120px' }}>Rainfall (mm):</div>
                            <div style={{ borderBottom: '1px solid #000', flexGrow: 1 }}></div>
                          </div>
                          <div style={{ display: 'flex', marginBottom: '10px' }}>
                            <div style={{ width: '120px' }}>Signal:</div>
                            <div style={{ borderBottom: '1px solid #000', flexGrow: 1 }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Legend box */}
            <tr>
              <td colSpan={5} style={{ textAlign: 'right', padding: '5px' }}>
                <table style={{ border: '1px solid #000', borderCollapse: 'collapse', marginLeft: 'auto', width: '250px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>B: Breakdown</td>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>S: Bad Weather</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>A: Surplus</td>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>T: Task Completed</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>W: Working Instruction</td>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>N: No Operator</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>P: Assembly/Disassemble</td>
                      <td style={{ border: '1px solid #000', padding: '2px 5px' }}>X: Not Required</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Main content area */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '20%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Instructions</td>
                      <td style={{ width: '15%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Contractor's Site Staff</td>
                      <td style={{ width: '5%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>No</td>
                      <td style={{ width: '15%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Contractor's Site Staff</td>
                      <td style={{ width: '5%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>No</td>
                      <td style={{ width: '15%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Labour</td>
                      <td style={{ width: '5%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Code</td>
                      <td style={{ width: '5%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>No</td>
                      <td style={{ width: '15%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Equipment</td>
                      <td style={{ width: '8%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Total on Site</td>
                      <td style={{ width: '6%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Working</td>
                      <td style={{ width: '6%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Idling</td>
                    </tr>
                    
                    {/* Grid rows - 15 rows */}
                    {[...Array(15)].map((_, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Comments section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: '1px solid #000', padding: '5px', textAlign: 'center' }}>Comments</td>
                    </tr>
                    <tr>
                      <td style={{ height: '100px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Utilities section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: '1px solid #000', padding: '5px', textAlign: 'center' }}>Utilities</td>
                    </tr>
                    <tr>
                      <td style={{ height: '80px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Visitor section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: '1px solid #000', padding: '5px', textAlign: 'center' }}>Visitor</td>
                    </tr>
                    <tr>
                      <td style={{ height: '80px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Remarks section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ borderBottom: '1px solid #000', padding: '5px', textAlign: 'center' }}>Remarks</td>
                    </tr>
                    <tr>
                      <td style={{ height: '100px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Supervision assistance section */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '85%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Assistance to Supervising Officer</td>
                      <td style={{ width: '15%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Work No</td>
                    </tr>
                    
                    {/* Grid rows for assistance - 5 rows */}
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                        <td style={{ border: '1px solid #000', height: '25px', padding: '0' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Totals row */}
            <tr>
              <td colSpan={5} style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '33%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Total</td>
                      <td style={{ width: '33%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Total Labour</td>
                      <td style={{ width: '33%', border: '1px solid #000', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>Total Equipment</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Signatures section */}
            <tr>
              <td colSpan={5} style={{ padding: '15px 0 0 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '33%', padding: '5px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '60px' }}>Signed:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '10px' }}></div>
                        <div style={{ fontStyle: 'italic', marginBottom: '10px' }}>Project Manager Delegate</div>
                        <div style={{ marginBottom: '10px' }}>Name/Post:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '20px' }}></div>
                        <div style={{ marginBottom: '10px' }}>Date:</div>
                        <div style={{ borderBottom: '1px solid #000' }}></div>
                      </td>
                      <td style={{ width: '33%', padding: '5px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '60px' }}>Signed:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '10px' }}></div>
                        <div style={{ fontStyle: 'italic', marginBottom: '10px' }}>Contractor's Representative</div>
                        <div style={{ marginBottom: '10px' }}>Name/Post:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '20px' }}></div>
                        <div style={{ marginBottom: '10px' }}>Date:</div>
                        <div style={{ borderBottom: '1px solid #000' }}></div>
                      </td>
                      <td style={{ width: '33%', padding: '5px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '60px' }}>Signed:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '10px' }}></div>
                        <div style={{ fontStyle: 'italic', marginBottom: '10px' }}>Supervisor</div>
                        <div style={{ marginBottom: '10px' }}>Name/Post:</div>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '20px' }}></div>
                        <div style={{ marginBottom: '10px' }}>Date:</div>
                        <div style={{ borderBottom: '1px solid #000' }}></div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            
            {/* Footer */}
            <tr>
              <td colSpan={5} style={{ padding: '20px 5px 5px 5px', textAlign: 'right', fontSize: '10px' }}>
                <div>Page 1 of 2</div>
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* Page 2 would be similar in structure */}
      </div>
    );
  };
  
  // Add reference to the custom component
  const customComponents = {
    SiteDiaryForm
  };
  
  // Handle loading template data when a template is selected
  const handleTemplateSelection = (templateId: number) => {
    const selectedForm = formsList.find(form => form.id === templateId.toString());
    if (selectedForm) {
      setFormPages(selectedForm.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }]);
    }
  };
  
  // Handle form creation flow completion
  const handleSaveForm = (formData: any) => {
    // Handle form save logic
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: formData.templateName || 'New Form',
      description: formData.formDescription || '',
      form_structure: { pages: formData.formPages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: formData.formPages?.reduce((count: number, page: any) => count + page.fields.length, 0) || 0
    };
    setFormsList([...formsList, newForm]);
  };
  
  const handleCreateForm = () => {
    if (formName.trim() === '') return;
    
    handleSaveForm({
      templateName: formName,
      formDescription,
      formPages
    });
  };
  
  // Fix for Create Form button
  const handleStartNewForm = () => {
    // Reset form state for a new form
    setFormName('');
    setFormDescription('');
    setFormPages([{ 
      id: '1', 
      fields: [], 
      dimensions: { 
        width: 595, 
        height: 842, 
        orientation: 'portrait' as const, 
        size: 'A4' as const 
      } 
    }]);
    setCurrentPageIndex(0);
    setSelectedField(null);
    setShowCreateForm(true);
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };
  
  // Add a function to handle Site Diary template selection
  const handleUseSiteDiaryTemplate = () => {
    setShowCreateForm(false);
    setShowSiteDiaryTemplate(true);
  };
  
  // Add a function to handle Site Diary form save
  const handleSiteDiarySave = (siteDiaryData: any) => {
    // Create a new form object with Site Diary data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Site Diary',
      description: 'Daily site progress and activity documentation',
      form_structure: { pages: formsList[0]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(siteDiaryData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowSiteDiaryTemplate(false);
  };
  
  // Add a function to handle Safety Inspection template selection
  const handleUseSafetyInspectionTemplate = () => {
    setShowCreateForm(false);
    setShowSafetyInspectionTemplate(true);
  };
  
  // Add a function to handle Safety Inspection form save
  const handleSafetyInspectionSave = (safetyData: any) => {
    // Create a new form object with Safety Inspection data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Safety Inspection Checklist',
      description: 'Weekly site safety inspection documentation',
      form_structure: { pages: formsList[1]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(safetyData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowSafetyInspectionTemplate(false);
  };
  
  // Add a function to handle Daily Cleaning Inspection template selection
  const handleUseDailyCleaningInspectionTemplate = () => {
    setShowCreateForm(false);
    setShowDailyCleaningInspectionTemplate(true);
  };
  
  // Add a function to handle Daily Cleaning Inspection form save
  const handleDailyCleaningInspectionSave = (cleaningData: any) => {
    // Create a new form object with Daily Cleaning Inspection data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Daily Cleaning Inspection Checklist',
      description: 'Daily cleaning inspection documentation',
      form_structure: { pages: formsList[0]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(cleaningData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowDailyCleaningInspectionTemplate(false);
  };
  
  // Add a function to handle Monthly Return template selection
  const handleUseMonthlyReturnTemplate = () => {
    setShowCreateForm(false);
    setShowMonthlyReturnTemplate(true);
  };
  
  // Add a function to handle Monthly Return form save
  const handleMonthlyReturnSave = (monthlyReturnData: any) => {
    // Create a new form object with Monthly Return data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Monthly Return of Site Labour Deployment and Wage Rates',
      description: 'Monthly tracking of construction site labour deployment and wage rates',
      form_structure: { pages: formsList[0]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(monthlyReturnData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowMonthlyReturnTemplate(false);
  };
  
  // Add a function to handle Inspection Check template selection
  const handleUseInspectionCheckTemplate = () => {
    setShowCreateForm(false);
    setShowInspectionCheckTemplate(true);
  };
  
  // Add a function to handle Inspection Check form save
  const handleInspectionCheckSave = (inspectionCheckData: any) => {
    // Create a new form object with Inspection Check data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Request for Inspection Check Form',
      description: 'Form for requesting inspection of construction works',
      form_structure: { pages: formsList[0]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(inspectionCheckData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowInspectionCheckTemplate(false);
  };

  // Add a function to handle Survey Check template selection
  const handleUseSurveyCheckTemplate = () => {
    setShowCreateForm(false);
    setShowSurveyCheckTemplate(true);
  };
  
  // Add a function to handle Survey Check form save
  const handleSurveyCheckSave = (surveyCheckData: any) => {
    // Create a new form object with Survey Check data
    const newForm = {
      id: (formsList.length + 1).toString(),
      name: 'Request for Survey Check Form',
      description: 'Form for requesting survey check of construction works',
      form_structure: { pages: formsList[0]?.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        } 
      }] },
      created_at: new Date().toISOString(),
      fieldsCount: Object.keys(surveyCheckData).length
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    setShowSurveyCheckTemplate(false);
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced header with gradient background */}
      <div className="relative overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-purple-900 via-fuchsia-800 to-purple-800">
        <div className="absolute inset-0 bg-ai-dots opacity-20"></div>
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <motion.path 
              d="M0,0 L50,0 Q80,50 50,100 L0,100 Z" 
              fill="url(#formGradient)" 
              className="opacity-30"
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              transition={{ duration: 1.5 }}
            />
            <defs>
              <linearGradient id="formGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center">
                  <RiFileEditLine className="mr-3 text-purple-300" />
                  {t('forms.title', 'Forms')}
                </h1>
                <p className="text-purple-200 mt-2 max-w-2xl">
                  Create custom forms, use templates, and manage your project documentation
                </p>
              </motion.div>
            </div>
            
            <motion.div
              className="mt-4 md:mt-0 flex space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button
                variant="ai-secondary"
                leftIcon={<RiFileTextLine />}
                onClick={() => setShowTemplates(true)}
              >
                Templates
              </Button>
              <Button
                variant="ai"
                leftIcon={<RiAddLine />}
                onClick={() => setFormFlowOpen(true)}
                animated
                pulseEffect
                glowing
              >
                Create Form
              </Button>
            </motion.div>
          </div>

          {/* Statistics Section */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiFileTextLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Total Forms</div>
                <div className="text-2xl font-bold text-white">{stats.totalForms}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiCalendarLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">This Month</div>
                <div className="text-2xl font-bold text-white">{stats.formsThisMonth}</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center">
              <div className="p-3 bg-purple-500/20 rounded-full mr-4">
                <RiFileTextLine className="text-2xl text-purple-300" />
              </div>
              <div>
                <div className="text-sm text-purple-200">Templates</div>
                <div className="text-2xl font-bold text-white">{stats.templatesAvailable}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rest of the component rendering logic */}
      <div className="forms-listing-container">
        {/* Forms listing JSX */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {formsList.map((form) => (
            <Card
              key={form.id}
              variant="ai"
              className="p-5 hover:shadow-md transition-shadow"
              hover
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{form.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{form.description}</p>
                </div>
                <div className="text-ai-blue dark:text-ai-blue-light">
                  <RiFileTextLine className="text-2xl" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span>{form.fieldsCount} fields</span>
                  <span className="mx-2">•</span>
                  <span>{form.form_structure?.pages?.length || 0} pages</span>
                </div>
                <Button variant="ghost" size="sm">
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FormCreationFlow Modal */}
      <AnimatePresence>
        {formFlowOpen && (
          <div className="fixed inset-0 bg-dark-900 z-50">
            <motion.div
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FormCreationFlow 
                onClose={() => setFormFlowOpen(false)}
                onSave={(formData) => {
                  // Handle form save logic
                  const newForm = {
                    id: (formsList.length + 1).toString(),
                    name: formData.templateName || 'New Form',
                    description: formData.formDescription || '',
                    form_structure: { pages: formData.formPages || [{ id: 'page_1', fields: [] }] },
                    created_at: new Date().toISOString(),
                    fieldsCount: formData.formPages?.reduce((count: number, page: any) => count + page.fields.length, 0) || 0
                  };
                  setFormsList([...formsList, newForm]);
                  setFormFlowOpen(false);
                }}
                existingForms={formsList}
                onTemplateSelect={handleTemplateSelection}
                onSiteDiarySelect={handleUseSiteDiaryTemplate}
                onSafetyInspectionSelect={handleUseSafetyInspectionTemplate}
                onDailyCleaningInspectionSelect={handleUseDailyCleaningInspectionTemplate}
                onMonthlyReturnSelect={handleUseMonthlyReturnTemplate}
                onInspectionCheckSelect={handleUseInspectionCheckTemplate}
                onSurveyCheckSelect={handleUseSurveyCheckTemplate}
                onAddPage={() => {
                  const newPage: FormPage = {
                    id: `page_${Date.now()}`,
                    fields: [],
                    dimensions: {
                      width: 595,
                      height: 842,
                      orientation: 'portrait',
                      size: 'A4'
                    }
                  };
                  setFormPages(prev => [...prev, newPage]);
                }}
                onPreview={() => setShowPreview(true)}
                formEditor={
                  <FormBuilder
                    formPages={formPages}
                    setFormPages={setFormPages}
                    currentPageIndex={currentPageIndex} 
                    setCurrentPageIndex={setCurrentPageIndex}
                    selectedField={selectedField}
                    setSelectedField={setSelectedField}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    showPreview={showPreview}
                    setShowPreview={setShowPreview}
                  />
                }
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Templates modal */}
      {/* Your templates modal JSX */}
      
      {/* Template previews */}
      {/* Your template preview JSX */}
    </div>
  );
};

export default FormsPage;