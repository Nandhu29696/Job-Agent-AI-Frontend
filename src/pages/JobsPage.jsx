import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Zap, Bookmark, BookmarkCheck, Briefcase, SlidersHorizontal } from 'lucide-react'
import { applicationsApi, jobsApi } from '../api/client'
import { cn } from '../lib/utils'
import { notifyError } from '../lib/notify'
import { EmptyState, Skeleton } from '../components/ui'
import JobCard from '../components/JobCard'

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function JobsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [jobType, setJobType] = useState('')
  const [matchSkills, setMatchSkills] = useState(false)
  const q = useDebounced(search)
  const loc = useDebounced(location)

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', q, loc, remote, jobType, matchSkills],
    queryFn: () => jobsApi.list({
      q: q || undefined, location: loc || undefined, remote: remote || undefined,
      job_type: jobType || undefined, match_skills: matchSkills || undefined, limit: 60,
    }),
    placeholderData: (prev) => prev,
  })
  const { data: apps = [] } = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.list() })
  const savedIds = new Set(apps.map((a) => a.job_id))

  const save = useMutation({
    mutationFn: (jobId) => applicationsApi.create({ job_id: jobId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
    onError: notifyError,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Find jobs</h1>
        <p className="mt-1 muted">Search open roles and save them to your pipeline.</p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Job title, company or keyword" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input className="input sm:w-56" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400" />
          {['', 'full-time', 'part-time', 'contract', 'internship'].map((t) => (
            <button key={t || 'any'} onClick={() => setJobType(t)} className={cn('chip capitalize', jobType === t && 'chip-active')}>{t || 'Any type'}</button>
          ))}
          <button onClick={() => setRemote((r) => !r)} className={cn('chip', remote && 'chip-active')}>Remote only</button>
          <button onClick={() => setMatchSkills((m) => !m)} className={cn('chip flex items-center gap-1', matchSkills && 'chip-active')} title="Uses the skills in your profile">
            <Zap size={12} /> Match my skills
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found"
          description={matchSkills ? 'No jobs match the skills in your profile. Add skills under Profile → Career profile.' : 'Try different keywords or clear filters.'} />
      ) : (
        <>
          <p className="text-sm muted">{jobs.length} job{jobs.length !== 1 && 's'}</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} actions={
                savedIds.has(job.id) ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600"><BookmarkCheck size={15} /> Saved</span>
                ) : (
                  <button className="btn-secondary btn-sm" disabled={save.isPending} onClick={() => save.mutate(job.id)}><Bookmark size={14} /> Save</button>
                )
              } />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
