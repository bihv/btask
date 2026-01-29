/**
 * React Hooks for Mello Plugin SDK
 */

import { useEffect, useState, useCallback, useContext, createContext, createElement } from 'react';
import type { MelloPlugin } from '../plugin';
import type { PluginContext, DataScope, Card } from '../types';
import type { ReactNode } from 'react';

// Plugin Context
const PluginReactContext = createContext<MelloPlugin | null>(null);

export function PluginProvider({
  plugin,
  children,
}: {
  plugin: MelloPlugin;
  children: ReactNode;
}) {
  return createElement(
    PluginReactContext.Provider,
    { value: plugin },
    children
  );
}

/**
 * Get plugin instance
 */
export function usePlugin(): MelloPlugin {
  const plugin = useContext(PluginReactContext);
  if (!plugin) {
    throw new Error('usePlugin must be used within PluginProvider');
  }
  return plugin;
}

/**
 * Get plugin context (board, card, user info)
 */
export function usePluginContext(): PluginContext | undefined {
  const plugin = usePlugin();
  const [context, setContext] = useState<PluginContext | undefined>(
    plugin.getContext()
  );

  useEffect(() => {
    const handleContextUpdate = () => {
      setContext(plugin.getContext());
    };

    plugin.on('context:updated', handleContextUpdate);
    return () => {
      plugin.off('context:updated', handleContextUpdate);
    };
  }, [plugin]);

  return context;
}

/**
 * Get and set plugin data with React state
 */
export function usePluginData<T = any>(
  scope: DataScope,
  entityId: string,
  key: string,
  initialValue?: T
): [T | null, (value: T) => Promise<void>, boolean, Error | null] {
  const plugin = usePlugin();
  const [data, setData] = useState<T | null>(initialValue || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load data function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await plugin.getData<T>(scope, entityId, key);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [plugin, scope, entityId, key]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for data updates and re-fetch
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      const { scope: updatedScope, entityId: updatedEntityId, key: updatedKey } = event.detail;
      // Re-fetch if this data was updated
      if (updatedScope === scope && updatedEntityId === entityId && updatedKey === key) {
        console.log('[usePluginData] Data updated, re-fetching:', { scope, entityId, key });
        loadData();
      }
    };

    window.addEventListener('plugin:data:updated', handleDataUpdate as EventListener);
    return () => {
      window.removeEventListener('plugin:data:updated', handleDataUpdate as EventListener);
    };
  }, [scope, entityId, key, loadData]);

  // Update function
  const updateData = useCallback(
    async (value: T) => {
      try {
        setLoading(true);
        await plugin.setData(scope, entityId, key, value);
        setData(value);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save data'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [plugin, scope, entityId, key]
  );

  return [data, updateData, loading, error];
}

/**
 * Get card data
 */
export function useCard(cardId: string): {
  card: Card | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const plugin = usePlugin();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await plugin.api.getCard(cardId);
      setCard(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load card'));
    } finally {
      setLoading(false);
    }
  }, [plugin, cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  return { card, loading, error, refresh: loadCard };
}

/**
 * Listen to plugin events
 */
export function usePluginEvent(
  event: string,
  callback: (payload: any) => void
): void {
  const plugin = usePlugin();

  useEffect(() => {
    plugin.on(event, callback);
    return () => {
      plugin.off(event, callback);
    };
  }, [plugin, event, callback]);
}

/**
 * Show snackbar notification
 */
export function useSnackbar() {
  const plugin = usePlugin();

  return useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      plugin.showSnackbar(message, type);
    },
    [plugin]
  );
}

/**
 * Show modal dialog
 */
export function useModal() {
  const plugin = usePlugin();

  const showModal = useCallback(
    (options: {
      title: string;
      content: React.ReactNode;
      width?: number;
      height?: number;
    }) => {
      plugin.showModal(options);
    },
    [plugin]
  );

  const closeModal = useCallback(() => {
    plugin.closeModal();
  }, [plugin]);

  return { showModal, closeModal };
}

/**
 * Check if plugin has permission
 */
export function usePermission(permission: string): boolean {
  const plugin = usePlugin();
  return plugin.hasPermission(permission);
}

/**
 * Get plugin setting value
 */
export function useSetting<T = any>(key: string, defaultValue?: T): T | undefined {
  const plugin = usePlugin();
  return plugin.getSetting<T>(key) ?? defaultValue;
}
