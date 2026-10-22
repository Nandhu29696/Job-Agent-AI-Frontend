import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Wifi, Banknote, ExternalLink, Star, Mail, Wand2, Bookmark, Copy } from 'lucide-react'
import { agentApi, applicationsApi, jobsApi } from '../api/client'
import { cn, scoreColor } from '../lib/utils'
import { notifyError } from '../lib/notify'
import { toast } from '../store/toastStore'
import { Button, PageLoader, ScoreRing } from '../components/ui'
import StatusBadge from '../components/StatusBadge'
import { salaryText } from '../components/JobCard'

export default function JobDetailPage() {
  const { id } = useParams()
  const jobId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [coverLetter, setCoverLetter] = useState('')
  const [match, setMatch] = useState(null)
  const [busy, setBusy] = useState(null)

  const { data: job, isLoading } = useQuery({ queryKey: ['job', jobId], queryFn: () => jobsApi.get(jobId) })
  const { data: apps = [] } = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.list() })
  // job_id is a number; route params are strings — compare as numbers
  const existing = apps.find((a) => a.job_id === jobId)

  const save = useMutation({
    mutationFn: () => applicationsApi.create({ job_id: jobId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
    onError: notifyError,
  })

  const runAi = async (kind) => {
    setBusy(kind)
    try {
      if (kind === 'cover') setCoverLetter((await agentApi.coverLetter(jobId)).cover_letter)
      else setMatch(await agentApi.matchScore(jobId))
      qc.invalidateQueries({ queryKey: ['applications'] })
    } catch (e) {
      notifyError(e)
    } finally {
      setBusy(null)
      qc.invalidateQueries({ queryKey: ['usage'] })
    }
  }

  if (isLoading) return <PageLoader />
  if (!job) return <div className="py-20 text-center muted">Job not found</div>
  const salary = salaryText(job)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm muted hover:text-brand-600"><ArrowLeft size={16} /> Back</button>

      <div className="card">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 text-xl font-bold text-white">{job.company?.[0]}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">{job.title}</h1>
            <p className="font-medium text-brand-600">{job.company}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm muted">
              {job.location && <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>}
              {job.remote && <span className="flex items-center gap-1 text-blue-600"><Wifi size={14} /> Remote</span>}
              {salary && <span className="flex items-center gap-1"><Banknote size={14} /> {salary} / year</span>}
              {job.job_type && <span className="capitalize">{job.job_type}</span>}
            </div>
          </div>
          {existing && <StatusBadge status={existing.status} />}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {existing ? (
            <Link to="/applications" className="btn-secondary">View in pipeline</Link>
          ) : (
            <Button loading={save.isPending} onClick={() => save.mutate()}><Bookmark size={15} /> Save job</Button>
          )}
          <Button variant="secondary" loading={busy === 'match'} disabled={!!busy} onClick={() => runAi('match')}><Star size={15} /> AI match score</Button>
          <Button variant="secondary" loading={busy === 'cover'} disabled={!!busy} onClick={() => runAi('cover')}><Mail size={15} /> Cover letter</Button>
          <Link to="/resumes" className="btn-ghost"><Wand2 size={15} /> Tailor resume</Link>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"><ExternalLink size={15} /> Original posting</a>}
        </div>
      </div>

      {match && (
        <div className="card">
          <div className="flex flex-wrap items-center gap-5">
            <ScoreRing score={match.score} label="Match" />
            <div>
              <h2 className="font-semibold">AI match analysis</h2>
              <p className={cn('text-sm font-medium', scoreColor(match.score))}>
                {match.score >= 80 ? 'Strong fit — apply!' : match.score >= 60 ? 'Good fit with some gaps' : 'Significant gaps to address'}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[['Strengths', match.strengths, 'text-emerald-600', '✓'], ['Gaps', match.gaps, 'text-red-500', '✗'], ['Suggestions', match.suggestions, 'text-brand-600', '→']].map(([title, items, cls, mark]) => (
              <div key={title}>
                <p className={cn('mb-2 text-sm font-semibold', cls)}>{title}</p>
                <ul className="space-y-1.5 text-sm muted">{items?.map((s, i) => <li key={i}>{mark} {s}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {coverLetter && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Cover letter</h2>
            <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success('Copied') }}><Copy size={14} /> Copy</Button>
          </div>
          <textarea rows={14} className="input font-serif text-sm leading-relaxed" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
          {existing && <p className="text-xs muted">Saved to your application for this job.</p>}
        </div>
      )}

      {job.description && (
        <div className="card">
          <h2 className="mb-3 font-semibold">About the role</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{job.description}</p>
        </div>
      )}
      {job.requirements && (
        <div className="card">
          <h2 className="mb-3 font-semibold">Requirements</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">{job.requirements}</p>
        </div>
      )}
    </div>
  )
}
