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
  RiFileUserLine, 
  RiDeleteBin6Line, 
  RiDragMove2Line,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSettings4Line,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiText,
  RiCheckboxMultipleLine,
  RiCheckboxLine,
  RiListOrdered,
  RiCalendarLine,
  RiImageLine,
  RiAttachmentLine,
  RiPencilLine,
  RiSignalWifiLine,
  RiUserLine,
  RiTableLine,
  RiLayoutLine,
  RiApps2Line,
  RiEyeLine,
  RiCloseLine,
  RiFileTextLine,
  RiFileEditLine,
  RiDraftLine,
  RiPaletteLine
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
}

interface FormPage {
  id: string;
  fields: FormField[];
}

// Create FormBuilder component that can be used in both places
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
}

// Add interface for resize data
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

// Component for resizable field wrapper
interface ResizableWrapperProps {
  fieldId: string;
  children: React.ReactNode;
  onUpdateSize: (fieldId: string, width: number, height: number) => void;
}

const ResizableWrapper: React.FC<ResizableWrapperProps> = ({ fieldId, children, onUpdateSize }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  
  // Create refs to store the current values for use in event handlers
  const isResizingRef = useRef(isResizing);
  const initialWidthRef = useRef(initialWidth);
  const initialHeightRef = useRef(initialHeight);
  const startXRef = useRef(startX);
  const startYRef = useRef(startY);
  
  // Update refs when state changes
  useEffect(() => {
    isResizingRef.current = isResizing;
    initialWidthRef.current = initialWidth;
    initialHeightRef.current = initialHeight;
    startXRef.current = startX;
    startYRef.current = startY;
  }, [isResizing, initialWidth, initialHeight, startX, startY]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingRef.current && wrapperRef.current) {
      const newWidth = Math.max(150, initialWidthRef.current + (e.clientX - startXRef.current));
      const newHeight = Math.max(50, initialHeightRef.current + (e.clientY - startYRef.current));
      
      wrapperRef.current.style.width = `${newWidth}px`;
      wrapperRef.current.style.height = `${newHeight}px`;
    }
  }, []);
  
  const handleMouseUp = useCallback(() => {
    if (isResizingRef.current && wrapperRef.current) {
      setIsResizing(false);
      onUpdateSize(fieldId, wrapperRef.current.offsetWidth, wrapperRef.current.offsetHeight);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [fieldId, onUpdateSize]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (wrapperRef.current) {
      setIsResizing(true);
      setInitialWidth(wrapperRef.current.offsetWidth);
      setInitialHeight(wrapperRef.current.offsetHeight);
      setStartX(e.clientX);
      setStartY(e.clientY);
      
      // Add event listeners to handle resizing
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseMove, handleMouseUp]);
  
  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  return (
    <div 
      ref={wrapperRef} 
      className="relative w-full"
    >
      {children}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-ai-blue cursor-se-resize z-10"
        onMouseDown={handleMouseDown}
      />
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
  setActiveTab 
}) => {
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
  
  // Function to update field size
  const updateFieldSize = (fieldId: string, width: number, height: number) => {
    saveToHistory();
    
    const currentPage = formPages[currentPageIndex];
    const fieldIndex = currentPage.fields.findIndex((field: FormField) => field.id === fieldId);
    
    if (fieldIndex === -1) return;
    
    const updatedField = {
      ...currentPage.fields[fieldIndex],
      width,
      height,
      settings: {
        ...currentPage.fields[fieldIndex].settings,
        width,
        height
      }
    };
    
    const updatedFields = [...currentPage.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: updatedFields
    };
    
    setFormPages(updatedPages);
  };
  
  const saveToHistory = () => {
    formHistoryRef.current.past.push(JSON.parse(JSON.stringify(formPages)));
    formHistoryRef.current.future = [];
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
  
  const addFormField = (type: string) => {
    saveToHistory();
    
    const currentPage = formPages[currentPageIndex];
    const fields = [...currentPage.fields];
    
    // Special handling for approval kit
    if (type === 'approvalKit') {
      // Create a unique ID prefix for all fields in this kit
      const kitIdPrefix = `kit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Add comment field
      fields.push({
        id: `${kitIdPrefix}-comment`,
        type: 'text',
        label: 'Enter the approval comments',
        settings: {
          hideTitle: false,
          required: false,
          titleLayout: 'vertical',
          fontsize: '14px',
          promptText: '',
          printFrameLine: true,
          titleWrap: false
        }
      });
      
      // Add signature field
      fields.push({
        id: `${kitIdPrefix}-signature`,
        type: 'signature',
        label: 'Click to add signature',
        settings: {
          hideTitle: false,
          required: false,
          titleLayout: 'vertical',
          signatureColor: 'blue',
          signatureWidth: 'medium',
          clearAfterSave: false
        }
      });
      
      // Add date/time field
      fields.push({
        id: `${kitIdPrefix}-datetime`,
        type: 'date',
        label: 'Date and Time',
        settings: {
          hideTitle: true,
          required: false,
          titleLayout: 'vertical',
          dateFormat: 'yy-mm-dd',
          printFrameLine: true
        }
      });
      
      const updatedPages = [...formPages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        fields
      };
      
      setFormPages(updatedPages);
      return;
    }
    
    // Special handling for layout table
    if (type === 'layoutTable') {
      const tableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newField = { 
        id: tableId, 
        type, 
        label: 'Layout Table', 
        settings: { 
          hideTitle: false, 
          required: false, 
          titleLayout: 'vertical',
          rows: 3,
          columns: 3,
          hiddenFrameLine: false
        } 
      };
      
      const updatedPages = [...formPages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        fields: [...fields, newField]
      };
      
      setFormPages(updatedPages);
      setSelectedField(newField);
      return;
    }
    
    // Special handling for data table
    if (type === 'dataTable') {
      const tableId = `data-table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newField = { 
        id: tableId, 
        type, 
        label: 'Data Tables', 
        settings: { 
          hideTitle: false, 
          required: false, 
          titleLayout: 'vertical',
          columns: 4,
          hiddenFrameLine: false
        } 
      };
      
      const updatedPages = [...formPages];
      updatedPages[currentPageIndex] = {
        ...currentPage,
        fields: [...fields, newField]
      };
      
      setFormPages(updatedPages);
      setSelectedField(newField);
      return;
    }
    
    // Regular field addition
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let newSettings: Record<string, any> = { hideTitle: false, required: false, titleLayout: 'horizontal' };
    
    // Add type-specific default settings
    switch (type) {
      case 'text':
        newSettings = { ...newSettings, fontsize: '14px', promptText: '', printFrameLine: true, titleWrap: false };
        break;
      case 'multipleChoice':
        newSettings = { ...newSettings, options: ['Option 1', 'Option 2'], correctOption: null };
        break;
      case 'checkbox':
        newSettings = { ...newSettings, options: ['Option 1', 'Option 2'], allowMultiple: true };
        break;
      case 'date':
        newSettings = { ...newSettings, dateFormat: 'yy-mm-dd', printFrameLine: true };
        break;
      case 'intervalData':
        newSettings = { ...newSettings, startDateFormat: 'yy-mm-dd', endDateFormat: 'yy-mm-dd', showTime: false };
        break;
      case 'attachment':
        newSettings = { ...newSettings, hideWhenExporting: false, adminOnlyDelete: false, hideUploadTime: false };
        break;
      case 'image':
        newSettings = { ...newSettings, maxSize: '5MB', allowMultiple: false, aspectRatio: 'any' };
        break;
      case 'signature':
        newSettings = { ...newSettings, signatureColor: 'blue', signatureWidth: 'medium', clearAfterSave: false };
        break;
      case 'annotation':
        newSettings = { ...newSettings, annotationTools: ['pen', 'highlighter', 'eraser'], defaultColor: 'red' };
        break;
      case 'select':
        newSettings = { ...newSettings, options: ['Option 1', 'Option 2', 'Option 3'], allowSearch: false };
        break;
      case 'subform':
        newSettings = { ...newSettings, subformTemplate: null, allowMultiple: true, minEntries: 0, maxEntries: null };
        break;
      case 'member':
        newSettings = { ...newSettings, showDepartments: true, allowMultiple: false, requiredRole: null };
        break;
      case 'logo':
        newSettings = { ...newSettings, alignment: 'center', logoSize: 'medium', showCompanyName: true };
        break;
      default:
        break;
    }
    
    const label = type === 'text' ? 'Text Field' : 
                 type === 'number' ? 'Input Box' : 
                 type === 'date' ? 'Date Field' : 
                 type === 'select' ? 'Dropdown Field' : 
                 type === 'checkbox' ? 'Checkbox Field' :
                 type === 'multipleChoice' ? 'Multiple Choice' :
                 type === 'image' ? 'Image Field' :
                 type === 'attachment' ? 'Attachment Field' :
                 type === 'signature' ? 'Signature Field' :
                 type === 'annotation' ? 'Annotation Field' :
                 type === 'intervalData' ? 'Date Interval' :
                 type === 'subform' ? 'Subform' :
                 type === 'member' ? 'Member/Department' :
                 type === 'logo' ? 'Logo' : 'Field';
                 
    const newField = { id: fieldId, type, label, settings: newSettings };
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: [...currentPage.fields, newField]
    };
    
    setFormPages(updatedPages);
    setSelectedField(newField);
  };
  
  const removeField = (fieldId: string) => {
    saveToHistory();
    const currentPage = formPages[currentPageIndex];
    const updatedFields = currentPage.fields.filter((field: FormField) => field.id !== fieldId);
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: updatedFields
    };
    
    setFormPages(updatedPages);
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(null);
    }
  };
  
  const updateFieldSettings = (fieldId: string, settings: Record<string, any>) => {
    const currentPage = formPages[currentPageIndex];
    const fieldIndex = currentPage.fields.findIndex((field: FormField) => field.id === fieldId);
    
    if (fieldIndex === -1) return;
    
    const updatedField = {
      ...currentPage.fields[fieldIndex],
      settings: {
        ...currentPage.fields[fieldIndex].settings,
        ...settings
      }
    };
    
    const updatedFields = [...currentPage.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: updatedFields
    };
    
    setFormPages(updatedPages);
    setSelectedField(updatedField);
  };
  
  const updateFieldLabel = (fieldId: string, label: string) => {
    const currentPage = formPages[currentPageIndex];
    const fieldIndex = currentPage.fields.findIndex((field: FormField) => field.id === fieldId);
    
    if (fieldIndex === -1) return;
    
    const updatedField = {
      ...currentPage.fields[fieldIndex],
      label
    };
    
    const updatedFields = [...currentPage.fields];
    updatedFields[fieldIndex] = updatedField;
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: updatedFields
    };
    
    setFormPages(updatedPages);
    setSelectedField(updatedField);
  };
  
  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    saveToHistory();
    const currentPage = formPages[currentPageIndex];
    const fieldIndex = currentPage.fields.findIndex((field: FormField) => field.id === fieldId);
    
    if (fieldIndex === -1) return;
    if (direction === 'up' && fieldIndex === 0) return;
    if (direction === 'down' && fieldIndex === currentPage.fields.length - 1) return;
    
    const updatedFields = [...currentPage.fields];
    const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    
    // Swap fields
    [updatedFields[fieldIndex], updatedFields[targetIndex]] = 
    [updatedFields[targetIndex], updatedFields[fieldIndex]];
    
    const updatedPages = [...formPages];
    updatedPages[currentPageIndex] = {
      ...currentPage,
      fields: updatedFields
    };
    
    setFormPages(updatedPages);
  };
  
  const addPage = () => {
    saveToHistory();
    const newPageId = `page-${formPages.length + 1}`;
    setFormPages([...formPages, { id: newPageId, fields: [] }]);
    setCurrentPageIndex(formPages.length);
  };
  
  const deletePage = () => {
    if (formPages.length <= 1) return;
    
    saveToHistory();
    const updatedPages = formPages.filter((_: FormPage, index: number) => index !== currentPageIndex);
    setFormPages(updatedPages);
    
    // Adjust current page index if needed
    if (currentPageIndex >= updatedPages.length) {
      setCurrentPageIndex(updatedPages.length - 1);
    }
  };
  
  // Draggable widget component
  const DraggableWidget = ({ type, icon, label }: { type: string, icon: React.ReactNode, label: string }) => {
    const widgetDragControls = useDragControls();
    
    return (
      <motion.div
        drag
        dragControls={widgetDragControls}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          // Only add field if we actually dragged it somewhere
          if (info.point.x !== 0 || info.point.y !== 0) {
            addFormField(type);
          }
        }}
        dragSnapToOrigin
        className="cursor-grab active:cursor-grabbing"
      >
        <Button 
          variant="ai-secondary" 
          fullWidth
          className="justify-start"
        >
          {icon} {label}
        </Button>
      </motion.div>
    );
  };
  
  // Widget preview renderer based on type
  const renderWidgetPreview = (field: FormField) => {
    const requiredMark = field.settings.required ? <span className="text-error ml-1">*</span> : null;

    switch (field.type) {
      case 'text':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              {field.settings.promptText && <span className="text-gray-500">{field.settings.promptText}</span>}
            </div>
          </div>
        );
      
      case 'number':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 w-24 text-right ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              0
            </div>
          </div>
        );
      
      case 'date':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 w-32 ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  {field.settings.dateFormat === 'yy-mm-dd' ? '2023-07-25' : 
                   field.settings.dateFormat === 'mm/dd/yy' ? '07/25/2023' : '25/07/2023'}
                </span>
                <RiCalendarLine className="text-gray-500" />
              </div>
            </div>
          </div>
        );

      case 'intervalData':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Start:</span>
                <div className="bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">2023-07-25</span>
                    <RiCalendarLine className="text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">End:</span>
                <div className="bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">2023-07-30</span>
                    <RiCalendarLine className="text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'w-40'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Select an option</span>
                <RiListOrdered className="text-gray-500" />
              </div>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-2">
              {field.settings.options.map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-dark-600 rounded bg-dark-700/40 flex-shrink-0"></div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'multipleChoice':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-2">
              {field.settings.options.map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-dark-600 bg-dark-700/40 flex-shrink-0"></div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border-2 border-dashed border-dark-600/50 rounded-md p-6 bg-dark-700/30 flex flex-col items-center justify-center text-gray-500">
              <RiImageLine className="text-3xl mb-2" />
              <div>Click or drag to upload an image</div>
              <div className="text-xs mt-1">Max size: {field.settings.maxSize}</div>
            </div>
          </div>
        );

      case 'attachment':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border-2 border-dashed border-dark-600/50 rounded-md p-6 bg-dark-700/30 flex flex-col items-center justify-center text-gray-500">
              <RiAttachmentLine className="text-3xl mb-2" />
              <div>Click or drag to upload files</div>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md p-4 bg-dark-700/30 h-24 flex items-center justify-center text-gray-500">
              Sign here
            </div>
          </div>
        );
        
      case 'logo':
        return (
          <div className="p-3 flex flex-col items-center">
            <div className="w-16 h-16 bg-dark-700/40 rounded-md flex items-center justify-center mb-2">
              <RiImageLine className="text-2xl text-gray-500" />
            </div>
            <div className="text-center text-gray-400">Company Logo</div>
          </div>
        );
        
      case 'annotation':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md p-2 bg-dark-700/30 min-h-[100px]">
              <div className="flex space-x-2 mb-2 border-b border-dark-600 pb-2">
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  <RiPencilLine />
                </button>
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  <span>⟁</span>
                </button>
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  Eraser
                </button>
              </div>
              <div className="flex items-center justify-center h-16 text-gray-500">
                Annotation area
              </div>
            </div>
          </div>
        );
        
      case 'subform':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md overflow-hidden">
              <div className="bg-dark-700 p-2 flex justify-between items-center">
                <span className="text-sm">Subform</span>
                <button className="text-xs bg-dark-600 hover:bg-dark-500 px-2 py-1 rounded">
                  Add Entry
                </button>
              </div>
              <div className="p-4 bg-dark-800/30 text-center text-gray-500">
                No entries yet
              </div>
            </div>
          </div>
        );
        
      case 'member':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'flex-grow'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Select member or department</span>
                <RiUserLine className="text-gray-500" />
              </div>
            </div>
          </div>
        );
      
      case 'layoutTable':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} rounded-md overflow-hidden`}>
              <div className="grid grid-cols-3 h-[150px]">
                {Array.from({ length: field.settings.rows * field.settings.columns }).map((_, index) => (
                  <div 
                    key={index}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 flex items-center justify-center text-gray-500 text-sm`}
                  >
                    Cell {index + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {field.settings.rows} x {field.settings.columns} table
            </div>
          </div>
        );
      
      case 'dataTable':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} rounded-md overflow-hidden`}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${field.settings.columns}, 1fr)` }}>
                {/* Header row */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`header-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-600/70 p-2 text-center text-gray-300 text-sm font-medium`}
                  >
                    Column {index + 1}
                  </div>
                ))}
                
                {/* Data row 1 */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`row1-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 p-2 text-center text-gray-500 text-sm`}
                  >
                    Data
                  </div>
                ))}
                
                {/* Data row 2 */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`row2-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 p-2 text-center text-gray-500 text-sm`}
                  >
                    Data
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Data table with {field.settings.columns} columns
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3 border-b border-dark-700/50">
            {!field.settings.hideTitle && (
              <div className="font-medium">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="text-gray-500 text-sm">
              {field.type} field
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left panel - Widget/Kit/Table options */}
      <div className="md:col-span-3">
        <div className="bg-dark-800/70 rounded-lg border border-dark-700/50">
          {/* Tabs */}
          <div className="flex border-b border-dark-700/50">
            <button
              className={`flex-1 py-2 px-4 text-center transition-colors ${
                activeTab === 'widget' 
                  ? 'text-ai-blue border-b-2 border-ai-blue' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('widget')}
            >
              Widget
            </button>
            <button
              className={`flex-1 py-2 px-4 text-center transition-colors ${
                activeTab === 'kit' 
                  ? 'text-ai-blue border-b-2 border-ai-blue' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('kit')}
            >
              Kit
            </button>
            <button
              className={`flex-1 py-2 px-4 text-center transition-colors ${
                activeTab === 'table' 
                  ? 'text-ai-blue border-b-2 border-ai-blue' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('table')}
            >
              Table
            </button>
          </div>
          
          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'widget' && (
              <div className="space-y-3">
                <div className="text-xs uppercase text-gray-500 font-medium mb-2">WidgetKitTable</div>
                <div className="space-y-2">
                  <DraggableWidget 
                    type="text"
                    icon={<RiText className="mr-2" />}
                    label="Text Field"
                  />
                  <DraggableWidget 
                    type="number"
                    icon={<span className="mr-2">123</span>}
                    label="Input Box"
                  />
                  <DraggableWidget 
                    type="multipleChoice"
                    icon={<RiCheckboxMultipleLine className="mr-2" />}
                    label="Multiple Choice"
                  />
                  <DraggableWidget 
                    type="checkbox"
                    icon={<RiCheckboxLine className="mr-2" />}
                    label="Checkbox"
                  />
                  <DraggableWidget 
                    type="select"
                    icon={<RiListOrdered className="mr-2" />}
                    label="Dropdown"
                  />
                  <DraggableWidget 
                    type="date"
                    icon={<RiCalendarLine className="mr-2" />}
                    label="Date"
                  />
                  <DraggableWidget 
                    type="intervalData"
                    icon={<RiSignalWifiLine className="mr-2" />}
                    label="Interval Data"
                  />
                  <DraggableWidget 
                    type="image"
                    icon={<RiImageLine className="mr-2" />}
                    label="Image"
                  />
                  <DraggableWidget 
                    type="attachment"
                    icon={<RiAttachmentLine className="mr-2" />}
                    label="Attachment"
                  />
                  <DraggableWidget 
                    type="annotation"
                    icon={<RiPencilLine className="mr-2" />}
                    label="Annotation"
                  />
                  <DraggableWidget 
                    type="signature"
                    icon={<span className="mr-2">✍️</span>}
                    label="Signature"
                  />
                  <DraggableWidget 
                    type="subform"
                    icon={<RiApps2Line className="mr-2" />}
                    label="Subform"
                  />
                  <DraggableWidget 
                    type="member"
                    icon={<RiUserLine className="mr-2" />}
                    label="Member/Department"
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
                />
                <DraggableWidget 
                  type="dataTable"
                  icon={<RiTableLine className="mr-2" />}
                  label="Data Tables"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Center panel - Form builder */}
      <div className="md:col-span-6">
        <div className="bg-dark-800/30 rounded-lg border border-dark-700/50">
          {/* Toolbar */}
          <div className="flex justify-between items-center border-b border-dark-700/50 p-2">
            <div className="flex gap-2">
              <Button 
                variant="ai-secondary" 
                size="sm" 
                onClick={undo}
                title="Undo"
              >
                <RiArrowGoBackLine />
              </Button>
              <Button 
                variant="ai-secondary" 
                size="sm" 
                onClick={redo}
                title="Redo"
              >
                <RiArrowGoForwardLine />
              </Button>
            </div>
            <div className="text-sm text-gray-400">
              {isDragging ? 'Drop widget here' : 'Drag & drop fields or click to edit'}
            </div>
          </div>
          
          {/* Form content area */}
          <div 
            className={`p-4 min-h-[500px] transition-colors ${isDragging ? 'bg-ai-blue/10 border-2 border-dashed border-ai-blue/30' : ''}`}
            onDragOver={(e) => e.preventDefault()}
          >
            {formPages[currentPageIndex].fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-dark-700/50 rounded-lg h-[450px] flex flex-col items-center justify-center">
                <p>Drag and drop form fields from the panel on the left</p>
                <p className="text-sm mt-2">or click on any widget to add it here</p>
              </div>
            ) : (
              <div className="space-y-4 bg-dark-900/30 rounded-lg border border-dark-800/50 overflow-hidden">
                {formPages[currentPageIndex].fields.map((field: FormField) => (
                  <div 
                    key={field.id}
                    className={`transition-colors ${
                      selectedField && selectedField.id === field.id
                        ? 'bg-ai-blue/10 border-l-2 border-ai-blue'
                        : 'hover:bg-dark-800/70 border-l-2 border-transparent'
                    }`}
                    onClick={() => setSelectedField(field)}
                  >
                    <div className="flex items-center justify-between p-2 border-b border-dark-700/30">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <RiDragMove2Line className="cursor-move" />
                        <span>{field.type}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'up');
                          }}
                          className="text-gray-400 hover:text-white p-1 text-sm"
                          title="Move Up"
                        >
                          <RiArrowUpLine />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(field.id, 'down');
                          }}
                          className="text-gray-400 hover:text-white p-1 text-sm"
                          title="Move Down"
                        >
                          <RiArrowDownLine />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          className="text-error hover:text-error/80 p-1 text-sm"
                          title="Delete"
                        >
                          <RiDeleteBin6Line />
                        </button>
                      </div>
                    </div>
                    <ResizableWrapper 
                      fieldId={field.id}
                      onUpdateSize={updateFieldSize}
                    >
                      <div style={{ 
                        width: field.width ? `${field.width}px` : 'auto',
                        minHeight: field.height ? `${field.height}px` : 'auto'
                      }}>
                        {renderWidgetPreview(field)}
                      </div>
                    </ResizableWrapper>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Page navigation */}
          <div className="border-t border-dark-700/50 p-2 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {currentPageIndex + 1} of {formPages.length}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ai-secondary" 
                size="sm"
                onClick={addPage}
              >
                Add Page
              </Button>
              <Button 
                variant="ai-secondary" 
                size="sm"
                onClick={deletePage}
                disabled={formPages.length <= 1}
              >
                Delete Page
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right panel - Widget settings */}
      <div className="md:col-span-3">
        <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <RiSettings4Line className="mr-2" /> Widget Settings
          </h3>
          
          {selectedField ? (
            <div className="space-y-4 max-h-[450px] overflow-auto pr-2">
              {/* Common settings for all fields */}
              <div className="mb-3">
                <Input
                  label="Title"
                  value={selectedField.label}
                  onChange={(e) => updateFieldLabel(selectedField.id, e.target.value)}
                  className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                />
              </div>
              
              <div className="space-y-4">
                {selectedField.type === 'layoutTable' && (
                  <>
                    <div className="text-sm text-gray-400">Rows & Columns</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={selectedField.settings.rows}
                        onChange={(e) => updateFieldSettings(selectedField.id, { rows: parseInt(e.target.value) || 1 })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-16"
                      />
                      <span className="text-gray-400">×</span>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={selectedField.settings.columns}
                        onChange={(e) => updateFieldSettings(selectedField.id, { columns: parseInt(e.target.value) || 1 })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-16"
                      />
                      <Button 
                        variant="ai-secondary" 
                        size="sm"
                        className="ml-2"
                      >
                        Confirm
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button variant="ai-secondary" size="sm">Merge Cells</Button>
                      <Button variant="ai-secondary" size="sm">Unmerge Cells</Button>
                      <Button variant="ai-secondary" size="sm">Add Rows</Button>
                      <Button variant="ai-secondary" size="sm">Add Columns</Button>
                    </div>
                  </>
                )}
                
                {selectedField.type === 'dataTable' && (
                  <>
                    <div className="text-sm text-gray-400">Number of Columns</div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={selectedField.settings.columns}
                        onChange={(e) => updateFieldSettings(selectedField.id, { columns: parseInt(e.target.value) || 1 })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white w-20"
                      />
                      <Button 
                        variant="ai-secondary" 
                        size="sm"
                      >
                        OK
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button variant="ai-secondary" size="sm">Add Columns</Button>
                      <Button variant="ai-secondary" size="sm">Delete Columns</Button>
                    </div>
                  </>
                )}
                
                {selectedField.type === 'approvalKit' && (
                  <>
                    <div className="text-sm text-gray-400">Approval Kit Settings</div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Required Item</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.required}
                        onChange={(e) => updateFieldSettings(selectedField.id, { required: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Hide comments</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.hideComments}
                        onChange={(e) => updateFieldSettings(selectedField.id, { hideComments: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Hide signature</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.hideSignature}
                        onChange={(e) => updateFieldSettings(selectedField.id, { hideSignature: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Hide department</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.hideDepartment}
                        onChange={(e) => updateFieldSettings(selectedField.id, { hideDepartment: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Hide time</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.hideTime}
                        onChange={(e) => updateFieldSettings(selectedField.id, { hideTime: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Autofill when executor operates</label>
                      <input 
                        type="checkbox" 
                        checked={selectedField.settings.autofillOnExecute}
                        onChange={(e) => updateFieldSettings(selectedField.id, { autofillOnExecute: e.target.checked })}
                        className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                      />
                    </div>
                  </>
                )}
                
                <div className="text-sm text-gray-400">Other settings</div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm">Hide title</label>
                  <input 
                    type="checkbox" 
                    checked={selectedField.settings.hideTitle}
                    onChange={(e) => updateFieldSettings(selectedField.id, { hideTitle: e.target.checked })}
                    className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                  />
                </div>
                
                {/* Common required field setting */}
                {selectedField.type !== 'approvalKit' && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Required Item</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.required}
                      onChange={(e) => updateFieldSettings(selectedField.id, { required: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                )}
                
                {/* Hidden framed line setting for tables */}
                {(selectedField.type === 'layoutTable' || selectedField.type === 'dataTable') && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Hidden framed line</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.hiddenFrameLine}
                      onChange={(e) => updateFieldSettings(selectedField.id, { hiddenFrameLine: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                )}
                
                {/* Title layout options - not applicable to all field types */}
                {!['logo', 'annotation', 'subform', 'layoutTable', 'dataTable', 'approvalKit'].includes(selectedField.type) && (
                  <div>
                    <label className="text-sm block mb-1">Title layout</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          checked={selectedField.settings.titleLayout === 'horizontal'}
                          onChange={() => updateFieldSettings(selectedField.id, { titleLayout: 'horizontal' })}
                          className="mr-1.5 rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                        />
                        <span className="text-sm">Horizontal</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          checked={selectedField.settings.titleLayout === 'vertical'}
                          onChange={() => updateFieldSettings(selectedField.id, { titleLayout: 'vertical' })}
                          className="mr-1.5 rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                        />
                        <span className="text-sm">Vertical</span>
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Options settings for multipleChoice, checkbox, and select */}
                {['multipleChoice', 'checkbox', 'select'].includes(selectedField.type) && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-400 block mb-2">Options</label>
                    <div className="space-y-2 mb-2">
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
                      className="text-sm flex items-center text-ai-blue hover:text-ai-blue-light"
                    >
                      <RiAddLine className="mr-1" /> Add Option
                    </button>
                  </div>
                )}
                
                {/* Additional settings for specific field types */}
                {selectedField.type === 'checkbox' && (
                  <div className="flex items-center justify-between mt-3">
                    <label className="text-sm">Allow multiple selection</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowMultiple}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowMultiple: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                )}
                
                {selectedField.type === 'select' && (
                  <div className="flex items-center justify-between mt-3">
                    <label className="text-sm">Allow search</label>
                    <input 
                      type="checkbox" 
                      checked={selectedField.settings.allowSearch}
                      onChange={(e) => updateFieldSettings(selectedField.id, { allowSearch: e.target.checked })}
                      className="rounded-sm bg-dark-700 border-dark-600 text-ai-blue focus:ring-ai-blue"
                    />
                  </div>
                )}
                
                {/* Field-specific settings would go here */}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a field to view and edit its settings</p>
            </div>
          )}
        </div>
      </div>
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
  const [formPages, setFormPages] = useState<FormPage[]>([{ id: 'page_1', fields: [] }]);
  
  // Add formsList state
  const [formsList, setFormsList] = useState([
    {
      id: 1,
      title: 'Site Inspection Form',
      description: 'Form for site safety inspections',
      fieldsCount: 12,
      pages: [{ id: 'page_1', fields: [] }]
    },
    {
      id: 2,
      title: 'Incident Report',
      description: 'Document safety incidents on site',
      fieldsCount: 18,
      pages: [{ id: 'page_1', fields: [] }, { id: 'page_2', fields: [] }]
    },
    {
      id: 3,
      title: 'Equipment Checklist',
      description: 'Verify equipment status before use',
      fieldsCount: 8,
      pages: [{ id: 'page_1', fields: [] }]
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
    const selectedTemplate = formsList.find(form => form.id === templateId);
    if (selectedTemplate && selectedTemplate.pages) {
      setFormPages(selectedTemplate.pages);
      setFormName(selectedTemplate.title);
      setFormDescription(selectedTemplate.description);
      setCurrentPageIndex(0);
    }
  };
  
  // Handle form creation flow completion
  const handleSaveForm = (formData: any) => {
    console.log('Form saved:', formData);
    
    // Create a new form object
    const newForm = {
      id: formsList.length + 1,
      title: formData.templateName || formName,
      description: formData.formDescription || formDescription,
      fieldsCount: formData.formPages ? 
        formData.formPages.reduce((count: number, page: any) => count + page.fields.length, 0) : 
        formPages.reduce((count, page) => count + page.fields.length, 0),
      pages: formData.formPages || formPages
    };
    
    // Add to forms list
    setFormsList([...formsList, newForm]);
    
    // Reset form state
    setFormName('');
    setFormDescription('');
    setFormPages([{ id: '1', fields: [] }]);
    setCurrentPageIndex(0);
    setSelectedField(null);
    setShowCreateForm(false);
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
    setFormPages([{ id: '1', fields: [] }]);
    setCurrentPageIndex(0);
    setSelectedField(null);
    setShowCreateForm(true);
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };
  
  // Widget preview renderer based on type
  const renderWidgetPreview = (field: FormField) => {
    const requiredMark = field.settings.required ? <span className="text-error ml-1">*</span> : null;

    switch (field.type) {
      case 'text':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              {field.settings.promptText && <span className="text-gray-500">{field.settings.promptText}</span>}
            </div>
          </div>
        );
      
      case 'number':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 w-24 text-right ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              0
            </div>
          </div>
        );
      
      case 'date':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 w-32 ${field.settings.titleLayout === 'vertical' ? 'w-full' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  {field.settings.dateFormat === 'yy-mm-dd' ? '2023-07-25' : 
                   field.settings.dateFormat === 'mm/dd/yy' ? '07/25/2023' : '25/07/2023'}
                </span>
                <RiCalendarLine className="text-gray-500" />
              </div>
            </div>
          </div>
        );

      case 'intervalData':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Start:</span>
                <div className="bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">2023-07-25</span>
                    <RiCalendarLine className="text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">End:</span>
                <div className="bg-dark-700/40 border border-dark-600/50 rounded p-2 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">2023-07-30</span>
                    <RiCalendarLine className="text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'w-40'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Select an option</span>
                <RiListOrdered className="text-gray-500" />
              </div>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-2">
              {field.settings.options.map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 border border-dark-600 rounded bg-dark-700/40 flex-shrink-0"></div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'multipleChoice':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="space-y-2">
              {field.settings.options.map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-dark-600 bg-dark-700/40 flex-shrink-0"></div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border-2 border-dashed border-dark-600/50 rounded-md p-6 bg-dark-700/30 flex flex-col items-center justify-center text-gray-500">
              <RiImageLine className="text-3xl mb-2" />
              <div>Click or drag to upload an image</div>
              <div className="text-xs mt-1">Max size: {field.settings.maxSize}</div>
            </div>
          </div>
        );

      case 'attachment':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border-2 border-dashed border-dark-600/50 rounded-md p-6 bg-dark-700/30 flex flex-col items-center justify-center text-gray-500">
              <RiAttachmentLine className="text-3xl mb-2" />
              <div>Click or drag to upload files</div>
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md p-4 bg-dark-700/30 h-24 flex items-center justify-center text-gray-500">
              Sign here
            </div>
          </div>
        );
        
      case 'logo':
        return (
          <div className="p-3 flex flex-col items-center">
            <div className="w-16 h-16 bg-dark-700/40 rounded-md flex items-center justify-center mb-2">
              <RiImageLine className="text-2xl text-gray-500" />
            </div>
            <div className="text-center text-gray-400">Company Logo</div>
          </div>
        );
        
      case 'annotation':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md p-2 bg-dark-700/30 min-h-[100px]">
              <div className="flex space-x-2 mb-2 border-b border-dark-600 pb-2">
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  <RiPencilLine />
                </button>
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  <span>⟁</span>
                </button>
                <button className="p-1 rounded bg-dark-600/50 text-gray-300 text-sm">
                  Eraser
                </button>
              </div>
              <div className="flex items-center justify-center h-16 text-gray-500">
                Annotation area
              </div>
            </div>
          </div>
        );
        
      case 'subform':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="border border-dark-600 rounded-md overflow-hidden">
              <div className="bg-dark-700 p-2 flex justify-between items-center">
                <span className="text-sm">Subform</span>
                <button className="text-xs bg-dark-600 hover:bg-dark-500 px-2 py-1 rounded">
                  Add Entry
                </button>
              </div>
              <div className="p-4 bg-dark-800/30 text-center text-gray-500">
                No entries yet
              </div>
            </div>
          </div>
        );
        
      case 'member':
        return (
          <div className={`p-3 ${field.settings.titleLayout === 'vertical' ? 'flex flex-col gap-2' : 'flex items-center gap-4'}`}>
            {!field.settings.hideTitle && (
              <div className="font-medium min-w-[120px]">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`bg-dark-700/40 border border-dark-600/50 rounded p-2 ${field.settings.titleLayout === 'vertical' ? 'w-full' : 'flex-grow'}`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Select member or department</span>
                <RiUserLine className="text-gray-500" />
              </div>
            </div>
          </div>
        );
      
      case 'layoutTable':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} rounded-md overflow-hidden`}>
              <div className="grid grid-cols-3 h-[150px]">
                {Array.from({ length: field.settings.rows * field.settings.columns }).map((_, index) => (
                  <div 
                    key={index}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 flex items-center justify-center text-gray-500 text-sm`}
                  >
                    Cell {index + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              {field.settings.rows} x {field.settings.columns} table
            </div>
          </div>
        );
      
      case 'dataTable':
        return (
          <div className="p-3">
            {!field.settings.hideTitle && (
              <div className="font-medium mb-2">
                {field.label}{requiredMark}
              </div>
            )}
            <div className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} rounded-md overflow-hidden`}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${field.settings.columns}, 1fr)` }}>
                {/* Header row */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`header-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-600/70 p-2 text-center text-gray-300 text-sm font-medium`}
                  >
                    Column {index + 1}
                  </div>
                ))}
                
                {/* Data row 1 */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`row1-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 p-2 text-center text-gray-500 text-sm`}
                  >
                    Data
                  </div>
                ))}
                
                {/* Data row 2 */}
                {Array.from({ length: field.settings.columns }).map((_, index) => (
                  <div 
                    key={`row2-${index}`}
                    className={`${field.settings.hiddenFrameLine ? '' : 'border border-dark-600'} bg-dark-700/30 p-2 text-center text-gray-500 text-sm`}
                  >
                    Data
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Data table with {field.settings.columns} columns
            </div>
          </div>
        );

      default:
        return (
          <div className="p-3 border-b border-dark-700/50">
            {!field.settings.hideTitle && (
              <div className="font-medium">
                {field.label}{requiredMark}
              </div>
            )}
            <div className="text-gray-500 text-sm">
              {field.type} field
            </div>
          </div>
        );
    }
  };

  // Draggable widget component
  const DraggableWidget = ({ type, icon, label }: { type: string, icon: React.ReactNode, label: string }) => {
    const widgetDragControls = useDragControls();
    
    return (
      <motion.div
        drag
        dragControls={widgetDragControls}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          // Only add field if we actually dragged it somewhere
          if (info.point.x !== 0 || info.point.y !== 0) {
            // Outside FormBuilder, so just log the action
            console.log('Dragged widget:', type);
          }
        }}
        dragSnapToOrigin
        className="cursor-grab active:cursor-grabbing"
      >
        <Button 
          variant="ai-secondary" 
          fullWidth
          className="justify-start"
        >
          {icon} {label}
        </Button>
      </motion.div>
    );
  };
  
  // Form preview modal
  const FormPreviewModal = () => {
    return (
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="w-full max-w-3xl max-h-[90vh] overflow-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card variant="ai-dark" className="p-6 border border-ai-blue/20 shadow-ai-glow">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-ai-blue to-ai-teal">
                    {formName || "Untitled Form"}
                  </h2>
                  <Button 
                    variant="ai-secondary" 
                    size="sm"
                    onClick={() => setShowPreview(false)}
                  >
                    Close Preview
                  </Button>
                </div>
                
                {formDescription && (
                  <p className="text-gray-400 mb-6">{formDescription}</p>
                )}
                
                <div className="bg-dark-800/50 rounded-lg border border-dark-700/50 overflow-hidden">
                  {formPages[currentPageIndex].fields.map((field: FormField) => (
                    <div key={field.id} className="border-b border-dark-700/30 last:border-b-0">
                      {renderWidgetPreview(field)}
                    </div>
                  ))}
                  
                  {formPages[currentPageIndex].fields.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      This form has no fields yet
                    </div>
                  )}
                </div>
                
                {formPages.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {formPages.map((page, index) => (
                      <button
                        key={page.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === currentPageIndex 
                            ? 'bg-ai-blue text-white' 
                            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                        }`}
                        onClick={() => setCurrentPageIndex(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="ai-secondary"
                    onClick={() => setShowPreview(false)}
                  >
                    Back to Editor
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
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
      id: formsList.length + 1,
      title: 'Site Diary',
      description: 'Daily site progress and activity documentation',
      fieldsCount: Object.keys(siteDiaryData).length,
      pages: formsList[0].pages // Use the existing form's pages structure
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
      id: formsList.length + 1,
      title: 'Safety Inspection Checklist',
      description: 'Weekly site safety inspection documentation',
      fieldsCount: Object.keys(safetyData).length,
      pages: formsList[1].pages // Use the existing form's pages structure
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
      id: formsList.length + 1,
      title: 'Daily Cleaning Inspection Checklist',
      description: 'Daily cleaning inspection documentation',
      fieldsCount: Object.keys(cleaningData).length,
      pages: formsList[0].pages // Use the existing form's pages structure
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
      id: formsList.length + 1,
      title: 'Monthly Return of Site Labour Deployment and Wage Rates',
      description: 'Monthly tracking of construction site labour deployment and wage rates',
      fieldsCount: Object.keys(monthlyReturnData).length,
      pages: formsList[0].pages // Use the existing form's pages structure
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
      id: formsList.length + 1,
      title: 'Request for Inspection Check Form',
      description: 'Form for requesting inspection of construction works',
      fieldsCount: Object.keys(inspectionCheckData).length,
      pages: formsList[0].pages // Use the existing form's pages structure
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
      id: formsList.length + 1,
      title: 'Request for Survey Check Form',
      description: 'Form for requesting survey check of construction works',
      fieldsCount: Object.keys(surveyCheckData).length,
      pages: formsList[0].pages // Use the existing form's pages structure
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
                variant="futuristic"
                leftIcon={<RiPaletteLine />}
                onClick={() => setShowTemplates(true)}
                animated
                glowing
              >
                Templates
              </Button>
              <Button 
                variant="futuristic" 
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
                <RiDraftLine className="text-2xl text-purple-300" />
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
                  <h3 className="text-lg font-semibold mb-1">{form.title}</h3>
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
                  <span>{form.pages.length} pages</span>
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              className="w-full max-w-5xl max-h-[90vh] overflow-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <FormCreationFlow 
                onClose={() => setFormFlowOpen(false)}
                onSave={(formData) => {
                  // Handle form save logic
                  const newForm = {
                    id: formsList.length + 1,
                    title: formData.templateName || 'New Form',
                    description: formData.formDescription || '',
                    fieldsCount: formData.formPages?.reduce((count: number, page: any) => count + page.fields.length, 0) || 0,
                    pages: formData.formPages || [{ id: 'page_1', fields: [] }]
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