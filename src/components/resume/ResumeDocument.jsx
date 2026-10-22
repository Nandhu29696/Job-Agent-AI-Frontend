/**
 * Renders a resume for any template. Each template = a layout engine + config
 * ({ layout, primary, accent, font, photo, heading }). Used for live preview,
 * template thumbnails and PDF printing.
 */
import { Fragment } from 'react'
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from 'lucide-react'

export const PAPER = {
  letter: { width: 816, minHeight: 1056, css: 'Letter' },
  a4: { width: 794, minHeight: 1123, css: 'A4' },
}

export const DEFAULT_ORDER = [
  'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'licenses',
  'publications', 'awards', 'volunteer', 'languages', 'interests', 'references', 'custom', 'declaration',
]

export const SECTION_LABELS = {
  summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', licenses: 'Licenses & Registrations',
  publications: 'Publications', awards: 'Awards & Honors', volunteer: 'Volunteer Experience',
  languages: 'Languages', interests: 'Interests', references: 'References', custom: 'Additional',
  declaration: 'Declaration',
}

const SIDE_SECTIONS = ['skills', 'languages', 'certifications', 'interests', 'awards', 'licenses']
const SIDE_LAYOUTS = ['sidebar', 'split']

const dates = (start, end, current) => {
  const e = current ? 'Present' : end
  return [start, e].filter(Boolean).join(' – ')
}

const has = (data, key) => {
  switch (key) {
    case 'summary': return !!data.summary?.trim()
    case 'declaration': return !!data.declaration?.trim()
    case 'skills': return (data.skills || []).some((g) => g.items?.length)
    case 'interests': return (data.interests || []).length > 0
    case 'custom': return (data.custom_sections || []).some((c) => c.title && c.items?.length)
    default: return (data[key] || []).length > 0
  }
}

function orderedSections(data) {
  const order = data.section_order?.length ? [...data.section_order] : [...DEFAULT_ORDER]
  DEFAULT_ORDER.forEach((k) => !order.includes(k) && order.push(k))
  const hidden = new Set(data.hidden_sections || [])
  return order.filter((k) => DEFAULT_ORDER.includes(k) && !hidden.has(k) && has(data, k))
}

function Heading({ children, t, light }) {
  const color = light ? '#fff' : t.primary
  const base = { fontSize: '10.5pt', fontWeight: 700, letterSpacing: '.01em', textTransform: 'uppercase', marginBottom: 6 }
  if (t.heading === 'bar') {
    return <h3 style={{ ...base, color: light ? '#fff' : '#111827', borderLeft: `4px solid ${light ? '#fff' : t.accent}`, paddingLeft: 8 }}>{children}</h3>
  }
  if (t.heading === 'pill') {
    return (
      <h3 style={{ ...base, display: 'inline-block', color: light ? t.primary : '#fff', background: light ? '#fff' : t.primary, borderRadius: 999, padding: '2px 12px' }}>
        {children}
      </h3>
    )
  }
  if (t.heading === 'caps') {
    return <h3 style={{ ...base, color, letterSpacing: '.03em', fontSize: '9.5pt' }}>{children}</h3>
  }
  return <h3 style={{ ...base, color, borderBottom: `1.5px solid ${light ? 'rgba(255,255,255,.5)' : t.accent}`, paddingBottom: 3 }}>{children}</h3>
}

function Bullets({ items }) {
  const list = (items || []).filter((b) => b?.trim())
  if (!list.length) return null
  return <ul className="mt-1">{list.map((b, i) => <li key={i}>{b}</li>)}</ul>
}

function EntryHeader({ title, sub, right, t, academic }) {
  if (academic) {
    return (
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontStyle: 'italic', color: '#4b5563' }}>{sub}</div>}
      </div>
    )
  }
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <span style={{ fontWeight: 700, color: '#111827' }}>{title}</span>
        {sub && <span style={{ color: t.primary, fontWeight: 600 }}>{title ? ' · ' : ''}{sub}</span>}
      </div>
      {right && <div style={{ fontSize: '9pt', color: '#6b7280', whiteSpace: 'nowrap' }}>{right}</div>}
    </div>
  )
}

