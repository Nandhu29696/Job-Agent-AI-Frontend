import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Lightbulb, Globe2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ScoreRing } from '../ui'

const STATUS = {
  good: { icon: CheckCircle2, cls: 'text-emerald-600', bar: 'bg-emerald-500' },
  warn: { icon: AlertTriangle, cls: 'text-amber-500', bar: 'bg-amber-500' },
  bad: { icon: XCircle, cls: 'text-red-500', bar: 'bg-red-500' },
}

export default function AtsReport({ result, compact }) {
  if (!result) return null
  const { score, grade, breakdown, keywords, suggestions, stats, ai_tips: aiTips, country_tips: countryTips } = result
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <ScoreRing score={score} size={compact ? 88 : 112} label="ATS" />
        <div>
          <p className="text-xl font-bold">{grade}</p>
          <p className="text-sm muted">
            {stats.word_count} words · ~{stats.estimated_pages} page(s) · {stats.bullet_count} bullets
          </p>
          {keywords.coverage != null && (
            <p className="mt-1 text-sm"><strong>{keywords.coverage}%</strong> keyword match</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {breakdown.map((b) => {
          const S = STATUS[b.status]
          return (
            <details key={b.key} className="group rounded-xl border border-slate-200 p-3 dark:border-slate-800" open={!compact && b.status === 'bad'}>
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <S.icon size={18} className={cn('shrink-0', S.cls)} />
                <span className="flex-1 text-sm font-medium">{b.label}</span>
                <span className="text-xs font-semibold muted">{b.score}/{b.max}</span>
              </summary>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={cn('h-full rounded-full', S.bar)} style={{ width: `${(b.score / b.max) * 100}%` }} />
              </div>
              <ul className="mt-2 space-y-1">
                {b.findings.map((f, i) => <li key={i} className="text-xs muted">• {f}</li>)}
              </ul>
            </details>
          )
        })}
      </div>

      {(keywords.matched.length > 0 || keywords.missing.length > 0) && (
        <div>
          <p className="mb-2 text-sm font-semibold">Job keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.matched.map((k) => (
              <span key={k} className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 size={11} /> {k}</span>
            ))}
            {keywords.missing.map((k) => (
              <span key={k} className="badge bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"><XCircle size={11} /> {k}</span>
            ))}
          </div>
        </div>
      )}

      {aiTips?.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 p-4 dark:from-brand-950/40 dark:to-purple-950/40">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300"><Sparkles size={15} /> AI recommendations</p>
          <ul className="space-y-1.5">{aiTips.map((t, i) => <li key={i} className="text-sm">→ {t}</li>)}</ul>
        </div>
      )}

      {suggestions?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Lightbulb size={15} className="text-amber-500" /> Top fixes</p>
          <ul className="space-y-1.5">{suggestions.slice(0, 6).map((s, i) => <li key={i} className="text-sm muted">{i + 1}. {s}</li>)}</ul>
        </div>
      )}

      {!compact && countryTips?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Globe2 size={15} className="text-brand-600" /> Country conventions</p>
          <ul className="space-y-1">{countryTips.map((t, i) => <li key={i} className="text-sm muted">• {t}</li>)}</ul>
        </div>
      )}
    </div>
  )
}
