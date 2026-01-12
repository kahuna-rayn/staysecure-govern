export interface ClientConfig {
  clientId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  displayName: string;
}

// Parse multi-client config from environment or fall back to single-client mode
const parseClientConfigs = (): Record<string, ClientConfig> => {
  const multiClientConfig = import.meta.env.VITE_CLIENT_CONFIGS;
  
  if (multiClientConfig) {
    try {
      const parsed = JSON.parse(multiClientConfig);
      return parsed;
    } catch (e) {
      console.error('[clients.ts] Failed to parse VITE_CLIENT_CONFIGS:', e);
      console.error('[clients.ts] Raw VITE_CLIENT_CONFIGS value (first 200 chars):', multiClientConfig.substring(0, 200));
      console.error('[clients.ts] VITE_CLIENT_CONFIGS length:', multiClientConfig.length);
      // Show the problematic area around position 157
      const errorPos = 157;
      const start = Math.max(0, errorPos - 20);
      const end = Math.min(multiClientConfig.length, errorPos + 20);
      console.error('[clients.ts] Context around error position:', multiClientConfig.substring(start, end));
      console.error('[clients.ts] Falling back to single-client mode');
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
