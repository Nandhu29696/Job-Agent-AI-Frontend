import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronUp, ChevronDown, Eye, EyeOff, Crown, Gauge, Sparkles, Wand2, Globe2, ArrowRight, Check } from 'lucide-react'
import { jobsApi, resumeAiApi, resumesApi, templatesApi } from '../../api/client'
import { cn, scoreColor } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { toast } from '../../store/toastStore'
import { Alert, Button, Field } from '../../components/ui'
import { TemplateThumb } from '../../components/resume/ScaledResume'
import AtsReport from '../../components/resume/AtsReport'
import { DEFAULT_ORDER, SECTION_LABELS } from '../../components/resume/ResumeDocument'

export function DesignPanel({ draft, setDraft, setData, categories }) {
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })
  const [filter, setFilter] = useState(draft.job_category)
  const shown = filter === 'all' ? templates : templates.filter((t) => t.category === filter || t.category === 'general')

  const order = useMemo(() => {
    const o = draft.data.section_order?.length ? [...draft.data.section_order] : [...DEFAULT_ORDER]
    DEFAULT_ORDER.forEach((k) => !o.includes(k) && o.push(k))
    return o.filter((k) => DEFAULT_ORDER.includes(k))
  }, [draft.data.section_order])
  const hidden = new Set(draft.data.hidden_sections || [])

  const move = (i, dir) => {
    const next = [...order]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setData((d) => ({ ...d, section_order: next }))
  }
  const toggle = (k) => setData((d) => {
    const h = new Set(d.hidden_sections || [])
    h.has(k) ? h.delete(k) : h.add(k)
    return { ...d, hidden_sections: [...h] }
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-semibold">Template</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {[{ code: 'all', name: 'All' }, ...categories].map((c) => (
            <button key={c.code} onClick={() => setFilter(c.code)} className={cn('chip', filter === c.code && 'chip-active')}>{c.name.split(' (')[0]}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((t) => (
            <button key={t.id} onClick={() => setDraft((d) => ({ ...d, template_id: t.id }))}
              className={cn('rounded-xl border-2 p-1.5 text-left transition', draft.template_id === t.id ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700')}>
              <TemplateThumb template={t} category={draft.job_category} className="overflow-hidden rounded-md" />
              <div className="mt-1 flex items-center justify-between gap-1 px-0.5">
                <span className="truncate text-xs font-semibold">{t.name}</span>
                {t.is_premium && (t.owned ? <Check size={12} className="text-emerald-500" /> : <Crown size={12} className="text-amber-500" />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 font-semibold">Section order & visibility</p>
        <p className="mb-3 text-xs muted">Empty sections are skipped automatically.</p>
        <ul className="space-y-1">
          {order.map((k, i) => (
            <li key={k} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700">
              <span className={cn('flex-1', hidden.has(k) && 'line-through muted')}>{SECTION_LABELS[k]}</span>
              <button onClick={() => toggle(k)} className="rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Toggle visibility">{hidden.has(k) ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move up"><ChevronUp size={14} /></button>
              <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="rounded p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30" aria-label="Move down"><ChevronDown size={14} /></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AtsPanel({ draft, setDraft, flush, resumeId }) {
  const qc = useQueryClient()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const scan = async (aiTips) => {
    setLoading(aiTips ? 'ai' : 'scan')
    try {
      await flush()
      const res = await resumesApi.ats(resumeId, { job_description: draft.target_job_description || null, ai_tips: aiTips })
      setResult(res)
      qc.invalidateQueries({ queryKey: ['resumes'] })
      if (aiTips) qc.invalidateQueries({ queryKey: ['usage'] })
    } catch (e) {
      notifyError(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Target job title">
        <input className="input" value={draft.target_job_title || ''} onChange={(e) => setDraft((d) => ({ ...d, target_job_title: e.target.value }))} placeholder="e.g. Product Manager" />
      </Field>
      <Field label="Job description" hint="Paste the posting to measure keyword match. Saved with this resume.">
        <textarea rows={6} className="input text-sm" value={draft.target_job_description || ''} onChange={(e) => setDraft((d) => ({ ...d, target_job_description: e.target.value }))} placeholder="Paste the full job description…" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button loading={loading === 'scan'} disabled={!!loading} onClick={() => scan(false)}><Gauge size={16} /> Run ATS scan</Button>
        <Button variant="secondary" loading={loading === 'ai'} disabled={!!loading} onClick={() => scan(true)}><Sparkles size={16} /> Scan + AI tips</Button>
      </div>
      {result ? <div className="card"><AtsReport result={result} compact /></div> : (
        <Alert type="info">The scan checks contact info, standard sections, keyword match, quantified impact, length, parsing safety and {draft.country} conventions.</Alert>
      )}
    </div>
  )
}

export function TailorPanel({ draft, setDraft, flush, resumeId, countries }) {
  const qc = useQueryClient()
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs', 'all-for-tailor'], queryFn: () => jobsApi.list({ limit: 100 }) })
  const [jobId, setJobId] = useState('')
  const [tailored, setTailored] = useState(null)
  const [busy, setBusy] = useState(false)
  const [country, setCountry] = useState(draft.country)
  const [adapted, setAdapted] = useState(null)

  const tailor = async () => {
    setBusy('tailor')
    try {
      await flush()
      const res = await resumeAiApi.tailor({ resume_id: resumeId, job_id: jobId ? Number(jobId) : null, job_description: jobId ? null : draft.target_job_description })
      setTailored(res)
    } catch (e) {
      notifyError(e)
    } finally {
      setBusy(false)
      qc.invalidateQueries({ queryKey: ['usage'] })
    }
  }

  const adapt = async () => {
    setBusy('adapt')
    try {
      await flush()
      setAdapted(await resumesApi.adaptCountry(resumeId, { country, job_category: draft.job_category }))
    } catch (e) {
      notifyError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <p className="flex items-center gap-2 font-semibold"><Wand2 size={18} className="text-brand-600" /> Tailor to a job with AI</p>
        <p className="text-sm muted">Rewrites your summary and recent bullets, and suggests missing skills — you review before applying.</p>
        <Field label="Job">
          <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Use the job description from the ATS tab</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
          </select>
        </Field>
        <Button loading={busy === 'tailor'} disabled={!!busy || (!jobId && !draft.target_job_description)} onClick={tailor}>
          <Sparkles size={16} /> {busy === 'tailor' ? 'Tailoring (may take ~30s)…' : 'Tailor my resume'}
        </Button>
        {!jobId && !draft.target_job_description && <p className="text-xs muted">Pick a job or paste a description in the ATS tab first.</p>}
        {tailored && (
          <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/30">
            <div className="flex items-center gap-3 text-sm">
              <span>ATS score</span>
              <span className={cn('font-bold', scoreColor(tailored.ats_before))}>{tailored.ats_before}</span>
              <ArrowRight size={14} />
              <span className={cn('text-lg font-bold', scoreColor(tailored.ats_after))}>{tailored.ats_after}</span>
            </div>
            <ul className="space-y-1 text-sm">{tailored.changes.map((c, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {c}</li>)}</ul>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                setDraft((d) => ({ ...d, data: tailored.data, target_job_description: tailored.job_description }))
                setTailored(null)
                toast.success('Tailored version applied. Review [X] placeholders.')
              }}>Apply changes</Button>
              <Button size="sm" variant="ghost" onClick={() => setTailored(null)}>Discard</Button>
            </div>
            <p className="text-xs muted">Tip: duplicate your resume first if you want to keep the original.</p>
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <p className="flex items-center gap-2 font-semibold"><Globe2 size={18} className="text-brand-600" /> Adapt to another country</p>
        <p className="text-sm muted">Applies local rules — photo, personal details, section order, declaration and page size.</p>
        <div className="flex gap-2">
          <select className="input" value={country} onChange={(e) => { setCountry(e.target.value); setAdapted(null) }}>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.name} — {c.document_name}</option>)}
          </select>
          <Button variant="secondary" loading={busy === 'adapt'} disabled={!!busy} onClick={adapt}>Preview</Button>
        </div>
        {adapted && (
          <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            {adapted.changes.length ? (
              <ul className="space-y-1 text-sm">{adapted.changes.map((c, i) => <li key={i} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {c}</li>)}</ul>
            ) : <p className="text-sm muted">Your resume already follows {adapted.rules.name} conventions.</p>}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide muted">{adapted.rules.name} tips</p>
              <ul className="space-y-1 text-sm muted">{adapted.tips.map((t, i) => <li key={i}>• {t}</li>)}</ul>
            </div>
            <Button size="sm" onClick={() => {
              setDraft((d) => ({ ...d, country, data: adapted.data }))
              setAdapted(null)
              toast.success(`Switched to ${adapted.rules.name} format`)
            }}>Apply {adapted.rules.document_name} format</Button>
          </div>
        )}
      </div>
    </div>
  )
}
