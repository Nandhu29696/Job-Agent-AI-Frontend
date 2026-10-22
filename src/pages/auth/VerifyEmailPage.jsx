import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { authApi } from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { errorMessage } from '../../lib/utils'
import AuthLayout from '../../components/layout/AuthLayout'
import { Alert, Button, OtpInput } from '../../components/ui'
import { toast } from '../../store/toastStore'

export function useCooldown(initial = 60) {
  const [left, setLeft] = useState(initial)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return [left, setLeft]
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useCooldown(60)

  if (!email) return <Navigate to="/register" replace />

  const submit = async (e) => {
    e?.preventDefault()
    if (otp.length < 6) return
    setError('')
    setLoading(true)
    try {
      const data = await authApi.verifyEmail({ email, otp })
      setSession(data.access_token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Verification failed'))
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    try {
      await authApi.resendOtp(email)
      setCooldown(60)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AuthLayout title="Verify your email">
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
        <MailCheck size={20} className="mt-0.5 shrink-0" />
        <p>We sent a 6-digit code to <strong className="break-all">{email}</strong>. It expires in 5 minutes.</p>
      </div>
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <OtpInput value={otp} onChange={setOtp} />
        <Button type="submit" className="w-full py-2.5" loading={loading} disabled={otp.length < 6}>Verify & continue</Button>
      </form>
      <p className="mt-6 text-center text-sm muted">
        Didn&apos;t get it?{' '}
        {cooldown > 0 ? (
          <span>Resend in {cooldown}s</span>
        ) : (
          <button onClick={resend} className="font-semibold text-brand-600 hover:underline">Resend code</button>
        )}
      </p>
      <p className="mt-2 text-center text-xs muted">
        Wrong email? <Link to="/register" className="text-brand-600 hover:underline">Start over</Link>
      </p>
    </AuthLayout>
  )
}
