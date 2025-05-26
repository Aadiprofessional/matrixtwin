import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconContext } from 'react-icons';
import { 
  RiCalendarLine, 
  RiUserLine, 
  RiFileTextLine, 
  RiAddLine, 
  RiDeleteBin6Line,
  RiDownload2Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiFilePdf2Line,
  RiCheckLine,
  RiCloseLine,
  RiPrinterLine
} from 'react-icons/ri';

interface SafetyInspectionChecklistTemplateProps {
  onClose: () => void;
  onSave: (formData: any) => void;
}

interface ChecklistItemProps {
  id: string;
  description: string;
  items: Array<{ id: string; description: string }>;
}

export const SafetyInspectionChecklistTemplate: React.FC<SafetyInspectionChecklistTemplateProps> = ({
  onClose,
  onSave
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState({
    // Common header data
    contractNo: '',
    contractTitle: '',
    date: '',
    time: '',
    
    // Environmental Photo Record data
    photoRecords: [
      {
        id: '1',
        location: '',
        finding: '',
        action: '',
        beforePhoto: null,
        afterPhoto: null
      },
      {
        id: '2',
        location: '',
        finding: '',
        action: '',
        beforePhoto: null,
        afterPhoto: null
      },
      {
        id: '3',
        location: '',
        finding: '',
        action: '',
        beforePhoto: null,
        afterPhoto: null
      },
      {
        id: '4',
        location: '',
        finding: '',
        action: '',
        beforePhoto: null,
        afterPhoto: null
      }
    ],
    
    // Photo record footer
    recordName: '',
    recordDate: '',
  });
  
  // Photo record table items - adding for pages 3-4
  const [photoTableItems, setPhotoTableItems] = useState<Array<{
    id: string;
    description: string;
    agreedDate: string;
    dateCompleted: string;
    rectificationStatus: string;
  }>>([
    {
      id: '1',
      description: '',
      agreedDate: '',
      dateCompleted: '',
      rectificationStatus: ''
    }
  ]);
  
  // Photo record table responses
  const [photoResponses, setPhotoResponses] = useState<Record<string, string>>({});
  
  // Initial checklist data - structured to match the 4 pages from the images
  const [checklistItems, setChecklistItems] = useState<ChecklistItemProps[]>([
    // Page 1 - Main categories (items 1-12)
    { 
      id: '1', 
      description: 'General', 
      items: [{ id: '1.1', description: '' }] 
    },
    { 
      id: '2', 
      description: 'Flammable Liquids/Gases', 
      items: [{ id: '2.1', description: '' }] 
    },
    { 
      id: '3', 
      description: 'Hazardous Substances', 
      items: [{ id: '3.1', description: '' }] 
    },
    { 
      id: '4', 
      description: 'Electricity', 
      items: [{ id: '4.1', description: '' }] 
    },
    { 
      id: '5', 
      description: 'Fire Precaution', 
      items: [{ id: '5.1', description: '' }] 
    },
    { 
      id: '6', 
      description: 'Working Area', 
      items: [{ id: '6.1', description: '' }] 
    },
    { 
      id: '7', 
      description: 'Lifting Operation', 
      items: [{ id: '7.1', description: '' }] 
    },
    { 
      id: '8', 
      description: 'Material Hoist', 
      items: [{ id: '8.1', description: '' }] 
    },
    { 
      id: '9', 
      description: 'Confined Spaces', 
      items: [{ id: '9.1', description: '' }] 
    },
    { 
      id: '10', 
      description: 'Noise', 
      items: [{ id: '10.1', description: '' }] 
    },
    { 
      id: '11', 
      description: 'Gas Welding and Cutting Equipment', 
      items: [{ id: '11.1', description: '' }] 
    },
    { 
      id: '12', 
      description: 'Electricity-arc Welding', 
      items: [{ id: '12.1', description: '' }] 
    },
    
    // Page 2 - Additional categories (items 13-25)
    { 
      id: '13', 
      description: 'Mechanical Plant and Equipment', 
      items: [{ id: '13.1', description: '' }] 
    },
    { 
      id: '14', 
      description: 'Tunnel', 
      items: [{ id: '14.1', description: '' }] 
    },
    { 
      id: '15', 
      description: 'Formwork', 
      items: [{ id: '15.1', description: '' }] 
    },
    { 
      id: '16', 
      description: 'Hoarding', 
      items: [{ id: '16.1', description: '' }] 
    },
    { 
      id: '17', 
      description: 'Working at Height', 
      items: [{ id: '17.1', description: '' }] 
    },
    { 
      id: '18', 
      description: 'Abrasive Wheels', 
      items: [{ id: '18.1', description: '' }] 
    },
    { 
      id: '19', 
      description: 'Excavations', 
      items: [{ id: '19.1', description: '' }] 
    },
    { 
      id: '20', 
      description: 'Slings and other Lifting Gears', 
      items: [{ id: '20.1', description: '' }] 
    },
    { 
      id: '21', 
      description: 'Compressed Air/Pneumatic Air Tools', 
      items: [{ id: '21.1', description: '' }] 
    },
    { 
      id: '22', 
      description: 'Protection of the Public', 
      items: [{ id: '22.1', description: '' }] 
    },
    { 
      id: '23', 
      description: 'Prevention of Mosquito Breed', 
      items: [{ id: '23.1', description: '' }] 
    },
    { 
      id: '24', 
      description: 'Work Over Water', 
      items: [{ id: '24.1', description: '' }] 
    },
    { 
      id: '25', 
      description: 'Welfare Facilities', 
      items: [{ id: '25.1', description: '' }] 
    },
  ]);
  
  // State for checklist responses
  const [responses, setResponses] = useState<Record<string, Record<string, string>>>({});
  
  // State for checklist dates and status
  const [checklistDates, setChecklistDates] = useState<Record<string, Record<string, {
    agreedDate: string;
    dateCompleted: string;
    rectificationStatus: string;
  }>>>({});
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handlePhotoRecordChange = (index: number, field: string, value: string) => {
    const updatedRecords = [...formData.photoRecords];
    updatedRecords[index] = { ...updatedRecords[index], [field]: value };
    setFormData({
      ...formData,
      photoRecords: updatedRecords
    });
  };
  
  const handleAddItem = (categoryId: string) => {
    setChecklistItems(prevItems => {
      return prevItems.map(category => {
        if (category.id === categoryId) {
          const lastItem = category.items[category.items.length - 1];
          const lastItemIdParts = lastItem.id.split('.');
          const newItemId = `${lastItemIdParts[0]}.${Number(lastItemIdParts[1]) + 1}`;
          
          return {
            ...category,
            items: [...category.items, { id: newItemId, description: '' }]
          };
        }
        return category;
      });
    });
  };
  
  const handleRemoveItem = (categoryId: string, itemId: string) => {
    setChecklistItems(prevItems => {
      return prevItems.map(category => {
        if (category.id === categoryId) {
          if (category.items.length <= 1) return category;
          
          return {
            ...category,
            items: category.items.filter(item => item.id !== itemId)
          };
        }
        return category;
      });
    });
  };
  
  const handleItemDescriptionChange = (categoryId: string, itemId: string, description: string) => {
    setChecklistItems(prevItems => {
      return prevItems.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map(item => {
              if (item.id === itemId) {
                return { ...item, description };
              }
              return item;
            })
          };
        }
        return category;
      });
    });
  };
  
  const handleResponseChange = (categoryId: string, itemId: string, status: string) => {
    setResponses(prev => {
      const categoryResponses = prev[categoryId] || {};
      
      return {
        ...prev,
        [categoryId]: {
          ...categoryResponses,
          [itemId]: status
        }
      };
    });
  };
  
  const handleChecklistDateChange = (categoryId: string, itemId: string, field: string, value: string) => {
    setChecklistDates(prev => {
      const categoryDates = prev[categoryId] || {};
      const itemDates = categoryDates[itemId] || { agreedDate: '', dateCompleted: '', rectificationStatus: '' };
      
      return {
        ...prev,
        [categoryId]: {
          ...categoryDates,
          [itemId]: {
            ...itemDates,
            [field]: value
          }
        }
      };
    });
  };
  
  const handleAddPhotoRecord = () => {
    const newRecord = {
      id: `${formData.photoRecords.length + 1}`,
      location: '',
      finding: '',
      action: '',
      beforePhoto: null,
      afterPhoto: null
    };
    
    setFormData({
      ...formData,
      photoRecords: [...formData.photoRecords, newRecord]
    });
  };
  
  const handleRemovePhotoRecord = (index: number) => {
    if (formData.photoRecords.length <= 1) return;
    
    const updatedRecords = formData.photoRecords.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      photoRecords: updatedRecords
    });
  };
  
  // Handlers for photo table items
  const handleAddPhotoTableItem = () => {
    const lastItem = photoTableItems[photoTableItems.length - 1];
    const newId = String(Number(lastItem.id) + 1);
    
    setPhotoTableItems([
      ...photoTableItems, 
      {
        id: newId,
        description: '',
        agreedDate: '',
        dateCompleted: '',
        rectificationStatus: ''
      }
    ]);
  };
  
  const handleRemovePhotoTableItem = (itemId: string) => {
    if (photoTableItems.length <= 1) return;
    
    setPhotoTableItems(photoTableItems.filter(item => item.id !== itemId));
  };
  
  const handlePhotoTableItemChange = (itemId: string, field: string, value: string) => {
    setPhotoTableItems(photoTableItems.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };
  
  const handlePhotoResponseChange = (itemId: string, status: string) => {
    setPhotoResponses({
      ...photoResponses,
      [itemId]: status
    });
  };
  
  const handleSave = () => {
    const completeFormData = {
      ...formData,
      checklistItems,
      responses,
      checklistDates,
      photoTableItems,
      photoResponses
    };
    onSave(completeFormData);
  };
  
  const changePage = (pageNumber: 1 | 2 | 3 | 4) => {
    setCurrentPage(pageNumber);
  };
  
  const handleFileUpload = (recordIndex: number, type: 'before' | 'after', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target) {
          const updatedRecords = [...formData.photoRecords];
          const fieldName = type === 'before' ? 'beforePhoto' : 'afterPhoto';
          
          updatedRecords[recordIndex] = { 
            ...updatedRecords[recordIndex],
            [fieldName]: event.target.result 
          };
          
          setFormData({
            ...formData,
            photoRecords: updatedRecords
          });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleDownloadPDF = () => {
    // In a production environment, you would use a proper PDF library like jsPDF
    // For this demo, we'll use the browser's print functionality
    
    // First hide elements that shouldn't be in the print
    const originalContent = document.body.innerHTML;
    
    // Create a temporary div to hold our printable content
    const printContent = document.createElement('div');
    printContent.className = 'print-content';
    printContent.style.cssText = 'width: 100%; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;';
    
    // Create header section for all pages
    const createHeader = (title: string): HTMLDivElement => {
      const header = document.createElement('div');
      header.style.cssText = 'text-align: center; margin-bottom: 20px;';
      
      const titleEl = document.createElement('h1');
      titleEl.textContent = title;
      titleEl.style.cssText = 'font-size: 18px; margin-bottom: 5px;';
      
      const subtitleEl = document.createElement('h2');
      subtitleEl.textContent = 'Weekly Site Safety Inspection Checklist';
      subtitleEl.style.cssText = 'font-size: 16px; margin-bottom: 15px;';
      
      const infoGrid = document.createElement('div');
      infoGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; margin-bottom: 20px;';
      
      const contractNoEl = document.createElement('div');
      contractNoEl.innerHTML = `<span style="font-weight: bold;">Contract No.:</span> ${formData.contractNo}`;
      
      const dateEl = document.createElement('div');
      dateEl.innerHTML = `<span style="font-weight: bold;">Date:</span> ${formData.date}`;
      
      const titleContractEl = document.createElement('div');
      titleContractEl.innerHTML = `<span style="font-weight: bold;">Contract Title:</span> ${formData.contractTitle}`;
      
      const timeEl = document.createElement('div');
      timeEl.innerHTML = `<span style="font-weight: bold;">Time:</span> ${formData.time}`;
      
      infoGrid.appendChild(contractNoEl);
      infoGrid.appendChild(dateEl);
      infoGrid.appendChild(titleContractEl);
      infoGrid.appendChild(timeEl);
      
      header.appendChild(titleEl);
      header.appendChild(subtitleEl);
      header.appendChild(infoGrid);
      
      return header;
    };
    
    // Create the table for checklist or photo record
    const createTable = (headers: string[], rows: any[]): HTMLTableElement => {
      const table = document.createElement('table');
      table.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 20px;';
      
      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.cssText = 'background-color: #f2f2f2;';
      
      headers.forEach((header: string) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.cssText = 'border: 1px solid #000; padding: 8px; text-align: center;';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create table body
      const tbody = document.createElement('tbody');
      
      rows.forEach((row: any[]) => {
        const tr = document.createElement('tr');
        
        row.forEach((cell: any, index: number) => {
          const td = document.createElement('td');
          if (typeof cell === 'object' && cell !== null) {
            // Handle special case for category rows
            if (cell.isCategory) {
              td.colSpan = 8;
              td.style.cssText = 'border: 1px solid #000; padding: 8px; background-color: #e6e6e6; font-weight: bold;';
              td.textContent = cell.content;
            }
          } else {
            td.style.cssText = 'border: 1px solid #000; padding: 8px; text-align: ' + (index === 1 ? 'left' : 'center') + ';';
            td.textContent = cell;
          }
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      return table;
    };
    
    // Create a photo record section
    const createPhotoRecord = (record: any, index: number): HTMLDivElement => {
      const section = document.createElement('div');
      section.style.cssText = 'margin-bottom: 30px; page-break-inside: avoid;';
      
      // Row for item numbers
      const topRow = document.createElement('table');
      topRow.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 1px;';
      topRow.innerHTML = `
        <tr>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 30%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
          <td style="border: 1px solid #000; width: 10%;"></td>
        </tr>
      `;
      section.appendChild(topRow);
      
      // Photos section
      const photoTable = document.createElement('table');
      photoTable.style.cssText = 'width: 100%; border-collapse: collapse;';
      
      // Photo headers
      const photoHeaderRow = document.createElement('tr');
      
      const beforeHeader = document.createElement('td');
      beforeHeader.textContent = 'Photo (Before)';
      beforeHeader.style.cssText = 'border: 1px solid #000; padding: 8px; text-align: center; width: 50%;';
      beforeHeader.colSpan = 4;
      
      const afterHeader = document.createElement('td');
      afterHeader.textContent = 'Photo (After)';
      afterHeader.style.cssText = 'border: 1px solid #000; padding: 8px; text-align: center; width: 50%;';
      afterHeader.colSpan = 4;
      
      photoHeaderRow.appendChild(beforeHeader);
      photoHeaderRow.appendChild(afterHeader);
      
      // Photo content
      const photoContentRow = document.createElement('tr');
      
      const beforeCell = document.createElement('td');
      beforeCell.style.cssText = 'border: 1px solid #000; border-right: none; padding: 15px; width: 50%; vertical-align: top;';
      beforeCell.colSpan = 4;
      
      if (record.beforePhoto) {
        const beforeImg = document.createElement('img');
        beforeImg.src = record.beforePhoto as string;
        beforeImg.style.cssText = 'max-width: 100%; max-height: 150px; display: block; margin: 0 auto 15px auto;';
        beforeCell.appendChild(beforeImg);
      }
      
      const locationLabel = document.createElement('p');
      locationLabel.innerHTML = '<strong>Location:</strong>';
      locationLabel.style.cssText = 'margin: 5px 0;';
      
      const locationValue = document.createElement('p');
      locationValue.textContent = record.location;
      locationValue.style.cssText = 'margin: 5px 0 15px 0;';
      
      const findingLabel = document.createElement('p');
      findingLabel.innerHTML = '<strong>Finding:</strong>';
      findingLabel.style.cssText = 'margin: 5px 0;';
      
      const findingValue = document.createElement('p');
      findingValue.textContent = record.finding;
      findingValue.style.cssText = 'margin: 5px 0;';
      
      beforeCell.appendChild(locationLabel);
      beforeCell.appendChild(locationValue);
      beforeCell.appendChild(findingLabel);
      beforeCell.appendChild(findingValue);
      
      const afterCell = document.createElement('td');
      afterCell.style.cssText = 'border: 1px solid #000; border-left: none; padding: 15px; width: 50%; vertical-align: top;';
      afterCell.colSpan = 4;
      
      if (record.afterPhoto) {
        const afterImg = document.createElement('img');
        afterImg.src = record.afterPhoto as string;
        afterImg.style.cssText = 'max-width: 100%; max-height: 150px; display: block; margin: 0 auto 15px auto;';
        afterCell.appendChild(afterImg);
      }
      
      const actionLabel = document.createElement('p');
      actionLabel.innerHTML = '<strong>Following Action Taken:</strong>';
      actionLabel.style.cssText = 'margin: 5px 0;';
      
      const actionValue = document.createElement('p');
      actionValue.textContent = record.action;
      actionValue.style.cssText = 'margin: 5px 0;';
      
      afterCell.appendChild(actionLabel);
      afterCell.appendChild(actionValue);
      
      photoContentRow.appendChild(beforeCell);
      photoContentRow.appendChild(afterCell);
      
      photoTable.appendChild(photoHeaderRow);
      photoTable.appendChild(photoContentRow);
      
      section.appendChild(photoTable);
      
      return section;
    };
    
    // Create Page 1-2: Safety Inspection Checklist
    const page1 = document.createElement('div');
    page1.style.cssText = 'page-break-after: always;';
    page1.appendChild(createHeader('Safety Inspection Checklist'));
    
    // Add checklist table for page 1
    const checklistHeaders = ['Item No.', 'Item Description', 'Y', 'N', 'NA', 'Agreed date for completion', 'Date completed', 'Rectification Status'];
    const checklistRows1: any[] = [];
    
    checklistItems.slice(0, 12).forEach(category => {
      // Add category row
      checklistRows1.push([{ isCategory: true, content: `${category.id}. ${category.description}` }]);
      
      // Add item rows
      category.items.forEach(item => {
        checklistRows1.push([
          item.id,
          item.description,
          responses[category.id]?.[item.id] === 'Y' ? '✓' : '',
          responses[category.id]?.[item.id] === 'N' ? '✓' : '',
          responses[category.id]?.[item.id] === 'NA' ? '✓' : '',
          checklistDates[category.id]?.[item.id]?.agreedDate || '', // Agreed date
          checklistDates[category.id]?.[item.id]?.dateCompleted || '', // Date completed
          checklistDates[category.id]?.[item.id]?.rectificationStatus || ''  // Rectification Status
        ]);
      });
    });
    
    page1.appendChild(createTable(checklistHeaders, checklistRows1));
    page1.innerHTML += '<div style="text-align: right; font-size: 12px;">Page 1 of 2</div>';
    printContent.appendChild(page1);
    
    // Create Page 2: Safety Inspection Checklist (continued)
    const page2 = document.createElement('div');
    page2.style.cssText = 'page-break-after: always;';
    page2.appendChild(createHeader('Safety Inspection Checklist'));
    
    // Add checklist table for page 2
    const checklistRows2: any[] = [];
    
    checklistItems.slice(12, 25).forEach(category => {
      // Add category row
      checklistRows2.push([{ isCategory: true, content: `${category.id}. ${category.description}` }]);
      
      // Add item rows
      category.items.forEach(item => {
        checklistRows2.push([
          item.id,
          item.description,
          responses[category.id]?.[item.id] === 'Y' ? '✓' : '',
          responses[category.id]?.[item.id] === 'N' ? '✓' : '',
          responses[category.id]?.[item.id] === 'NA' ? '✓' : '',
          checklistDates[category.id]?.[item.id]?.agreedDate || '', // Agreed date
          checklistDates[category.id]?.[item.id]?.dateCompleted || '', // Date completed
          checklistDates[category.id]?.[item.id]?.rectificationStatus || ''  // Rectification Status
        ]);
      });
    });
    
    page2.appendChild(createTable(checklistHeaders, checklistRows2));
    page2.innerHTML += '<div style="margin-top: 10px; font-size: 12px;">Remarks: Y – Compliance, N – Generally in Compliance but improvement is required, NA – Not Applicable</div>';
    page2.innerHTML += '<div style="text-align: right; font-size: 12px;">Page 2 of 2</div>';
    printContent.appendChild(page2);
    
    // Create Page 3: Photo Record
    const page3 = document.createElement('div');
    page3.style.cssText = 'page-break-after: always;';
    page3.appendChild(createHeader('Safety Environmental Photo Record'));
    
    // Add photo table
    const photoTableRows = photoTableItems.map(item => [
      item.id,
      item.description,
      photoResponses[item.id] === 'Y' ? '✓' : '',
      photoResponses[item.id] === 'N' ? '✓' : '',
      photoResponses[item.id] === 'NA' ? '✓' : '',
      item.agreedDate,
      item.dateCompleted,
      item.rectificationStatus
    ]);
    
    page3.appendChild(createTable(checklistHeaders, photoTableRows));
    
    // Add photo records for page 3
    formData.photoRecords.slice(0, 2).forEach((record, index) => {
      page3.appendChild(createPhotoRecord(record, index));
    });
    
    page3.innerHTML += '<div style="text-align: right; font-size: 12px;">Page 1 of 2</div>';
    printContent.appendChild(page3);
    
    // Create Page 4: Photo Record (continued)
    const page4 = document.createElement('div');
    page4.appendChild(createHeader('Safety Environmental Photo Record'));
    
    // Add photo records for page 4
    formData.photoRecords.slice(2, 4).forEach((record, index) => {
      page4.appendChild(createPhotoRecord(record, index + 2));
    });
    
    // Add name and date at the bottom
    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;';
    
    const nameRow = document.createElement('div');
    nameRow.innerHTML = `<strong>Name:</strong> ${formData.recordName}`;
    nameRow.style.cssText = 'margin-bottom: 10px;';
    
    const dateRow = document.createElement('div');
    dateRow.innerHTML = `<strong>Date:</strong> ${formData.recordDate}`;
    
    footer.appendChild(nameRow);
    footer.appendChild(dateRow);
    
    page4.appendChild(footer);
    page4.innerHTML += '<div style="text-align: right; font-size: 12px;">Page 2 of 2</div>';
    printContent.appendChild(page4);
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    
    document.body.appendChild(printFrame);
    
    // Write content to the iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.write(`
        <html>
          <head>
            <title>Safety Inspection Checklist</title>
            <style>
              @media print {
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                @page { size: A4; margin: 20mm; }
                .page-break { page-break-after: always; }
              }
            </style>
          </head>
          <body>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      
      // Trigger print
      setTimeout(() => {
        if (printFrame.contentWindow) {
          printFrame.contentWindow.print();
          
          // Clean up after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        }
      }, 500);
    }
  };
  
  const getCategoryRange = () => {
    if (currentPage === 1) return [0, 12]; // Display first 12 items (0-indexed, so this means indices 0-11)
    if (currentPage === 2) return [12, 25]; // Display items 13-25 (indices 12-24)
    return [0, 0]; // Default, not used for pages 3-4
  };
  
  const getPhotoRecordsRange = () => {
    if (currentPage === 3) return [0, 2]; // Show first 2 photo records on page 3
    if (currentPage === 4) return [2, 4]; // Show last 2 photo records on page 4
    return [0, 0]; // Default, not used for pages 1-2
  };
  
  return (
    <div className="w-full max-w-[95vw] mx-auto bg-[#1e293b] rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-[#334155]">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <RiFileTextLine className="mr-2 text-blue-400" />
          {currentPage <= 2 ? "Safety Inspection Checklist" : "Safety Environmental Photo Record"}
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105"
          >
            <RiFilePdf2Line className="text-blue-400" />
            Download PDF
          </button>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(page => (
              <button
                key={`page-${page}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-[#334155] text-gray-200 hover:bg-[#475569]'}`}
                onClick={() => changePage(page as 1 | 2 | 3 | 4)}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            onClick={handleSave}
          >
            Save
            <RiCheckLine className="text-white" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 bg-[#f8fafc]">
        <div className="safety-inspection-checklist">
          {(currentPage === 1 || currentPage === 2) && (
            <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
              {/* Checklist Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Safety Inspection Checklist</h2>
                <h3 className="text-lg font-bold mb-4">Weekly Site Safety Inspection Checklist</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Contract No.:</span>
                    <input 
                      type="text" 
                      className="flex-1 border-b border-gray-400 outline-none bg-transparent" 
                      value={formData.contractNo}
                      onChange={(e) => handleInputChange('contractNo', e.target.value)}
                    />
                  </div>
                  <div></div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Contract Title:</span>
                    <input 
                      type="text" 
                      className="flex-1 border-b border-gray-400 outline-none bg-transparent" 
                      value={formData.contractTitle}
                      onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                    />
                  </div>
                  <div></div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Date:</span>
                    <input 
                      type="date" 
                      className="w-40 border-b border-gray-400 outline-none bg-transparent"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    <span className="font-semibold mx-4">Time:</span>
                    <input 
                      type="time" 
                      className="w-32 border-b border-gray-400 outline-none bg-transparent"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Checklist Table */}
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2 w-12 text-center">No.</th>
                    <th className="border border-gray-800 p-2 text-left">Item Description</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">Y</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">N</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">NA</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Agreed date for completion</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Date completed</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Rectification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItems
                    .filter((_, index) => 
                      currentPage === 1 ? index < 12 : index >= 12 && index < 25
                    )
                    .map((category) => (
                      <React.Fragment key={category.id}>
                        {/* Category row */}
                        <tr className="bg-gray-200">
                          <td className="border border-gray-800 p-2 text-center">{category.id}</td>
                          <td className="border border-gray-800 p-2 font-semibold" colSpan={7}>{category.description}</td>
                        </tr>
                        
                        {/* Item rows */}
                        {category.items.map((item) => (
                          <tr key={item.id}>
                            <td className="border border-gray-800 p-2 text-center">{item.id}</td>
                            <td className="border border-gray-800 p-2">
                              <div className="flex justify-between items-center">
                                <input 
                                  type="text" 
                                  className="w-full border-none outline-none bg-transparent"
                                  value={item.description}
                                  onChange={(e) => handleItemDescriptionChange(category.id, item.id, e.target.value)}
                                  placeholder="Insert item"
                                />
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleRemoveItem(category.id, item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <RiDeleteBin6Line className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleAddItem(category.id)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <RiAddLine className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="border border-gray-800 p-2 text-center">
                              <input 
                                type="radio" 
                                name={`response-${item.id}`}
                                checked={responses[category.id]?.[item.id] === 'Y'}
                                onChange={() => handleResponseChange(category.id, item.id, 'Y')}
                              />
                            </td>
                            <td className="border border-gray-800 p-2 text-center">
                              <input 
                                type="radio" 
                                name={`response-${item.id}`}
                                checked={responses[category.id]?.[item.id] === 'N'}
                                onChange={() => handleResponseChange(category.id, item.id, 'N')}
                              />
                            </td>
                            <td className="border border-gray-800 p-2 text-center">
                              <input 
                                type="radio" 
                                name={`response-${item.id}`}
                                checked={responses[category.id]?.[item.id] === 'NA'}
                                onChange={() => handleResponseChange(category.id, item.id, 'NA')}
                              />
                            </td>
                            <td className="border border-gray-800 p-2">
                              <input 
                                type="date" 
                                className="w-full border-none outline-none bg-transparent"
                                value={checklistDates[category.id]?.[item.id]?.agreedDate || ''}
                                onChange={(e) => handleChecklistDateChange(category.id, item.id, 'agreedDate', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-2">
                              <input 
                                type="date" 
                                className="w-full border-none outline-none bg-transparent"
                                value={checklistDates[category.id]?.[item.id]?.dateCompleted || ''}
                                onChange={(e) => handleChecklistDateChange(category.id, item.id, 'dateCompleted', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-2">
                              <input 
                                type="text" 
                                className="w-full border-none outline-none bg-transparent"
                                value={checklistDates[category.id]?.[item.id]?.rectificationStatus || ''}
                                onChange={(e) => handleChecklistDateChange(category.id, item.id, 'rectificationStatus', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
              
              {/* Footer Legend */}
              {currentPage === 2 && (
                <div className="mt-4 text-sm">
                  <p>Remarks: Y – Compliance, /N – Generally in Compliance but improvement is required, /NA – Not Applicable</p>
                </div>
              )}
            </div>
          )}
          
          {(currentPage === 3 || currentPage === 4) && (
            <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
              {/* Photo Record Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">Safety Environmental</h2>
                <h3 className="text-lg font-bold mb-4">Photo Record</h3>
                <h3 className="text-lg font-bold mb-4">Weekly Site Safety Inspection Checklist</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Date of Inspection:</span>
                    <input 
                      type="date" 
                      className="flex-1 border-b border-gray-400 outline-none bg-transparent" 
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Time:</span>
                    <input 
                      type="time" 
                      className="flex-1 border-b border-gray-400 outline-none bg-transparent" 
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Header Table */}
              <table className="w-full border-collapse border border-gray-800 mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2 w-12 text-center">Item No.</th>
                    <th className="border border-gray-800 p-2 text-left">Item Description</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">Y</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">N</th>
                    <th className="border border-gray-800 p-2 w-12 text-center">NA</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Agreed date for completion</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Date completed</th>
                    <th className="border border-gray-800 p-2 w-40 text-center">Rectification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {photoTableItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-800 p-2 text-center">{item.id}</td>
                      <td className="border border-gray-800 p-2">
                        <div className="flex justify-between items-center">
                          <input 
                            type="text" 
                            className="w-full border-none outline-none bg-transparent"
                            value={item.description}
                            onChange={(e) => handlePhotoTableItemChange(item.id, 'description', e.target.value)}
                            placeholder="Insert item"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleRemovePhotoTableItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <RiDeleteBin6Line className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleAddPhotoTableItem}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <RiAddLine className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-800 p-2 text-center">
                        <input 
                          type="radio" 
                          name={`photo-response-${item.id}`}
                          checked={photoResponses[item.id] === 'Y'}
                          onChange={() => handlePhotoResponseChange(item.id, 'Y')}
                        />
                      </td>
                      <td className="border border-gray-800 p-2 text-center">
                        <input 
                          type="radio" 
                          name={`photo-response-${item.id}`}
                          checked={photoResponses[item.id] === 'N'}
                          onChange={() => handlePhotoResponseChange(item.id, 'N')}
                        />
                      </td>
                      <td className="border border-gray-800 p-2 text-center">
                        <input 
                          type="radio" 
                          name={`photo-response-${item.id}`}
                          checked={photoResponses[item.id] === 'NA'}
                          onChange={() => handlePhotoResponseChange(item.id, 'NA')}
                        />
                      </td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          type="date" 
                          className="w-full border-none outline-none bg-transparent"
                          value={item.agreedDate}
                          onChange={(e) => handlePhotoTableItemChange(item.id, 'agreedDate', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          type="date" 
                          className="w-full border-none outline-none bg-transparent"
                          value={item.dateCompleted}
                          onChange={(e) => handlePhotoTableItemChange(item.id, 'dateCompleted', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none bg-transparent"
                          value={item.rectificationStatus}
                          onChange={(e) => handlePhotoTableItemChange(item.id, 'rectificationStatus', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Photo Records */}
              {formData.photoRecords.slice(...getPhotoRecordsRange()).map((record, index) => {
                // Calculate the actual record index based on the current page
                const actualIndex = index + (currentPage === 3 ? 0 : 2);
                return (
                <div key={record.id} className="mb-8">
                  {/* Top table row */}
                  <table className="w-full border-collapse border border-gray-800">
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 p-2 w-12"></td>
                        <td className="border border-gray-800 p-2"></td>
                        <td className="border border-gray-800 p-2 w-12"></td>
                        <td className="border border-gray-800 p-2 w-12"></td>
                        <td className="border border-gray-800 p-2 w-12"></td>
                        <td className="border border-gray-800 p-2"></td>
                        <td className="border border-gray-800 p-2"></td>
                        <td className="border border-gray-800 p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Photo Section */}
                  <table className="w-full border-collapse border border-gray-800">
                    <tbody>
                      <tr>
                        <td colSpan={4} className="border border-gray-800 p-2 text-center">Photo (Before)</td>
                        <td colSpan={4} className="border border-gray-800 p-2 text-center">Photo (After)</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="border-r border-gray-800 p-2 h-40 relative">
                          <div 
                            className="border border-dashed border-gray-400 h-24 flex items-center justify-center cursor-pointer"
                            onClick={() => document.getElementById(`before-photo-${actualIndex}`)?.click()}
                          >
                            {record.beforePhoto ? (
                              <img 
                                src={record.beforePhoto as string} 
                                alt="Before" 
                                className="h-full object-contain"
                              />
                            ) : (
                              <p className="text-gray-500">Click to upload photo</p>
                            )}
                            <input
                              type="file"
                              id={`before-photo-${actualIndex}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(actualIndex, 'before', e)}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <p className="font-semibold">Location:</p>
                            <input 
                              type="text" 
                              className="w-full border-none outline-none bg-transparent border-b border-gray-400"
                              value={record.location}
                              onChange={(e) => handlePhotoRecordChange(actualIndex, 'location', e.target.value)}
                            />
                          </div>
                          
                          <div className="mt-2">
                            <p className="font-semibold">Finding:</p>
                            <textarea 
                              className="w-full border border-gray-300 p-1 h-24 resize-none"
                              value={record.finding}
                              onChange={(e) => handlePhotoRecordChange(actualIndex, 'finding', e.target.value)}
                            ></textarea>
                          </div>
                        </td>
                        <td colSpan={4} className="border-gray-800 p-2 h-40 relative">
                          <div 
                            className="border border-dashed border-gray-400 h-24 flex items-center justify-center cursor-pointer"
                            onClick={() => document.getElementById(`after-photo-${actualIndex}`)?.click()}
                          >
                            {record.afterPhoto ? (
                              <img 
                                src={record.afterPhoto as string} 
                                alt="After" 
                                className="h-full object-contain"
                              />
                            ) : (
                              <p className="text-gray-500">Click to upload photo</p>
                            )}
                            <input
                              type="file"
                              id={`after-photo-${actualIndex}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(actualIndex, 'after', e)}
                            />
                          </div>
                          
                          <div className="mt-4">
                            <p className="font-semibold">Following Action Taken:</p>
                            <textarea 
                              className="w-full border border-gray-300 p-1 h-32 resize-none"
                              value={record.action}
                              onChange={(e) => handlePhotoRecordChange(actualIndex, 'action', e.target.value)}
                            ></textarea>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                );
              })}
              
              {/* Footer */}
              {currentPage === 4 && (
                <div className="mt-4 border-gray-800 pt-4">
                  <div className="flex items-center mb-2">
                    <span className="font-semibold mr-2">Name:</span>
                    <input 
                      type="text" 
                      className="flex-1 border-b border-gray-400 outline-none bg-transparent"
                      value={formData.recordName}
                      onChange={(e) => handleInputChange('recordName', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Date:</span>
                    <input 
                      type="date" 
                      className="w-40 border-b border-gray-400 outline-none bg-transparent"
                      value={formData.recordDate}
                      onChange={(e) => handleInputChange('recordDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="text-right mt-4 text-xs">
                Page {currentPage === 3 ? '1' : '2'} of 2
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-t border-[#334155] flex justify-end items-center">
        <div className="text-xs text-gray-400">
          Page {currentPage} of 4
        </div>
      </div>
    </div>
  );
}; 