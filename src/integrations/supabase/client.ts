import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { CLIENT_CONFIGS } from '@/config/clients';

// Helper to get current client ID from window location or stored session
export const getCurrentClientId = (): string => {
  if (typeof window === 'undefined') return 'default';
  
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathClientId = pathParts[0] || null;
  
  // If visiting root path (/), clear any stored client ID to prevent cross-database access
  // Root path should use explicit default client or show error, not previously stored client
  if (pathParts.length === 0 && typeof window !== 'undefined') {
    sessionStorage.removeItem('currentClientId');
  }
  
  // Check if pathClientId is a valid client ID
  if (pathClientId && CLIENT_CONFIGS[pathClientId]) {
    // Store it for future use (when navigating to routes without client prefix)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentClientId', pathClientId);
    }
    return pathClientId;
  }
  
  // Path doesn't contain a valid client ID (e.g., /admin, /forgot-password)
  // Use stored client ID from session ONLY for non-root paths
  // This preserves context when navigating from /rayn/admin to /admin
  // But prevents cross-database access when visiting root /
  if (pathParts.length > 0 && typeof window !== 'undefined') {
    const storedClientId = sessionStorage.getItem('currentClientId');
    if (storedClientId && CLIENT_CONFIGS[storedClientId]) {
      return storedClientId;
    }
  }
  
  // For root path (/), require explicit client - never auto-select, even if only one client exists
  // This prevents unauthorized access to production databases via root path
  const availableClients = Object.keys(CLIENT_CONFIGS);
  const isRootPath = pathParts.length === 0;
  
  if (isRootPath) {
    // Root path requires explicit client or default client - never auto-select
    if (CLIENT_CONFIGS['default']) {
      return 'default';
    }
    // No default client - require explicit client path
    return null as any; // Will cause error to be shown
  }
  
  // Not root path - for non-root paths (e.g., /admin), allow single client fallback
  // This preserves context when navigating between routes
  if (availableClients.length === 1) {
    const singleClientId = availableClients[0];
    return singleClientId;
  }
  
  // Multiple clients exist, try default
  if (CLIENT_CONFIGS['default']) {
    return 'default';
  }
  
  // No default, multiple clients, non-root path
  return null as any; // Type assertion needed, but getClientConfig will handle null
  
  // No clients available - error state
  return null as any; // Will cause error in getClientConfig
};

// Get the client config
const getClientConfig = () => {
  const clientId = getCurrentClientId();
  const isRootPath = typeof window !== 'undefined' && window.location.pathname === '/';
  
  // Handle null clientId (no client found, no default)
  // On root path, always throw error if no client specified (never auto-select)
  if (clientId === null) {
    const availableClients = Object.keys(CLIENT_CONFIGS);
    if (isRootPath || availableClients.length > 1) {
      // Root path OR multiple clients but no default - show error
      throw new Error('NO_CLIENT_SPECIFIED');
    }
  }
  
  const config = CLIENT_CONFIGS[clientId] || CLIENT_CONFIGS['default'];
  
  if (!config) {
    // Last resort: if only one client exists and NOT on root path, use it
    // Root path should never use this fallback
    const availableClients = Object.keys(CLIENT_CONFIGS);
    if (!isRootPath && availableClients.length === 1) {
      const singleClientConfig = CLIENT_CONFIGS[availableClients[0]];
      return {
        supabaseUrl: singleClientConfig.supabaseUrl,
        supabaseAnonKey: singleClientConfig.supabaseAnonKey
      };
    }
    
    const fallbackUrl = import.meta.env.VITE_SUPABASE_URL;
    const fallbackKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SB_PUB_KEY ||
      import.meta.env.VITE_SUPABASE_PUB_KEY;
    
    if (!fallbackUrl || !fallbackKey) {
      throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUB_KEY, or VITE_SB_PUB_KEY environment variables.');
    }
    
    return {
      supabaseUrl: fallbackUrl,
      supabaseAnonKey: fallbackKey
    };
  }
  
  return {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey
  };
};

// Cache clients by clientId to avoid recreating them unnecessarily
const clientCache = new Map<string, SupabaseClient<Database>>();

