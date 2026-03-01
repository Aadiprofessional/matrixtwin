import React, { useState, useRef, useEffect } from 'react';
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import { createWorker } from 'tesseract.js';
import { Button } from '../ui/Button';
import { RiUploadCloud2Line, RiFilePdfLine, RiTableLine, RiCheckLine, RiCloseLine, RiLoader4Line } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

// Set worker source for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface ExtractedCell {
  text: string;
  row: number;
  col: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface ExtractedTable {
  pageIndex: number;
  cells: ExtractedCell[];
  rowCount: number;
  colCount: number;
  pageWidth: number; // Width of the PDF page in points/pixels
  pageHeight: number; // Height of the PDF page in points/pixels
}

interface PdfToFormImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tables: ExtractedTable[], file: File) => void;
}

export const PdfToFormImporter: React.FC<PdfToFormImporterProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedTables, setExtractedTables] = useState<ExtractedTable[]>([]);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Ref for the container to measure available width
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - 48); // Subtract padding
    }
  }, [containerRef.current, isOpen]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setSelectedPages([]);
      setExtractedTables([]);
      setPreviewPage(1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Auto-select first page by default
    setSelectedPages([1]);
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  const extractTableFromPage = async (pageNumber: number, pdfDocument: any): Promise<ExtractedTable> => {
    // This is a simplified table extraction. 
    // In a real implementation, we would render the page to a canvas, 
    // then use Tesseract to get words and their bounding boxes.
    
    // 1. Render page to canvas
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    if (context) {
        await page.render({ canvasContext: context, viewport }).promise;
    }
    
    // 2. OCR with Tesseract
    console.log(`Starting OCR for page ${pageNumber}...`);
    const worker = await createWorker('eng');
    const result = await worker.recognize(canvas);
    console.log('OCR Result:', result);
    const data = result.data;
    const words = (data && (data as any).words) ? Array.from((data as any).words) : [];
    console.log(`Extracted ${words.length} words from page ${pageNumber}`);
    await worker.terminate();

    // 3. Heuristic Table Detection
    // Group words into rows based on Y coordinate (with some tolerance)
    const sortedWords = words.length > 0 ? [...words].sort((a: any, b: any) => {
      if (!a.bbox || !b.bbox) return 0;
      return a.bbox.y0 - b.bbox.y0;
    }) : [];
    const rows: any[][] = [];
    let currentRow: any[] = [];
    let lastY = -1;
    const yTolerance = 10; // pixels

    sortedWords.forEach((word: any) => {
      if (lastY === -1 || Math.abs(word.bbox.y0 - lastY) < yTolerance) {
        currentRow.push(word);
      } else {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [word];
      }
      lastY = word.bbox.y0;
    });
    if (currentRow.length > 0) rows.push(currentRow);

    // Sort words in each row by X coordinate
    rows.forEach(row => row.sort((a: any, b: any) => {
      if (!a.bbox || !b.bbox) return 0;
      return a.bbox.x0 - b.bbox.x0;
    }));

    // Determine columns (simplified: just use relative order for now, 
    // a robust solution would analyze x-overlaps across rows)
    const cells: ExtractedCell[] = [];
    let maxCols = 0;

    rows.forEach((rowWords, rowIndex) => {
      // Simple clustering for columns within a row
      // If words are close, treat as one cell. If gap is large, new cell.
      let currentCellWords: any[] = [];
      let colIndex = 0;
      let lastX = -1;
      const xGapThreshold = 50; // pixels

      rowWords.forEach((word: any) => {
        if (lastX === -1 || (word.bbox.x0 - lastX) < xGapThreshold) {
          currentCellWords.push(word.text);
        } else {
          // Commit previous cell
          if (currentCellWords.length > 0) {
            cells.push({
              text: currentCellWords.join(' '),
              row: rowIndex,
              col: colIndex,
              bbox: { // simplified bbox
                 x0: rowWords[0].bbox.x0,
                 y0: rowWords[0].bbox.y0,
                 x1: rowWords[rowWords.length-1].bbox.x1,
                 y1: rowWords[rowWords.length-1].bbox.y1
              }
            });
            colIndex++;
          }
          currentCellWords = [word.text];
        }
        lastX = word.bbox.x1;
      });
      
      // Commit last cell of row
      if (currentCellWords.length > 0) {
        cells.push({
          text: currentCellWords.join(' '),
          row: rowIndex,
          col: colIndex,
          bbox: { // simplified bbox
             x0: rowWords[0].bbox.x0,
             y0: rowWords[0].bbox.y0,
             x1: rowWords[rowWords.length-1].bbox.x1,
             y1: rowWords[rowWords.length-1].bbox.y1
          }
        });
        colIndex++;
      }
      if (colIndex > maxCols) maxCols = colIndex;
    });

    return {
      pageIndex: pageNumber,
      cells,
      rowCount: rows.length,
      colCount: maxCols,
      pageWidth: viewport.width,
      pageHeight: viewport.height
    };
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    const tables: ExtractedTable[] = [];
    
    try {
      // We need to load the document using pdfjs API directly for page access in loop
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocument = await pdfjs.getDocument(arrayBuffer).promise;

      for (let i = 0; i < selectedPages.length; i++) {
        const pageNum = selectedPages[i];
        setProgress(Math.round(((i) / selectedPages.length) * 100));
        
        const table = await extractTableFromPage(pageNum, pdfDocument);
        tables.push(table);
      }
      
      setExtractedTables(tables);
      setProgress(100);
    } catch (error) {
      console.error("Extraction failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (file) {
      onImport(extractedTables, file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <RiFilePdfLine className="text-red-500 text-2xl" />
              Import Form from PDF
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
              <RiCloseLine className="text-2xl" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Upload & Controls */}
            <div className="w-1/3 border-r border-gray-200 p-6 flex flex-col gap-6 bg-white overflow-y-auto">
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={onFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <RiUploadCloud2Line className="text-gray-400 mb-4 text-5xl" />
                  <p className="text-lg font-medium text-gray-700">Click or Drag PDF here</p>
                  <p className="text-sm text-gray-500 mt-2">Upload a PDF containing tables to extract</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <RiFilePdfLine className="text-blue-500 text-2xl" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{numPages} pages</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-sm text-blue-600 hover:underline">Change</button>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Select Pages to Extract</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            togglePageSelection(pageNum);
                            setPreviewPage(pageNum);
                          }}
                          className={`p-2 text-sm rounded border ${
                            selectedPages.includes(pageNum)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                  </div>

                  {extractedTables.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <RiCheckLine />
                        Extraction Complete
                      </div>
                      <p className="text-sm text-green-600">
                        Found {extractedTables.reduce((acc, t) => acc + t.cells.length, 0)} cells across {extractedTables.length} pages.
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex flex-col gap-3">
                    <Button 
                      variant="primary" 
                      onClick={handleExtract}
                      disabled={selectedPages.length === 0 || isProcessing}
                      className="w-full justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <RiLoader4Line className="animate-spin mr-2" />
                          Extracting ({progress}%)
                        </>
                      ) : (
                        <>
                          <RiTableLine className="mr-2" />
                          Extract Tables
                        </>
                      )}
                    </Button>
                    
                    {extractedTables.length > 0 && (
                      <Button 
                        variant="primary" 
                        onClick={handleImport}
                        className="w-full justify-center bg-green-600 hover:bg-green-700 text-white border-none"
                      >
                         Import to Form
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right Panel: Preview */}
            <div ref={containerRef} className="w-2/3 bg-gray-100 p-6 overflow-y-auto flex justify-center relative">
               {file && (
                 <div className="relative shadow-lg" style={{ width: containerWidth }}>
                   <Document
                     file={file}
                     onLoadSuccess={onDocumentLoadSuccess}
                     loading={<div className="p-10 flex items-center gap-2"><RiLoader4Line className="animate-spin"/> Loading PDF...</div>}
                   >
                     <PdfPage 
                       pageNumber={previewPage} 
                       width={containerWidth} 
                       renderTextLayer={false}
                       renderAnnotationLayer={false}
                     />
                   </Document>
                   
                   {/* Overlay extracted text */}
                   {extractedTables.find(t => t.pageIndex === previewPage)?.cells.map((cell, idx) => {
                     const table = extractedTables.find(t => t.pageIndex === previewPage);
                     const scaleX = table ? containerWidth / table.pageWidth : 1;
                     const scaleY = table ? (containerWidth / table.pageWidth) : 1; // Assuming uniform scaling

                     return (
                       <div
                         key={idx}
                         className="absolute bg-yellow-300/30 border border-yellow-500/50 hover:bg-yellow-300/60 transition-colors group cursor-help"
                         style={{
                           left: `${cell.bbox.x0 * scaleX}px`,
                           top: `${cell.bbox.y0 * scaleY}px`,
                           width: `${(cell.bbox.x1 - cell.bbox.x0) * scaleX}px`,
                           height: `${(cell.bbox.y1 - cell.bbox.y0) * scaleY}px`,
                         }}
                         title={`Row: ${cell.row}, Col: ${cell.col}\nText: ${cell.text}`}
                       >
                         <span className="absolute -top-6 left-0 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                           {cell.text}
                         </span>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
