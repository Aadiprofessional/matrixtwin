import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ExcelGridProps {
  width: number;
  height: number;
  onCellSelect?: (row: number, col: number) => void;
  onCellDrop?: (row: number, col: number, data: any, mergeInfo?: MergeInfo) => void;
  onCellResize?: (rows: GridRow[], columns: GridColumn[]) => void;
  onRowInsert?: (insertIndex: number, position: 'above' | 'below') => void;
  onRowDelete?: (deleteIndex: number) => void;
  onColumnInsert?: (insertIndex: number, position: 'left' | 'right') => void;
  onColumnDelete?: (deleteIndex: number) => void;
  onMerge?: (mergeInfo: MergeInfo) => void;
  onUnmerge?: (range: CellRange) => void;
  onMergedCellsChange?: (mergedCells: Map<string, MergeInfo>) => void;
  selectedCell?: { row: number; col: number } | null;
  isDragging?: boolean;
  children?: React.ReactNode;
}

interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  hasContent: boolean;
  value?: string;
  style?: CellStyle;
  merged?: boolean;
  mergeInfo?: MergeInfo;
}

interface GridRow {
  id: string;
  index: number;
  height: number;
  y: number;
  hidden?: boolean;
}

interface GridColumn {
  id: string;
  index: number;
  width: number;
  x: number;
  letter: string;
  hidden?: boolean;
}

interface CellStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  border?: string;
}

interface MergeInfo {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  isMaster: boolean;
}

interface CellRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  selectedRange: CellRange | null;
}

interface HistoryAction {
  type: string;
  data: any;
  timestamp: number;
}

const GRID_CONFIG = {
  DEFAULT_ROW_HEIGHT: 40,
  DEFAULT_COL_WIDTH: 100,
  MIN_ROW_HEIGHT: 20,
  MIN_COL_WIDTH: 50,
  MAX_ROW_HEIGHT: 200,
  MAX_COL_WIDTH: 400,
  HEADER_HEIGHT: 30,
  HEADER_WIDTH: 50,
  RESIZE_HANDLE_SIZE: 4,
  INITIAL_ROWS: 20,
  INITIAL_COLS: 10
};

