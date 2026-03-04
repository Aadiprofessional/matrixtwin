
export interface FormField {
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
export interface MergeInfo {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  isMaster: boolean;
}

export interface GridCell {
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
  selected: boolean;
  hasContent: boolean;
  value?: string;
  style?: any;
  merged?: boolean;
}

export interface GridRow {
  id: string;
  index: number;
  height: number;
  y: number;
  isResizing?: boolean;
}

export interface GridColumn {
  id: string;
  index: number;
  width: number;
  x: number;
  isResizing?: boolean;
  letter: string;
}

export interface ExcelGrid {
  rows: GridRow[];
  columns: GridColumn[];
  cells: GridCell[][];
  totalWidth: number;
  totalHeight: number;
  mergedCells?: Map<string, MergeInfo>;
}

// Grid configuration constants
export const EXCEL_GRID_CONFIG = {
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
export const GRID_CELL_WIDTH = 120;
export const GRID_CELL_HEIGHT = 50;

export interface FormPage {
  id: string;
  fields: FormField[];
  grid: ExcelGrid;
  structure?: ExcelGrid; // Alias for grid, used by some backend endpoints
  dimensions: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    size: 'A4' | 'A3' | 'A5';
  };
  pdfPageIndex?: number; // Page index in the source PDF (1-based)
}
