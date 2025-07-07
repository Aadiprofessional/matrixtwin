import axios from 'axios';

// Type definitions
export interface BimfaceModel {
  id: string;          // Unique ID in our system
  fileId: number;      // BIMFACE file ID
  name: string;        // Display name
  status: string;      // 'waiting', 'processing', 'success', 'failed'
  buildingType: string; // Type of building
  dateCreated?: string; // Date when the model was created
  thumbnail?: string;   // Thumbnail URL
}

export interface BimfaceToken {
  token: string;
  expireTime: string;
}

export interface UploadResult {
  fileId: number;
  name: string;
}

export interface TranslationStatus {
  status: string; // 'waiting', 'processing', 'success', 'failed'
  percent?: number;
}

// Interface for translation configuration
export interface TranslationConfig {
  displayMode?: 'texture' | 'colored'; // 'texture' for real mode, 'colored' for colored mode
  renderViews?: boolean;               // Extract 2D views (for RVT files)
  exportSchedules?: boolean;           // Export schedules (for RVT files)
  customView?: string;                 // Custom view name to render
  customComponentTree?: boolean;       // Use custom component tree
  objectData?: string[];               // Object data for custom component tree
  enableGIS?: boolean;                 // Enable GIS coordinates
  gisCoordinates?: {                   // GIS coordinate settings
    type: 'geographic' | 'projection'; // Geographic or projection coordinates
    system?: string;                   // Coordinate system (e.g., 'CGCS2000')
    centerMeridian?: number;           // Center meridian for custom projection
    centralPoint?: {                   // Central point in model coordinates
      x: number;
      y: number;
      z: number;
    };
    geographicPoint?: {                // Geographic coordinates
      longitude: number;
      latitude: number;
      height: number;
    };
    offset?: {                         // Offset values
      x: number;
      y: number;
      z: number;
    };
    rotation?: number;                 // Rotation angle
    falseEasting?: number;             // False easting value
  };
  mainFileName?: string;               // Main file name for ZIP files with textures
}

// API Endpoints
const API_BASE_URL = 'http://localhost:3333/api/bimface';
const FILE_API_BASE_URL = 'http://localhost:3333/api/bimface-file';

// Map of fileId to known working tokens


