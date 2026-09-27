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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile + workspace in a single parallel round trip (was 2 sequential batches).
  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: member }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('workspace_members')
        .select('workspace_id, workspace:workspaces(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);

    const embedded = (member as { workspace?: Workspace } | null)?.workspace;
    if (embedded) {
      setWorkspace(embedded);
    } else if (member?.workspace_id) {
      const { data: ws } = await supabase.from('workspaces').select('*').eq('id', member.workspace_id).maybeSingle();
      setWorkspace((ws as Workspace) ?? null);
    } else {
      setWorkspace(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        await loadUserData(data.session.user.id);
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
            await loadUserData(data.session.user.id);
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
        loadUserData(s.user.id).catch((err) => console.error('[auth] profile load failed', err));
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
