import { useState } from 'react'
import {
  User, AlignLeft, Briefcase, GraduationCap, Wrench, FolderGit2, Award, Languages, Heart, Users, FileSignature,
  Sparkles, Plus, BadgeCheck, BookOpen, HandHeart, ScrollText, Check, X,
} from 'lucide-react'
import { resumeAiApi } from '../../api/client'
import { notifyError } from '../../lib/notify'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Field } from '../../components/ui'
import { BulletEditor, ListEditor, PhotoInput, SectionCard, TagInput } from '../../components/resume/editors'
import { SECTION_LABELS } from '../../components/resume/ResumeDocument'

const PERSONAL_EXTRA = {
  date_of_birth: 'Date of birth', nationality: 'Nationality', marital_status: 'Marital status',
  gender: 'Gender', visa_status: 'Visa / work authorisation',
}

const SIMPLE_SECTIONS = {
  certifications: { icon: BadgeCheck, add: 'Add certification', issuer: 'Issuing organisation', date: 'Date' },
  licenses: { icon: ScrollText, add: 'Add license / registration', issuer: 'Authority (e.g. NMC, State Bar)', date: 'Number / validity' },
  publications: { icon: BookOpen, add: 'Add publication', issuer: 'Journal / publisher', date: 'Year' },
  awards: { icon: Award, add: 'Add award', issuer: 'Awarded by', date: 'Year' },
  volunteer: { icon: HandHeart, add: 'Add volunteer role', issuer: 'Organisation', date: 'Dates' },
}

function AiButton({ onClick, loading, children = 'AI write' }) {
  return (
    <Button size="sm" variant="secondary" loading={loading} onClick={onClick} className="border-brand-200 text-brand-700 dark:border-brand-800 dark:text-brand-300">
      {!loading && <Sparkles size={13} />} {children}
    </Button>
  )
}

function Suggestions({ items, onPick, onClose, pickLabel = 'Use this' }) {
  if (!items?.length) return null
  return (
    <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/30">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300"><Sparkles size={12} /> AI suggestions</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss"><X size={14} /></button>
      </div>
      {items.map((s, i) => (
        <div key={i} className="rounded-lg bg-white p-2.5 text-sm dark:bg-slate-900">
          <p>{s}</p>
          <button onClick={() => onPick(s)} className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"><Check size={12} /> {pickLabel}</button>
        </div>
      ))}
    </div>
  )
}

function useAi() {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(null)
  const run = async (key, fn) => {
    setBusy(key)
    try {
      return await fn()
    } catch (e) {
      notifyError(e, 'AI request failed')
      return null
    } finally {
      setBusy(null)
      qc.invalidateQueries({ queryKey: ['usage'] })
    }
  }
  return { busy, run }
}

