import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { refreshSession } from './api/client'
import { useAuthStore, isStaff, isSuperAdmin } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import { PageLoader, Toaster } from './components/ui'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallbackPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AgentPage = lazy(() => import('./pages/AgentPage'))
const ResumesPage = lazy(() => import('./pages/resumes/ResumesPage'))
const ResumeEditorPage = lazy(() => import('./pages/resumes/ResumeEditorPage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const AtsCheckerPage = lazy(() => import('./pages/AtsCheckerPage'))
const CoverLetterPage = lazy(() => import('./pages/CoverLetterPage'))
const JobsPage = lazy(() => import('./pages/JobsPage'))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminJobs = lazy(() => import('./pages/admin/AdminJobs'))
const AdminTemplates = lazy(() => import('./pages/admin/AdminTemplates'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()
  if (status === 'loading') return <PageLoader />
  if (status !== 'authenticated') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return children
}

function GuestOnly({ children }) {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <PageLoader />
  return status === 'authenticated' ? <Navigate to="/dashboard" replace /> : children
}

function RequireRole({ check, children }) {
  const user = useAuthStore((s) => s.user)
  return check(user) ? children : <Navigate to="/dashboard" replace />
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-black text-brand-600">404</p>
      <p className="mt-2 muted">This page doesn&apos;t exist.</p>
      <a href="/" className="btn-primary mt-6">Go home</a>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    // Restore the session from the httpOnly refresh cookie
    refreshSession().catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/verify-email" element={<GuestOnly><VerifyEmailPage /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/resumes/:id" element={<ResumeEditorPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/ats-checker" element={<AtsCheckerPage />} />
            <Route path="/cover-letter" element={<CoverLetterPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/admin" element={<RequireRole check={isStaff}><AdminOverview /></RequireRole>} />
            <Route path="/admin/jobs" element={<RequireRole check={isStaff}><AdminJobs /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole check={isSuperAdmin}><AdminUsers /></RequireRole>} />
            <Route path="/admin/templates" element={<RequireRole check={isSuperAdmin}><AdminTemplates /></RequireRole>} />
            <Route path="/admin/payments" element={<RequireRole check={isSuperAdmin}><AdminPayments /></RequireRole>} />
            <Route path="/admin/audit-logs" element={<RequireRole check={isSuperAdmin}><AdminAuditLogs /></RequireRole>} />
            <Route path="/admin/settings" element={<RequireRole check={isSuperAdmin}><AdminSettings /></RequireRole>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}
