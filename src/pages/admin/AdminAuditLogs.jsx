import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../api/client'
import { formatDate } from '../../lib/utils'
import { Button, PageLoader } from '../../components/ui'

const FILTERS = [
  { value: '', label: 'All events' }, { value: 'user.', label: 'Account events' },
  { value: 'admin.', label: 'Admin actions' }, { value: 'payment.', label: 'Payments' },
]

export default function AdminAuditLogs() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', action, page],
    queryFn: () => adminApi.auditLogs({ action: action || undefined, page, page_size: 50 }),
    placeholderData: (p) => p,
  })
  const pages = data ? Math.max(1, Math.ceil(data.total / 50)) : 1
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Audit logs</h1>
          <p className="mt-1 muted">Security-relevant events: sign-ins, lockouts, password changes, admin actions, payments.</p>
        </div>
        <select className="input w-auto" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }}>
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide muted dark:bg-slate-800/50">
                <tr><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Actor</th><th className="px-4 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Target</th><th className="px-4 py-3 font-medium">Detail</th><th className="px-4 py-3 font-medium">IP</th></tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id} className="border-t align-top divider">
                    <td className="whitespace-nowrap px-4 py-2.5 muted">{formatDate(a.created_at, { dateStyle: 'short', timeStyle: 'medium' })}</td>
                    <td className="px-4 py-2.5">{a.user_email || '—'}</td>
                    <td className="px-4 py-2.5"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">{a.action}</code></td>
                    <td className="px-4 py-2.5 muted">{a.target_type ? `${a.target_type} #${a.target_id}` : ''}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 font-mono text-xs muted" title={a.detail ? JSON.stringify(a.detail) : ''}>{a.detail ? JSON.stringify(a.detail) : ''}</td>
                    <td className="px-4 py-2.5 font-mono text-xs muted">{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm divider">
            <span className="muted">{data.total} events · page {page}/{pages}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></Button>
              <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
