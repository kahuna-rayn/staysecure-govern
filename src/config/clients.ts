export interface ClientConfig {
  clientId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  displayName: string;
}

// Parse multi-client config from environment or fall back to single-client mode
const parseClientConfigs = (): Record<string, ClientConfig> => {
  const multiClientConfig = import.meta.env.VITE_CLIENT_CONFIGS;
  
  console.log('[clients.ts] Debug:', {
    hasViteClientConfigs: !!multiClientConfig,
    envKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')),
    viteSupabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  });
  
  if (multiClientConfig) {
    try {
      const parsed = JSON.parse(multiClientConfig);
      console.log('[clients.ts] Using multi-client configuration:', Object.keys(parsed));
      // Debug: Log the actual URLs being used
      Object.keys(parsed).forEach(clientId => {
        console.log(`[clients.ts] Client "${clientId}" config:`, {
          supabaseUrl: parsed[clientId].supabaseUrl,
          displayName: parsed[clientId].displayName
        });
      });
            // In govern/src/config/clients.ts, after line 29, add:
      console.log('[clients.ts] Parsed config keys:', Object.keys(parsed));
      console.log('[clients.ts] Default anon key exists:', !!parsed['default']?.supabaseAnonKey);
      return parsed;
    } catch (e) {
      console.error('[clients.ts] Failed to parse VITE_CLIENT_CONFIGS:', e);
    }
  }
  
  // Fallback to single-client (dev) mode
  const devUrl = import.meta.env.VITE_SUPABASE_URL;
  const devKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SB_PUB_KEY ||
    import.meta.env.VITE_SUPABASE_PUB_KEY;

  if (!devUrl || !devKey) {
    console.error('[clients.ts] Missing required environment variables: VITE_SUPABASE_URL and one of VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUB_KEY / VITE_SB_PUB_KEY must be set');
    throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUB_KEY, or VITE_SB_PUB_KEY environment variables.');
  }
  
  console.log('[clients.ts] Using single-client (dev) mode');
  return {
    'default': {
      clientId: 'default',
      supabaseUrl: devUrl,
      supabaseAnonKey: devKey,
      displayName: 'Default'
    }
  };
};

export const CLIENT_CONFIGS = parseClientConfigs();

