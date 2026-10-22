import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import { adminApi } from '../../api/client'
import { cn, formatDate } from '../../lib/utils'
import { notifyError } from '../../lib/notify'
import { useAuthStore } from '../../store/authStore'
import { Button, Field, Modal, PageLoader } from '../../components/ui'

const ROLE_STYLE = {
  super_admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  employee: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function EditUserModal({ user, onClose }) {
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [form, setForm] = useState(null)
  const [templateId, setTemplateId] = useState('')
  const { data: templates = [] } = useQuery({ queryKey: ['admin-templates'], queryFn: adminApi.templates, enabled: !!user })

  useEffect(() => {
    if (user) setForm({
      full_name: user.full_name || '', role: user.role, is_active: user.is_active, is_verified: user.is_verified,
      plan: user.plan, plan_expires_at: user.plan_expires_at ? user.plan_expires_at.slice(0, 10) : '',
    })
  }, [user])

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] })
  const save = useMutation({
    mutationFn: () => adminApi.updateUser(user.id, { ...form, plan_expires_at: form.plan_expires_at ? `${form.plan_expires_at}T23:59:59` : null }),
    onSuccess: () => { refresh(); onClose() },
    onError: notifyError,
  })
  const del = useMutation({ mutationFn: () => adminApi.deleteUser(user.id), onSuccess: () => { refresh(); onClose() }, onError: notifyError })
  const forceLogout = useMutation({ mutationFn: () => adminApi.forceLogout(user.id), onError: notifyError })
  const grant = useMutation({ mutationFn: () => adminApi.grantTemplate(user.id, Number(templateId)), onError: notifyError })

  if (!user || !form) return null
  const self = me?.id === user.id
  return (
    <Modal open onClose={onClose} title={`Manage ${user.email}`} size="lg"
      footer={<>
        {!self && <Button variant="danger" className="mr-auto" loading={del.isPending} onClick={() => window.confirm(`Permanently delete ${user.email} and all their data?`) && del.mutate()}>Delete</Button>}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
      </>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Role" hint={self ? "You can't change your own role" : ''}>
          <select className="input" value={form.role} disabled={self} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="employee">Job seeker</option><option value="admin">Admin</option><option value="super_admin">Super admin</option>
          </select>
        </Field>
        <Field label="Plan">
          <select className="input" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
            <option value="free">Free</option><option value="pro">Pro</option>
          </select>
        </Field>
        <Field label="Pro expires" hint="Empty = never">
          <input type="date" className="input" value={form.plan_expires_at} disabled={form.plan !== 'pro'} onChange={(e) => setForm({ ...form, plan_expires_at: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.is_active} disabled={self} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Account active</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={form.is_verified} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} /> Email verified</label>
      </div>
      <div className="mt-6 space-y-3 border-t pt-4 divider">
        <p className="text-sm font-semibold">Grant a premium template</p>
        <div className="flex gap-2">
          <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Select template…</option>
            {templates.filter((t) => t.is_premium).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Button variant="secondary" disabled={!templateId} loading={grant.isPending} onClick={() => grant.mutate()}>Grant</Button>
        </div>
        <Button variant="secondary" size="sm" loading={forceLogout.isPending} onClick={() => forceLogout.mutate()}>Force sign-out on all devices</Button>
      </div>
    </Modal>
  )
}

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, status, page],
    queryFn: () => adminApi.users({ q: search || undefined, role: role || undefined, status: status || undefined, page, page_size: 20 }),
    placeholderData: (p) => p,
  })
  const pages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Users</h1>
        <p className="mt-1 muted">{data?.total ?? '…'} accounts</p>
      </div>
      <div className="card flex flex-col gap-2 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
          <option value="">All roles</option><option value="employee">Job seekers</option><option value="admin">Admins</option><option value="super_admin">Super admins</option>
        </select>
        <select className="input sm:w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Any status</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="unverified">Unverified</option>
        </select>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide muted dark:bg-slate-800/50">
                <tr><th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Plan</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-t divider">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs muted">{u.email} {u.auth_provider === 'google' && '· Google'}</p>
                    </td>
                    <td className="px-4 py-3"><span className={cn('badge capitalize', ROLE_STYLE[u.role])}>{u.role.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3">{u.is_pro ? <span className="flex items-center gap-1 text-amber-600"><Crown size={13} /> Pro</span> : 'Free'}</td>
                    <td className="px-4 py-3">
                      {!u.is_active ? <span className="badge bg-red-100 text-red-700">Disabled</span>
                        : !u.is_verified ? <span className="badge bg-amber-100 text-amber-700">Unverified</span>
                          : <span className="badge bg-emerald-100 text-emerald-700">Active</span>}
                    </td>
                    <td className="px-4 py-3 muted">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="secondary" onClick={() => setEditing(u)}>Manage</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm divider">
            <span className="muted">Page {page} of {pages}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></Button>
              <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></Button>
            </div>
          </div>
        </div>
      )}
      <EditUserModal user={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
