import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FilePlus2, Upload, FileText, Copy, Trash2, Star, MoreVertical, Globe2, Crown } from 'lucide-react'
import { metaApi, resumesApi, templatesApi } from '../../api/client'
import { cn, scoreColor, timeAgo } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { Button, EmptyState, Field, Modal, PageLoader, Tabs } from '../../components/ui'
import { TemplateThumb } from '../../components/resume/ScaledResume'

export function useMeta() {
  const countries = useQuery({ queryKey: ['countries'], queryFn: metaApi.countries, staleTime: Infinity })
  const categories = useQuery({ queryKey: ['categories'], queryFn: metaApi.categories, staleTime: Infinity })
  return { countries: countries.data || [], categories: categories.data || [] }
}

function CreateResumeModal({ open, onClose, initialTemplate }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { countries, categories } = useMeta()
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })
  const [form, setForm] = useState({ title: 'My Resume', country: 'US', job_category: 'it', target_job_title: '', template_id: null })

  useEffect(() => {
    if (!open) return
    const t = templates.find((x) => String(x.id) === String(initialTemplate))
    setForm((f) => ({ ...f, template_id: t?.id ?? f.template_id ?? templates[0]?.id ?? null, job_category: t?.category || f.job_category }))
  }, [open, initialTemplate, templates])

  const suggested = useMemo(() => {
    const own = templates.filter((t) => t.category === form.job_category)
    const rest = templates.filter((t) => t.category !== form.job_category)
    return [...own, ...rest].slice(0, 8)
  }, [templates, form.job_category])

  const create = useMutation({
    mutationFn: () => resumesApi.create({ ...form, target_job_title: form.target_job_title || null }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      navigate(`/resumes/${r.id}`)
    },
    onError: notifyError,
  })

  return (
    <Modal open={open} onClose={onClose} title="Create a new resume" size="xl"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={create.isPending} onClick={() => create.mutate()}>Create & edit</Button>
      </>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Resume name">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Target job title (optional)">
          <input className="input" placeholder="e.g. Senior Data Analyst" value={form.target_job_title} onChange={(e) => setForm({ ...form, target_job_title: e.target.value })} />
        </Field>
        <Field label="Country format" hint="Sets photo/personal-detail rules, page size & section order">
          <select className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.name} — {c.document_name}</option>)}
          </select>
        </Field>
        <Field label="Job category">
          <select className="input" value={form.job_category} onChange={(e) => setForm({ ...form, job_category: e.target.value })}>
            {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <p className="label mt-5">Choose a template <span className="font-normal muted">(you can switch any time)</span></p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {suggested.map((t) => (
          <button key={t.id} type="button" onClick={() => setForm({ ...form, template_id: t.id })}
            className={cn('rounded-xl border-2 p-1.5 text-left transition', form.template_id === t.id ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700')}>
            <TemplateThumb template={t} category={form.job_category} className="overflow-hidden rounded-md" />
            <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
              <span className="truncate text-xs font-semibold">{t.name}</span>
              {t.is_premium && !t.owned && <Crown size={12} className="shrink-0 text-amber-500" />}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function ImportModal({ open, onClose }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { countries, categories } = useMeta()
  const [mode, setMode] = useState('file')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [country, setCountry] = useState('US')
  const [category, setCategory] = useState('general')

  const run = useMutation({
    mutationFn: () => {
      const form = new FormData()
      if (mode === 'file' && file) form.append('file', file)
      else form.append('text', text)
      form.append('title', file?.name?.replace(/\.\w+$/, '') || 'Imported Resume')
      form.append('country', country)
      form.append('job_category', category)
      return resumesApi.import(form)
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      navigate(`/resumes/${r.id}`)
    },
    onError: notifyError,
  })

  return (
    <Modal open={open} onClose={onClose} title="Import an existing resume"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={run.isPending} disabled={mode === 'file' ? !file : text.trim().length < 50} onClick={() => run.mutate()}>
          {run.isPending ? 'AI is reading your resume…' : 'Import with AI'}
        </Button>
      </>}>
      <Tabs className="mb-4" value={mode} onChange={setMode} tabs={[{ value: 'file', label: 'Upload file', icon: Upload }, { value: 'text', label: 'Paste text', icon: FileText }]} />
      {mode === 'file' ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-10 text-center hover:border-brand-400 dark:border-slate-700">
          <Upload size={26} className="text-brand-600" />
          <span className="mt-2 text-sm font-medium">{file ? file.name : 'Click to choose a PDF, DOCX or TXT'}</span>
          <span className="text-xs muted">Max 5 MB · scanned image PDFs are not supported</span>
          <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
      ) : (
        <textarea rows={10} className="input font-mono text-xs" placeholder="Paste your resume text here…" value={text} onChange={(e) => setText(e.target.value)} />
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Country format">
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Job category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <p className="mt-3 text-xs muted">Uses 1 AI credit. Always review the extracted content.</p>
    </Modal>
  )
}

function ResumeCard({ r, template, countryName }) {
  const qc = useQueryClient()
  const [menu, setMenu] = useState(false)
  const refresh = () => qc.invalidateQueries({ queryKey: ['resumes'] })
  const dup = useMutation({ mutationFn: () => resumesApi.duplicate(r.id), onSuccess: refresh, onError: notifyError })
  const del = useMutation({ mutationFn: () => resumesApi.delete(r.id), onSuccess: refresh, onError: notifyError })
  const primary = useMutation({ mutationFn: () => resumesApi.update(r.id, { is_primary: true }), onSuccess: refresh, onError: notifyError })

  return (
    <div className="card group relative flex flex-col p-0">
      <Link to={`/resumes/${r.id}`} className="block overflow-hidden rounded-t-2xl bg-slate-100 p-4 dark:bg-slate-800/50">
        <div className="mx-auto w-3/5 transition group-hover:-translate-y-1">
          <TemplateThumb template={template} category={r.job_category} className="overflow-hidden rounded" />
        </div>
      </Link>
      <div className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1">
          <Link to={`/resumes/${r.id}`} className="flex items-center gap-1.5 font-semibold hover:text-brand-600">
            <span className="truncate">{r.title}</span>
            {r.is_primary && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-xs muted"><Globe2 size={12} /> {countryName} · {timeAgo(r.updated_at)}</p>
        </div>
        {r.ats_score != null && (
          <div className="text-right">
            <p className={cn('text-lg font-bold leading-none', scoreColor(r.ats_score))}>{Math.round(r.ats_score)}</p>
            <p className="text-[10px] uppercase muted">ATS</p>
          </div>
        )}
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} onBlur={() => setTimeout(() => setMenu(false), 150)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Resume actions">
            <MoreVertical size={16} />
          </button>
          {menu && (
            <div className="absolute bottom-8 right-0 z-10 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {!r.is_primary && <button onClick={() => primary.mutate()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Star size={14} /> Set as primary</button>}
              <button onClick={() => dup.mutate()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"><Copy size={14} /> Duplicate</button>
              <button onClick={() => window.confirm(`Delete "${r.title}"?`) && del.mutate()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 size={14} /> Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResumesPage() {
  const [params, setParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(!!params.get('template'))
  const [importOpen, setImportOpen] = useState(false)
  const { countries } = useMeta()
  const { data: resumes = [], isLoading } = useQuery({ queryKey: ['resumes'], queryFn: resumesApi.list })
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })
  const tmap = Object.fromEntries(templates.map((t) => [t.id, t]))
  const cmap = Object.fromEntries(countries.map((c) => [c.code, c.name]))

  const closeCreate = () => {
    setCreateOpen(false)
    if (params.get('template')) setParams({})
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">My Resumes</h1>
          <p className="mt-1 muted">Keep one tailored version per job type or country.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}><Upload size={16} /> Import</Button>
          <Button onClick={() => setCreateOpen(true)}><FilePlus2 size={16} /> New resume</Button>
        </div>
      </div>

      {isLoading ? <PageLoader /> : resumes.length === 0 ? (
        <EmptyState icon={FileText} title="Create your first resume"
          description="Start from a professional template or import your existing resume and let AI structure it."
          action={<div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setCreateOpen(true)}><FilePlus2 size={16} /> Start from template</Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}><Upload size={16} /> Import PDF / DOCX</Button>
          </div>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resumes.map((r) => <ResumeCard key={r.id} r={r} template={tmap[r.template_id]} countryName={cmap[r.country] || r.country} />)}
        </div>
      )}

      <CreateResumeModal open={createOpen} onClose={closeCreate} initialTemplate={params.get('template')} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
