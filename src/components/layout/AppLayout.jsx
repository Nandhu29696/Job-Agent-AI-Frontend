import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Bot, FileText, LayoutTemplate, Gauge, Mail, Briefcase, KanbanSquare, CreditCard,
  UserCircle, Shield, Users, ScrollText, Settings, Wallet, Menu, X, LogOut, Crown, Sparkles, ChevronDown,
  BriefcaseBusiness,
} from 'lucide-react'
import { authApi } from '../../api/client'
import { useAuthStore, isStaff, isSuperAdmin } from '../../store/authStore'
import { cn } from '../../lib/utils'
import { ErrorBoundary, Logo, ThemeToggle } from '../ui'

const NAV = [
  { section: null, items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/agent', icon: Bot, label: 'AI Agent', badge: 'AI' },
  ] },
  { section: 'Resume', items: [
    { to: '/resumes', icon: FileText, label: 'My Resumes' },
    { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
    { to: '/ats-checker', icon: Gauge, label: 'ATS Checker' },
    { to: '/cover-letter', icon: Mail, label: 'Cover Letter' },
  ] },
  { section: 'Jobs', items: [
    { to: '/jobs', icon: Briefcase, label: 'Find Jobs' },
    { to: '/applications', icon: KanbanSquare, label: 'Applications' },
  ] },
  { section: 'Account', items: [
    { to: '/billing', icon: CreditCard, label: 'Plan & Billing' },
    { to: '/profile', icon: UserCircle, label: 'Profile & Security' },
  ] },
]

const ADMIN_NAV = [
  { to: '/admin', icon: Shield, label: 'Overview', end: true },
  { to: '/admin/jobs', icon: BriefcaseBusiness, label: 'Manage Jobs' },
  { to: '/admin/users', icon: Users, label: 'Users', super: true },
  { to: '/admin/templates', icon: LayoutTemplate, label: 'Templates', super: true },
  { to: '/admin/payments', icon: Wallet, label: 'Payments', super: true },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs', super: true },
  { to: '/admin/settings', icon: Settings, label: 'Settings', super: true },
]

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
        )
      }
    >
      <item.icon size={18} className="shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="rounded bg-gradient-to-r from-brand-600 to-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}

function SidebarContent({ onNavigate }) {
  const user = useAuthStore((s) => s.user)
  const adminItems = ADMIN_NAV.filter((i) => !i.super || isSuperAdmin(user))
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo to="/dashboard" />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 scroll-thin">
        {NAV.map((group, i) => (
          <div key={i}>
            {group.section && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.section}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}
            </div>
          </div>
        ))}
        {isStaff(user) && (
          <div>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-rose-400">
              {isSuperAdmin(user) ? 'Super Admin' : 'Admin'}
            </p>
            <div className="space-y-0.5">
              {adminItems.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}
            </div>
          </div>
        )}
      </nav>
      {!user?.is_pro && (
        <div className="m-3 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 p-4 text-white">
          <div className="flex items-center gap-2 font-semibold"><Crown size={16} /> Go Pro</div>
          <p className="mt-1 text-xs text-brand-100">All premium templates & unlimited AI.</p>
          <Link to="/billing" onClick={onNavigate} className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
            Upgrade
          </Link>
        </div>
      )}
    </div>
  )
}

function UsagePill() {
  const user = useAuthStore((s) => s.user)
  const { data } = useQuery({ queryKey: ['usage'], queryFn: authApi.usage, staleTime: 30_000 })
  if (user?.is_pro) {
    return (
      <span className="hidden items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white sm:flex">
        <Crown size={12} /> PRO
      </span>
    )
  }
  if (!data) return null
  return (
    <Link to="/billing" className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300 sm:flex" title="Free AI credits left today">
      <Sparkles size={12} className="text-brand-600" /> {data.remaining}/{data.daily_limit} AI credits
    </Link>
  )
}

function UserMenu() {
  const { user, clear } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clear()
      navigate('/login')
    }
  }
  const initials = (user?.full_name || user?.email || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
        )}
        <span className="hidden max-w-[140px] truncate text-sm font-medium md:block">{user?.full_name || user?.email}</span>
        <ChevronDown size={14} className="hidden text-slate-400 md:block" />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-fade-in dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b px-3 py-2 divider">
            <p className="truncate text-sm font-semibold">{user?.full_name}</p>
            <p className="truncate text-xs muted">{user?.email}</p>
          </div>
          {[
            { to: '/profile', label: 'Profile & Security', icon: UserCircle },
            { to: '/billing', label: 'Plan & Billing', icon: CreditCard },
          ].map((i) => (
            <Link key={i.to} to={i.to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
              <i.icon size={15} /> {i.label}
            </Link>
          ))}
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { data: cfg } = useQuery({ queryKey: ['auth-config'], queryFn: authApi.config, staleTime: 300_000 })
  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block no-print">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden no-print">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl animate-fade-in dark:bg-slate-900">
            <button className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 no-print">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <UsagePill />
          <ThemeToggle />
          <UserMenu />
        </header>
        {cfg?.maintenance_banner && (
          <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 no-print">
            {cfg.maintenance_banner}
          </div>
        )}
        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
