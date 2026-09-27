import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Users, Megaphone, Mail, CreditCard, FileText,
  Settings, ScrollText, LifeBuoy, Flag, Plug, BarChart3, MessageSquare, LogOut, Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials } from '@/lib/utils';

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/workspaces', icon: Shield, label: 'Workspaces' },
  { to: '/admin/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/admin/email-activity', icon: Mail, label: 'Email Activity' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/plans', icon: BarChart3, label: 'Plans' },
  { to: '/admin/ai-usage', icon: Sparkles, label: 'AI Usage' },
  { to: '/admin/templates', icon: FileText, label: 'Templates' },
  { to: '/admin/integrations', icon: Plug, label: 'Integrations' },
  { to: '/admin/cms', icon: ScrollText, label: 'CMS' },
  { to: '/admin/blog', icon: FileText, label: 'Blog' },
  { to: '/admin/testimonials', icon: MessageSquare, label: 'Testimonials' },
  { to: '/admin/help', icon: LifeBuoy, label: 'Help Articles' },
  { to: '/admin/support', icon: MessageSquare, label: 'Support' },
  { to: '/admin/feature-flags', icon: Flag, label: 'Feature Flags' },
  { to: '/admin/settings', icon: Settings, label: 'System Settings' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-4 border-b border-white/8 gap-2">
        <Logo to="/admin" size="sm" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-warning-400 border border-warning-500/40 rounded px-1.5 py-0.5">
          Admin
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13px] transition-all',
                isActive
                  ? 'bg-warning-500/15 text-warning-200 border border-warning-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/6 border border-transparent'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/8 space-y-1">
        <Link
          to="/app"
          className="flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13px] text-slate-400 hover:text-white hover:bg-white/6"
        >
          <LayoutDashboard className="h-4 w-4" /> User dashboard
        </Link>
        <button
          onClick={async () => { await signOut(); navigate('/'); }}
          className="w-full flex items-center gap-3 h-9 px-2.5 rounded-lg text-[13px] text-error-400 hover:bg-error-500/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block border-r border-white/8 bg-base-bg-secondary/70 backdrop-blur-xl">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-base-bg-secondary border-r border-white/10">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-base-bg/85 backdrop-blur-xl flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden h-9 w-9 grid place-items-center rounded-lg text-slate-400 hover:bg-white/8"
            aria-label="Open menu"
          >
            ☰
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white">Admin Console</h1>
            <p className="text-[11px] text-slate-500">Platform-wide management</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-slate-500">{profile?.email}</span>
            <span className="h-8 w-8 grid place-items-center rounded-lg bg-warning-500/20 border border-warning-500/40 text-[11px] font-bold text-warning-300">
              {getInitials(profile?.full_name || profile?.email || 'A')}
            </span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
