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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
    } else {
      alert('Please select an image or PDF file');
    }
  };

  const generateFormFromImage = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      let imagesToProcess: string[] = [];
      let globalDocumentAnalysis: any = {};
      
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

      // Process each image with AI
      const allFields: any[] = [];
      let formName = "";
      let formDescription = "";
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const image = imagesToProcess[i];
        setGenerationProgress(30 + (i / imagesToProcess.length) * 40);
        
        const messages = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an expert document analysis AI with MS Word-level precision. Analyze this form image (page ${i + 1} of ${imagesToProcess.length}) and extract ALL form fields with PIXEL-PERFECT accuracy. Return a JSON structure with the following format:

{
  "formName": "Descriptive form name",
  "formDescription": "Brief description of the form purpose",
  "documentAnalysis": {
    "pageWidth": 595,
    "pageHeight": 842,
    "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50},
    "detectedFontSizes": ["12px", "14px", "16px"],
    "primaryFontSize": "12px",
    "lineSpacing": 1.2,
    "orientation": "portrait"
  },
  "fields": [
    {
      "id": "unique_field_id",
      "type": "field_type",
      "label": "Field Label",
      "x": 50,
      "y": 100,
      "width": 300,
      "height": 40,
      "pageNumber": ${i + 1},
      "typography": {
        "fontSize": "12px",
        "fontWeight": "normal",
        "textAlign": "left",
        "lineHeight": 1.2,
        "letterSpacing": "normal"
      },
      "spacing": {
        "marginTop": 5,
        "marginBottom": 5,
        "marginLeft": 0,
        "marginRight": 0,
        "paddingTop": 8,
        "paddingBottom": 8,
        "paddingLeft": 12,
        "paddingRight": 12
      },
      "border": {
        "width": 1,
        "style": "solid",
        "color": "#cccccc",
        "radius": 4
      },
      "settings": {
        "required": false,
        "placeholder": "Enter text...",
        "hideTitle": false,
        "titleLayout": "horizontal",
        // For select/checkbox/multipleChoice fields:
        "options": ["Option 1", "Option 2", "Option 3"],
        // For table fields:
        "rows": 3,
        "columns": 4,
        "headers": ["Header 1", "Header 2", "Header 3", "Header 4"],
        "data": [
          ["Cell 1,1", "Cell 1,2", "Cell 1,3", "Cell 1,4"],
          ["Cell 2,1", "Cell 2,2", "Cell 2,3", "Cell 2,4"]
        ],
        "showHeader": true,
        "showBorders": true,
        "stripedRows": true,
        "resizableColumns": false,
        "cellPadding": 8,
        "headerHeight": 35,
        "rowHeight": 30,
        "columnWidths": [75, 75, 75, 75],
        // For number fields:
        "min": 0,
        "max": 100,
        "step": 1,
        "numberFormat": "integer",
        // For text fields:
        "inputType": "text",
        "maxLength": 255,
        "pattern": "",
        // For date fields:
        "dateFormat": "YYYY-MM-DD",
        "includeTime": false,
        // For file fields:
        "maxSize": "10MB",
        "allowedTypes": ["image/*", "application/pdf"]
      }
    }
  ]
}

Field types to use:
- "text": Single line text input
- "textarea": Multi-line text input
- "number": Numeric input
- "date": Date picker
- "select": Dropdown selection
- "checkbox": Multiple selection checkboxes
- "multipleChoice": Single selection radio buttons
- "image": Image upload
- "attachment": File upload
- "signature": Digital signature
- "layoutTable": Simple table layout
- "dataTable": Data table with headers
- "intervalData": Time interval data collection
- "annotation": Text annotation/notes
- "subform": Nested form component
- "member": User/department selection
- "approvalKit": Approval workflow

CRITICAL ANALYSIS REQUIREMENTS:
1. **FONT SIZE DETECTION**: Measure and report the exact font size for each text element. Common sizes: 8px, 9px, 10px, 11px, 12px, 14px, 16px, 18px, 20px, 24px.
2. **PIXEL-PERFECT POSITIONING**: Measure exact x, y coordinates relative to A4 page dimensions (595x842px portrait, 842x595px landscape). Use precise measurements, not estimates.
3. **ACCURATE DIMENSIONS**: Calculate exact width and height for each field based on visual boundaries, text content, and spacing.
4. **TABLE PRECISION**: For tables, measure individual cell dimensions, row heights, column widths, and extract exact text content. Calculate total table dimensions accurately.
5. **SPACING ANALYSIS**: Detect margins, padding, line spacing, and letter spacing. Measure gaps between elements.
6. **BORDER DETECTION**: Identify border styles, widths, colors, and corner radius for each field.
7. **TYPOGRAPHY ANALYSIS**: Detect font weight (normal, bold), text alignment (left, center, right), and line height.
8. **LAYOUT STRUCTURE**: Analyze document margins, detect grid patterns, alignment guides, and spacing consistency.
9. **CONTENT EXTRACTION**: Extract exact text content, including special characters, numbers, and formatting.
10. **FIELD RELATIONSHIPS**: Identify grouped fields, form sections, and hierarchical structures.

