/** Tiny, safe markdown renderer (no HTML injection): headings, lists, bold, italics, code. */

function inline(text, keyBase) {
  const parts = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${i++}`
    if (tok.startsWith('**')) parts.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('`')) parts.push(<code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-slate-800">{tok.slice(1, -1)}</code>)
    else parts.push(<em key={key}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function Markdown({ text = '' }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const out = []
  let list = null

  const flush = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    out.push(
      <Tag key={`l${out.length}`} className={list.ordered ? 'my-1 list-decimal space-y-0.5 pl-5' : 'my-1 list-disc space-y-0.5 pl-5'}>
        {list.items.map((it, i) => <li key={i}>{inline(it, `li${out.length}-${i}`)}</li>)}
      </Tag>,
    )
    list = null
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*•]\s+(.*)/)
    const num = line.match(/^\s*\d+[.)]\s+(.*)/)
    if (bullet || num) {
      const ordered = !!num
      if (!list || list.ordered !== ordered) {
        flush()
        list = { ordered, items: [] }
      }
      list.items.push((bullet || num)[1])
      return
    }
    flush()
    const h = line.match(/^(#{1,4})\s+(.*)/)
    if (h) {
      out.push(<p key={idx} className="mt-2 font-semibold">{inline(h[2], `h${idx}`)}</p>)
    } else if (line.trim()) {
      out.push(<p key={idx} className="my-1">{inline(line, `p${idx}`)}</p>)
    }
  })
  flush()
  return <div className="leading-relaxed">{out}</div>
}
