import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Crown, Check, Eye, Sparkles } from 'lucide-react'
import { templatesApi } from '../api/client'
import { cn, formatINR } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { Button, Modal, PageLoader, PremiumBadge, Tabs } from '../components/ui'
import { TemplateThumb } from '../components/resume/ScaledResume'
import PurchaseModal from '../components/PurchaseModal'
import { useMeta } from './resumes/ResumesPage'

const STYLES = ['modern', 'professional', 'classic', 'minimal', 'creative', 'executive', 'academic']

export default function TemplatesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { categories } = useMeta()
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })
  const [price, setPrice] = useState('all')
  const [category, setCategory] = useState('all')
  const [style, setStyle] = useState('all')
  const [preview, setPreview] = useState(null)
  const [buying, setBuying] = useState(null)

  const list = templates.filter((t) =>
    (price === 'all' || (price === 'free' ? !t.is_premium : t.is_premium)) &&
    (category === 'all' || t.category === category) &&
    (style === 'all' || t.style === style))

  const use = (t) => navigate(`/resumes?template=${t.id}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Resume templates</h1>
          <p className="mt-1 muted">{templates.filter((t) => !t.is_premium).length} free · {templates.filter((t) => t.is_premium).length} premium — all ATS-tested.</p>
        </div>
        {!user?.is_pro && (
          <Button variant="secondary" onClick={() => setBuying({})}><Crown size={16} className="text-amber-500" /> Unlock all with Pro</Button>
        )}
      </div>

      <div className="space-y-3">
        <Tabs value={price} onChange={setPrice} className="w-fit" tabs={[
          { value: 'all', label: 'All', count: templates.length },
          { value: 'free', label: 'Free', count: templates.filter((t) => !t.is_premium).length },
          { value: 'premium', label: 'Premium', icon: Crown, count: templates.filter((t) => t.is_premium).length },
        ]} />
        <div className="flex flex-wrap gap-1.5">
          <button className={cn('chip', category === 'all' && 'chip-active')} onClick={() => setCategory('all')}>All professions</button>
          {categories.map((c) => (
            <button key={c.code} className={cn('chip', category === c.code && 'chip-active')} onClick={() => setCategory(c.code)}>{c.name}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className={cn('chip', style === 'all' && 'chip-active')} onClick={() => setStyle('all')}>All styles</button>
          {STYLES.map((s) => (
            <button key={s} className={cn('chip capitalize', style === s && 'chip-active')} onClick={() => setStyle(s)}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? <PageLoader /> : list.length === 0 ? (
        <p className="py-16 text-center muted">No templates match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {list.map((t) => (
            <div key={t.id} className="group">
              <div className="relative overflow-hidden rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200 transition group-hover:shadow-xl dark:bg-slate-800/50 dark:ring-slate-800">
                <TemplateThumb template={t} className="overflow-hidden rounded" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/60 opacity-0 transition group-hover:opacity-100">
                  <Button size="sm" onClick={() => use(t)}><Sparkles size={14} /> Use template</Button>
                  <Button size="sm" variant="secondary" onClick={() => setPreview(t)}><Eye size={14} /> Preview</Button>
                </div>
                <div className="absolute left-4 top-4">
                  {t.is_premium ? <PremiumBadge owned={t.owned} /> : <span className="badge bg-emerald-100 text-emerald-700">Free</span>}
                </div>
              </div>
              <div className="mt-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-xs capitalize muted">{t.style} · {categories.find((c) => c.code === t.category)?.name || t.category}</p>
                </div>
                {t.is_premium && !t.owned && <span className="text-sm font-bold">{formatINR(t.price_paise)}</span>}
              </div>
              <button className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 md:hidden" onClick={() => setPreview(t)}>Preview</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg"
        footer={preview && <>
          {preview.is_premium && !preview.owned && (
            <Button variant="secondary" onClick={() => { setBuying(preview); setPreview(null) }}><Crown size={14} className="text-amber-500" /> Buy {formatINR(preview.price_paise)}</Button>
          )}
          <Button onClick={() => use(preview)}>{preview.owned ? <Check size={14} /> : <Sparkles size={14} />} Use this template</Button>
        </>}>
        {preview && (
          <div className="space-y-3">
            <p className="text-sm muted">{preview.description}</p>
            <div className="mx-auto max-w-md"><TemplateThumb template={preview} className="overflow-hidden rounded-lg ring-1 ring-slate-200" /></div>
            {preview.is_premium && !preview.owned && <p className="text-center text-xs muted">You can edit with any template — premium ones need unlocking to download.</p>}
          </div>
        )}
      </Modal>
      <PurchaseModal open={!!buying} onClose={() => setBuying(null)} template={buying?.id ? buying : null} />
    </div>
  )
}
