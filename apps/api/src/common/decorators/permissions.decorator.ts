import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS = {
  // Sales
  SALES_VIEW: 'sales.view',
  SALES_CREATE: 'sales.create',
  SALES_UPDATE: 'sales.update',
  SALES_DELETE: 'sales.delete',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  // Returns
  RETURNS_VIEW: 'returns.view',
  RETURNS_CREATE: 'returns.create',
  RETURNS_UPDATE: 'returns.update',
  RETURNS_DELETE: 'returns.delete',

  // Expenses
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',

  // Accounts
  ACCOUNTS_VIEW: 'accounts.view',
  ACCOUNTS_CREATE: 'accounts.create',
  ACCOUNTS_UPDATE: 'accounts.update',
  ACCOUNTS_DELETE: 'accounts.delete',

  // Warehouses
  WAREHOUSES_VIEW: 'warehouses.view',
  WAREHOUSES_CREATE: 'warehouses.create',
  WAREHOUSES_UPDATE: 'warehouses.update',
  WAREHOUSES_DELETE: 'warehouses.delete',

  // Quotes
  QUOTES_VIEW: 'quotes.view',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_UPDATE: 'quotes.update',
  QUOTES_DELETE: 'quotes.delete',

  // E-Documents
  EDOCUMENTS_VIEW: 'edocuments.view',
  EDOCUMENTS_CREATE: 'edocuments.create',
  EDOCUMENTS_UPDATE: 'edocuments.update',
  EDOCUMENTS_DELETE: 'edocuments.delete',

  // Integrations
  INTEGRATIONS_VIEW: 'integrations.view',
  INTEGRATIONS_CREATE: 'integrations.create',
  INTEGRATIONS_UPDATE: 'integrations.update',
  INTEGRATIONS_DELETE: 'integrations.delete',

  // CRM
  CRM_VIEW: 'crm.view',
  CRM_CREATE: 'crm.create',
  CRM_UPDATE: 'crm.update',
  CRM_DELETE: 'crm.delete',

  // Field Team
  FIELD_TEAM_VIEW: 'fieldteam.view',
  FIELD_TEAM_CREATE: 'fieldteam.create',
  FIELD_TEAM_UPDATE: 'fieldteam.update',
  FIELD_TEAM_DELETE: 'fieldteam.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Users
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
