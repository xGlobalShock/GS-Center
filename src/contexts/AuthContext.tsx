import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  type UserProfile,
  type AuthProvider as AuthProviderType,
} from '../lib/supabase';

/* ═══════════════════════════════════════════════════════════════════
   Context shape
═══════════════════════════════════════════════════════════════════ */
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  appReady: boolean;
  isExpired: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  currentProvider: AuthProviderType;
  login: (provider: 'discord' | 'twitch') => Promise<void>;
  logout: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  grantPro: (userId: string, expiresAt: string | null) => Promise<boolean>;
  revokePro: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ═══════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════ */
function _checkExpired(profile: UserProfile | null): boolean {
  if (!profile || profile.role !== 'pro') return false;
  if (!profile.pro_expires_at) return false;
  return new Date(profile.pro_expires_at).getTime() < Date.now();
}

// Hard timeout on the profile DB query.
// On a post-update first launch the system is busy (NSIS extraction, Defender
// scans, Chromium V8 bytecode recompile, token refresh) and a cold Supabase
// request can take 10-30s — far exceeding the splash app:ready safety cap.
// If the fetch doesn't complete in time appReady fires with profile=null and
// the background retry effect re-fetches it once the system settles.
const PROFILE_FETCH_TIMEOUT_MS = 5_000;
const PROFILE_RETRY_DELAYS     = [2_000, 5_000, 10_000];

async function _fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), PROFILE_FETCH_TIMEOUT_MS),
    );
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => (error || !data ? null : (data as UserProfile)));
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Provider
═══════════════════════════════════════════════════════════════════ */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Prevent multiple simultaneous profile fetches
  const fetchingRef = useRef(false);

  /* ── Load profile for an authenticated user ─────────────────────── */
  const loadProfile = useCallback(async (u: User) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const p = await _fetchProfile(u.id);
      setProfile(p);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  /* ── Initialise: restore session & subscribe to auth changes ─────── */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setAppReady(true);
      return;
    }

    let mounted = true;

    // Restore existing session.
    // Use try/finally so setAppReady(true) is GUARANTEED even if getSession()
    // rejects or loadProfile() throws — the splash screen depends on this.
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        }
      } catch (_) {
        // swallow — partial state is fine; appReady must still fire
      } finally {
        if (mounted) {
          setLoading(false);
          setAppReady(true);
        }
      }
    };
    init();

    // Live auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /* ── Background profile retry ─────────────────────────────────────── */
  // If _fetchProfile timed out during init (post-update first launch), this
  // retries with escalating delays once the app is visible so the user's
  // plan/role info appears shortly after the blank-screen window is revealed.
  useEffect(() => {
    if (!user || profile || !appReady) return;
    let cancelled = false;
    (async () => {
      for (const delay of PROFILE_RETRY_DELAYS) {
        await new Promise(r => setTimeout(r, delay));
        if (cancelled) return;
        const p = await _fetchProfile(user.id);
        if (p) { if (!cancelled) setProfile(p); return; }
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile, appReady]);

  /* ── Listen for tokens sent by Electron after OAuth popup ───────── */
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ipc = (window as any).electron?.ipcRenderer;
    if (!ipc) return;

    // Implicit flow: main sends { access_token, refresh_token }
    const unsubCallback = ipc.on(
      'auth:callback',
      async ({ access_token, refresh_token }: { access_token: string; refresh_token: string }) => {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error && data.user) {
          setUser(data.user);
          await loadProfile(data.user);
          setLoading(false);
          setAppReady(true);
        }
      },
    );

    // PKCE flow: main sends { code }
    const unsubCode = ipc.on(
      'auth:callback-code',
      async ({ code }: { code: string }) => {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.user) {
          setUser(data.user);
          await loadProfile(data.user);
          setLoading(false);
          setAppReady(true);
        }
      },
    );

    return () => {
      if (typeof unsubCallback === 'function') unsubCallback();
      if (typeof unsubCode === 'function') unsubCode();
    };
  }, [loadProfile]);

  /* ── Actions ─────────────────────────────────────────────────────── */
  const login = useCallback(async (provider: 'discord' | 'twitch') => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: 'http://localhost:3000/auth/callback', skipBrowserRedirect: true },
    });
    if (error || !data.url) return;
    const ipc = (window as any).electron?.ipcRenderer;
    if (ipc) {
      ipc.invoke('auth:open-oauth', data.url).catch(() => {});
    } else {
      window.open(data.url, '_blank');
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await _fetchProfile(user.id);
    setProfile(p);
  }, [user]);

  const cancelSubscription = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    await supabase
      .from('profiles')
      .update({ subscription_status: 'cancelled' })
      .eq('id', user.id);
    await refreshProfile();
  }, [user, refreshProfile]);

  const grantPro = useCallback(async (
    userId: string,
    expiresAt: string | null,
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const updates: Partial<UserProfile> = {
      role: 'pro',
      pro_source: 'manual',
      pro_expires_at: expiresAt,
      subscription_status: 'active',
    };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return !error;
  }, []);

  const revokePro = useCallback(async (userId: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;
    const updates: Partial<UserProfile> = {
      role: 'user',
      pro_source: null,
      pro_expires_at: null,
      subscription_status: null,
    };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return !error;
  }, []);

  /* ── Derived values ──────────────────────────────────────────────── */
  const isExpired = _checkExpired(profile);
  const isOwner   = profile?.role === 'owner';
  const isAdmin   = profile?.role === 'admin' || isOwner;
  const isPro     = isAdmin || (profile?.role === 'pro' && !isExpired);
  const currentProvider: AuthProviderType = profile?.provider ?? null;

  /* ── Value ───────────────────────────────────────────────────────── */
  const value: AuthContextValue = {
    user,
    profile,
    loading,
    appReady,
    isExpired,
    isPro,
    isAdmin,
    isOwner,
    currentProvider,
    login,
    logout,
    cancelSubscription,
    refreshProfile,
    grantPro,
    revokePro,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ═══════════════════════════════════════════════════════════════════
   Hook
═══════════════════════════════════════════════════════════════════ */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
