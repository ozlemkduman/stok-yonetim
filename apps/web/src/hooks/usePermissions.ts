import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const PERMISSIONS = {
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  RETURNS_VIEW: 'returns.view',
  RETURNS_CREATE: 'returns.create',
  RETURNS_UPDATE: 'returns.update',
  RETURNS_DELETE: 'returns.delete',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',
  ACCOUNTS_VIEW: 'accounts.view',
  ACCOUNTS_CREATE: 'accounts.create',
  ACCOUNTS_UPDATE: 'accounts.update',
  ACCOUNTS_DELETE: 'accounts.delete',
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_CREATE: 'warehouses.create',
  WAREHOUSES_UPDATE: 'warehouses.update',
  WAREHOUSES_DELETE: 'warehouses.delete',
  QUOTES_VIEW: 'quotes.view',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',
  EDOCUMENTS_VIEW: 'edocuments.view',
  EDOCUMENTS_CREATE: 'edocuments.create',
  EDOCUMENTS_UPDATE: 'edocuments.update',
  EDOCUMENTS_DELETE: 'edocuments.delete',
  INTEGRATIONS_VIEW: 'integrations.view',
  INTEGRATIONS_CREATE: 'integrations.create',
  INTEGRATIONS_UPDATE: 'integrations.update',
  INTEGRATIONS_DELETE: 'integrations.delete',
  CRM_VIEW: 'crm.view',
  CRM_CREATE: 'crm.create',
  CRM_UPDATE: 'crm.update',
  CRM_DELETE: 'crm.delete',
  FIELD_TEAM_VIEW: 'fieldteam.view',
  FIELD_TEAM_CREATE: 'fieldteam.create',
  FIELD_TEAM_UPDATE: 'fieldteam.update',
  FIELD_TEAM_DELETE: 'fieldteam.delete',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;

      // Super admin and tenant admin have all permissions
      if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.TENANT_ADMIN) {
        return true;
      }

      // Check for wildcard permission
      if (user.permissions?.includes('*')) {
        return true;
      }

      return user.permissions?.includes(permission) || false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (...permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (...permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles: UserRole[]): boolean => {
      return roles.some((r) => user?.role === r);
    },
    [user]
  );

  const isSuperAdmin = useCallback((): boolean => {
    return user?.role === USER_ROLES.SUPER_ADMIN;
  }, [user]);

  const isTenantAdmin = useCallback((): boolean => {
    return user?.role === USER_ROLES.TENANT_ADMIN;
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isTenantAdmin,
  };
}
