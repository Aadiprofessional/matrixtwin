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
import ExcelGrid from '../components/forms/ExcelGrid';
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
  RiPrinterLine,
  RiFileCopyLine,
  RiScissorsCutLine,
  RiClipboardLine,
  RiInsertRowTop,
  RiInsertRowBottom,
  RiDeleteRow
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
  cellId?: string; // New: Reference to the cell this field is in
  gridPosition?: { row: number; col: number }; // Excel-like grid position
}

// New Excel-like Grid System Interfaces
interface MergeInfo {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  isMaster: boolean;
}

interface GridCell {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fieldId?: string; // ID of the form field in this cell
  isEmpty: boolean;
  mergeInfo?: MergeInfo; // Information about merged cells
}

interface GridRow {
  id: string;
  index: number;
  height: number;
  y: number;
  isResizing?: boolean;
}

interface GridColumn {
  id: string;
  index: number;
  width: number;
  x: number;
  isResizing?: boolean;
}

interface ExcelGrid {
  rows: GridRow[];
  columns: GridColumn[];
  cells: GridCell[][];
  totalWidth: number;
  totalHeight: number;
  mergedCells?: Map<string, MergeInfo>;
}

// Grid configuration constants
const EXCEL_GRID_CONFIG = {
  DEFAULT_ROWS: 10,
  DEFAULT_COLS: 6,
  MIN_ROW_HEIGHT: 30,
  MIN_COL_WIDTH: 80,
  DEFAULT_ROW_HEIGHT: 50,
  DEFAULT_COL_WIDTH: 120,
  RESIZE_HANDLE_SIZE: 8,
  GRID_BORDER_WIDTH: 1,
  HEADER_HEIGHT: 25,
  HEADER_WIDTH: 40
} as const;

// Grid cell constants for widget operations
const GRID_CELL_WIDTH = 120;
const GRID_CELL_HEIGHT = 50;

interface FormPage {
  id: string;
  fields: FormField[];
  grid: ExcelGrid;
  dimensions: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    size: 'A4' | 'A3' | 'A5';
  };
}

// Excel Grid Utility Functions
const createInitialGrid = (rows: number = EXCEL_GRID_CONFIG.DEFAULT_ROWS, cols: number = EXCEL_GRID_CONFIG.DEFAULT_COLS): ExcelGrid => {
  const gridRows: GridRow[] = [];
  const gridColumns: GridColumn[] = [];
  const cells: GridCell[][] = [];
  
  // Create columns
  let currentX = EXCEL_GRID_CONFIG.HEADER_WIDTH;
  for (let col = 0; col < cols; col++) {
    gridColumns.push({
      id: `col-${col}`,
      index: col,
      width: EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH,
      x: currentX
    });
    currentX += EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH;
  }
  
  // Create rows
  let currentY = EXCEL_GRID_CONFIG.HEADER_HEIGHT;
  for (let row = 0; row < rows; row++) {
    gridRows.push({
      id: `row-${row}`,
      index: row,
      height: EXCEL_GRID_CONFIG.DEFAULT_ROW_HEIGHT,
      y: currentY
    });
    currentY += EXCEL_GRID_CONFIG.DEFAULT_ROW_HEIGHT;
  }
  
  // Create cells
  for (let row = 0; row < rows; row++) {
    cells[row] = [];
    for (let col = 0; col < cols; col++) {
      cells[row][col] = {
        id: `cell-${row}-${col}`,
        row,
        col,
        x: gridColumns[col].x,
        y: gridRows[row].y,
        width: gridColumns[col].width,
        height: gridRows[row].height,
        isEmpty: true
      };
    }
  }
  
  return {
    rows: gridRows,
    columns: gridColumns,
    cells,
    totalWidth: currentX,
    totalHeight: currentY
  };
};

const updateGridAfterResize = (grid: ExcelGrid): ExcelGrid => {
  const updatedCells: GridCell[][] = [];
  
  // Recalculate cell positions and dimensions
  for (let row = 0; row < grid.rows.length; row++) {
    updatedCells[row] = [];
    for (let col = 0; col < grid.columns.length; col++) {
      const existingCell = grid.cells[row][col];
      updatedCells[row][col] = {
        ...existingCell,
        x: grid.columns[col].x,
        y: grid.rows[row].y,
        width: grid.columns[col].width,
        height: grid.rows[row].height
      };
    }
  }
  
  return {
    ...grid,
    cells: updatedCells,
    totalWidth: grid.columns[grid.columns.length - 1]?.x + grid.columns[grid.columns.length - 1]?.width + EXCEL_GRID_CONFIG.HEADER_WIDTH,
    totalHeight: grid.rows[grid.rows.length - 1]?.y + grid.rows[grid.rows.length - 1]?.height + EXCEL_GRID_CONFIG.HEADER_HEIGHT
  };
};

const findAvailableGridCell = (grid: ExcelGrid): { row: number; col: number; x: number; y: number } | null => {
  for (let row = 0; row < grid.rows.length; row++) {
    for (let col = 0; col < grid.columns.length; col++) {
      if (grid.cells[row][col].isEmpty) {
        const cell = grid.cells[row][col];
        return { row, col, x: cell.x, y: cell.y };
      }
    }
  }
  return null;
};

const getGridCellFromPosition = (x: number, y: number, grid: ExcelGrid): { row: number; col: number } | null => {
  for (let row = 0; row < grid.rows.length; row++) {
    for (let col = 0; col < grid.columns.length; col++) {
      const cell = grid.cells[row][col];
      if (x >= cell.x && x <= cell.x + cell.width && 
          y >= cell.y && y <= cell.y + cell.height) {
        return { row, col };
      }
    }
  }
  return null;
};

// Helper function to find merged cell information for a given cell
const findMergedCellInfo = (row: number, col: number, grid: ExcelGrid): MergeInfo | null => {
  // First check if the cell has mergeInfo directly
  const cell = grid.cells[row]?.[col];
  if (cell?.mergeInfo) {
    return cell.mergeInfo;
  }
  
  // Then check the grid's mergedCells map
  if (grid.mergedCells) {
    const entries = Array.from(grid.mergedCells.entries());
    for (const [key, mergeInfo] of entries) {
      if (row >= mergeInfo.startRow && row <= mergeInfo.endRow &&
          col >= mergeInfo.startCol && col <= mergeInfo.endCol) {
        return mergeInfo;
      }
    }
  }
  
  return null;
};

const snapToGridCell = (row: number, col: number, grid: ExcelGrid): { x: number; y: number; width: number; height: number } => {
  // Add null checks for grid and its properties
  if (!grid || !grid.cells || !grid.cells[row] || !grid.cells[row][col]) {
    // Return default position if grid or cell is not available
    return {
      x: col * EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH,
      y: row * EXCEL_GRID_CONFIG.DEFAULT_ROW_HEIGHT,
      width: EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH,
      height: EXCEL_GRID_CONFIG.DEFAULT_ROW_HEIGHT
    };
  }
  
  const cell = grid.cells[row][col];
  
  // Check if this cell is part of a merged cell
  const mergeInfo = findMergedCellInfo(row, col, grid);
  if (mergeInfo) {
    // Calculate the total width and height of the merged area
    let totalWidth = 0;
    let totalHeight = 0;
    
    // Sum up widths of all columns in the merge
    for (let c = mergeInfo.startCol; c <= mergeInfo.endCol; c++) {
      const colCell = grid.cells[mergeInfo.startRow]?.[c];
      if (colCell) {
        totalWidth += colCell.width;
      }
    }
    
    // Sum up heights of all rows in the merge
    for (let r = mergeInfo.startRow; r <= mergeInfo.endRow; r++) {
      const rowCell = grid.cells[r]?.[mergeInfo.startCol];
      if (rowCell) {
        totalHeight += rowCell.height;
      }
    }
    
    // Use the position of the master cell (top-left) and the calculated total dimensions
    const masterCell = grid.cells[mergeInfo.startRow][mergeInfo.startCol];
    return {
      x: masterCell.x,
      y: masterCell.y,
      width: totalWidth,
      height: totalHeight
    };
  }
  
  // For non-merged cells, return the original cell dimensions
  return {
    x: cell.x,
    y: cell.y,
    width: cell.width,
    height: cell.height
  };
};

const addRowToGrid = (grid: ExcelGrid, insertIndex?: number): ExcelGrid => {
  const newRowIndex = insertIndex ?? grid.rows.length;
  const newRowY = newRowIndex === 0 ? EXCEL_GRID_CONFIG.HEADER_HEIGHT : 
                  newRowIndex >= grid.rows.length ? 
                  grid.rows[grid.rows.length - 1].y + grid.rows[grid.rows.length - 1].height :
                  grid.rows[newRowIndex].y;
  
  const newRow: GridRow = {
    id: `row-${Date.now()}`,
    index: newRowIndex,
    height: EXCEL_GRID_CONFIG.DEFAULT_ROW_HEIGHT,
    y: newRowY
  };
  
  // Insert the new row
  const updatedRows = [...grid.rows];
  updatedRows.splice(newRowIndex, 0, newRow);
  
  // Update indices and positions of subsequent rows
  for (let i = newRowIndex + 1; i < updatedRows.length; i++) {
    updatedRows[i].index = i;
    updatedRows[i].y = updatedRows[i - 1].y + updatedRows[i - 1].height;
  }
  
  // Create new cells for the new row
  const updatedCells = [...grid.cells];
  const newCellRow: GridCell[] = [];
  
  for (let col = 0; col < grid.columns.length; col++) {
    newCellRow.push({
      id: `cell-${newRowIndex}-${col}`,
      row: newRowIndex,
      col,
      x: grid.columns[col].x,
      y: newRow.y,
      width: grid.columns[col].width,
      height: newRow.height,
      isEmpty: true
    });
  }
  
  updatedCells.splice(newRowIndex, 0, newCellRow);
  
  // Update row indices in existing cells
  for (let row = newRowIndex + 1; row < updatedCells.length; row++) {
    for (let col = 0; col < updatedCells[row].length; col++) {
      updatedCells[row][col].row = row;
      updatedCells[row][col].id = `cell-${row}-${col}`;
      updatedCells[row][col].y = updatedRows[row].y;
    }
  }
  
  return updateGridAfterResize({
    ...grid,
    rows: updatedRows,
    cells: updatedCells
  });
};

