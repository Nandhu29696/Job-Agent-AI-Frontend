import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Briefcase, ClipboardList, Bot, TrendingUp } from 'lucide-react'
import { jobsApi, applicationsApi } from '../api/client'
import { useAuthStore } from '../store/authStore'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ limit: 5 }).then((r) => r.data),
  })
  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.list().then((r) => r.data),
  })

  const byStatus = (status) => applications?.filter((a) => a.status === status).length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.resume_text
            ? 'Your AI job agent is ready.'
            : 'Add your resume in Profile to unlock AI features.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={jobs?.length || 0} icon={Briefcase} color="bg-brand-600" />
        <StatCard label="Applications" value={applications?.length || 0} icon={ClipboardList} color="bg-purple-500" />
        <StatCard label="Interviewing" value={byStatus('interviewing')} icon={TrendingUp} color="bg-yellow-500" />
        <StatCard label="Offers" value={byStatus('offered')} icon={Bot} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {jobs?.length ? (
            <ul className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <li key={job.id}>
                  <Link to={`/jobs/${job.id}`} className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company}</p>
                    </div>
                    {job.remote && <span className="badge bg-blue-100 text-blue-700">Remote</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No jobs yet. <Link to="/jobs" className="text-brand-600">Add some</Link>.</p>
          )}
        </div>

        {/* Application Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Application Pipeline</h2>
            <Link to="/applications" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {['saved', 'applied', 'interviewing', 'offered', 'rejected'].map((status) => (
            <div key={status} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-600 capitalize">{status}</span>
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full bg-brand-100 w-24 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, byStatus(status) * 20)}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-4 text-right">{byStatus(status)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!user?.resume_text && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 flex items-start gap-3">
          <Bot size={20} className="text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-700">Unlock AI Features</p>
            <p className="text-sm text-brand-600 mt-0.5">
              Add your resume to get AI-powered cover letters, match scores, and job recommendations.{' '}
              <Link to="/profile" className="underline font-medium">Go to Profile</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
