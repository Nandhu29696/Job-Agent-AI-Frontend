import { MapPin, Banknote, Clock, Wifi, Building2 } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'

const jobTypeColors = {
  'full-time': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'part-time': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  internship: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
}

export const salaryText = (job) => {
  if (!job.salary_min && !job.salary_max) return null
  const f = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n)
  return [job.salary_min && f(job.salary_min), job.salary_max && f(job.salary_max)].filter(Boolean).join(' – ')
}

export default function JobCard({ job, onClick, actions }) {
  const salary = salaryText(job)
  return (
    <div className="card flex cursor-pointer flex-col transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200">
          {job.company?.[0]?.toUpperCase() || <Building2 size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{job.title}</h3>
          <p className="truncate text-sm font-medium text-brand-600">{job.company}</p>
        </div>
        {job.job_type && (
          <span className={cn('badge shrink-0 capitalize', jobTypeColors[job.job_type] || 'bg-slate-100 text-slate-700')}>{job.job_type}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs muted">
        {job.location && <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>}
        {job.remote && <span className="flex items-center gap-1 text-blue-600"><Wifi size={12} /> Remote</span>}
        {salary && <span className="flex items-center gap-1"><Banknote size={12} /> {salary}</span>}
        {job.posted_at && <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(job.posted_at)}</span>}
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm muted">{job.description}</p>}

      {actions && (
        <div className="mt-auto flex gap-2 pt-4" onClick={(e) => e.stopPropagation()}>{actions}</div>
      )}
    </div>
  )
}
