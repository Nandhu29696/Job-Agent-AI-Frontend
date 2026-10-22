import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { refreshSession } from '../../api/client'
import { PageLoader } from '../../components/ui'

/** Google redirects here after the backend set the refresh cookie. */
export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  useEffect(() => {
    refreshSession()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=Google%20sign-in%20failed', { replace: true }))
  }, [navigate])
  return <PageLoader label="Signing you in…" />
}
