import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { jobsApi } from '../../api/client'
import { formatDate } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { Button, Field, Modal, PageLoader } from '../../components/ui'

const EMPTY = { title: '', company: '', location: '', description: '', requirements: '', job_type: 'full-time', remote: false, url: '', salary_min: '', salary_max: '', is_active: true }

function JobForm({ job, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(() => (job?.id ? { ...EMPTY, ...job, salary_min: job.salary_min ?? '', salary_max: job.salary_max ?? '' } : EMPTY))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = useMutation({
    mutationFn: () => {
      const body = {
        title: form.title, company: form.company, location: form.location || null, description: form.description || null,
        requirements: form.requirements || null, job_type: form.job_type, remote: form.remote, url: form.url || null,
        salary_min: form.salary_min === '' ? null : Number(form.salary_min), salary_max: form.salary_max === '' ? null : Number(form.salary_max),
      }
      return job?.id ? jobsApi.update(job.id, { ...body, is_active: form.is_active }) : jobsApi.create({ ...body, source: 'manual' })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); onClose() },
    onError: notifyError,
  })
  return (
    <Modal open onClose={onClose} title={job?.id ? 'Edit job' : 'Post a job'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button loading={save.isPending} disabled={!form.title || !form.company} onClick={() => save.mutate()}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title *"><input className="input" value={form.title} onChange={set('title')} /></Field>
        <Field label="Company *"><input className="input" value={form.company} onChange={set('company')} /></Field>
        <Field label="Location"><input className="input" value={form.location || ''} onChange={set('location')} /></Field>
        <Field label="Type">
          <select className="input" value={form.job_type || ''} onChange={set('job_type')}>
            {['full-time', 'part-time', 'contract', 'internship'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Min salary"><input type="number" className="input" value={form.salary_min} onChange={set('salary_min')} /></Field>
        <Field label="Max salary"><input type="number" className="input" value={form.salary_max} onChange={set('salary_max')} /></Field>
        <Field label="Posting URL" className="sm:col-span-2"><input type="url" className="input" value={form.url || ''} onChange={set('url')} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea rows={4} className="input" value={form.description || ''} onChange={set('description')} /></Field>
        <Field label="Requirements" className="sm:col-span-2"><textarea rows={4} className="input" value={form.requirements || ''} onChange={set('requirements')} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.remote} onChange={set('remote')} /> Remote</label>
        {job?.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.is_active} onChange={set('is_active')} /> Listed (active)</label>}
      </div>
    </Modal>
  )
}

export default function AdminJobs() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ['jobs', 'admin', q], queryFn: () => jobsApi.list({ q: q || undefined, limit: 100, include_inactive: true }) })
  const del = useMutation({
    mutationFn: (id) => jobsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
    onError: notifyError,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Manage jobs</h1>
          <p className="mt-1 muted">Post, edit and remove job listings.</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus size={16} /> Post job</Button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search jobs" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide muted dark:bg-slate-800/50">
                <tr><th className="px-4 py-3 font-medium">Job</th><th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Posted</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t divider">
                    <td className="px-4 py-3"><p className="font-medium">{j.title}</p><p className="text-xs muted">{j.company}</p></td>
                    <td className="px-4 py-3 muted">{j.location}{j.remote && ' · Remote'}</td>
                    <td className="px-4 py-3 capitalize">{j.job_type}</td>
                    <td className="px-4 py-3 muted">{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(j)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => window.confirm(`Delete "${j.title}"? Applications for it will be removed.`) && del.mutate(j.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!jobs.length && <tr><td colSpan={5} className="px-4 py-10 text-center muted">No jobs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <JobForm job={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
