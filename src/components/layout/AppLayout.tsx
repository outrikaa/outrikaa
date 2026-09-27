import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Megaphone, Workflow, Mail, FileText, Sparkles, BarChart3,
  Inbox as InboxIcon, Plug, CreditCard, Settings, LifeBuoy, Search, Bell, Menu, X,
  ChevronsLeft, Sun, Moon, Command, LogOut, CheckCheck, Shield,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { CommandMenu, type CommandItem, Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { notificationService } from '@/services/db';
import type { Notification } from '@/types';
import { timeAgo, getInitials, cn } from '@/lib/utils';

const groups = [
  {
    label: 'Workspace',
    items: [
      { to: '/app', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/app/leads', icon: Users, label: 'Leads' },
      { to: '/app/campaigns', icon: Megaphone, label: 'Campaigns' },
      { to: '/app/sequences', icon: Workflow, label: 'Sequences' },
      { to: '/app/inbox', icon: InboxIcon, label: 'Inbox' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/app/ai-writer', icon: Sparkles, label: 'AI Writer' },
      { to: '/app/templates', icon: FileText, label: 'Templates' },
      { to: '/app/mailboxes', icon: Mail, label: 'Mailboxes' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/app/tasks', icon: CheckCheck, label: 'Tasks' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/app/integrations', icon: Plug, label: 'Integrations' },
      { to: '/app/billing', icon: CreditCard, label: 'Billing' },
      { to: '/app/settings', icon: Settings, label: 'Settings' },
      { to: '/help', icon: LifeBuoy, label: 'Help' },
    ],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const { profile, workspace, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!profile) return;
    notificationService.list(profile.id).then(setNotifs).catch(() => setNotifs([]));
  }, [profile, location.pathname]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const commands: CommandItem[] = useMemo(
    () => [
      { id: 'dash', label: 'Overview', group: 'Navigate', icon: <LayoutDashboard className="h-4 w-4" />, run: () => navigate('/app') },
      { id: 'leads', label: 'Leads', group: 'Navigate', icon: <Users className="h-4 w-4" />, run: () => navigate('/app/leads') },
      { id: 'campaigns', label: 'Campaigns', group: 'Navigate', icon: <Megaphone className="h-4 w-4" />, run: () => navigate('/app/campaigns') },
      { id: 'sequences', label: 'Sequences', group: 'Navigate', icon: <Workflow className="h-4 w-4" />, run: () => navigate('/app/sequences') },
      { id: 'ai', label: 'AI Writer', group: 'Navigate', icon: <Sparkles className="h-4 w-4" />, run: () => navigate('/app/ai-writer') },
      { id: 'analytics', label: 'Analytics', group: 'Navigate', icon: <BarChart3 className="h-4 w-4" />, run: () => navigate('/app/analytics') },
      { id: 'inbox', label: 'Inbox', group: 'Navigate', icon: <InboxIcon className="h-4 w-4" />, run: () => navigate('/app/inbox') },
      { id: 'mailboxes', label: 'Mailboxes', group: 'Navigate', icon: <Mail className="h-4 w-4" />, run: () => navigate('/app/mailboxes') },
      { id: 'templates', label: 'Templates', group: 'Navigate', icon: <FileText className="h-4 w-4" />, run: () => navigate('/app/templates') },
      { id: 'settings', label: 'Settings', group: 'Navigate', icon: <Settings className="h-4 w-4" />, run: () => navigate('/app/settings') },
      { id: 'billing', label: 'Billing', group: 'Navigate', icon: <CreditCard className="h-4 w-4" />, run: () => navigate('/app/billing') },
      { id: 'new-campaign', label: 'Create campaign', group: 'Actions', icon: <Megaphone className="h-4 w-4" />, run: () => navigate('/app/campaigns/new') },
      { id: 'new-lead', label: 'Add lead', group: 'Actions', icon: <Users className="h-4 w-4" />, run: () => navigate('/app/leads?new=1') },
      { id: 'import', label: 'Import leads (CSV)', group: 'Actions', icon: <Users className="h-4 w-4" />, run: () => navigate('/app/leads?import=1') },
      { id: 'write', label: 'Write an email with AI', group: 'Actions', icon: <Sparkles className="h-4 w-4" />, run: () => navigate('/app/ai-writer') },
      ...(isAdmin ? [{ id: 'admin', label: 'Admin panel', group: 'Actions', icon: <Shield className="h-4 w-4" />, run: () => navigate('/admin') }] : []),
      { id: 'theme', label: 'Toggle theme', group: 'Preferences', run: toggleTheme },
    ],
    [navigate, isAdmin, toggleTheme]
  );

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center h-16 px-4 border-b border-white/8', collapsed && 'justify-center px-2')}>
        <Logo to="/app" size={collapsed ? 'sm' : 'md'} className={cn(collapsed && 'justify-center')} />
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto hidden lg:grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:text-white hover:bg-white/8"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13px] font-medium transition-all',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary-500/15 text-primary-200 border border-primary-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-white/6 border border-transparent'
                    )
                  }
                >
                  <item.icon className="h-[17px] w-[17px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-white/8">
          <div className="rounded-xl bg-gradient-brand-soft border border-primary-500/20 p-3.5">
            <p className="text-xs font-semibold text-white">{workspace?.name ?? 'Your workspace'}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Free plan · {profile?.email}</p>
            <Link
              to="/app/billing"
              onClick={onNavigate}
              className="mt-2.5 inline-flex h-7 items-center rounded-lg bg-white/10 px-2.5 text-[11px] font-medium text-white hover:bg-white/20 transition-colors"
            >
              Upgrade plan
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-base-bg">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col border-r border-white/8 bg-base-bg-secondary/70 backdrop-blur-xl transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {sidebarContent()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-base-bg-secondary border-r border-white/10 animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[68px]' : 'lg:pl-60')}>
        <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-base-bg/85 backdrop-blur-xl flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/8"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8"
              aria-label="Expand sidebar"
            >
              <ChevronsLeft className="h-4 w-4 rotate-180" />
            </button>
          )}

          <button
            onClick={() => setCmdOpen(true)}
            className="flex-1 max-w-md flex items-center gap-2 h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-500 hover:border-white/20 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search or jump to…</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[10px] text-slate-500 border border-white/12 rounded px-1.5 py-0.5">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Dropdown
              align="right"
              trigger={
                <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              }
              panelClassName="w-[340px]"
            >
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/8">
                <p className="text-sm font-semibold text-white">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={async () => {
                      if (!profile) return;
                      await notificationService.markAllRead(profile.id);
                      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
                    }}
                    className="text-[11px] text-primary-400 hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notifs.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up</p>
                )}
                {notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      await notificationService.markRead(n.id);
                      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
                      if (n.link) navigate(n.link);
                    }}
                    className={cn(
                      'w-full text-left px-3.5 py-3 border-b border-white/5 hover:bg-white/5 transition-colors',
                      !n.is_read && 'bg-primary-500/5'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />}
                      <div className={cn('flex-1 min-w-0', n.is_read && 'pl-4')}>
                        <p className="text-[13px] font-medium text-white truncate">{n.title}</p>
                        {n.message && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>}
                        <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Dropdown>

            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-white/8 transition-colors">
                  <span className="h-7 w-7 grid place-items-center rounded-lg bg-gradient-brand text-[11px] font-bold text-white">
                    {getInitials(profile?.full_name || profile?.email || 'U')}
                  </span>
                </button>
              }
            >
              <div className="px-3.5 py-3 border-b border-white/8">
                <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Account'}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>
              <DropdownItem onClick={() => navigate('/app/settings/profile')}>Profile settings</DropdownItem>
              <DropdownItem onClick={() => navigate('/app/settings/workspace')}>Workspace settings</DropdownItem>
              <DropdownItem onClick={() => navigate('/app/billing')}>Billing & plan</DropdownItem>
              {isAdmin && (
                <>
                  <DropdownSeparator />
                  <DropdownItem onClick={() => navigate('/admin')} icon={<Shield className="h-4 w-4" />}>
                    Admin panel
                  </DropdownItem>
                </>
              )}
              <DropdownSeparator />
              <DropdownItem danger onClick={async () => { await signOut(); navigate('/'); }} icon={<LogOut className="h-4 w-4" />}>
                Sign out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} items={commands} />
    </div>
  );
}
