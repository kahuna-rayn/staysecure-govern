import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import debug from '@/utils/debug';

/**
 * Handles the OAuth PKCE callback from Supabase after Microsoft Entra login.
 *
 * Flow:
 *   Microsoft → Supabase (auth/v1/callback) → this page (?code=...&state=...)
 *
 * The Supabase JS client automatically exchanges the `code` for a session when
 * it detects `?code=` in the URL (detectSessionInUrl defaults to true).
 * We just need to wait for onAuthStateChange to confirm the session, then
 * redirect to the correct client dashboard.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    debug.log('[AuthCallbackPage] mounted', { search: location.search });

    // Extract the client prefix from the current path so we can redirect back
    // to the right client dashboard (e.g. /rayn → /rayn after login).
    const pathParts = location.pathname.split('/').filter(Boolean);
    // pathParts[0] is the client segment (e.g. 'rayn'), pathParts[1] is 'auth'
    const clientSegment = pathParts.length >= 2 ? pathParts[0] : '';
    const clientPrefix = clientSegment ? `/${clientSegment}` : '';

    const searchParams = new URLSearchParams(location.search);
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      debug.log('[AuthCallbackPage] OAuth error', { errorParam, errorDescription });
      setError(errorDescription || errorParam);
      return;
    }

    // The Supabase client automatically exchanges ?code= for a session.
    // Listen for the SIGNED_IN event; AuthProvider will then handle JIT
    // profile creation and the inactive gate.
    const code = searchParams.get('code');

    if (code) {
      // PKCE flow: explicitly exchange the code for a session.
      debug.log('[AuthCallbackPage] PKCE code found → exchanging');
      supabase.auth.exchangeCodeForSession(window.location.href)
        .then(({ error: exchangeError }) => {
          if (exchangeError) {
            debug.log('[AuthCallbackPage] exchangeCodeForSession error', exchangeError.message);
            setError(exchangeError.message);
            return;
          }
          debug.log('[AuthCallbackPage] code exchanged → navigating to', clientPrefix || '/');
          navigate(clientPrefix || '/', { replace: true });
        });
      return;
    }

    // Implicit flow: Supabase returned tokens in the URL hash and the client
    // already processed them (onAuthStateChange SIGNED_IN will have fired or
    // will fire shortly). Just wait for it and redirect.
    debug.log('[AuthCallbackPage] no PKCE code — waiting for implicit-flow SIGNED_IN');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debug.log('[AuthCallbackPage] onAuthStateChange', event, session?.user?.email);
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        navigate(clientPrefix || '/', { replace: true });
      }
    });

    // Also check if we already have a session (SIGNED_IN may have fired before
    // this listener was registered).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        debug.log('[AuthCallbackPage] session already present → navigating');
        subscription.unsubscribe();
        navigate(clientPrefix || '/', { replace: true });
      }
    });

    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      debug.log('[AuthCallbackPage] timeout — no session established');
      setError('Sign-in timed out. Please try again.');
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const clientSegment = pathParts.length >= 2 ? pathParts[0] : '';
    const clientPrefix = clientSegment ? `/${clientSegment}` : '';

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm p-6">
          <p className="text-destructive font-medium">Sign-in failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            className="text-sm underline text-primary"
            onClick={() => navigate(clientPrefix || '/', { replace: true })}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
