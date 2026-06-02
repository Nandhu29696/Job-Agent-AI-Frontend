import { MapPin, DollarSign, Clock, Wifi } from 'lucide-react'
import clsx from 'clsx'

const jobTypeColors = {
  'full-time': 'bg-green-100 text-green-700',
  'part-time': 'bg-yellow-100 text-yellow-700',
  contract: 'bg-purple-100 text-purple-700',
  internship: 'bg-blue-100 text-blue-700',
}

export default function JobCard({ job, onClick, actions }) {
  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-brand-600 font-medium mt-0.5">{job.company}</p>
        </div>
        {job.job_type && (
          <span className={clsx('badge', jobTypeColors[job.job_type] || 'bg-gray-100 text-gray-700')}>
            {job.job_type}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {job.location}
          </span>
        )}
        {job.remote && (
          <span className="flex items-center gap-1 text-blue-600">
            <Wifi size={12} /> Remote
          </span>
        )}
        {(job.salary_min || job.salary_max) && (
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {job.salary_min && `$${job.salary_min.toLocaleString()}`}
            {job.salary_min && job.salary_max && ' – '}
            {job.salary_max && `$${job.salary_max.toLocaleString()}`}
          </span>
        )}
        {job.posted_at && (
          <span className="flex items-center gap-1">
            <Clock size={12} /> {new Date(job.posted_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {job.description && (
        <p className="mt-3 text-xs text-gray-600 line-clamp-2">{job.description}</p>
      )}

      {actions && (
        <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  )
}
