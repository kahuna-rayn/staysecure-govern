import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CLIENT_CONFIGS, ClientConfig } from '@/config/clients';

export const useClient = () => {
  const location = useLocation();
  
  const clientConfig = useMemo<ClientConfig | null>(() => {
    // Extract client ID from path (e.g., /rayn/dashboard -> 'rayn')
    const pathParts = location.pathname.split('/').filter(Boolean);
    const clientId = pathParts[0] || 'default';
    
    const config = CLIENT_CONFIGS[clientId] || CLIENT_CONFIGS['default'];
    
    // Return null instead of throwing - let the component handle the error display
    if (!config) {
      return null;
    }
    
    return config;
  }, [location.pathname]);
  
  return {
    clientId: clientConfig?.clientId || null,
    clientConfig,
  };
};

