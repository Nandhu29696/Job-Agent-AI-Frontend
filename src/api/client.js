import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const onAuthPage =
      window.location.pathname === '/login' ||
      window.location.pathname === '/register'
    // Only force-logout when the user IS logged in and gets a 401/403 on a
    // protected route — never while they are submitting the login form.
    if ((status === 401 || status === 403) && !onAuthPage) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
}

// Jobs
export const jobsApi = {
  list: (params) => api.get('/jobs/', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs/', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
}

// Applications
export const applicationsApi = {
  list: (params) => api.get('/applications/', { params }),
  create: (data) => api.post('/applications/', data),
  update: (id, data) => api.patch(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
}

// Agent
export const agentApi = {
  chat: (data) => api.post('/agent/chat', data),
  coverLetter: (jobId) => api.post(`/agent/cover-letter/${jobId}`),
  matchScore: (jobId) => api.post(`/agent/match-score/${jobId}`),
}

// Employee profile
export const employeeApi = {
  getMyProfile: () => api.get('/employees/me'),
  updateMyProfile: (data) => api.patch('/employees/me', data),
  // Admin only
  list: (params) => api.get('/employees/', { params }),
  get: (empId) => api.get(`/employees/${empId}`),
  delete: (empId) => api.delete(`/employees/${empId}`),
}

export default api
