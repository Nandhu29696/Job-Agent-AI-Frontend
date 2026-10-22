import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { authApi } from '../../api/client'
import { errorMessage, passwordChecks } from '../../lib/utils'
import AuthLayout from '../../components/layout/AuthLayout'
import { Alert, Button, Field, OtpInput, PasswordInput, PasswordStrength } from '../../components/ui'
import { useCooldown } from './VerifyEmailPage'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useCooldown(0)

  const sendCode = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setStep('reset')
      setCooldown(60)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const reset = async (e) => {
    e.preventDefault()
    setError('')
    if (!passwordChecks(password).every((c) => c.ok)) return setError('Please choose a stronger password')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await authApi.resetPassword({ email, otp, new_password: password })
      navigate('/login')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={step === 'email' ? 'Forgot password?' : 'Reset your password'}
      subtitle={step === 'email' ? "Enter your email and we'll send you a reset code." : `Enter the code sent to ${email}`}
    >
      {step === 'email' ? (
        <form onSubmit={sendCode} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Email">
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" className="w-full py-2.5" loading={loading}>
            <KeyRound size={16} /> Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <OtpInput value={otp} onChange={setOtp} />
          <p className="text-center text-xs muted">
            {cooldown > 0 ? `Resend available in ${cooldown}s` : (
              <button type="button" onClick={sendCode} className="font-semibold text-brand-600 hover:underline">Resend code</button>
            )}
          </p>
          <Field label="New password">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <PasswordStrength password={password} />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </Field>
          <Button type="submit" className="w-full py-2.5" loading={loading} disabled={otp.length < 6}>Update password</Button>
        </form>
      )}
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm muted hover:text-brand-600">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </AuthLayout>
  )
}
