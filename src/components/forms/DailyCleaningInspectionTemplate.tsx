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
  RiDownload2Line,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiFilePdf2Line,
  RiCheckLine,
  RiCloseLine,
  RiCamera2Line,
  RiTimeLine
} from 'react-icons/ri';

interface DailyCleaningInspectionTemplateProps {
  onClose: () => void;
  onSave: (formData: any) => void;
}

// Define status option types
type StatusType = 'S' | 'X' | 'NA' | '';

// Checklist item interface
interface ChecklistItem {
  id: number;
  description: string;
  chinese: string;
  status: StatusType;
  action: string;
  remark: string;
  photo: boolean;
}

// Photo interface
interface Photo {
  id: number;
  dataUrl: string | null;
}

export const DailyCleaningInspectionTemplate: React.FC<DailyCleaningInspectionTemplateProps> = ({
  onClose,
  onSave
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  
  // Form data
  const [formData, setFormData] = useState({
    contractNo: '',
    contractTitle: '',
    location: '',
    inspectionNo: '',
    inspectionDate: '',
    timeWeek: '',
    inspectionTime: '',
    
    // Inspector information
    inspectorName: '',
    appointedBy: '',
    techManager: '',
    date: '',
    
    // Site signatures
    erSignature: '',
    erDate: '',
    siteAgentSignature: '',
    siteAgentDate: '',
    projectManagerSignature: '',
    projectManagerDate: ''
  });
  
  // Checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: 1, description: 'Maintenance of passageways, common accesses & public areas are free of obstruction', chinese: '保持通道，公共通道及公眾地方沒有阻礙', status: '', action: '', remark: '', photo: false },
    { id: 2, description: 'Proper storage & stacking of materials', chinese: '物料存放規固及適當疊存', status: '', action: '', remark: '', photo: false },
    { id: 3, description: 'Proper placement & storage of tools & equipment after work', chinese: '工具和設備在每日完工後適當地放置及儲存', status: '', action: '', remark: '', photo: false },
    { id: 4, description: 'Proper sorting, storage and/or disposal of waste materials in accordance with WMP', chinese: '根據廢物處理計劃書將廢物適當分類，儲存和/或處置', status: '', action: '', remark: '', photo: false },
    { id: 5, description: 'Proper securing of hoarding, barriers, guarding, lighting and signage of Works', chinese: '適供保護及確固的圍街板，圍欄，防護網和照明及現場指示標誌', status: '', action: '', remark: '', photo: false },
    { id: 6, description: 'Prevention & removal of water ponds and flooding', chinese: '防止及清除積水及水浸', status: '', action: '', remark: '', photo: false },
    { id: 7, description: 'Cleaning of stockpiling and wastes arising from the Works', chinese: '清理因工程堆積過多的廢料', status: '', action: '', remark: '', photo: false },
    { id: 8, description: 'Condition of cleanliness and tidiness of the site including Public Cleaning Area in the perspective of the general public', chinese: '地盤整圓包括會對公眾構成影響的地方之清潔和整潔狀況', status: '', action: '', remark: '', photo: false },
    { id: 9, description: 'Control of mosquitoes and removal of stagnant water', chinese: '控制蚊蟲孳生及清除積水', status: '', action: '', remark: '', photo: false },
    { id: 10, description: 'Keep Traffic Cone clean and in orderly manner', chinese: '保持警程標筒之整潔', status: '', action: '', remark: '', photo: false },
    { id: 11, description: 'Other Cleaning requirements as instructed by RE', chinese: '駐地盤工程師其他清潔指示', status: '', action: '', remark: '', photo: false }
  ]);
  
  // Photos
  const [photos, setPhotos] = useState<Photo[]>([
    { id: 1, dataUrl: null },
    { id: 2, dataUrl: null },
    { id: 3, dataUrl: null }
  ]);
  
  // Handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleStatusChange = (id: number, status: StatusType) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, status } : item
      )
    );
  };
  
  const handleActionChange = (id: number, action: string) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, action } : item
      )
    );
  };

  const handleRemarkChange = (id: number, remark: string) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, remark } : item
      )
    );
  };

  const handlePhotoToggle = (id: number) => {
    setChecklistItems(
      checklistItems.map(item => 
        item.id === id ? { ...item, photo: !item.photo } : item
      )
    );
  };
  
  const handlePhotoUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const target = event.target as FileReader;
        if (target && target.result) {
          setPhotos(
            photos.map(photo => 
              photo.id === id ? { ...photo, dataUrl: target.result as string } : photo
            )
          );
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const changePage = (pageNumber: 1 | 2) => {
    setCurrentPage(pageNumber);
  };
  
  const handleSave = () => {
    const completeFormData = {
      ...formData,
      checklistItems,
      photos
    };
    onSave(completeFormData);
  };
  
  // PDF Generation
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
          <title>Daily Cleaning Inspection Checklist</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: black;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid black;
              padding: 5px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f2f2f2;
            }
            .page-break {
              page-break-before: always;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              font-weight: bold;
              font-size: 16px;
            }
            .photo-table {
              height: 200px;
            }
            .photo-cell {
              width: 33.33%;
              height: 200px;
              vertical-align: top;
              text-align: center;
            }
            img.photo {
              max-width: 100%;
              max-height: 180px;
              display: block;
              margin: 0 auto;
            }
            .signature-line {
              border-top: 1px solid black;
              margin-top: 30px;
              width: 200px;
              display: inline-block;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
            input {
              background: transparent;
              border: none;
            }
            .input-field {
              min-height: 20px;
              border-bottom: 1px solid #ccc;
            }
            .radio-button {
              display: inline-block;
              margin-right: 15px;
            }
            .radio-label {
              margin-left: 5px;
            }
          </style>
        </head>
        <body>
          <!-- Page 1 -->
          <div class="page">
            <div class="header">Daily Cleaning Inspection Checklist</div>
            
            <table>
              <tr>
                <td>Contract No:</td>
                <td>${formData.contractNo}</td>
                <td>Inspection No.檢查編號:</td>
                <td>${formData.inspectionNo}</td>
              </tr>
              <tr>
                <td>Contract Title:</td>
                <td>${formData.contractTitle}</td>
                <td>Inspection Date檢查日期:</td>
                <td>${formData.inspectionDate}</td>
              </tr>
              <tr>
                <td>Location:</td>
                <td>${formData.location}</td>
                <td>Time時間:</td>
                <td>${formData.timeWeek}</td>
              </tr>
              <tr>
                <td colspan="2"></td>
                <td>Inspection Time 檢查時間:</td>
                <td>${formData.inspectionTime}</td>
              </tr>
            </table>
            
            <table>
              <tr>
                <th>Items to be checked<br/>檢查項目</th>
                <th>Inspection Time<br/>檢查時間</th>
                <th>Photo<br/>照片<br/>(Y有/N無)</th>
                <th>Remark<br/>備註</th>
              </tr>
              ${checklistItems.map(item => `
                <tr>
                  <td>${item.id}. ${item.description}<br/>${item.chinese}</td>
                  <td>
                    <div>Status:</div>
                    <div class="radio-container">
                      <div class="radio-button">
                        <input type="radio" ${item.status === 'S' ? 'checked' : ''} /> <span class="radio-label">S</span>
                      </div>
                      <div class="radio-button">
                        <input type="radio" ${item.status === 'X' ? 'checked' : ''} /> <span class="radio-label">X</span>
                      </div>
                      <div class="radio-button">
                        <input type="radio" ${item.status === 'NA' ? 'checked' : ''} /> <span class="radio-label">NA</span>
                      </div>
                    </div>
                    <div style="margin-top: 5px;">Action:</div>
                    <div class="input-field">${item.action || ''}</div>
                  </td>
                  <td style="text-align: center;">
                    <input type="checkbox" ${item.photo ? 'checked' : ''} />
                  </td>
                  <td>${item.remark || ''}</td>
                </tr>
              `).join('')}
            </table>
            
            <div style="margin-top: 20px; font-size: 12px;">
              <div>Status Legend (檢查結果代號):</div>
              <div>( S ): Satisfactory (可接受)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;( X ): Need Improvement (需要改善，再檢查)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;( NA ): Not Applicable (不適用)</div>
              
              <div style="margin-top: 15px;">
                <div>Name of Inspector:</div>
                <div>檢查人員姓名: ${formData.inspectorName}</div>
                
                <div style="margin-top: 10px; display: flex; justify-content: space-between;">
                  <div style="width: 30%;">
                    <div>(Appointed person by</div>
                    <div>(${formData.appointedBy}) Technical Manager</div>
                    <div style="margin-top: 10px;">Date:</div>
                    <div>日期: ${formData.date}</div>
                  </div>
                  
                  <div style="width: 40%; text-align: center;">
                    <div>Joint site inspection before the noon of the day following the cleaning day</div>
                    <div>於清潔日之翌日中午前進行聯合地盤視察</div>
                    <div style="margin-top: 20px;">
                      <div>(${formData.erSignature})</div>
                      <div>(ER 工程師代表)</div>
                      <div>(Date 日期: ${formData.erDate})</div>
                    </div>
                  </div>
                  
                  <div style="width: 30%; text-align: right;">
                    <div style="margin-right: 70px;">(Site Agent 地盤代表)</div>
                    <div style="margin-top: 20px; margin-right: 70px;">
                      <div>(${formData.siteAgentSignature})</div>
                      <div>Project Manager</div>
                      <div>(Date 日期: ${formData.siteAgentDate})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Page 2 -->
          <div class="page-break"></div>
          <div class="page">
            <div class="header">Daily Cleaning Inspection Checklist</div>
            <div style="text-align: center; margin-bottom: 10px;">
              <div>Inspection No.檢查編號: ${formData.inspectionNo}</div>
              <div>Inspection Date檢查日期: ${formData.inspectionDate}</div>
            </div>
            
            <table class="photo-table">
              <tr>
                <th>Photo 1</th>
                <th>Photo 2</th>
                <th>Photo 3</th>
              </tr>
              <tr style="height: 200px;">
                <td class="photo-cell">
                  ${photos[0].dataUrl ? `<img class="photo" src="${photos[0].dataUrl}" alt="Photo 1" />` : ''}
                </td>
                <td class="photo-cell">
                  ${photos[1].dataUrl ? `<img class="photo" src="${photos[1].dataUrl}" alt="Photo 2" />` : ''}
                </td>
                <td class="photo-cell">
                  ${photos[2].dataUrl ? `<img class="photo" src="${photos[2].dataUrl}" alt="Photo 3" />` : ''}
                </td>
              </tr>
            </table>
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

  return (
    <div className="w-full max-w-[95vw] mx-auto bg-[#1e293b] rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden border border-[#334155]">
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <RiFileTextLine className="mr-2 text-blue-400" />
          Daily Cleaning Inspection Checklist
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
        {currentPage === 1 ? (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            {/* Page 1 Content - Inspection Checklist */}
            <div className="space-y-4 bg-white text-black p-4 rounded-lg shadow-md">
              {/* Header section */}
              <div className="text-center font-bold text-lg mb-4">
                Daily Cleaning Inspection Checklist
              </div>
              
              {/* Basic information section - table layout */}
              <div className="border border-gray-800 rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 p-2 w-1/6 font-semibold">Contract No:</td>
                      <td className="border border-gray-800 p-2 w-1/3">
                        <input 
                          className="w-full bg-white text-black border border-gray-300 rounded p-2"
                          value={formData.contractNo}
                          onChange={(e) => handleInputChange('contractNo', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-2 w-1/6 font-semibold">Inspection No.檢查編號:</td>
                      <td className="border border-gray-800 p-2 w-1/3">
                        <input 
                          className="w-full bg-white text-black border border-gray-300 rounded p-2"
                          value={formData.inspectionNo}
                          onChange={(e) => handleInputChange('inspectionNo', e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 p-2 font-semibold">Contract Title:</td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          className="w-full bg-white text-black border border-gray-300 rounded p-2"
                          value={formData.contractTitle}
                          onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-2 font-semibold">Inspection Date檢查日期:</td>
                      <td className="border border-gray-800 p-2">
                        <div className="flex items-center">
                          <input 
                            type="date"
                            className="w-full bg-white text-black border border-gray-300 rounded p-2"
                            value={formData.inspectionDate}
                            onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                          />
                          <span className="ml-2 text-black">
                            <RiCalendarLine />
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 p-2 font-semibold">Location:</td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          className="w-full bg-white text-black border border-gray-300 rounded p-2"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-800 p-2 font-semibold">Time時間:</td>
                      <td className="border border-gray-800 p-2">
                        <input 
                          className="w-full bg-white text-black border border-gray-300 rounded p-2"
                          value={formData.timeWeek}
                          onChange={(e) => handleInputChange('timeWeek', e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-800 p-2" colSpan={2}></td>
                      <td className="border border-gray-800 p-2 font-semibold">Inspection Time 檢查時間:</td>
                      <td className="border border-gray-800 p-2">
                        <div className="flex items-center">
                          <input 
                            type="time"
                            className="w-full bg-white text-black border border-gray-300 rounded p-2"
                            value={formData.inspectionTime}
                            onChange={(e) => handleInputChange('inspectionTime', e.target.value)}
                          />
                          <span className="ml-2 text-black">
                            <RiTimeLine />
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Checklist table */}
              <div className="border border-gray-800 rounded overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 p-2 text-center w-2/5">
                        Items to be checked<br/>檢查項目
                      </th>
                      <th className="border border-gray-800 p-2 text-center w-1/5">
                        Inspection Time<br/>檢查時間
                      </th>
                      <th className="border border-gray-800 p-2 text-center w-1/6">
                        Photo<br/>照片<br/>(Y有/N無)
                      </th>
                      <th className="border border-gray-800 p-2 text-center w-1/5">
                        Remark<br/>備註
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklistItems.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-800 p-2 align-top">
                          {item.id}. {item.description}
                          <br />
                          <span className="text-xs">{item.chinese}</span>
                        </td>
                        <td className="border border-gray-800 p-2">
                          <div className="mb-2">
                            <div className="font-semibold">Status:</div>
                            <div className="flex items-center mt-1 space-x-4">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id={`status-s-${item.id}`}
                                  name={`status-${item.id}`}
                                  className="mr-1 h-4 w-4"
                                  checked={item.status === 'S'}
                                  onChange={() => handleStatusChange(item.id, 'S')}
                                />
                                <label htmlFor={`status-s-${item.id}`}>S</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id={`status-x-${item.id}`}
                                  name={`status-${item.id}`}
                                  className="mr-1 h-4 w-4"
                                  checked={item.status === 'X'}
                                  onChange={() => handleStatusChange(item.id, 'X')}
                                />
                                <label htmlFor={`status-x-${item.id}`}>X</label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id={`status-na-${item.id}`}
                                  name={`status-${item.id}`}
                                  className="mr-1 h-4 w-4"
                                  checked={item.status === 'NA'}
                                  onChange={() => handleStatusChange(item.id, 'NA')}
                                />
                                <label htmlFor={`status-na-${item.id}`}>NA</label>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="font-semibold">Action:</div>
                            <div className="mt-1">
                              <textarea
                                value={item.action}
                                onChange={(e) => handleActionChange(item.id, e.target.value)}
                                className="w-full bg-white text-black border border-gray-300 rounded p-2 resize-none"
                                style={{ minHeight: '60px' }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-800 p-2 text-center">
                          <div className="flex justify-center items-center h-full">
                            <div className="h-6 w-6 border-2 border-blue-500 bg-white flex items-center justify-center cursor-pointer"
                                 onClick={() => handlePhotoToggle(item.id)}>
                              {item.photo && (
                                <div className="h-4 w-4 bg-blue-500 text-white flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={item.photo}
                              onChange={() => handlePhotoToggle(item.id)}
                              className="hidden"
                            />
                          </div>
                        </td>
                        <td className="border border-gray-800 p-2">
                          <textarea
                            value={item.remark}
                            onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                            className="w-full bg-white text-black border border-gray-300 rounded p-2 resize-none"
                            style={{ minHeight: '60px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Status legend */}
              <div className="mt-4 text-sm">
                <div className="font-semibold">Status Legend (檢查結果代號):</div>
                <div className="flex space-x-4 mt-1">
                  <div>( S ): Satisfactory (可接受)</div>
                  <div>( X ): Need Improvement (需要改善，再檢查)</div>
                  <div>( NA ): Not Applicable (不適用)</div>
                </div>
              </div>
              
              {/* Inspector information */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <div className="mb-2">
                    <div className="font-semibold mb-1">Name of Inspector:</div>
                    <div>檢查人員姓名:</div>
                    <input
                      value={formData.inspectorName}
                      onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded p-2 bg-white text-black"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div>(Appointed person by</div>
                    <input
                      value={formData.appointedBy}
                      onChange={(e) => handleInputChange('appointedBy', e.target.value)}
                      className="w-full mt-1 mb-1 border border-gray-300 rounded p-2 bg-white text-black"
                    />
                    <div>) Technical Manager</div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="mb-1">Date:</div>
                    <div>日期:</div>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded p-2 bg-white text-black"
                    />
                  </div>
                </div>
                
                <div className="text-center border-l border-r border-gray-300 px-4">
                  <div className="mb-4 text-sm">
                    <div>Joint site inspection before the noon of the day following the cleaning day</div>
                    <div>於清潔日之翌日中午前進行聯合地盤視察</div>
                  </div>
                  
                  <div className="mt-8">
                    <div>
                      <input
                        value={formData.erSignature}
                        onChange={(e) => handleInputChange('erSignature', e.target.value)}
                        className="w-full bg-white text-black p-2 border-t border-gray-800 border-x-0 border-b-0"
                        placeholder="Signature"
                      />
                    </div>
                    <div className="mt-1">(ER 工程師代表)</div>
                    <div className="mt-1">
                      <input
                        type="date"
                        value={formData.erDate}
                        onChange={(e) => handleInputChange('erDate', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 bg-white text-black"
                      />
                      <div>(Date 日期)</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="mb-2">(Site Agent 地盤代表)</div>
                  
                  <div className="mt-8">
                    <div>
                      <input
                        value={formData.siteAgentSignature}
                        onChange={(e) => handleInputChange('siteAgentSignature', e.target.value)}
                        className="w-full bg-white text-black p-2 border-t border-gray-800 border-x-0 border-b-0"
                        placeholder="Signature"
                      />
                    </div>
                    <div className="mt-1">Project Manager</div>
                    <div className="mt-1">
                      <input
                        type="date"
                        value={formData.siteAgentDate}
                        onChange={(e) => handleInputChange('siteAgentDate', e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 bg-white text-black"
                      />
                      <div>(Date 日期)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white text-black p-6 rounded-lg border border-gray-200 shadow-md">
            {/* Page 2 Content - Photo Evidence */}
            <div className="text-center font-bold text-lg mb-4">
              Daily Cleaning Inspection Checklist
            </div>
            
            <div className="text-center mb-4">
              <div className="mb-2">
                <span className="font-semibold">Inspection No.檢查編號: </span>
                <span>{formData.inspectionNo}</span>
              </div>
              <div>
                <span className="font-semibold">Inspection Date檢查日期: </span>
                <span>{formData.inspectionDate}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-800 aspect-square flex flex-col items-center justify-center">
                <div className="font-semibold mb-2">Photo 1</div>
                {photos[0].dataUrl ? (
                  <img 
                    src={photos[0].dataUrl} 
                    alt="Photo 1" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <IconContext.Provider value={{ size: '2em' }}>
                      <RiCamera2Line />
                    </IconContext.Provider>
                    <label className="cursor-pointer mt-2 bg-ai-blue/20 hover:bg-ai-blue/40 transition-colors py-1 px-3 rounded text-sm">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(1, e)}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <div className="border border-gray-800 aspect-square flex flex-col items-center justify-center">
                <div className="font-semibold mb-2">Photo 2</div>
                {photos[1].dataUrl ? (
                  <img 
                    src={photos[1].dataUrl} 
                    alt="Photo 2" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <IconContext.Provider value={{ size: '2em' }}>
                      <RiCamera2Line />
                    </IconContext.Provider>
                    <label className="cursor-pointer mt-2 bg-ai-blue/20 hover:bg-ai-blue/40 transition-colors py-1 px-3 rounded text-sm">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(2, e)}
                      />
                    </label>
                  </div>
                )}
              </div>
              
              <div className="border border-gray-800 aspect-square flex flex-col items-center justify-center">
                <div className="font-semibold mb-2">Photo 3</div>
                {photos[2].dataUrl ? (
                  <img 
                    src={photos[2].dataUrl} 
                    alt="Photo 3" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <IconContext.Provider value={{ size: '2em' }}>
                      <RiCamera2Line />
                    </IconContext.Provider>
                    <label className="cursor-pointer mt-2 bg-ai-blue/20 hover:bg-ai-blue/40 transition-colors py-1 px-3 rounded text-sm">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(3, e)}
                      />
                    </label>
                  </div>
                )}
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