const addColumnToGrid = (grid: ExcelGrid, insertIndex?: number): ExcelGrid => {
  const newColIndex = insertIndex ?? grid.columns.length;
  const newColX = newColIndex === 0 ? EXCEL_GRID_CONFIG.HEADER_WIDTH : 
                  newColIndex >= grid.columns.length ? 
                  grid.columns[grid.columns.length - 1].x + grid.columns[grid.columns.length - 1].width :
                  grid.columns[newColIndex].x;
  
  const newColumn: GridColumn = {
    id: `col-${Date.now()}`,
    index: newColIndex,
    width: EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH,
    x: newColX
  };
  
  // Insert the new column
  const updatedColumns = [...grid.columns];
  updatedColumns.splice(newColIndex, 0, newColumn);
  
  // Update indices and positions of subsequent columns
  for (let i = newColIndex + 1; i < updatedColumns.length; i++) {
    updatedColumns[i].index = i;
    updatedColumns[i].x = updatedColumns[i - 1].x + updatedColumns[i - 1].width;
  }
  
  // Add new cells for the new column
  const updatedCells = grid.cells.map((row, rowIndex) => {
    const newCell: GridCell = {
      id: `cell-${rowIndex}-${newColIndex}`,
      row: rowIndex,
      col: newColIndex,
      x: newColumn.x,
      y: grid.rows[rowIndex].y,
      width: newColumn.width,
      height: grid.rows[rowIndex].height,
      isEmpty: true
    };
    
    const updatedRow = [...row];
    updatedRow.splice(newColIndex, 0, newCell);
    
    // Update column indices in existing cells
    for (let col = newColIndex + 1; col < updatedRow.length; col++) {
      updatedRow[col].col = col;
      updatedRow[col].id = `cell-${rowIndex}-${col}`;
      updatedRow[col].x = updatedColumns[col].x;
    }
    
    return updatedRow;
  });
  
  return updateGridAfterResize({
    ...grid,
    columns: updatedColumns,
    cells: updatedCells
  });
};

const findCellByFieldId = (grid: ExcelGrid, fieldId: string): GridCell | null => {
  // Add null checks for grid and its properties
  if (!grid || !grid.cells || !grid.rows || !grid.columns) {
    return null;
  }
  
  for (let row = 0; row < grid.rows.length; row++) {
    for (let col = 0; col < grid.columns.length; col++) {
      // Check if the row exists and the cell exists
      if (grid.cells[row] && grid.cells[row][col]) {
        const cell = grid.cells[row][col];
        if (cell && cell.fieldId === fieldId) {
          return cell;
        }
      }
    }
  }
  return null;
};

const resizeGridRow = (grid: ExcelGrid, rowIndex: number, newHeight: number): ExcelGrid => {
  const minHeight = EXCEL_GRID_CONFIG.MIN_ROW_HEIGHT;
  const constrainedHeight = Math.max(minHeight, newHeight);
  
  const updatedRows = grid.rows.map((row, index) => {
    if (index === rowIndex) {
      return { ...row, height: constrainedHeight };
    }
    return row;
  });
  
  // Update Y positions for subsequent rows
  let currentY = EXCEL_GRID_CONFIG.HEADER_HEIGHT;
  for (let i = 0; i < updatedRows.length; i++) {
    updatedRows[i].y = currentY;
    currentY += updatedRows[i].height;
  }
  
  return updateGridAfterResize({
    ...grid,
    rows: updatedRows
  });
};

