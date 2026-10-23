import { toast } from '../store/toastStore'
import { errorMessage } from './utils'

/** Show an API error; quota/paywall errors (402) get an upgrade link. */
export function notifyError(err, fallback) {
  const msg = errorMessage(err, fallback)
  if (err?.response?.status === 402) {
    toast.error(msg, { action: { to: '/billing', label: 'Upgrade' }, duration: 7000 })
  } else {
    toast.error(msg)
  }
}
