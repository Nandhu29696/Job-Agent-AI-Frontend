import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { User, Briefcase, Lock, LogOut, ShieldCheck, Save, BadgeCheck } from 'lucide-react'
import { authApi, employeeApi } from '../api/client'
import { formatDate, passwordChecks } from '../lib/utils'
import { notifyError } from '../lib/notify'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import { Button, Field, PasswordInput, PasswordStrength, Tabs } from '../components/ui'

function AccountTab() {
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState(user?.full_name || '')
  const save = useMutation({
    mutationFn: () => authApi.updateMe({ full_name: name }),
    onSuccess: (u) => setUser(u),
    onError: notifyError,
  })
  return (
    <div className="card max-w-2xl space-y-4">
      <div className="flex items-center gap-4">
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">{(user?.full_name || '?')[0]}</div>
        )}
        <div>
          <p className="font-semibold">{user?.full_name}</p>
          <p className="text-sm muted">{user?.email}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="badge bg-slate-100 capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">{user?.role?.replace('_', ' ')}</span>
            {user?.is_verified && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><BadgeCheck size={11} /> Verified</span>}
            {user?.auth_provider === 'google' && <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Google</span>}
          </div>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-4">
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required /></Field>
        <Field label="Email" hint="Email can't be changed."><input className="input" value={user?.email || ''} disabled /></Field>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="label">Member since</p><p>{formatDate(user?.created_at)}</p></div>
          <div><p className="label">Last sign-in</p><p>{formatDate(user?.last_login_at, { dateStyle: 'medium', timeStyle: 'short' }) || '—'}</p></div>
        </div>
        <Button type="submit" loading={save.isPending}><Save size={15} /> Save changes</Button>
      </form>
    </div>
  )
}

function CareerTab() {
  const { data } = useQuery({ queryKey: ['employee-me'], queryFn: employeeApi.getMyProfile, retry: false })
  const [form, setForm] = useState({ skills: '', experience_years: '', education: '', phone: '', linkedin_url: '' })
  useEffect(() => {
    if (data) setForm({
      skills: data.skills || '', experience_years: data.experience_years ?? '', education: data.education || '',
      phone: data.phone || '', linkedin_url: data.linkedin_url || '',
    })
  }, [data])
  const save = useMutation({
    mutationFn: () => employeeApi.updateMyProfile({ ...form, experience_years: form.experience_years === '' ? null : Number(form.experience_years) }),
    onError: notifyError,
  })
  if (!data) return <div className="card max-w-2xl text-sm muted">Career profiles are available for job-seeker accounts.</div>
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="card max-w-2xl space-y-4">
      <p className="text-sm muted">Used for “Match my skills” job filtering and to pre-fill new resumes.</p>
      <Field label="Skills" hint="Comma-separated, e.g. python, react, sql">
        <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Years of experience"><input type="number" min="0" step="0.5" className="input" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      </div>
      <Field label="LinkedIn URL"><input className="input" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
      <Field label="Highest education"><input className="input" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} /></Field>
      <Button type="submit" loading={save.isPending}><Save size={15} /> Save</Button>
    </form>
  )
}

function SecurityTab() {
  const navigate = useNavigate()
  const { user, setToken, setUser, clear } = useAuthStore()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const hasPassword = user?.has_password !== false

  const change = useMutation({
    mutationFn: () => authApi.changePassword({ current_password: hasPassword ? form.current : null, new_password: form.next }),
    onSuccess: async (tokens) => {
      setToken(tokens.access_token)
      setUser(await authApi.me())
      setForm({ current: '', next: '', confirm: '' })
    },
    onError: notifyError,
  })
  const logoutAll = useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => { clear(); navigate('/login') },
    onError: notifyError,
  })

  const submit = (e) => {
    e.preventDefault()
    if (!passwordChecks(form.next).every((c) => c.ok)) return toast.error('Choose a stronger password')
    if (form.next !== form.confirm) return toast.error('Passwords do not match')
    change.mutate()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={submit} className="card space-y-4">
        <h2 className="flex items-center gap-2 font-semibold"><Lock size={18} /> {hasPassword ? 'Change password' : 'Set a password'}</h2>
        {!hasPassword && <p className="text-sm muted">You signed up with Google. Set a password to also sign in with email.</p>}
        {hasPassword && (
          <Field label="Current password"><PasswordInput value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required /></Field>
        )}
        <Field label="New password">
          <PasswordInput value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} autoComplete="new-password" required />
          <PasswordStrength password={form.next} />
        </Field>
        <Field label="Confirm new password" error={form.confirm && form.confirm !== form.next ? 'Passwords do not match' : ''}>
          <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" required />
        </Field>
        <Button type="submit" loading={change.isPending}>{hasPassword ? 'Update password' : 'Set password'}</Button>
      </form>

      <div className="card space-y-3">
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> Sessions</h2>
        <p className="text-sm muted">Signed in somewhere you don&apos;t recognise? Sign out everywhere — you&apos;ll need to sign in again on every device.</p>
        <Button variant="danger" loading={logoutAll.isPending} onClick={() => window.confirm('Sign out from all devices?') && logoutAll.mutate()}>
          <LogOut size={15} /> Sign out of all devices
        </Button>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [tab, setTab] = useState('account')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Profile & Security</h1>
        <p className="mt-1 muted">Manage your account details and keep it secure.</p>
      </div>
      <Tabs className="w-fit" value={tab} onChange={setTab} tabs={[
        { value: 'account', label: 'Account', icon: User },
        { value: 'career', label: 'Career profile', icon: Briefcase },
        { value: 'security', label: 'Security', icon: Lock },
      ]} />
      {tab === 'account' && <AccountTab />}
      {tab === 'career' && <CareerTab />}
      {tab === 'security' && <SecurityTab />}
    </div>
  )
}
