import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { successNotification } from '../lib/notifications'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Separate instance without interceptors for the refresh call
const raw = axios.create({ baseURL: '/api', withCredentials: true })

let refreshPromise = null

/** Exchange the httpOnly refresh cookie for a new access token (deduplicated). */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = raw
      .post('/auth/refresh')
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.access_token, data.user)
        return data.access_token
      })
      .catch((err) => {
        useAuthStore.getState().clear()
        throw err
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const NO_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email', '/auth/reset-password']

api.interceptors.response.use(
  (res) => {
    // Every successful create/update/delete shows a notification (see lib/notifications.js)
    const note = successNotification(res.config, res.data)
    if (note) toast.success(note.message, note.action ? { action: note.action } : undefined)
    return res
  },
  async (err) => {
    const { response, config } = err
    // Only 401 means "session invalid". 403 = forbidden for this role; never log out for it.
    if (response?.status === 401 && config && !config._retry && !NO_RETRY.some((p) => config.url?.startsWith(p))) {
      config._retry = true
      try {
        const token = await refreshSession()
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      } catch {
        const here = window.location.pathname + window.location.search
        if (!here.startsWith('/login')) window.location.assign(`/login?next=${encodeURIComponent(here)}`)
      }
    }
    return Promise.reject(err)
  },
)

const get = (url, params) => api.get(url, { params }).then((r) => r.data)
const post = (url, body, cfg) => api.post(url, body, cfg).then((r) => r.data)
const patch = (url, body) => api.patch(url, body).then((r) => r.data)
const put = (url, body) => api.put(url, body).then((r) => r.data)
const del = (url) => api.delete(url).then((r) => r.data)

export const authApi = {
  config: () => get('/auth/config'),
  register: (d) => post('/auth/register', d),
  verifyEmail: (d) => post('/auth/verify-email', d),
  resendOtp: (email, purpose = 'verify_email') => post(`/auth/resend-otp?purpose=${purpose}`, { email }),
  login: (d) => post('/auth/login', d),
  logout: () => post('/auth/logout'),
  logoutAll: () => post('/auth/logout-all'),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (d) => post('/auth/reset-password', d),
  changePassword: (d) => post('/auth/change-password', d),
  me: () => get('/users/me'),
  updateMe: (d) => patch('/users/me', d),
  usage: () => get('/users/me/usage'),
  dashboard: () => get('/users/me/dashboard'),
}

export const jobsApi = {
  list: (params) => get('/jobs/', params),
  get: (id) => get(`/jobs/${id}`),
  create: (d) => post('/jobs/', d),
  update: (id, d) => patch(`/jobs/${id}`, d),
  delete: (id) => del(`/jobs/${id}`),
}

export const applicationsApi = {
  list: (params) => get('/applications/', params),
  create: (d) => post('/applications/', d),
  update: (id, d) => patch(`/applications/${id}`, d),
  delete: (id) => del(`/applications/${id}`),
}

export const agentApi = {
  chat: (d) => post('/agent/chat', d),
  coverLetter: (jobId) => post(`/agent/cover-letter/${jobId}`),
  matchScore: (jobId) => post(`/agent/match-score/${jobId}`),
}

export const employeeApi = {
  getMyProfile: () => get('/employees/me'),
  updateMyProfile: (d) => patch('/employees/me', d),
}

export const resumesApi = {
  list: () => get('/resumes/'),
  get: (id) => get(`/resumes/${id}`),
  create: (d) => post('/resumes/', d),
  update: (id, d) => patch(`/resumes/${id}`, d),
  delete: (id) => del(`/resumes/${id}`),
  duplicate: (id) => post(`/resumes/${id}/duplicate`),
  ats: (id, d = {}) => post(`/resumes/${id}/ats`, d),
  adaptCountry: (id, d) => post(`/resumes/${id}/adapt-country`, d),
  authorizeDownload: (id) => post(`/resumes/${id}/download`),
  import: (form) => post('/resumes/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const resumeAiApi = {
  enhanceSummary: (d) => post('/resume-ai/enhance-summary', d),
  enhanceBullets: (d) => post('/resume-ai/enhance-bullets', d),
  suggestSkills: (d) => post('/resume-ai/suggest-skills', d),
  tailor: (d) => post('/resume-ai/tailor', d),
  atsCheck: (d) => post('/resume-ai/ats-check', d),
  atsCheckFile: (form) =>
    post('/resume-ai/ats-check/file', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  coverLetter: (d) => post('/resume-ai/cover-letter', d),
}

export const templatesApi = {
  list: (params) => get('/templates/', params),
  get: (id) => get(`/templates/${id}`),
}

export const metaApi = {
  countries: () => get('/meta/countries'),
  categories: () => get('/meta/categories'),
}

export const paymentsApi = {
  plans: () => get('/payments/plans'),
  createOrder: (d) => post('/payments/orders', d),
  verify: (d) => post('/payments/verify', d),
  mine: () => get('/payments/me'),
}

export const adminApi = {
  stats: () => get('/admin/stats'),
  users: (params) => get('/admin/users', params),
  updateUser: (id, d) => patch(`/admin/users/${id}`, d),
  deleteUser: (id) => del(`/admin/users/${id}`),
  forceLogout: (id) => post(`/admin/users/${id}/force-logout`),
  grantTemplate: (id, templateId) => post(`/admin/users/${id}/grant-template`, { template_id: templateId }),
  templates: () => get('/admin/templates'),
  updateTemplate: (id, d) => patch(`/admin/templates/${id}`, d),
  payments: (params) => get('/admin/payments', params),
  auditLogs: (params) => get('/admin/audit-logs', params),
  settings: () => get('/admin/settings'),
  saveSettings: (d) => put('/admin/settings', d),
}

export default api
