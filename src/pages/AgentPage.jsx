import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Send, Bot, Wrench, ArrowUpRight, Trash2, Sparkles } from 'lucide-react'
import { agentApi } from '../api/client'
import { errorMessage } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import Markdown from '../lib/markdown'
import { Spinner } from '../components/ui'

const STORAGE_KEY = 'ja-agent-chat'
const TOOL_LABELS = {
  search_jobs: 'Searched jobs', get_job_details: 'Read job details', get_my_resumes: 'Checked your resumes',
  check_ats_score: 'Ran ATS check', get_my_applications: 'Reviewed applications', save_job: 'Saved job',
  update_application_status: 'Updated application', recommend_templates: 'Found templates',
  get_country_resume_guidelines: 'Looked up country rules',
}

const SUGGESTIONS = [
  { icon: '🔎', text: 'Find remote Python developer jobs' },
  { icon: '📊', text: "What's my resume's ATS score and how do I improve it?" },
  { icon: '🌍', text: 'How should I format my CV for Germany?' },
  { icon: '🩺', text: 'Recommend resume templates for a doctor' },
  { icon: '📋', text: 'Summarise my job applications' },
  { icon: '💰', text: 'How do I negotiate a higher salary offer?' },
]

const WELCOME = {
  role: 'assistant',
  content: "Hi! I'm your **JobAgent AI**. I can search jobs, check your resume's ATS score, save jobs to your pipeline, update application status, and advise on resume formats for any country.\n\nWhat would you like to do?",
}

function loadChat() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    return Array.isArray(saved) && saved.length ? saved : [WELCOME]
  } catch {
    return [WELCOME]
  }
}

export default function AgentPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState(loadChat)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)))
    } catch {
      /* storage unavailable */
    }
  }, [messages])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (!message || loading) return
    setInput('')
    const history = messages.filter((m) => m.content !== WELCOME.content && !m.error).slice(-10).map(({ role, content }) => ({ role, content }))
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)
    try {
      const data = await agentApi.chat({ message, history })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, steps: data.steps, actions: data.actions }])
      if (data.steps?.some((s) => ['save_job', 'update_application_status'].includes(s.tool))) {
        qc.invalidateQueries({ queryKey: ['applications'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }
    } catch (err) {
      const upgrade = err?.response?.status === 402
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage(err, 'Sorry, something went wrong.'), error: true, upgrade }])
    } finally {
      setLoading(false)
      qc.invalidateQueries({ queryKey: ['usage'] })
      inputRef.current?.focus()
    }
  }

  const initials = (user?.full_name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('')

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col sm:-m-6 lg:-m-8">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 p-2 text-white"><Bot size={20} /></div>
        <div className="flex-1">
          <h1 className="font-semibold">AI Career Agent</h1>
          <p className="text-xs muted">Takes real actions on your jobs, resumes & applications</p>
        </div>
        {messages.length > 1 && (
          <button onClick={() => setMessages([WELCOME])} className="btn-ghost btn-sm"><Trash2 size={14} /> Clear</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-thin sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-white"><Sparkles size={15} /></div>
              )}
              <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                {m.steps?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.steps.map((s, j) => (
                      <span key={j} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Wrench size={10} /> {TOOL_LABELS[s.tool] || s.tool} · {s.summary}
                      </span>
                    ))}
                  </div>
                )}
                <div className={
                  m.role === 'user'
                    ? 'rounded-2xl rounded-tr-sm bg-brand-600 px-4 py-2.5 text-sm text-white'
                    : m.error
                      ? 'rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                      : 'rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900'
                }>
                  {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown text={m.content} />}
                  {m.upgrade && <Link to="/billing" className="mt-2 inline-block font-semibold underline">Upgrade to Pro</Link>}
                </div>
                {m.actions?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {m.actions.map((a) => (
                      <Link key={a.to} to={a.to} className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
                        {a.label} <ArrowUpRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{initials}</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-white"><Sparkles size={15} /></div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm muted dark:border-slate-700 dark:bg-slate-900">
                <Spinner className="text-brand-600" /> Thinking & using tools…
              </div>
            </div>
          )}
          {messages.length === 1 && (
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.text} onClick={() => send(s.text)} className="card flex items-center gap-3 p-3 text-left text-sm transition hover:border-brand-300 hover:shadow-md">
                  <span className="text-lg">{s.icon}</span> {s.text}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <form className="mx-auto flex max-w-3xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="input max-h-40 min-h-[44px] resize-none py-2.5"
            placeholder="Ask anything — e.g. “save the first Python job and set it to applied”"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
            maxLength={4000}
          />
          <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={loading || !input.trim()} aria-label="Send"><Send size={17} /></button>
        </form>
        <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] muted">AI can make mistakes. Verify important details.</p>
      </div>
    </div>
  )
}