export default function ContentEditor({ draft, setData, rules, category }) {
  const data = draft.data
  const p = data.personal || {}
  const ctx = {
    country: draft.country, job_category: draft.job_category,
    job_description: draft.target_job_description || null, target_job_title: draft.target_job_title || null,
  }
  const { busy, run } = useAi()
  const [summaryOpts, setSummaryOpts] = useState(null)
  const [bulletSugg, setBulletSugg] = useState({})
  const [extraSections, setExtraSections] = useState([])

  const set = (key, value) => setData((d) => ({ ...d, [key]: value }))
  const setPersonal = (patch) => setData((d) => ({ ...d, personal: { ...d.personal, ...patch } }))

  const photoAllowed = rules?.photo !== 'forbidden'
  const extraFields = Object.keys(PERSONAL_EXTRA).filter((k) => rules?.personal_allowed?.includes(k) || p[k])

  const visibleSimple = Object.keys(SIMPLE_SECTIONS).filter(
    (k) => category?.extra_sections?.includes(k) || data[k]?.length || extraSections.includes(k),
  )
  const optional = [
    ...Object.keys(SIMPLE_SECTIONS).filter((k) => !visibleSimple.includes(k)),
    ...['references', 'declaration', 'custom'].filter((k) => !extraSections.includes(k) && !(k === 'references' ? data.references?.length : k === 'declaration' ? data.declaration : data.custom_sections?.length)),
  ]
  const showRefs = data.references?.length || extraSections.includes('references') || draft.country === 'AU'
  const showDecl = data.declaration || extraSections.includes('declaration') || draft.country === 'IN'
  const showCustom = data.custom_sections?.length || extraSections.includes('custom')

  const aiSummary = () => run('summary', async () => {
    const res = await resumeAiApi.enhanceSummary({ ...ctx, data })
    if (res) {
      setSummaryOpts(res.summaries)
      if (res.headline && !p.headline) setPersonal({ headline: res.headline })
    }
  })

  const aiBullets = (exp) => run(`exp-${exp.id}`, async () => {
    const res = await resumeAiApi.enhanceBullets({ ...ctx, title: exp.title, company: exp.company, bullets: exp.bullets || [] })
    if (res?.bullets?.length) setBulletSugg((s) => ({ ...s, [exp.id]: res.bullets }))
  })

  const aiSkills = () => run('skills', async () => {
    const res = await resumeAiApi.suggestSkills({ ...ctx, data })
    if (!res?.groups?.length) return
    setData((d) => {
      const groups = [...(d.skills || [])]
      res.groups.forEach((g) => {
        const idx = groups.findIndex((x) => x.name?.toLowerCase() === g.name.toLowerCase())
        const have = new Set(groups.flatMap((x) => x.items || []).map((s) => s.toLowerCase()))
        const fresh = g.items.filter((i) => !have.has(i.toLowerCase()))
        if (!fresh.length) return
        if (idx >= 0) groups[idx] = { ...groups[idx], items: [...(groups[idx].items || []), ...fresh] }
        else groups.push({ id: Math.random().toString(36).slice(2, 10), name: g.name, items: fresh })
      })
      return { ...d, skills: groups }
    })
  })

  return (
    <div className="space-y-3">
      <SectionCard title="Personal details" icon={User} defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={p.full_name || ''} onChange={(e) => setPersonal({ full_name: e.target.value })} /></Field>
          <Field label="Headline"><input className="input" placeholder="Senior Data Engineer" value={p.headline || ''} onChange={(e) => setPersonal({ headline: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" value={p.email || ''} onChange={(e) => setPersonal({ email: e.target.value })} /></Field>
          <Field label="Phone"><input className="input" placeholder="+1 555 000 0000" value={p.phone || ''} onChange={(e) => setPersonal({ phone: e.target.value })} /></Field>
          <Field label="Location"><input className="input" placeholder="City, Country" value={p.location || ''} onChange={(e) => setPersonal({ location: e.target.value })} /></Field>
          <Field label="LinkedIn"><input className="input" placeholder="linkedin.com/in/you" value={p.linkedin || ''} onChange={(e) => setPersonal({ linkedin: e.target.value })} /></Field>
          <Field label="Website / portfolio"><input className="input" value={p.website || ''} onChange={(e) => setPersonal({ website: e.target.value })} /></Field>
          <Field label="GitHub"><input className="input" value={p.github || ''} onChange={(e) => setPersonal({ github: e.target.value })} /></Field>
        </div>
        {photoAllowed ? (
          <Field label="Photo" hint={rules?.photo === 'expected' ? `A professional photo is expected in ${rules.name}` : rules?.photo === 'discouraged' ? 'Photos are discouraged here' : 'Optional'}>
            <PhotoInput value={p.photo} onChange={(photo) => setPersonal({ photo })} />
          </Field>
        ) : (
          <p className="rounded-lg bg-slate-50 p-2.5 text-xs muted dark:bg-slate-800/50">📷 Photos are not recommended for {rules?.name} resumes, so this field is hidden.</p>
        )}
        {extraFields.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {extraFields.map((k) => (
              <Field key={k} label={PERSONAL_EXTRA[k]}>
                <input className="input" value={p[k] || ''} onChange={(e) => setPersonal({ [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={draft.country === 'UK' ? 'Personal statement' : 'Professional summary'} icon={AlignLeft} defaultOpen
        actions={<AiButton loading={busy === 'summary'} onClick={aiSummary}>AI write</AiButton>}>
        <textarea rows={5} className="input" placeholder="3–4 lines: who you are, years of experience, top skills, a standout achievement." value={data.summary || ''} onChange={(e) => set('summary', e.target.value)} />
        <p className="text-right text-xs muted">{(data.summary || '').split(/\s+/).filter(Boolean).length} words · aim for 40–90</p>
        <Suggestions items={summaryOpts} onClose={() => setSummaryOpts(null)} onPick={(s) => { set('summary', s); setSummaryOpts(null) }} />
      </SectionCard>

      <SectionCard title="Work experience" icon={Briefcase} badge={data.experience?.length || 0} defaultOpen>
        <ListEditor
          items={data.experience}
          onChange={(v) => set('experience', v)}
          addLabel="Add position"
          newItem={() => ({ title: '', company: '', location: '', start: '', end: '', current: false, bullets: [] })}
          itemTitle={(e) => [e.title, e.company].filter(Boolean).join(' · ')}
          renderItem={(e, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Job title"><input className="input" value={e.title} onChange={(ev) => update({ title: ev.target.value })} /></Field>
                <Field label="Company"><input className="input" value={e.company} onChange={(ev) => update({ company: ev.target.value })} /></Field>
                <Field label="Location"><input className="input" value={e.location} onChange={(ev) => update({ location: ev.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Start"><input className="input" placeholder={rules?.date_format || 'MMM YYYY'} value={e.start} onChange={(ev) => update({ start: ev.target.value })} /></Field>
                  <Field label="End"><input className="input" placeholder={e.current ? 'Present' : rules?.date_format || 'MMM YYYY'} disabled={e.current} value={e.current ? '' : e.end} onChange={(ev) => update({ end: ev.target.value })} /></Field>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="rounded" checked={!!e.current} onChange={(ev) => update({ current: ev.target.checked })} /> I currently work here</label>
              <div className="flex items-center justify-between">
                <span className="label mb-0">Achievements</span>
                <AiButton loading={busy === `exp-${e.id}`} onClick={() => aiBullets(e)}>{e.bullets?.some((b) => b.trim()) ? 'AI improve' : 'AI draft'}</AiButton>
              </div>
              <BulletEditor bullets={e.bullets} onChange={(bullets) => update({ bullets })} />
              {bulletSugg[e.id] && (
                <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-900 dark:bg-brand-950/30">
                  <p className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300"><Sparkles size={12} /> AI rewrite — replace [X] with your real numbers</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">{bulletSugg[e.id].map((b, i) => <li key={i}>{b}</li>)}</ul>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { update({ bullets: bulletSugg[e.id] }); setBulletSugg((s) => ({ ...s, [e.id]: null })) }}>Replace all</Button>
                    <Button size="sm" variant="secondary" onClick={() => { update({ bullets: [...(e.bullets || []).filter((b) => b.trim()), ...bulletSugg[e.id]] }); setBulletSugg((s) => ({ ...s, [e.id]: null })) }}>Append</Button>
                    <Button size="sm" variant="ghost" onClick={() => setBulletSugg((s) => ({ ...s, [e.id]: null }))}>Discard</Button>
                  </div>
                </div>
              )}
            </>
          )}
        />
      </SectionCard>

      <SectionCard title="Education" icon={GraduationCap} badge={data.education?.length || 0}>
        <ListEditor
          items={data.education}
          onChange={(v) => set('education', v)}
          addLabel="Add education"
          newItem={() => ({ degree: '', institution: '', location: '', start: '', end: '', grade: '', details: '' })}
          itemTitle={(e) => [e.degree, e.institution].filter(Boolean).join(' · ')}
          renderItem={(e, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Degree / qualification"><input className="input" value={e.degree} onChange={(ev) => update({ degree: ev.target.value })} /></Field>
              <Field label="Institution"><input className="input" value={e.institution} onChange={(ev) => update({ institution: ev.target.value })} /></Field>
              <Field label="Start"><input className="input" value={e.start} onChange={(ev) => update({ start: ev.target.value })} /></Field>
              <Field label="End / expected"><input className="input" value={e.end} onChange={(ev) => update({ end: ev.target.value })} /></Field>
              <Field label="Grade / GPA"><input className="input" value={e.grade} onChange={(ev) => update({ grade: ev.target.value })} /></Field>
              <Field label="Location"><input className="input" value={e.location} onChange={(ev) => update({ location: ev.target.value })} /></Field>
              <Field label="Details" className="sm:col-span-2"><input className="input" placeholder="Thesis, honours, relevant coursework" value={e.details} onChange={(ev) => update({ details: ev.target.value })} /></Field>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Skills" icon={Wrench} badge={(data.skills || []).reduce((n, g) => n + (g.items?.length || 0), 0)}
        actions={<AiButton loading={busy === 'skills'} onClick={aiSkills}>AI suggest</AiButton>}>
        <ListEditor
          items={data.skills}
          onChange={(v) => set('skills', v)}
          addLabel="Add skill group"
          newItem={() => ({ name: 'Skills', items: [] })}
          itemTitle={(g) => `${g.name || 'Group'} (${g.items?.length || 0})`}
          renderItem={(g, update) => (
            <>
              <Field label="Group name"><input className="input" placeholder="Technical, Tools, Clinical…" value={g.name} onChange={(ev) => update({ name: ev.target.value })} /></Field>
              <TagInput value={g.items} onChange={(items) => update({ items })} placeholder="Add a skill and press Enter" />
            </>
          )}
        />
      </SectionCard>

      <SectionCard title="Projects" icon={FolderGit2} badge={data.projects?.length || 0}>
        <ListEditor
          items={data.projects}
          onChange={(v) => set('projects', v)}
          addLabel="Add project"
          newItem={() => ({ name: '', role: '', link: '', description: '', bullets: [] })}
          itemTitle={(pr) => pr.name}
          renderItem={(pr, update) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Project name"><input className="input" value={pr.name} onChange={(ev) => update({ name: ev.target.value })} /></Field>
                <Field label="Your role"><input className="input" value={pr.role} onChange={(ev) => update({ role: ev.target.value })} /></Field>
                <Field label="Link" className="sm:col-span-2"><input className="input" value={pr.link} onChange={(ev) => update({ link: ev.target.value })} /></Field>
              </div>
              <Field label="Description"><textarea rows={2} className="input" value={pr.description} onChange={(ev) => update({ description: ev.target.value })} /></Field>
              <BulletEditor bullets={pr.bullets} onChange={(bullets) => update({ bullets })} />
            </>
          )}
        />
      </SectionCard>

      {visibleSimple.map((k) => {
        const cfg = SIMPLE_SECTIONS[k]
        return (
          <SectionCard key={k} title={SECTION_LABELS[k]} icon={cfg.icon} badge={data[k]?.length || 0} defaultOpen={extraSections.includes(k)}>
            <ListEditor
              items={data[k]}
              onChange={(v) => set(k, v)}
              addLabel={cfg.add}
              newItem={() => ({ name: '', issuer: '', date: '', detail: '', link: '' })}
              itemTitle={(it) => it.name}
              renderItem={(it, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title" className="sm:col-span-2"><input className="input" value={it.name} onChange={(ev) => update({ name: ev.target.value })} /></Field>
                  <Field label={cfg.issuer}><input className="input" value={it.issuer} onChange={(ev) => update({ issuer: ev.target.value })} /></Field>
                  <Field label={cfg.date}><input className="input" value={it.date} onChange={(ev) => update({ date: ev.target.value })} /></Field>
                  <Field label="Details" className="sm:col-span-2"><input className="input" value={it.detail} onChange={(ev) => update({ detail: ev.target.value })} /></Field>
                </div>
              )}
            />
          </SectionCard>
        )
      })}

      <SectionCard title="Languages" icon={Languages} badge={data.languages?.length || 0}>
        <ListEditor
          items={data.languages}
          onChange={(v) => set('languages', v)}
          addLabel="Add language"
          newItem={() => ({ name: '', level: '' })}
          itemTitle={(l) => [l.name, l.level].filter(Boolean).join(' — ')}
          renderItem={(l, update) => (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Language"><input className="input" value={l.name} onChange={(ev) => update({ name: ev.target.value })} /></Field>
              <Field label="Level">
                <select className="input" value={l.level} onChange={(ev) => update({ level: ev.target.value })}>
                  <option value="">Select…</option>
                  {['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard title="Interests" icon={Heart} badge={data.interests?.length || 0}>
        <TagInput value={data.interests} onChange={(v) => set('interests', v)} placeholder="Add an interest" />
      </SectionCard>

      {showRefs && (
        <SectionCard title="References" icon={Users} badge={data.references?.length || 0} defaultOpen={extraSections.includes('references')}>
          <ListEditor
            items={data.references}
            onChange={(v) => set('references', v)}
            addLabel="Add referee"
            newItem={() => ({ name: '', title: '', company: '', contact: '' })}
            itemTitle={(r) => r.name}
            renderItem={(r, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name"><input className="input" value={r.name} onChange={(ev) => update({ name: ev.target.value })} /></Field>
                <Field label="Title"><input className="input" value={r.title} onChange={(ev) => update({ title: ev.target.value })} /></Field>
                <Field label="Company"><input className="input" value={r.company} onChange={(ev) => update({ company: ev.target.value })} /></Field>
                <Field label="Contact"><input className="input" value={r.contact} onChange={(ev) => update({ contact: ev.target.value })} /></Field>
              </div>
            )}
          />
        </SectionCard>
      )}

      {showDecl && (
        <SectionCard title="Declaration" icon={FileSignature} defaultOpen={extraSections.includes('declaration')}>
          <textarea rows={3} className="input" value={data.declaration || ''} onChange={(e) => set('declaration', e.target.value)} placeholder="I hereby declare that the information furnished above is true to the best of my knowledge." />
        </SectionCard>
      )}

      {showCustom && (
        <SectionCard title="Custom sections" icon={Plus} defaultOpen={extraSections.includes('custom')}>
          <ListEditor
            items={data.custom_sections}
            onChange={(v) => set('custom_sections', v)}
            addLabel="Add custom section"
            newItem={() => ({ title: '', items: [] })}
            itemTitle={(c) => c.title}
            renderItem={(c, update) => (
              <>
                <Field label="Section title"><input className="input" value={c.title} onChange={(ev) => update({ title: ev.target.value })} /></Field>
                <BulletEditor bullets={c.items} onChange={(items) => update({ items })} />
              </>
            )}
          />
        </SectionCard>
      )}

      {optional.length > 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <p className="mb-2 text-sm font-semibold">Add a section</p>
          <div className="flex flex-wrap gap-2">
            {optional.map((k) => (
              <button key={k} className="chip" onClick={() => setExtraSections((s) => [...s, k])}>
                <Plus size={11} className="mr-1 inline" />{SECTION_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
