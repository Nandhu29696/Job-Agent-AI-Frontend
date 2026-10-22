import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../api/client'
import { errorMessage, passwordChecks } from '../../lib/utils'
import AuthLayout, { GoogleButton, OrDivider } from '../../components/layout/AuthLayout'
import { Alert, Button, Field, PasswordInput, PasswordStrength } from '../../components/ui'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { data: cfg } = useQuery({ queryKey: ['auth-config'], queryFn: authApi.config, staleTime: 300_000 })

  const strong = passwordChecks(form.password).every((c) => c.ok)
  const mismatch = form.confirm && form.confirm !== form.password

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!strong) return setError('Please choose a stronger password')
    if (mismatch) return setError('Passwords do not match')
    setLoading(true)
    try {
      await authApi.register({ full_name: form.full_name, email: form.email, password: form.password })
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
    } catch (err) {
      setError(errorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  if (cfg && !cfg.registration_open) {
    return (
      <AuthLayout title="Registration closed">
        <Alert type="info">New sign-ups are temporarily paused. Please check back soon.</Alert>
        <Link to="/login" className="btn-secondary mt-6 w-full">Back to sign in</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Free forever. No credit card required.">
      {cfg?.google_enabled && (
        <>
          <GoogleButton label="Sign up with Google" />
          <OrDivider />
        </>
      )}
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Full name">
          <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" required minLength={2} autoFocus />
        </Field>
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
          <PasswordStrength password={form.password} />
        </Field>
        <Field label="Confirm password" error={mismatch ? 'Passwords do not match' : ''}>
          <PasswordInput value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" required />
        </Field>
        <label className="flex items-start gap-2 text-xs muted">
          <input type="checkbox" className="mt-0.5 rounded" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        <Button type="submit" className="w-full py-2.5" loading={loading} disabled={!agree}>Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm muted">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
