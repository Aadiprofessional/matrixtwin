import React, { useState, useEffect } from 'react';
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
  RiCheckLine
} from 'react-icons/ri';

interface SiteDiaryFormTemplateProps {
  onClose: () => void;
  onSave: (formData: any) => void;
  initialData?: any;
  isEditMode?: boolean;
  readOnly?: boolean;
  title?: string;
}

export const SiteDiaryFormTemplate: React.FC<SiteDiaryFormTemplateProps> = ({
  onClose,
  onSave,
  initialData,
  isEditMode,
  readOnly,
  title
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    // Page 1 data
    contractNo: '',
    date: '',
    day: '',
    contractDate: '',
    clientDepartment: '',
    contractor: '',
    weatherAM: '',
    weatherPM: '',
    rainfall: '',
    signal: '',
    instructions: '',
    comments: '',
    utilities: '',
    visitor: '',
    remarks: '',
    toBeInsert: '(To be insert)',
    
    // Page 2 data
    activities: [{
      area: '',
      location: '',
      subLocation: '',
      activity: '',
      trade: '',
      code: '',
      labourNo: '',
      workingHours: '',
      equipmentType: '',
      equipmentId: '',
      onSite: '',
      working: '',
      idle: '',
      remarks: ''
    }]
  });
  
  // Staff rows for page 1
  const [staffRows, setStaffRows] = useState([
    { staffTitle: '', staffCount: '' }
  ]);
  
  // Staff rows for second column
  const [staffRows2, setStaffRows2] = useState([
    { staffTitle: '', staffCount: '' }
  ]);
  
  // Labour rows for page 1
  const [labourRows, setLabourRows] = useState([
    { labourType: '', labourCode: '', labourCount: '' }
  ]);
  
  // Equipment rows for page 1
  const [equipmentRows, setEquipmentRows] = useState([
    { equipmentType: '', totalOnSite: '', working: '', idling: '' }
  ]);
  
  // Assistance rows for page 1
  const [assistanceRows, setAssistanceRows] = useState([
    { description: '', workNo: '' }
  ]);
  
  // Activity rows for page 2
  const [activityRows, setActivityRows] = useState([
    { 
      area: '', 
      location: '', 
      subLocation: '', 
      activity: '',
      trade: '',
      code: '',
      labourNo: '',
      workingHours: '',
      equipmentType: '',
      equipmentId: '',
      onSite: '',
      working: '',
      idle: '',
      remarks: ''
    }
  ]);
  
  // Signature information
  const [signatures, setSignatures] = useState({
    projectManagerName: '',
    projectManagerDate: '',
    contractorRepName: '',
    contractorRepDate: '',
    supervisorName: '',
    supervisorDate: ''
  });
  
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleStaffRowChange = (index: number, field: string, value: string) => {
    const updatedRows = [...staffRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setStaffRows(updatedRows);
  };
  
  const handleStaffRow2Change = (index: number, field: string, value: string) => {
    const updatedRows = [...staffRows2];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setStaffRows2(updatedRows);
  };
  
  const handleLabourRowChange = (index: number, field: string, value: string) => {
    const updatedRows = [...labourRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setLabourRows(updatedRows);
  };
  
  const handleEquipmentRowChange = (index: number, field: string, value: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setEquipmentRows(updatedRows);
  };
  
  const handleAssistanceRowChange = (index: number, field: string, value: string) => {
    const updatedRows = [...assistanceRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setAssistanceRows(updatedRows);
  };
  
  const handleActivityRowChange = (index: number, field: string, value: string) => {
    const updatedRows = [...activityRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setActivityRows(updatedRows);
  };
  
  const handleSignatureChange = (field: string, value: string) => {
    setSignatures({
      ...signatures,
      [field]: value
    });
  };
  
  const addStaffRow = () => {
    setStaffRows([...staffRows, { staffTitle: '', staffCount: '' }]);
  };
  
  const addStaffRow2 = () => {
    setStaffRows2([...staffRows2, { staffTitle: '', staffCount: '' }]);
  };
  
  const addLabourRow = () => {
    setLabourRows([...labourRows, { labourType: '', labourCode: '', labourCount: '' }]);
  };
  
  const addEquipmentRow = () => {
    setEquipmentRows([...equipmentRows, { equipmentType: '', totalOnSite: '', working: '', idling: '' }]);
  };
  
  const addAssistanceRow = () => {
    setAssistanceRows([...assistanceRows, { description: '', workNo: '' }]);
  };
  
  const addActivityRow = () => {
    setActivityRows([...activityRows, { 
      area: '', 
      location: '', 
      subLocation: '', 
      activity: '',
      trade: '',
      code: '',
      labourNo: '',
      workingHours: '',
      equipmentType: '',
      equipmentId: '',
      onSite: '',
      working: '',
      idle: '',
      remarks: ''
    }]);
  };
  
  const removeStaffRow = (index: number) => {
    if (staffRows.length > 1) {
      setStaffRows(staffRows.filter((_, i) => i !== index));
    }
  };
  
  const removeStaffRow2 = (index: number) => {
    if (staffRows2.length > 1) {
      setStaffRows2(staffRows2.filter((_, i) => i !== index));
    }
  };
  
  const removeLabourRow = (index: number) => {
    if (labourRows.length > 1) {
      setLabourRows(labourRows.filter((_, i) => i !== index));
    }
  };
  
  const removeEquipmentRow = (index: number) => {
    if (equipmentRows.length > 1) {
      setEquipmentRows(equipmentRows.filter((_, i) => i !== index));
    }
  };
  
  const removeAssistanceRow = (index: number) => {
    if (assistanceRows.length > 1) {
      setAssistanceRows(assistanceRows.filter((_, i) => i !== index));
    }
  };
  
  const removeActivityRow = (index: number) => {
    if (activityRows.length > 1) {
      setActivityRows(activityRows.filter((_, i) => i !== index));
    }
  };
  
  const handleSave = () => {
    const completeFormData = {
      ...formData,
      staffData: staffRows,
      staffData2: staffRows2,
      labourData: labourRows,
      equipmentData: equipmentRows,
      assistanceData: assistanceRows,
      activityData: activityRows,
      signatures
    };
    onSave(completeFormData);
  };
  
  const changePage = (pageNumber: 1 | 2) => {
    setCurrentPage(pageNumber);
  };
  
  const handleDownloadPDF = () => {
    // Create a link to trigger the download
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the PDF');
      return;
    }

    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Site Diary PDF</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: black;
              font-size: 12px;
            }
            @page {
              size: A3 landscape;
              margin: 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid black;
              padding: 4px;
              text-align: left;
              font-size: 11px;
            }
            .page {
              width: 420mm;
              min-height: 297mm;
              padding: 10mm;
              margin: 0 auto;
              background: white;
            }
            .page-break {
              page-break-before: always;
            }
            .text-center {
              text-align: center;
            }
            .border-bottom {
              border-bottom: 1px solid black;
            }
            .flex-row {
              display: flex;
              flex-direction: row;
            }
            .form-field {
              margin-bottom: 5px;
              border-bottom: 1px solid black;
            }
            .form-label {
              font-weight: bold;
              margin-right: 5px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .signature-block {
              flex: 1;
              text-align: center;
              padding: 5px;
            }
            .signature-line {
              border-bottom: 1px solid black;
              margin: 15px 0 5px 0;
              height: 1px;
            }
            .page-number {
              text-align: right;
              margin-top: 10px;
              font-size: 10px;
            }
            .legend-table {
              border: 1px solid black;
              width: auto;
              float: right;
              margin-bottom: 10px;
            }
            .legend-table td {
              padding: 2px 4px;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <!-- Page 1 -->
          <div class="page">
            <!-- Header Information -->
            <table style="margin-bottom: 10px; border: none;">
              <tr>
                <td style="border: none; width: 33%;">
                  <div class="form-field">
                    <span class="form-label">Contract No.:</span>
                    ${formData.contractNo}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Date:</span>
                    ${formData.date}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Day:</span>
                    ${formData.day}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Contract Date:</span>
                    ${formData.contractDate}
                  </div>
                  <div class="form-field">
                    <span class="form-label">${formData.toBeInsert}</span>
                  </div>
                </td>
                
                <td style="border: none; width: 34%; text-align: center; vertical-align: middle;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 15px;">SITE DIARY</div>
                  <div style="text-align: left;">
                    <div>Client Department:</div>
                    <div style="border-bottom: 1px solid black; margin-bottom: 8px;">${formData.clientDepartment}</div>
                    <div>Contractor:</div>
                    <div style="border-bottom: 1px solid black;">${formData.contractor}</div>
                  </div>
                </td>
                
                <td style="border: none; width: 33%;">
                  <div style="display: flex;">
                    <!-- Weather information on the left -->
                    <div style="flex: 1; padding-right: 10px;">
                      <div class="form-field">
                        <span class="form-label">Weather (A.M.):</span>
                        ${formData.weatherAM}
                      </div>
                      <div class="form-field">
                        <span class="form-label">Weather (P.M.):</span>
                        ${formData.weatherPM}
                      </div>
                      <div class="form-field">
                        <span class="form-label">Rainfall (mm):</span>
                        ${formData.rainfall}
                      </div>
                      <div class="form-field">
                        <span class="form-label">Signal:</span>
                        ${formData.signal}
                      </div>
                    </div>
                    
                    <!-- Status Legend Table on the right -->
                    <div style="width: 50%;">
                      <table style="width: 100%; border: 1px solid black;">
                        <tr>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">B: Breakdown</td>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">S: Bad Weather</td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">A: Surplus</td>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">T: Task Completed</td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">W: Working Instruction</td>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">N: No Operator</td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">P: Assembly/Disassemble</td>
                          <td style="border: 1px solid black; padding: 2px 4px; font-size: 10px;">X: Not Required</td>
                        </tr>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Main Content - Restructured to have Equipment after Labour -->
            <div style="clear: both;">
              <table>
                <tr>
                  <!-- Left side: Instructions column -->
                  <td style="width: 30%; vertical-align: top; padding: 0; border: none;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <!-- Instructions column -->
                        <td style="width: 100%; vertical-align: top; border: 1px solid black;">
                          <div style="text-align: center; border-bottom: 1px solid black; padding: 4px; font-weight: bold;">Instructions</div>
                          <div style="min-height: 60px; padding: 4px;">${formData.instructions}</div>
                          
                          <div style="text-align: center; border-bottom: 1px solid black; border-top: 1px solid black; padding: 4px; font-weight: bold;">Comments</div>
                          <div style="min-height: 60px; padding: 4px;">${formData.comments}</div>
                          
                          <div style="text-align: center; border-bottom: 1px solid black; border-top: 1px solid black; padding: 4px; font-weight: bold;">Utilities</div>
                          <div style="min-height: 60px; padding: 4px;">${formData.utilities}</div>
                          
                          <div style="text-align: center; border-bottom: 1px solid black; border-top: 1px solid black; padding: 4px; font-weight: bold;">Visitor</div>
                          <div style="min-height: 60px; padding: 4px;">${formData.visitor}</div>
                          
                          <div style="text-align: center; border-bottom: 1px solid black; border-top: 1px solid black; padding: 4px; font-weight: bold;">Remarks</div>
                          <div style="min-height: 60px; padding: 4px;">${formData.remarks}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Right side: Staff, Labour and Equipment columns -->
                  <td style="width: 70%; vertical-align: top; padding: 0; border: none;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <!-- Staff column 1 -->
                        <td style="width: 25%; vertical-align: top; border: 1px solid black;">
                          <div style="text-align: center; border-bottom: 1px solid black; padding: 4px; font-weight: bold;">Contractor's Site Staff</div>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <th style="width: 70%;">Title</th>
                              <th style="width: 30%; text-align: center;">No.</th>
                            </tr>
                            ${staffRows.map(row => `
                              <tr>
                                <td>${row.staffTitle || ' '}</td>
                                <td style="text-align: center;">${row.staffCount || ' '}</td>
                              </tr>
                            `).join('')}
                            <tr>
                              <td style="text-align: right; font-weight: bold;">Total</td>
                              <td style="text-align: center;">${staffRows.reduce((sum, row) => sum + (parseInt(row.staffCount) || 0), 0)}</td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Staff column 2 -->
                        <td style="width: 25%; vertical-align: top; border: 1px solid black;">
                          <div style="text-align: center; border-bottom: 1px solid black; padding: 4px; font-weight: bold;">Contractor's Site Staff</div>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <th style="width: 70%;">Title</th>
                              <th style="width: 30%; text-align: center;">No.</th>
                            </tr>
                            ${staffRows2.map(row => `
                              <tr>
                                <td>${row.staffTitle || ' '}</td>
                                <td style="text-align: center;">${row.staffCount || ' '}</td>
                              </tr>
                            `).join('')}
                            <tr>
                              <td style="text-align: right; font-weight: bold;">Total</td>
                              <td style="text-align: center;">${staffRows2.reduce((sum, row) => sum + (parseInt(row.staffCount) || 0), 0)}</td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Labour column -->
                        <td style="width: 25%; vertical-align: top; border: 1px solid black;">
                          <div style="text-align: center; border-bottom: 1px solid black; padding: 4px; font-weight: bold;">Labour</div>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <th style="width: 40%;">Type</th>
                              <th style="width: 30%; text-align: center;">Code</th>
                              <th style="width: 30%; text-align: center;">No.</th>
                            </tr>
                            ${labourRows.map(row => `
                              <tr>
                                <td>${row.labourType || ' '}</td>
                                <td style="text-align: center;">${row.labourCode || ' '}</td>
                                <td style="text-align: center;">${row.labourCount || ' '}</td>
                              </tr>
                            `).join('')}
                            <tr>
                              <td colspan="2" style="text-align: right; font-weight: bold;">Total Labour</td>
                              <td style="text-align: center;">${labourRows.reduce((sum, row) => sum + (parseInt(row.labourCount) || 0), 0)}</td>
                            </tr>
                          </table>
                        </td>
                        
                        <!-- Equipment column -->
                        <td style="width: 25%; vertical-align: top; border: 1px solid black;">
                          <div style="text-align: center; border-bottom: 1px solid black; padding: 4px; font-weight: bold;">Equipment</div>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <th style="width: 40%; text-align: left; padding: 4px;">Type</th>
                              <th style="width: 20%; text-align: center; padding: 4px;">Total</th>
                              <th style="width: 20%; text-align: center; padding: 4px;">Work</th>
                              <th style="width: 20%; text-align: center; padding: 4px;">Idle</th>
                            </tr>
                            ${equipmentRows.map(row => `
                              <tr>
                                <td style="width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 4px;">${row.equipmentType || ' '}</td>
                                <td style="width: 20%; text-align: center; padding: 4px;">${row.totalOnSite || ' '}</td>
                                <td style="width: 20%; text-align: center; padding: 4px;">${row.working || ' '}</td>
                                <td style="width: 20%; text-align: center; padding: 4px;">${row.idling || ' '}</td>
                              </tr>
                            `).join('')}
                            <tr>
                              <td style="text-align: right; font-weight: bold; padding: 4px;">Total</td>
                              <td style="text-align: center; padding: 4px;">${equipmentRows.reduce((sum, row) => sum + (parseInt(row.totalOnSite) || 0), 0)}</td>
                              <td style="text-align: center; padding: 4px;">${equipmentRows.reduce((sum, row) => sum + (parseInt(row.working) || 0), 0)}</td>
                              <td style="text-align: center; padding: 4px;">${equipmentRows.reduce((sum, row) => sum + (parseInt(row.idling) || 0), 0)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Assistance to Supervising Officer section -->
              <table style="margin-top: 10px; width: 100%;">
                <tr>
                  <th colspan="2" style="text-align: center; padding: 4px; font-weight: bold;">Assistance to Supervising Officer</th>
                </tr>
                <tr>
                  <th style="width: 80%;">Description</th>
                  <th style="width: 20%; text-align: center;">Work No.</th>
                </tr>
                ${assistanceRows.map(row => `
                  <tr>
                    <td>${row.description || ' '}</td>
                    <td style="text-align: center;">${row.workNo || ' '}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <!-- Signatures Section -->
            <div style="margin-top: 30px;">
              <div style="font-size: 11px; margin-bottom: 5px;">Daily record and instruction checked and agreed</div>
              <div class="signatures">
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Project Manager Delegate</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.projectManagerName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.projectManagerDate}</div>
                </div>
                
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Contractor's Representative</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.contractorRepName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.contractorRepDate}</div>
                </div>
                
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Supervisor</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.supervisorName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.supervisorDate}</div>
                </div>
              </div>
            </div>
            
            <div class="page-number">Page 1 of 2</div>
          </div>
          
          <!-- Page 2 -->
          <div class="page-break"></div>
          <div class="page">
            <!-- Header Information -->
            <table style="margin-bottom: 10px; border: none;">
              <tr>
                <td style="border: none; width: 33%;">
                  <div class="form-field">
                    <span class="form-label">Contract No.:</span>
                    ${formData.contractNo}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Date:</span>
                    ${formData.date}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Day:</span>
                    ${formData.day}
                  </div>
                  <div class="form-field">
                    <span class="form-label">Contract Date:</span>
                    ${formData.contractDate}
                  </div>
                  <div class="form-field">
                    <span class="form-label">${formData.toBeInsert}</span>
                  </div>
                </td>
                
                <td style="border: none; width: 34%; text-align: center; vertical-align: middle;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 15px;">SITE DIARY</div>
                  <div style="text-align: left;">
                    <div>Client Department:</div>
                    <div style="border-bottom: 1px solid black; margin-bottom: 8px;">${formData.clientDepartment}</div>
                    <div>Contractor:</div>
                    <div style="border-bottom: 1px solid black;">${formData.contractor}</div>
                  </div>
                </td>
                
                <td style="border: none; width: 33%;">
                  <!-- Status Legend Table -->
                  <table class="legend-table" style="float: none; width: 100%; margin-top: 0;">
                    <tr>
                      <td>B: Breakdown</td>
                      <td>S: Bad Weather</td>
                    </tr>
                    <tr>
                      <td>A: Surplus</td>
                      <td>T: Task Completed</td>
                    </tr>
                    <tr>
                      <td>W: Working Instruction</td>
                      <td>N: No Operator</td>
                    </tr>
                    <tr>
                      <td>P: Assembly/Disassemble</td>
                      <td>X: Not Required</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Labour Table Title -->
            <div style="text-align: center; border: 1px solid black; padding: 4px; font-weight: bold; margin-bottom: 5px;">Labour</div>
            
            <!-- Activity Table -->
            <table>
              <tr>
                <th>Area</th>
                <th>Location</th>
                <th>SubLocation</th>
                <th>Activity</th>
              </tr>
              
              <tr>
                <th colspan="4">Labour</th>
                <th colspan="5">Equipment</th>
                <th rowspan="2">Remarks</th>
              </tr>
              
              <tr>
                <th>Trade</th>
                <th>Code</th>
                <th>No</th>
                <th>Working Hour</th>
                <th>Type</th>
                <th>ID</th>
                <th style="text-align: center;">Working No</th>
                <th style="text-align: center;">Idle No</th>
                <th style="text-align: center;">Office Code</th>
              </tr>
              
              ${activityRows.map(row => `
                <tr>
                  <td>${row.area || ' '}</td>
                  <td>${row.location || ' '}</td>
                  <td>${row.subLocation || ' '}</td>
                  <td>${row.activity || ' '}</td>
                  <td>${row.trade || ' '}</td>
                  <td>${row.code || ' '}</td>
                  <td style="text-align: center;">${row.labourNo || ' '}</td>
                  <td style="text-align: center;">${row.workingHours || ' '}</td>
                  <td>${row.equipmentType || ' '}</td>
                  <td>${row.equipmentId || ' '}</td>
                  <td style="text-align: center;">${row.working || ' '}</td>
                  <td style="text-align: center;">${row.idle || ' '}</td>
                  <td style="text-align: center;">${row.onSite || ' '}</td>
                  <td>${row.remarks || ' '}</td>
                </tr>
              `).join('')}
            </table>
            
            <!-- Signatures Section -->
            <div style="margin-top: 30px;">
              <div style="font-size: 11px; margin-bottom: 5px;">Daily record and instruction checked and agreed</div>
              <div class="signatures">
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Project Manager Delegate</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.projectManagerName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.projectManagerDate}</div>
                </div>
                
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Contractor's Representative</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.contractorRepName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.contractorRepDate}</div>
                </div>
                
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div>Signed:</div>
                  <div><b>Supervisor</b></div>
                  <div style="margin-top: 10px;">Name/Post: ${signatures.supervisorName}</div>
                  <div style="margin-top: 10px;">Date: ${signatures.supervisorDate}</div>
                </div>
              </div>
            </div>
            
            <div class="page-number">Page 2 of 2</div>
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setStaffRows(initialData.staffData || [{ staffTitle: '', staffCount: '' }]);
      setStaffRows2(initialData.staffData2 || [{ staffTitle: '', staffCount: '' }]);
      setLabourRows(initialData.labourData || [{ labourType: '', labourCode: '', labourCount: '' }]);
      setEquipmentRows(initialData.equipmentData || [{ equipmentType: '', totalOnSite: '', working: '', idling: '' }]);
      setAssistanceRows(initialData.assistanceData || [{ description: '', workNo: '' }]);
      setActivityRows(initialData.activityData || [{ 
        area: '', 
        location: '', 
        subLocation: '', 
        activity: '',
        trade: '',
        code: '',
        labourNo: '',
        workingHours: '',
        equipmentType: '',
        equipmentId: '',
        onSite: '',
        working: '',
        idle: '',
        remarks: ''
      }]);
      setSignatures(initialData.signatures || {
        projectManagerName: '',
        projectManagerDate: '',
        contractorRepName: '',
        contractorRepDate: '',
        supervisorName: '',
        supervisorDate: ''
      });
    }
  }, [initialData]);

  return (
    <div className="w-full mx-auto bg-[#1e293b] rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-[#334155]">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-white">
          <RiFileTextLine className="inline-block mr-2" />
          {title || 'Site Diary'}
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium transition-all duration-200 hover:scale-105"
          >
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-gray-100 rounded-md shadow-md text-sm font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105"
          >
            <RiFilePdf2Line />
            Download PDF
          </button>
          
          <div className="flex gap-2">
            {[1, 2].map(page => (
              <button
                key={`page-${page}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-[#334155] text-gray-200 hover:bg-[#475569]'}`}
                onClick={() => changePage(page as 1 | 2)}
              >
                {page}
              </button>
            ))}
          </div>
          
          {!readOnly && (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md text-sm font-medium flex items-center gap-1"
            >
              <RiCheckLine />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 bg-[#f8fafc]">
        {currentPage === 1 ? (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            {/* Page 1 content */}
            <div className="site-diary-form space-y-2 print:text-black">
              {/* Header Section with 3 columns */}
              <div className="grid grid-cols-3 border-b border-gray-800">
                {/* Left column - basic info */}
                <div className="border-r border-gray-800 p-2 space-y-1">
                  <div className="flex">
                    <div className="w-32 font-semibold">Contract No.:</div>
                    <div className="flex-1 border-b border-gray-400">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none bg-transparent" 
                        value={formData.contractNo}
                        onChange={(e) => handleInputChange('contractNo', e.target.value)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-32 font-semibold">Date:</div>
                    <div className="flex-1 border-b border-gray-400">
                      <input 
                        type="date" 
                        className="w-full border-none outline-none bg-transparent" 
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-32 font-semibold">Day:</div>
                    <div className="flex-1 border-b border-gray-400">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none bg-transparent" 
                        value={formData.day}
                        onChange={(e) => handleInputChange('day', e.target.value)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-32 font-semibold">Contract Date:</div>
                    <div className="flex-1 border-b border-gray-400">
                      <input 
                        type="date" 
                        className="w-full border-none outline-none bg-transparent" 
                        value={formData.contractDate}
                        onChange={(e) => handleInputChange('contractDate', e.target.value)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="w-32 font-semibold">{formData.toBeInsert}</div>
                    <div className="flex-1 border-b border-gray-400">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none bg-transparent"
                        value=""
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                {/* Middle Column - Title */}
                <div className="flex flex-col items-center justify-center border-r border-gray-800 p-2">
                  <div className="text-xl font-bold mb-4">SITE DIARY</div>
                  <div className="w-full">
                    <div className="font-semibold mb-1">Client Department:</div>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-400 outline-none bg-transparent mb-3" 
                      value={formData.clientDepartment}
                      onChange={(e) => handleInputChange('clientDepartment', e.target.value)}
                      readOnly={readOnly}
                    />
                    
                    <div className="font-semibold mb-1">Contractor:</div>
                    <input 
                      type="text" 
                      className="w-full border-b border-gray-400 outline-none bg-transparent" 
                      value={formData.contractor}
                      onChange={(e) => handleInputChange('contractor', e.target.value)}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
                
                {/* Right Column - Weather info and Status Legend in a row */}
                <div className="p-2">
                  <div className="flex">
                    {/* Weather information */}
                    <div className="flex-1 space-y-1 mr-2">
                      <div className="flex">
                        <div className="w-32 font-semibold">Weather (A.M.):</div>
                        <div className="flex-1 border-b border-gray-400">
                          <input 
                            type="text" 
                            className="w-full border-none outline-none bg-transparent" 
                            value={formData.weatherAM}
                            onChange={(e) => handleInputChange('weatherAM', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="w-32 font-semibold">Weather (P.M.):</div>
                        <div className="flex-1 border-b border-gray-400">
                          <input 
                            type="text" 
                            className="w-full border-none outline-none bg-transparent" 
                            value={formData.weatherPM}
                            onChange={(e) => handleInputChange('weatherPM', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="w-32 font-semibold">Rainfall (mm):</div>
                        <div className="flex-1 border-b border-gray-400">
                          <input 
                            type="number" 
                            className="w-full border-none outline-none bg-transparent" 
                            value={formData.rainfall}
                            onChange={(e) => handleInputChange('rainfall', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex">
                        <div className="w-32 font-semibold">Signal:</div>
                        <div className="flex-1 border-b border-gray-400">
                          <input 
                            type="text" 
                            className="w-full border-none outline-none bg-transparent" 
                            value={formData.signal}
                            onChange={(e) => handleInputChange('signal', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Legend table to the right */}
                    <div className="w-64">
                      <table className="border border-gray-800 text-xs w-full">
                        <tbody>
                          <tr>
                            <td className="border border-gray-800 p-1">B: Breakdown</td>
                            <td className="border border-gray-800 p-1">S: Bad Weather</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-800 p-1">A: Surplus</td>
                            <td className="border border-gray-800 p-1">T: Task Completed</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-800 p-1">W: Working Instruction</td>
                            <td className="border border-gray-800 p-1">N: No Operator</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-800 p-1">P: Assembly/Disassemble</td>
                            <td className="border border-gray-800 p-1">X: Not Required</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Table Grid */}
              <div className="grid grid-cols-16 border border-gray-800">
                {/* Instructions column */}
                <div className="col-span-4 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Instructions</div>
                  <textarea 
                    className="w-full p-1 h-20 border-none outline-none bg-transparent resize-none"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                  ></textarea>
                  
                  <div className="text-center border-y border-gray-800 p-1 font-semibold">Comments</div>
                  <textarea 
                    className="w-full p-1 h-20 border-none outline-none bg-transparent resize-none"
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                  ></textarea>
                  
                  <div className="text-center border-y border-gray-800 p-1 font-semibold">Utilities</div>
                  <textarea 
                    className="w-full p-1 h-20 border-none outline-none bg-transparent resize-none"
                    value={formData.utilities}
                    onChange={(e) => handleInputChange('utilities', e.target.value)}
                  ></textarea>
                  
                  <div className="text-center border-y border-gray-800 p-1 font-semibold">Visitor</div>
                  <textarea 
                    className="w-full p-1 h-20 border-none outline-none bg-transparent resize-none"
                    value={formData.visitor}
                    onChange={(e) => handleInputChange('visitor', e.target.value)}
                  ></textarea>
                  
                  <div className="text-center border-y border-gray-800 p-1 font-semibold">Remarks</div>
                  <textarea 
                    className="w-full p-1 h-20 border-none outline-none bg-transparent resize-none"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                  ></textarea>
                </div>
                
                {/* Staff column 1 */}
                <div className="col-span-3 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Contractor's Site Staff</div>
                  <div className="p-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 border border-gray-800 text-left">Staff</th>
                          <th className="p-1 border border-gray-800 text-center w-12">No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffRows.map((row, index) => (
                          <tr key={`staff-${index}`}>
                            <td className="border border-gray-800 p-1 h-6">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent"
                                value={row.staffTitle}
                                onChange={(e) => handleStaffRowChange(index, 'staffTitle', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center"
                                value={row.staffCount}
                                onChange={(e) => handleStaffRowChange(index, 'staffCount', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between mt-1">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={addStaffRow}
                      >
                        + Add Row
                      </button>
                      {staffRows.length > 1 && (
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => removeStaffRow(staffRows.length - 1)}
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Staff column 2 */}
                <div className="col-span-3 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Contractor's Site Staff</div>
                  <div className="p-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 border border-gray-800 text-left">Staff</th>
                          <th className="p-1 border border-gray-800 text-center w-12">No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffRows2.map((row, index) => (
                          <tr key={`staff2-${index}`}>
                            <td className="border border-gray-800 p-1 h-6">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent"
                                value={row.staffTitle}
                                onChange={(e) => handleStaffRow2Change(index, 'staffTitle', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center"
                                value={row.staffCount}
                                onChange={(e) => handleStaffRow2Change(index, 'staffCount', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between mt-1">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={addStaffRow2}
                      >
                        + Add Row
                      </button>
                      {staffRows2.length > 1 && (
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => removeStaffRow2(staffRows2.length - 1)}
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Labour column */}
                <div className="col-span-3 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Labour</div>
                  <div className="p-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 border border-gray-800 text-left w-2/5">Type</th>
                          <th className="p-1 border border-gray-800 text-center w-3/10">Code</th>
                          <th className="p-1 border border-gray-800 text-center w-3/10">No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labourRows.map((row, index) => (
                          <tr key={`labour-${index}`}>
                            <td className="border border-gray-800 p-1 h-6">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent"
                                value={row.labourType}
                                onChange={(e) => handleLabourRowChange(index, 'labourType', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center"
                                value={row.labourCode}
                                onChange={(e) => handleLabourRowChange(index, 'labourCode', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center"
                                value={row.labourCount}
                                onChange={(e) => handleLabourRowChange(index, 'labourCount', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between mt-1">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={addLabourRow}
                      >
                        + Add Row
                      </button>
                      {labourRows.length > 1 && (
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => removeLabourRow(labourRows.length - 1)}
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Equipment columns - simplified layout with no scrolling */}
                <div className="col-span-3">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Equipment</div>
                  <div className="p-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1 border border-gray-800 text-left" style={{width: '40%'}}>Type</th>
                          <th className="p-1 border border-gray-800 text-center" style={{width: '20%'}}>Total</th>
                          <th className="p-1 border border-gray-800 text-center" style={{width: '20%'}}>Work</th>
                          <th className="p-1 border border-gray-800 text-center" style={{width: '20%'}}>Idle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentRows.map((row, index) => (
                          <tr key={`equipment-${index}`}>
                            <td className="border border-gray-800 p-1 h-6">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-sm"
                                value={row.equipmentType}
                                onChange={(e) => handleEquipmentRowChange(index, 'equipmentType', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center text-sm"
                                value={row.totalOnSite}
                                onChange={(e) => handleEquipmentRowChange(index, 'totalOnSite', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center text-sm"
                                value={row.working}
                                onChange={(e) => handleEquipmentRowChange(index, 'working', e.target.value)}
                              />
                            </td>
                            <td className="border border-gray-800 p-1 text-center">
                              <input 
                                type="text"
                                className="w-full border-none outline-none bg-transparent text-center text-sm"
                                value={row.idling}
                                onChange={(e) => handleEquipmentRowChange(index, 'idling', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between mt-1">
                      <button
                        className="text-blue-600 text-xs"
                        onClick={addEquipmentRow}
                      >
                        + Add Row
                      </button>
                      {equipmentRows.length > 1 && (
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => removeEquipmentRow(equipmentRows.length - 1)}
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Assistance to Supervising Officer */}
              <div className="border border-gray-800 border-t-0">
                <div className="text-center border-b border-gray-800 p-1 font-semibold">Assistance to Supervising Officer</div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1 border border-gray-800 text-left w-5/6">Description</th>
                      <th className="p-1 border border-gray-800 text-center w-1/6">Work No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistanceRows.map((row, index) => (
                      <tr key={`assistance-${index}`}>
                        <td className="border border-gray-800 p-1 h-6">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent"
                            value={row.description}
                            onChange={(e) => handleAssistanceRowChange(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-800 p-1 text-center">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent text-center"
                            value={row.workNo}
                            onChange={(e) => handleAssistanceRowChange(index, 'workNo', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between mt-1">
                  <button
                    className="text-blue-600 text-xs"
                    onClick={addAssistanceRow}
                  >
                    + Add Row
                  </button>
                  {assistanceRows.length > 1 && (
                    <button
                      className="text-red-600 text-xs"
                      onClick={() => removeAssistanceRow(assistanceRows.length - 1)}
                    >
                      - Remove
                    </button>
                  )}
                </div>
              </div>
              
              {/* Totals row */}
              <div className="grid grid-cols-12 border border-gray-800 border-t-0">
                <div className="col-span-4 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Total</div>
                  <div className="h-10 p-1"></div>
                </div>
                <div className="col-span-4 border-r border-gray-800">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Total Labour</div>
                  <div className="h-10 p-1"></div>
                </div>
                <div className="col-span-4">
                  <div className="text-center border-b border-gray-800 p-1 font-semibold">Total Equipment</div>
                  <div className="h-10 p-1"></div>
                </div>
              </div>
              
              {/* Signatures section */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {/* Project Manager */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Project Manager Delegate</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.projectManagerName}
                      onChange={(e) => handleSignatureChange('projectManagerName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.projectManagerDate}
                      onChange={(e) => handleSignatureChange('projectManagerDate', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Contractor's Representative */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Contractor's Representative</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.contractorRepName}
                      onChange={(e) => handleSignatureChange('contractorRepName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.contractorRepDate}
                      onChange={(e) => handleSignatureChange('contractorRepDate', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Supervisor */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Supervisor</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.supervisorName}
                      onChange={(e) => handleSignatureChange('supervisorName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.supervisorDate}
                      onChange={(e) => handleSignatureChange('supervisorDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Daily record statement */}
              <div className="mt-4 text-sm">
                <div>Daily record and instruction checked and agreed</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            {/* Page 2 content */}
            <div className="site-diary-form space-y-2 print:text-black">
              {/* Header Section */}
              <div className="grid grid-cols-1 border-b border-gray-800 pb-2">
                {/* Top header info */}
                <div className="grid grid-cols-3 mb-4">
                  {/* Left column - basic info */}
                  <div className="space-y-1">
                    <div className="flex">
                      <div className="w-32 font-semibold">Contract No.:</div>
                      <div className="flex-1 border-b border-gray-400">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none bg-transparent" 
                          value={formData.contractNo}
                          onChange={(e) => handleInputChange('contractNo', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-32 font-semibold">Date:</div>
                      <div className="flex-1 border-b border-gray-400">
                        <input 
                          type="date" 
                          className="w-full border-none outline-none bg-transparent" 
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-32 font-semibold">Day:</div>
                      <div className="flex-1 border-b border-gray-400">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none bg-transparent" 
                          value={formData.day}
                          onChange={(e) => handleInputChange('day', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-32 font-semibold">Contract Date:</div>
                      <div className="flex-1 border-b border-gray-400">
                        <input 
                          type="date" 
                          className="w-full border-none outline-none bg-transparent" 
                          value={formData.contractDate}
                          onChange={(e) => handleInputChange('contractDate', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-32 font-semibold">{formData.toBeInsert}</div>
                      <div className="flex-1 border-b border-gray-400">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none bg-transparent"
                          value=""
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Middle Column - Title */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-xl font-bold mb-4">SITE DIARY</div>
                    <div className="w-full">
                      <div className="font-semibold mb-1">Client Department:</div>
                      <input 
                        type="text" 
                        className="w-full border-b border-gray-400 outline-none bg-transparent mb-3" 
                        value={formData.clientDepartment}
                        onChange={(e) => handleInputChange('clientDepartment', e.target.value)}
                        readOnly={readOnly}
                      />
                      
                      <div className="font-semibold mb-1">Contractor:</div>
                      <input 
                        type="text" 
                        className="w-full border-b border-gray-400 outline-none bg-transparent" 
                        value={formData.contractor}
                        onChange={(e) => handleInputChange('contractor', e.target.value)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  {/* Right Column - Legend */}
                  <div className="p-2">
                    <table className="border border-gray-800 text-xs w-full">
                      <tbody>
                        <tr>
                          <td className="border border-gray-800 p-1">B: Breakdown</td>
                          <td className="border border-gray-800 p-1">S: Bad Weather</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-800 p-1">A: Surplus</td>
                          <td className="border border-gray-800 p-1">T: Task Completed</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-800 p-1">W: Working Instruction</td>
                          <td className="border border-gray-800 p-1">N: No Operator</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-800 p-1">P: Assembly/Disassemble</td>
                          <td className="border border-gray-800 p-1">X: Not Required</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Main Activity Table Grid */}
              <div className="border border-gray-800 mt-2">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 p-1 text-center">Area</th>
                      <th className="border border-gray-800 p-1 text-center">Location</th>
                      <th className="border border-gray-800 p-1 text-center">SubLocation</th>
                      <th className="border border-gray-800 p-1 text-center">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityRows.map((row, index) => (
                      <tr key={`activity-${index}`}>
                        <td className="border border-gray-800 p-1">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent"
                            value={row.area}
                            onChange={(e) => handleActivityRowChange(index, 'area', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-800 p-1">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent"
                            value={row.location}
                            onChange={(e) => handleActivityRowChange(index, 'location', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-800 p-1">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent"
                            value={row.subLocation}
                            onChange={(e) => handleActivityRowChange(index, 'subLocation', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-800 p-1">
                          <input 
                            type="text"
                            className="w-full border-none outline-none bg-transparent"
                            value={row.activity}
                            onChange={(e) => handleActivityRowChange(index, 'activity', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Signatures Section */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {/* Project Manager */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Project Manager Delegate</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.projectManagerName}
                      onChange={(e) => handleSignatureChange('projectManagerName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.projectManagerDate}
                      onChange={(e) => handleSignatureChange('projectManagerDate', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Contractor's Representative */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Contractor's Representative</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.contractorRepName}
                      onChange={(e) => handleSignatureChange('contractorRepName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.contractorRepDate}
                      onChange={(e) => handleSignatureChange('contractorRepDate', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Supervisor */}
                <div className="text-center">
                  <div className="mb-2">Signed:</div>
                  <div className="border-b border-gray-800 h-16 mb-2"></div>
                  <div className="italic mb-2">Supervisor</div>
                  <div className="text-left">
                    <div className="mb-2">Name/Post:</div>
                    <input 
                      type="text"
                      className="w-full border-b border-gray-800 outline-none bg-transparent mb-4"
                      value={signatures.supervisorName}
                      onChange={(e) => handleSignatureChange('supervisorName', e.target.value)}
                    />
                    <div className="mb-2">Date:</div>
                    <input 
                      type="date"
                      className="w-full border-b border-gray-800 outline-none bg-transparent"
                      value={signatures.supervisorDate}
                      onChange={(e) => handleSignatureChange('supervisorDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Daily record statement */}
              <div className="mt-4 text-sm">
                <div>Daily record and instruction checked and agreed</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-t border-[#334155] flex justify-end items-center">
        <div className="text-xs text-gray-400">
          Page {currentPage} of 2
        </div>
      </div>
    </div>
  );
}; 