// Get or create Supabase client for current path
const getSupabaseClient = (): SupabaseClient<Database> => {
  try {
    const pathParts = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean) : [];
    const isRootPath = pathParts.length === 0;
    
    // Early check: if on root path without default client, return a dummy client
    // This prevents errors when AuthProvider initializes before Index.tsx renders
    if (isRootPath && typeof window !== 'undefined' && !CLIENT_CONFIGS['default']) {
      // Return a dummy client with invalid config to prevent actual database access
      // The error page will be shown by Index.tsx instead
      const dummyUrl = 'https://dummy.supabase.co';
      const dummyKey = 'dummy-key';
      const dummyCacheKey = 'dummy-client';
      
      if (!clientCache.has(dummyCacheKey)) {
        const dummyClient = createClient<Database>(dummyUrl, dummyKey);
        clientCache.set(dummyCacheKey, dummyClient);
      }
      
      return clientCache.get(dummyCacheKey)!;
    }
    
    const clientId = getCurrentClientId();
    
    // Return cached client if it exists
    if (clientCache.has(clientId)) {
      return clientCache.get(clientId)!;
    }
    
    // Create new client
    let supabaseUrl: string;
    let supabaseAnonKey: string;
    
    try {
      const config = getClientConfig();
      supabaseUrl = config.supabaseUrl;
      supabaseAnonKey = config.supabaseAnonKey;
    } catch (error: any) {
      // If we get NO_CLIENT_SPECIFIED error, return dummy client for root path
      if (error.message === 'NO_CLIENT_SPECIFIED' && isRootPath) {
        const dummyUrl = 'https://dummy.supabase.co';
        const dummyKey = 'dummy-key';
        const dummyCacheKey = 'dummy-client';
        
        if (!clientCache.has(dummyCacheKey)) {
          const dummyClient = createClient<Database>(dummyUrl, dummyKey);
          clientCache.set(dummyCacheKey, dummyClient);
        }
        
        return clientCache.get(dummyCacheKey)!;
      }
      // Re-throw other errors
      throw error;
    }
    
    // Use client-specific storage key to avoid conflicts between different Supabase projects
    // Supabase creates storage keys based on the project URL hash, so we namespace by clientId
    const storageKey = `sb-${clientId}-auth-token`;
    
    // Clean up any old localStorage entries that might reference wrong Supabase projects
    // Supabase storage keys look like: sb-<project-ref-hash>-auth-token
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('auth-token') && !key.includes(clientId)) {
          // This is an auth token from a different client/project - remove it
          keysToRemove.push(key);
        }
      }
      if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    }
    
    const customStorage = {
      getItem: (key: string) => {
        // Supabase uses keys like 'sb-<project-ref>-auth-token'
        // Map to our client-specific key
        const actualKey = key.includes('auth-token') ? storageKey : key;
        const value = localStorage.getItem(actualKey);
        
        return value;
      },
      setItem: (key: string, value: string) => {
        const actualKey = key.includes('auth-token') ? storageKey : key;
        
        localStorage.setItem(actualKey, value);
      },
      removeItem: (key: string) => {
        const actualKey = key.includes('auth-token') ? storageKey : key;
        localStorage.removeItem(actualKey);
      },
    };
    
    const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: customStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    
    // Cache it
    clientCache.set(clientId, client);
    
    console.log('[supabase client] Successfully created client for:', clientId, 'URL:', supabaseUrl);
    
    return client;
  } catch (error: any) {
    console.error('[supabase client] Error creating client:', error);
    console.error('[supabase client] Error message:', error?.message);
    console.error('[supabase client] Error stack:', error?.stack);
    console.error('[supabase client] Error name:', error?.name);
    throw error;
  }
};

// Export a getter function that always returns the current client
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    try {
      const client = getSupabaseClient();
      const value = client[prop as keyof SupabaseClient<Database>];
      return typeof value === 'function' ? value.bind(client) : value;
    } catch (error: any) {
      console.error('[supabase client] Error accessing property:', prop, error);
      console.error('[supabase client] Error message:', error?.message);
      console.error('[supabase client] Error stack:', error?.stack);
      throw error;
    }
  }
});
