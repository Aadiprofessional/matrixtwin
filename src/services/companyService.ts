import { apiRequest } from '../utils/api';

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
}

export interface JoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

export const companyService = {
  // List Company Members
  getCompanyMembers: async (): Promise<CompanyMember[]> => {
    return apiRequest<CompanyMember[]>('/companies/members', {
      method: 'GET',
    });
  },

  // Remove Member from Company
  removeCompanyMember: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/companies/members/${userId}`, {
      method: 'DELETE',
    });
  },

  // Request to Join a Company
  requestToJoinCompany: async (companyId: string): Promise<void> => {
    return apiRequest<void>('/companies/join', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId }),
    });
  },

  // List Pending Join Requests
  getPendingJoinRequests: async (): Promise<JoinRequest[]> => {
    return apiRequest<JoinRequest[]>('/companies/requests', {
      method: 'GET',
    });
  },

  // Approve Join Request
  approveJoinRequest: async (requestId: string): Promise<void> => {
    return apiRequest<void>(`/companies/requests/${requestId}/approve`, {
      method: 'PUT',
    });
  },

  // Reject Join Request
  rejectJoinRequest: async (requestId: string): Promise<void> => {
    return apiRequest<void>(`/companies/requests/${requestId}/reject`, {
      method: 'PUT',
    });
  },
};
