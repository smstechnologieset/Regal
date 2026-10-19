'use client';

/**
 * ServicesContext
 *
 * Provides global state for Regal platform services.
 * Allows dynamic toggling of services from the Admin Dashboard,
 * synchronizing visibility across Header, Mobile Drawer, Homepage, and route guards.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { REGAL_SERVICES, DEFAULT_SERVICES_CONFIG, ServiceDefinition } from '@/lib/constants/services';

interface ServicesContextType {
  servicesConfig: Record<string, boolean>;
  services: ServiceDefinition[];
  activeServices: ServiceDefinition[];
  isServiceEnabled: (serviceId: string) => boolean;
  toggleService: (serviceId: string, enabled: boolean) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

const STORAGE_KEY = 'regal_services_config_v1';

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const [servicesConfig, setServicesConfig] = useState<Record<string, boolean>>(() => {
    // Check localStorage if available in browser
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_SERVICES_CONFIG, ...parsed };
        }
      } catch (e) {
        console.warn('[ServicesContext] Error reading local config:', e);
      }
    }
    return DEFAULT_SERVICES_CONFIG;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync from server API on mount
  useEffect(() => {
    let isMounted = true;
    async function syncWithServer() {
      try {
        const res = await fetch('/api/services/status');
        if (res.ok) {
          const data = await res.json();
          if (data && data.services && isMounted) {
            setServicesConfig((prev) => {
              const updated = { ...prev, ...data.services };
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (err) {
                  // ignore
                }
              }
              return updated;
            });
          }
        }
      } catch (err) {
        // Fall back gracefully to localStorage or DEFAULT_SERVICES_CONFIG
        console.warn('[ServicesContext] Server sync skipped or offline, using cached config');
      }
    }

    syncWithServer();
    return () => {
      isMounted = false;
    };
  }, []);

  const isServiceEnabled = useCallback(
    (serviceId: string): boolean => {
      if (serviceId in servicesConfig) {
        return !!servicesConfig[serviceId];
      }
      // If service is not explicitly in config, check default
      const found = REGAL_SERVICES.find((s) => s.id === serviceId);
      return found ? found.defaultEnabled : true;
    },
    [servicesConfig]
  );

  const toggleService = useCallback(
    async (serviceId: string, enabled: boolean): Promise<boolean> => {
      // Optimistic update
      const nextConfig = { ...servicesConfig, [serviceId]: enabled };
      setServicesConfig(nextConfig);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
        } catch (e) {
          // ignore
        }
      }

      // Try persisting to admin API
      try {
        const res = await fetch('/api/admin/services/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId, enabled, fullConfig: nextConfig }),
        });
        return res.ok;
      } catch (err) {
        console.warn('[ServicesContext] Could not persist to server, saved locally:', err);
        return true; // Local update succeeded
      }
    },
    [servicesConfig]
  );

  const resetToDefaults = useCallback(async () => {
    setServicesConfig(DEFAULT_SERVICES_CONFIG);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES_CONFIG));
      } catch (e) {
        // ignore
      }
    }
    try {
      await fetch('/api/admin/services/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullConfig: DEFAULT_SERVICES_CONFIG }),
      });
    } catch (err) {
      // ignore
    }
  }, []);

  const activeServices = useMemo(() => {
    return REGAL_SERVICES.filter((svc) => isServiceEnabled(svc.id));
  }, [isServiceEnabled]);

  const value = useMemo(
    () => ({
      servicesConfig,
      services: REGAL_SERVICES,
      activeServices,
      isServiceEnabled,
      toggleService,
      resetToDefaults,
      isLoading,
    }),
    [servicesConfig, activeServices, isServiceEnabled, toggleService, resetToDefaults, isLoading]
  );

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