function Entry({ layout, t, date, children }) {
  if (layout === 'academic') {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: '92px 1fr', marginBottom: 8 }}>
        <div style={{ fontSize: '9pt', color: '#6b7280', paddingTop: 1 }}>{date}</div>
        <div>{children}</div>
      </div>
    )
  }
  if (layout === 'timeline') {
    return (
      <div style={{ position: 'relative', paddingLeft: 18, marginBottom: 10, borderLeft: `2px solid ${t.accent}55` }}>
        <span style={{ position: 'absolute', left: -6, top: 4, width: 10, height: 10, borderRadius: 999, background: t.accent }} />
        {children}
      </div>
    )
  }
  return <div style={{ marginBottom: 9 }}>{children}</div>
}

function SimpleList({ items, t, layout }) {
  return items.map((it) => (
    <Entry key={it.id || it.name} layout={layout} t={t} date={it.date}>
      <EntryHeader title={it.name} sub={it.issuer} right={layout === 'academic' ? '' : it.date} t={t} academic={layout === 'academic'} />
      {it.detail && <div style={{ fontSize: '9.5pt', color: '#4b5563' }}>{it.detail}</div>}
    </Entry>
  ))
}

function SectionBody({ k, data, t, layout, side }) {
  const academic = layout === 'academic'
  switch (k) {
    case 'summary':
      return <p style={{ textAlign: 'justify' }}>{data.summary}</p>
    case 'experience':
      return data.experience.map((e) => (
        <Entry key={e.id || e.title + e.company} layout={layout} t={t} date={dates(e.start, e.end, e.current)}>
          <EntryHeader title={e.title} sub={[e.company, e.location].filter(Boolean).join(', ')} right={academic ? '' : dates(e.start, e.end, e.current)} t={t} academic={academic} />
          <Bullets items={e.bullets} />
        </Entry>
      ))
    case 'education':
      return data.education.map((e) => (
        <Entry key={e.id || e.degree} layout={layout} t={t} date={dates(e.start, e.end)}>
          <EntryHeader title={e.degree} sub={[e.institution, e.location].filter(Boolean).join(', ')} right={academic ? '' : dates(e.start, e.end)} t={t} academic={academic} />
          {(e.grade || e.details) && <div style={{ fontSize: '9.5pt', color: '#4b5563' }}>{[e.grade, e.details].filter(Boolean).join(' · ')}</div>}
        </Entry>
      ))
    case 'skills':
      if (side) {
        return data.skills.filter((g) => g.items?.length).map((g) => (
          <div key={g.id || g.name} style={{ marginBottom: 8 }}>
            {g.name && <div style={{ fontWeight: 600, fontSize: '9.5pt', marginBottom: 3 }}>{g.name}</div>}
            <div className="flex flex-wrap gap-1">
              {g.items.map((s) => (
                <span key={s} style={{ fontSize: '8.5pt', padding: '1px 7px', borderRadius: 4, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)' }}>{s}</span>
              ))}
            </div>
          </div>
        ))
      }
      if (layout === 'creative' || layout === 'timeline' || layout === 'band') {
        return (
          <div className="flex flex-wrap gap-1.5">
            {data.skills.flatMap((g) => g.items || []).map((s) => (
              <span key={s} style={{ fontSize: '9pt', padding: '2px 9px', borderRadius: 999, background: `${t.accent}22`, color: t.primary, fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        )
      }
      return data.skills.filter((g) => g.items?.length).map((g) => (
        <div key={g.id || g.name} style={{ marginBottom: 3 }}>
          {g.name && <strong>{g.name}: </strong>}{g.items.join(', ')}
        </div>
      ))
    case 'projects':
      return data.projects.map((p) => (
        <Entry key={p.id || p.name} layout={layout} t={t} date="">
          <EntryHeader title={p.name} sub={p.role} right={p.link} t={t} academic={academic} />
          {p.description && <div>{p.description}</div>}
          <Bullets items={p.bullets} />
        </Entry>
      ))
    case 'certifications':
    case 'licenses':
    case 'publications':
    case 'awards':
    case 'volunteer':
      if (side) {
        return data[k].map((it) => (
          <div key={it.id || it.name} style={{ marginBottom: 6, fontSize: '9.5pt' }}>
            <div style={{ fontWeight: 600 }}>{it.name}</div>
            <div style={{ opacity: 0.8 }}>{[it.issuer, it.date].filter(Boolean).join(' · ')}</div>
          </div>
        ))
      }
      return <SimpleList items={data[k]} t={t} layout={layout} />
    case 'languages':
      return side ? (
        data.languages.map((l) => (
          <div key={l.id || l.name} className="flex justify-between" style={{ fontSize: '9.5pt', marginBottom: 3 }}>
            <span>{l.name}</span><span style={{ opacity: 0.8 }}>{l.level}</span>
          </div>
        ))
      ) : (
        <div>{data.languages.map((l) => [l.name, l.level && `(${l.level})`].filter(Boolean).join(' ')).join(' · ')}</div>
      )
    case 'interests':
      return <div>{data.interests.join(' · ')}</div>
    case 'references':
      return (
        <div className="grid grid-cols-2 gap-3">
          {data.references.map((r) => (
            <div key={r.id || r.name} style={{ fontSize: '9.5pt' }}>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div>{[r.title, r.company].filter(Boolean).join(', ')}</div>
              <div style={{ color: '#6b7280' }}>{r.contact}</div>
            </div>
          ))}
        </div>
      )
    case 'custom':
      return null
    case 'declaration':
      return <p style={{ fontSize: '9.5pt' }}>{data.declaration}</p>
    default:
      return null
  }
}

function Section({ k, data, t, layout, side, light }) {
  if (k === 'custom') {
    return (data.custom_sections || []).filter((c) => c.title && c.items?.length).map((c) => (
      <section key={c.id || c.title} style={{ marginBottom: 14 }}>
        <Heading t={t} light={light}>{c.title}</Heading>
        <ul>{c.items.map((i, n) => <li key={n}>{i}</li>)}</ul>
      </section>
    ))
  }
  return (
    <section style={{ marginBottom: side ? 16 : 14, breakInside: 'avoid-page' }}>
      <Heading t={t} light={light}>{SECTION_LABELS[k]}</Heading>
      <SectionBody k={k} data={data} t={t} layout={layout} side={side} />
    </section>
  )
}

function ContactItems({ p, color, iconColor, vertical }) {
  const items = [
    p.email && { icon: Mail, text: p.email },
    p.phone && { icon: Phone, text: p.phone },
    p.location && { icon: MapPin, text: p.location },
    p.linkedin && { icon: Linkedin, text: p.linkedin.replace(/^https?:\/\/(www\.)?/, '') },
    p.github && { icon: Github, text: p.github.replace(/^https?:\/\/(www\.)?/, '') },
    p.website && { icon: Globe, text: p.website.replace(/^https?:\/\//, '') },
  ].filter(Boolean)
  return (
    <div className={vertical ? 'space-y-1.5' : 'flex flex-wrap gap-x-4 gap-y-1'} style={{ fontSize: '9pt', color }}>
      {items.map(({ icon: Icon, text }) => (
        <span key={text} className="flex items-center gap-1.5" style={{ wordBreak: 'break-all' }}>
          <Icon size={11} style={{ color: iconColor || color, flexShrink: 0 }} /> {text}
        </span>
      ))}
    </div>
  )
}

function PersonalExtras({ p, color }) {
  const extras = [
    p.date_of_birth && `DOB: ${p.date_of_birth}`,
    p.nationality && `Nationality: ${p.nationality}`,
    p.marital_status && `Marital status: ${p.marital_status}`,
    p.gender && `Gender: ${p.gender}`,
    p.visa_status && `Visa: ${p.visa_status}`,
  ].filter(Boolean)
  if (!extras.length) return null
  return <div style={{ fontSize: '8.5pt', color, marginTop: 4 }}>{extras.join('  ·  ')}</div>
}

function Photo({ src, size = 96, ring }) {
  if (!src) return null
  return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', border: ring ? `3px solid ${ring}` : undefined, flexShrink: 0 }} />
}

const initials = (name = '') => name.replace(/^Dr\.?\s*/i, '').split(' ').filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase()

export default function ResumeDocument({ data, template, paper = 'letter', id }) {
  const t = { primary: '#111827', accent: '#4f46e5', font: 'sans', heading: 'underline', layout: 'classic', ...(template?.layout || template || {}) }
  const layout = t.layout
  const p = data.personal || {}
  const size = PAPER[paper] || PAPER.letter
  const fontFamily = t.font === 'serif' ? 'Merriweather, Georgia, serif' : 'Inter, Arial, sans-serif'
  const keys = orderedSections(data)
  const sideKeys = SIDE_LAYOUTS.includes(layout) ? keys.filter((k) => SIDE_SECTIONS.includes(k)) : []
  const mainKeys = keys.filter((k) => !sideKeys.includes(k))
  const compact = layout === 'compact'

  const docStyle = { width: size.width, minHeight: size.minHeight, fontFamily, fontSize: compact ? '9.5pt' : undefined }
  const pad = compact ? '28px 36px' : '40px 48px'
  const main = mainKeys.map((k) => <Section key={k} k={k} data={data} t={t} layout={layout} />)

  // ── Sidebar: coloured left column ─────────────────────────────────────────
  if (layout === 'sidebar') {
    return (
      <div id={id} className="resume-doc flex" style={docStyle}>
        <aside style={{ width: '33%', background: t.primary, color: '#fff', padding: '36px 22px' }}>
          {p.photo ? <div className="mb-4 flex justify-center"><Photo src={p.photo} size={110} ring={t.accent} /></div> : (
            <div className="mb-4 flex justify-center">
              <div style={{ width: 84, height: 84, borderRadius: 999, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>{initials(p.full_name)}</div>
            </div>
          )}
          <section style={{ marginBottom: 16 }}>
            <Heading t={t} light>Contact</Heading>
            <ContactItems p={p} color="rgba(255,255,255,.9)" vertical />
            <PersonalExtras p={p} color="rgba(255,255,255,.8)" />
          </section>
          {sideKeys.map((k) => <Section key={k} k={k} data={data} t={t} layout={layout} side light />)}
        </aside>
        <main style={{ flex: 1, padding: '36px 30px' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: 800, color: t.primary, lineHeight: 1.1 }}>{p.full_name}</h1>
          {p.headline && <div style={{ fontSize: '12pt', color: t.accent, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>{p.headline}</div>}
          {main}
        </main>
      </div>
    )
  }

  // ── Band: coloured header ──────────────────────────────────────────────────
  if (layout === 'band') {
    return (
      <div id={id} className="resume-doc" style={docStyle}>
        <header className="flex items-center gap-5" style={{ background: t.primary, color: '#fff', padding: '30px 48px' }}>
          <div className="flex-1">
            <h1 style={{ fontSize: '24pt', fontWeight: 800, lineHeight: 1.1 }}>{p.full_name}</h1>
            {p.headline && <div style={{ fontSize: '12pt', opacity: 0.9, marginTop: 4, marginBottom: 10 }}>{p.headline}</div>}
            <ContactItems p={p} color="rgba(255,255,255,.92)" />
            <PersonalExtras p={p} color="rgba(255,255,255,.8)" />
          </div>
          <Photo src={p.photo} size={96} ring="#fff" />
        </header>
        <div style={{ height: 5, background: t.accent }} />
        <main style={{ padding: pad }}>{main}</main>
      </div>
    )
  }

  // ── Split: header + main/side columns ─────────────────────────────────────
  if (layout === 'split') {
    return (
      <div id={id} className="resume-doc" style={docStyle}>
        <header className="flex items-center gap-5" style={{ padding: '34px 44px 18px', borderBottom: `3px solid ${t.accent}` }}>
          <Photo src={p.photo} size={84} />
          <div className="flex-1">
            <h1 style={{ fontSize: '24pt', fontWeight: 800, color: t.primary, lineHeight: 1.1 }}>{p.full_name}</h1>
            {p.headline && <div style={{ fontSize: '12pt', color: t.accent, fontWeight: 600, marginTop: 3, marginBottom: 8 }}>{p.headline}</div>}
            <ContactItems p={p} color="#374151" iconColor={t.accent} />
            <PersonalExtras p={p} color="#6b7280" />
          </div>
        </header>
        <div className="flex">
          <main style={{ flex: 1, padding: '20px 26px 30px 44px' }}>{main}</main>
          {sideKeys.length > 0 && (
            <aside style={{ width: '34%', background: `${t.primary}0d`, padding: '20px 24px', color: '#1f2937' }}>
              {sideKeys.map((k) => <Section key={k} k={k} data={data} t={{ ...t }} layout="split-side" />)}
            </aside>
          )}
        </div>
      </div>
    )
  }

  // ── Creative ──────────────────────────────────────────────────────────────
  if (layout === 'creative') {
    return (
      <div id={id} className="resume-doc" style={{ ...docStyle, borderLeft: `14px solid ${t.primary}` }}>
        <header className="flex items-center gap-5" style={{ padding: '34px 44px 16px' }}>
          {p.photo ? <Photo src={p.photo} size={96} ring={t.accent} /> : (
            <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, transform: 'rotate(-4deg)' }}>{initials(p.full_name)}</div>
          )}
          <div className="flex-1">
            <h1 style={{ fontSize: '26pt', fontWeight: 800, color: t.primary, lineHeight: 1.05 }}>{p.full_name}</h1>
            {p.headline && <div style={{ fontSize: '12pt', color: t.accent, fontWeight: 700, marginTop: 4, marginBottom: 8 }}>{p.headline}</div>}
            <ContactItems p={p} color="#374151" iconColor={t.accent} />
            <PersonalExtras p={p} color="#6b7280" />
          </div>
        </header>
        <main style={{ padding: '6px 44px 36px' }}>{main}</main>
      </div>
    )
  }

  // ── Single-column family: classic, minimal, executive, compact, timeline, academic ─
  const centered = ['classic', 'executive', 'academic'].includes(layout)
  return (
    <div id={id} className="resume-doc" style={docStyle}>
      <div style={{ padding: pad }}>
        <header style={{ textAlign: centered ? 'center' : 'left', marginBottom: 16 }} className={centered ? '' : 'flex items-center gap-5'}>
          {!centered && <Photo src={p.photo} size={compact ? 70 : 88} />}
          {centered && p.photo && <div className="mb-2 flex justify-center"><Photo src={p.photo} size={88} /></div>}
          <div className="flex-1">
            {layout === 'timeline' && <div style={{ width: 48, height: 5, background: t.accent, borderRadius: 4, marginBottom: 10 }} />}
            <h1 style={{
              fontSize: layout === 'executive' ? '26pt' : layout === 'minimal' ? '28pt' : compact ? '20pt' : '24pt',
              fontWeight: layout === 'minimal' ? 300 : 800,
              color: t.primary,
              letterSpacing: layout === 'executive' ? '.03em' : undefined,
              textTransform: layout === 'executive' ? 'uppercase' : undefined,
              lineHeight: 1.1,
            }}>{p.full_name}</h1>
            {p.headline && <div style={{ fontSize: '11.5pt', color: layout === 'minimal' ? '#64748b' : t.accent, fontWeight: 600, margin: '4px 0 8px' }}>{p.headline}</div>}
            {layout === 'executive' && <div style={{ borderTop: `2px solid ${t.accent}`, borderBottom: `1px solid ${t.accent}`, height: 4, margin: '8px auto 10px', width: '100%' }} />}
            <div className={centered ? 'flex justify-center' : ''}>
              <ContactItems p={p} color="#374151" iconColor={t.accent} />
            </div>
            <PersonalExtras p={p} color="#6b7280" />
          </div>
        </header>
        {main.map((m, i) => <Fragment key={i}>{m}</Fragment>)}
      </div>
    </div>
  )
}
