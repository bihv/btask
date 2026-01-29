/**
 * Plugin Provider
 * Loads and manages plugins for a board
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pluginLoader, type LoadedPlugin } from '@/lib/pluginLoader';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface PluginContextValue {
  plugins: LoadedPlugin[];
  loading: boolean;
  error: Error | null;
  refreshPlugins: () => Promise<void>;
}

const PluginContext = createContext<PluginContextValue | null>(null);

interface PluginProviderProps {
  children: ReactNode;
  boardId: string;
  boardName?: string;
}

export function PluginProvider({ children, boardId, boardName }: PluginProviderProps) {
  const { user } = useAuthStore();
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<Error | null>(null);

  const loadPlugins = async () => {
    if (!user || !boardId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch installed plugins from API
      const response = await api.get(`/boards/${boardId}/plugins`);
      const installations = response.data.data || response.data || [];

      // Load each plugin
      const loadedPlugins = await Promise.all(
        installations.map(async (inst: any) => {
          try {
            return await pluginLoader.loadPlugin(inst, {
              plugin: {
                id: inst.plugin_id,
                installationId: inst.id,
              },
              board: {
                id: boardId,
                name: boardName || 'Board',
              },
              user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
              },
              permissions: inst.plugin.permissions || [],
              settings: inst.settings || {},
            });
          } catch (err) {
            console.error(`Failed to load plugin ${inst.plugin.name}:`, err);
            return null;
          }
        })
      );

      setPlugins(loadedPlugins.filter(Boolean) as LoadedPlugin[]);
    } catch (err) {
      console.error('Failed to load plugins:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      // console.log('[PluginProvider] Settings updated, refreshing plugins...');
      loadPlugins();
    };

    window.addEventListener('plugin:settings:updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('plugin:settings:updated', handleSettingsUpdate);
    };
  }, [boardId, user?.id]);

  const value: PluginContextValue = {
    plugins,
    loading,
    error,
    refreshPlugins: loadPlugins,
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}

/**
 * Hook to access plugin context
 */
export function usePlugins() {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within PluginProvider');
  }
  return context;
}

/**
 * Optional hook to access plugin context (returns null if not in PluginProvider)
 */
export function usePluginsOptional() {
  return useContext(PluginContext);
}

/**
 * Hook to check if a specific capability is available
 */
export function usePluginCapability(capability: string) {
  const { plugins } = usePlugins();
  return plugins.some(p =>
    p.ready &&
    p.installation.plugin.capabilities?.some(cap => cap.capability === capability)
  );
}
