import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Zap } from 'lucide-react'
import { jobsApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import JobCard from '../components/JobCard'

export default function JobsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'

  const [search, setSearch] = useState('')
  const [matchSkills, setMatchSkills] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', company: '', location: '', description: '',
    requirements: '', job_type: 'full-time', remote: false, url: '', salary_min: '', salary_max: '',
  })

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', search, matchSkills],
    queryFn: () =>
      jobsApi
        .list({
          q: search || undefined,
          match_skills: matchSkills && isEmployee ? true : undefined,
        })
        .then((r) => r.data),
  })

  const createJob = useMutation({
    mutationFn: (data) => jobsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['jobs'])
      setShowForm(false)
      setForm({ title: '', company: '', location: '', description: '', requirements: '', job_type: 'full-time', remote: false, url: '', salary_min: '', salary_max: '' })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createJob.mutate({
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <div className="flex items-center gap-2">
          {/* Match My Skills toggle — employees only */}
          {isEmployee && (
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                matchSkills
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setMatchSkills((v) => !v)}
              title="Show only jobs matching your skills"
            >
              <Zap size={15} />
              Match My Skills
            </button>
          )}
          {/* Add Job — admins only */}
          {isAdmin && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add Job
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search jobs by title, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Job Modal — admin only */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Add New Job</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Job Title *</label>
                  <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
                  <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                  <select className="input" value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Salary</label>
                  <input type="number" className="input" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Salary</label>
                  <input type="number" className="input" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Job URL</label>
                <input type="url" className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Requirements</label>
                <textarea rows={3} className="input" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} />
                Remote position
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={createJob.isPending}>
                  {createJob.isPending ? 'Saving…' : 'Save Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job List */}
      {isLoading ? (
        <div className="text-sm text-gray-400 text-center py-12">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {matchSkills
            ? 'No jobs match your skills. Update your profile to add skills.'
            : isAdmin
            ? 'No jobs found. Add your first job listing.'
            : 'No jobs found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
