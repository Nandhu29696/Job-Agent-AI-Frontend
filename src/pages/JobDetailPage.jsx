import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Star, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { jobsApi, applicationsApi, agentApi, employeeApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import StatusBadge from '../components/StatusBadge'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'

  const [coverLetter, setCoverLetter] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [loadingCL, setLoadingCL] = useState(false)
  const [loadingMatch, setLoadingMatch] = useState(false)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id).then((r) => r.data),
  })

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list().then((r) => r.data),
    enabled: !!user,
  })

  // Load employee profile to check resume availability for AI features
  const { data: empProfile } = useQuery({
    queryKey: ['employee-me'],
    queryFn: () => employeeApi.getMyProfile().then((r) => r.data),
    enabled: isEmployee,
  })

  const existing = applications.find((a) => a.job_id === id)

  const apply = useMutation({
    mutationFn: () => applicationsApi.create({ job_id: id }),
    onSuccess: () => qc.invalidateQueries(['applications']),
  })

  const deleteJob = useMutation({
    mutationFn: () => jobsApi.delete(id),
    onSuccess: () => navigate('/jobs'),
  })

  const handleCoverLetter = async () => {
    setLoadingCL(true)
    try {
      const { data } = await agentApi.coverLetter(id)
      setCoverLetter(data.cover_letter)
    } finally {
      setLoadingCL(false)
    }
  }

  const handleMatchScore = async () => {
    setLoadingMatch(true)
    try {
      const { data } = await agentApi.matchScore(id)
      setMatchResult(data)
    } finally {
      setLoadingMatch(false)
    }
  }

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading…</div>
  if (!job) return <div className="text-center py-20 text-gray-400">Job not found</div>

  const hasResume = !!empProfile?.resume_text

  return (
    <div className="max-w-3xl space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-brand-600 font-medium">{job.company}</p>
            {job.location && <p className="text-sm text-gray-500 mt-0.5">{job.location}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {job.remote && <span className="badge bg-blue-100 text-blue-700">Remote</span>}
            {existing && <StatusBadge status={existing.status} />}
          </div>
        </div>

        {(job.salary_min || job.salary_max) && (
          <p className="text-sm text-gray-700">
            {job.salary_min && `$${job.salary_min.toLocaleString()}`}
            {job.salary_min && job.salary_max && ' – '}
            {job.salary_max && `$${job.salary_max.toLocaleString()}`} / year
          </p>
        )}

        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
            <ExternalLink size={14} /> View original posting
          </a>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {/* Employee actions */}
          {isEmployee && (
            !existing ? (
              <button className="btn-primary" onClick={() => apply.mutate()} disabled={apply.isPending}>
                {apply.isPending ? 'Saving…' : 'Save to Applications'}
              </button>
            ) : (
              <p className="text-sm text-gray-500">Saved · <StatusBadge status={existing.status} /></p>
            )
          )}

          {/* AI features (employee with resume) */}
          {isEmployee && hasResume && (
            <>
              <button className="btn-secondary" onClick={handleCoverLetter} disabled={loadingCL}>
                {loadingCL ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                Generate Cover Letter
              </button>
              <button className="btn-secondary" onClick={handleMatchScore} disabled={loadingMatch}>
                {loadingMatch ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                Match Score
              </button>
            </>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <>
              <button
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { if (window.confirm('Delete this job?')) deleteJob.mutate() }}
                disabled={deleteJob.isPending}
              >
                <Trash2 size={14} />
                {deleteJob.isPending ? 'Deleting…' : 'Delete Job'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Match Score */}
      {matchResult && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">AI Match Score</h2>
            <span className={`text-2xl font-bold ${matchResult.score >= 70 ? 'text-green-600' : matchResult.score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
              {matchResult.score}%
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="font-medium text-green-700 mb-1">Strengths</p>
              <ul className="space-y-1 text-gray-600">{matchResult.strengths?.map((s, i) => <li key={i}>✓ {s}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium text-red-600 mb-1">Gaps</p>
              <ul className="space-y-1 text-gray-600">{matchResult.gaps?.map((g, i) => <li key={i}>✗ {g}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium text-brand-600 mb-1">Suggestions</p>
              <ul className="space-y-1 text-gray-600">{matchResult.suggestions?.map((s, i) => <li key={i}>→ {s}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter */}
      {coverLetter && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Generated Cover Letter</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{coverLetter}</pre>
          <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(coverLetter)}>
            Copy to clipboard
          </button>
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="card">
          <h2 className="font-semibold mb-3">Job Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      )}

      {job.requirements && (
        <div className="card">
          <h2 className="font-semibold mb-3">Requirements</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
        </div>
      )}
    </div>
  )
}
