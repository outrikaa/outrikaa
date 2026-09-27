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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: member }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).eq('status', 'active').limit(1).maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);

    if (member?.workspace_id) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', member.workspace_id)
        .maybeSingle();
      setWorkspace((ws as Workspace) ?? null);
    } else {
      setWorkspace(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user) {
      await loadUserData(data.session.user.id);
    } else {
      setProfile(null);
      setWorkspace(null);
    }
  }, [loadUserData]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadUserData(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await loadUserData(s.user.id);
      } else {
        setProfile(null);
        setWorkspace(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
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
