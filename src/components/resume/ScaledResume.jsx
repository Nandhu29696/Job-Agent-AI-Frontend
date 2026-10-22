import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ResumeDocument, { PAPER } from './ResumeDocument'
import { LockedOverlay } from '../ui'
import { sampleFor } from './sampleData'

/** Fits a fixed-width resume document into its container by scaling it. */
export default function ScaledResume({ data, template, paper = 'letter', locked, maxScale = 1 }) {
  const wrapRef = useRef(null)
  const docRef = useRef(null)
  const [scale, setScale] = useState(0.5)
  const [height, setHeight] = useState(0)
  const width = (PAPER[paper] || PAPER.letter).width

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(maxScale, entry.contentRect.width / width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, maxScale])

  useLayoutEffect(() => {
    if (!docRef.current) return
    const ro = new ResizeObserver(() => setHeight(docRef.current?.offsetHeight || 0))
    ro.observe(docRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className="w-full">
      <div style={{ height: height * scale }} className="relative">
        <div
          ref={docRef}
          className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-sm shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
          style={{ transform: `scale(${scale})`, width }}
        >
          <ResumeDocument data={data} template={template} paper={paper} />
          {locked && <LockedOverlay />}
        </div>
      </div>
    </div>
  )
}

export function TemplateThumb({ template, category, className }) {
  const data = sampleFor(category || template?.category)
  const withPhoto = template?.layout?.photo
    ? { ...data, personal: { ...data.personal, photo: AVATAR } }
    : data
  return (
    <div className={className}>
      <div className="pointer-events-none select-none overflow-hidden" style={{ aspectRatio: '816 / 1056' }}>
        <ScaledResume data={withPhoto} template={template} />
      </div>
    </div>
  )
}

// Neutral silhouette avatar for template previews
const AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#cbd5e1"/><circle cx="50" cy="38" r="18" fill="#94a3b8"/><path d="M14 96c4-22 20-32 36-32s32 10 36 32z" fill="#94a3b8"/></svg>',
  )

/** Body-level, unscaled copy of the resume used only by window.print(). */
export function PrintPortal({ data, template, paper = 'letter' }) {
  const size = PAPER[paper] || PAPER.letter
  return createPortal(
    <div className="print-portal">
      <style>{`@page { size: ${size.css}; margin: 0; }`}</style>
      <ResumeDocument data={data} template={template} paper={paper} />
    </div>,
    document.body,
  )
}