// Context Menu Component
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAction, selectedRange }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems: Array<{ label?: string; action?: string; shortcut?: string; icon?: string; type?: string; disabled?: boolean }> = [
    { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X', icon: '✂️' },
    { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C', icon: '📋' },
    { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V', icon: '📄' },
    { type: 'separator' },
    { label: 'Insert Row Above', action: 'insertRowAbove', icon: '⬆️' },
    { label: 'Insert Row Below', action: 'insertRowBelow', icon: '⬇️' },
    { label: 'Insert Column Left', action: 'insertColumnLeft', icon: '⬅️' },
    { label: 'Insert Column Right', action: 'insertColumnRight', icon: '➡️' },
    { type: 'separator' },
    { label: 'Delete Row', action: 'deleteRow', icon: '🗑️' },
    { label: 'Delete Column', action: 'deleteColumn', icon: '🗑️' },
    { type: 'separator' },
    { label: 'Merge Cells', action: 'mergeCells', icon: '🔗', disabled: !selectedRange || (selectedRange.startRow === selectedRange.endRow && selectedRange.startCol === selectedRange.endCol) },
    { label: 'Unmerge Cells', action: 'unmergeCells', icon: '🔓' },
    { type: 'separator' },
    { label: 'Format Cells', action: 'formatCells', icon: '🎨' },
    { label: 'Clear Contents', action: 'clearContents', icon: '🧹' },
    { label: 'Clear Formatting', action: 'clearFormatting', icon: '🧽' },
    { type: 'separator' },
    { label: 'Hide Row', action: 'hideRow', icon: '👁️‍🗨️' },
    { label: 'Hide Column', action: 'hideColumn', icon: '👁️‍🗨️' },
    { label: 'Unhide Rows', action: 'unhideRows', icon: '👁️' },
    { label: 'Unhide Columns', action: 'unhideColumns', icon: '👁️' }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50 min-w-48"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="border-t border-gray-200 my-1" />;
        }

        return (
          <div
            key={index}
            className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-blue-50 ${
              item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
            }`}
            onClick={() => {
               if (!item.disabled && item.action) {
                 onAction(item.action);
                 onClose();
               }
             }}
          >
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-gray-500">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Convert column index to Excel-style letter (A, B, C, ..., Z, AA, AB, ...)
const getColumnLetter = (index: number): string => {
  let result = '';
  let num = index;
  while (num >= 0) {
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26) - 1;
    if (num < 0) break;
  }
  return result;
};

export const ExcelGrid: React.FC<ExcelGridProps> = ({
  width,
  height,
  onCellSelect,
  onCellDrop,
  onCellResize,
  onRowInsert,
  onRowDelete,
  onColumnInsert,
  onColumnDelete,
  onMerge,
  onUnmerge,
  onMergedCellsChange,
  selectedCell,
  isDragging = false,
  children
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [cells, setCells] = useState<GridCell[][]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeType, setResizeType] = useState<'row' | 'col' | null>(null);
  const [resizeIndex, setResizeIndex] = useState<number>(-1);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // New state for Excel-like features
  const [selectedRange, setSelectedRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [clipboard, setClipboard] = useState<{ data: GridCell[][]; operation: 'copy' | 'cut' } | null>(null);
  const [mergedCells, setMergedCells] = useState<Map<string, MergeInfo>>(new Map());
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cellData, setCellData] = useState<Map<string, { value: string; style: CellStyle }>>(new Map());

  // Initialize grid
  useEffect(() => {
    initializeGrid();
  }, [width, height]);

  // Notify parent when merged cells change
  useEffect(() => {
    onMergedCellsChange?.(mergedCells);
  }, [mergedCells, onMergedCellsChange]);

  // Utility functions
  const getCellKey = (row: number, col: number) => `${row}-${col}`;
  
  const addToHistory = useCallback((action: HistoryAction) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(action);
      return newHistory.slice(-50); // Keep last 50 actions
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const isCellInRange = (row: number, col: number, range: CellRange) => {
    return row >= range.startRow && row <= range.endRow && 
           col >= range.startCol && col <= range.endCol;
  };

  const getCellsInRange = (range: CellRange): GridCell[] => {
    const cellsInRange: GridCell[] = [];
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        if (cells[row] && cells[row][col]) {
          cellsInRange.push(cells[row][col]);
        }
      }
    }
    return cellsInRange;
  };

  // Debug logging
  useEffect(() => {
    console.log('ExcelGrid - Component render:', { 
      width, 
      height, 
      rowsCount: rows.length, 
      columnsCount: columns.length,
      firstColumn: columns[0],
      firstRow: rows[0]
    });
  }, [width, height, rows, columns]);

  // Action handlers
  const handleContextMenuAction = useCallback((action: string) => {
    if (!selectedRange) return;

    switch (action) {
      case 'copy':
        handleCopy();
        break;
      case 'cut':
        handleCut();
        break;
      case 'paste':
        handlePaste();
        break;
      case 'mergeCells':
        handleMergeCells();
        break;
      case 'unmergeCells':
        handleUnmergeCells();
        break;
      case 'insertRowAbove':
        handleInsertRow(selectedRange.startRow, 'above');
        break;
      case 'insertRowBelow':
        handleInsertRow(selectedRange.endRow, 'below');
        break;
      case 'insertColumnLeft':
        handleInsertColumn(selectedRange.startCol, 'left');
        break;
      case 'insertColumnRight':
        handleInsertColumn(selectedRange.endCol, 'right');
        break;
      case 'deleteRow':
        handleDeleteRow(selectedRange.startRow);
        break;
      case 'deleteColumn':
        handleDeleteColumn(selectedRange.startCol);
        break;
      case 'clearContents':
        handleClearContents();
        break;
      case 'clearFormatting':
        handleClearFormatting();
        break;
      case 'hideRow':
        handleHideRow(selectedRange.startRow);
        break;
      case 'hideColumn':
        handleHideColumn(selectedRange.startCol);
        break;
      case 'formatCells':
        handleFormatCells();
        break;
    }
  }, [selectedRange]);

  const handleCopy = useCallback(() => {
    if (!selectedRange) return;
    
    const cellsInRange = getCellsInRange(selectedRange);
    const data: GridCell[][] = [];
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      data[row - selectedRange.startRow] = [];
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        data[row - selectedRange.startRow][col - selectedRange.startCol] = cells[row][col];
      }
    }
    
    setClipboard({ data, operation: 'copy' });
    addToHistory({ type: 'copy', data: { range: selectedRange }, timestamp: Date.now() });
  }, [selectedRange, cells, addToHistory]);

  const handleCut = useCallback(() => {
    if (!selectedRange) return;
    
    handleCopy();
    setClipboard(prev => prev ? { ...prev, operation: 'cut' } : null);
    handleClearContents();
  }, [selectedRange, handleCopy]);

  const handlePaste = useCallback(() => {
    if (!clipboard || !selectedRange) return;
    
    const startRow = selectedRange.startRow;
    const startCol = selectedRange.startCol;
    
    clipboard.data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const targetRow = startRow + rowIndex;
        const targetCol = startCol + colIndex;
        
        if (targetRow < rows.length && targetCol < columns.length) {
          const cellKey = getCellKey(targetRow, targetCol);
          const cellInfo = cellData.get(getCellKey(cell.row, cell.col));
          
          if (cellInfo) {
            setCellData(prev => new Map(prev.set(cellKey, { ...cellInfo })));
          }
        }
      });
    });
    
    if (clipboard.operation === 'cut') {
      setClipboard(null);
    }
    
    addToHistory({ type: 'paste', data: { range: selectedRange, clipboard }, timestamp: Date.now() });
  }, [clipboard, selectedRange, rows.length, columns.length, cellData, addToHistory]);

  const handleMergeCells = useCallback(() => {
    if (!selectedRange || (selectedRange.startRow === selectedRange.endRow && selectedRange.startCol === selectedRange.endCol)) {
      return;
    }
    
    const mergeKey = getCellKey(selectedRange.startRow, selectedRange.startCol);
    const mergeInfo: MergeInfo = {
      startRow: selectedRange.startRow,
      endRow: selectedRange.endRow,
      startCol: selectedRange.startCol,
      endCol: selectedRange.endCol,
      isMaster: true
    };
    
    setMergedCells(prev => new Map(prev.set(mergeKey, mergeInfo)));
    
    // Mark other cells in range as merged but not master
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        if (row !== selectedRange.startRow || col !== selectedRange.startCol) {
          const cellKey = getCellKey(row, col);
          setMergedCells(prev => new Map(prev.set(cellKey, { ...mergeInfo, isMaster: false })));
        }
      }
    }
    
    // Notify parent component about merge
    onMerge?.(mergeInfo);
    
    addToHistory({ type: 'merge', data: { range: selectedRange }, timestamp: Date.now() });
  }, [selectedRange, addToHistory]);

  const handleUnmergeCells = useCallback(() => {
    if (!selectedRange) return;
    
    const cellsToUnmerge: string[] = [];
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        const cellKey = getCellKey(row, col);
        if (mergedCells.has(cellKey)) {
          cellsToUnmerge.push(cellKey);
        }
      }
    }
    
    setMergedCells(prev => {
      const newMerged = new Map(prev);
      cellsToUnmerge.forEach(key => newMerged.delete(key));
      return newMerged;
    });
    
    // Notify parent component about unmerge
    onUnmerge?.(selectedRange);
    
    addToHistory({ type: 'unmerge', data: { range: selectedRange }, timestamp: Date.now() });
  }, [selectedRange, mergedCells, addToHistory]);

  const handleInsertRow = useCallback((index: number, position: 'above' | 'below') => {
    const insertIndex = position === 'above' ? index : index + 1;
    
    setRows(prev => {
      const newRows = [...prev];
      const newRow: GridRow = {
        id: `row-${Date.now()}`,
        index: insertIndex,
        height: GRID_CONFIG.DEFAULT_ROW_HEIGHT,
        y: insertIndex === 0 ? GRID_CONFIG.HEADER_HEIGHT : newRows[insertIndex - 1].y + newRows[insertIndex - 1].height
      };
      
      newRows.splice(insertIndex, 0, newRow);
      
      // Update indices and positions for subsequent rows
      for (let i = insertIndex + 1; i < newRows.length; i++) {
        newRows[i].index = i;
        newRows[i].y = newRows[i - 1].y + newRows[i - 1].height;
      }
      
      return newRows;
    });
    
    // Shift all cell data down
    setCellData(prev => {
      const newCellData = new Map(prev);
      const keysToUpdate: Array<{oldKey: string, newKey: string, data: any}> = [];
      
      prev.forEach((data, key) => {
        const [row, col] = key.split('-').map(Number);
        if (row >= insertIndex) {
          const newKey = getCellKey(row + 1, col);
          keysToUpdate.push({oldKey: key, newKey, data});
        }
      });
      
      keysToUpdate.forEach(({oldKey, newKey, data}) => {
        newCellData.delete(oldKey);
        newCellData.set(newKey, data);
      });
      
      return newCellData;
    });
    
    // Update merged cells
    setMergedCells(prev => {
      const newMergedCells = new Map();
      prev.forEach((mergeInfo, key) => {
        const [row, col] = key.split('-').map(Number);
        const updatedMergeInfo = {
          ...mergeInfo,
          startRow: mergeInfo.startRow >= insertIndex ? mergeInfo.startRow + 1 : mergeInfo.startRow,
          endRow: mergeInfo.endRow >= insertIndex ? mergeInfo.endRow + 1 : mergeInfo.endRow
        };
        
        const newKey = row >= insertIndex ? getCellKey(row + 1, col) : key;
        newMergedCells.set(newKey, updatedMergeInfo);
      });
      return newMergedCells;
    });
    
    addToHistory({ type: 'insertRow', data: { index: insertIndex, position }, timestamp: Date.now() });
    
    // Notify parent component about row insertion for widget shifting
    onRowInsert?.(insertIndex, position);
  }, [addToHistory, onRowInsert]);

  const handleInsertColumn = useCallback((index: number, position: 'left' | 'right') => {
    const insertIndex = position === 'left' ? index : index + 1;
    
    setColumns(prev => {
      const newColumns = [...prev];
      const newColumn: GridColumn = {
        id: `col-${Date.now()}`,
        index: insertIndex,
        width: GRID_CONFIG.DEFAULT_COL_WIDTH,
        x: insertIndex === 0 ? GRID_CONFIG.HEADER_WIDTH : newColumns[insertIndex - 1].x + newColumns[insertIndex - 1].width,
        letter: getColumnLetter(insertIndex)
      };
      
      newColumns.splice(insertIndex, 0, newColumn);
      
      // Update indices, positions, and letters for subsequent columns
      for (let i = insertIndex + 1; i < newColumns.length; i++) {
        newColumns[i].index = i;
        newColumns[i].x = newColumns[i - 1].x + newColumns[i - 1].width;
        newColumns[i].letter = getColumnLetter(i);
      }
      
      return newColumns;
    });
    
    // Shift all cell data to the right
    setCellData(prev => {
      const newCellData = new Map(prev);
      const keysToUpdate: Array<{oldKey: string, newKey: string, data: any}> = [];
      
      prev.forEach((data, key) => {
        const [row, col] = key.split('-').map(Number);
        if (col >= insertIndex) {
          const newKey = getCellKey(row, col + 1);
          keysToUpdate.push({oldKey: key, newKey, data});
        }
      });
      
      keysToUpdate.forEach(({oldKey, newKey, data}) => {
        newCellData.delete(oldKey);
        newCellData.set(newKey, data);
      });
      
      return newCellData;
    });
    
    // Update merged cells
    setMergedCells(prev => {
      const newMergedCells = new Map();
      prev.forEach((mergeInfo, key) => {
        const [row, col] = key.split('-').map(Number);
        const updatedMergeInfo = {
          ...mergeInfo,
          startCol: mergeInfo.startCol >= insertIndex ? mergeInfo.startCol + 1 : mergeInfo.startCol,
          endCol: mergeInfo.endCol >= insertIndex ? mergeInfo.endCol + 1 : mergeInfo.endCol
        };
        
        const newKey = col >= insertIndex ? getCellKey(row, col + 1) : key;
        newMergedCells.set(newKey, updatedMergeInfo);
      });
      return newMergedCells;
    });
    
    addToHistory({ type: 'insertColumn', data: { index: insertIndex, position }, timestamp: Date.now() });
    
    // Notify parent component about column insertion for widget shifting
    onColumnInsert?.(insertIndex, position);
  }, [addToHistory, onColumnInsert]);

  const handleDeleteRow = useCallback((index: number) => {
    if (rows.length <= 1) return;
    
    setRows(prev => {
      const newRows = prev.filter((_, i) => i !== index);
      
      // Update indices and positions
      for (let i = index; i < newRows.length; i++) {
        newRows[i].index = i;
        newRows[i].y = i === 0 ? GRID_CONFIG.HEADER_HEIGHT : newRows[i - 1].y + newRows[i - 1].height;
      }
      
      return newRows;
    });
    
    // Remove cell data for deleted row and shift remaining data
    setCellData(prev => {
      const newCellData = new Map();
      prev.forEach((data, key) => {
        const [row, col] = key.split('-').map(Number);
        if (row < index) {
          // Keep cells before deleted row
          newCellData.set(key, data);
        } else if (row > index) {
          // Shift cells after deleted row up
          const newKey = getCellKey(row - 1, col);
          newCellData.set(newKey, data);
        }
        // Skip cells in deleted row (row === index)
      });
      return newCellData;
    });
    
    // Update merged cells
    setMergedCells(prev => {
      const newMergedCells = new Map();
      prev.forEach((mergeInfo, key) => {
        const [row, col] = key.split('-').map(Number);
        
        // Skip merged cells that are entirely in the deleted row
        if (mergeInfo.startRow === index && mergeInfo.endRow === index) {
          return;
        }
        
        // Adjust merge info for remaining cells
        const updatedMergeInfo = {
          ...mergeInfo,
          startRow: mergeInfo.startRow > index ? mergeInfo.startRow - 1 : mergeInfo.startRow,
          endRow: mergeInfo.endRow > index ? mergeInfo.endRow - 1 : mergeInfo.endRow
        };
        
        // Update key if cell position changed
        const newKey = row > index ? getCellKey(row - 1, col) : key;
        if (row !== index) { // Don't add cells from deleted row
          newMergedCells.set(newKey, updatedMergeInfo);
        }
      });
      return newMergedCells;
    });
    
    addToHistory({ type: 'deleteRow', data: { index }, timestamp: Date.now() });
    
    // Notify parent component about row deletion for widget shifting
    onRowDelete?.(index);
  }, [rows.length, addToHistory, onRowDelete]);

  const handleDeleteColumn = useCallback((index: number) => {
    if (columns.length <= 1) return;
    
    setColumns(prev => {
      const newColumns = prev.filter((_, i) => i !== index);
      
      // Update indices, positions, and letters
      for (let i = index; i < newColumns.length; i++) {
        newColumns[i].index = i;
        newColumns[i].x = i === 0 ? GRID_CONFIG.HEADER_WIDTH : newColumns[i - 1].x + newColumns[i - 1].width;
        newColumns[i].letter = getColumnLetter(i);
      }
      
      return newColumns;
    });
    
    // Remove cell data for deleted column and shift remaining data
    setCellData(prev => {
      const newCellData = new Map();
      prev.forEach((data, key) => {
        const [row, col] = key.split('-').map(Number);
        if (col < index) {
          // Keep cells before deleted column
          newCellData.set(key, data);
        } else if (col > index) {
          // Shift cells after deleted column to the left
          const newKey = getCellKey(row, col - 1);
          newCellData.set(newKey, data);
        }
        // Skip cells in deleted column (col === index)
      });
      return newCellData;
    });
    
    // Update merged cells
    setMergedCells(prev => {
      const newMergedCells = new Map();
      prev.forEach((mergeInfo, key) => {
        const [row, col] = key.split('-').map(Number);
        
        // Skip merged cells that are entirely in the deleted column
        if (mergeInfo.startCol === index && mergeInfo.endCol === index) {
          return;
        }
        
        // Adjust merge info for remaining cells
        const updatedMergeInfo = {
          ...mergeInfo,
          startCol: mergeInfo.startCol > index ? mergeInfo.startCol - 1 : mergeInfo.startCol,
          endCol: mergeInfo.endCol > index ? mergeInfo.endCol - 1 : mergeInfo.endCol
        };
        
        // Update key if cell position changed
        const newKey = col > index ? getCellKey(row, col - 1) : key;
        if (col !== index) { // Don't add cells from deleted column
          newMergedCells.set(newKey, updatedMergeInfo);
        }
      });
      return newMergedCells;
    });
    
    addToHistory({ type: 'deleteColumn', data: { index }, timestamp: Date.now() });
    
    // Notify parent component about column deletion for widget shifting
    onColumnDelete?.(index);
  }, [columns.length, addToHistory, onColumnDelete]);

  const handleClearContents = useCallback(() => {
    if (!selectedRange) return;
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        const cellKey = getCellKey(row, col);
        setCellData(prev => {
          const newData = new Map(prev);
          const existing = newData.get(cellKey);
          if (existing) {
            newData.set(cellKey, { ...existing, value: '' });
          }
          return newData;
        });
      }
    }
    
    addToHistory({ type: 'clearContents', data: { range: selectedRange }, timestamp: Date.now() });
  }, [selectedRange, addToHistory]);

  const handleClearFormatting = useCallback(() => {
    if (!selectedRange) return;
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        const cellKey = getCellKey(row, col);
        setCellData(prev => {
          const newData = new Map(prev);
          const existing = newData.get(cellKey);
          if (existing) {
            newData.set(cellKey, { ...existing, style: {} });
          }
          return newData;
        });
      }
    }
    
    addToHistory({ type: 'clearFormatting', data: { range: selectedRange }, timestamp: Date.now() });
  }, [selectedRange, addToHistory]);

  const handleHideRow = useCallback((index: number) => {
    setRows(prev => prev.map((row, i) => 
      i === index ? { ...row, hidden: true } : row
    ));
    addToHistory({ type: 'hideRow', data: { index }, timestamp: Date.now() });
  }, [addToHistory]);

  const handleHideColumn = useCallback((index: number) => {
    setColumns(prev => prev.map((col, i) => 
      i === index ? { ...col, hidden: true } : col
    ));
    addToHistory({ type: 'hideColumn', data: { index }, timestamp: Date.now() });
  }, [addToHistory]);

  const handleFormatCells = useCallback(() => {
    // This would typically open a formatting dialog
    // For now, we'll apply some basic formatting
    if (!selectedRange) return;
    
    const newStyle: CellStyle = {
      fontWeight: 'bold',
      backgroundColor: '#f0f9ff'
    };
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        const cellKey = getCellKey(row, col);
        setCellData(prev => {
          const newData = new Map(prev);
          const existing = newData.get(cellKey) || { value: '', style: {} };
          newData.set(cellKey, { ...existing, style: { ...existing.style, ...newStyle } });
          return newData;
        });
      }
    }
    
    addToHistory({ type: 'formatCells', data: { range: selectedRange, style: newStyle }, timestamp: Date.now() });
  }, [selectedRange, addToHistory]);

  const initializeGrid = useCallback(() => {
    const newRows: GridRow[] = [];
    const newColumns: GridColumn[] = [];
    const newCells: GridCell[][] = [];

    // Calculate how many rows and columns can fit
    const availableWidth = width - GRID_CONFIG.HEADER_WIDTH;
    const availableHeight = height - GRID_CONFIG.HEADER_HEIGHT;
    const numCols = Math.max(GRID_CONFIG.INITIAL_COLS, Math.floor(availableWidth / GRID_CONFIG.DEFAULT_COL_WIDTH));
    const numRows = Math.max(GRID_CONFIG.INITIAL_ROWS, Math.floor(availableHeight / GRID_CONFIG.DEFAULT_ROW_HEIGHT));

    // Create columns
    let currentX = GRID_CONFIG.HEADER_WIDTH;
    for (let col = 0; col < numCols; col++) {
      newColumns.push({
        id: `col-${col}`,
        index: col,
        width: GRID_CONFIG.DEFAULT_COL_WIDTH,
        x: currentX,
        letter: getColumnLetter(col)
      });
      currentX += GRID_CONFIG.DEFAULT_COL_WIDTH;
    }

    // Create rows
    let currentY = GRID_CONFIG.HEADER_HEIGHT;
    for (let row = 0; row < numRows; row++) {
      newRows.push({
        id: `row-${row}`,
        index: row,
        height: GRID_CONFIG.DEFAULT_ROW_HEIGHT,
        y: currentY
      });
      currentY += GRID_CONFIG.DEFAULT_ROW_HEIGHT;
    }

    // Create cells
    for (let row = 0; row < numRows; row++) {
      newCells[row] = [];
      for (let col = 0; col < numCols; col++) {
        newCells[row][col] = {
          row,
          col,
          x: newColumns[col].x,
          y: newRows[row].y,
          width: newColumns[col].width,
          height: newRows[row].height,
          selected: selectedCell?.row === row && selectedCell?.col === col,
          hasContent: false
        };
      }
    }

    console.log('ExcelGrid - Initializing with:', { width, height, numRows, numCols, newRows: newRows.length, newColumns: newColumns.length });
    console.log('ExcelGrid - First few columns:', newColumns.slice(0, 3));
    console.log('ExcelGrid - First few rows:', newRows.slice(0, 3));
    
    setRows(newRows);
    setColumns(newColumns);
    setCells(newCells);
  }, [width, height, selectedCell]);

  const handleCellClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    // Check if this cell is part of a merged cell and get the master cell coordinates
    const cellKey = getCellKey(row, col);
    let actualRow = row;
    let actualCol = col;
    
    // Find if this cell is part of a merged cell
    for (const [key, mergeInfo] of Array.from(mergedCells.entries())) {
      if (row >= mergeInfo.startRow && row <= mergeInfo.endRow && 
          col >= mergeInfo.startCol && col <= mergeInfo.endCol) {
        // Use the master cell coordinates for selection
        actualRow = mergeInfo.startRow;
        actualCol = mergeInfo.startCol;
        break;
      }
    }
    
    if (e.shiftKey && selectionStart) {
      // Extend selection
      const newRange: CellRange = {
        startRow: Math.min(selectionStart.row, actualRow),
        endRow: Math.max(selectionStart.row, actualRow),
        startCol: Math.min(selectionStart.col, actualCol),
        endCol: Math.max(selectionStart.col, actualCol)
      };
      setSelectedRange(newRange);
    } else if (e.ctrlKey || e.metaKey) {
      // Multi-select (for now, just add to current selection)
      if (selectedRange) {
        const newRange: CellRange = {
          startRow: Math.min(selectedRange.startRow, actualRow),
          endRow: Math.max(selectedRange.endRow, actualRow),
          startCol: Math.min(selectedRange.startCol, actualCol),
          endCol: Math.max(selectedRange.endCol, actualCol)
        };
        setSelectedRange(newRange);
      } else {
        setSelectedRange({ startRow: actualRow, endRow: actualRow, startCol: actualCol, endCol: actualCol });
        setSelectionStart({ row: actualRow, col: actualCol });
      }
    } else {
      // Single cell selection - always allow new selection
      setSelectedRange({ startRow: actualRow, endRow: actualRow, startCol: actualCol, endCol: actualCol });
      setSelectionStart({ row: actualRow, col: actualCol });
    }
    
    onCellSelect?.(actualRow, actualCol);
  }, [onCellSelect, selectionStart, selectedRange, mergedCells, getCellKey]);

  const handleCellMouseDown = useCallback((e: React.MouseEvent, row: number, col: number) => {
    if (e.button === 2) return; // Right click
    
    // Check if this cell is part of a merged cell and get the master cell coordinates
    let actualRow = row;
    let actualCol = col;
    
    // Find if this cell is part of a merged cell
    for (const [key, mergeInfo] of Array.from(mergedCells.entries())) {
      if (row >= mergeInfo.startRow && row <= mergeInfo.endRow && 
          col >= mergeInfo.startCol && col <= mergeInfo.endCol) {
        // Use the master cell coordinates for selection
        actualRow = mergeInfo.startRow;
        actualCol = mergeInfo.startCol;
        break;
      }
    }
    
    setIsSelecting(true);
    setSelectionStart({ row: actualRow, col: actualCol });
    setSelectedRange({ startRow: actualRow, endRow: actualRow, startCol: actualCol, endCol: actualCol });
  }, [mergedCells]);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (isSelecting && selectionStart) {
      // Check if this cell is part of a merged cell and get the master cell coordinates
      let actualRow = row;
      let actualCol = col;
      
      // Find if this cell is part of a merged cell
      for (const [key, mergeInfo] of Array.from(mergedCells.entries())) {
        if (row >= mergeInfo.startRow && row <= mergeInfo.endRow && 
            col >= mergeInfo.startCol && col <= mergeInfo.endCol) {
          // Use the master cell coordinates for selection
          actualRow = mergeInfo.startRow;
          actualCol = mergeInfo.startCol;
          break;
        }
      }
      
      const newRange: CellRange = {
        startRow: Math.min(selectionStart.row, actualRow),
        endRow: Math.max(selectionStart.row, actualRow),
        startCol: Math.min(selectionStart.col, actualCol),
        endCol: Math.max(selectionStart.col, actualCol)
      };
      setSelectedRange(newRange);
    }
  }, [isSelecting, selectionStart, mergedCells]);

  const handleCellRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    // If right-clicking outside current selection, select the clicked cell
    if (!selectedRange || !isCellInRange(row, col, selectedRange)) {
      setSelectedRange({ startRow: row, endRow: row, startCol: col, endCol: col });
      setSelectionStart({ row, col });
    }
    
    // Get the cell element to position menu relative to it
    const cellElement = e.currentTarget as HTMLElement;
    const rect = cellElement.getBoundingClientRect();
    const containerRect = (cellElement.closest('.excel-grid-container') as HTMLElement)?.getBoundingClientRect();
    
    if (containerRect) {
      // Position menu below and to the right of the clicked cell, relative to container
      setContextMenu({ 
        x: rect.left - containerRect.left + rect.width, 
        y: rect.top - containerRect.top + rect.height 
      });
    } else {
      // Fallback to absolute positioning
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [selectedRange]);

  const handleColumnHeaderClick = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    // Select entire column
    setSelectedRange({ 
      startRow: 0, 
      endRow: rows.length - 1, 
      startCol: colIndex, 
      endCol: colIndex 
    });
  }, [rows.length]);

  const handleRowHeaderClick = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    // Select entire row
    setSelectedRange({ 
      startRow: rowIndex, 
      endRow: rowIndex, 
      startCol: 0, 
      endCol: columns.length - 1 
    });
  }, [columns.length]);

  const handleColumnHeaderRightClick = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setSelectedRange({ 
      startRow: 0, 
      endRow: rows.length - 1, 
      startCol: colIndex, 
      endCol: colIndex 
    });
    
    const cellElement = e.currentTarget as HTMLElement;
    const rect = cellElement.getBoundingClientRect();
    const containerRect = (cellElement.closest('.excel-grid-container') as HTMLElement)?.getBoundingClientRect();
    
    if (containerRect) {
      setContextMenu({ 
        x: rect.left - containerRect.left, 
        y: rect.top - containerRect.top + rect.height 
      });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [rows.length]);

  const handleRowHeaderRightClick = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setSelectedRange({ 
      startRow: rowIndex, 
      endRow: rowIndex, 
      startCol: 0, 
      endCol: columns.length - 1 
    });
    
    const cellElement = e.currentTarget as HTMLElement;
    const rect = cellElement.getBoundingClientRect();
    const containerRect = (cellElement.closest('.excel-grid-container') as HTMLElement)?.getBoundingClientRect();
    
    if (containerRect) {
      setContextMenu({ 
        x: rect.left - containerRect.left + rect.width, 
        y: rect.top - containerRect.top 
      });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, [columns.length]);

  // Global mouse up handler for selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isSelecting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRange) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleClearContents();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange, handleCopy, handleCut, handlePaste, handleClearContents]);

  const handleUndo = useCallback(() => {
    if (historyIndex >= 0) {
      // Implement undo logic based on action type
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      // Implement redo logic based on action type
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  const handleCellDrop = useCallback((e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this cell is part of a merged cell and get the master cell coordinates
    let actualRow = row;
    let actualCol = col;
    let mergeInfo: MergeInfo | undefined = undefined;
    
    // Find if this cell is part of a merged cell
    for (const [key, merge] of Array.from(mergedCells.entries())) {
      if (row >= merge.startRow && row <= merge.endRow && 
          col >= merge.startCol && col <= merge.endCol) {
        // Use the master cell coordinates for drop
        actualRow = merge.startRow;
        actualCol = merge.startCol;
        mergeInfo = merge;
        break;
      }
    }
    
    let draggedData: any = null;
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        draggedData = JSON.parse(jsonData);
      } else {
        draggedData = { type: e.dataTransfer.getData('text/plain') };
      }
    } catch (error) {
      draggedData = { type: e.dataTransfer.getData('text/plain') };
    }

    // Immediately update cell data to show the widget
    const cellKey = getCellKey(actualRow, actualCol);
    setCellData(prev => {
      const newData = new Map(prev);
      const existingData = newData.get(cellKey) || { value: '', style: {} };
      newData.set(cellKey, {
        value: draggedData?.type || 'Widget',
        style: {
          ...existingData.style,
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6'
        }
      });
      return newData;
    });

    // Update the cell to show it has content
    setCells(prev => prev.map(row => 
      row.map(cell => 
        cell.row === actualRow && cell.col === actualCol 
          ? { ...cell, hasContent: true }
          : cell
      )
    ));

    // Clear any selection to show the dropped widget immediately
    setSelectedRange(null);
    setSelectionStart(null);

    onCellDrop?.(actualRow, actualCol, draggedData, mergeInfo);
  }, [onCellDrop, mergedCells, getCellKey]);

  const startResize = useCallback((e: React.MouseEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeType(type);
    setResizeIndex(index);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || resizeType === null || resizeIndex === -1) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (resizeType === 'col') {
      setColumns(prev => {
        const newColumns = [...prev];
        const newWidth = Math.max(
          GRID_CONFIG.MIN_COL_WIDTH,
          Math.min(GRID_CONFIG.MAX_COL_WIDTH, newColumns[resizeIndex].width + deltaX)
        );
        
        // Update column width and adjust subsequent column positions
        const widthDiff = newWidth - newColumns[resizeIndex].width;
        newColumns[resizeIndex].width = newWidth;
        
        for (let i = resizeIndex + 1; i < newColumns.length; i++) {
          newColumns[i].x += widthDiff;
        }
        
        return newColumns;
      });
    } else if (resizeType === 'row') {
      setRows(prev => {
        const newRows = [...prev];
        const newHeight = Math.max(
          GRID_CONFIG.MIN_ROW_HEIGHT,
          Math.min(GRID_CONFIG.MAX_ROW_HEIGHT, newRows[resizeIndex].height + deltaY)
        );
        
        // Update row height and adjust subsequent row positions
        const heightDiff = newHeight - newRows[resizeIndex].height;
        newRows[resizeIndex].height = newHeight;
        
        for (let i = resizeIndex + 1; i < newRows.length; i++) {
          newRows[i].y += heightDiff;
        }
        
        return newRows;
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isResizing, resizeType, resizeIndex, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeType(null);
    setResizeIndex(-1);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Update cells when rows or columns change
  useEffect(() => {
    setCells(prev => {
      const newCells: GridCell[][] = [];
      for (let row = 0; row < rows.length; row++) {
        newCells[row] = [];
        for (let col = 0; col < columns.length; col++) {
          newCells[row][col] = {
            ...prev[row]?.[col],
            row,
            col,
            x: columns[col].x,
            y: rows[row].y,
            width: columns[col].width,
            height: rows[row].height,
            selected: selectedCell?.row === row && selectedCell?.col === col
          };
        }
      }
      return newCells;
    });
    
    // Notify parent component of cell dimension changes
    if (onCellResize && rows.length > 0 && columns.length > 0) {
      onCellResize(rows, columns);
    }
  }, [rows, columns, selectedCell, onCellResize]);

  return (
    <div 
      ref={gridRef}
      className="excel-grid-container relative bg-gray-50 border-2 border-gray-400 overflow-hidden shadow-lg"
      style={{ 
        width, 
        height,
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Top-left corner */}
      <div 
        className="absolute bg-gradient-to-br from-gray-100 to-gray-200 border-r-2 border-b-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-300 cursor-pointer transition-all duration-200"
        style={{
          width: GRID_CONFIG.HEADER_WIDTH,
          height: GRID_CONFIG.HEADER_HEIGHT,
          left: 0,
          top: 0,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)'
        }}
      >
        ⚏
      </div>

      {/* Column headers */}
      {columns.map((col, index) => (
        <div key={`col-header-${col.index}`} className="absolute">
          {/* Column header */}
          <div
            className="bg-gradient-to-b from-gray-100 to-gray-200 border-r-2 border-b-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gradient-to-b hover:from-gray-200 hover:to-gray-300 cursor-pointer select-none transition-all duration-200 shadow-sm"
            style={{
              left: col.x,
              top: 0,
              width: col.width,
              height: GRID_CONFIG.HEADER_HEIGHT,
              boxSizing: 'border-box',
              zIndex: 10,
              position: 'absolute',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => handleColumnHeaderClick(e, index)}
            onContextMenu={(e) => handleColumnHeaderRightClick(e, index)}
          >
            {col.letter}
          </div>
          
          {/* Column resize handle */}
          <div
            className="absolute bg-transparent hover:bg-blue-500 cursor-col-resize"
            style={{
              left: col.x + col.width - GRID_CONFIG.RESIZE_HANDLE_SIZE / 2,
              top: 0,
              width: GRID_CONFIG.RESIZE_HANDLE_SIZE,
              height: GRID_CONFIG.HEADER_HEIGHT
            }}
            onMouseDown={(e) => startResize(e, 'col', index)}
          />
        </div>
      ))}

      {/* Row headers */}
      {rows.map((row, index) => (
        <div key={`row-header-${row.index}`} className="absolute">
          {/* Row header */}
          <div
            className="bg-gradient-to-r from-gray-100 to-gray-200 border-r-2 border-b-2 border-gray-400 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 cursor-pointer select-none transition-all duration-200 shadow-sm"
            style={{
              left: 0,
              top: row.y,
              width: GRID_CONFIG.HEADER_WIDTH,
              height: row.height,
              boxSizing: 'border-box',
              zIndex: 10,
              position: 'absolute',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => handleRowHeaderClick(e, index)}
            onContextMenu={(e) => handleRowHeaderRightClick(e, index)}
          >
            {row.index + 1}
          </div>
          
          {/* Row resize handle */}
          <div
            className="absolute bg-transparent hover:bg-blue-500 cursor-row-resize"
            style={{
              left: 0,
              top: row.y + row.height - GRID_CONFIG.RESIZE_HANDLE_SIZE / 2,
              width: GRID_CONFIG.HEADER_WIDTH,
              height: GRID_CONFIG.RESIZE_HANDLE_SIZE
            }}
            onMouseDown={(e) => startResize(e, 'row', index)}
          />
        </div>
      ))}

      {/* Full-height column resize handles */}
      {columns.map((col, index) => (
        <div
          key={`col-resize-full-${col.index}`}
          className="absolute bg-transparent hover:bg-blue-500 hover:opacity-60 cursor-col-resize z-20 transition-all duration-150 hover:shadow-lg"
          style={{
            left: col.x + col.width - GRID_CONFIG.RESIZE_HANDLE_SIZE,
            top: GRID_CONFIG.HEADER_HEIGHT,
            width: GRID_CONFIG.RESIZE_HANDLE_SIZE * 2,
            height: height - GRID_CONFIG.HEADER_HEIGHT
          }}
          onMouseDown={(e) => startResize(e, 'col', index)}
          title={`Resize column ${col.letter}`}
        />
      ))}

      {/* Full-width row resize handles */}
      {rows.map((row, index) => (
        <div
          key={`row-resize-full-${row.index}`}
          className="absolute bg-transparent hover:bg-blue-500 hover:opacity-60 cursor-row-resize z-20 transition-all duration-150 hover:shadow-lg"
          style={{
            left: GRID_CONFIG.HEADER_WIDTH,
            top: row.y + row.height - GRID_CONFIG.RESIZE_HANDLE_SIZE,
            width: width - GRID_CONFIG.HEADER_WIDTH,
            height: GRID_CONFIG.RESIZE_HANDLE_SIZE * 2
          }}
          onMouseDown={(e) => startResize(e, 'row', index)}
          title={`Resize row ${row.index + 1}`}
        />
      ))}

      {/* Grid cells */}
      {cells.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const cellKey = getCellKey(cell.row, cell.col);
          const cellInfo = cellData.get(cellKey);
          const mergeInfo = mergedCells.get(cellKey);
          const isSelected = selectedRange && isCellInRange(cell.row, cell.col, selectedRange);
          const isHidden = rows[cell.row]?.hidden || columns[cell.col]?.hidden;
          
          // Don't render merged cells that are not the master cell
          if (mergeInfo && !mergeInfo.isMaster) {
            return null;
          }
          
          // Don't render hidden cells
          if (isHidden) {
            return null;
          }
          
          // Calculate merged cell dimensions
          let cellWidth = cell.width;
          let cellHeight = cell.height;
          
          if (mergeInfo && mergeInfo.isMaster) {
            cellWidth = 0;
            cellHeight = 0;
            
            for (let col = mergeInfo.startCol; col <= mergeInfo.endCol; col++) {
              if (columns[col] && !columns[col].hidden) {
                cellWidth += columns[col].width;
              }
            }
            
            for (let row = mergeInfo.startRow; row <= mergeInfo.endRow; row++) {
              if (rows[row] && !rows[row].hidden) {
                cellHeight += rows[row].height;
              }
            }
          }
          
          return (
            <div
              key={`cell-${cell.row}-${cell.col}`}
              className={`absolute border-r border-b border-gray-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 ${
                isSelected ? 'bg-blue-100 ring-2 ring-blue-500 shadow-md' : 'bg-white'
              } ${isDragging ? 'bg-green-50 border-green-400 shadow-lg' : ''}`}
              style={{
                left: cell.x,
                top: cell.y,
                width: cellWidth,
                height: cellHeight,
                backgroundColor: cellInfo?.style?.backgroundColor || 'white',
                color: cellInfo?.style?.color || '#374151',
                fontWeight: cellInfo?.style?.fontWeight || 'normal',
                fontStyle: cellInfo?.style?.fontStyle || 'normal',
                textAlign: cellInfo?.style?.textAlign || 'left',
                border: cellInfo?.style?.border || '1px solid #d1d5db',
                zIndex: isSelected ? 10 : 1
              }}
              onClick={(e) => handleCellClick(e, cell.row, cell.col)}
              onMouseDown={(e) => handleCellMouseDown(e, cell.row, cell.col)}
              onMouseEnter={() => handleCellMouseEnter(cell.row, cell.col)}
              onContextMenu={(e) => handleCellRightClick(e, cell.row, cell.col)}
              onDrop={(e) => handleCellDrop(e, cell.row, cell.col)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                // Provide visual feedback for all cells during drag
                e.currentTarget.style.backgroundColor = '#dbeafe';
              }}
              onDragLeave={(e) => {
                // Reset background for all cells
                e.currentTarget.style.backgroundColor = cellInfo?.style?.backgroundColor || 'white';
              }}
              data-cell-type={mergeInfo ? 'merged' : 'normal'}
              data-merge-dimensions={mergeInfo ? `${mergeInfo.endCol - mergeInfo.startCol + 1}x${mergeInfo.endRow - mergeInfo.startRow + 1}` : undefined}
            >
              {/* Cell content */}
              {cellInfo?.value && (
                <div className={`absolute inset-2 flex items-center text-sm overflow-hidden ${
                  mergeInfo ? 'justify-center font-medium' : 'justify-start'
                }`}>
                  <span className="truncate">{cellInfo.value}</span>
                </div>
              )}
              
              {/* Cell content indicator */}
              {(cellInfo?.value || cell.hasContent) && !mergeInfo && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
              )}
              
              {/* Merge indicator */}
              {mergeInfo && mergeInfo.isMaster && (
                <div className="absolute top-1 left-1 flex items-center space-x-1">
                  <div className="text-xs text-blue-600 font-bold bg-blue-100 px-1 rounded">
                    ⚏ {mergeInfo.endCol - mergeInfo.startCol + 1}×{mergeInfo.endRow - mergeInfo.startRow + 1}
                  </div>
                </div>
              )}
              
              {/* Widget drop zone indicator for merged cells */}
              {mergeInfo && mergeInfo.isMaster && (
                <div className="absolute inset-0 border-2 border-dashed border-blue-300 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="text-blue-600 text-xs font-medium bg-white/90 px-2 py-1 rounded shadow">
                    Drop Widget Here
                  </div>
                </div>
              )}
              
              {/* Drop indicator when dragging */}
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-100/80">
                  <div className="text-green-700 text-xs font-medium bg-white px-2 py-1 rounded shadow">
                    {getColumnLetter(cell.col)}{cell.row + 1}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Children (form fields) */}
      {children}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
          selectedRange={selectedRange}
        />
      )}

      {/* Selection indicator overlay */}
      {selectedRange && (
        <div
          className="absolute pointer-events-none border-2 border-blue-500 bg-blue-100 bg-opacity-20"
          style={{
            left: columns[selectedRange.startCol]?.x || 0,
            top: rows[selectedRange.startRow]?.y || 0,
            width: selectedRange.endCol >= selectedRange.startCol 
              ? columns.slice(selectedRange.startCol, selectedRange.endCol + 1)
                  .reduce((sum, col) => sum + (col.hidden ? 0 : col.width), 0)
              : 0,
            height: selectedRange.endRow >= selectedRange.startRow
              ? rows.slice(selectedRange.startRow, selectedRange.endRow + 1)
                  .reduce((sum, row) => sum + (row.hidden ? 0 : row.height), 0)
              : 0,
            zIndex: 10
          }}
        />
      )}

      {/* Copy/Cut indicator */}
      {clipboard && (
        <div className="absolute top-2 right-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-lg z-50">
          {clipboard.operation === 'copy' ? '📋 Copied' : '✂️ Cut'} ({clipboard.data.length} rows)
        </div>
      )}
    </div>
  );
};

export default ExcelGrid;