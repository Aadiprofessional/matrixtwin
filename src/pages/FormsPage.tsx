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
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const image = imagesToProcess[i];
        setGenerationProgress(30 + (i / imagesToProcess.length) * 40);
        
        const messages = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this form image (page ${i + 1}) and extract all the form fields, their types, labels, and approximate positions. Return a JSON structure that represents the form with fields that can be used to recreate it. Include field types like 'text', 'number', 'date', 'checkbox', 'multipleChoice', 'select', 'signature', 'table', etc. For each field, include: id, type, label, settings (with appropriate defaults), and approximate position coordinates (x, y) in pixels relative to a standard A4 page (595x842). Also include a suggested form name and description.`
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
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse the AI response to extract form structure
        let pageFormData;
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            pageFormData = JSON.parse(jsonMatch[0]);
            if (pageFormData.fields) {
              allFields.push(...pageFormData.fields.map((field: any) => ({
                ...field,
                id: `field-${Date.now()}-${Math.random()}`,
                pageNumber: i + 1
              })));
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
        }
      }

      setGenerationProgress(80);

      // Create final form structure
      const formData = {
        name: selectedFile.name.replace(/\.[^/.]+$/, "") + " - AI Generated Form",
        description: `Form generated from uploaded ${selectedFile.type === 'application/pdf' ? 'PDF' : 'image'}`,
        fields: allFields.length > 0 ? allFields : [
          {
            id: `field-${Date.now()}`,
            type: 'text',
            label: 'Generated Field',
            settings: { hideTitle: false, required: false, titleLayout: 'horizontal' },
            x: 50,
            y: 50,
            width: 300,
            height: 40
          }
        ]
      };

      setGenerationProgress(100);
      setGeneratedForm(formData);
      setPreviewMode(true);

    } catch (error) {
      console.error('Error generating form:', error);
      alert('Failed to generate form. Please try again.');
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
                
                <div className="border border-dark-600 rounded-lg p-4 bg-dark-900/50">
                  <h4 className="font-medium mb-3">Form Fields ({generatedForm?.fields?.length || 0})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedForm?.fields?.map((field: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-dark-800/50 rounded">
                        <div className="flex items-center">
                          <span className="text-ai-blue mr-2">{field.type}</span>
                          <span>{field.label}</span>
                          {field.pageNumber && (
                            <span className="text-xs text-gray-500 ml-2">Page {field.pageNumber}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {field.x && field.y ? `(${field.x}, ${field.y})` : 'Auto-position'}
                        </span>
                      </div>
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!wrapperRef.current) return;
    
    const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    
    if (isResizing) {
      const rect = wrapperRef.current.getBoundingClientRect();
      
      let newWidth = field.width || 200;
      let newHeight = field.height || 40;
      
      if (resizeDirection.includes('right')) {
        newWidth = Math.max(50, e.clientX - rect.left);
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(20, e.clientY - rect.top);
      }
      if (resizeDirection.includes('left')) {
        const deltaX = rect.left - e.clientX;
        newWidth = Math.max(50, (field.width || 200) + deltaX);
      }
      if (resizeDirection.includes('top')) {
        const deltaY = rect.top - e.clientY;
        newHeight = Math.max(20, (field.height || 40) + deltaY);
      }
      
      // Apply constraints to keep within parent bounds with better padding calculation
      const padding = 24; // 12px padding on each side
      const maxWidth = parentRect.width - (field.x || 0) - padding;
      const maxHeight = parentRect.height - (field.y || 0) - padding;
      
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.min(newHeight, maxHeight);
      
      wrapperRef.current.style.width = `${newWidth}px`;
      wrapperRef.current.style.height = `${newHeight}px`;
      
    } else if (isDragging && onUpdatePosition) {
      // Fixed drag positioning with proper boundary constraints
      const padding = 24; // 12px padding on each side
      const fieldWidth = field.width || 200;
      const fieldHeight = field.height || 40;
      
      // Calculate canvas dimensions
      const canvasWidth = parentRect.width - padding;
      const canvasHeight = parentRect.height - padding;
      
      // Calculate new position
      const newX = Math.max(0, Math.min(canvasWidth - fieldWidth, e.clientX - parentRect.left - dragOffset.x - 12));
      const newY = Math.max(0, Math.min(canvasHeight - fieldHeight, e.clientY - parentRect.top - dragOffset.y - 12));
      
      // Apply position immediately for smooth dragging
      wrapperRef.current.style.left = `${newX}px`;
      wrapperRef.current.style.top = `${newY}px`;
    }
  }, [isResizing, isDragging, resizeDirection, field, dragOffset, onUpdatePosition]);
  
  const handleMouseUp = useCallback(() => {
    if (isResizing && wrapperRef.current) {
      setIsResizing(false);
      setResizeDirection('');
      onUpdateSize(fieldId, wrapperRef.current.offsetWidth, wrapperRef.current.offsetHeight);
    } else if (isDragging && wrapperRef.current && onUpdatePosition) {
      setIsDragging(false);
      const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const newX = Math.max(0, rect.left - parentRect.left - 12); // Account for padding
        const newY = Math.max(0, rect.top - parentRect.top - 12); // Account for padding
        onUpdatePosition(fieldId, newX, newY);
      }
    }
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [fieldId, onUpdateSize, onUpdatePosition, handleMouseMove, isResizing, isDragging]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    
    // Set appropriate cursor
    const cursors: { [key: string]: string } = {
      'top-left': 'nw-resize',
      'top-right': 'ne-resize',
      'bottom-left': 'sw-resize',
      'bottom-right': 'se-resize',
      'top': 'n-resize',
      'bottom': 's-resize',
      'left': 'w-resize',
      'right': 'e-resize'
    };
    document.body.style.cursor = cursors[direction] || 'default';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (wrapperRef.current && onUpdatePosition) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const parentRect = wrapperRef.current.parentElement?.getBoundingClientRect();
      
      if (parentRect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }
  }, [handleMouseMove, handleMouseUp, onUpdatePosition]);
  
  // Add click handler for the field content to enable dragging
  const handleFieldClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);
  
  // Add double-click handler to start dragging
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onUpdatePosition) {
      handleDragMouseDown(e);
    }
  }, [handleDragMouseDown, onUpdatePosition]);
  
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [handleMouseMove, handleMouseUp]);
  
  return (
    <div 
      ref={wrapperRef} 
      className={`absolute border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-ai-blue shadow-lg shadow-ai-blue/20' 
          : 'border-transparent hover:border-ai-blue/50'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
      style={{ 
        width: field.width || 200,
        height: field.height || 40,
        left: field.x || 0,
        top: field.y || 0,
        zIndex: isSelected ? 10 : (field.zIndex || 1)
      }}
      onClick={handleFieldClick}
      onDoubleClick={handleDoubleClick}
    >
      <div 
        className="w-full h-full"
        onMouseDown={handleDragMouseDown}
      >
        {children}
      </div>
      
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div 
            className="absolute -top-1 -left-1 w-3 h-3 bg-ai-blue border border-white cursor-nw-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
          />
          <div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-ai-blue border border-white cursor-ne-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
          />
          <div 
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-ai-blue border border-white cursor-sw-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
          />
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-ai-blue border border-white cursor-se-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
          />
          
          {/* Edge resize handles */}
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-ai-blue border border-white cursor-n-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
          />
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-ai-blue border border-white cursor-s-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
          />
          <div 
            className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-ai-blue border border-white cursor-w-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
          />
          <div 
            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-ai-blue border border-white cursor-e-resize z-20"
            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
          />
          
          {/* Drag handle */}
          <div 
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-ai-blue text-white px-2 py-1 rounded text-xs cursor-grab flex items-center z-20 hover:bg-ai-blue-light"
            onMouseDown={handleDragMouseDown}
          >
            <RiDragMove2Line className="mr-1" />
            Drag
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
  setActiveTab 
}) => {
  // Add state for AI modal and preview
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  
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
    setFormPages(prev => prev.map((page, index) => 
      index === currentPageIndex 
        ? { 
            ...page, 
            dimensions: { 
              ...newDimensions, 
              size, 
              orientation 
            } 
          }
        : page
    ));
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
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
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
    setIsDragging(true);
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
  
  const handleAIFormGenerated = (formData: any) => {
    if (formData.fields && formData.fields.length > 0) {
      saveToHistory();
      const newPage: FormPage = {
        id: `page_${Date.now()}`,
        fields: formData.fields.map((field: any) => ({
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: field.type || 'text',
          label: field.label || 'Generated Field',
          settings: {
            required: field.required || false,
            placeholder: field.placeholder || '',
            hideTitle: false,
            titleLayout: 'horizontal',
            options: field.options || [],
            allowMultiple: false,
            allowSearch: false,
            maxSize: '10MB',
            rows: 3,
            columns: 3,
            hiddenFrameLine: false,
            ...field.settings
          },
          width: field.width || 300,
          height: field.height || 40,
          x: field.x || 0,
          y: field.y || 0,
          zIndex: 1
        })),
        dimensions: {
          width: 595,
          height: 842,
          orientation: 'portrait' as const,
          size: 'A4' as const
        }
      };
      setFormPages(prev => [...prev, newPage]);
      setCurrentPageIndex(formPages.length);
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
              <span className="text-gray-500">0</span>
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
                <span className="text-gray-500">Select option</span>
                <RiListOrdered className="text-gray-400 text-xs" />
              </div>
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
              {field.settings.options.slice(0, 2).map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-gray-400 rounded bg-white flex-shrink-0"></div>
                  <div className="text-sm text-gray-800">{option}</div>
                </div>
              ))}
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
              {field.settings.options.slice(0, 2).map((option: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-gray-400 bg-white flex-shrink-0"></div>
                  <div className="text-sm text-gray-800">{option}</div>
                </div>
              ))}
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
              <table className="w-full text-xs">
                {field.settings.showHeader !== false && (
                  <thead className="bg-gray-100">
                    <tr>
                      {Array.from({ length: field.settings.columns || 3 }).map((_, i) => (
                        <th key={i} className="border border-gray-300 p-1 text-center">
                          Header {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 p-1 text-center text-gray-500">
                          Cell {rowIndex + 1},{colIndex + 1}
                        </td>
                      ))}
                    </tr>
                  ))}
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
              <table className="w-full text-xs">
                <thead className="bg-gray-200">
                  <tr>
                    {Array.from({ length: field.settings.columns || 3 }).map((_, i) => (
                      <th key={i} className="border border-gray-300 p-1 text-center font-medium">
                        Column {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: field.settings.rows || 3 }).map((_, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {Array.from({ length: field.settings.columns || 3 }).map((_, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 p-1 text-center text-gray-500">
                          Data {rowIndex + 1},{colIndex + 1}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
      {/* Left panel - Widget palette */}
      <div className="md:col-span-3">
        <div className="bg-dark-800/70 rounded-lg border border-dark-700/50 p-4">
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
          
          {/* Widget list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
      
      {/* Center panel - MS Word-like Form builder */}
      <div className="md:col-span-6">
        <div className="bg-dark-800/30 rounded-lg border border-dark-700/50">
          {/* Enhanced Toolbar with AI and Preview buttons */}
          <div className="flex justify-between items-center border-b border-dark-700/50 p-2">
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
              
              {/* Preview Button */}
              <Button 
                variant="ai-secondary" 
                size="sm" 
                onClick={() => setShowFormPreview(true)}
                title="Preview form"
                leftIcon={<RiEyeLine />}
              >
                Preview
              </Button>
            </div>
            <div className="text-sm text-gray-400">
              {isDragging ? 'Drop widget here' : `${getCurrentPageDimensions().width}×${getCurrentPageDimensions().height}px`}
            </div>
          </div>
          
          {/* MS Word-like Form content area */}
          <div className="p-4 flex justify-center">
            <div 
              className={`relative bg-white rounded-lg shadow-lg transition-all duration-300 ${
                isDragging ? 'ring-2 ring-ai-blue ring-opacity-50 shadow-ai-blue/20' : ''
              }`}
              style={{
                width: `${getCurrentPageDimensions().width}px`,
                minHeight: `${getCurrentPageDimensions().height}px`,
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Canvas content with data attribute for better drop targeting */}
              <div 
                className="relative w-full h-full p-6"
                data-canvas="true"
                style={{ minHeight: `${getCurrentPageDimensions().height - 48}px` }}
              >
                {/* Drop zone indicator */}
                {isDragging && (
                  <div className="absolute inset-0 bg-ai-blue/5 border-2 border-dashed border-ai-blue rounded-lg flex items-center justify-center z-50">
                    <div className="text-ai-blue font-medium text-lg">
                      Drop widget here
                    </div>
                  </div>
                )}
                
                {formPages[currentPageIndex].fields.length === 0 ? (
                  <div className="absolute inset-6 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                    <RiDragMove2Line className="text-6xl mb-4" />
                    <p className="text-lg font-medium">Drop form fields here</p>
                    <p className="text-sm mt-2">Drag widgets from the left panel to create your form</p>
                    <p className="text-xs mt-1 text-gray-500">
                      Page: {getCurrentPageDimensions().size} {getCurrentPageDimensions().orientation}
                    </p>
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
                  </div>
                ) : (
                  formPages[currentPageIndex].fields.map((field: FormField) => (
                    <ResizableWrapper 
                      key={field.id}
                      fieldId={field.id}
                      onUpdateSize={updateFieldSize}
                      onUpdatePosition={updateFieldPosition}
                      field={field}
                      isSelected={selectedField?.id === field.id}
                      onSelect={() => setSelectedField(field)}
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
                        onChange={(e) => updateFieldSettings(selectedField.id, { rows: parseInt(e.target.value) || 3 })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Columns</label>
                      <Input
                        type="number"
                        value={selectedField.settings.columns || 3}
                        onChange={(e) => updateFieldSettings(selectedField.id, { columns: parseInt(e.target.value) || 3 })}
                        className="input-ai bg-dark-800/50 border-ai-blue/30 text-white"
                      />
                    </div>
                  </div>
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a field to view and edit its settings</p>
            </div>
          )}
          
          {/* Field movement controls */}
          <div className="pt-4 border-t border-dark-700/50">
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
      {showFormPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-full h-full bg-white flex flex-col">
            {/* Preview Header */}
            <div className="bg-gray-100 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Form Preview</h2>
                <div className="text-sm text-gray-600">
                  Page {currentPageIndex + 1} of {formPages.length} • {getCurrentPageDimensions().width}×{getCurrentPageDimensions().height}px ({getCurrentPageDimensions().size} {getCurrentPageDimensions().orientation})
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Page Navigation */}
                <button
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
                >
                  <RiArrowLeftLine />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPageIndex(Math.min(formPages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex === formPages.length - 1}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
                >
                  Next
                  <RiArrowRightLine />
                </button>
                
                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <RiPrinterLine />
                  Print
                </button>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowFormPreview(false)}
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <RiCloseLine />
                  Close
                </button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-gray-50 p-8">
              <div className="flex justify-center">
                <div 
                  className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none"
                  style={{
                    width: `${getCurrentPageDimensions().width}px`,
                    minHeight: `${getCurrentPageDimensions().height}px`,
                  }}
                >
                  {/* Print-ready content */}
                  <div className="relative w-full h-full p-6" style={{ minHeight: `${getCurrentPageDimensions().height - 48}px` }}>
                    {formPages[currentPageIndex].fields.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <RiFileTextLine className="text-6xl mb-4 mx-auto" />
                          <p className="text-lg">No fields added to this page</p>
                          <p className="text-sm mt-2">Add form fields to see the preview</p>
                        </div>
                      </div>
                    ) : (
                      formPages[currentPageIndex].fields.map((field: FormField) => (
                        <div 
                          key={field.id}
                          className="absolute"
                          style={{ 
                            left: field.x || 0,
                            top: field.y || 0,
                            width: field.width || 200,
                            height: field.height || 40,
                          }}
                        >
                          <div className="w-full h-full bg-white border border-gray-200 rounded">
                            {renderWidgetPreview(field)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview Footer */}
            <div className="bg-gray-100 border-t border-gray-300 px-6 py-3 flex items-center justify-between print:hidden">
              <div className="text-sm text-gray-600">
                {formPages[currentPageIndex].fields.length} field{formPages[currentPageIndex].fields.length !== 1 ? 's' : ''} on this page
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Zoom: 100%
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Page:</span>
                  <select 
                    value={currentPageIndex}
                    onChange={(e) => setCurrentPageIndex(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {formPages.map((_, index) => (
                      <option key={index} value={index}>
                        {index + 1}
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
      <style jsx>{`
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 z-50">
            <motion.div
              className="w-full h-full max-w-none max-h-none overflow-auto"
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