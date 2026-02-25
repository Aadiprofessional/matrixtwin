import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { roleService, UserPermissions } from '../services/roleService';

interface Permission {
  permission_name: string;
  level: number;
  category: string;
}

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user?.id) {
      setLoading(false);
      setPermissions([]);
      return;
    }

    try {
      if (permissions.length === 0) {
        setLoading(true);
      }
      const userPermissions = await roleService.getUserPermissions(user.id);
      setPermissions(userPermissions.permissions || []);
    } catch (error) {
      console.error('Failed to load user permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPermissions([]);
    fetchPermissions();
  }, [user?.id]);

  return (
    <PermissionsContext.Provider value={{ permissions, loading, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
};
