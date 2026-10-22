import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { adminApi } from '../../api/client'
import { notifyError } from '../../lib/notify'
import { Button, Field, PageLoader } from '../../components/ui'

export default function AdminSettings() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings })
  const [form, setForm] = useState(null)
  useEffect(() => {
    if (data) setForm({ ...data, pro_price: data.pro_plan_price_paise / 100 })
  }, [data])
  const save = useMutation({
    mutationFn: () => adminApi.saveSettings({
      pro_plan_price_paise: Math.round(Number(form.pro_price) * 100),
      pro_plan_days: Number(form.pro_plan_days),
      free_daily_ai_limit: Number(form.free_daily_ai_limit),
      registration_open: form.registration_open,
      maintenance_banner: form.maintenance_banner,
    }),
    onSuccess: () => {
      ;['admin-settings', 'plans', 'auth-config', 'usage'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
    },
    onError: notifyError,
  })
  if (isLoading || !form) return <PageLoader />
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Platform settings</h1>
        <p className="mt-1 muted">Changes apply immediately — no redeploy needed.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="max-w-2xl space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Monetisation</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Pro price (₹)"><input type="number" min="1" className="input" value={form.pro_price} onChange={(e) => setForm({ ...form, pro_price: e.target.value })} /></Field>
            <Field label="Pro duration (days)"><input type="number" min="1" className="input" value={form.pro_plan_days} onChange={(e) => setForm({ ...form, pro_plan_days: e.target.value })} /></Field>
            <Field label="Free AI credits / day"><input type="number" min="0" className="input" value={form.free_daily_ai_limit} onChange={(e) => setForm({ ...form, free_daily_ai_limit: e.target.value })} /></Field>
          </div>
          <p className="text-xs muted">Template prices are set per template on the Templates page.</p>
        </div>
        <div className="card space-y-4">
          <h2 className="font-semibold">Access</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.registration_open} onChange={(e) => setForm({ ...form, registration_open: e.target.checked })} /> Allow new registrations (email & Google)</label>
          <Field label="Announcement banner" hint="Shown at the top of the app for all signed-in users. Leave empty to hide.">
            <input className="input" value={form.maintenance_banner} onChange={(e) => setForm({ ...form, maintenance_banner: e.target.value })} placeholder="e.g. Scheduled maintenance Sunday 2–3 AM IST" />
          </Field>
        </div>
        <Button type="submit" loading={save.isPending}><Save size={15} /> Save settings</Button>
      </form>
    </div>
  )
}
