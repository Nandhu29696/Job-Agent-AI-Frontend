import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { errorCode, errorMessage } from '../../lib/utils'
import AuthLayout, { GoogleButton, OrDivider } from '../../components/layout/AuthLayout'
import { Alert, Button, Field, PasswordInput } from '../../components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useAuthStore((s) => s.setSession)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(params.get('error') || '')
  const [loading, setLoading] = useState(false)
  const { data: cfg } = useQuery({ queryKey: ['auth-config'], queryFn: authApi.config, staleTime: 300_000 })

  const next = params.get('next')
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(form)
      setSession(data.access_token, data.user)
      navigate(safeNext, { replace: true })
    } catch (err) {
      if (errorCode(err) === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
        return
      }
      setError(errorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your dashboard">
      {cfg?.google_enabled && (
        <>
          <GoogleButton />
          <OrDivider />
        </>
      )}
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
            autoFocus
          />
        </Field>
        <Field label={
          <span className="flex justify-between">
            Password
            <Link to="/forgot-password" className="font-medium text-brand-600 hover:underline">Forgot?</Link>
          </span>
        }>
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Button type="submit" className="w-full py-2.5" loading={loading}>Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm muted">
        New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create a free account</Link>
      </p>
    </AuthLayout>
  )
}
