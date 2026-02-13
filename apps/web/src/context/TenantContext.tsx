import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  plan_id: string | null;
  plan_name?: string;
  plan_code?: string;
  plan_features?: Record<string, boolean>;
  plan_limits?: Record<string, number>;
  settings: Record<string, any>;
  status: string;
  trial_ends_at: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  billing_email: string | null;
}

interface TenantUsage {
  users: { current: number; limit: number };
  products: { current: number; limit: number };
  customers: { current: number; limit: number };
  warehouses: { current: number; limit: number };
  integrations: { current: number; limit: number };
}

interface TenantContextType {
  settings: TenantSettings | null;
  usage: TenantUsage | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isWithinLimit: (resource: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated || !user?.tenantId) {
      setSettings(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get<TenantSettings>('/settings');
      setSettings(response.data);
    } catch {
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.tenantId]);

  const refreshUsage = useCallback(async () => {
    if (!isAuthenticated || !user?.tenantId) {
      setUsage(null);
      return;
    }

    try {
      const response = await apiClient.get<TenantUsage>('/settings/usage');
      setUsage(response.data);
    } catch {
      setUsage(null);
    }
  }, [isAuthenticated, user?.tenantId]);

  useEffect(() => {
    if (isAuthenticated && user?.tenantId) {
      refreshSettings();
      refreshUsage();
    } else {
      setSettings(null);
      setUsage(null);
    }
  }, [isAuthenticated, user?.tenantId, refreshSettings, refreshUsage]);

  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!settings?.plan_features) return false;
      return settings.plan_features[feature] === true;
    },
    [settings]
  );

  const isWithinLimit = useCallback(
    (resource: string): boolean => {
      if (!usage) return true;
      const resourceUsage = (usage as any)[resource];
      if (!resourceUsage) return true;
      const { current, limit } = resourceUsage;
      if (limit === -1) return true;
      return current < limit;
    },
    [usage]
  );

  return (
    <TenantContext.Provider
      value={{
        settings,
        usage,
        isLoading,
        refreshSettings,
        refreshUsage,
        hasFeature,
        isWithinLimit,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
