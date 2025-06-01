import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  category?: string;
  requiredLevel?: number;
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  category,
  requiredLevel = 1,
  permissions = [],
  fallback = null,
  requireAll = false
}) => {
  const { hasPermission, hasAnyPermission, hasCategoryAccess, loading } = usePermissions();

  if (loading) {
    return <div className="animate-pulse bg-dark-800 rounded h-4 w-full"></div>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission, requiredLevel);
  } else if (category) {
    hasAccess = hasCategoryAccess(category, requiredLevel);
  } else if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = permissions.every(perm => hasPermission(perm, requiredLevel));
    } else {
      hasAccess = hasAnyPermission(permissions, requiredLevel);
    }
  } else {
    // If no permission criteria specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}; 