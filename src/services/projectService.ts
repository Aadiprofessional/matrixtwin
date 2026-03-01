import { apiRequest } from '../utils/api';
import { CompanyMember } from './companyService';

export interface ProjectMember {
  user_id: string;
  role: string; // 'member' or 'admin' in project context
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string; // Global role
  };
}

export interface AssignableMember {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  status: 'assigned_current' | 'assigned_other' | 'available';
  assigned_to_current: boolean;
  other_assignments: {
    id: string;
    name: string;
  }[];
}

export interface AssignableMembersResponse {
  project_id: string;
  project_name: string;
  members: AssignableMember[];
}

export const projectService = {
  // List Project Members
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, {
      method: 'GET',
    });
  },

  // Get Assignable Members (Staff Allocation)
  getAssignableMembers: async (projectId: string): Promise<AssignableMembersResponse> => {
    return apiRequest<AssignableMembersResponse>(`/projects/${projectId}/assignable-members`, {
      method: 'GET',
    });
  },

  // Get Project Details
  getProject: async (projectId: string): Promise<any> => {
    return apiRequest<any>(`/projects/${projectId}`, {
      method: 'GET',
    });
  },

  // Assign Members to Project
  assignMembersToProject: async (projectId: string, userIds: string[]): Promise<void> => {
    return apiRequest<void>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  },

  // Assign Single Member to Project with Role
  assignMemberToProject: async (projectId: string, userId: string, role: string, creatorId?: string): Promise<void> => {
    return apiRequest<void>('/projects/assign', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        role: role,
        creator_uid: creatorId
      }),
    });
  },

  // Remove Member from Project
  removeMemberFromProject: async (projectId: string, userId: string): Promise<void> => {
    return apiRequest<void>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  },
};
