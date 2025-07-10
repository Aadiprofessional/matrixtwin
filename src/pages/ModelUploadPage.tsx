import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RiUpload2Line, 
  RiArrowLeftLine,
  RiFileWarningLine,
  RiCheckLine,
  RiFileList3Line,
  RiTimeLine,
  RiLoader4Line,
  RiErrorWarningLine
} from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.ifc', '.nwd', '.rvt'];

// Building types for the dropdown selection
const BUILDING_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Infrastructure',
  'Educational',
  'Healthcare',
  'Mixed-Use',
  'Other'
];

// MatrixBIM API endpoints
const API_BASE_URL = 'https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/bimface';
const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`;
const STATUS_ENDPOINT = `${API_BASE_URL}/status`;

// Interface for job status response
interface JobStatus {
  success: boolean;
  jobId: string;
  fileId: string;
  status: string;
  currentStep: string;
  progress: number;
  steps: {
    tokenGeneration: {
      status: string;
      data: {
        token?: string;
      } | null;
    };
    fileUpload: {
      status: string;
      data: any | null;
    };
    translation: {
      status: string;
      data: any | null;
    };
  };
  result: {
    fileId?: number;
    name?: string;
    token?: string;
    uploadData?: any;
    translationData?: any;
    databagId?: string;
    thumbnails?: string[];
    viewerUrl?: string;
    userId?: string;
    projectId?: string;
    userName?: string;
    fileUrl?: string;
  } | null;
  error: string | null;
}

const ModelUploadPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // State variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [buildingType, setBuildingType] = useState<string>(BUILDING_TYPES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Job status tracking
  const [jobId, setJobId] = useState<number | null>(null);
  const [statusData, setStatusData] = useState<JobStatus | null>(null);
  const [statusPolling, setStatusPolling] = useState<boolean>(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Handle file selection via file dialog
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  // Handle file drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsFileDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  // Validate and set the selected file
  const validateAndSetFile = (file: File) => {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (SUPPORTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(file);
      setErrorMessage('');
    } else {
      setSelectedFile(null);
      setErrorMessage(`Unsupported file format. Please upload ${SUPPORTED_EXTENSIONS.join(', ')} files only.`);
    }
  };

  // Open file browser dialog
  const openFileBrowser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Reset the upload form
  const resetForm = () => {
    setSelectedFile(null);
    setIsLoading(false);
    setErrorMessage('');
    setJobId(null);
    setStatusData(null);
    setStatusPolling(false);
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Poll for status updates
  useEffect(() => {
    if (statusPolling && jobId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${STATUS_ENDPOINT}/${jobId}`);
          const data = await response.json();
          setStatusData(data);
          
          // If process is completed or failed, stop polling
          if (data.status === 'completed' || data.status === 'failed') {
            setStatusPolling(false);
            clearInterval(interval);
            
            // No need to save to database anymore
          }
        } catch (error) {
          console.error('Error polling for status:', error);
        }
      }, 20000); // Poll every 20 seconds
      
      setPollInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [statusPolling, jobId]);
  
  // Navigate to digital twins page
  const goToDigitalTwinsPage = () => {
    navigate('/digital-twins');
  };
  
  // Handle upload process
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first.');
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      setErrorMessage('You must be logged in to upload models.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Create form data with all required parameters
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', selectedFile.name);
      formData.append('uid', user.id);
      formData.append('user_name', user.name || 'User');
      formData.append('building_type', buildingType);
      
      // Start upload
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set job ID and start polling
        setJobId(data.jobId);
        setStatusPolling(true);
        
        // Make initial status request
        const statusResponse = await fetch(`${STATUS_ENDPOINT}/${data.jobId}`);
        const statusData = await statusResponse.json();
        setStatusData(statusData);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'An error occurred during the upload process. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Cancel the upload process
  const handleCancel = () => {
    if (isLoading) {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setStatusPolling(false);
      resetForm();
    } else {
      navigate('/digital-twins');
    }
  };

  // Get current progress percentage
  const getCurrentProgress = () => {
    if (!statusData) return 0;
    return statusData.progress || 0;
  };
  
  // Get current status message
  const getCurrentStatusMessage = () => {
    if (!statusData) return 'Preparing upload...';
    
    const step = statusData.currentStep;
    const status = statusData.status;
    
    if (status === 'failed') {
      return `Upload failed: ${statusData.error || 'Unknown error'}`;
    }
    
    switch (step) {
      case 'generating_token':
        return 'Generating authentication token...';
      case 'uploading_file':
        return 'Uploading file to BIMFACE...';
      case 'translating_file':
        return 'Translating model...';
      case 'completed':
        return 'Processing completed successfully';
      default:
        return `Processing: ${step.replace(/_/g, ' ')}`;
    }
  };
  
  // Format JSON data for display
  const formatJsonData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  // Inline styles to ensure content stays visible (same approach as DigitalTwinsPage)
  const baseStyle = { zIndex: 10, position: 'relative' as const };

  return (
    <div className="max-w-4xl mx-auto py-8" style={baseStyle}>
      {/* Header */}
      <div className="mb-8 flex items-center" style={baseStyle}>
        <button 
          onClick={() => navigate('/digital-twins')}
          className="mr-4 text-gray-400 hover:text-white"
          style={baseStyle}
        >
          <RiArrowLeftLine className="text-2xl" />
        </button>
        <h1 className="text-3xl font-bold text-white" style={baseStyle}>Upload 3D Model</h1>
      </div>
      
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-8" style={baseStyle}>
        {/* File upload area */}
        {!isLoading && (
          <div style={baseStyle}>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors
                ${isFileDragging ? 'border-ai-blue bg-dark-700/50' : 'border-dark-700 hover:border-dark-600'}
                ${selectedFile ? 'bg-dark-700/30' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileBrowser}
              style={baseStyle}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept={SUPPORTED_EXTENSIONS.join(',')}
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center" style={baseStyle}>
                  <RiFileList3Line className="text-5xl text-ai-blue mb-3" />
                  <p className="text-white font-medium mb-1" style={baseStyle}>{selectedFile.name}</p>
                  <p className="text-gray-400 text-sm" style={baseStyle}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center" style={baseStyle}>
                  <RiUpload2Line className="text-5xl text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-1" style={baseStyle}>
                    Drag & drop your 3D model file, or click to browse
                  </p>
                  <p className="text-gray-400 text-sm" style={baseStyle}>
                    Supported formats: {SUPPORTED_EXTENSIONS.join(', ')}
                  </p>
                </div>
              )}
            </div>
            
            {/* Building type selector */}
            <div className="mb-6" style={baseStyle}>
              <label htmlFor="buildingType" className="block text-white font-medium mb-2" style={baseStyle}>
                Building Type
              </label>
              <select
                id="buildingType"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg p-3 text-white focus:border-ai-blue focus:outline-none"
                style={baseStyle}
              >
                {BUILDING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Error message */}
            {errorMessage && (
              <div className="mb-4 flex items-center p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400" style={baseStyle}>
                <RiFileWarningLine className="flex-shrink-0 mr-2 text-xl" />
                <p style={baseStyle}>{errorMessage}</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-3 mt-6" style={baseStyle}>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                style={baseStyle}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`px-5 py-2.5 rounded-lg flex items-center transition-colors
                  ${selectedFile 
                    ? 'bg-ai-blue hover:bg-ai-blue-dark text-white' 
                    : 'bg-dark-700 text-gray-500 cursor-not-allowed'}`}
                style={baseStyle}
              >
                <RiUpload2Line className="mr-2" />
                Upload & Process
              </button>
            </div>
          </div>
        )}
        
        {/* Loading/progress state */}
        {isLoading && (
          <div className="p-4" style={baseStyle}>
            <div className="mb-6" style={baseStyle}>
              <div className="flex justify-between items-center mb-2" style={baseStyle}>
                <h3 className="text-white font-medium" style={baseStyle}>{getCurrentStatusMessage()}</h3>
                {jobId && (
                  <div className="flex items-center text-yellow-400" style={baseStyle}>
                    <span style={baseStyle}>Job ID: {jobId}</span>
                  </div>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-dark-700 rounded-full h-2 mb-4" style={baseStyle}>
                <div 
                  className="bg-ai-blue h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${getCurrentProgress()}%`, ...baseStyle }}
                ></div>
              </div>
              
              {/* Current file */}
              {selectedFile && (
                <div className="flex items-center bg-dark-700/50 p-3 rounded-lg" style={baseStyle}>
                  <RiFileList3Line className="text-gray-400 text-xl mr-3" />
                  <div style={baseStyle}>
                    <p className="text-white" style={baseStyle}>{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm" style={baseStyle}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {buildingType} Building
                    </p>
                  </div>
                </div>
              )}
              
              {/* Status details */}
              {statusData && (
                <div className="mt-4 p-3 bg-dark-700/50 rounded-lg" style={baseStyle}>
                  <h4 className="text-white mb-2" style={baseStyle}>Status Details:</h4>
                  <div className="grid grid-cols-3 gap-4" style={baseStyle}>
                    <div style={baseStyle}>
                      <p className="text-gray-400 mb-1" style={baseStyle}>Token Generation:</p>
                      <p className={`${statusData.steps.tokenGeneration.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`} style={baseStyle}>
                        {statusData.steps.tokenGeneration.status}
                      </p>
                    </div>
                    <div style={baseStyle}>
                      <p className="text-gray-400 mb-1" style={baseStyle}>File Upload:</p>
                      <p className={`${statusData.steps.fileUpload.status === 'completed' ? 'text-green-400' : statusData.steps.fileUpload.status === 'processing' ? 'text-yellow-400' : 'text-gray-400'}`} style={baseStyle}>
                        {statusData.steps.fileUpload.status}
                      </p>
                    </div>
                    <div style={baseStyle}>
                      <p className="text-gray-400 mb-1" style={baseStyle}>Translation:</p>
                      <p className={`${statusData.steps.translation.status === 'completed' ? 'text-green-400' : statusData.steps.translation.status === 'processing' ? 'text-yellow-400' : 'text-gray-400'}`} style={baseStyle}>
                        {statusData.steps.translation.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* API Response Log */}
            {statusData && (
              <div className="mt-8 border border-dark-700 rounded-lg overflow-hidden" style={baseStyle}>
                <div className="bg-dark-700 px-4 py-3" style={baseStyle}>
                  <h3 className="text-white font-medium" style={baseStyle}>API Response</h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto font-mono text-sm" style={baseStyle}>
                  <pre className="bg-dark-900 p-3 rounded text-gray-300 overflow-x-auto" style={baseStyle}>
                    {formatJsonData(statusData)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Process completed message */}
            {statusData && statusData.status === 'completed' && (
              <div className="mt-6" style={baseStyle}>
                <div className="border border-dark-700 rounded-lg overflow-hidden bg-dark-700/50 p-3" style={baseStyle}>
                  <div className="flex items-center mb-3" style={baseStyle}>
                    <RiCheckLine className="text-green-400 mr-2 text-xl" />
                    <p className="text-green-400" style={baseStyle}>Processing completed successfully!</p>
                  </div>
                  
                  <div className="flex mt-3" style={baseStyle}>
                    <button
                      onClick={goToDigitalTwinsPage}
                      className="inline-block px-4 py-2 bg-ai-blue hover:bg-ai-blue-dark rounded text-white transition-colors"
                      style={baseStyle}
                    >
                      Go to Digital Twins
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cancel button */}
            {!(statusData && statusData.status === 'completed') && (
              <div className="flex justify-end mt-4" style={baseStyle}>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                  style={baseStyle}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelUploadPage; 