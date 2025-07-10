import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  RiBuilding4Line, 
  RiUpload2Line, 
  RiEyeLine, 
  RiFlashlightLine, 
  RiSensorLine, 
  RiDashboardLine, 
  RiTimeLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiLoader4Line,
  RiRefreshLine,
  RiImageLine,
  RiDeleteBin6Line
} from 'react-icons/ri';
import { Link } from 'react-router-dom';
import { getTranslationStatus, updateModelStatus, getThumbnailUrl, updateModelInfo } from '../utils/bimfaceApi';
import { getUserModels, getAllModels, deleteModelRecord, updateModelRecord, ModelRecord } from '../utils/supabaseModelsApi';
import { getFreshViewToken } from '../utils/bimfaceTokenApi';
import { useAuth } from '../contexts/AuthContext';

// Types for model data with BIMFACE integration
interface ModelData {
  id: string;          // Unique ID in our system
  fileId: number;      // BIMFACE file ID
  name: string;        // Display name
  status: string;      // 'waiting', 'processing', 'success', 'failed'
  buildingType: string; // Type of building
  dateCreated?: string; // Date when the model was created
  thumbnail?: string;   // Thumbnail URL
}

const DigitalTwinsPage: React.FC = () => {
  const { t } = useTranslation();
  const [recentModels, setRecentModels] = useState<ModelData[]>([]);
  const [supabaseModels, setSupabaseModels] = useState<ModelRecord[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Load models from localStorage (legacy support)
  const loadModels = () => {
    try {
      const modelsStr = localStorage.getItem('bimface_models') || '[]';
      const models: ModelData[] = JSON.parse(modelsStr);
      
      // Sort by ID (newest first, assuming IDs are UUIDs which have a time component)
      const sortedModels = [...models].sort((a, b) => b.id.localeCompare(a.id));
      
      return sortedModels;
    } catch (error) {
      console.error('Error loading models:', error);
      return [];
    }
  };

  // Get view token - either use existing token or fetch from API
  const getViewToken = async (fileId: number, existingToken: string | null): Promise<string | null> => {
    // If we already have a valid token, use it
    if (existingToken) {
      return existingToken;
    }
    
    try {
      // Get token from MatrixBIM server API
      const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/bimface/getviewid?fileId=${fileId}&token=cn-937d5634-69e4-4543-9ea6-d2f2545ff3bc`);
      const data = await response.json();
      
      console.log(`GetViewToken response for fileId ${fileId}:`, data);
      
      if (data.success && data.viewToken) {
        return data.viewToken;
      } else if (data.success && data.status === 'processing') {
        // We need to wait and check again
        return 'processing';
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting view token for fileId ${fileId}:`, error);
      return null;
    }
  };

  // Load models from Supabase
  const loadSupabaseModels = async () => {
    if (!user) return;
    
    try {
      setIsCheckingStatus(true);
      
      // Get models based on user role
      let models: ModelRecord[] = [];
      try {
        if (user.role === 'admin') {
          // Admins can see all models
          models = await getAllModels();
        } else {
          // Regular users only see their own models
          models = await getUserModels(user.id);
        }
        
        console.log('Loaded models from Supabase:', models);
        setSupabaseModels(models);
        
        // Check status of models from BIMFACE
        await checkModelStatuses(models);
      } catch (error: any) {
        // Handle Supabase table not found error more gracefully
        if (error.code === '42P01') {
          console.warn('The bim_process_logs table does not exist yet. It will be created automatically on first model upload.');
        } else {
          console.error('Error loading models from Supabase:', error);
        }
        setSupabaseModels([]);
      }
      
      setIsCheckingStatus(false);
    } catch (error) {
      console.error('Error in loadSupabaseModels function:', error);
      setIsCheckingStatus(false);
    }
  };

  // Check BIMFACE status for multiple models
  const checkModelStatuses = async (models: ModelRecord[]) => {
    for (const model of models) {
      if (!model.file_id) continue;
      
      // If model is completed but missing a viewtoken, fetch it using the getviewid API
      if ((model.status === 'success' || model.status === 'completed') && !model.viewtoken && model.file_id) {
        try {
          console.log(`Model ${model.id} is completed but missing viewtoken - fetching from API`);
          
          // Call the getviewid API to get the view token
          const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/bimface/getviewid?fileId=${model.file_id}&token=cn-937d5634-69e4-4543-9ea6-d2f2545ff3bc`);
          const data = await response.json();
          
          console.log(`GetViewID response for model ${model.id}:`, data);
          
          if (data.success && data.viewToken) {
            // Update the model with the new viewToken
            console.log(`Obtained new view token for model ${model.id}: ${data.viewToken}`);
            await updateModelRecord(model.id, { 
              viewtoken: data.viewToken,
              status: 'completed'
            });
          }
        } catch (error) {
          console.error(`Error fetching view token for model ${model.id}:`, error);
        }
      }
      
      if (model.status === 'waiting' || model.status === 'processing' || model.status === 'started') {
        try {
          console.log(`Checking status for model ID: ${model.id}, fileId: ${model.file_id}`);
          
          // Use the MatrixBIM server API instead of direct BIMFACE API
          const response = await fetch(`https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run/api/bimface/status/${model.file_id}`);
          const statusData = await response.json();
          
          console.log(`Model ${model.id} status response:`, statusData);
          
          if (statusData.success) {
            const newStatus = statusData.status === 'completed' ? 'success' : statusData.status;
            
            console.log(`Model ${model.id} new status: ${newStatus}, progress: ${statusData.progress}`);
            
            if (newStatus !== model.status) {
              // Update status in Supabase
              await updateModelRecord(model.id, {
                status: newStatus,
                step: `${statusData.currentStep}`,
                progress: statusData.progress || 0
              });

              // If completed, update additional information
              if (newStatus === 'success' && statusData.result) {
                console.log(`Updating model ${model.id} with completion data`);
                
                const updateData: Partial<ModelRecord> = {};
                
                // Add thumbnail if available
                if (statusData.result.thumbnails && statusData.result.thumbnails.length > 0) {
                  updateData.thumbnail = statusData.result.thumbnails[0];
                }
                
                // Add viewer token if available
                if (statusData.result.token) {
                  updateData.viewtoken = statusData.result.token;
                } else {
                  // Try to fetch the fresh view token using the new API
                  try {
                    const tokenResponse = await getFreshViewToken(model.file_id!);
                    
                    if (tokenResponse.success && tokenResponse.viewToken) {
                      updateData.viewtoken = tokenResponse.viewToken;
                    }
                  } catch (tokenError) {
                    console.error(`Error fetching fresh view token for model ${model.id}:`, tokenError);
                  }
                }
                
                // Add viewer URL if available
                if (statusData.result.viewerUrl) {
                  updateData.file_url = statusData.result.viewerUrl;
                }
                
                if (Object.keys(updateData).length > 0) {
                  await updateModelRecord(model.id, updateData);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error checking status for model ${model.id}:`, error);
        }
      }
    }
  };
  
  // Load and check status of models on component mount
  useEffect(() => {
    // Log user ID and information
    if (user) {
      console.log('DigitalTwins page accessed by user:', {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role
      });
      
      // Load models from Supabase
      loadSupabaseModels();
    } else {
      console.log('DigitalTwins page accessed by unauthenticated user');
    }
    
    // Legacy support - load from localStorage too
    const legacyModels = loadModels();
    setRecentModels(legacyModels);
    
    // Set up periodic checking for models that are still processing
    const intervalId = setInterval(() => {
      // Check for any processing models in the current localStorage state, not from recentModels
      const currentModels = loadModels();
      const processingModels = currentModels.filter(
        model => model.status === 'waiting' || model.status === 'processing'
      );
      
      if (processingModels.length > 0 || (user && supabaseModels.some(m => 
        m.status === 'waiting' || m.status === 'processing' || m.status === 'started' || 
        (m.status === 'success' && !m.viewtoken) // Also check models without a view token
      ))) {
        loadSupabaseModels();
      }
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]); // Only depend on user to avoid re-running on model updates
  
  // Manual refresh of model statuses
  const handleRefreshStatuses = async () => {
    if (isCheckingStatus) return;
    
    // Refresh Supabase models
    loadSupabaseModels();
    
    // Legacy support
    setIsCheckingStatus(true);
    
    // Get models from localStorage
    const models = loadModels();
    
    // Check status of all models
    const updatedModels = [...models];
    let hasUpdates = false;
    
    for (let i = 0; i < updatedModels.length; i++) {
      const model = updatedModels[i];
      
      try {
        const response = await getTranslationStatus(model.fileId);
        const newStatus = response.data.status;
        
        if (newStatus !== model.status) {
          updatedModels[i] = {
            ...model,
            status: newStatus,
          };
          
          // Update the model status in localStorage
          updateModelStatus(model.id, newStatus);
          
          hasUpdates = true;
        }
      } catch (error) {
        console.error(`Error checking status for model ${model.id}:`, error);
      }
    }
    
    setRecentModels(updatedModels);
    setIsCheckingStatus(false);
  };

  // Handle delete model
  const handleDeleteModel = async (modelId: string) => {
    if (!user) return;
    
    try {
      // Add confirmation dialog
      if (!window.confirm('Are you sure you want to delete this model?')) {
        return;
      }
      
      setIsDeleting(modelId);
      await deleteModelRecord(modelId);
      console.log(`Model ${modelId} deleted successfully`);
      
      // Update the models list
      setSupabaseModels(prevModels => prevModels.filter(model => model.id !== modelId));
      
      // Also remove from legacy storage if present
      const legacyModels = loadModels();
      const updatedLegacyModels = legacyModels.filter(model => model.id !== modelId);
      localStorage.setItem('bimface_models', JSON.stringify(updatedLegacyModels));
      setRecentModels(updatedLegacyModels);
      
    } catch (error) {
      console.error(`Error deleting model ${modelId}:`, error);
    } finally {
      setIsDeleting(null);
    }
  };
  
  // Feature cards for Digital Twins
  const featureCards = [
    {
      title: 'Model Viewer',
      description: 'Import and view 3D building models with interactive controls',
      icon: <RiEyeLine className="text-3xl" />,
      link: '/digital-twins/viewer',
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      title: 'IoT Dashboard',
      description: 'Monitor real-time IoT sensor data from your building',
      icon: <RiSensorLine className="text-3xl" />,
      link: '/digital-twins/iot-dashboard',
      gradient: 'from-green-500 to-emerald-400',
    },
    {
      title: 'Building Analytics',
      description: 'Analyze building performance and energy usage patterns',
      icon: <RiDashboardLine className="text-3xl" />,
      link: '/digital-twins/analytics',
      gradient: 'from-purple-500 to-indigo-400',
    },
    {
      title: 'Smart Control',
      description: 'Control building systems and smart locks remotely through digital twin interface',
      icon: <RiFlashlightLine className="text-3xl" />,
      link: '/digital-twins/control',
      gradient: 'from-orange-500 to-amber-400',
    },
  ];

  // Quick action links
  const quickActions = [
    {
      title: 'Upload 3D Model',
      icon: <RiUpload2Line className="mr-2" />,
      link: '/digital-twins/upload',
    },
    {
      title: 'View Models',
      icon: <RiEyeLine className="mr-2" />,
      link: '/digital-twins/viewer',
    },
  ];
  
  // Helper to render model status indicator
  const renderModelStatus = (status: string, viewtoken: string | null) => {
    // For models that are completed but missing viewtoken, show "Processing"
    if ((status === 'completed' || status === 'success') && viewtoken === null) {
      return (
        <span className="flex items-center text-yellow-400 text-xs bg-yellow-900/20 px-2 py-1 rounded">
          <RiLoader4Line className="mr-1 animate-spin" /> Processing
        </span>
      );
    }
    
    // Otherwise, show normal status
    switch (status) {
      case 'success':
      case 'done':
      case 'completed':
        return (
          <span className="flex items-center text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded">
            <RiCheckLine className="mr-1" /> Ready
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="flex items-center text-red-400 text-xs bg-red-900/20 px-2 py-1 rounded">
            <RiCloseCircleLine className="mr-1" /> Failed
          </span>
        );
      case 'processing':
      case 'waiting':
      case 'started':
      default:
        return (
          <span className="flex items-center text-yellow-400 text-xs bg-yellow-900/20 px-2 py-1 rounded">
            <RiLoader4Line className="mr-1 animate-spin" /> Processing
          </span>
        );
    }
  };

  // Function to check if model is ready for viewing
  const isModelViewable = (model: ModelData | ModelRecord): boolean => {
    // Check which type of model we have (ModelData or ModelRecord)
    const isSupabaseModel = 'file_id' in model;
    
    // For Supabase models
    if (isSupabaseModel) {
      const supabaseModel = model as ModelRecord;
      const status = supabaseModel.status;
      
      // Give priority to models with viewtoken
      if (['completed', 'success', 'done'].includes(status) && supabaseModel.viewtoken) {
        return true;
      }
      
      // But also allow models that are marked as completed to be viewed
      if (['completed', 'success', 'done'].includes(status) && supabaseModel.file_id) {
        return true;
      }
    } else {
      // For legacy models
      const legacyModel = model as ModelData;
      return legacyModel.status === 'success' || legacyModel.status === 'done';
    }
    
    return false;
  };

  // Inline styles to ensure content stays visible
  const baseStyle = { zIndex: 10, position: 'relative' as const };

  // Function to construct the viewer link
  const getViewerLink = (model: ModelData | ModelRecord) => {
    // Check which type of model we have (ModelData or ModelRecord)
    const isSupabaseModel = 'file_id' in model;
    
    const id = model.id;
    const fileId = isSupabaseModel ? (model as ModelRecord).file_id || 0 : (model as ModelData).fileId;
    
    // If Supabase model and has viewtoken, ONLY use the viewToken
    if (isSupabaseModel && (model as ModelRecord).viewtoken) {
      return `/digital-twins/viewer?modelId=${id}&viewToken=${(model as ModelRecord).viewtoken}`;
    }
    
    // If Supabase model with file_id but no viewtoken, use fileId instead
    if (isSupabaseModel && fileId) {
      return `/digital-twins/viewer?modelId=${id}&fileId=${fileId}`;
    }
    
    // Otherwise just pass the model ID
    return `/digital-twins/viewer?modelId=${id}`;
  };

  // Function to handle View button click
  const handleViewClick = async (model: ModelData | ModelRecord, e: React.MouseEvent) => {
    const isSupabaseModel = 'file_id' in model;
    
    if (!isSupabaseModel) return; // Only handle Supabase models
    
    const supabaseModel = model as ModelRecord;
    const fileId = supabaseModel.file_id || 0;
    
    // If model is completed but has no viewtoken, get token first
    if ((supabaseModel.status === 'completed' || supabaseModel.status === 'success') && 
        !supabaseModel.viewtoken && supabaseModel.file_id) {
      e.preventDefault(); // Prevent navigation
      
      try {
        console.log(`Getting fresh view token for model ${supabaseModel.id} before viewing`);
        
        // Use the new fresh token API
        const tokenResponse = await getFreshViewToken(fileId);
        
        if (tokenResponse.success && tokenResponse.viewToken) {
          // Update the model with the new viewToken
          await updateModelRecord(supabaseModel.id, { viewtoken: tokenResponse.viewToken });
          
          // Redirect to viewer with the obtained viewToken
          window.location.href = `/digital-twins/viewer?fileId=${fileId}&viewToken=${tokenResponse.viewToken}`;
        } else {
          console.error('Failed to get fresh view token:', tokenResponse);
          // If we can't get a token, try to continue anyway with just the fileId
          window.location.href = `/digital-twins/viewer?fileId=${fileId}`;
        }
      } catch (error) {
        console.error('Error getting fresh view token:', error);
        // If error, try to continue anyway with just the fileId
        window.location.href = `/digital-twins/viewer?fileId=${fileId}`;
      }
    }
  };

  // Function to render a model card
  const renderModelCard = (model: ModelData | ModelRecord) => {
    // Check which type of model we have (ModelData or ModelRecord)
    const isSupabaseModel = 'file_id' in model;
    
    // Get the appropriate properties depending on model type
    const id = model.id;
    const fileId = isSupabaseModel ? (model as ModelRecord).file_id || 0 : (model as ModelData).fileId;
    const name = isSupabaseModel ? (model as ModelRecord).file_name : (model as ModelData).name;
    const status = model.status;
    const viewtoken = isSupabaseModel ? (model as ModelRecord).viewtoken || null : null;
    const thumbnail = isSupabaseModel 
      ? (model as ModelRecord).thumbnail || '/images/model-placeholder.jpg'
      : (model as ModelData).thumbnail || '/images/model-placeholder.jpg';
    const dateCreated = isSupabaseModel ? (model as ModelRecord).created_at : (model as ModelData).dateCreated;
    
    const canView = isModelViewable(model);
    const viewerLink = getViewerLink(model);
    
    // Parse thumbnail from JSON string if necessary
    let thumbnailUrl = thumbnail;
    if (isSupabaseModel && typeof thumbnail === 'string' && thumbnail.startsWith('[')) {
      try {
        const thumbnailsArray = JSON.parse(thumbnail);
        if (thumbnailsArray && thumbnailsArray.length > 0) {
          // Use the largest thumbnail (typically the last one)
          thumbnailUrl = thumbnailsArray[thumbnailsArray.length - 1];
        }
      } catch (e) {
        console.error('Error parsing thumbnail JSON:', e);
        thumbnailUrl = '/images/model-placeholder.jpg';
      }
    }
    
    return (
      <div key={id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl">
        <div className="relative h-40 bg-gray-700">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = '/images/model-placeholder.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700">
              <RiImageLine className="text-4xl text-gray-500" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            {renderModelStatus(status, viewtoken)}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-medium text-white truncate">{name}</h3>
          {isSupabaseModel && (model as ModelRecord).user_name && (
            <p className="text-sm text-gray-400 mb-2">By: {(model as ModelRecord).user_name}</p>
          )}
          <p className="text-sm text-gray-400 mb-1">Status: {status}</p>
          <p className="text-sm text-gray-400 mb-3">File ID: {fileId}</p>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {dateCreated && (
                <span>{new Date(dateCreated).toLocaleDateString()}</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Link 
                to={canView ? viewerLink : '#'} 
                onClick={(e) => !canView && (status === 'completed' || status === 'success') && handleViewClick(model, e)}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center 
                  ${(canView || (status === 'completed' || status === 'success'))
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
              >
                <RiEyeLine className="mr-1" /> View
              </Link>
              
              <button
                onClick={() => handleDeleteModel(id)}
                disabled={isDeleting === id}
                className="px-3 py-1 rounded text-xs font-medium flex items-center bg-red-900/40 hover:bg-red-900/70 text-red-300"
              >
                {isDeleting === id ? (
                  <RiLoader4Line className="mr-1 animate-spin" />
                ) : (
                  <RiDeleteBin6Line className="mr-1" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8" style={baseStyle}>
      {/* Header with inline styles to ensure visibility */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 p-8 rounded-xl" style={baseStyle}>
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center mb-2" style={baseStyle}>
          <RiBuilding4Line className="mr-3 text-blue-300" />
          Digital Twins
          {user && <span className="ml-2 text-sm text-blue-300">({user.name} - {user.role})</span>}
        </h1>
        <p className="text-blue-200 max-w-2xl" style={baseStyle}>
          Create, visualize and interact with digital representations of your physical buildings and assets.
          Monitor real-time data, simulate scenarios, and optimize building performance.
        </p>
      </div>
      
      {/* BIMFACE Integration Highlight */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700" style={baseStyle}>
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="mb-4 md:mb-0 md:mr-8">
            <p className="text-gray-400 max-w-xl">
              Upload your building models in multiple formats including RVT, IFC, DWG, and more.
            </p>
          </div>
          <div className="flex-shrink-0 ml-auto">
            <Link
              to="/digital-twins/upload"
              className="flex items-center bg-ai-blue hover:bg-ai-blue-dark px-5 py-3 rounded-lg text-white transition-colors"
            >
              <RiUpload2Line className="mr-2" />
              Upload Model
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions with inline styles */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700" style={baseStyle}>
        <h2 className="text-xl font-semibold text-white mb-4" style={baseStyle}>Quick Actions</h2>
        <div className="flex flex-wrap gap-4" style={baseStyle}>
          {quickActions.map((action, index) => (
            <Link 
              key={index}
              to={action.link} 
              className="flex items-center bg-dark-700 hover:bg-dark-600 px-4 py-3 rounded-lg text-white"
              style={baseStyle}
            >
              {action.icon}
              {action.title}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featureCards.map((card, index) => (
          <div 
            key={index}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            <Link to={card.link} className="block h-full">
              <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-6 h-full hover:shadow-lg hover:shadow-ai-blue/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className={`bg-gradient-to-br ${card.gradient} rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
                <p className="text-gray-400">{card.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      
      {/* Recent Models */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700" style={baseStyle}>
        <div className="flex justify-between items-center mb-4" style={baseStyle}>
          <h2 className="text-xl font-semibold text-white" style={baseStyle}>Recent Models</h2>
          <button 
            onClick={handleRefreshStatuses}
            disabled={isCheckingStatus}
            className="flex items-center text-gray-400 hover:text-white text-sm bg-dark-700 hover:bg-dark-600 py-1.5 px-3 rounded-lg transition-colors"
            style={baseStyle}
          >
            <RiRefreshLine className={`mr-1.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
        
        {supabaseModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" style={baseStyle}>
            {supabaseModels.map((model) => renderModelCard(model))}
          </div>
        ) : null}
        
        {recentModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={baseStyle}>
            {recentModels.length > 0 && supabaseModels.length > 0 && (
              <h3 className="text-lg font-medium text-white col-span-full">Legacy Models</h3>
            )}
            {recentModels.map((model) => renderModelCard(model))}
          </div>
        ) : null}
        
        {recentModels.length === 0 && supabaseModels.length === 0 && (
          <div className="text-center py-8 bg-dark-700/50 rounded-lg" style={baseStyle}>
            <RiUpload2Line className="text-4xl text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 mb-4" style={baseStyle}>No models uploaded yet</p>
            <Link
              to="/digital-twins/upload"
              className="bg-ai-blue hover:bg-ai-blue-dark text-white px-4 py-2 rounded-lg inline-flex items-center"
              style={baseStyle}
            >
              <RiUpload2Line className="mr-2" /> Upload Your First Model
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalTwinsPage; 