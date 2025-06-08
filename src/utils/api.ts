// Ensure this file is treated as a module
export {};

// API utility functions for authenticated requests
const API_BASE_URL = 'https://matrixbim-server.onrender.com/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Token validation utility
const validateToken = (token: string): boolean => {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT structure - should have 3 parts');
      return false;
    }
    
    // Decode payload (without verification)
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    
    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.error('Token has expired');
        return false;
      }
      console.log('Token expires at:', new Date(payload.exp * 1000));
    }
    
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('token');
  console.log('Retrieved token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (token) {
    const isValid = validateToken(token);
    if (!isValid) {
      console.warn('Token validation failed - removing invalid token');
      localStorage.removeItem('token');
      return null;
    }
  }
  
  return token;
};

// Create headers with authentication
const createAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Authorization header set with token');
  } else {
    console.warn('No token found in localStorage');
  }
  
  return headers;
};

// Handle token expiration
const handleTokenExpiration = (): void => {
  console.warn('Token has expired or is invalid - clearing authentication');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Generic API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = createAuthHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  console.log(`API Request: ${config.method || 'GET'} ${url}`);
  console.log('Headers:', config.headers);
  
  try {
    const response = await fetch(url, config);
    
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('API Error Response:', errorData);
      
      // If it's a 401, handle token expiration
      if (response.status === 401) {
        console.error('Authentication failed - token may be expired or invalid');
        handleTokenExpiration();
      }
      
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response Data:', data);
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

// Debug function to test authentication
export const debugAuth = async (): Promise<void> => {
  console.log('=== AUTHENTICATION DEBUG ===');
  
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  
  if (token) {
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    try {
      // Try to decode the token payload
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        console.log('Token issued at:', new Date(payload.iat * 1000));
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', payload.exp < Math.floor(Date.now() / 1000));
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  
  // Test different endpoints
  const endpoints = [
    '/auth/me',
    '/auth/users/5fcf581f-f854-459b-b521-aae507891337',
    '/labour/list/5fcf581f-f854-459b-b521-aae507891337?projectId=7688a59e-89f0-4704-85de-9a411b80e654'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await apiRequest(endpoint);
      console.log(`✅ ${endpoint}: SUCCESS`);
    } catch (error) {
      console.log(`❌ ${endpoint}: FAILED -`, (error as Error).message);
    }
  }
  
  console.log('=== DEBUG COMPLETE ===');
};

// Test authentication function
export const testAuth = async (): Promise<boolean> => {
  try {
    console.log('Testing authentication...');
    const response = await apiRequest('/auth/me');
    console.log('Auth test successful:', response);
    return true;
  } catch (error) {
    console.error('Auth test failed:', error);
    return false;
  }
};

// Specific API methods
export const api = {
  // Auth methods
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name: string, email: string, password: string) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  // User methods
  getUsers: (userId: string) =>
    apiRequest(`/auth/users/${userId}`),

  getCurrentUser: () =>
    apiRequest('/auth/me'),

  // Project methods
  getProjects: (creatorId: string) =>
    apiRequest(`/projects/assigned?creator_uid=${creatorId}`),

  getProject: (projectId: string) =>
    apiRequest(`/projects/${projectId}`),

  // Safety methods
  createSafetyEntry: (data: any) =>
    apiRequest('/safety/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSafetyEntries: (userId: string, projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiRequest(`/safety/list/${userId}${params}`);
  },

  getSafetyEntry: (entryId: string) =>
    apiRequest(`/safety/${entryId}`),

  updateSafetyEntry: (entryId: string, data: any) =>
    apiRequest(`/safety/${entryId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSafetyEntry: (entryId: string) =>
    apiRequest(`/safety/${entryId}`, {
      method: 'DELETE',
    }),

  // Labour methods
  createLabourEntry: (data: any) =>
    apiRequest('/labour/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLabourEntries: (userId: string, projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiRequest(`/labour/list/${userId}${params}`);
  },

  getLabourEntry: (entryId: string) =>
    apiRequest(`/labour/${entryId}`),

  updateLabourEntry: (entryId: string, data: any) =>
    apiRequest(`/labour/${entryId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLabourEntry: (entryId: string) =>
    apiRequest(`/labour/${entryId}`, {
      method: 'DELETE',
    }),

  // Cleansing methods
  createCleansingEntry: (data: any) =>
    apiRequest('/cleansing/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCleansingEntries: (userId: string, projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiRequest(`/cleansing/list/${userId}${params}`);
  },

  getCleansingEntry: (entryId: string) =>
    apiRequest(`/cleansing/${entryId}`),

  updateCleansingEntry: (entryId: string, data: any) =>
    apiRequest(`/cleansing/${entryId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCleansingEntry: (entryId: string) =>
    apiRequest(`/cleansing/${entryId}`, {
      method: 'DELETE',
    }),

  // Diary methods
  createDiaryEntry: (data: any) =>
    apiRequest('/diary/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDiaryEntries: (userId: string, projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiRequest(`/diary/list/${userId}${params}`);
  },

  getDiaryEntry: (entryId: string) =>
    apiRequest(`/diary/${entryId}`),

  updateDiaryEntry: (entryId: string, data: any) =>
    apiRequest(`/diary/${entryId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDiaryEntry: (entryId: string) =>
    apiRequest(`/diary/${entryId}`, {
      method: 'DELETE',
    }),

  // Debug methods
  debugAuth,
  testAuth,
};

export default api;