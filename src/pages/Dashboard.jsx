import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase, KanbanSquare, MessageSquareText, Trophy, FilePlus2, Gauge, Bot, Search, CheckCircle2, Circle, ArrowRight, FileText,
} from 'lucide-react'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { cn, scoreColor, timeAgo } from '../lib/utils'
import { Skeleton, StatCard } from '../components/ui'

const STATUSES = [
  { key: 'saved', label: 'Saved', color: 'bg-slate-400' },
  { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { key: 'interviewing', label: 'Interviewing', color: 'bg-purple-500' },
  { key: 'offered', label: 'Offered', color: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
]

const QUICK = [
  { to: '/resumes', icon: FilePlus2, label: 'Build a resume', desc: 'Start from a template', tone: 'from-brand-500 to-brand-700' },
  { to: '/ats-checker', icon: Gauge, label: 'Check ATS score', desc: 'Scan against a job', tone: 'from-emerald-500 to-teal-600' },
  { to: '/agent', icon: Bot, label: 'Ask the AI agent', desc: 'Search, save, advise', tone: 'from-purple-500 to-fuchsia-600' },
  { to: '/jobs', icon: Search, label: 'Find jobs', desc: 'Browse open roles', tone: 'from-amber-500 to-orange-600' },
]

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: authApi.dashboard })
  const by = data?.applications_by_status || {}
  const totalApps = Object.values(by).reduce((a, b) => a + b, 0)
  const resumes = data?.resumes || []
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const steps = [
    { done: resumes.length > 0, label: 'Create your first resume', to: '/resumes' },
    { done: resumes.some((r) => r.ats_score != null), label: 'Run an ATS check', to: '/ats-checker' },
    { done: totalApps > 0, label: 'Save a job to your pipeline', to: '/jobs' },
    { done: (data?.usage?.used_today || 0) > 0, label: 'Try the AI agent', to: '/agent' },
  ]
  const progress = steps.filter((s) => s.done).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{greet}, {user?.full_name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="mt-1 muted">Here&apos;s where your job search stands today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="group card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center">
            <div className={cn('w-fit rounded-xl bg-gradient-to-br p-2.5 text-white', q.tone)}><q.icon size={20} /></div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{q.label}</p>
              <p className="truncate text-xs muted">{q.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <StatCard label="Open jobs" value={data?.total_jobs ?? 0} icon={Briefcase} />
            <StatCard label="Applications" value={totalApps} icon={KanbanSquare} tone="purple" />
            <StatCard label="Interviewing" value={by.interviewing || 0} icon={MessageSquareText} tone="amber" />
            <StatCard label="Offers" value={by.offered || 0} icon={Trophy} tone="green" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Your resumes</h2>
            <Link to="/resumes" className="text-sm font-medium text-brand-600 hover:underline">Manage</Link>
          </div>
          {resumes.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FileText size={28} className="text-slate-300" />
              <p className="mt-2 text-sm muted">No resumes yet.</p>
              <Link to="/resumes" className="btn-primary btn-sm mt-3">Create resume</Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {resumes.map((r) => (
                <li key={r.id}>
                  <Link to={`/resumes/${r.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/30"><FileText size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs muted">Edited {timeAgo(r.updated_at)}</p>
                    </div>
                    {r.ats_score != null ? (
                      <span className={cn('text-sm font-bold', scoreColor(r.ats_score))}>{Math.round(r.ats_score)}<span className="text-xs font-normal muted">/100</span></span>
                    ) : (
                      <span className="text-xs muted">No ATS score</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold">Getting started</h2>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all" style={{ width: `${(progress / steps.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs muted">{progress} of {steps.length} complete</p>
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link to={s.to} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                  {s.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-300" />}
                  <span className={cn('flex-1', s.done && 'line-through muted')}>{s.label}</span>
                  {!s.done && <ArrowRight size={14} className="text-slate-400" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Application pipeline</h2>
          <Link to="/applications" className="text-sm font-medium text-brand-600 hover:underline">Open board</Link>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {totalApps > 0 && STATUSES.map((s) => (
            <div key={s.key} className={s.color} style={{ width: `${((by[s.key] || 0) / totalApps) * 100}%` }} title={`${s.label}: ${by[s.key] || 0}`} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUSES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-sm">
              <span className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
              <span className="muted">{s.label}</span>
              <span className="ml-auto font-semibold sm:ml-0">{by[s.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