const resizeGridColumn = (grid: ExcelGrid, colIndex: number, newWidth: number): ExcelGrid => {
  const minWidth = EXCEL_GRID_CONFIG.MIN_COL_WIDTH;
  const constrainedWidth = Math.max(minWidth, newWidth);
  
  const updatedColumns = grid.columns.map((col, index) => {
    if (index === colIndex) {
      return { ...col, width: constrainedWidth };
    }
    return col;
  });
  
  // Update X positions for subsequent columns
  let currentX = EXCEL_GRID_CONFIG.HEADER_WIDTH;
  for (let i = 0; i < updatedColumns.length; i++) {
    updatedColumns[i].x = currentX;
    currentX += updatedColumns[i].width;
  }
  
  return updateGridAfterResize({
    ...grid,
    columns: updatedColumns
  });
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

// Recalculate form field dimensions based on grid cell changes
const recalculateFieldDimensions = (field: FormField, grid: ExcelGrid): FormField => {
  // Add null checks for field and grid
  if (!field || !field.id || !grid) {
    return field;
  }
  
  // Find the cell that contains this field
  const fieldCell = findCellByFieldId(grid, field.id);
  if (!fieldCell) {
    // If field is not found in grid, return original field
    return field;
  }

  // Get the current position and dimensions from the grid
  const cellPosition = snapToGridCell(fieldCell.row, fieldCell.col, grid);
  
  // Update field with new dimensions
  return {
    ...field,
    x: cellPosition.x,
    y: cellPosition.y,
    width: cellPosition.width,
    height: cellPosition.height
  };
};

// Update all form fields in a page based on current grid state
const updateAllFieldDimensions = (page: FormPage, updatedGrid: ExcelGrid): FormPage => {
  // Add null checks for page and fields
  if (!page || !page.fields || !Array.isArray(page.fields)) {
    return page;
  }
  
  const updatedFields = page.fields.map(field => {
    // Check if field exists and has required properties
    if (!field || !field.id) {
      return field;
    }
    
    // Only update fields that have grid positioning
    if (field.gridRow !== undefined && field.gridCol !== undefined) {
      return recalculateFieldDimensions(field, updatedGrid);
    }
    return field;
  }).filter(field => field !== null && field !== undefined); // Remove any null/undefined fields

  return {
    ...page,
    fields: updatedFields,
    grid: updatedGrid
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
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: React.Dispatch<React.SetStateAction<{ row: number; col: number } | null>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
  onFieldContextMenu: (e: React.MouseEvent, fieldId: string) => void;
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
  formPages: FormPage[];
  currentPageIndex: number;
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

      // Process each image with AI to generate grid-based form
      let allFieldsData: any = { fields: [], grid: null };
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
                text: `You are an expert form analysis AI. Analyze this form image and detect its grid structure and form fields to generate a grid-based layout.

IMPORTANT GRID ANALYSIS:
1. GRID DETECTION: Analyze the form's layout structure and determine the optimal grid size (rows x columns) that would best represent the form layout. Consider:
   - How many logical rows the form has
   - How many columns would best organize the content
   - Typical grid sizes: 10x10, 15x10, 20x15, etc. (adjust based on form complexity)

2. CELL MAPPING: For each form field, determine:
   - Which grid cell(s) it should occupy (row, column)
   - If it should span multiple cells (merged cells)
   - The field type and properties

3. MERGED CELLS: Identify areas that should span multiple cells:
   - Wide text fields, headers, or titles
   - Large text areas or tables
   - Signature areas or file upload zones

Respond with ONLY a JSON object in this exact format:

{
  "formName": "Descriptive form name",
  "formDescription": "Brief description",
  "gridStructure": {
    "rows": 15,
    "columns": 10,
    "cellWidth": 60,
    "cellHeight": 40
  },
  "mergedCells": [
    {
      "id": "merge_1",
      "startRow": 1,
      "startCol": 1,
      "endRow": 1,
      "endCol": 5,
      "reason": "Form title header"
    }
  ],
  "gridFields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Field Label",
      "gridPosition": {
        "row": 2,
        "col": 1,
        "rowSpan": 1,
        "colSpan": 2
      },
      "settings": {
        "required": false,
        "placeholder": "Enter text...",
        "hideTitle": false
      }
    },
    {
      "id": "field_2",
      "type": "dataTable",
      "label": "Table Title",
      "gridPosition": {
        "row": 5,
        "col": 1,
        "rowSpan": 4,
        "colSpan": 8
      },
      "settings": {
        "rows": 5,
        "columns": 3,
        "showHeader": true,
        "showBorders": true,
        "columnHeaders": ["Column 1", "Column 2", "Column 3"]
      }
    }
  ]
}

Supported field types: text, email, number, date, time, select, checkbox, multipleChoice, textarea, file, signature, layoutTable, dataTable

GRID POSITIONING RULES:
- row/col start from 1 (not 0)
- rowSpan/colSpan indicate how many cells the field spans
- Ensure fields don't overlap
- Leave some empty cells for spacing when appropriate
- Consider logical grouping and visual hierarchy

Analyze the form systematically and create an optimal grid layout that represents the form structure accurately.`
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
          
          // Process grid-based response and convert to form structure
          if (parsedResponse.gridStructure && parsedResponse.gridFields) {
            const gridStructure = parsedResponse.gridStructure;
            const mergedCells = parsedResponse.mergedCells || [];
            const gridFields = parsedResponse.gridFields || [];
            
            // Create grid structure
            const grid = {
              rows: gridStructure.rows || 15,
              columns: gridStructure.columns || 10,
              cellWidth: gridStructure.cellWidth || 60,
              cellHeight: gridStructure.cellHeight || 40,
              cells: new Map(),
              mergedCells: new Map()
            };
            
            // Initialize grid cells
            for (let row = 1; row <= grid.rows; row++) {
              for (let col = 1; col <= grid.columns; col++) {
                const cellId = `${row}-${col}`;
                grid.cells.set(cellId, {
                  id: cellId,
                  row,
                  col,
                  content: '',
                  fieldId: null,
                  isHeader: false,
                  style: {}
                });
              }
            }
            
            // Apply merged cells
            mergedCells.forEach((merge: any) => {
              const mergeId = `${merge.startRow}-${merge.startCol}_${merge.endRow}-${merge.endCol}`;
              grid.mergedCells.set(mergeId, {
                id: mergeId,
                startRow: merge.startRow,
                startCol: merge.startCol,
                endRow: merge.endRow,
                endCol: merge.endCol,
                reason: merge.reason || 'AI detected merge'
              });
            });
            
            // Convert grid fields to form fields and populate cells
            const convertedFields = gridFields.map((field: any) => {
              const fieldId = field.id || `field-${Date.now()}-${Math.random()}`;
              const gridPos = field.gridPosition;
              
              // Calculate position based on grid
              const x = (gridPos.col - 1) * grid.cellWidth;
              const y = (gridPos.row - 1) * grid.cellHeight;
              const width = gridPos.colSpan * grid.cellWidth;
              const height = gridPos.rowSpan * grid.cellHeight;
              
              // Populate grid cells with field reference
              for (let row = gridPos.row; row < gridPos.row + gridPos.rowSpan; row++) {
                for (let col = gridPos.col; col < gridPos.col + gridPos.colSpan; col++) {
                  const cellId = `${row}-${col}`;
                  const cell = grid.cells.get(cellId);
                  if (cell) {
                    cell.fieldId = fieldId;
                    cell.content = field.label;
                  }
                }
              }
              
              return {
                id: fieldId,
                type: field.type || 'text',
                label: field.label || 'Untitled Field',
                settings: field.settings || {},
                x,
                y,
                width,
                height,
                pageNumber: i + 1,
                gridPosition: gridPos
              };
            });
            
            // Store grid information for this page
            if (i === 0) {
              // Store grid structure for the first page (we'll use this as the base)
              allFieldsData = {
                fields: convertedFields,
                grid: grid
              };
            } else {
              // For additional pages, just add fields
              allFieldsData.fields = allFieldsData.fields.concat(convertedFields);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', parseError);
          console.log('Raw AI response:', aiResponse);
        }
      }
      
      setGenerationProgress(80);
      
      // Use the accumulated field data
      const convertedFields = allFieldsData.fields || [];
      const gridData = allFieldsData.grid;
      
      // Create form structure with grid information
      const formStructure = {
        name: formName,
        description: formDescription,
        pages: [{
          id: `page-${Date.now()}`,
          fields: convertedFields,
          grid: gridData ? {
            rows: gridData.rows,
            columns: gridData.columns,
            cellWidth: gridData.cellWidth,
            cellHeight: gridData.cellHeight,
            cells: gridData.cells,
            mergedCells: gridData.mergedCells
          } : null,
          dimensions: {
            width: gridData ? gridData.columns * gridData.cellWidth : 595,
            height: gridData ? gridData.rows * gridData.cellHeight : 842,
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
    <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center p-4 z-50">
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] overflow-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="ai-dark" className="p-6 border border-portfolio-orange/20 shadow-ai-glow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-portfolio-orange to-orange-500 flex items-center">
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
                <div className="border-2 border-dashed border-portfolio-orange/30 rounded-lg p-8 hover:border-portfolio-orange/50 transition-colors">
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
                      <RiUploadLine className="text-4xl text-portfolio-orange mb-4" />
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
                        <RiFileTextLine className="text-portfolio-orange mr-2" />
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
                          className="bg-gradient-to-r from-portfolio-orange to-orange-500 h-full transition-all duration-500"
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
                <h3 className="text-lg font-semibold mb-2 text-portfolio-orange">
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
                        <div className="text-sm font-medium text-orange-400 mb-2 mt-3 first:mt-0">
                          Page {pageIndex + 1} ({page.fields.length} fields)
                        </div>
                        {page.fields.map((field: any, fieldIndex: number) => {
                          const accuracy = calculateFieldAccuracy(field);
                          return (
                            <div key={`${pageIndex}-${fieldIndex}`} className="flex items-center justify-between p-2 bg-dark-800/50 rounded">
                              <div className="flex items-center">
                                <span className="text-portfolio-orange mr-2">{field.type}</span>
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
  pageHeight,
  formPages,
  currentPageIndex
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });

  // Calculate effective dimensions based on field type and cell constraints for auto-fit
  const getEffectiveDimensions = useCallback(() => {
    // Get the current cell dimensions for this field
    const currentPage = formPages[currentPageIndex];
    const fieldCell = findCellByFieldId(currentPage.grid, field.id);
    
    // Cell padding to ensure widgets don't touch cell borders
    const CELL_PADDING = 8;
    
    if (fieldCell) {
      // Auto-fit within cell boundaries with padding
      const maxWidth = Math.max(50, fieldCell.width - (CELL_PADDING * 2));
      const maxHeight = Math.max(20, fieldCell.height - (CELL_PADDING * 2));
      
      // Calculate minimum dimensions based on field type
      let minWidth = 50;
      let minHeight = 20;
      
      switch (field.type) {
        case 'layoutTable':
        case 'dataTable':
          minWidth = Math.min(maxWidth, (field.settings?.columns || 3) * 60);
          minHeight = Math.min(maxHeight, (field.settings?.rows || 3) * 25);
          break;
        case 'textarea':
          const textLines = field.settings?.rows || 4;
          minWidth = Math.min(maxWidth, 120);
          minHeight = Math.min(maxHeight, textLines * 18 + 10);
          break;
        case 'select':
        case 'multiselect':
          const optionCount = field.settings?.options?.length || 1;
          minWidth = Math.min(maxWidth, 100);
          minHeight = field.type === 'multiselect' ? 
            Math.min(maxHeight, Math.min(optionCount * 24 + 30, 150)) : 
            Math.min(maxHeight, 30);
          break;
        case 'checkbox':
        case 'multipleChoice':
          const checkboxOptions = field.settings?.options?.length || 1;
          minWidth = Math.min(maxWidth, 100);
          minHeight = Math.min(maxHeight, Math.min(checkboxOptions * 28 + 10, 200));
          break;
        case 'date':
        case 'time':
          minWidth = Math.min(maxWidth, 120);
          minHeight = Math.min(maxHeight, 30);
          break;
        case 'number':
          minWidth = Math.min(maxWidth, 80);
          minHeight = Math.min(maxHeight, 30);
          break;
        case 'signature':
          minWidth = Math.min(maxWidth, 180);
          minHeight = Math.min(maxHeight, 60);
          break;
        case 'image':
        case 'attachment':
          minWidth = Math.min(maxWidth, 150);
          minHeight = Math.min(maxHeight, 80);
          break;
        default: // text, email, etc.
          minWidth = Math.min(maxWidth, 120);
          minHeight = Math.min(maxHeight, 30);
          break;
      }
      
      return {
        width: Math.min(maxWidth, Math.max(minWidth, field.width || minWidth)),
        height: Math.min(maxHeight, Math.max(minHeight, field.height || minHeight))
      };
    }
    
    // Fallback to original logic if no cell found
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
        const multiSelectHeight = field.type === 'multiselect' ? 
          Math.min(optionCount * 28 + 50, Math.max(200, optionCount * 20)) : Math.max(baseHeight, 40);
        return {
          width: Math.max(baseWidth, 150),
          height: multiSelectHeight
        };
      case 'checkbox':
      case 'multipleChoice':
        const checkboxOptions = field.settings?.options?.length || 1;
        const checkboxHeight = Math.max(baseHeight, Math.min(
          checkboxOptions * 32 + 20,
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
  }, [field.type, field.width, field.height, field.settings, field.id, formPages, currentPageIndex]);

  
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
      
      // Get the nearest grid cell for the desired position
      const currentPage = formPages[currentPageIndex];
      const gridCell = getGridCellFromPosition(desiredX, desiredY, currentPage.grid);
      if (gridCell) {
        const snapPosition = snapToGridCell(gridCell.row, gridCell.col, currentPage.grid);
      
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
      
      // Use cell width from the current field's grid cell
      const currentPage = formPages[currentPageIndex];
      const fieldCell = findCellByFieldId(currentPage.grid, field.id);
      const cellWidth = fieldCell ? fieldCell.width : EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH;
      
      let newWidth = cellWidth; // Use cell width
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
        
        // Use cell width from the current field's grid cell
        const currentPage = formPages[currentPageIndex];
        const fieldCell = findCellByFieldId(currentPage.grid, field.id);
        const cellWidth = fieldCell ? fieldCell.width : EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH;
        const newHeight = rect.height;
        
        // Snap position to grid
        const currentX = rect.left - parentRect.left - 12;
        const currentY = rect.top - parentRect.top - 12;
        const gridCell = getGridCellFromPosition(currentX, currentY, currentPage.grid);
        if (gridCell) {
          const snapPosition = snapToGridCell(gridCell.row, gridCell.col, currentPage.grid);
        
          onUpdateSize(fieldId, cellWidth, newHeight);
          if (onUpdatePosition) {
            onUpdatePosition(fieldId, snapPosition.x, snapPosition.y);
          }
        } else {
          onUpdateSize(fieldId, cellWidth, newHeight);
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
  
  // Auto-resize widget when cell dimensions change
  useEffect(() => {
    const currentPage = formPages[currentPageIndex];
    const fieldCell = findCellByFieldId(currentPage.grid, field.id);
    
    if (fieldCell && onUpdateSize) {
      const { width: newWidth, height: newHeight } = getEffectiveDimensions();
      
      // Only update if dimensions have actually changed
      if (field.width !== newWidth || field.height !== newHeight) {
        onUpdateSize(field.id, newWidth, newHeight);
      }
    }
  }, [formPages, currentPageIndex, field.id, getEffectiveDimensions, onUpdateSize]);
  
  const { width: effectiveWidth, height: effectiveHeight } = getEffectiveDimensions();
  
  // Calculate centered position within cell with padding
  const getCenteredPosition = useCallback(() => {
    const currentPage = formPages[currentPageIndex];
    const fieldCell = findCellByFieldId(currentPage.grid, field.id);
    const CELL_PADDING = 8;
    
    if (fieldCell) {
      // Center the widget within the cell with padding
      const centeredX = fieldCell.x + CELL_PADDING + (fieldCell.width - effectiveWidth - (CELL_PADDING * 2)) / 2;
      const centeredY = fieldCell.y + CELL_PADDING + (fieldCell.height - effectiveHeight - (CELL_PADDING * 2)) / 2;
      
      return {
        left: Math.max(fieldCell.x + CELL_PADDING, centeredX),
        top: Math.max(fieldCell.y + CELL_PADDING, centeredY)
      };
    }
    
    // Fallback to original position
    return {
      left: field.x || 0,
      top: field.y || 0
    };
  }, [field.id, field.x, field.y, formPages, currentPageIndex, effectiveWidth, effectiveHeight]);
  
  const centeredPosition = getCenteredPosition();

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
        left: centeredPosition.left,
        top: centeredPosition.top,
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
            className="absolute -top-3 -left-3 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-nw-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            title="Resize northwest"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -top-3 -right-3 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-ne-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            title="Resize northeast"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 -left-3 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-sw-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            title="Resize southwest"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 -right-3 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-se-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            title="Resize southeast"
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Edge handles */}
          <div 
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-n-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            title="Resize north"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-s-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            title="Resize south"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-w-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            title="Resize west"
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-portfolio-orange border-2 border-white cursor-e-resize z-30 rounded-full shadow-lg hover:bg-portfolio-orange-light"
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
  selectedCell,
  setSelectedCell,
  isDragging, 
  setIsDragging, 
  activeTab, 
  setActiveTab,
  showPreview,
  setShowPreview,
  onFieldContextMenu
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

  // Note: Keyboard shortcuts and context menu handlers moved to after function definitions
  
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
  
  // Function to update field size with Excel grid constraints
  const updateFieldSize = (fieldId: string, width: number, height: number) => {
    saveToHistory();
    
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      const updatedFields = page.fields.map(field => {
        if (field.id === fieldId) {
          // Find the cell this field is in
          const cell = findCellByFieldId(page.grid, fieldId);
          if (cell) {
            // Field size is constrained by its cell
            return { 
              ...field, 
              width: Math.min(width, cell.width), 
              height: Math.min(height, cell.height) 
            };
          }
          return { ...field, width, height };
        }
        return field;
      });
      
      return { ...page, fields: updatedFields };
    }));
  };
  
  // Function to update field position with Excel grid constraints
  const updateFieldPosition = (fieldId: string, x: number, y: number) => {
    saveToHistory();
    
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      // Find the target grid cell from the new position
      const targetCell = getGridCellFromPosition(x, y, page.grid);
      
      if (targetCell && page.grid.cells[targetCell.row][targetCell.col].isEmpty) {
        // Clear the old cell
        const oldCell = findCellByFieldId(page.grid, fieldId);
        let updatedGrid = { ...page.grid };
        
        if (oldCell) {
          updatedGrid.cells[oldCell.row][oldCell.col] = {
            ...oldCell,
            fieldId: undefined,
            isEmpty: true
          };
        }
        
        // Occupy the new cell
        updatedGrid.cells[targetCell.row][targetCell.col] = {
          ...updatedGrid.cells[targetCell.row][targetCell.col],
          fieldId: fieldId,
          isEmpty: false
        };
        
        // Update field position to snap to cell
        const cellPosition = snapToGridCell(targetCell.row, targetCell.col, page.grid);
        const updatedFields = page.fields.map(field => {
          if (field.id === fieldId) {
            return {
              ...field,
              x: cellPosition.x,
              y: cellPosition.y,
              gridRow: targetCell.row,
              gridCol: targetCell.col,
              cellId: updatedGrid.cells[targetCell.row][targetCell.col].id
            };
          }
          return field;
        });
        
        return { ...page, fields: updatedFields, grid: updatedGrid };
      }
      
      return page;
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
  
  // Enhanced addFormField function with Excel grid-based positioning
  const addFormField = (type: string, x?: number, y?: number, targetGridRow?: number, targetGridCol?: number) => {
    saveToHistory();
    
    const currentPage = formPages[currentPageIndex];
    
    // Default field height based on type
    const defaultHeight = type === 'layoutTable' || type === 'dataTable' ? 200 : 
                          type === 'signature' ? 80 : 
                          type === 'textarea' ? 80 :
                          type === 'image' || type === 'attachment' ? 120 : 40;
    
    // Find available grid cell
    const findAvailableCell = (preferredRow?: number, preferredCol?: number): {row: number, col: number, cell: GridCell} | null => {
      // If specific cell is requested, check if it's available
      if (preferredRow !== undefined && preferredCol !== undefined) {
        if (preferredRow >= 0 && preferredRow < currentPage.grid.rows.length && 
            preferredCol >= 0 && preferredCol < currentPage.grid.columns.length &&
            currentPage.grid.cells[preferredRow][preferredCol].isEmpty) {
          const cell = currentPage.grid.cells[preferredRow][preferredCol];
          return { row: preferredRow, col: preferredCol, cell };
        }
      }
      
      // If drop coordinates are provided, find nearest available cell
      if (x !== undefined && y !== undefined) {
        const targetCell = getGridCellFromPosition(x, y, currentPage.grid);
        if (targetCell && currentPage.grid.cells[targetCell.row][targetCell.col].isEmpty) {
          return { 
            row: targetCell.row, 
            col: targetCell.col, 
            cell: currentPage.grid.cells[targetCell.row][targetCell.col] 
          };
        }
      }
      
      // Find first available cell (top to bottom, left to right)
      for (let row = 0; row < currentPage.grid.rows.length; row++) {
        for (let col = 0; col < currentPage.grid.columns.length; col++) {
          if (currentPage.grid.cells[row][col].isEmpty) {
            const cell = currentPage.grid.cells[row][col];
            return { row, col, cell };
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
    
    const cellPosition = snapToGridCell(targetCell.row, targetCell.col, currentPage.grid);
    const finalX = cellPosition.x;
    const finalY = cellPosition.y;
    const gridRow = targetCell.row;
    const gridCol = targetCell.col;
    
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newField: FormField = {
      id: fieldId,
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
      width: targetCell.cell.width,
      height: Math.min(defaultHeight, targetCell.cell.height),
      x: finalX,
      y: finalY,
      zIndex: 1,
      gridRow,
      gridCol,
      cellId: targetCell.cell.id
    };

    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      // Update grid to mark cell as occupied
      const updatedGrid = { ...page.grid };
      updatedGrid.cells[gridRow][gridCol] = {
        ...updatedGrid.cells[gridRow][gridCol],
        fieldId: fieldId,
        isEmpty: false
      };
      
      return { 
        ...page, 
        fields: [...page.fields, newField],
        grid: updatedGrid
      };
    }));
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
    setFormPages(prev => prev.map((page, index) => {
      if (index !== currentPageIndex) return page;
      
      // Find the field to get its grid position
      const fieldToRemove = page.fields.find(field => field.id === fieldId);
      
      // Update grid to mark cell as empty
      let updatedGrid = { ...page.grid };
      if (fieldToRemove && fieldToRemove.gridRow !== undefined && fieldToRemove.gridCol !== undefined) {
        updatedGrid.cells[fieldToRemove.gridRow][fieldToRemove.gridCol] = {
          ...updatedGrid.cells[fieldToRemove.gridRow][fieldToRemove.gridCol],
          fieldId: undefined,
          isEmpty: true
        };
      }
      
      return { 
        ...page, 
        fields: page.fields.filter(field => field.id !== fieldId),
        grid: updatedGrid
      };
    }));
    
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



  const handleInsertRowAbove = useCallback(() => {
    if (selectedField && selectedField.gridRow !== undefined) {
      const insertRow = selectedField.gridRow;
      saveToHistory();
      
      setFormPages(prev => prev.map((page, index) => {
        if (index !== currentPageIndex) return page;
        
        // Shift all fields below the insert position down by one row
        const updatedFields = page.fields.map(field => {
          if (field.gridRow !== undefined && field.gridRow >= insertRow) {
            return {
              ...field,
              gridRow: field.gridRow + 1,
              y: (field.gridRow + 1) * GRID_CELL_HEIGHT
            };
          }
          return field;
        });

        // Update grid
        let updatedGrid = { ...page.grid };
        // Insert new empty row
        const newRowCells = Array(updatedGrid.columns.length).fill(null).map((_, colIndex) => ({
          id: `cell-${insertRow}-${colIndex}`,
          row: insertRow,
          col: colIndex,
          x: updatedGrid.columns[colIndex].x,
          y: insertRow * GRID_CELL_HEIGHT,
          width: updatedGrid.columns[colIndex].width,
          height: GRID_CELL_HEIGHT,
          isEmpty: true
        }));
        updatedGrid.cells.splice(insertRow, 0, newRowCells);
        
        // Add new row to rows array
        updatedGrid.rows.splice(insertRow, 0, {
          id: `row-${insertRow}`,
          index: insertRow,
          height: GRID_CELL_HEIGHT,
          y: insertRow * GRID_CELL_HEIGHT
        });
        
        // Update row indices and positions for rows after the inserted one
        for (let i = insertRow + 1; i < updatedGrid.rows.length; i++) {
          updatedGrid.rows[i].index = i;
          updatedGrid.rows[i].y = i * GRID_CELL_HEIGHT;
        }

        // Update field references in grid
        updatedFields.forEach(field => {
          if (field.gridRow !== undefined && field.gridCol !== undefined) {
            updatedGrid.cells[field.gridRow][field.gridCol] = {
              ...updatedGrid.cells[field.gridRow][field.gridCol],
              fieldId: field.id,
              isEmpty: false
            };
          }
        });

        return { ...page, fields: updatedFields, grid: updatedGrid };
      }));
    }
  }, [selectedField, currentPageIndex]);

  const handleInsertRowBelow = useCallback(() => {
    if (selectedField && selectedField.gridRow !== undefined) {
      const insertRow = selectedField.gridRow + 1;
      saveToHistory();
      
      setFormPages(prev => prev.map((page, index) => {
        if (index !== currentPageIndex) return page;
        
        // Shift all fields below the insert position down by one row
        const updatedFields = page.fields.map(field => {
          if (field.gridRow !== undefined && field.gridRow >= insertRow) {
            return {
              ...field,
              gridRow: field.gridRow + 1,
              y: (field.gridRow + 1) * GRID_CELL_HEIGHT
            };
          }
          return field;
        });

        // Update grid
        let updatedGrid = { ...page.grid };
        // Insert new empty row
        const newRowCells = Array(updatedGrid.columns.length).fill(null).map((_, colIndex) => ({
          id: `cell-${insertRow}-${colIndex}`,
          row: insertRow,
          col: colIndex,
          x: updatedGrid.columns[colIndex].x,
          y: insertRow * GRID_CELL_HEIGHT,
          width: updatedGrid.columns[colIndex].width,
          height: GRID_CELL_HEIGHT,
          isEmpty: true
        }));
        updatedGrid.cells.splice(insertRow, 0, newRowCells);
        
        // Add new row to rows array
        updatedGrid.rows.splice(insertRow, 0, {
          id: `row-${insertRow}`,
          index: insertRow,
          height: GRID_CELL_HEIGHT,
          y: insertRow * GRID_CELL_HEIGHT
        });
        
        // Update row indices and positions for rows after the inserted one
        for (let i = insertRow + 1; i < updatedGrid.rows.length; i++) {
          updatedGrid.rows[i].index = i;
          updatedGrid.rows[i].y = i * GRID_CELL_HEIGHT;
        }

        // Update field references in grid
        updatedFields.forEach(field => {
          if (field.gridRow !== undefined && field.gridCol !== undefined) {
            updatedGrid.cells[field.gridRow][field.gridCol] = {
              ...updatedGrid.cells[field.gridRow][field.gridCol],
              fieldId: field.id,
              isEmpty: false
            };
          }
        });

        return { ...page, fields: updatedFields, grid: updatedGrid };
      }));
    }
  }, [selectedField, currentPageIndex]);

  const handleDeleteRow = useCallback(() => {
    if (selectedField && selectedField.gridRow !== undefined) {
      const deleteRow = selectedField.gridRow;
      saveToHistory();
      
      setFormPages(prev => prev.map((page, index) => {
        if (index !== currentPageIndex) return page;
        
        // Remove fields in the deleted row and shift fields below up
        const updatedFields = page.fields.filter(field => {
          if (field.gridRow !== undefined) {
            if (field.gridRow === deleteRow) {
              return false; // Remove fields in deleted row
            }
            if (field.gridRow > deleteRow) {
              field.gridRow = field.gridRow - 1;
              field.y = field.gridRow * GRID_CELL_HEIGHT;
            }
          }
          return true;
        });

        // Update grid
        let updatedGrid = { ...page.grid };
        // Remove the row
        updatedGrid.cells.splice(deleteRow, 1);
        updatedGrid.rows.splice(deleteRow, 1);
        
        // Update row indices and positions for remaining rows
        for (let i = deleteRow; i < updatedGrid.rows.length; i++) {
          updatedGrid.rows[i].index = i;
          updatedGrid.rows[i].y = i * GRID_CELL_HEIGHT;
        }

        // Update field references in grid
        updatedGrid.cells.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const field = updatedFields.find(f => f.gridRow === rowIndex && f.gridCol === colIndex);
            if (field) {
              updatedGrid.cells[rowIndex][colIndex] = {
                ...cell,
                fieldId: field.id,
                isEmpty: false
              };
            } else {
              updatedGrid.cells[rowIndex][colIndex] = {
                ...cell,
                id: `cell-${rowIndex}-${colIndex}`,
                row: rowIndex,
                col: colIndex,
                x: updatedGrid.columns[colIndex].x,
                y: rowIndex * GRID_CELL_HEIGHT,
                width: updatedGrid.columns[colIndex].width,
                height: GRID_CELL_HEIGHT,
                isEmpty: true
              };
            }
          });
        });

        return { ...page, fields: updatedFields, grid: updatedGrid };
      }));

      setSelectedField(null);
    }
  }, [selectedField, currentPageIndex]);




  
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
    const defaultDimensions = { width: 595, height: 842 };
    const newPage: FormPage = {
      id: `page_${Date.now()}`,
      fields: [],
      dimensions: {
        width: 595,
        height: 842,
        orientation: 'portrait',
        size: 'A4'
      },
      grid: createInitialGrid(defaultDimensions.width, defaultDimensions.height)
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
            dimensions: { ...pageDimensions },
            grid: createInitialGrid()
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
        dimensions: { ...pageDimensions },
        grid: createInitialGrid()
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
    
    let currentRow = 0;
    let currentCol = 0;
    let currentPageIndex = 0;
    const pages: FormPage[] = [];
    
    // Initialize first page
    pages.push({
      id: `page_${Date.now()}_${currentPageIndex}`,
      fields: [],
      dimensions: defaultDimensions,
      grid: createInitialGrid(defaultDimensions.width, defaultDimensions.height)
    });
    console.log('Initialized first page');
    
    // Process each pair
    fieldPairs.forEach((pair: any, pairIndex: number) => {
      console.log(`Processing pair ${pairIndex}:`, pair);
      const { fields } = pair;
      
      // Check if we need to move to next row (if current row is full)
      const currentGrid = pages[currentPageIndex].grid;
      if (currentCol >= currentGrid.columns.length) {
        currentRow++;
        currentCol = 0;
      }
      
      // Check if we need a new page
      if (currentRow >= currentGrid.rows.length) {
        // Create new page
        currentPageIndex++;
        pages.push({
          id: `page_${Date.now()}_${currentPageIndex}`,
          fields: [],
          dimensions: defaultDimensions,
          grid: createInitialGrid()
        });
        currentRow = 0;
        currentCol = 0;
      }
      
      // Place fields in the pair side by side
      fields.forEach((field: any, fieldIndex: number) => {
        // Ensure we don't exceed column limit
        const currentPageGrid = pages[currentPageIndex].grid;
        if (currentCol >= currentPageGrid.columns.length) {
          currentRow++;
          currentCol = 0;
          
          // Check if we need a new page again
          if (currentRow >= currentPageGrid.rows.length) {
            currentPageIndex++;
            pages.push({
              id: `page_${Date.now()}_${currentPageIndex}`,
              fields: [],
              dimensions: defaultDimensions,
              grid: createInitialGrid()
            });
            currentRow = 0;
            currentCol = 0;
          }
        }
        
        const cell = pages[currentPageIndex].grid.cells[currentRow]?.[currentCol];
        
        if (!cell) {
          console.warn(`No cell found at row ${currentRow}, col ${currentCol}`);
          return;
        }
        
        // Default field height based on type
        const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                              field.type === 'signature' ? 80 : 
                              field.type === 'textarea' ? 80 :
                              field.type === 'image' || field.type === 'attachment' ? 120 : 40;
        
        const processedField: FormField = {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          width: cell.width,
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
    
    // Handle new paired field structure (legacy support)
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
        
        // Use AI-generated grid if available, otherwise create initial grid
        let pageGrid: ExcelGrid;
        if (page.grid) {
          // Use the AI-generated grid structure and convert to ExcelGrid format
          const cellWidth = page.grid.cellWidth;
          const cellHeight = page.grid.cellHeight;
          
          // Create rows array
          const rows: GridRow[] = Array.from({ length: page.grid.rows }, (_, index) => ({
            id: `row-${index + 1}`,
            index: index + 1,
            height: cellHeight,
            y: index * cellHeight
          }));
          
          // Create columns array
          const columns: GridColumn[] = Array.from({ length: page.grid.columns }, (_, index) => ({
            id: `col-${index + 1}`,
            index: index + 1,
            width: cellWidth,
            x: index * cellWidth
          }));
          
          // Create cells array
          const cells: GridCell[][] = Array.from({ length: page.grid.rows }, (_, row) =>
            Array.from({ length: page.grid.columns }, (_, col) => {
              const cellId = `${row + 1}-${col + 1}`;
              const aiCell = page.grid.cells.get(cellId);
              return {
                id: cellId,
                row: row + 1,
                col: col + 1,
                x: col * cellWidth,
                y: row * cellHeight,
                width: cellWidth,
                height: cellHeight,
                isEmpty: !aiCell?.fieldId,
                fieldId: aiCell?.fieldId || null,
                content: aiCell?.content || '',
                isHeader: aiCell?.isHeader || false,
                style: aiCell?.style || {}
              };
            })
          );
          
          pageGrid = {
            rows,
            columns,
            cells,
            totalWidth: page.grid.columns * cellWidth,
            totalHeight: page.grid.rows * cellHeight,
            mergedCells: page.grid.mergedCells || new Map()
          };
        } else {
          // Fallback to creating initial grid
          pageGrid = createInitialGrid();
        }
        
        page.fields.forEach((field: any, index: number) => {
          let targetCell, cell;
          
          if (field.gridPosition && page.grid) {
            // Use AI-generated grid position
            const gridPos = field.gridPosition;
            targetCell = {
              row: gridPos.row - 1, // Convert to 0-based index
              col: gridPos.col - 1, // Convert to 0-based index
              x: field.x || (gridPos.col - 1) * page.grid.cellWidth,
              y: field.y || (gridPos.row - 1) * page.grid.cellHeight
            };
            
            // Get the cell from the grid
            cell = pageGrid.cells[targetCell.row]?.[targetCell.col];
            if (cell) {
              cell.isEmpty = false;
              cell.fieldId = field.id;
            }
          } else {
            // Fallback: Find available grid cell for this field
            const availableCell = findAvailableGridCell(pageGrid);
            if (!availableCell) {
              console.warn(`No available grid cell for AI-generated field ${index + 1}. Skipping field.`);
              return;
            }
            targetCell = availableCell;
            
            // Mark cell as occupied
            cell = pageGrid.cells[targetCell.row]?.[targetCell.col];
            if (cell) {
              cell.isEmpty = false;
              cell.fieldId = field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
          }
          
          // Default field height based on type
          const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                                field.type === 'signature' ? 80 : 
                                field.type === 'textarea' ? 80 :
                                field.type === 'image' || field.type === 'attachment' ? 120 : 40;
          
          // Handle merged cells (rowSpan and colSpan)
          let fieldWidth = field.width || cell?.width || EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH;
          let fieldHeight = field.height || defaultHeight;
          
          if (field.gridPosition && page.grid) {
            const rowSpan = field.gridPosition.rowSpan || 1;
            const colSpan = field.gridPosition.colSpan || 1;
            
            // Calculate width and height based on merged cells
            if (colSpan > 1) {
              fieldWidth = colSpan * page.grid.cellWidth;
            }
            if (rowSpan > 1) {
              fieldHeight = rowSpan * page.grid.cellHeight;
            }
            
            // Mark all merged cells as occupied
            for (let r = targetCell.row; r < targetCell.row + rowSpan; r++) {
              for (let c = targetCell.col; c < targetCell.col + colSpan; c++) {
                const mergedCell = pageGrid.cells[r]?.[c];
                if (mergedCell) {
                  mergedCell.isEmpty = false;
                  mergedCell.fieldId = field.id;
                }
              }
            }
          }

          const baseField = {
            id: field.id || cell?.fieldId || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: field.type || 'text',
            label: field.label || 'Generated Field',
            width: fieldWidth,
            height: fieldHeight,
            x: targetCell.x,
            y: targetCell.y,
            zIndex: 1,
            gridRow: targetCell.row + 1, // Convert back to 1-based
            gridCol: targetCell.col + 1, // Convert back to 1-based
            rowSpan: field.gridPosition?.rowSpan || 1,
            colSpan: field.gridPosition?.colSpan || 1
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
      
      // Create initial grid for this page
      const pageGrid = createInitialGrid();
      
      formData.fields.forEach((field: any, index: number) => {
        // Find available grid cell for this field
        const targetCell = findAvailableGridCell(pageGrid);
        if (!targetCell) {
          console.warn(`No available grid cell for AI-generated field ${index + 1}. Skipping field.`);
          return;
        }
        
        // Mark cell as occupied
        const cell = pageGrid.cells[targetCell.row]?.[targetCell.col];
        if (cell) {
          cell.isEmpty = false;
          cell.fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Default field height based on type
        const defaultHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 200 : 
                              field.type === 'signature' ? 80 : 
                              field.type === 'textarea' ? 80 :
                              field.type === 'image' || field.type === 'attachment' ? 120 : 40;
        
        const baseField = {
          id: cell?.fieldId || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          width: cell?.width || EXCEL_GRID_CONFIG.DEFAULT_COL_WIDTH,
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
          <div className={`p-2 h-full ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px] flex-shrink-0">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-2 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full flex-grow' : 'flex-grow'}`}>
              <span className="text-gray-500">{field.settings.placeholder || 'Enter text...'}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className={`p-2 h-full ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 min-w-[80px] flex-shrink-0">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-gray-50 border border-gray-300 rounded p-2 text-sm ${field.settings.titleLayout === 'vertical' ? 'w-full flex-grow' : 'flex-grow'}`}>
              <span className="text-gray-500">{field.settings.placeholder || '0'}</span>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div className={`p-2 h-full ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-1' : 'flex flex-col gap-2'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-300 rounded p-2 text-sm flex-grow">
              <div className="text-gray-500 leading-relaxed h-full">
                {field.settings.placeholder || 'Enter multiple lines of text...'}
              </div>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="h-full flex flex-col p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex-grow flex items-center">
              <div className="bg-gray-50 border border-gray-300 rounded p-2 text-sm w-full">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Select date</span>
                  <RiCalendarLine className="text-gray-400 text-xs" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="h-full flex flex-col p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex-grow flex items-center">
              <div className="bg-gray-50 border border-gray-300 rounded p-2 text-sm w-full">
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
          </div>
        );

      case 'checkbox':
        return (
          <div className="h-full flex flex-col p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex-grow overflow-y-auto">
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
          </div>
        );

      case 'multipleChoice':
        return (
          <div className="h-full flex flex-col p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex-grow overflow-y-auto">
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
          </div>
        );

      case 'image':
        return (
          <div className="h-full flex flex-col p-2">
            {!field.settings.hideTitle && (
              <div className="font-medium text-sm text-gray-800 flex-shrink-0 mb-1">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex-grow border border-dashed border-gray-400 rounded p-3 bg-gray-50 flex flex-col items-center justify-center text-gray-500 text-xs">
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
                  activeTab === 'fields' ? 'bg-portfolio-orange text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('fields')}
              >
                Fields
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'kit' ? 'bg-portfolio-orange text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('kit')}
              >
                Kit
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'table' ? 'bg-portfolio-orange text-white' : 'text-gray-400 hover:text-gray-300'
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
                
                // Ensure page has a valid grid
                if (!page.grid) {
                  page.grid = createInitialGrid();
                }
                
                return (
                  <div key={page.id} className="relative">
                    {/* Page number indicator */}
                    <div className="absolute -left-16 top-4 text-sm text-gray-400 font-medium">
                      Page {pageIndex + 1}
                    </div>
                    
                    <div 
                      className={`relative bg-white rounded-lg shadow-lg transition-all duration-300 ${
                        isDragging ? 'ring-2 ring-portfolio-orange ring-opacity-50 shadow-portfolio-orange/20' : ''
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
                        
                        // Find the nearest grid cell for the drop position
                        const pageGrid = page.grid || createInitialGrid();
                        const gridPosition = getGridCellFromPosition(x, y, pageGrid);
                        if (!gridPosition) return; // Exit if no valid grid position found
                        const { row, col } = gridPosition;
                        
                        // Check if the cell is available
                        const cell = pageGrid.cells[row]?.[col];
                        let targetRow = row;
                        let targetCol = col;
                        
                        if (!cell || !cell.isEmpty) {
                          // Find the nearest empty cell
                          let nearestCell = null;
                          let minDistance = Infinity;
                          
                          for (let r = 0; r < pageGrid.cells.length; r++) {
                            for (let c = 0; c < pageGrid.cells[r].length; c++) {
                              const gridCell = pageGrid.cells[r][c];
                              if (gridCell.isEmpty) {
                                const distance = Math.sqrt(Math.pow(gridCell.x + gridCell.width/2 - x, 2) + Math.pow(gridCell.y + gridCell.height/2 - y, 2));
                                if (distance < minDistance) {
                                  minDistance = distance;
                                  nearestCell = { row: r, col: c };
                                }
                              }
                            }
                          }
                          
                          if (nearestCell) {
                            targetRow = nearestCell.row;
                            targetCol = nearestCell.col;
                          } else {
                            return; // No available cells
                          }
                        }
                        
                        // Use the same logic as onCellDrop
                        const targetCell = pageGrid.cells[targetRow]?.[targetCol];
                        if (!targetCell) return;
                        
                        // Create new field with cell-based positioning
                        const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const newField: FormField = {
                          id: fieldId,
                          type: draggedType,
                          label: draggedData?.label || `${draggedType.charAt(0).toUpperCase() + draggedType.slice(1)} Field`,
                          x: targetCell.x,
                          y: targetCell.y,
                          width: targetCell.width,
                          height: targetCell.height,
                          zIndex: 1,
                          gridRow: targetRow,
                          gridCol: targetCol,
                          cellId: targetCell.id,
                          settings: {
                            required: false,
                            placeholder: '',
                            hideTitle: false,
                            titleLayout: 'horizontal',
                            options: draggedType === 'multipleChoice' || draggedType === 'checkbox' || draggedType === 'select' ? ['Option 1', 'Option 2'] : []
                          }
                        };
                        
                        // Update grid to mark cell as occupied
                        const updatedGrid = { ...pageGrid };
                        updatedGrid.cells[targetRow][targetCol] = {
                          ...updatedGrid.cells[targetRow][targetCol],
                          fieldId: fieldId,
                          isEmpty: false
                        };
                        
                        // Add field to the specific page and update grid
                        setFormPages(prev => {
                          const newPages = [...prev];
                          newPages[pageIndex] = {
                            ...newPages[pageIndex],
                            fields: [...newPages[pageIndex].fields, newField],
                            grid: updatedGrid
                          };
                          return newPages;
                        });
                        
                        setSelectedField(newField);
                        setSelectedCell(null);
                        
                        setCurrentPageIndex(pageIndex);
                        e.preventDefault();
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      {/* Excel Grid Canvas */}
                      <ExcelGrid
                        width={pageWidth}
                        height={pageHeight}
                        selectedCell={selectedCell}
                        isDragging={isDragging}
                        onCellSelect={(row, col) => {
                          setSelectedCell({ row, col });
                          setCurrentPageIndex(pageIndex);
                        }}
                        onCellResize={(updatedRows, updatedColumns) => {
                          // Update the grid with new row and column dimensions
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            if (currentPage && currentPage.grid) {
                              // Update grid rows and columns
                              const updatedGrid = {
                                ...currentPage.grid,
                                rows: updatedRows,
                                columns: updatedColumns
                              };
                              
                              // Update cells with new dimensions
                              for (let row = 0; row < updatedRows.length; row++) {
                                for (let col = 0; col < updatedColumns.length; col++) {
                                  if (updatedGrid.cells[row] && updatedGrid.cells[row][col]) {
                                    updatedGrid.cells[row][col] = {
                                      ...updatedGrid.cells[row][col],
                                      x: updatedColumns[col].x,
                                      y: updatedRows[row].y,
                                      width: updatedColumns[col].width,
                                      height: updatedRows[row].height
                                    };
                                  }
                                }
                              }
                              
                              // Update all form fields to match new grid dimensions
                              const updatedPage = updateAllFieldDimensions(currentPage, updatedGrid);
                              newPages[pageIndex] = updatedPage;
                            }
                            return newPages;
                          });
                        }}
                        onRowInsert={(insertedRowIndex) => {
                          // Shift all widgets down that are at or below the inserted row
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            const updatedFields = currentPage.fields.map(field => {
                              if (field.gridRow !== undefined && field.gridRow >= insertedRowIndex) {
                                const newGridRow = field.gridRow + 1;
                                const newGridCol = field.gridCol || 0;
                                
                                // Recalculate x,y coordinates based on new grid position
                                const cellPosition = snapToGridCell(newGridRow, newGridCol, currentPage.grid);
                                
                                return {
                                  ...field,
                                  gridRow: newGridRow,
                                  x: cellPosition.x,
                                  y: cellPosition.y
                                };
                              }
                              return field;
                            });
                            
                            newPages[pageIndex] = {
                              ...currentPage,
                              fields: updatedFields
                            };
                            return newPages;
                          });
                        }}
                        onRowDelete={(deletedRowIndex) => {
                          // Remove widgets in the deleted row and shift others up
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            const updatedFields = currentPage.fields
                              .filter(field => field.gridRow !== undefined && field.gridRow !== deletedRowIndex)
                              .map(field => {
                                if (field.gridRow !== undefined && field.gridRow > deletedRowIndex) {
                                  const newGridRow = field.gridRow - 1;
                                  const newGridCol = field.gridCol || 0;
                                  
                                  // Recalculate x,y coordinates based on new grid position
                                  const cellPosition = snapToGridCell(newGridRow, newGridCol, currentPage.grid);
                                  
                                  return {
                                    ...field,
                                    gridRow: newGridRow,
                                    x: cellPosition.x,
                                    y: cellPosition.y
                                  };
                                }
                                return field;
                              });
                            
                            newPages[pageIndex] = {
                              ...currentPage,
                              fields: updatedFields
                            };
                            return newPages;
                          });
                        }}
                        onColumnInsert={(insertedColumnIndex) => {
                          // Shift all widgets right that are at or to the right of the inserted column
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            const updatedFields = currentPage.fields.map(field => {
                              if (field.gridCol !== undefined && field.gridCol >= insertedColumnIndex) {
                                const newGridRow = field.gridRow || 0;
                                const newGridCol = field.gridCol + 1;
                                
                                // Recalculate x,y coordinates based on new grid position
                                const cellPosition = snapToGridCell(newGridRow, newGridCol, currentPage.grid);
                                
                                return {
                                  ...field,
                                  gridCol: newGridCol,
                                  x: cellPosition.x,
                                  y: cellPosition.y
                                };
                              }
                              return field;
                            });
                            
                            newPages[pageIndex] = {
                              ...currentPage,
                              fields: updatedFields
                            };
                            return newPages;
                          });
                        }}
                        onColumnDelete={(deletedColumnIndex) => {
                          // Remove widgets in the deleted column and shift others left
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            const updatedFields = currentPage.fields
                              .filter(field => field.gridCol !== undefined && field.gridCol !== deletedColumnIndex)
                              .map(field => {
                                if (field.gridCol !== undefined && field.gridCol > deletedColumnIndex) {
                                  const newGridRow = field.gridRow || 0;
                                  const newGridCol = field.gridCol - 1;
                                  
                                  // Recalculate x,y coordinates based on new grid position
                                  const cellPosition = snapToGridCell(newGridRow, newGridCol, currentPage.grid);
                                  
                                  return {
                                    ...field,
                                    gridCol: newGridCol,
                                    x: cellPosition.x,
                                    y: cellPosition.y
                                  };
                                }
                                return field;
                              });
                            
                            newPages[pageIndex] = {
                              ...currentPage,
                              fields: updatedFields
                            };
                            return newPages;
                          });
                        }}
                        onMerge={(mergeInfo) => {
                          // Update form fields when cells are merged
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            // Add safety checks
                            if (!currentPage || !currentPage.grid) {
                              return prev;
                            }
                            
                            // Update all form fields to reflect the new merged cell dimensions
                            const updatedPage = updateAllFieldDimensions(currentPage, currentPage.grid);
                            newPages[pageIndex] = updatedPage;
                            
                            return newPages;
                          });
                        }}
                        onUnmerge={(range) => {
                          // Update form fields when cells are unmerged
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            // Add safety checks
                            if (!currentPage || !currentPage.grid) {
                              return prev;
                            }
                            
                            // Update all form fields to reflect the new unmerged cell dimensions
                            const updatedPage = updateAllFieldDimensions(currentPage, currentPage.grid);
                            newPages[pageIndex] = updatedPage;
                            
                            return newPages;
                          });
                        }}
                        onMergedCellsChange={(mergedCells) => {
                          // Update the grid with merged cell information
                          setFormPages(prev => {
                            const newPages = [...prev];
                            const currentPage = newPages[pageIndex];
                            
                            if (currentPage && currentPage.grid) {
                              const updatedGrid = {
                                ...currentPage.grid,
                                mergedCells: mergedCells
                              };
                              
                              // Update all form fields to reflect the merged cell changes
                              const updatedPage = updateAllFieldDimensions(currentPage, updatedGrid);
                              newPages[pageIndex] = updatedPage;
                            }
                            
                            return newPages;
                          });
                        }}
                        onCellDrop={(row, col, draggedData, mergeInfo) => {
                          setIsDragging(false);
                          
                          const draggedType = draggedData?.type;
                          if (!draggedType) return;
                          
                          // Calculate cell position and size for auto-fit
                          const pageGrid = page.grid || createInitialGrid();
                          const cell = pageGrid.cells[row]?.[col];
                          if (!cell) return;
                          
                          // Calculate dimensions based on merged cell info if available
                          let fieldWidth = cell.width;
                          let fieldHeight = cell.height;
                          
                          if (mergeInfo) {
                            // Calculate total width and height of merged area
                            fieldWidth = 0;
                            fieldHeight = 0;
                            
                            // Sum up widths of all columns in the merge
                            for (let c = mergeInfo.startCol; c <= mergeInfo.endCol; c++) {
                              const colCell = pageGrid.cells[row]?.[c];
                              if (colCell) {
                                fieldWidth += colCell.width;
                              }
                            }
                            
                            // Sum up heights of all rows in the merge
                            for (let r = mergeInfo.startRow; r <= mergeInfo.endRow; r++) {
                              const rowCell = pageGrid.cells[r]?.[col];
                              if (rowCell) {
                                fieldHeight += rowCell.height;
                              }
                            }
                          }
                          
                          // Create new field with cell-based positioning
                          const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                          const newField: FormField = {
                            id: fieldId,
                            type: draggedType,
                            label: draggedData?.label || `${draggedType.charAt(0).toUpperCase() + draggedType.slice(1)} Field`,
                            x: cell.x,
                            y: cell.y,
                            width: fieldWidth,
                            height: fieldHeight,
                            zIndex: 1,
                            gridRow: row,
                            gridCol: col,
                            cellId: cell.id,
                            settings: {
                              required: false,
                              placeholder: '',
                              hideTitle: false,
                              titleLayout: 'horizontal',
                              options: draggedType === 'multipleChoice' || draggedType === 'checkbox' || draggedType === 'select' ? ['Option 1', 'Option 2'] : []
                            }
                          };
                          
                          // Update grid to mark cell as occupied
                          const updatedGrid = { ...pageGrid };
                          if (mergeInfo) {
                            // Mark all cells in the merged area as occupied
                            for (let r = mergeInfo.startRow; r <= mergeInfo.endRow; r++) {
                              for (let c = mergeInfo.startCol; c <= mergeInfo.endCol; c++) {
                                if (updatedGrid.cells[r] && updatedGrid.cells[r][c]) {
                                  updatedGrid.cells[r][c] = {
                                    ...updatedGrid.cells[r][c],
                                    fieldId: fieldId,
                                    isEmpty: false
                                  };
                                }
                              }
                            }
                          } else {
                            // Mark only the single cell as occupied
                            updatedGrid.cells[row][col] = {
                              ...updatedGrid.cells[row][col],
                              fieldId: fieldId,
                              isEmpty: false
                            };
                          }
                          
                          // Add field to the specific page and update grid
                          setFormPages(prev => {
                            const newPages = [...prev];
                            newPages[pageIndex] = {
                              ...newPages[pageIndex],
                              fields: [...newPages[pageIndex].fields, newField],
                              grid: updatedGrid
                            };
                            return newPages;
                          });
                          
                          setSelectedField(newField);
                          setSelectedCell(null); // Clear selection after drop
                        }}
                      >
                        {/* Render form fields as children of the grid */}
                        {page.fields.map((field: FormField) => {
                          // For fields with grid positioning, always calculate from current grid state
                          let position;
                          
                          // Ensure page has a grid before proceeding
                          if (!page.grid) {
                            // Fallback to stored dimensions if no grid available
                            position = {
                              x: field.x || 0,
                              y: field.y || 0,
                              width: field.width || 100,
                              height: field.height || 40
                            };
                          } else if (field.gridRow !== undefined && field.gridCol !== undefined) {
                            // Always calculate position from current grid state for dynamic updates
                            position = snapToGridCell(field.gridRow, field.gridCol, page.grid);
                          } else {
                            // For legacy fields without grid positioning, use stored dimensions
                            const fieldCell = findCellByFieldId(page.grid, field.id);
                            if (fieldCell) {
                              position = snapToGridCell(fieldCell.row, fieldCell.col, page.grid);
                            } else {
                              // Fallback to stored dimensions if no grid cell found
                              position = {
                                x: field.x || 0,
                                y: field.y || 0,
                                width: field.width || 100,
                                height: field.height || 40
                              };
                            }
                          }
                          
                          return (
                            <div
                              key={field.id}
                              className={`absolute cursor-pointer transition-all duration-200 ${
                                selectedField?.id === field.id ? 'ring-2 ring-portfolio-orange ring-opacity-50' : ''
                              }`}
                              style={{
                                left: position.x,
                                top: position.y,
                                width: position.width,
                                height: position.height,
                                zIndex: field.zIndex || 1
                              }}
                              onClick={() => {
                                setSelectedField(field);
                                setCurrentPageIndex(pageIndex);
                              }}
                              onContextMenu={(e) => onFieldContextMenu(e, field.id)}
                            >
                              <div className="w-full h-full bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                 <div className="w-full h-full flex flex-col">
                                   {renderWidgetPreview(field)}
                                 </div>
                               </div>
                              
                              {/* Field resize handles */}
                              {selectedField?.id === field.id && (
                                <>
                                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-portfolio-orange rounded-full cursor-nw-resize" />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-portfolio-orange rounded-full cursor-ne-resize" />
                                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-portfolio-orange rounded-full cursor-sw-resize" />
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-portfolio-orange rounded-full cursor-se-resize" />
                                </>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Empty state overlay */}
                        {page.fields.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                            <RiDragMove2Line className="text-6xl mb-4" />
                            <p className="text-lg font-medium">Drop form fields here</p>
                            <p className="text-sm mt-2">Drag widgets from the left panel to create your form</p>
                            <p className="text-xs mt-1 text-gray-500">
                              Page {pageIndex + 1}: {page.dimensions.size} {page.dimensions.orientation}
                            </p>
                            {pageIndex === 0 && (
                              <div className="mt-4 flex gap-2 pointer-events-auto">
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
                        )}
                      </ExcelGrid>
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
                  className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                />
              </div>
              
              <div className="mb-3">
                <Input
                  label="Placeholder"
                  value={selectedField.settings.placeholder || ''}
                  onChange={(e) => updateFieldSettings(selectedField.id, { placeholder: e.target.value })}
                  className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm">Required</label>
                <input 
                  type="checkbox" 
                  checked={selectedField.settings.required}
                  onChange={(e) => updateFieldSettings(selectedField.id, { required: e.target.checked })}
                  className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm">Hide title</label>
                <input 
                  type="checkbox" 
                  checked={selectedField.settings.hideTitle}
                  onChange={(e) => updateFieldSettings(selectedField.id, { hideTitle: e.target.checked })}
                  className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                    className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Y Position</label>
                  <Input
                    type="number"
                    value={selectedField.y || 0}
                    onChange={(e) => updateFieldPosition(selectedField.id, selectedField.x || 0, parseInt(e.target.value) || 0)}
                    className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                    className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                  <Input
                    type="number"
                    value={selectedField.height || 40}
                    onChange={(e) => updateFieldSize(selectedField.id, selectedField.width || 200, parseInt(e.target.value) || 40)}
                    className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Pattern (RegEx)</label>
                    <Input
                      value={selectedField.settings.pattern || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { pattern: e.target.value })}
                      placeholder="e.g., ^[A-Za-z]+$"
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Max Value</label>
                      <Input
                        type="number"
                        value={selectedField.settings.max || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { max: e.target.value })}
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Step</label>
                    <Input
                      type="number"
                      value={selectedField.settings.step || '1'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { step: e.target.value })}
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Max Date</label>
                      <Input
                        type="date"
                        value={selectedField.settings.maxDate || ''}
                        onChange={(e) => updateFieldSettings(selectedField.id, { maxDate: e.target.value })}
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Include time</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.includeTime}
                      onChange={(e) => updateFieldSettings(selectedField.id, { includeTime: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple selection</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultiple}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultiple: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="mb-3">
                    <Input
                      label="Default Value"
                      value={selectedField.settings.defaultValue || ''}
                      onChange={(e) => updateFieldSettings(selectedField.id, { defaultValue: e.target.value })}
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple files</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultipleFiles}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultipleFiles: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Max Files</label>
                    <Input
                      type="number"
                      value={selectedField.settings.maxFiles || '1'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { maxFiles: parseInt(e.target.value) || 1 })}
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Pen Color</label>
                    <Input
                      type="color"
                      value={selectedField.settings.penColor || '#000000'}
                      onChange={(e) => updateFieldSettings(selectedField.id, { penColor: e.target.value })}
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                        className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                              className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white text-sm w-24"
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
                        className="text-xs flex items-center text-portfolio-orange hover:text-portfolio-orange-light"
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
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Show borders</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.showBorders !== false}
                      onChange={(e) => updateFieldSettings(selectedField.id, { showBorders: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Striped rows</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.stripedRows}
                      onChange={(e) => updateFieldSettings(selectedField.id, { stripedRows: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Resizable columns</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.resizableColumns}
                      onChange={(e) => updateFieldSettings(selectedField.id, { resizableColumns: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                          className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm">Filterable columns</label>
                        <input 
                          type="checkbox" 
                          checked={selectedField.settings.filterableColumns}
                          onChange={(e) => updateFieldSettings(selectedField.id, { filterableColumns: e.target.checked })}
                          className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                        />
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm">Pagination</label>
                        <input 
                          type="checkbox" 
                          checked={selectedField.settings.pagination}
                          onChange={(e) => updateFieldSettings(selectedField.id, { pagination: e.target.checked })}
                          className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
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
                      className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Allow multiple entries</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultipleEntries}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultipleEntries: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm">Require rejection reason</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.requireRejectionReason}
                      onChange={(e) => updateFieldSettings(selectedField.id, { requireRejectionReason: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-portfolio-orange focus:ring-portfolio-orange"
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
                          className="input-ai bg-dark-800/50 border-portfolio-orange/30 text-white flex-1"
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
                    className="text-sm flex items-center text-portfolio-orange hover:text-portfolio-orange-light mt-2"
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
          <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-dark-900/95 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="w-full h-full bg-white flex flex-col">
            {/* Enhanced Preview Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-portfolio-orange rounded-lg flex items-center justify-center">
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
                  className="flex items-center gap-2 px-4 py-2 bg-portfolio-orange hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
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
                                <div className="mt-4 px-4 py-2 bg-dark-800 border border-portfolio-orange/30 rounded-lg text-portfolio-orange text-sm">
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
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-portfolio-orange focus:border-transparent"
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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fieldId: string } | null>(null);

  // Context menu functions - defined early to ensure availability
  const onFieldContextMenu = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      fieldId
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, fieldId: string) => {
    switch (action) {
      case 'copy':
        // Copy widget functionality - placeholder for now
        console.log('Copy widget:', fieldId);
        break;
      case 'cut':
        // Cut widget functionality - placeholder for now
        console.log('Cut widget:', fieldId);
        break;
      case 'paste':
        // Paste widget functionality - placeholder for now
        console.log('Paste widget:', fieldId);
        break;
      case 'delete':
        // Delete widget functionality
        setFormPages(prev => {
          return prev.map(page => ({
            ...page,
            fields: page.fields.filter(field => field.id !== fieldId)
          }));
        });
        break;
      case 'insertRowAbove':
        // Insert row above functionality - placeholder for now
        console.log('Insert row above:', fieldId);
        break;
      case 'insertRowBelow':
        // Insert row below functionality - placeholder for now
        console.log('Insert row below:', fieldId);
        break;
      case 'deleteRow':
        // Delete row functionality - placeholder for now
        console.log('Delete row:', fieldId);
        break;
      default:
        console.log('Unknown action:', action);
    }
    closeContextMenu();
  };
  
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
    },
    grid: createInitialGrid()
  }]);

  // Widget operations state
  const [widgetClipboard, setWidgetClipboard] = useState<{ field: FormField; operation: 'copy' | 'cut' } | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());

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
          
          // Use existing grid or create new one
          const pageGrid = page.grid || createInitialGrid();
          
          // Migrate fields without grid coordinates
          const migratedFields = page.fields.map(field => {
            if (field.gridRow === undefined || field.gridCol === undefined) {
              // Find an available cell for this field
              const availableCell = findAvailableGridCell(pageGrid);
              if (availableCell) {
                const cellPosition = snapToGridCell(availableCell.row, availableCell.col, pageGrid);
                // Mark this cell as occupied for subsequent fields
                pageGrid.cells[availableCell.row][availableCell.col].isEmpty = false;
                
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
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
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
      const pages = selectedForm.form_structure?.pages || [{ 
        id: 'page_1', 
        fields: [], 
        dimensions: { 
          width: 595, 
          height: 842, 
          orientation: 'portrait' as const, 
          size: 'A4' as const 
        },
        grid: createInitialGrid()
      }];
      
      // Ensure all pages have the grid property
      const pagesWithGrid = pages.map((page: any) => ({
        ...page,
        grid: page.grid || createInitialGrid()
      })) as FormPage[];
      
      setFormPages(pagesWithGrid);
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
      },
      grid: createInitialGrid()
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
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white flex items-center">
            <RiFileEditLine className="mr-3 text-portfolio-orange" />
            {t('forms.title', 'Forms')}
          </h1>
          <p className="text-gray-400 mt-1 max-w-2xl">
            Create custom forms, use templates, and manage your project documentation
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
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
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="ai" className="p-5 flex items-center">
          <div className="p-3 bg-portfolio-orange/10 rounded-full mr-4">
            <RiFileTextLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Forms</div>
            <div className="text-2xl font-bold text-white">{stats.totalForms}</div>
          </div>
        </Card>
        
        <Card variant="ai" className="p-5 flex items-center">
          <div className="p-3 bg-portfolio-orange/10 rounded-full mr-4">
            <RiCalendarLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">This Month</div>
            <div className="text-2xl font-bold text-white">{stats.formsThisMonth}</div>
          </div>
        </Card>
        
        <Card variant="ai" className="p-5 flex items-center">
          <div className="p-3 bg-portfolio-orange/10 rounded-full mr-4">
            <RiFileTextLine className="text-2xl text-portfolio-orange" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Templates</div>
            <div className="text-2xl font-bold text-white">{stats.templatesAvailable}</div>
          </div>
        </Card>
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
                <div className="text-portfolio-orange dark:text-portfolio-orange-light">
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
                    },
                    grid: createInitialGrid()
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
                    selectedCell={selectedCell}
                    setSelectedCell={setSelectedCell}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    showPreview={showPreview}
                    setShowPreview={setShowPreview}
                    onFieldContextMenu={onFieldContextMenu}
                  />
                }
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleContextMenuAction('copy', contextMenu.fieldId)}
          >
            <RiFileCopyLine className="text-gray-500" />
            Copy Widget
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleContextMenuAction('cut', contextMenu.fieldId)}
          >
            <RiScissorsCutLine className="text-gray-500" />
            Cut Widget
          </button>
          {widgetClipboard && (
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => handleContextMenuAction('paste', contextMenu.fieldId)}
            >
              <RiClipboardLine className="text-gray-500" />
              Paste Widget
            </button>
          )}
          <hr className="my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleContextMenuAction('insertRowAbove', contextMenu.fieldId)}
          >
            <RiInsertRowTop className="text-gray-500" />
            Insert Row Above
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleContextMenuAction('insertRowBelow', contextMenu.fieldId)}
          >
            <RiInsertRowBottom className="text-gray-500" />
            Insert Row Below
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleContextMenuAction('deleteRow', contextMenu.fieldId)}
          >
            <RiDeleteRow className="text-red-500" />
            Delete Row
          </button>
          <hr className="my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={() => handleContextMenuAction('delete', contextMenu.fieldId)}
          >
            <RiDeleteBinLine className="text-red-500" />
            Delete Widget
          </button>
        </div>
      )}

      {/* Templates modal */}
      {/* Your templates modal JSX */}
      
      {/* Template previews */}
      {/* Your template preview JSX */}
    </div>
  );
};

export default FormsPage;