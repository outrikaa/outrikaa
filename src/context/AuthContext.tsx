import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Workspace } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Never let a failed/slow request keep the app stuck on the loading screen. */
const AUTH_READY_TIMEOUT_MS = 4000;

// Concurrent auth events (INITIAL_SESSION + token refresh) must not each create a workspace.
let workspaceSelfHeal: Promise<Workspace | null> | null = null;

/**
 * Users whose signup-time workspace setup failed would otherwise see endless
 * loading skeletons on every page: each page waits for a workspace that never
 * arrives. Create one on the fly instead.
 */
function ensureWorkspace(userId: string): Promise<Workspace | null> {
  if (workspaceSelfHeal) return workspaceSelfHeal;
  workspaceSelfHeal = (async () => {
    try {
      // The id is generated client-side because the RLS SELECT policy may not see
      // the new row until the membership insert below has landed.
      const id = crypto.randomUUID();
      const slug = `ws-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
      const { error } = await supabase
        .from('workspaces')
        .insert({ id, name: 'My workspace', owner_id: userId, slug });
      if (error) throw error;
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: id, user_id: userId, role: 'owner', status: 'active' });
      if (memberError) throw memberError;
      // Best effort trial row; a failure here must not block the app.
      supabase
        .from('subscriptions')
        .insert({ workspace_id: id, status: 'trialing', billing_cycle: 'monthly' })
        .then(() => {}, () => {});
      console.warn('[auth] workspace was missing — created a new one', id);
      const { data: ws, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (fetchError) throw fetchError;
      return (ws as Workspace) ?? {
        id,
        name: 'My workspace',
        slug,
        owner_id: userId,
        logo_url: null,
        industry: null,
        company_size: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[auth] workspace self-heal failed:', err instanceof Error ? err.message : err);
      return null;
    } finally {
      workspaceSelfHeal = null;
    }
  })();
  return workspaceSelfHeal;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile + workspace in a single parallel round trip (was 2 sequential batches).
  const loadUserData = useCallback(async (userId: string, email?: string) => {
    const [profRes, memberRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('workspace_members')
        .select('workspace_id, workspace:workspaces(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
    ]);
    if (profRes.error) console.warn('[auth] profiles query failed:', profRes.error.message);
    if (memberRes.error) console.warn('[auth] workspace_members query failed:', memberRes.error.message);

    let prof = (profRes.data as Profile) ?? null;
    if (!prof && email) {
      // Signup's profile insert can fail silently; retry here so the app has a profile.
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({ id: userId, email })
        .select('*')
        .maybeSingle();
      if (error) console.warn('[auth] profile self-heal failed:', error.message);
      prof = (created as Profile) ?? null;
    }
    setProfile(prof);

    const member = memberRes.data as { workspace_id?: string; workspace?: Workspace } | null;
    let ws = member?.workspace ?? null;
    if (!ws && member?.workspace_id) {
      const { data, error } = await supabase.from('workspaces').select('*').eq('id', member.workspace_id).maybeSingle();
      if (error) console.warn('[auth] workspaces query failed:', error.message);
      ws = (data as Workspace) ?? null;
    }
    // Only self-heal on a clean "no membership" result. If the query itself errored
    // (e.g. RLS recursion), we can't know whether a workspace exists — creating one
    // on every login would spam duplicates.
    if (!ws && !memberRes.error) {
      ws = await ensureWorkspace(userId);
    }
    setWorkspace(ws);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        await loadUserData(data.session.user.id, data.session.user.email ?? undefined);
      } else {
        setProfile(null);
        setWorkspace(null);
      }
    } catch (err) {
      console.error('[auth] refresh failed', err);
      setProfile(null);
      setWorkspace(null);
    }
  }, [loadUserData]);

  useEffect(() => {
    let mounted = true;
    // Safety net: even if every promise hangs, the UI must become interactive.
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, AUTH_READY_TIMEOUT_MS);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          try {
            await loadUserData(data.session.user.id, data.session.user.email ?? undefined);
          } catch (err) {
            console.error('[auth] profile load failed', err);
          }
        }
      } catch (err) {
        console.error('[auth] init failed', err);
      } finally {
        if (mounted) {
          clearTimeout(failsafe);
          setLoading(false);
        }
      }
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Deliberately not awaited: awaiting Supabase calls inside this callback
        // can deadlock against the auth client's internal lock.
        loadUserData(s.user.id, s.user.email ?? undefined).catch((err) => console.error('[auth] profile load failed', err));
      } else {
        setProfile(null);
        setWorkspace(null);
      }
      clearTimeout(failsafe);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWorkspace(null);
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    workspace,
    loading,
    isAdmin: profile?.is_admin === true,
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
