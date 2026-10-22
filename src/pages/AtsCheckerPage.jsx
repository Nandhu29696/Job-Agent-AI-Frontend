import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Gauge, Upload, FileText, ClipboardPaste, Sparkles, ShieldCheck } from 'lucide-react'
import { resumeAiApi, resumesApi } from '../api/client'
import { notifyError } from '../lib/notify'
import { Button, EmptyState, Field, Tabs } from '../components/ui'
import AtsReport from '../components/resume/AtsReport'
import { useMeta } from './resumes/ResumesPage'

export default function AtsCheckerPage() {
  const qc = useQueryClient()
  const { countries } = useMeta()
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: resumesApi.list })
  const [mode, setMode] = useState('saved')
  const [resumeId, setResumeId] = useState('')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [jd, setJd] = useState('')
  const [country, setCountry] = useState('US')
  const [aiTips, setAiTips] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedId = resumeId || resumes[0]?.id
  const canRun = mode === 'saved' ? !!selectedId : mode === 'file' ? !!file : text.trim().length > 50

  const run = async () => {
    setLoading(true)
    try {
      let res
      if (mode === 'saved') {
        res = await resumesApi.ats(selectedId, { job_description: jd || null, ai_tips: aiTips })
        qc.invalidateQueries({ queryKey: ['resumes'] })
      } else if (mode === 'file') {
        const form = new FormData()
        form.append('file', file)
        if (jd) form.append('job_description', jd)
        form.append('country', country)
        form.append('ai_tips', aiTips ? 'true' : 'false')
        res = await resumeAiApi.atsCheckFile(form)
      } else {
        res = await resumeAiApi.atsCheck({ text, job_description: jd || null, country, ai_tips: aiTips })
      }
      setResult(res)
      if (aiTips) qc.invalidateQueries({ queryKey: ['usage'] })
    } catch (e) {
      notifyError(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">ATS Score Checker</h1>
        <p className="mt-1 muted">See your resume the way Applicant Tracking Systems do — and exactly what to fix.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-4 lg:col-span-2">
          <Tabs value={mode} onChange={(m) => { setMode(m); setResult(null) }} tabs={[
            { value: 'saved', label: 'My resume', icon: FileText },
            { value: 'file', label: 'Upload', icon: Upload },
            { value: 'text', label: 'Paste', icon: ClipboardPaste },
          ]} />

          {mode === 'saved' && (resumes.length ? (
            <Field label="Resume">
              <select className="input" value={selectedId} onChange={(e) => setResumeId(e.target.value)}>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.country})</option>)}
              </select>
            </Field>
          ) : (
            <p className="text-sm muted">No saved resumes. <Link to="/resumes" className="text-brand-600 hover:underline">Create one</Link> or upload a file.</p>
          ))}

          {mode === 'file' && (
            <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-brand-400 dark:border-slate-700">
              <Upload size={22} className="text-brand-600" />
              <span className="mt-2 text-sm font-medium">{file ? file.name : 'Choose PDF, DOCX or TXT'}</span>
              <span className="text-xs muted">Max 5 MB</span>
              <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          )}

          {mode === 'text' && (
            <textarea rows={8} className="input font-mono text-xs" placeholder="Paste your resume text…" value={text} onChange={(e) => setText(e.target.value)} />
          )}

          {mode !== 'saved' && (
            <Field label="Target country">
              <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Job description (recommended)" hint="Adds keyword-match scoring against this specific job">
            <textarea rows={7} className="input text-sm" placeholder="Paste the job posting…" value={jd} onChange={(e) => setJd(e.target.value)} />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" checked={aiTips} onChange={(e) => setAiTips(e.target.checked)} />
            <Sparkles size={14} className="text-brand-600" /> Include AI recommendations <span className="text-xs muted">(1 credit)</span>
          </label>

          <Button className="w-full" loading={loading} disabled={!canRun} onClick={run}><Gauge size={16} /> Check my score</Button>
          <p className="flex items-center gap-1.5 text-xs muted"><ShieldCheck size={13} className="text-emerald-500" /> Uploaded files are analysed in memory and not stored.</p>
        </div>

        <div className="lg:col-span-3">
          {result ? (
            <div className="card"><AtsReport result={result} /></div>
          ) : (
            <EmptyState icon={Gauge} title="Your report will appear here"
              description="We check 7 areas: contact info, standard sections, keyword match, quantified impact, length, ATS parsing safety and country conventions." />
          )}
        </div>
      </div>
    </div>
  )
}
