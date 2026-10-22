import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Sparkles, Copy, Download } from 'lucide-react'
import { jobsApi, resumeAiApi, resumesApi } from '../api/client'
import { notifyError } from '../lib/notify'
import { toast } from '../store/toastStore'
import { Button, EmptyState, Field, Tabs } from '../components/ui'

export default function CoverLetterPage() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: resumesApi.list })
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs', 'all-for-tailor'], queryFn: () => jobsApi.list({ limit: 100 }) })
  const [source, setSource] = useState(params.get('job') ? 'job' : 'manual')
  const [resumeId, setResumeId] = useState('')
  const [jobId, setJobId] = useState(params.get('job') || '')
  const [manual, setManual] = useState({ job_title: '', company: '', job_description: '' })
  const [tone, setTone] = useState('professional')
  const [letter, setLetter] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const body = { resume_id: resumeId ? Number(resumeId) : null, tone }
      Object.assign(body, source === 'job' ? { job_id: Number(jobId) } : manual)
      const res = await resumeAiApi.coverLetter(body)
      setLetter(res.cover_letter)
    } catch (e) {
      notifyError(e)
    } finally {
      setLoading(false)
      qc.invalidateQueries({ queryKey: ['usage'] })
    }
  }

  const download = () => {
    const blob = new Blob([letter], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'cover-letter.txt'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!resumes.length) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">Cover letter generator</h1>
        <EmptyState icon={Mail} title="Create a resume first" description="We use your resume to write a cover letter that maps your experience to the job."
          action={<Link to="/resumes" className="btn-primary">Create resume</Link>} />
      </div>
    )
  }

  const ready = source === 'job' ? !!jobId : manual.job_title && manual.company

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Cover letter generator</h1>
        <p className="mt-1 muted">A tailored letter in seconds, based on your resume and the job.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-4 lg:col-span-2">
          <Field label="Resume">
            <select className="input" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
              <option value="">Primary resume</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </Field>
          <Tabs value={source} onChange={setSource} tabs={[{ value: 'job', label: 'From job board' }, { value: 'manual', label: 'Enter details' }]} />
          {source === 'job' ? (
            <Field label="Job">
              <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                <option value="">Select a job…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
              </select>
            </Field>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Job title"><input className="input" value={manual.job_title} onChange={(e) => setManual({ ...manual, job_title: e.target.value })} /></Field>
                <Field label="Company"><input className="input" value={manual.company} onChange={(e) => setManual({ ...manual, company: e.target.value })} /></Field>
              </div>
              <Field label="Job description"><textarea rows={6} className="input text-sm" value={manual.job_description} onChange={(e) => setManual({ ...manual, job_description: e.target.value })} /></Field>
            </>
          )}
          <Field label="Tone">
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {['professional', 'enthusiastic', 'concise', 'formal'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </Field>
          <Button className="w-full" loading={loading} disabled={!ready} onClick={generate}><Sparkles size={16} /> Generate cover letter</Button>
        </div>
        <div className="lg:col-span-3">
          {letter ? (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Your cover letter</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(letter); toast.success('Copied') }}><Copy size={14} /> Copy</Button>
                  <Button size="sm" variant="secondary" onClick={download}><Download size={14} /> .txt</Button>
                </div>
              </div>
              <textarea rows={20} className="input font-serif text-sm leading-relaxed" value={letter} onChange={(e) => setLetter(e.target.value)} />
            </div>
          ) : (
            <EmptyState icon={Mail} title="Your letter will appear here" description="You can edit it freely before copying." />
          )}
        </div>
      </div>
    </div>
  )
}
