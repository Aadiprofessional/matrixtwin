import { jsPDF } from 'jspdf';
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