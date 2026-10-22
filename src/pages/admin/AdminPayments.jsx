import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../api/client'
import { cn, formatDate, formatINR } from '../../lib/utils'
import { Button, PageLoader, Tabs } from '../../components/ui'

const STYLE = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  created: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function AdminPayments() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', status, page],
    queryFn: () => adminApi.payments({ status: status || undefined, page, page_size: 25 }),
    placeholderData: (p) => p,
  })
  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Payments</h1>
        <p className="mt-1 muted">All Razorpay orders across the platform.</p>
      </div>
      <Tabs className="w-fit" value={status} onChange={(s) => { setStatus(s); setPage(1) }} tabs={[
        { value: '', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'created', label: 'Pending' }, { value: 'failed', label: 'Failed' },
      ]} />
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide muted dark:bg-slate-800/50">
                <tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Item</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Razorpay IDs</th></tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o.id} className="border-t divider">
                    <td className="px-4 py-3 muted">{formatDate(o.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3">{o.user_email}</td>
                    <td className="px-4 py-3">{o.description}</td>
                    <td className="px-4 py-3 font-semibold">{formatINR(o.amount_paise)}</td>
                    <td className="px-4 py-3"><span className={cn('badge capitalize', STYLE[o.status])}>{o.status === 'created' ? 'pending' : o.status}</span></td>
                    <td className="px-4 py-3 font-mono text-xs muted"><div>{o.order_id}</div><div>{o.payment_id}</div></td>
                  </tr>
                ))}
                {!data.items.length && <tr><td colSpan={6} className="px-4 py-10 text-center muted">No payments.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm divider">
            <span className="muted">{data.total} orders · page {page}/{pages}</span>
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
