import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roleService, UserPermissions } from '../services/roleService';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions['permissions']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const userPermissions = await roleService.getUserPermissions(user.id);
        setPermissions(userPermissions.permissions || []);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, [user?.id]);

  const hasPermission = (permissionName: string, requiredLevel: number = 1): boolean => {
    // Admin always has all permissions
    if (user?.role === 'admin') {
      return true;
    }

    const permission = permissions.find(p => p.permission_name === permissionName);
    return permission ? permission.level >= requiredLevel : false;
  };

  const getPermissionLevel = (permissionName: string): number => {
    if (user?.role === 'admin') {
      return 3; // Full access for admin
    }

    const permission = permissions.find(p => p.permission_name === permissionName);
    return permission?.level || 0;
  };

  const hasAnyPermission = (permissionNames: string[], requiredLevel: number = 1): boolean => {
    return permissionNames.some(name => hasPermission(name, requiredLevel));
  };

  const hasCategoryAccess = (category: string, requiredLevel: number = 1): boolean => {
    if (user?.role === 'admin') {
      return true;
    }

    return permissions.some(p => 
      p.category.toLowerCase() === category.toLowerCase() && 
      p.level >= requiredLevel
    );
  };

  return {
    permissions,
    loading,
    hasPermission,
    getPermissionLevel,
    hasAnyPermission,
    hasCategoryAccess
  };
}; 