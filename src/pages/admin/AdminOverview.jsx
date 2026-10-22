import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, BadgeCheck, Crown, UserPlus, IndianRupee, FileText, Download, Briefcase, Sparkles, KanbanSquare } from 'lucide-react'
import { adminApi } from '../../api/client'
import { formatINR } from '../../lib/utils'
import { PageLoader, StatCard } from '../../components/ui'

/** Single-series daily bar chart with hover tooltip (one hue, one axis). */
function DailyBars({ title, series, valueKey, format = (v) => v, total }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...series.map((d) => d[valueKey]))
  return (
    <div className="card">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm muted">{total}</span>
      </div>
      <div className="relative">
        <div className="flex h-40 items-end gap-[2px] border-b border-slate-200 dark:border-slate-800" role="img" aria-label={title}>
          {series.map((d, i) => (
            <div key={d.day} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div
                className="w-full rounded-t bg-brand-600 transition-opacity dark:bg-brand-400"
                style={{ height: `${(d[valueKey] / max) * 100}%`, minHeight: d[valueKey] ? 3 : 0, opacity: hover == null || hover === i ? 1 : 0.45 }}
              />
            </div>
          ))}
        </div>
        {hover != null && (
          <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
            style={{ left: `${((hover + 0.5) / series.length) * 100}%` }}>
            <p className="muted">{new Date(series[hover].day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            <p className="font-semibold">{format(series[hover][valueKey])}</p>
          </div>
        )}
        <div className="mt-1.5 flex justify-between text-[10px] muted">
          <span>{new Date(series[0]?.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats, refetchInterval: 60_000 })
  if (isLoading || !data) return <PageLoader />
  const { users, revenue, content, series, top_templates: top } = data
  const signups14 = series.reduce((a, d) => a + d.signups, 0)
  const revenue14 = series.reduce((a, d) => a + d.revenue_paise, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin overview</h1>
        <p className="mt-1 muted">Platform health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total users" value={users.total} icon={Users} />
        <StatCard label="Verified" value={users.verified} icon={BadgeCheck} tone="green" />
        <StatCard label="Pro subscribers" value={users.pro} icon={Crown} tone="amber" />
        <StatCard label="New (7 days)" value={users.new_7d} icon={UserPlus} tone="purple" />
        <StatCard label="Revenue (30d)" value={formatINR(revenue.last_30d_paise)} icon={IndianRupee} tone="green" hint={`${formatINR(revenue.total_paise)} all-time`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Resumes" value={content.resumes} icon={FileText} />
        <StatCard label="PDF downloads" value={content.downloads} icon={Download} tone="purple" />
        <StatCard label="Active jobs" value={content.jobs_active} icon={Briefcase} tone="amber" />
        <StatCard label="Applications" value={content.applications} icon={KanbanSquare} tone="rose" />
        <StatCard label="AI calls today" value={content.ai_calls_today} icon={Sparkles} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyBars title="Sign-ups · last 14 days" series={series} valueKey="signups" total={`${signups14} total`} />
        <DailyBars title="Revenue · last 14 days" series={series} valueKey="revenue_paise" format={formatINR} total={formatINR(revenue14)} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Most downloaded templates</h2>
        {top.length ? (
          <ul className="space-y-2">
            {top.map((t) => (
              <li key={t.name} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{t.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600 dark:bg-brand-400" style={{ width: `${(t.downloads / top[0].downloads) * 100}%` }} />
                </div>
                <span className="w-10 text-right font-medium">{t.downloads}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm muted">No downloads yet.</p>}
      </div>
    </div>
  )
}
