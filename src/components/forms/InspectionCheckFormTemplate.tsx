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
  RiPrinterLine,
  RiUpload2Line,
  RiTimeLine
} from 'react-icons/ri';

interface InspectionCheckFormTemplateProps {
  onClose: () => void;
  onSave: (formData: any) => void;
}

export const InspectionCheckFormTemplate: React.FC<InspectionCheckFormTemplateProps> = ({
  onClose,
  onSave
}) => {
  // State for form data
  const [formData, setFormData] = useState({
    contractNo: '',
    riscNo: '',
    revision: '',
    supervisor: '',
    attention: '',
    works: 'is expected to be ready for your inspection / testing / checking:',
    location: '',
    worksToBeInspected: '',
    worksCategory: 'General',
    inspectionTime: '',
    inspectionDate: '',
    nextOperation: '',
    generalCleaning: '',
    scheduledTime: '',
    scheduledDate: '',
    equipment: '',
    issueTime: '',
    issueDate: '',
    issuedBy: '',
    receivedTime: '',
    receivedDate: '',
    receivedBy: '',
    siteAgentAttention: '',
    inspectedAt: '',
    inspectedBy: '',
    noObjection: false,
    deficienciesNoted: false,
    deficiencies: ['', '', '', '', '', '', ''],
    formReturnedTime: '',
    formReturnedDate: '',
    formReturnedBy: '',
    counterSignedTime: '',
    counterSignedDate: '',
    counterSignedBy: '',
    formReceivedTime: '',
    formReceivedDate: '',
    formReceivedBy: '',
    attachmentTime1: '',
    attachmentTime2: '',
    attachmentImage1: '',
    attachmentImage2: '',
  });

  // State for signature images
  const [signatures, setSignatures] = useState({
    issuedBySignature: '',
    receivedBySignature: '',
    formReturnedSignature: '',
    counterSignedSignature: '',
    formReceivedSignature: ''
  });

  // State for current form page
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 2;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleDeficiencyChange = (index: number, value: string) => {
    const updatedDeficiencies = [...formData.deficiencies];
    updatedDeficiencies[index] = value;
    setFormData({
      ...formData,
      deficiencies: updatedDeficiencies
    });
    
    // If user is typing in the last field, add a new empty field
    if (index === formData.deficiencies.length - 1 && value.trim() !== '') {
      handleAddDeficiency();
    }
  };

  const handleAddDeficiency = () => {
    setFormData({
      ...formData,
      deficiencies: [...formData.deficiencies, '']
    });
  };

  const handleRemoveDeficiency = (index: number) => {
    if (formData.deficiencies.length <= 1) return;
    
    const updatedDeficiencies = [...formData.deficiencies];
    updatedDeficiencies.splice(index, 1);
    setFormData({
      ...formData,
      deficiencies: updatedDeficiencies
    });
  };

  const handleSave = () => {
    onSave(formData);
  };

  // Function to navigate to next page
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Function to navigate to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Array of work categories as shown in the dropdown in the images
  const workCategories = [
    'General',
    'Site Clearance',
    'Landscape Softworks and Establishment Works',
    'Fencing',
    'Drainage Works',
    'Earthworks',
    'Geotechnical Works'
  ];

  // Handle file upload for signatures
  const handleSignatureUpload = (field: keyof typeof signatures) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignatures({
            ...signatures,
            [field]: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Handle time selection
  const handleTimeSelection = (field: string) => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    setFormData({
      ...formData,
      [field]: currentTime
    });
  };

  // For attachment page in PDF
  const createAttachmentPage = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attachment</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: black;
              font-size: 12px;
            }
            .container {
              border: 1px solid black;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
            }
            .title {
              font-weight: bold;
              font-size: 16px;
            }
            .content-section {
              margin-bottom: 40px;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid black;
              padding-bottom: 5px;
              margin-bottom: 120px;
            }
            .time-label {
              text-align: right;
            }
            .image-placeholder {
              border: 1px dashed #aaa;
              height: 120px;
              margin-top: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #777;
              font-style: italic;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">Attachment</div>
              <div>
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <div>
                    <div>RISC No.</div>
                    <div style="border: 1px solid black; padding: 5px; width: 150px;">${formData.riscNo}</div>
                  </div>
                  <div>
                    <div>REV.</div>
                    <div style="border: 1px solid black; padding: 5px; width: 50px;">${formData.revision}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="content-section">
              <div class="signature-line">
                <div>- by ${formData.issuedBy}</div>
                <div class="time-label">Time ${formData.attachmentTime1}</div>
              </div>
              <div class="image-placeholder">
                ${formData.attachmentImage1 ? `<img src="${formData.attachmentImage1}" style="max-width: 100%; max-height: 120px;">` : 'Image attachment area'}
              </div>
            </div>
            
            <div class="content-section">
              <div class="signature-line">
                <div>- by ${formData.inspectedBy}</div>
                <div class="time-label">Time ${formData.attachmentTime2}</div>
              </div>
              <div class="image-placeholder">
                ${formData.attachmentImage2 ? `<img src="${formData.attachmentImage2}" style="max-width: 100%; max-height: 120px;">` : 'Image attachment area'}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Update the handleDownloadPDF function
  const handleDownloadPDF = () => {
    // Create a new window to render the PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF');
      return;
    }

    // Write both pages to the new window with page breaks
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Request for Inspection Check Form</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: black;
              font-size: 12px;
            }
            .container {
              border: 1px solid black;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              margin-bottom: 30px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .title {
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 15px;
            }
            .supervisor {
              font-weight: bold;
              margin-bottom: 10px;
            }
            .attention-line {
              display: flex;
              margin-bottom: 10px;
            }
            .form-row {
              margin-bottom: 10px;
            }
            .underline {
              border-bottom: 1px solid black;
              min-width: 200px;
              display: inline-block;
              margin: 0 5px;
            }
            .full-underline {
              border-bottom: 1px solid black;
              width: 100%;
              display: block;
              margin: 5px 0;
              height: 1px;
            }
            .two-columns {
              display: flex;
              justify-content: space-between;
            }
            .time-date-row {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            .small-underline {
              border-bottom: 1px solid black;
              min-width: 80px;
              display: inline-block;
              margin: 0 5px;
            }
            .checkbox {
              margin-right: 10px;
            }
            .deficiency-line {
              border-bottom: 1px solid black;
              width: 100%;
              min-height: 1.5em;
              margin-bottom: 10px;
              padding: 3px 0;
              display: block;
              word-wrap: break-word;
              white-space: pre-wrap;
            }
            .signatures {
              margin-top: 15px;
            }
            .signature-row {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            .signature-spacer {
              flex-grow: 1;
              margin: 0 10px;
              border-bottom: 1px solid black;
            }
            .signature-label {
              min-width: 150px;
            }
            .signature-boxes {
              display: flex;
              justify-content: flex-end;
              align-items: center;
            }
            .signature-box {
              border: 1px solid black;
              width: 20px;
              height: 20px;
              margin: 0 5px;
            }
            .disclaimer {
              font-style: italic;
              margin: 15px 0;
              font-size: 11px;
            }
            .page-break {
              page-break-before: always;
            }
            .content-section {
              margin-bottom: 40px;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid black;
              padding-bottom: 5px;
              margin-bottom: 120px;
            }
            .time-label {
              text-align: right;
            }
            .image-placeholder {
              border: 1px dashed #aaa;
              height: 120px;
              margin-top: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #777;
              font-style: italic;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
              .page-break {
                page-break-before: always;
              }
            }
          </style>
        </head>
        <body>
          <!-- First Page -->
          <div class="container">
            <div class="header">
              <div></div>
              <div class="title">Request for Inspection Check Form</div>
              <div>
                <strong>Contract No.:</strong> ${formData.contractNo}
              </div>
            </div>
            
            <div class="supervisor">To: The Supervisor,</div>
            
            <div class="attention-line">
              <div>(Attention: ${formData.attention})</div>
              <div style="flex-grow: 1;"></div>
              <div>
                <strong>RISC No.:</strong> ${formData.riscNo}
                <strong style="margin-left: 10px;">Rev.</strong> ${formData.revision}
              </div>
            </div>
            
            <div class="form-row">
              <div>The following <em>works</em> ${formData.works}</div>
            </div>
            
            <div class="form-row">
              <div style="display: flex; align-items: center;">
                <div style="white-space: nowrap; margin-right: 10px;">(1) Location, portion, chainage, level of <em>works</em>:</div>
                <div style="flex-grow: 1; border-bottom: 1px solid black; min-height: 1.5em;">${formData.location}</div>
              </div>
            </div>
            
            <div class="two-columns">
              <div style="width: 48%;">
                <div style="display: flex; align-items: center;">
                  <div style="white-space: nowrap; margin-right: 10px;">(2) <em>Works</em> to be Inspected:</div>
                  <div style="flex-grow: 1; border-bottom: 1px solid black; min-height: 1.5em;">${formData.worksToBeInspected}</div>
                </div>
              </div>
              <div style="width: 48%;">
                <div style="display: flex; align-items: center;">
                  <div style="white-space: nowrap; margin-right: 10px;">(3) <em>Works Category</em>:</div>
                  <div style="flex-grow: 1; border-bottom: 1px solid black; min-height: 1.5em;">${formData.worksCategory}</div>
                </div>
              </div>
            </div>
            
            <div class="time-date-row">
              <div>at</div>
              <div class="small-underline">${formData.inspectionTime}</div>
              <div>(time)</div>
              <div>on</div>
              <div class="small-underline">${formData.inspectionDate}</div>
              <div>(date)</div>
              <div>before proceeding to the next operation of</div>
              <div class="underline" style="flex-grow: 1;">${formData.nextOperation}</div>
            </div>
            
            <div class="time-date-row">
              <div>Check general cleaning</div>
              <div class="underline">${formData.generalCleaning}</div>
            </div>
            
            <div class="time-date-row">
              <div>which is scheduled for</div>
              <div class="small-underline">${formData.scheduledTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.scheduledDate}</div>
              <div>(date)</div>
              <div>using the following Equipment:</div>
              <div class="underline">${formData.equipment}</div>
            </div>
            
            <div class="signature-row">
              <div><em>Issued by the Contractor</em>:</div>
              <div class="small-underline">${formData.issueTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.issueDate}</div>
              <div>(date)</div>
              <div>by</div>
              <div class="underline">${formData.issuedBy}</div>
            </div>
            
            <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center;">
              ${signatures.issuedBySignature ? `<img src="${signatures.issuedBySignature}" alt="Signature" style="height: 40px; margin-right: 10px;">` : ''}
              (Signature)
            </div>
            
            <div class="signature-row">
              <div>Received by RE/IOW:</div>
              <div class="small-underline">${formData.receivedTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.receivedDate}</div>
              <div>(date)</div>
              <div>by</div>
              <div class="underline">${formData.receivedBy}</div>
            </div>
            
            <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center;">
              ${signatures.receivedBySignature ? `<img src="${signatures.receivedBySignature}" alt="Signature" style="height: 40px; margin-right: 10px;">` : ''}
              (Signature)
            </div>
            
            <div class="supervisor">To: Site Agent,</div>
            
            <div class="attention-line">
              <div>(Attention: ${formData.siteAgentAttention})</div>
              <div style="flex-grow: 1;"></div>
              <div>
                <strong>Inspected at</strong> ${formData.inspectedAt}
                <strong style="margin-left: 10px;">by</strong> ${formData.inspectedBy}
              </div>
            </div>
            
            <div>
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div class="checkbox">${formData.noObjection ? '☑' : '☐'}</div>
                <div>There is no objection to you proceeding with the work.</div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <div class="checkbox">${formData.deficienciesNoted ? '☑' : '☐'}</div>
                <div>The following deficiencies have been noted.</div>
              </div>
            </div>
            
            <div>
              ${formData.deficiencies.filter(d => d.trim() !== '').map((d, i) => `<div class="deficiency-line"><span style="font-weight: bold; margin-right: 8px;">${i+1}.</span>${d}</div>`).join('')}
            </div>
            
            <div class="disclaimer">
              The giving of this information and this inspection shall not relieve the Contractor of any liabilities or obligations under this contract.
            </div>
            
            <div class="signature-row">
              <div>Form returned and signed by</div>
              <div class="small-underline">${formData.formReturnedTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.formReturnedDate}</div>
              <div>(date)</div>
              <div>by</div>
              <div class="underline">${formData.formReturnedBy}</div>
            </div>
            
            <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center;">
              ${signatures.formReturnedSignature ? `<img src="${signatures.formReturnedSignature}" alt="Signature" style="height: 40px; margin-right: 10px;">` : ''}
              (Signature)
            </div>
            
            <div class="signature-row">
              <div>#Countersigned by the RE</div>
              <div class="small-underline">${formData.counterSignedTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.counterSignedDate}</div>
              <div>(date)</div>
              <div>by</div>
              <div class="underline">${formData.counterSignedBy}</div>
            </div>
            
            <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center;">
              ${signatures.counterSignedSignature ? `<img src="${signatures.counterSignedSignature}" alt="Signature" style="height: 40px; margin-right: 10px;">` : ''}
              (Signature)
            </div>
            
            <div class="signature-row">
              <div>Form received and signed by the Contractor</div>
              <div class="small-underline">${formData.formReceivedTime}</div>
              <div>(time)</div>
              <div class="small-underline">${formData.formReceivedDate}</div>
              <div>(date)</div>
              <div>by</div>
              <div class="underline">${formData.formReceivedBy}</div>
            </div>
            
            <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center;">
              ${signatures.formReceivedSignature ? `<img src="${signatures.formReceivedSignature}" alt="Signature" style="height: 40px; margin-right: 10px;">` : ''}
              (Signature)
            </div>
          </div>
          
          <!-- Page Break -->
          <div class="page-break"></div>
          
          <!-- Second Page - Attachment -->
          <div class="container">
            <div class="header">
              <div class="title">Attachment</div>
              <div>
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <div>
                    <div>RISC No.</div>
                    <div style="border: 1px solid black; padding: 5px; width: 150px;">${formData.riscNo}</div>
                  </div>
                  <div>
                    <div>REV.</div>
                    <div style="border: 1px solid black; padding: 5px; width: 50px;">${formData.revision}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="content-section">
              <div class="signature-line">
                <div>- by ${formData.issuedBy}</div>
                <div class="time-label">Time ${formData.attachmentTime1}</div>
              </div>
              <div class="image-placeholder">
                ${formData.attachmentImage1 ? `<img src="${formData.attachmentImage1}" style="max-width: 100%; max-height: 120px;">` : 'Image attachment area'}
              </div>
            </div>
            
            <div class="content-section">
              <div class="signature-line">
                <div>- by ${formData.inspectedBy}</div>
                <div class="time-label">Time ${formData.attachmentTime2}</div>
              </div>
              <div class="image-placeholder">
                ${formData.attachmentImage2 ? `<img src="${formData.attachmentImage2}" style="max-width: 100%; max-height: 120px;">` : 'Image attachment area'}
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Handle image upload for attachments
  const handleAttachmentImageUpload = (field: 'attachmentImage1' | 'attachmentImage2') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData({
            ...formData,
            [field]: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto bg-[#1e293b] rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-[#334155]">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <RiFileTextLine className="mr-2 text-blue-400" />
          {currentPage === 0 ? 'Request for Inspection Check Form' : 'Attachment'}
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
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105"
          >
            Save
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 bg-[#f8fafc]">
        {currentPage === 0 ? (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            <div className="flex justify-between items-start mb-8">
              <div></div>
              <div className="text-center font-bold text-xl">
                Request for Inspection Check Form
              </div>
              <div className="text-right">
                <div className="font-medium">Contract No.:</div>
                <input 
                  className="w-full bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.contractNo}
                  onChange={(e) => handleInputChange('contractNo', e.target.value)}
                />
              </div>
            </div>

            <div className="text-sm">
              <div className="font-bold mb-4">To: The Supervisor,</div>
              
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <span className="mr-1">(Attention:</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-64"
                    value={formData.attention}
                    onChange={(e) => handleInputChange('attention', e.target.value)}
                  />
                  <span className="ml-1">)</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-bold mr-2">RISC No.:</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-40 mr-4"
                    value={formData.riscNo}
                    onChange={(e) => handleInputChange('riscNo', e.target.value)}
                  />
                  <span className="font-bold mr-2">Rev.</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-20"
                    value={formData.revision}
                    onChange={(e) => handleInputChange('revision', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div>The following <em>works</em> {formData.works}</div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="whitespace-nowrap mr-2">(1) Location, portion, chainage, level of <em>works</em>:</div>
                  <input 
                    className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="w-1/2">
                  <div className="flex items-center">
                    <div className="whitespace-nowrap mr-2">(2) <em>Works</em> to be Inspected:</div>
                    <input 
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={formData.worksToBeInspected}
                      onChange={(e) => handleInputChange('worksToBeInspected', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-1/2">
                  <div className="flex items-center">
                    <div className="whitespace-nowrap mr-2">(3) <em>Works Category</em>:</div>
                    <select
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={formData.worksCategory}
                      onChange={(e) => handleInputChange('worksCategory', e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Site Clearance">Site Clearance</option>
                      <option value="Landscape Softworks and Establishment Works">Landscape Softworks and Establishment Works</option>
                      <option value="Fencing">Fencing</option>
                      <option value="Drainage Works">Drainage Works</option>
                      <option value="Earthworks">Earthworks</option>
                      <option value="Geotechnical Works">Geotechnical Works</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span>at</span>
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                  type="time"
                  value={formData.inspectionTime}
                  onChange={(e) => handleInputChange('inspectionTime', e.target.value)}
                />
                <span>on</span>
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                />
                <span>before proceeding to the next operation of</span>
                <input 
                  className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.nextOperation}
                  onChange={(e) => handleInputChange('nextOperation', e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <span>Check general cleaning</span>
                <input 
                  className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.generalCleaning}
                  onChange={(e) => handleInputChange('generalCleaning', e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <span>which is scheduled for</span>
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                />
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  placeholder="(date)"
                />
                <span>using the following Equipment:</span>
                <input 
                  className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.equipment}
                  onChange={(e) => handleInputChange('equipment', e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <span className="italic">Issued by the Contractor</span>
                <span>:</span>
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                  type="time"
                  value={formData.issueTime}
                  onChange={(e) => handleInputChange('issueTime', e.target.value)}
                />
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  placeholder="(date)"
                />
                <span>by</span>
                <input 
                  className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.issuedBy}
                  onChange={(e) => handleInputChange('issuedBy', e.target.value)}
                />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
                  <RiUpload2Line className="mr-1" />
                  <span>Upload Signature</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload('issuedBySignature')}
                  />
                </label>
                {signatures.issuedBySignature && (
                  <div className="h-12 w-32">
                    <img 
                      src={signatures.issuedBySignature} 
                      alt="Signature" 
                      className="h-full object-contain"
                    />
                  </div>
                )}
                <div className="text-right">(Signature)</div>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <span>Received by RE/IOW</span>
                <span>:</span>
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                  type="time"
                  value={formData.receivedTime}
                  onChange={(e) => handleInputChange('receivedTime', e.target.value)}
                />
                <input 
                  className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                  placeholder="(date)"
                />
                <span>by</span>
                <input 
                  className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
                  <RiUpload2Line className="mr-1" />
                  <span>Upload Signature</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload('receivedBySignature')}
                  />
                </label>
                {signatures.receivedBySignature && (
                  <div className="h-12 w-32">
                    <img 
                      src={signatures.receivedBySignature} 
                      alt="Signature" 
                      className="h-full object-contain"
                    />
                  </div>
                )}
                <div className="text-right">(Signature)</div>
              </div>
              
              <div className="font-bold mb-4">To: Site Agent,</div>
              
              <div className="flex justify-between mb-4">
                <div className="flex items-center">
                  <span className="mr-1">(Attention:</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-64"
                    value={formData.siteAgentAttention}
                    onChange={(e) => handleInputChange('siteAgentAttention', e.target.value)}
                  />
                  <span className="ml-1">)</span>
                </div>
                
                <div className="flex items-center">
                  <span className="mr-2">Inspected at</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-40 mr-2"
                    value={formData.inspectedAt}
                    onChange={(e) => handleInputChange('inspectedAt', e.target.value)}
                  />
                  <span className="mr-2">by</span>
                  <input 
                    className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-48"
                    value={formData.inspectedBy}
                    onChange={(e) => handleInputChange('inspectedBy', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox"
                    checked={formData.noObjection}
                    onChange={(e) => handleInputChange('noObjection', e.target.checked)}
                    className="mr-2 w-4 h-4"
                  />
                  <span>There is no objection to you proceeding with the work.</span>
                </div>
                
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox"
                    checked={formData.deficienciesNoted}
                    onChange={(e) => handleInputChange('deficienciesNoted', e.target.checked)}
                    className="mr-2 w-4 h-4"
                  />
                  <span>The following deficiencies have been noted.</span>
                </div>
              </div>
              
              <div>
                {formData.deficiencies.map((deficiency, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <span className="font-bold mr-2 text-gray-700 w-6">{index+1}.</span>
                    <input 
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={deficiency}
                      onChange={(e) => handleDeficiencyChange(index, e.target.value)}
                    />
                    {index > 0 && (
                      <button
                        onClick={() => handleRemoveDeficiency(index)}
                        className="ml-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={handleAddDeficiency}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <RiAddLine className="mr-1" /> Add line
                </button>
              </div>
              
              <div className="text-sm italic mb-6">
                The giving of this information and this inspection shall not relieve the Contractor of any liabilities or obligations under this contract.
              </div>
              
              <div className="flex flex-col gap-6">
                <div>
                  <div className="mb-1">Form returned and signed by</div>
                  <div className="flex items-center gap-2">
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                      type="time"
                      value={formData.formReturnedTime}
                      onChange={(e) => handleInputChange('formReturnedTime', e.target.value)}
                    />
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                      type="date"
                      value={formData.formReturnedDate}
                      onChange={(e) => handleInputChange('formReturnedDate', e.target.value)}
                      placeholder="(date)"
                    />
                    <span>by</span>
                    <input 
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={formData.formReturnedBy}
                      onChange={(e) => handleInputChange('formReturnedBy', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <label className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
                      <RiUpload2Line className="mr-1" />
                      <span>Upload Signature</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleSignatureUpload('formReturnedSignature')}
                      />
                    </label>
                    {signatures.formReturnedSignature && (
                      <div className="h-12 w-32">
                        <img 
                          src={signatures.formReturnedSignature} 
                          alt="Signature" 
                          className="h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="text-right">(Signature)</div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-1">#Countersigned by the RE</div>
                  <div className="flex items-center gap-2">
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                      type="time"
                      value={formData.counterSignedTime}
                      onChange={(e) => handleInputChange('counterSignedTime', e.target.value)}
                    />
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                      type="date"
                      value={formData.counterSignedDate}
                      onChange={(e) => handleInputChange('counterSignedDate', e.target.value)}
                      placeholder="(date)"
                    />
                    <span>by</span>
                    <input 
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={formData.counterSignedBy}
                      onChange={(e) => handleInputChange('counterSignedBy', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <label className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
                      <RiUpload2Line className="mr-1" />
                      <span>Upload Signature</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleSignatureUpload('counterSignedSignature')}
                      />
                    </label>
                    {signatures.counterSignedSignature && (
                      <div className="h-12 w-32">
                        <img 
                          src={signatures.counterSignedSignature} 
                          alt="Signature" 
                          className="h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="text-right">(Signature)</div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-1">Form received and signed by the Contractor</div>
                  <div className="flex items-center gap-2">
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                      type="time"
                      value={formData.formReceivedTime}
                      onChange={(e) => handleInputChange('formReceivedTime', e.target.value)}
                    />
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-32"
                      type="date"
                      value={formData.formReceivedDate}
                      onChange={(e) => handleInputChange('formReceivedDate', e.target.value)}
                      placeholder="(date)"
                    />
                    <span>by</span>
                    <input 
                      className="flex-grow bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm"
                      value={formData.formReceivedBy}
                      onChange={(e) => handleInputChange('formReceivedBy', e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <label className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
                      <RiUpload2Line className="mr-1" />
                      <span>Upload Signature</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleSignatureUpload('formReceivedSignature')}
                      />
                    </label>
                    {signatures.formReceivedSignature && (
                      <div className="h-12 w-32">
                        <img 
                          src={signatures.formReceivedSignature} 
                          alt="Signature" 
                          className="h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="text-right">(Signature)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            <div className="border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="font-bold text-xl">Attachment</div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="mb-1 font-medium">RISC No.</div>
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-40"
                      value={formData.riscNo}
                      onChange={(e) => handleInputChange('riscNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="mb-1 font-medium">REV.</div>
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-20"
                      value={formData.revision}
                      onChange={(e) => handleInputChange('revision', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-12">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span>- by</span>
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-64"
                      value={formData.issuedBy}
                      onChange={(e) => handleInputChange('issuedBy', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Time</span>
                    <div className="flex items-center">
                      <input 
                        className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                        type="time"
                        value={formData.attachmentTime1}
                        onChange={(e) => handleInputChange('attachmentTime1', e.target.value)}
                      />
                      <button
                        onClick={() => handleTimeSelection('attachmentTime1')}
                        className="ml-1 p-2 text-blue-600 hover:text-blue-800"
                        title="Set current time"
                      >
                        <RiTimeLine />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-48 mt-4 flex flex-col items-center justify-center">
                  {formData.attachmentImage1 ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={formData.attachmentImage1} 
                        alt="Attachment 1" 
                        className="object-contain max-h-48 mx-auto"
                      />
                      <button
                        onClick={() => setFormData({...formData, attachmentImage1: ''})}
                        className="absolute top-0 right-0 bg-red-100 text-red-600 p-1 rounded-full"
                        title="Remove image"
                      >
                        <RiCloseLine />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md w-full h-full cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <RiUpload2Line className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Upload attachment image</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleAttachmentImageUpload('attachmentImage1')}
                        accept="image/*"
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div className="mb-12">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                  <div className="flex items-center gap-2">
                    <span>- by</span>
                    <input 
                      className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-64"
                      value={formData.inspectedBy}
                      onChange={(e) => handleInputChange('inspectedBy', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">Time</span>
                    <div className="flex items-center">
                      <input 
                        className="bg-white border border-gray-300 text-black rounded px-2 py-1 text-sm w-28"
                        type="time"
                        value={formData.attachmentTime2}
                        onChange={(e) => handleInputChange('attachmentTime2', e.target.value)}
                      />
                      <button
                        onClick={() => handleTimeSelection('attachmentTime2')}
                        className="ml-1 p-2 text-blue-600 hover:text-blue-800"
                        title="Set current time"
                      >
                        <RiTimeLine />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-48 mt-4 flex flex-col items-center justify-center">
                  {formData.attachmentImage2 ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={formData.attachmentImage2} 
                        alt="Attachment 2" 
                        className="object-contain max-h-48 mx-auto"
                      />
                      <button
                        onClick={() => setFormData({...formData, attachmentImage2: ''})}
                        className="absolute top-0 right-0 bg-red-100 text-red-600 p-1 rounded-full"
                        title="Remove image"
                      >
                        <RiCloseLine />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md w-full h-full cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <RiUpload2Line className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Upload attachment image</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleAttachmentImageUpload('attachmentImage2')}
                        accept="image/*"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-t border-[#334155] flex justify-between items-center">
        <div>
          {currentPage > 0 && (
            <button
              className="px-5 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              onClick={prevPage}
            >
              <RiArrowLeftLine className="text-blue-400" />
              Previous
            </button>
          )}
        </div>
        
        <div>
          {currentPage < totalPages - 1 && (
            <button
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
              onClick={nextPage}
            >
              Next
              <RiArrowRightLine className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 