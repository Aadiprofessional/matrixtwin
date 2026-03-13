import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

interface FormField {
  label: string;
  value: string | string[] | boolean;
  type?: string;
}

export const generateFormPdf = async (
  title: string,
  description: string,
  fields: FormField[],
  projectName?: string,
  submittedBy?: string
): Promise<File> => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Add description
  doc.setFontSize(12);
  doc.text(description, 20, 30);
  
  // Add project and submitter info
  if (projectName) {
    doc.text(`Project: ${projectName}`, 20, 40);
  }
  if (submittedBy) {
    doc.text(`Submitted by: ${submittedBy}`, 20, 45);
  }
  
  // Add date
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
  
  // Add form fields
  const tableData = fields
    .filter(field => field.value !== undefined && field.value !== '')
    .map(field => [
      field.label,
      typeof field.value === 'boolean'
        ? field.value ? 'Yes' : 'No'
        : Array.isArray(field.value)
        ? field.value.join(', ')
        : field.value.toString()
    ]);
  
  (doc as any).autoTable({
    startY: 60,
    head: [['Field', 'Value']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Convert to blob
  const pdfBlob = doc.output('blob');
  
  // Create file
  return new File([pdfBlob], `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`, {
    type: 'application/pdf'
  });
};

export const exportReportElementToSinglePagePdf = async (
  reportElement: HTMLDivElement,
  fileName: string
): Promise<void> => {
  const exportContainer = document.createElement('div');
  const clonedContent = reportElement.cloneNode(true) as HTMLDivElement;
  exportContainer.style.position = 'fixed';
  exportContainer.style.left = '-100000px';
  exportContainer.style.top = '0';
  exportContainer.style.width = `${reportElement.scrollWidth}px`;
  exportContainer.style.padding = '0';
  exportContainer.style.margin = '0';
  exportContainer.style.borderRadius = '0';
  exportContainer.style.overflow = 'visible';
  exportContainer.style.background = '#ffffff';
  clonedContent.style.margin = '0';
  clonedContent.style.borderRadius = '0';
  clonedContent.style.overflow = 'visible';
  clonedContent.style.background = '#ffffff';
  clonedContent.querySelectorAll<HTMLElement>('*').forEach((node) => {
    const radius = window.getComputedStyle(node).borderRadius;
    if (radius && radius !== '0px') {
      node.style.borderRadius = '0';
    }
  });
  exportContainer.appendChild(clonedContent);
  document.body.appendChild(exportContainer);

  try {
    const sourceCanvases = Array.from(reportElement.querySelectorAll('canvas'));
    const targetCanvases = Array.from(clonedContent.querySelectorAll('canvas'));
    sourceCanvases.forEach((sourceCanvas, index) => {
      const targetCanvas = targetCanvases[index];
      if (!targetCanvas) return;
      try {
        const img = document.createElement('img');
        img.src = sourceCanvas.toDataURL('image/png');
        img.className = targetCanvas.className;
        const style = window.getComputedStyle(targetCanvas);
        img.style.width = style.width;
        img.style.height = style.height;
        img.style.display = style.display;
        img.style.maxWidth = style.maxWidth;
        img.style.maxHeight = style.maxHeight;
        img.style.objectFit = 'contain';
        targetCanvas.replaceWith(img);
      } catch {
        return;
      }
    });

    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    pdf.save(fileName);
  } finally {
    document.body.removeChild(exportContainer);
  }
};

export const exportReportElementsToPdfPages = async (
  reportElements: HTMLElement[],
  fileName: string
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let index = 0; index < reportElements.length; index += 1) {
    const element = reportElements[index];
    const exportContainer = document.createElement('div');
    const clonedContent = element.cloneNode(true) as HTMLElement;

    exportContainer.style.position = 'fixed';
    exportContainer.style.left = '-100000px';
    exportContainer.style.top = '0';
    exportContainer.style.width = `${element.scrollWidth}px`;
    exportContainer.style.padding = '0';
    exportContainer.style.margin = '0';
    exportContainer.style.borderRadius = '0';
    exportContainer.style.overflow = 'visible';
    exportContainer.style.background = '#ffffff';

    clonedContent.style.margin = '0';
    clonedContent.style.borderRadius = '0';
    clonedContent.style.overflow = 'visible';
    clonedContent.style.background = '#ffffff';

    clonedContent.querySelectorAll<HTMLElement>('*').forEach((node) => {
      const radius = window.getComputedStyle(node).borderRadius;
      if (radius && radius !== '0px') {
        node.style.borderRadius = '0';
      }
    });

    exportContainer.appendChild(clonedContent);
    document.body.appendChild(exportContainer);

    try {
      const sourceCanvases = Array.from(element.querySelectorAll('canvas'));
      const targetCanvases = Array.from(clonedContent.querySelectorAll('canvas'));
      sourceCanvases.forEach((sourceCanvas, canvasIndex) => {
        const targetCanvas = targetCanvases[canvasIndex];
        if (!targetCanvas) return;
        try {
          const img = document.createElement('img');
          img.src = sourceCanvas.toDataURL('image/png');
          img.className = targetCanvas.className;
          const style = window.getComputedStyle(targetCanvas);
          img.style.width = style.width;
          img.style.height = style.height;
          img.style.display = style.display;
          img.style.maxWidth = style.maxWidth;
          img.style.maxHeight = style.maxHeight;
          img.style.objectFit = 'contain';
          targetCanvas.replaceWith(img);
        } catch {
          return;
        }
      });

      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imageData = canvas.toDataURL('image/png');
      if (index > 0) pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } finally {
      document.body.removeChild(exportContainer);
    }
  }

  pdf.save(fileName);
};
