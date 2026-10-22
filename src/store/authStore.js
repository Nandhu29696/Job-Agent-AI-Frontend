import { create } from 'zustand'

// The access token lives only in memory (never localStorage) to limit XSS exposure.
// Sessions survive reloads through the httpOnly refresh cookie (see api/client.js).
export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  status: 'loading', // loading | authenticated | anonymous
  setSession: (token, user) =>
    set((s) => ({ token, user: user ?? s.user, status: 'authenticated' })),
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  clear: () => set({ token: null, user: null, status: 'anonymous' }),
}))

export const isStaff = (user) => user?.role === 'admin' || user?.role === 'super_admin'
export const isSuperAdmin = (user) => user?.role === 'super_admin'
