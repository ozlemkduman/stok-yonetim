import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string | null;
  userId: string;
  role: string;
  permissions: string[];
}

export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function getCurrentTenantId(): string | null {
  const context = tenantContextStorage.getStore();
  return context?.tenantId || null;
}

export function getCurrentUserId(): string | null {
  const context = tenantContextStorage.getStore();
  return context?.userId || null;
}

export function getCurrentUserRole(): string | null {
  const context = tenantContextStorage.getStore();
  return context?.role || null;
}

export function getCurrentUserPermissions(): string[] {
  const context = tenantContextStorage.getStore();
  return context?.permissions || [];
}

export function getTenantContext(): TenantContext | null {
  return tenantContextStorage.getStore() || null;
}

export function runInTenantContext<T>(context: TenantContext, fn: () => T): T {
  return tenantContextStorage.run(context, fn);
}
