import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Crown, Check, Sparkles, Receipt, LayoutTemplate, ShieldCheck } from 'lucide-react'
import { authApi, paymentsApi } from '../api/client'
import { cn, formatDate, formatINR } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { Alert, Button, PageLoader } from '../components/ui'
import { useCheckout } from '../components/PurchaseModal'

const ORDER_STATUS = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  created: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function BillingPage() {
  const user = useAuthStore((s) => s.user)
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: paymentsApi.plans })
  const { data: mine, isLoading } = useQuery({ queryKey: ['payments'], queryFn: paymentsApi.mine })
  const { data: usage } = useQuery({ queryKey: ['usage'], queryFn: authApi.usage })
  const buy = useCheckout()

  if (isLoading) return <PageLoader />
  const isPro = user?.is_pro

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Plan & Billing</h1>
        <p className="mt-1 muted">Manage your plan, purchases and invoices.</p>
      </div>

      {plans && !plans.enabled && <Alert type="info">Online payments are not configured on this server yet.</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <p className="text-sm muted">Current plan</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
            {isPro ? <><Crown size={22} className="text-amber-500" /> Pro</> : 'Free'}
          </p>
          {isPro && user?.plan_expires_at && <p className="mt-1 text-sm muted">Renews/expires {formatDate(user.plan_expires_at)}</p>}
          {user?.role !== 'employee' && <p className="mt-1 text-xs muted">Staff accounts have full access.</p>}
          <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles size={15} className="text-brand-600" /> AI usage today</p>
            {usage?.unlimited ? (
              <p className="mt-1 text-sm muted">Unlimited · {usage.used_today} used</p>
            ) : usage && (
              <>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (usage.used_today / usage.daily_limit) * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs muted">{usage.used_today} of {usage.daily_limit} credits used · resets daily</p>
              </>
            )}
          </div>
        </div>

        <div className={cn('card relative lg:col-span-2', !isPro && 'border-brand-500 ring-2 ring-brand-500')}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold"><Crown size={20} className="text-amber-500" /> JobAgent Pro</p>
              <p className="mt-1 text-3xl font-extrabold">{formatINR(plans?.pro?.price_paise)}<span className="text-base font-medium muted"> / {plans?.pro?.days} days</span></p>
            </div>
            <Button loading={buy.isPending} disabled={plans && !plans.enabled} onClick={() => buy.mutate({ itemType: 'pro_plan' })}>
              {isPro ? 'Extend Pro' : 'Upgrade now'}
            </Button>
          </div>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {(plans?.pro?.features || []).map((f) => <li key={f} className="flex gap-2 text-sm"><Check size={16} className="text-emerald-500" /> {f}</li>)}
          </ul>
          <p className="mt-5 flex items-center gap-1.5 text-xs muted"><ShieldCheck size={14} className="text-emerald-500" /> One-time payment, no auto-renewal. Secured by Razorpay.</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><LayoutTemplate size={18} /> Purchased templates</h2>
          <Link to="/templates" className="text-sm font-medium text-brand-600 hover:underline">Browse templates</Link>
        </div>
        {mine?.templates?.length ? (
          <div className="flex flex-wrap gap-2">
            {mine.templates.map((t) => <span key={t.id} className="badge bg-emerald-100 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><Check size={12} /> {t.name}</span>)}
          </div>
        ) : <p className="text-sm muted">{isPro ? 'Pro unlocks every premium template.' : 'No individual template purchases yet.'}</p>}
      </div>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><Receipt size={18} /> Payment history</h2>
        {mine?.orders?.length ? (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b text-left text-xs uppercase tracking-wide muted divider">
                <th className="px-5 py-2 font-medium">Date</th><th className="px-5 py-2 font-medium">Item</th>
                <th className="px-5 py-2 font-medium">Amount</th><th className="px-5 py-2 font-medium">Status</th><th className="px-5 py-2 font-medium">Order ID</th>
              </tr></thead>
              <tbody>
                {mine.orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 divider">
                    <td className="px-5 py-2.5">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-2.5">{o.description}</td>
                    <td className="px-5 py-2.5 font-medium">{formatINR(o.amount_paise)}</td>
                    <td className="px-5 py-2.5"><span className={cn('badge capitalize', ORDER_STATUS[o.status])}>{o.status === 'created' ? 'pending' : o.status}</span></td>
                    <td className="px-5 py-2.5 font-mono text-xs muted">{o.order_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm muted">No payments yet.</p>}
      </div>
    </div>
  )
}
