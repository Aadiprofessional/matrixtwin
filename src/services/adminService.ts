import { apiRequest } from '../utils/api';

export interface AdminRequestData {
  company_name: string;
  company_details: {
    description: string;
    [key: string]: any;
  };
}

export const adminService = {
  // Submit Admin Request
  submitAdminRequest: async (data: AdminRequestData): Promise<void> => {
    return apiRequest<void>('/admin-requests/request-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get My Admin Request
  getAdminRequest: async (): Promise<any> => {
    return apiRequest<any>('/admin-requests/my-request', {
      method: 'GET',
    });
  },

  // Update Admin Request
  updateAdminRequest: async (requestId: string, data: AdminRequestData): Promise<void> => {
    return apiRequest<void>(`/admin-requests/request-admin/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Approve Admin Request (Owner Only)
  approveAdminRequest: async (requestId: string): Promise<void> => {
    return apiRequest<void>(`/admin-requests/requests/${requestId}/approve`, {
      method: 'PUT',
    });
  },
};
