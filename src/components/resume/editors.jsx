import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, X, GripVertical, ImagePlus } from 'lucide-react'
import { cn, uid } from '../../lib/utils'
import { toast } from '../../store/toastStore'

export function SectionCard({ title, icon: Icon, children, actions, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left">
          {Icon && <Icon size={17} className="text-brand-600" />}
          <span className="font-semibold">{title}</span>
          {badge != null && <span className="rounded-full bg-slate-100 px-2 text-xs muted dark:bg-slate-800">{badge}</span>}
          <ChevronDown size={16} className={cn('ml-auto text-slate-400 transition', open && 'rotate-180')} />
        </button>
        {open && actions}
      </div>
      {open && <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">{children}</div>}
    </div>
  )
}

export function ListEditor({ items = [], onChange, newItem, renderItem, itemTitle, addLabel = 'Add' }) {
  const [openId, setOpenId] = useState(items[0]?.id ?? null)
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const move = (idx, dir) => {
    const next = [...items]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }
  const add = () => {
    const item = { id: uid(), ...newItem() }
    onChange([...items, item])
    setOpenId(item.id)
  }
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const key = item.id || idx
        const open = openId === key
        return (
          <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1 px-3 py-2">
              <GripVertical size={14} className="text-slate-300" />
              <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setOpenId(open ? null : key)}>
                {itemTitle(item) || <span className="muted">Untitled</span>}
              </button>
              <button onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Move up"><ChevronUp size={15} /></button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" aria-label="Move down"><ChevronDown size={15} /></button>
              <button onClick={() => onChange(items.filter((_, i) => i !== idx))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label="Remove"><Trash2 size={15} /></button>
            </div>
            {open && <div className="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800">{renderItem(item, (patch) => update(idx, patch))}</div>}
          </div>
        )
      })}
      <button onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700">
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  )
}

export function TagInput({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [text, setText] = useState('')
  const add = (raw) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    const next = [...value]
    parts.forEach((p) => !next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.push(p))
    onChange(next)
    setText('')
  }
  return (
    <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 py-1.5">
      {value.map((tag) => (
        <span key={tag} className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          {tag}
          <button onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}><X size={11} /></button>
        </span>
      ))}
      <input
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
        value={text}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) { e.preventDefault(); add(text) }
          if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={() => text.trim() && add(text)}
      />
    </div>
  )
}

export function BulletEditor({ bullets = [], onChange }) {
  const list = bullets.length ? bullets : ['']
  return (
    <div className="space-y-1.5">
      {list.map((b, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
          <textarea
            rows={2}
            className="input resize-y text-sm"
            value={b}
            placeholder="Led X, achieving Y, measured by Z"
            onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="mt-2 rounded p-1 text-slate-400 hover:text-red-600" aria-label="Remove bullet"><X size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...list, ''])} className="text-xs font-semibold text-brand-600 hover:underline">+ Add bullet</button>
    </div>
  )
}

/** Resize to a ~320px JPEG data URL so it stays small in the resume JSON. */
export function PhotoInput({ value, onChange }) {
  const onFile = (file) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast.error('Use a PNG, JPG or WebP image')
    if (file.size > 8 * 1024 * 1024) return toast.error('Image too large (max 8 MB)')
    const img = new Image()
    img.onload = () => {
      const size = 320
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const s = Math.min(img.width, img.height)
      canvas.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      onChange(canvas.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"><ImagePlus size={20} /></div>
      )}
      <label className="btn-secondary btn-sm cursor-pointer">
        {value ? 'Change photo' : 'Upload photo'}
        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {value && <button className="text-xs text-red-600 hover:underline" onClick={() => onChange('')}>Remove</button>}
    </div>
  )
}