// Get a BIMFACE API token using client credentials
export const generateToken = async (): Promise<BimfaceToken> => {
  try {
    const clientId = 'P9v85Mw7uk1bmKTnDpDVucorielyQOHX';
    const clientSecret = 'E06BiIPhayMEnWl5k1PLzlBEaK5c34BL';
    
    const requestData = 'grant_type=client_credentials';
    const auth = btoa(`${clientId}:${clientSecret}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/oauth2/token`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    console.log('Token response:', response.data);
    
    if (response.data.code === 'success') {
      // Store token in localStorage for reuse
      localStorage.setItem('bimface_token', response.data.data.token);
      localStorage.setItem('bimface_token_expiry', response.data.data.expireTime);
      
      return {
        token: response.data.data.token,
        expireTime: response.data.data.expireTime
      };
    } else {
      throw new Error(response.data.message || 'Failed to get token');
    }
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Upload a file to BIMFACE
export const uploadFile = async (file: File, token: string): Promise<UploadResult> => {
  try {
    // Create headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream'
    };
    
    // Upload the file
    const response = await axios.put(
      `${FILE_API_BASE_URL}/upload?name=${encodeURIComponent(file.name)}`,
      file,
      { headers }
    );
    
    console.log('Upload response:', response.data);
    
    // Check if the response has the correct structure and fileId
    if (response.data && response.data.code === 'success' && response.data.data && response.data.data.fileId) {
      return {
        fileId: response.data.data.fileId,
        name: file.name
      };
    } else {
      throw new Error('Failed to upload file: Invalid response format or missing fileId');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Initiate translation process for a file with advanced configuration
export const translateFile = async (
  fileId: number, 
  token: string, 
  config?: TranslationConfig
): Promise<any> => {
  try {
    // Base request data
    const requestData: any = {
      source: {
        fileId: fileId,
        compressed: false
      },
      config: {
        toBimtiles: true
      }
    };
    
    // Apply configuration options if provided
    if (config) {
      // Display mode (texture/colored)
      if (config.displayMode) {
        requestData.config.texture = config.displayMode === 'texture';
      }
      
      // Extract 2D views for RVT files
      if (config.renderViews) {
        requestData.config.renderViews = true;
      }
      
      // Export schedules for RVT files
      if (config.exportSchedules) {
        requestData.config.exportSchedules = true;
      }
      
      // Custom view
      if (config.customView) {
        requestData.config.view = {
          name: config.customView
        };
      }
      
      // Custom component tree
      if (config.customComponentTree && config.objectData && config.objectData.length > 0) {
        requestData.config.componentTree = {
          objectDataAttributes: config.objectData
        };
      }
      
      // Main file name for ZIP files with textures
      if (config.mainFileName) {
        requestData.source.mainFileName = config.mainFileName;
      }
      
      // GIS coordinates
      if (config.enableGIS && config.gisCoordinates) {
        const gis: any = {
          type: config.gisCoordinates.type
        };
        
        // Geographic coordinates
        if (config.gisCoordinates.type === 'geographic') {
          gis.system = config.gisCoordinates.system || 'CGCS2000';
          
          if (config.gisCoordinates.centralPoint) {
            gis.centralPoint = config.gisCoordinates.centralPoint;
          }
          
          if (config.gisCoordinates.geographicPoint) {
            gis.geographicPoint = config.gisCoordinates.geographicPoint;
          }
          
          if (config.gisCoordinates.rotation !== undefined) {
            gis.rotation = config.gisCoordinates.rotation;
          }
        }
        // Projection coordinates
        else if (config.gisCoordinates.type === 'projection') {
          if (config.gisCoordinates.centerMeridian !== undefined) {
            gis.centerMeridian = config.gisCoordinates.centerMeridian;
          }
          
          if (config.gisCoordinates.falseEasting !== undefined) {
            gis.falseEasting = config.gisCoordinates.falseEasting;
          }
          
          if (config.gisCoordinates.centralPoint) {
            gis.centralPoint = config.gisCoordinates.centralPoint;
          }
          
          if (config.gisCoordinates.offset) {
            gis.offset = config.gisCoordinates.offset;
          }
          
          if (config.gisCoordinates.rotation !== undefined) {
            gis.rotation = config.gisCoordinates.rotation;
          }
        }
        
        requestData.config.gis = gis;
      }
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Translation request data:', requestData);
    
    const response = await axios.put(
      `${API_BASE_URL}/v2/translate`,
      requestData,
      { headers }
    );
    
    console.log('Translation response:', response.data);
    
    // Return the data properly
    if (response.data && response.data.code === 'success') {
      return response.data.data || response.data;
    } else {
      throw new Error('Translation initialization failed: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error translating file:', error);
    throw error;
  }
};

// Get translation status of a file
export const getTranslationStatus = async (fileId: number): Promise<{ data: TranslationStatus }> => {
  try {
    const token = localStorage.getItem('bimface_token');
    
    if (!token) {
      throw new Error('No BIMFACE token available');
    }
    
    console.log(`Checking translation status for fileId: ${fileId}`);
    
    // Use the correct endpoint based on successful curl command
    const response = await axios.get(
      `${API_BASE_URL}/translate?fileId=${fileId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('Translation status response:', response.data);
    
    // Extract the correct status data
    if (response.data && response.data.code === 'success' && response.data.data) {
      return {
        data: {
          status: response.data.data.status || 'unknown',
          percent: response.data.data.percent
        }
      };
    } else if (response.data && response.data.status) {
      return {
        data: {
          status: response.data.status || 'unknown',
          percent: response.data.percent
        }
      };
    } else {
      // If we still don't have valid data, assume the model is still processing
      console.warn('Could not determine translation status, defaulting to "processing"');
      return {
        data: {
          status: 'processing',
          percent: 0
        }
      };
    }
  } catch (error) {
    console.error('Error getting translation status:', error);
    // In case of error, return a processing status instead of throwing
    return {
      data: {
        status: 'processing',
        percent: 0
      }
    };
  }
};

// Get the viewer token for a file
export const getViewerToken = async (fileId: number): Promise<string> => {
  try {
    const bearerToken = 'cn-a25be677-409f-4e62-9eb2-c58d154bf082'; // Authorization token from user query
    
    console.log(`Getting fresh viewer token for fileId: ${fileId}`);
    
    // Make a direct API call to get a fresh token
    const response = await axios.get(
      `https://api.bimface.com/view/token?fileId=${fileId}`,
      {
        headers: { 
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Fresh viewer token response:', response.data);
    
    if (response.data && response.data.code === 'success' && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Failed to get viewer token: Invalid response format');
    }
  } catch (error) {
    console.error('Error getting viewer token:', error);
    throw error; // Don't provide a fallback - if we can't get a token, we should fail
  }
};

// Store a BIMFACE model in localStorage
export const storeModel = (modelData: BimfaceModel): void => {
  try {
    // Get existing models
    const modelsStr = localStorage.getItem('bimface_models') || '[]';
    const models: BimfaceModel[] = JSON.parse(modelsStr);
    
    // Add new model
    models.push({
      ...modelData,
      dateCreated: new Date().toISOString()
    });
    
    // Save back to localStorage
    localStorage.setItem('bimface_models', JSON.stringify(models));
  } catch (error) {
    console.error('Error storing model data:', error);
  }
};

// Update a model's status in localStorage
export const updateModelStatus = (modelId: string, newStatus: string): void => {
  try {
    // Get existing models
    const modelsStr = localStorage.getItem('bimface_models') || '[]';
    const models: BimfaceModel[] = JSON.parse(modelsStr);
    
    // Find and update the model
    const updatedModels = models.map(model => {
      if (model.id === modelId) {
        return { ...model, status: newStatus };
      }
      return model;
    });
    
    // Save back to localStorage
    localStorage.setItem('bimface_models', JSON.stringify(updatedModels));
  } catch (error) {
    console.error('Error updating model status:', error);
  }
};

// Get thumbnail URL for a model
export const getThumbnailUrl = async (fileId: number): Promise<string | null> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/translate?fileId=${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bimface_token') || ''}`,
        }
      }
    );
    
    console.log('Thumbnail response:', response.data);
    
    if (response.data.code === 'success' && 
        response.data.data && 
        response.data.data.thumbnail && 
        response.data.data.thumbnail.length > 0) {
      // Return the highest resolution thumbnail (usually the last one)
      return response.data.data.thumbnail[response.data.data.thumbnail.length - 1];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting thumbnail:', error);
    return null;
  }
};

// Update the model information in localStorage
export const updateModelInfo = (modelId: string, updates: Partial<BimfaceModel>): void => {
  try {
    // Get models from localStorage
    const modelsStr = localStorage.getItem('bimface_models') || '[]';
    const models = JSON.parse(modelsStr);
    
    // Find and update the model
    const updatedModels = models.map((model: BimfaceModel) => {
      if (model.id === modelId) {
        return { ...model, ...updates };
      }
      return model;
    });
    
    // Save back to localStorage
    localStorage.setItem('bimface_models', JSON.stringify(updatedModels));
  } catch (error) {
    console.error('Error updating model info:', error);
  }
};

// Get download URL for a file
export const getDownloadUrl = async (fileId: number): Promise<string | null> => {
  try {
    // Use a direct approach for file download - simplified to a single method
    const response = await axios.get(
      `${FILE_API_BASE_URL}/download?fileId=${fileId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bimface_token') || ''}`,
        }
      }
    );
    
    console.log('Download URL response:', response.data);
    
    if (response.data && response.data.code === 'success' && response.data.data) {
      return response.data.data;
    }
    
    // If the REST API approach fails, return a constructed URL as fallback
    return `${FILE_API_BASE_URL}/direct-download/${fileId}`;
  } catch (error) {
    console.error('Error getting download URL:', error);
    
    // Return a constructed URL even on error since the model viewer should work regardless
    return `${FILE_API_BASE_URL}/direct-download/${fileId}`;
  }
};

// Direct access to BIMFACE API for debugging
export const debugBimfaceApi = async (endpoint: string, method: string = 'GET', data?: any): Promise<any> => {
  try {
    const token = localStorage.getItem('bimface_token') || '';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    let response;
    
    if (method.toUpperCase() === 'GET') {
      response = await axios.get(`${API_BASE_URL}/${endpoint}`, { headers });
    } else if (method.toUpperCase() === 'POST') {
      response = await axios.post(`${API_BASE_URL}/${endpoint}`, data, { headers });
    } else if (method.toUpperCase() === 'PUT') {
      response = await axios.put(`${API_BASE_URL}/${endpoint}`, data, { headers });
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
    
    console.log(`BIMFACE API Debug (${endpoint})`, response.data);
    return response.data;
  } catch (error) {
    console.error(`BIMFACE API Debug Error (${endpoint}):`, error);
    throw error;
  }
}; 