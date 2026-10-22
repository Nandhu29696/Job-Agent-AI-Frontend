import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, PenLine, Palette, Gauge, Wand2, Eye, Cloud, CloudOff, Loader2, Crown, Lock } from 'lucide-react'
import { resumesApi, templatesApi } from '../../api/client'
import { cn } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { Button, PageLoader, Tabs } from '../../components/ui'
import ScaledResume, { PrintPortal } from '../../components/resume/ScaledResume'
import { EMPTY_RESUME } from '../../components/resume/sampleData'
import PurchaseModal from '../../components/PurchaseModal'
import ContentEditor from './ContentEditor'
import { AtsPanel, DesignPanel, TailorPanel } from './EditorPanels'
import { useMeta } from './ResumesPage'

const FIELDS = ['title', 'template_id', 'country', 'job_category', 'target_job_title', 'target_job_description', 'data']
const pick = (r) => ({ ...Object.fromEntries(FIELDS.map((f) => [f, r[f]])), data: { ...EMPTY_RESUME, ...r.data, personal: { ...EMPTY_RESUME.personal, ...(r.data?.personal || {}) } } })

function SaveStatus({ status }) {
  const map = {
    saved: { icon: Cloud, text: 'Saved', cls: 'text-emerald-600' },
    unsaved: { icon: Cloud, text: 'Unsaved', cls: 'muted' },
    saving: { icon: Loader2, text: 'Saving…', cls: 'muted', spin: true },
    error: { icon: CloudOff, text: 'Save failed', cls: 'text-red-600' },
  }
  const s = map[status]
  return <span className={cn('flex items-center gap-1 text-xs', s.cls)}><s.icon size={13} className={s.spin ? 'animate-spin' : ''} /> {s.text}</span>
}

