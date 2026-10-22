import { create } from 'zustand'

let seq = 0
const timers = new Map()
const MAX_TOASTS = 4

function schedule(set, id, duration) {
  clearTimeout(timers.get(id))
  timers.set(id, setTimeout(() => {
    timers.delete(id)
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  }, duration))
}

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const duration = toast.duration || 4000
    // Same message already visible (e.g. repeated autosaves): refresh it instead of stacking
    const dup = get().toasts.find((t) => t.message === toast.message && t.type === (toast.type || 'info'))
    if (dup) {
      set((s) => ({ toasts: s.toasts.map((t) => (t.id === dup.id ? { ...t, bump: (t.bump || 0) + 1 } : t)) }))
      schedule(set, dup.id, duration)
      return
    }
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, type: 'info', ...toast }].slice(-MAX_TOASTS) }))
    schedule(set, id, duration)
  },
  dismiss: (id) => {
    clearTimeout(timers.get(id))
    timers.delete(id)
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export const toast = {
  success: (message, opts) => useToastStore.getState().push({ type: 'success', message, ...opts }),
  error: (message, opts) => useToastStore.getState().push({ type: 'error', message, ...opts }),
  info: (message, opts) => useToastStore.getState().push({ type: 'info', message, ...opts }),
}
