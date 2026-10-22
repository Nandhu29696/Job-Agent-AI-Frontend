import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KanbanSquare, Trash2, StickyNote, Star } from 'lucide-react'
import { applicationsApi } from '../api/client'
import { cn, scoreColor, timeAgo } from '../lib/utils'
import { notifyError } from '../lib/notify'
import { Button, EmptyState, Modal, PageLoader } from '../components/ui'
import { STATUS_CONFIG } from '../components/StatusBadge'

const COLUMNS = ['saved', 'applied', 'interviewing', 'offered', 'rejected']

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const { data: apps = [], isLoading } = useQuery({ queryKey: ['applications'], queryFn: () => applicationsApi.list() })
  const [dragOver, setDragOver] = useState(null)
  const [notesFor, setNotesFor] = useState(null)
  const [notes, setNotes] = useState('')

  const update = useMutation({
    mutationFn: ({ id, ...d }) => applicationsApi.update(id, d),
    onMutate: async ({ id, status }) => {
      if (!status) return
      await qc.cancelQueries({ queryKey: ['applications'] })
      const prev = qc.getQueryData(['applications'])
      qc.setQueryData(['applications'], (old = []) => old.map((a) => (a.id === id ? { ...a, status } : a)))
      return { prev }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['applications'], ctx.prev)
      notifyError(err)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
  const remove = useMutation({
    mutationFn: (id) => applicationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
    onError: notifyError,
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="mt-1 muted">Drag cards between columns to update their status.</p>
        </div>
        <Link to="/jobs" className="btn-secondary">Find more jobs</Link>
      </div>

      {apps.length === 0 ? (
        <EmptyState icon={KanbanSquare} title="Your pipeline is empty" description="Save jobs from the job board or ask the AI agent to find and save jobs for you."
          action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>} />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 scroll-thin sm:mx-0 sm:px-0">
          <div className="grid min-w-[1000px] grid-cols-5 gap-4">
            {COLUMNS.map((col) => {
              const cfg = STATUS_CONFIG[col]
              const items = apps.filter((a) => a.status === col)
              return (
                <div
                  key={col}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(col) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(null)
                    const id = Number(e.dataTransfer.getData('text/plain'))
                    const app = apps.find((a) => a.id === id)
                    if (app && app.status !== col) update.mutate({ id, status: col })
                  }}
                  className={cn('flex min-h-[300px] flex-col rounded-2xl bg-slate-100 p-3 transition dark:bg-slate-900/60', dragOver === col && 'ring-2 ring-brand-500')}
                >
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                    <span className="text-sm font-semibold">{cfg.label}</span>
                    <span className="ml-auto rounded-full bg-white px-2 text-xs font-medium muted dark:bg-slate-800">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((a) => (
                      <div
                        key={a.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(a.id))}
                        className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900"
                      >
                        <Link to={`/jobs/${a.job_id}`} className="block text-sm font-semibold leading-snug hover:text-brand-600">{a.job?.title || 'Job'}</Link>
                        <p className="text-xs muted">{a.job?.company}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {a.match_score != null && <span className={cn('flex items-center gap-0.5 font-semibold', scoreColor(a.match_score))}><Star size={11} /> {Math.round(a.match_score)}%</span>}
                          <span className="muted">{timeAgo(a.updated_at)}</span>
                        </div>
                        {a.notes && <p className="mt-2 line-clamp-2 rounded bg-amber-50 p-1.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{a.notes}</p>}
                        <div className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                          <select className="flex-1 rounded border-0 bg-transparent py-0.5 text-xs muted focus:ring-0" value={a.status} onChange={(e) => update.mutate({ id: a.id, status: e.target.value })} aria-label="Status">
                            {COLUMNS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                          </select>
                          <button onClick={() => { setNotesFor(a); setNotes(a.notes || '') }} className="rounded p-1 text-slate-400 hover:text-amber-600" aria-label="Notes"><StickyNote size={13} /></button>
                          <button onClick={() => window.confirm('Remove this application?') && remove.mutate(a.id)} className="rounded p-1 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={!!notesFor} onClose={() => setNotesFor(null)} title={`Notes — ${notesFor?.job?.title || ''}`}
        footer={<>
          <Button variant="secondary" onClick={() => setNotesFor(null)}>Cancel</Button>
          <Button loading={update.isPending} onClick={() => update.mutate({ id: notesFor.id, notes }, { onSuccess: () => setNotesFor(null) })}>Save notes</Button>
        </>}>
        <textarea rows={6} className="input" placeholder="Interview dates, contacts, salary discussed…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {notesFor?.cover_letter && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand-600">View saved cover letter</summary>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{notesFor.cover_letter}</p>
          </details>
        )}
      </Modal>
    </div>
  )
}
