import { CheckCircle2, Sparkles } from 'lucide-react'
import { Logo, ThemeToggle } from '../ui'

const POINTS = [
  'AI agent that searches jobs & tracks applications for you',
  'ATS score checker with keyword gap analysis',
  'Country-specific formats: US, UK, Germany, India, UAE & more',
  '24 templates for IT, doctors, engineers, finance and more',
]

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-purple-700 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="relative flex items-center gap-2 text-lg font-bold">
          <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-lg ring-2 ring-white/30" /> JobAgent AI
        </div>
        <div className="relative my-auto max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles size={13} /> Your AI career co-pilot
          </span>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight">Land interviews faster with a resume that beats the ATS.</h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-brand-50">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} JobAgent AI</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GoogleButton({ label = 'Continue with Google' }) {
  return (
    <a href="/api/auth/google/login" className="btn-secondary w-full py-2.5">
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
      </svg>
      {label}
    </a>
  )
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs muted">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}
