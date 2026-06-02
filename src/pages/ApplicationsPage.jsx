import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['all', 'saved', 'applied', 'interviewing', 'offered', 'rejected']

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list().then((r) => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => applicationsApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(['applications']),
  })

  const deleteApp = useMutation({
    mutationFn: (id) => applicationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['applications']),
  })

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Applications</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
              filter === s
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {s}
            <span className="ml-1.5 text-xs text-gray-400">
              ({s === 'all' ? applications.length : applications.filter((a) => a.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No applications yet.{' '}
          <Link to="/jobs" className="text-brand-600 hover:underline">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div key={app.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Link to={`/jobs/${app.job_id}`} className="font-medium text-gray-900 hover:text-brand-600 truncate block">
                  {app.job?.title || 'Unknown Job'}
                </Link>
                <p className="text-sm text-gray-500">{app.job?.company}</p>
                {app.match_score != null && (
                  <p className="text-xs text-gray-400 mt-0.5">Match score: <strong>{app.match_score}%</strong></p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <select
                  className="input text-xs py-1 w-36"
                  value={app.status}
                  onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                >
                  {STATUSES.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <StatusBadge status={app.status} />
                <button
                  className="text-xs text-red-400 hover:text-red-600"
                  onClick={() => deleteApp.mutate(app.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
