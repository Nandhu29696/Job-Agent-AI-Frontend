import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, Check, ShieldCheck, Lock } from 'lucide-react'
import { authApi, paymentsApi } from '../api/client'
import { checkout } from '../lib/razorpay'
import { formatINR } from '../lib/utils'
import { notifyError } from '../lib/notify'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { Alert, Button, Modal } from './ui'
import { TemplateThumb } from './resume/ScaledResume'

export function useCheckout(onDone) {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: checkout,
    onSuccess: async (res) => {
      setUser(await authApi.me())
      ;['templates', 'payments', 'usage', 'plans'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      onDone?.(res)
    },
    onError: (err) => (err?.message === 'Payment cancelled' ? toast.info('Payment cancelled') : notifyError(err, 'Payment failed')),
  })
}

export default function PurchaseModal({ open, onClose, template, onUnlocked }) {
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: paymentsApi.plans, enabled: open })
  const buy = useCheckout((res) => {
    onUnlocked?.(res)
    onClose()
  })
  const disabled = plans && !plans.enabled

  return (
    <Modal open={open} onClose={onClose} title="Unlock premium template" size="lg">
      <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
        {template && <TemplateThumb template={template} className="hidden overflow-hidden rounded-lg ring-1 ring-slate-200 sm:block" />}
        <div className="space-y-4">
          {disabled && <Alert type="info">Payments are not configured yet. Ask the administrator to add Razorpay keys.</Alert>}
          {template && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold"><Lock size={14} /> {template.name}</p>
                  <p className="text-xs muted">One-time purchase · use forever on all your resumes</p>
                </div>
                <p className="text-xl font-bold">{formatINR(template.price_paise)}</p>
              </div>
              <Button className="mt-3 w-full" variant="secondary" loading={buy.isPending && buy.variables?.itemType === 'template'}
                disabled={disabled || buy.isPending}
                onClick={() => buy.mutate({ itemType: 'template', itemId: template.id })}>
                Buy this template
              </Button>
            </div>
          )}
          <div className="rounded-xl border-2 border-brand-500 bg-brand-50/50 p-4 dark:bg-brand-950/30">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-semibold"><Crown size={16} className="text-amber-500" /> JobAgent Pro</p>
              <p className="text-xl font-bold">{formatINR(plans?.pro?.price_paise)}<span className="text-xs font-normal muted"> / {plans?.pro?.days} days</span></p>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {(plans?.pro?.features || []).map((f) => <li key={f} className="flex gap-2"><Check size={15} className="text-emerald-500" /> {f}</li>)}
            </ul>
            <Button className="mt-3 w-full" loading={buy.isPending && buy.variables?.itemType === 'pro_plan'}
              disabled={disabled || buy.isPending}
              onClick={() => buy.mutate({ itemType: 'pro_plan' })}>
              Upgrade to Pro — best value
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs muted"><ShieldCheck size={14} className="text-emerald-500" /> Secure payment via Razorpay · UPI, cards, netbanking, wallets</p>
        </div>
      </div>
    </Modal>
  )
}
