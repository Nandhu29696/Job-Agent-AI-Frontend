export { default as cn } from 'clsx'

/** Turn any API error into a human message. */
export function errorMessage(err, fallback = 'Something went wrong') {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.message === 'Network Error' ? 'Cannot reach the server' : fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        const field = d.loc?.slice(-1)[0]
        const msg = (d.msg || '').replace(/^Value error, /, '')
        return field && field !== 'body' ? `${field}: ${msg}` : msg
      })
      .join('. ')
  }
  return detail.message || fallback
}

export const errorCode = (err) => err?.response?.data?.detail?.code

export const formatINR = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    (paise || 0) / 100,
  )

// API datetimes are naive UTC ("2026-01-01T10:00:00"); treat them as UTC.
export const parseDate = (d) =>
  typeof d === 'string' && d.includes('T') && !/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? new Date(`${d}Z`) : new Date(d)

export const formatDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!d) return ''
  const date = parseDate(d)
  // toLocaleDateString rejects timeStyle; toLocaleString accepts both
  return opts.timeStyle ? date.toLocaleString(undefined, opts) : date.toLocaleDateString(undefined, opts)
}

export const timeAgo = (d) => {
  if (!d) return ''
  const date = parseDate(d)
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return formatDate(d)
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const scoreColor = (score) =>
  score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500'

export const scoreHex = (score) => (score >= 80 ? '#059669' : score >= 60 ? '#f59e0b' : '#ef4444')

export function passwordChecks(pw = '') {
  return [
    { label: '8+ characters', ok: pw.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(pw) },
    { label: 'Number', ok: /\d/.test(pw) },
  ]
}
