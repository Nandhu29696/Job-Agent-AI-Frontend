import clsx from 'clsx'

const statusConfig = {
  saved:        { label: 'Saved',        color: 'bg-gray-100 text-gray-700' },
  applied:      { label: 'Applied',      color: 'bg-blue-100 text-blue-700' },
  interviewing: { label: 'Interviewing', color: 'bg-purple-100 text-purple-700' },
  offered:      { label: 'Offered',      color: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return <span className={clsx('badge', cfg.color)}>{cfg.label}</span>
}