DIMENSION CALCULATION RULES:
- Text fields: Width = content width + padding + borders, Height = font size + padding + borders
- Tables: Width = sum of column widths + borders, Height = (row count × row height) + header height + borders
- Textareas: Calculate based on visible lines and character width
- Checkboxes/Radio: Standard 16px × 16px with label spacing
- Signatures: Minimum 200px × 80px based on signature area

QUALITY STANDARDS:
- Positioning accuracy: ±2px tolerance
- Dimension accuracy: ±3px tolerance
- Font size accuracy: Exact match to detected size
- Table cell alignment: Perfect grid alignment
- Text content: 100% accurate extraction

ALWAYS include pageNumber property for each field (${i + 1} for this page). Provide complete typography, spacing, and border information for MS Word-level precision.`
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

        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "qwen-vl-max",
            messages: messages,
            stream: false,
            temperature: 0.1, // Lower temperature for more consistent results
            max_tokens: 4000
          })
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse the AI response to extract form structure
        let pageFormData: any;
        try {
          // Try to extract JSON from the response
          console.log(`Processing AI response for page ${i + 1}:`, aiResponse.substring(0, 200) + '...');
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            console.log(`Found JSON match for page ${i + 1}`);
            pageFormData = JSON.parse(jsonMatch[0]);
            console.log(`Parsed form data for page ${i + 1}:`, pageFormData);
            
            // Set form name and description from the first page
            if (i === 0) {
              formName = pageFormData.formName || "Generated Form";
              formDescription = pageFormData.formDescription || "Form generated from uploaded document";
              console.log("Form name and description set from first page:", formName, formDescription);
              
              // Store document analysis from first page for validation
              if (pageFormData.documentAnalysis) {
                globalDocumentAnalysis = pageFormData.documentAnalysis;
              }
            }
            
            // Validate and process the extracted data
              if (pageFormData.fields && Array.isArray(pageFormData.fields)) {
                console.log(`Processing ${pageFormData.fields.length} fields for page ${i + 1}`);
                const processedFields = pageFormData.fields.map((field: any, index: number) => {
                // Calculate intelligent dimensions based on field type
                const calculateDimensions = (fieldType: string, fieldData: any) => {
                  const baseWidth = field.width || 300;
                  const baseHeight = field.height || 40;
                  
                  switch (fieldType) {
                    case 'table':
                       // Advanced table dimension analysis
                       const tableData = fieldData.settings?.tableData || {};
                       const rows = fieldData.settings?.rows || tableData.rows || 3;
                       const columns = fieldData.settings?.columns || tableData.columns || 3;
                       
                       // Calculate dynamic cell dimensions based on content
                       let totalWidth = 0;
                       let totalHeight = 0;
                       
                       if (tableData.cellDimensions && Array.isArray(tableData.cellDimensions)) {
                         // Use AI-detected cell dimensions
                         const cellDims = tableData.cellDimensions;
                         totalWidth = cellDims.reduce((sum: number, row: any[]) => {
                           const rowWidth = row.reduce((rowSum: number, cell: any) => rowSum + (cell.width || 80), 0);
                           return Math.max(sum, rowWidth);
                         }, 0);
                         totalHeight = cellDims.reduce((sum: number, row: any[]) => {
                           const maxRowHeight = Math.max(...row.map((cell: any) => cell.height || 30));
                           return sum + maxRowHeight;
                         }, 0);
                       } else {
                         // Fallback to uniform cell sizing with content-aware adjustments
                         const avgContentLength = tableData.avgContentLength || 10;
                         const maxContentLength = tableData.maxContentLength || 20;
                         
                         // Dynamic cell width based on content
                         const baseCellWidth = Math.max(60, Math.min(avgContentLength * 8, 120));
                         const baseCellHeight = Math.max(25, Math.min(maxContentLength > 50 ? 40 : 30, 50));
                         
                         // Account for column width variations
                         const columnWidths = tableData.columnWidths || Array(columns).fill(baseCellWidth);
                         const rowHeights = tableData.rowHeights || Array(rows).fill(baseCellHeight);
                         
                         totalWidth = columnWidths.reduce((sum: number, width: number) => sum + width, 0);
                         totalHeight = rowHeights.reduce((sum: number, height: number) => sum + height, 0);
                       }
                       
                       // Add padding and borders
                       const tablePadding = 20;
                       const borderWidth = (fieldData.border?.width || 1) * 2;
                       
                       return {
                         width: Math.min(totalWidth + tablePadding + borderWidth, 550),
                         height: Math.min(totalHeight + tablePadding + borderWidth, 400)
                       };
                    case 'textarea':
                      const textLines = fieldData.settings?.rows || 4;
                      return {
                        width: Math.max(200, Math.min(baseWidth, 500)),
                        height: Math.max(textLines * 20 + 20, Math.min(baseHeight * 3, 200))
                      };
                    case 'select':
                    case 'multiselect':
                      const optionCount = fieldData.settings?.options?.length || 1;
                      return {
                        width: Math.max(150, Math.min(baseWidth, 400)),
                        height: fieldType === 'multiselect' ? Math.min(optionCount * 25 + 40, 150) : 40
                      };
                    case 'checkbox':
                    case 'radio':
                      return {
                        width: Math.max(120, Math.min(baseWidth, 300)),
                        height: Math.max(30, Math.min(baseHeight, 50))
                      };
                    case 'date':
                    case 'time':
                      return {
                        width: Math.max(150, Math.min(baseWidth, 250)),
                        height: Math.max(35, Math.min(baseHeight, 45))
                      };
                    case 'number':
                      return {
                        width: Math.max(100, Math.min(baseWidth, 200)),
                        height: Math.max(35, Math.min(baseHeight, 45))
                      };
                    default: // text, email, etc.
                      return {
                        width: Math.max(150, Math.min(baseWidth, 400)),
                        height: Math.max(35, Math.min(baseHeight, 45))
                      };
                  }
                };
                
                const dimensions = calculateDimensions(field.type || 'text', field);
                
                // Apply document layout analysis for positioning
                const applyLayoutAnalysis = (x: number, y: number, fieldType: string) => {
                  const docAnalysis = pageFormData.documentAnalysis || {};
                  const margins = docAnalysis.margins || { top: 50, bottom: 50, left: 50, right: 50 };
                  const gridSize = docAnalysis.gridSize || 10;
                  
                  // Snap to grid for precision positioning
                  const snappedX = Math.round(x / gridSize) * gridSize;
                  const snappedY = Math.round(y / gridSize) * gridSize;
                  
                  // Ensure fields respect document margins
                  const adjustedX = Math.max(margins.left, Math.min(snappedX, 595 - margins.right - dimensions.width));
                  const adjustedY = Math.max(margins.top, Math.min(snappedY, 842 - margins.bottom - dimensions.height));
                  
                  // Apply field-specific positioning rules
                  if (fieldType === 'table') {
                    // Tables often need more spacing
                    return {
                      x: Math.max(adjustedX, margins.left + 10),
                      y: Math.max(adjustedY, margins.top + 10)
                    };
                  }
                  
                  return { x: adjustedX, y: adjustedY };
                };
                
                const position = applyLayoutAnalysis(field.x || 50, field.y || 50, field.type || 'text');
                
                // Ensure all required properties are present
                const processedField = {
                  id: field.id || `field-${Date.now()}-${index}-page${i+1}`,
                  type: field.type || 'text',
                  label: field.label || `Field ${index + 1}`,
                  x: position.x,
                  y: position.y,
                  width: Math.max(50, Math.min(dimensions.width, 595)),
                  height: Math.max(20, Math.min(dimensions.height, 400)),
                  pageNumber: field.pageNumber || (i + 1),
                  // Preserve typography information from AI analysis
                  typography: {
                    fontSize: field.typography?.fontSize || pageFormData.documentAnalysis?.primaryFontSize || '12px',
                    fontWeight: field.typography?.fontWeight || 'normal',
                    textAlign: field.typography?.textAlign || 'left',
                    lineHeight: field.typography?.lineHeight || pageFormData.documentAnalysis?.lineSpacing || 1.2,
                    letterSpacing: field.typography?.letterSpacing || 'normal'
                  },
                  // Preserve spacing information
                  spacing: {
                    marginTop: field.spacing?.marginTop || 5,
                    marginBottom: field.spacing?.marginBottom || 5,
                    marginLeft: field.spacing?.marginLeft || 0,
                    marginRight: field.spacing?.marginRight || 0,
                    paddingTop: field.spacing?.paddingTop || 8,
                    paddingBottom: field.spacing?.paddingBottom || 8,
                    paddingLeft: field.spacing?.paddingLeft || 12,
                    paddingRight: field.spacing?.paddingRight || 12
                  },
                  // Preserve border information
                  border: {
                    width: field.border?.width || 1,
                    style: field.border?.style || 'solid',
                    color: field.border?.color || '#cccccc',
                    radius: field.border?.radius || 4
                  },
                  settings: {
                    required: field.settings?.required || false,
                    placeholder: field.settings?.placeholder || '',
                    hideTitle: field.settings?.hideTitle || false,
                    titleLayout: field.settings?.titleLayout || 'horizontal',
                    ...field.settings
                  }
                };

                // Process field-specific settings
                switch (field.type) {
                  case 'select':
                  case 'checkbox':
                  case 'multipleChoice':
                    processedField.settings.options = field.settings?.options || ['Option 1', 'Option 2', 'Option 3'];
                    break;
                    
                  case 'layoutTable':
                  case 'dataTable':
                    // Get rows and columns from settings or calculate from data if available
                    const data = field.settings?.data || [];
                    const rows = field.settings?.rows || (data.length > 0 ? data.length : 3);
                    const columns = field.settings?.columns || 
                      (data.length > 0 && data[0].length > 0 ? data[0].length : 3);
                    
                    // Generate headers if not provided
                    let headers = field.settings?.headers || [];
                    if (headers.length === 0 && columns > 0) {
                      headers = Array.from({ length: columns }, (_, i) => `Header ${i + 1}`);
                    }
                    
                    // Generate data if not provided or incomplete
                    let tableData = [...data];
                    if (tableData.length < rows) {
                      for (let r = tableData.length; r < rows; r++) {
                        const newRow = [];
                        for (let c = 0; c < columns; c++) {
                          newRow.push(`Data ${r+1},${c+1}`);
                        }
                        tableData.push(newRow);
                      }
                    }
                    
                    // Ensure each row has the correct number of columns
                    tableData = tableData.map((row, rowIndex) => {
                      if (row.length < columns) {
                        const filledRow = [...row];
                        for (let c = row.length; c < columns; c++) {
                          filledRow.push(`Data ${rowIndex+1},${c+1}`);
                        }
                        return filledRow;
                      } else if (row.length > columns) {
                        return row.slice(0, columns);
                      }
                      return row;
                    });
                    
                    processedField.settings.rows = rows;
                    processedField.settings.columns = columns;
                    processedField.settings.headers = headers;
                    processedField.settings.data = tableData;
                    processedField.settings.showHeader = field.settings?.showHeader !== false;
                    processedField.settings.showBorders = field.settings?.showBorders !== false;
                    processedField.settings.stripedRows = field.settings?.stripedRows !== false;
                    processedField.settings.resizableColumns = field.settings?.resizableColumns || false;
                    
                    if (field.type === 'dataTable') {
                      processedField.settings.sortableColumns = field.settings?.sortableColumns || false;
                      processedField.settings.filterableColumns = field.settings?.filterableColumns || false;
                      processedField.settings.pagination = field.settings?.pagination || false;
                    }
                    
                    processedField.width = Math.max(400, processedField.width);
                    processedField.height = Math.max(150, processedField.height);
                    break;
                    
                  case 'number':
                    processedField.settings.min = field.settings?.min;
                    processedField.settings.max = field.settings?.max;
                    processedField.settings.step = field.settings?.step || 1;
                    processedField.settings.numberFormat = field.settings?.numberFormat || 'integer';
                    break;
                    
                  case 'text':
                    processedField.settings.inputType = field.settings?.inputType || 'text';
                    processedField.settings.maxLength = field.settings?.maxLength;
                    processedField.settings.pattern = field.settings?.pattern || '';
                    break;
                    
                  case 'textarea':
                    processedField.height = Math.max(80, processedField.height);
                    processedField.settings.rows = field.settings?.rows || 3;
                    break;
                    
                  case 'date':
                    processedField.settings.dateFormat = field.settings?.dateFormat || 'YYYY-MM-DD';
                    processedField.settings.includeTime = field.settings?.includeTime || false;
                    break;
                    
                  case 'image':
                  case 'attachment':
                    processedField.settings.maxSize = field.settings?.maxSize || '10MB';
                    processedField.settings.allowedTypes = field.settings?.allowedTypes || ['image/*'];
                    processedField.height = Math.max(80, processedField.height);
                    break;
                    
                  case 'signature':
                    processedField.height = Math.max(80, processedField.height);
                    break;
                }

                return processedField;
              });

              allFields.push(...processedFields);
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          console.log('Raw AI response:', aiResponse);
          
          // Fallback: create a simple text field if parsing fails
          allFields.push({
            id: `field-${Date.now()}-fallback`,
            type: 'text',
            label: 'Generated Field',
            x: 50,
            y: 50 + (allFields.length * 60),
            width: 300,
            height: 40,
            pageNumber: i + 1,
            settings: {
              required: false,
              placeholder: 'Enter text...',
              hideTitle: false,
              titleLayout: 'horizontal'
            }
          });
        }
      }

      setGenerationProgress(80);

      // Apply field validation and adjustments
      const documentAnalysis = globalDocumentAnalysis || {};
      const { validationReport, adjustedFields } = validateFormStructure(allFields, documentAnalysis);
      
      // Log validation results for debugging
      console.log('Field Validation Report:', validationReport);
      if (validationReport.issuesFound.length > 0) {
        console.warn('Validation issues found:', validationReport.issuesFound);
      }
      
      // Use adjusted fields instead of original allFields
      const validatedFields = adjustedFields;
      
      setGenerationProgress(85);

      // Organize fields by page number and create multiple form pages
      const fieldsByPage: { [key: number]: any[] } = {};
      
      // Group validated fields by page number
      validatedFields.forEach(field => {
        const pageNum = field.pageNumber || 1;
        if (!fieldsByPage[pageNum]) {
          fieldsByPage[pageNum] = [];
        }
        fieldsByPage[pageNum].push(field);
      });
      
      // Create pages array with fields for each page
      const pages = Object.keys(fieldsByPage).map(pageNumStr => {
        const pageNum = parseInt(pageNumStr);
        return {
          id: `page-${Date.now()}-${pageNum}`,
          fields: fieldsByPage[pageNum],
          dimensions: {
            width: 595,
            height: 842,
            orientation: 'portrait',
            size: 'A4'
          }
        };
      });
      
      // If no pages were created, add a default page
      if (pages.length === 0) {
        pages.push({
          id: `page-${Date.now()}-1`,
          fields: [
            {
              id: `field-${Date.now()}`,
              type: 'text',
              label: 'Generated Field',
              settings: { 
                hideTitle: false, 
                required: false, 
                titleLayout: 'horizontal',
                placeholder: 'Enter text...'
              },
              x: 50,
              y: 50,
              width: 300,
              height: 40
            }
          ],
          dimensions: {
            width: 595,
            height: 842,
            orientation: 'portrait',
            size: 'A4'
          }
        });
      }
      
      // Create final form structure
      console.log('Creating final form structure with pages:', pages);
      const formData = {
        name: formName || selectedFile.name.replace(/\.[^/.]+$/, "") + " - AI Generated Form",
        description: formDescription || `Form generated from uploaded ${selectedFile.type === 'application/pdf' ? 'PDF' : 'image'}`,
        pages: pages,
        validationReport: validationReport,
        metadata: {
          generatedAt: new Date().toISOString(),
          sourceFile: selectedFile.name,
          totalFields: validationReport.totalFields,
          validFields: validationReport.validFields,
          accuracyScore: Math.round((validationReport.validFields / validationReport.totalFields) * 100) || 0
        }
      };

      console.log('Final form data:', formData);
      setGenerationProgress(100);
      setGeneratedForm(formData);
      setPreviewMode(true);

    } catch (error) {
      console.error('Error generating form:', error);
      alert(`Failed to generate form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsGenerating(false);
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
                
                {/* Visual Form Preview with Dimension Accuracy */}
                <div className="border border-dark-600 rounded-lg p-4 bg-dark-900/50 mb-4">
                  <h4 className="font-medium mb-3 flex items-center justify-between">
                    <span>Visual Form Preview</span>
                    <div className="flex gap-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">✓ Dimensions</span>
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">✓ Typography</span>
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">✓ Positioning</span>
                    </div>
                  </h4>
                  
                  {generatedForm?.pages?.map((page: {fields: any[]}, pageIndex: number) => (
                    <div key={`preview-${pageIndex}`} className="mb-4">
                      <div className="text-sm font-medium text-ai-teal mb-2">
                        Page {pageIndex + 1} Preview (A4: 595×842px)
                      </div>
                      
                      {/* Miniature form preview */}
                      <div className="bg-gray-100 rounded-lg p-4 relative overflow-hidden">
                        <div 
                          className="bg-white border border-gray-300 relative mx-auto shadow-sm"
                          style={{
                            width: '297px', // Half scale of A4 width (595/2)
                            height: '421px', // Half scale of A4 height (842/2)
                            transform: 'scale(0.7)',
                            transformOrigin: 'top center'
                          }}
                        >
                          {/* Grid overlay for precision */}
                          <div className="absolute inset-0 opacity-10">
                            {Array.from({ length: 30 }, (_, i) => (
                              <div key={`h-${i}`} className="absolute w-full border-t border-gray-400" style={{ top: `${i * 14}px` }} />
                            ))}
                            {Array.from({ length: 21 }, (_, i) => (
                              <div key={`v-${i}`} className="absolute h-full border-l border-gray-400" style={{ left: `${i * 14}px` }} />
                            ))}
                          </div>
                          
                          {/* Field boundaries */}
                          {page.fields?.map((field: any, fieldIndex: number) => {
                            const accuracy = calculateFieldAccuracy(field);
                            return (
                              <div
                                key={fieldIndex}
                                className={`absolute border-2 rounded transition-all duration-200 hover:z-10 group ${
                                  accuracy >= 90 ? 'border-green-400 bg-green-50' :
                                  accuracy >= 75 ? 'border-yellow-400 bg-yellow-50' :
                                  'border-red-400 bg-red-50'
                                }`}
                                style={{
                                  left: `${(field.x || 0) / 2}px`,
                                  top: `${(field.y || 0) / 2}px`,
                                  width: `${(field.width || 100) / 2}px`,
                                  height: `${(field.height || 30) / 2}px`,
                                }}
                                title={`${field.label} (${accuracy}% accuracy)`}
                              >
                                <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                                  {field.label} - {accuracy}% accurate
                                </div>
                                <div className="text-xs p-1 truncate" style={{ fontSize: `${Math.max(6, (parseInt(field.typography?.fontSize) || 12) / 2)}px` }}>
                                  {field.type}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
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
  onSelect 
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the field first
    onSelect();
    
    if (!onUpdatePosition) return;
    
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Calculate effective dimensions based on field type - use the same calculation as in the render function
    const effectiveWidth = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.width || 200, (field.settings?.columns || 3) * 100) : 
      field.width || 200;
      
    const effectiveHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.height || 40, (field.settings?.rows || 3) * 30) : 
      field.type === 'textarea' ? 
        Math.max(field.height || 40, (field.settings?.rows || 3) * 20) : 
        field.height || 40;
    
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
  }, [field.x, field.y, field.width, field.height, field.type, field.settings, onSelect, onUpdatePosition]);
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate effective dimensions based on field type - use the same calculation as in the render function
    const effectiveWidth = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.width || 200, (field.settings?.columns || 3) * 100) : 
      field.width || 200;
      
    const effectiveHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.height || 40, (field.settings?.rows || 3) * 30) : 
      field.type === 'textarea' ? 
        Math.max(field.height || 40, (field.settings?.rows || 3) * 20) : 
        field.height || 40;
    
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: effectiveWidth, height: effectiveHeight });
    setInitialPosition({ x: field.x || 0, y: field.y || 0 });
    
    document.body.style.cursor = getResizeCursor(direction);
    document.body.style.userSelect = 'none';
  }, [field.width, field.height, field.x, field.y, field.type, field.settings]);
  
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
    
    // Calculate effective dimensions based on field type - use the same calculation as in the render function
    const effectiveWidth = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.width || 200, (field.settings?.columns || 3) * 100) : 
      field.width || 200;
      
    const effectiveHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.height || 40, (field.settings?.rows || 3) * 30) : 
      field.type === 'textarea' ? 
        Math.max(field.height || 40, (field.settings?.rows || 3) * 20) : 
        field.height || 40;
    
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
      
      // Use page dimensions for boundary constraints with proper padding
      const padding = 24; // Account for page padding (increased for better boundaries)
      const newX = Math.max(padding, Math.min(
        pageWidth - effectiveWidth - padding,
        initialPosition.x + deltaX
      ));
      const newY = Math.max(padding, Math.min(
        pageHeight - effectiveHeight - padding,
        initialPosition.y + deltaY
      ));
      
      // Apply smooth transition and update position immediately for responsive dragging
      wrapperRef.current.style.transition = 'none'; // Disable transition during drag for immediate response
      wrapperRef.current.style.transform = `translate(${newX - (field.x || 0)}px, ${newY - (field.y || 0)}px)`;
      wrapperRef.current.style.left = `${field.x || 0}px`;
      wrapperRef.current.style.top = `${field.y || 0}px`;
      wrapperRef.current.style.zIndex = '1000'; // Bring to front while dragging
      
    } else if (isResizing) {
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = initialPosition.x;
      let newY = initialPosition.y;
      
      switch (resizeDirection) {
        case 'se':
          newWidth = Math.max(50, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(50, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          newX = initialPosition.x + Math.min(deltaX, initialSize.width - 50);
          break;
        case 'ne':
          newWidth = Math.max(50, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          newY = initialPosition.y + Math.min(deltaY, initialSize.height - 20);
          break;
        case 'nw':
          newWidth = Math.max(50, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          newX = initialPosition.x + Math.min(deltaX, initialSize.width - 50);
          newY = initialPosition.y + Math.min(deltaY, initialSize.height - 20);
          break;
        case 'e':
          newWidth = Math.max(50, initialSize.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(50, initialSize.width - deltaX);
          newX = initialPosition.x + Math.min(deltaX, initialSize.width - 50);
          break;
        case 's':
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(20, initialSize.height - deltaY);
          newY = initialPosition.y + Math.min(deltaY, initialSize.height - 20);
          break;
      }
      
      // Apply changes immediately
      wrapperRef.current.style.width = `${newWidth}px`;
      wrapperRef.current.style.height = `${newHeight}px`;
      wrapperRef.current.style.left = `${newX}px`;
      wrapperRef.current.style.top = `${newY}px`;
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, resizeDirection, field.width, field.height, onUpdatePosition]);
  
  const handleMouseUp = useCallback(() => {
    // Calculate effective dimensions based on field type - use the same calculation as in the render function
    const effectiveWidth = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.width || 200, (field.settings?.columns || 3) * 100) : 
      field.width || 200;
      
    const effectiveHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 
      Math.max(field.height || 40, (field.settings?.rows || 3) * 30) : 
      field.type === 'textarea' ? 
        Math.max(field.height || 40, (field.settings?.rows || 3) * 20) : 
        field.height || 40;
    
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
      
      // Get the page container element and its dimensions for proper boundary calculation
      const pageContainer = wrapperRef.current.closest('[data-page-container]') as HTMLElement;
      let pageWidth = 595;
      let pageHeight = 842;
      
      if (pageContainer) {
        const computedStyle = window.getComputedStyle(pageContainer);
        pageWidth = parseInt(computedStyle.width) || 595;
        pageHeight = parseInt(computedStyle.height) || 842;
      }
      
      const padding = 24;
       const newX = Math.max(padding, Math.min(
         pageWidth - effectiveWidth - padding,
         finalX
       ));
       const newY = Math.max(padding, Math.min(
         pageHeight - effectiveHeight - padding,
         finalY
       ));
      
      // Reset all visual enhancements and apply final position
       wrapperRef.current.style.transform = 'none';
       wrapperRef.current.style.transition = 'all 0.3s ease-out'; // Smooth transition back
       wrapperRef.current.style.zIndex = field.zIndex?.toString() || '1'; // Reset z-index
       wrapperRef.current.style.boxShadow = ''; // Reset shadow
       
       // Update the field position
       onUpdatePosition(fieldId, newX, newY);
    }
    
    if (isResizing && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        const newX = rect.left - parentRect.left - 12;
        const newY = rect.top - parentRect.top - 12;
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        onUpdateSize(fieldId, newWidth, newHeight);
        if (onUpdatePosition) {
          onUpdatePosition(fieldId, Math.max(0, newX), Math.max(0, newY));
        }
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [isDragging, isResizing, fieldId, field.type, field.width, field.height, field.settings, onUpdateSize, onUpdatePosition]);
  
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
  
  // Calculate effective dimensions based on field type for consistent sizing
  const effectiveWidth = field.type === 'layoutTable' || field.type === 'dataTable' ? 
    Math.max(field.width || 200, (field.settings?.columns || 3) * 100) : 
    field.width || 200;
    
  const effectiveHeight = field.type === 'layoutTable' || field.type === 'dataTable' ? 
    Math.max(field.height || 40, (field.settings?.rows || 3) * 30) : 
    field.type === 'textarea' ? 
      Math.max(field.height || 40, (field.settings?.rows || 3) * 20) : 
      field.height || 40;

  return (
    <div 
      ref={wrapperRef} 
      className={`absolute border-2 transition-all duration-200 group ${
        isSelected 
          ? 'border-ai-blue shadow-lg shadow-ai-blue/20' 
          : 'border-transparent hover:border-ai-blue/50 hover:shadow-md'
      } ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'} ${isResizing ? 'z-50' : ''}`}
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
        boxSizing: 'border-box', // Ensure border is included in the dimensions
        padding: '0', // Remove any padding that might affect border positioning
        overflow: 'visible', // Allow resize handles to extend outside
        borderWidth: '2px', // Ensure consistent border width
        borderStyle: 'solid' // Ensure border is solid
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
      
      {/* Hover instruction - full coverage with consistent effective dimensions */}
      {!isSelected && (
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-ai-blue/10 rounded-sm"
          style={{
            // Use 100% to fill the parent container which now has the correct effective dimensions
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: '0',
            margin: '0',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            pointerEvents: 'none', // Allow clicks to pass through to the parent
            borderRadius: '0' // Ensure no rounded corners that might affect border coverage
          }}
        >
          <span className="text-ai-blue text-sm font-medium px-2 py-1 bg-white/80 rounded shadow-sm">Click to select & drag</span>
        </div>
      )}
      
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
          
          {/* Move indicator */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-ai-blue text-white px-3 py-2 rounded text-sm font-medium pointer-events-none z-30 shadow-lg">
            <RiDragMove2Line className="inline mr-2 text-base" style={{ width: '16px', height: '16px' }} />
            Drag to move
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Draggable Widget with proper drag and drop
const DraggableWidget = ({ type, icon, label }: { type: string, icon: React.ReactNode, label: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({ type, label }));
    e.dataTransfer.setData('text/plain', type); // Also set as text/plain for compatibility
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
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
  
  // Function to update field size
  const updateFieldSize = (fieldId: string, width: number, height: number) => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            fields: page.fields.map(field => 
              field.id === fieldId 
                ? { ...field, width, height }
                : field
            )
          }
        : page
    ));
  };
  
  // Function to update field position
  const updateFieldPosition = (fieldId: string, x: number, y: number) => {
    saveToHistory();
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? {
            ...page,
            fields: page.fields.map(field => 
              field.id === fieldId 
                ? { ...field, x, y }
                : field
            )
          }
        : page
    ));
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
  
  // Enhanced addFormField function with position support
  const addFormField = (type: string, x?: number, y?: number) => {
    saveToHistory();
    const currentDimensions = getCurrentPageDimensions();
    
    // Default field dimensions
    const defaultWidth = type === 'layoutTable' || type === 'dataTable' ? 400 : 300;
    const defaultHeight = type === 'layoutTable' || type === 'dataTable' ? 200 : 
                          type === 'signature' ? 80 : 
                          type === 'textarea' ? 80 :
                          type === 'image' || type === 'attachment' ? 120 : 40;
    
    // Calculate constraints based on current page dimensions
    const padding = 24; // 12px padding on each side
    const maxX = currentDimensions.width - defaultWidth - padding;
    const maxY = currentDimensions.height - defaultHeight - padding;
    
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
      width: defaultWidth,
      height: defaultHeight,
      x: x !== undefined ? Math.max(0, Math.min(x, maxX)) : 50,
      y: y !== undefined ? Math.max(0, Math.min(y, maxY)) : 50,
      zIndex: 1
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
      
      // Field dimensions for constraint calculation
      const fieldWidth = data.type === 'layoutTable' || data.type === 'dataTable' ? 400 : 300;
      const fieldHeight = data.type === 'layoutTable' || data.type === 'dataTable' ? 200 : 
                         data.type === 'signature' ? 80 : 
                         data.type === 'textarea' ? 80 :
                         data.type === 'image' || data.type === 'attachment' ? 120 : 40;
      
      // Ensure the field is dropped within the canvas bounds
      const padding = 24; // Account for canvas padding
      const canvasWidth = currentDimensions.width - padding;
      const canvasHeight = currentDimensions.height - padding;
      
      const constrainedX = Math.max(0, Math.min(x - 12, canvasWidth - fieldWidth)); // Subtract half field width for better centering
      const constrainedY = Math.max(0, Math.min(y - 12, canvasHeight - fieldHeight)); // Subtract half field height for better centering
      
      addFormField(data.type, constrainedX, constrainedY);
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

  // Function to distribute fields across pages with overflow handling
  const distributeFieldsAcrossPages = (fields: any[], pageDimensions: any = {
    width: 595,
    height: 842,
    orientation: 'portrait' as const,
    size: 'A4' as const
  }) => {
    const pages: FormPage[] = [];
    let currentPageFields: any[] = [];
    let currentY = 20; // Start with some padding from the top
    const pageHeight = pageDimensions.height;
    const verticalSpacing = 15; // Spacing between fields

    // Sort fields by Y position
    const sortedFields = [...fields].sort((a, b) => (a.y || 0) - (b.y || 0));

    // Process each field
    sortedFields.forEach((field) => {
      const fieldHeight = field.height || 40;
      
      // Check if this field would overflow the current page
      if (currentY + fieldHeight + 20 > pageHeight) { // 20px bottom margin
        // Create a new page with the current fields
        if (currentPageFields.length > 0) {
          pages.push({
            id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fields: [...currentPageFields],
            dimensions: { ...pageDimensions }
          });
        }

        // Reset for the new page
        currentPageFields = [];
        currentY = 20; // Reset Y position for the new page
      }

      // Add the field to the current page with updated Y position
      const processedField = { ...field };
      processedField.y = currentY;
      currentPageFields.push(processedField);
      
      // Update currentY for the next field
      currentY += fieldHeight + verticalSpacing;
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

  const handleAIFormGenerated = (formData: any) => {
    console.log('Received AI generated form data:', formData);
    saveToHistory();
    
    if (formData.pages && formData.pages.length > 0) {
      // The form data already has pages structure, process each page
      const processedPages = formData.pages.map((page: any) => {
        // Process the fields in each page
        const processedFields = page.fields.map((field: any) => {
          const baseField = {
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: field.type || 'text',
            label: field.label || 'Generated Field',
            width: field.width || 300,
            height: field.height || 40,
            x: field.x || 0,
            y: field.y || 0,
            zIndex: 1
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

          return {
            ...baseField,
            settings
          };
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
      // Process the form data to ensure all fields have proper structure
      const processedFields = formData.fields.map((field: any) => {
        const baseField = {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          width: field.width || 300,
          height: field.height || 40,
          x: field.x || 0,
          y: field.y || 0,
          zIndex: 1
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
        return {
          ...baseField,
          settings
        };
      });

      // Check for overflow and distribute fields across multiple pages if needed
      const defaultDimensions = {
        width: 595,
        height: 842,
        orientation: 'portrait' as const,
        size: 'A4' as const
      };
      
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
                            {cell || `Data ${rowIndex + 1},${colIndex + 1}`}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-500`}>
                            Data {rowIndex + 1},{colIndex + 1}
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
                            {cell || `Data ${rowIndex + 1},${colIndex + 1}`}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                      <tr key={rowIndex} className={field.settings.stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                          <td key={colIndex} className={`${field.settings.showBorders !== false ? 'border border-gray-300' : ''} p-1 text-center text-gray-500`}>
                            Data {rowIndex + 1},{colIndex + 1}
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
                  />
                  <DraggableWidget 
                    type="textarea"
                    icon={<RiFileEditLine className="mr-2" />}
                    label="Textarea"
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
                        className="relative w-full h-full p-6"
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
                        {/* Drop zone indicator */}
                        {isDragging && (
                          <div className="absolute inset-0 bg-ai-blue/5 border-2 border-dashed border-ai-blue rounded-lg flex items-center justify-center z-50">
                            <div className="text-ai-blue font-medium text-lg">
                              Drop widget here
                            </div>
                          </div>
                        )}
                        
                        {page.fields.length === 0 ? (
                          <div className="absolute inset-6 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
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
                            >
                              <div className="w-full h-full bg-white border border-gray-200 rounded p-2">
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
                                newRow.push(`Data ${i+1},${j+1}`);
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
                                newRow.push(currentRow[j] || `Data ${i+1},${j+1}`);
                              } else {
                                newRow.push(`Data ${i+1},${j+1}`);
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
                            newRow.push(`Data ${selectedField.settings.data.length + 1},${i+1}`);
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
                      <div className="relative w-full h-full p-6" style={{ minHeight: `${page.dimensions.height - 48}px` }}>
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
                              <div className="w-full h-full bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow duration-200">
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