export default function ResumeEditorPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { countries, categories } = useMeta()
  const { data: resume, isLoading, error } = useQuery({ queryKey: ['resume', id], queryFn: () => resumesApi.get(id), refetchOnMount: 'always' })
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })

  const [draft, setDraft] = useState(null)
  const [status, setStatus] = useState('saved')
  const [tab, setTab] = useState('content')
  const [mobileView, setMobileView] = useState('edit')
  const [printing, setPrinting] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const lastSaved = useRef(null)
  const draftRef = useRef(null)
  const timer = useRef(null)
  draftRef.current = draft

  useEffect(() => {
    if (resume && !draft) {
      const d = pick(resume)
      setDraft(d)
      lastSaved.current = JSON.stringify(d)
    }
  }, [resume, draft])

  const save = useCallback(async () => {
    const snap = draftRef.current
    if (!snap) return
    const json = JSON.stringify(snap)
    if (json === lastSaved.current) return
    setStatus('saving')
    try {
      await resumesApi.update(id, snap)
      lastSaved.current = json
      setStatus(JSON.stringify(draftRef.current) === json ? 'saved' : 'unsaved')
      qc.invalidateQueries({ queryKey: ['resumes'] })
    } catch (e) {
      setStatus('error')
      notifyError(e, 'Could not save')
      throw e
    }
  }, [id, qc])

  useEffect(() => {
    if (!draft) return
    if (JSON.stringify(draft) === lastSaved.current) return
    setStatus('unsaved')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => save().catch(() => {}), 1200)
    return () => clearTimeout(timer.current)
  }, [draft, save])

  useEffect(() => {
    const warn = (e) => {
      if (draftRef.current && JSON.stringify(draftRef.current) !== lastSaved.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    await save()
  }, [save])

  useEffect(() => {
    if (!printing) return
    const prevTitle = document.title
    document.title = (draftRef.current?.data?.personal?.full_name || draftRef.current?.title || 'Resume').replace(/[^\w\s-]/g, '')
    const done = () => {
      setPrinting(false)
      document.title = prevTitle
    }
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 250)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', done)
      document.title = prevTitle
    }
  }, [printing])

  if (isLoading || (!draft && !error)) return <PageLoader label="Opening editor…" />
  if (error) return <div className="py-20 text-center muted">Resume not found. <Link to="/resumes" className="text-brand-600">Back to resumes</Link></div>

  const setData = (fn) => setDraft((d) => ({ ...d, data: typeof fn === 'function' ? fn(d.data) : fn }))
  const template = templates.find((t) => t.id === draft.template_id)
  const locked = !!template?.is_premium && !template?.owned
  const rules = countries.find((c) => c.code === draft.country)
  const category = categories.find((c) => c.code === draft.job_category)
  const paper = rules?.paper || 'letter'

  const download = async () => {
    setDownloading(true)
    try {
      await flush()
      await resumesApi.authorizeDownload(id)
      setPrinting(true)
    } catch (e) {
      if (e?.response?.status === 402) setPurchaseOpen(true)
      else notifyError(e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
        <Link to="/resumes" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Back"><ArrowLeft size={18} /></Link>
        <input
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-base font-semibold outline-none hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 sm:max-w-xs"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          aria-label="Resume name"
        />
        <SaveStatus status={status} />
        <div className="ml-auto flex items-center gap-2">
          <select className="input hidden w-auto py-1.5 text-xs md:block" value={draft.country} onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))} title="Country format">
            {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select className="input hidden w-auto py-1.5 text-xs md:block" value={draft.job_category} onChange={(e) => setDraft((d) => ({ ...d, job_category: e.target.value }))} title="Job category">
            {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <Button size="sm" loading={downloading} onClick={download}>
            {locked ? <Lock size={14} /> : <Download size={14} />} <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Mobile view switch */}
      <div className="flex gap-2 border-b border-slate-200 p-2 dark:border-slate-800 lg:hidden">
        <button onClick={() => setMobileView('edit')} className={cn('btn-sm flex-1', mobileView === 'edit' ? 'btn-primary' : 'btn-ghost')}><PenLine size={14} /> Edit</button>
        <button onClick={() => setMobileView('preview')} className={cn('btn-sm flex-1', mobileView === 'preview' ? 'btn-primary' : 'btn-ghost')}><Eye size={14} /> Preview</button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={cn('space-y-4 p-4 sm:p-6', mobileView === 'preview' && 'hidden lg:block')}>
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'content', label: 'Content', icon: PenLine },
            { value: 'design', label: 'Design', icon: Palette },
            { value: 'ats', label: 'ATS Score', icon: Gauge },
            { value: 'tailor', label: 'AI Tailor', icon: Wand2 },
          ]} />
          {tab === 'content' && <ContentEditor draft={draft} setData={setData} rules={rules} category={category} />}
          {tab === 'design' && <DesignPanel draft={draft} setDraft={setDraft} setData={setData} categories={categories} />}
          {tab === 'ats' && <AtsPanel draft={draft} setDraft={setDraft} flush={flush} resumeId={id} />}
          {tab === 'tailor' && <TailorPanel draft={draft} setDraft={setDraft} flush={flush} resumeId={id} countries={countries} />}
        </div>

        <div className={cn('border-l border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950', mobileView === 'edit' && 'hidden lg:block')}>
          <div className="sticky top-14 max-h-[calc(100vh-7.5rem)] overflow-y-auto p-4 scroll-thin sm:p-6">
            <div className="mb-3 flex items-center justify-between text-xs muted">
              <span>{template?.name || 'Default'} · {rules?.document_name || 'Resume'} · {paper.toUpperCase()}</span>
              {locked && (
                <button onClick={() => setPurchaseOpen(true)} className="flex items-center gap-1 font-semibold text-amber-600 hover:underline">
                  <Crown size={12} /> Unlock to download
                </button>
              )}
            </div>
            <ScaledResume data={draft.data} template={template} paper={paper} locked={locked} />
          </div>
        </div>
      </div>

      {printing && <PrintPortal data={draft.data} template={template} paper={paper} />}
      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} template={locked ? template : null} />
    </div>
  )
}
