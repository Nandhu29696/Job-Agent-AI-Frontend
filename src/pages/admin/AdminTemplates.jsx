import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, EyeOff } from 'lucide-react'
import { adminApi } from '../../api/client'
import { formatINR } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { Button, Field, Modal, PageLoader } from '../../components/ui'
import { TemplateThumb } from '../../components/resume/ScaledResume'

function EditTemplate({ t, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: t.name, description: t.description || '', is_premium: t.is_premium, price: t.price_paise / 100,
    is_active: t.is_active, sort_order: t.sort_order, primary: t.layout.primary, accent: t.layout.accent,
  })
  const save = useMutation({
    mutationFn: () => adminApi.updateTemplate(t.id, {
      name: form.name, description: form.description, is_premium: form.is_premium,
      price_paise: form.is_premium ? Math.round(Number(form.price) * 100) : 0, is_active: form.is_active,
      sort_order: Number(form.sort_order), layout: { ...t.layout, primary: form.primary, accent: form.accent },
    }),
    onSuccess: () => {
      ;['admin-templates', 'templates'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
      onClose()
    },
    onError: notifyError,
  })
  const preview = { ...t, layout: { ...t.layout, primary: form.primary, accent: form.accent } }
  return (
    <Modal open onClose={onClose} title={`Edit ${t.name}`} size="xl"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={2} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary colour"><input type="color" className="input h-10 p-1" value={form.primary} onChange={(e) => setForm({ ...form, primary: e.target.value })} /></Field>
            <Field label="Accent colour"><input type="color" className="input h-10 p-1" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} /></Field>
            <Field label="Price (₹)"><input type="number" min="1" className="input" disabled={!form.is_premium} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked, price: form.price || 99 })} /> Premium (paid)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Visible to users</label>
          <p className="text-xs muted">Layout engine: <code>{t.layout.layout}</code> · font {t.layout.font} · heading {t.layout.heading}</p>
        </div>
        <TemplateThumb template={preview} className="overflow-hidden rounded-lg ring-1 ring-slate-200" />
      </div>
    </Modal>
  )
}

export default function AdminTemplates() {
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['admin-templates'], queryFn: adminApi.templates })
  const [editing, setEditing] = useState(null)
  if (isLoading) return <PageLoader />
  const free = templates.filter((t) => !t.is_premium && t.is_active).length
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Templates</h1>
        <p className="mt-1 muted">{free} free · {templates.filter((t) => t.is_premium).length} premium · set prices, visibility and colours.</p>
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-6">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setEditing(t)} className="group text-left">
            <div className="relative rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200 transition group-hover:ring-brand-400 dark:bg-slate-800/50 dark:ring-slate-800">
              <TemplateThumb template={t} className={t.is_active ? '' : 'opacity-40'} />
              {!t.is_active && <span className="absolute left-3 top-3 badge bg-slate-800 text-white"><EyeOff size={11} /> Hidden</span>}
            </div>
            <div className="mt-2 flex items-center justify-between gap-1">
              <span className="truncate text-sm font-semibold">{t.name}</span>
              {t.is_premium ? <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-amber-600"><Crown size={11} /> {formatINR(t.price_paise)}</span> : <span className="text-xs text-emerald-600">Free</span>}
            </div>
            <p className="text-xs capitalize muted">{t.category} · {t.style}</p>
          </button>
        ))}
      </div>
      {editing && <EditTemplate t={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
