const API_BASE_URL = 'https://buildsphere-api-buildsp-service-thtkwwhsrf.cn-hangzhou.fcapp.run';

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

class RoleService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get all available permissions
  async getPermissions(): Promise<Permission[]> {
    return this.makeRequest<Permission[]>('/api/auth/permissions');
  }

  // Get all roles
  async getRoles(): Promise<Role[]> {
    return this.makeRequest<Role[]>('/api/auth/roles');
  }

  // Create a new role
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    return this.makeRequest<Role>('/api/auth/roles/create', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  // Update role permissions
  async updateRolePermissions(
    roleId: number,
    updateData: UpdateRolePermissionsRequest
  ): Promise<Role> {
    return this.makeRequest<Role>(`/api/auth/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete a role
  async deleteRole(roleId: number, adminUid: string): Promise<void> {
    return this.makeRequest<void>(`/api/auth/roles/${roleId}`, {
      method: 'DELETE',
      body: JSON.stringify({ admin_uid: adminUid }),
    });
  }

  // Assign role to user
  async assignRoleToUser(assignData: AssignRoleRequest): Promise<void> {
    return this.makeRequest<void>('/api/auth/users/role-dynamic', {
      method: 'PATCH',
      body: JSON.stringify(assignData),
    });
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    return this.makeRequest<UserPermissions>(`/api/auth/users/${userId}/permissions`);
  }

  // Get all users
  async getUsers(): Promise<any[]> {
    return this.makeRequest<any[]>('/api/auth/users');
  }
}

export const roleService = new RoleService(); 