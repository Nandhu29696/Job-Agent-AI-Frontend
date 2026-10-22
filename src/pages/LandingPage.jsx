import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Gauge, Wand2, Globe2, LayoutTemplate, KanbanSquare, Check, ArrowRight, Sparkles, ShieldCheck, Crown,
} from 'lucide-react'
import { paymentsApi, templatesApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { formatINR } from '../lib/utils'
import { Logo, ThemeToggle, ScoreRing } from '../components/ui'
import { TemplateThumb } from '../components/resume/ScaledResume'

const FEATURES = [
  { icon: Bot, title: 'AI Career Agent', text: 'Chat with an agent that actually acts: searches jobs, checks your ATS score, saves jobs and updates your pipeline.' },
  { icon: Gauge, title: 'ATS Score Checker', text: 'A 7-point ATS scan with keyword gap analysis against any job description — know exactly what to fix.' },
  { icon: Wand2, title: 'AI Resume Enhancement', text: 'Rewrite bullets with action verbs and metrics, generate summaries and tailor your whole resume to a job in one click.' },
  { icon: Globe2, title: 'International Formats', text: 'US, UK, Canada, Germany, France, India, UAE, Australia, Japan & Europass rules applied automatically.' },
  { icon: LayoutTemplate, title: 'Templates by Profession', text: 'Modern, professional, academic and creative designs for IT, doctors, engineers, finance, legal and more.' },
  { icon: KanbanSquare, title: 'Application Tracker', text: 'A visual board from Saved to Offer, with AI cover letters and match scores for every job.' },
]

const COUNTRIES = ['🇺🇸 US', '🇬🇧 UK', '🇨🇦 Canada', '🇩🇪 Germany', '🇫🇷 France', '🇳🇱 Netherlands', '🇪🇺 Europass', '🇮🇳 India', '🇦🇪 UAE', '🇸🇦 Saudi', '🇦🇺 Australia', '🇸🇬 Singapore', '🇯🇵 Japan']

export default function LandingPage() {
  const status = useAuthStore((s) => s.status)
  const authed = status === 'authenticated'
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: () => templatesApi.list() })
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: paymentsApi.plans })
  const showcase = [
    templates.find((t) => t.slug === 'tech-sidebar'),
    templates.find((t) => t.slug === 'modern-blue'),
    templates.find((t) => t.slug === 'doctor-elite'),
    templates.find((t) => t.slug === 'executive-gold'),
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="ml-8 hidden gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#templates" className="hover:text-brand-600">Templates</a>
            <a href="#pricing" className="hover:text-brand-600">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {authed ? (
              <Link to="/dashboard" className="btn-primary">Dashboard <ArrowRight size={16} /></Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
                <Link to="/register" className="btn-primary">Get started free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,.18),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
              <Sparkles size={13} /> AI resume builder + job agent
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Get past the ATS.<br />
              <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Get the interview.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg muted">
              Build a country-ready resume, score it against any job description, let AI rewrite it — and let your
              personal agent find and track jobs for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={authed ? '/resumes' : '/register'} className="btn-primary px-6 py-3 text-base">
                Build my resume <ArrowRight size={18} />
              </Link>
              <Link to={authed ? '/ats-checker' : '/register'} className="btn-secondary px-6 py-3 text-base">
                <Gauge size={18} /> Check ATS score
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm muted">
              <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> 10 free templates</span>
              <span className="flex items-center gap-1.5"><Check size={15} className="text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Secure & private</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-brand-200 to-purple-200 blur-2xl dark:from-brand-900/40 dark:to-purple-900/40" />
            {showcase[0] && <TemplateThumb template={showcase[0]} className="rotate-1 rounded-lg" />}
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <ScoreRing score={92} size={64} stroke={7} />
              <div>
                <p className="text-sm font-bold">ATS Score</p>
                <p className="text-xs text-emerald-600">Excellent · 18/20 keywords</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="border-y border-slate-200 bg-slate-50 py-6 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest muted">Formats that follow local hiring rules</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COUNTRIES.map((c) => <span key={c} className="chip">{c}</span>)}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to get hired</h2>
          <p className="mt-3 muted">One workspace for your resume, applications and an AI agent that does the busywork.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-4 inline-flex rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/30">
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="bg-slate-50 py-20 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Templates for every profession</h2>
              <p className="mt-2 muted">{templates.length || 24} designs — modern, professional, medical, academic, creative.</p>
            </div>
            <Link to={authed ? '/templates' : '/register'} className="btn-secondary">Browse all <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {showcase.map((t) => (
              <div key={t.id} className="group">
                <TemplateThumb template={t} className="overflow-hidden rounded-lg transition group-hover:-translate-y-1" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.name}</span>
                  {t.is_premium ? <span className="badge bg-amber-100 text-amber-700"><Crown size={11} /> {formatINR(t.price_paise)}</span> : <span className="badge bg-emerald-100 text-emerald-700">Free</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
          <p className="mt-2 muted">Start free. Upgrade only if you need more.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-2 text-4xl font-extrabold">₹0</p>
            <ul className="mt-6 space-y-2 text-sm">
              {['10 professional templates', 'Unlimited resumes & PDF downloads', 'ATS score checker', `${plans?.free?.daily_ai_limit ?? 15} AI credits / day`, 'Country formats & job tracker'].map((f) => (
                <li key={f} className="flex gap-2"><Check size={16} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="btn-secondary mt-8 w-full">Get started</Link>
          </div>
          <div className="card relative border-brand-500 ring-2 ring-brand-500">
            <span className="absolute -top-3 right-5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">Most popular</span>
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Crown size={18} className="text-amber-500" /> Pro</h3>
            <p className="mt-2 text-4xl font-extrabold">
              {formatINR(plans?.pro?.price_paise ?? 29900)}<span className="text-base font-medium muted"> / {plans?.pro?.days ?? 30} days</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {(plans?.pro?.features || ['All premium templates', 'Unlimited AI']).map((f) => (
                <li key={f} className="flex gap-2"><Check size={16} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <Link to={authed ? '/billing' : '/register'} className="btn-primary mt-8 w-full">Upgrade to Pro</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm muted">Or buy individual premium templates from ₹49 — secure payments by Razorpay (UPI, cards, netbanking).</p>
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-sm muted sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} JobAgent AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
