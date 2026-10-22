import { Component, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, Moon, Sun, X, Check, Lock, Crown } from 'lucide-react'
import { cn, passwordChecks, scoreHex } from '../lib/utils'
import { useToastStore } from '../store/toastStore'

export function Logo({ className, to = '/' }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2 font-bold tracking-tight', className)}>
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span className="text-lg text-slate-900 dark:text-white">
        JobAgent<span className="text-brand-600"> AI</span>
      </span>
    </Link>
  )
}

export function Spinner({ className, size = 16 }) {
  return <Loader2 size={size} className={cn('animate-spin', className)} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 muted">
      <Spinner size={24} className="text-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)} />
}

export function Button({ loading, children, className, variant = 'primary', size, ...props }) {
  return (
    <button
      className={cn(`btn-${variant}`, size === 'sm' && 'btn-sm', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children, className }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function PasswordInput({ value, onChange, placeholder = '••••••••', autoComplete = 'current-password', ...p }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className="input pr-10"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...p}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export function PasswordStrength({ password }) {
  const checks = passwordChecks(password)
  const passed = checks.filter((c) => c.ok).length
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']
  if (!password) return null
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i < passed ? colors[passed] : 'bg-slate-200 dark:bg-slate-700')} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <span key={c.label} className={cn('flex items-center gap-1 text-[11px]', c.ok ? 'text-emerald-600' : 'muted')}>
            <Check size={11} className={c.ok ? '' : 'opacity-30'} /> {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function OtpInput({ length = 6, value, onChange, autoFocus = true }) {
  const refs = useRef([])
  const digits = value.padEnd(length, ' ').slice(0, length).split('')

  const setAt = (i, d) => {
    const next = digits.map((x, j) => (j === i ? d : x)).join('').replace(/\s+$/, '')
    onChange(next.replace(/ /g, ''))
  }
  return (
    <div className="flex justify-center gap-2" onPaste={(e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
      if (text) {
        e.preventDefault()
        onChange(text)
        refs.current[Math.min(text.length, length - 1)]?.focus()
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          value={d.trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            setAt(i, v || ' ')
            if (v && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim() && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus()
          }}
          className="input h-12 w-11 text-center text-lg font-bold sm:h-14 sm:w-12"
        />
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl animate-fade-in dark:bg-slate-900 sm:rounded-2xl', widths[size])}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4 divider">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 scroll-thin">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-5 py-3 divider">{footer}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-slate-700">
      {Icon && (
        <div className="mb-3 rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/30">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ScoreRing({ score = 0, size = 96, stroke = 9, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke={scoreHex(pct)}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-extrabold leading-none" style={{ color: scoreHex(pct) }}>{Math.round(pct)}</div>
        {label && <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide muted">{label}</div>}
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 scroll-thin dark:bg-slate-800/60', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === t.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {t.icon && <t.icon size={15} />}
          {t.label}
          {t.count != null && <span className="text-xs opacity-60">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30',
  }
  return (
    <div className="card flex items-center gap-4">
      {Icon && (
        <div className={cn('hidden rounded-xl p-3 sm:block', tones[tone])}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold">{value}</p>
        <p className="truncate text-sm muted">{label}</p>
        {hint && <p className="text-xs muted">{hint}</p>}
      </div>
    </div>
  )
}

export function PremiumBadge({ owned }) {
  return owned ? (
    <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      <Check size={11} /> Unlocked
    </span>
  ) : (
    <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      <Crown size={11} /> Premium
    </span>
  )
}

export function LockedOverlay({ children }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: 'repeating-linear-gradient(-35deg, rgba(79,70,229,.08) 0 2px, transparent 2px 120px)',
      }} />
      <div className="flex rotate-[-30deg] select-none items-center gap-2 text-5xl font-black uppercase tracking-widest text-brand-600/15">
        <Lock size={44} /> Preview
      </div>
      {children}
    </div>
  )
}

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('ja-theme', next ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
  }
  return (
    <button onClick={toggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Toggle theme">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

const TOAST_STYLE = {
  success: { icon: CheckCircle2, cls: 'text-emerald-600', bar: 'bg-emerald-500', title: 'Success' },
  error: { icon: AlertCircle, cls: 'text-red-600', bar: 'bg-red-500', title: 'Error' },
  info: { icon: Info, cls: 'text-brand-600', bar: 'bg-brand-500', title: 'Notice' },
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((t) => {
        const S = TOAST_STYLE[t.type] || TOAST_STYLE.info
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-toast-in dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3 p-3.5">
              <S.icon size={20} className={cn('mt-0.5 shrink-0', S.cls)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{S.title}</p>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  {t.message}
                  {t.action && (
                    <Link to={t.action.to} onClick={() => dismiss(t.id)} className="ml-2 font-semibold text-brand-600 hover:underline">
                      {t.action.label}
                    </Link>
                  )}
                </p>
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800" aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
            {/* Countdown bar; key restarts it when a repeated message refreshes the toast */}
            <div
              key={t.bump || 0}
              className={cn('absolute bottom-0 left-0 h-0.5 animate-toast-bar', S.bar)}
              style={{ animationDuration: `${t.duration || 4000}ms` }}
            />
          </div>
        )
      })}
    </div>
  )
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    info: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900',
  }
  const Icon = type === 'success' ? CheckCircle2 : type === 'info' ? Info : AlertCircle
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border p-3 text-sm', styles[type])}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('Page crashed', error, info)
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertCircle size={32} className="text-red-500" />
        <h2 className="mt-3 text-lg font-semibold">Something went wrong on this page</h2>
        <p className="mt-1 text-sm muted">Try reloading. If it keeps happening, contact support.</p>
        <button className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    )
  }
}
