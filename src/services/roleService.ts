import { apiRequest, API_BASE_URL } from '../utils/api';

export interface Permission {
  id: number;
  name: string;
  category: string;
  description: string;
}

export interface RolePermission {
  permission_id: number;
  level: number;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  permissions?: RolePermission[];
}

export interface CreateRoleRequest {
  admin_uid: string;
  role_name: string;
  description: string;
  permissions?: RolePermission[];
}

export interface AssignRoleRequest {
  admin_uid: string;
  user_id: string;
  new_role: string;
}

export interface UpdateRolePermissionsRequest {
  admin_uid: string;
  permissions: RolePermission[];
}

export interface UserPermissions {
  user_id: string;
  permissions: {
    permission_name: string;
    level: number;
    category: string;
  }[];
}

export const roleService = {
  // Get all available permissions
  getPermissions: async (): Promise<Permission[]> => {
    return apiRequest<Permission[]>('/auth/permissions');
  },

  // Get all roles
  getRoles: async (): Promise<Role[]> => {
    return apiRequest<Role[]>('/auth/roles');
  },

  // Create a new role
  createRole: async (roleData: CreateRoleRequest): Promise<Role> => {
    return apiRequest<Role>('/auth/roles/create', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  // Update role permissions
  updateRolePermissions: async (
    roleId: number,
    updateData: UpdateRolePermissionsRequest
  ): Promise<Role> => {
    return apiRequest<Role>(`/auth/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete a role
  deleteRole: async (roleId: number, adminUid: string): Promise<void> => {
    return apiRequest<void>(`/auth/roles/${roleId}`, {
      method: 'DELETE',
      body: JSON.stringify({ admin_uid: adminUid }),
    });
  },

  // Assign role to user (Dynamic)
  assignRoleToUser: async (assignData: AssignRoleRequest): Promise<void> => {
    return apiRequest<void>('/auth/users/role-dynamic', {
      method: 'PATCH',
      body: JSON.stringify(assignData),
    });
  },

  // Update User Role (Simple)
  updateUserRole: async (adminUid: string, userId: string, newRole: string): Promise<void> => {
    return apiRequest<void>('/auth/users/role', {
      method: 'PATCH',
      body: JSON.stringify({
        admin_uid: adminUid,
        user_id: userId,
        new_role: newRole
      }),
    });
  },

  // Get user permissions
  getUserPermissions: async (userId: string): Promise<UserPermissions> => {
    return apiRequest<UserPermissions>(`/auth/users/${userId}/permissions`);
  },

  // Get all users
  getUsers: async (): Promise<any[]> => {
    return apiRequest<any[]>('/auth/users');
  }
};
