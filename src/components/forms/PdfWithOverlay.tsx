import React, { useRef, useState, useEffect } from 'react';
import { Document, Page as PdfPage, pdfjs } from 'react-pdf';
import { RiLoader4Line } from 'react-icons/ri';

// Set worker source for react-pdf if not already set
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface ExtractedCell {
  text: string;
  row: number;
  col: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

interface ExtractedTable {
  pageIndex: number;
  cells: ExtractedCell[];
  rowCount: number;
  colCount: number;
  pageWidth: number;
  pageHeight: number;
}

interface PdfWithOverlayProps {
  file: File | null;
  pageNumber: number;
  extractedTable?: ExtractedTable;
  width?: number; // Optional forced width
}

export const PdfWithOverlay: React.FC<PdfWithOverlayProps> = ({ 
  file, 
  pageNumber, 
  extractedTable,
  width
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    if (width) {
      setContainerWidth(width);
    } else if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - 32); // Subtract padding
    }
    
    // Resize observer to handle window resizing
    const resizeObserver = new ResizeObserver(entries => {
      if (!width && entries[0]) {
        setContainerWidth(entries[0].contentRect.width - 32);
      }
    });

    if (containerRef.current && !width) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [width]);

  if (!file) return null;

  return (
    <div ref={containerRef} className="relative w-full flex justify-center">
      <div className="relative shadow-lg" style={{ width: containerWidth }}>
        <Document
          file={file}
          loading={
            <div className="p-10 flex items-center justify-center gap-2 text-gray-500">
              <RiLoader4Line className="animate-spin"/> Loading PDF...
            </div>
          }
          error={
            <div className="p-10 text-center text-red-500">
              Failed to load PDF.
            </div>
          }
        >
          <PdfPage 
            pageNumber={pageNumber} 
            width={containerWidth} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            error={
              <div className="p-10 text-center text-red-500">
                Failed to load page {pageNumber}.
              </div>
            }
          />
        </Document>
        
        {/* Overlay extracted text */}
        {extractedTable && extractedTable.cells.map((cell, idx) => {
          // Calculate scale based on the rendered width vs original page width
          // If extractedTable.pageWidth is missing (legacy), fallback to 1 (might be wrong)
          const pageWidth = extractedTable.pageWidth || 1; 
          const scaleX = pageWidth > 1 ? containerWidth / pageWidth : 1;
          const scaleY = scaleX; // Assume uniform scaling

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
    </div>
  );
};
