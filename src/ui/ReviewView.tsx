import { useRef, useState } from 'react'
import type { Mapping } from '../anonymise/mapping'
import { ENTITY_TYPES, normalise, sanitiseLabel, type EntityType, type Span } from '../types'

interface Props {
  text: string
  spans: Span[]
  mapping: Mapping
  onUnmask: (span: Span) => void
  /** `label` is an optional custom tag name, e.g. "MODULE" for [MODULE_1]. */
  onMask: (term: string, type: EntityType, label?: string) => void
}

/** Original text with detections highlighted. Click a highlight to un-mask; select text to mask it. */
export function ReviewView({ text, spans, mapping, onUnmask, onMask }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [tagName, setTagName] = useState('')

  function applyMask(type: EntityType, label?: string) {
    if (!selection) return
    onMask(selection, type, label)
    setSelection(null)
    setTagName('')
    window.getSelection()?.removeAllRanges()
  }

  function handleMouseUp() {
    const sel = window.getSelection()
    const root = ref.current
    if (!sel || sel.isCollapsed || !root || !root.contains(sel.getRangeAt(0).commonAncestorContainer)) return
    // Offsets via Range so highlight markup doesn't skew positions (labels are CSS-only).
    const range = sel.getRangeAt(0)
    const pre = document.createRange()
    pre.selectNodeContents(root)
    pre.setEnd(range.startContainer, range.startOffset)
    const start = pre.toString().length
    const picked = text.slice(start, start + range.toString().length).trim()
    setSelection(picked.length >= 2 ? picked : null)
  }

  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const s of spans) {
    if (s.start > cursor) parts.push(text.slice(cursor, s.start))
    const placeholder = mapping.find((e) => e.key === normalise(s.text))?.placeholder ?? s.type
    parts.push(
      <mark
        key={s.start}
        className={`ent ent-${s.type}`}
        data-ph={placeholder}
        title={`${placeholder} (${s.source}) — click to leave unmasked`}
        onClick={() => onUnmask(s)}
      >
        {text.slice(s.start, s.end)}
      </mark>,
    )
    cursor = s.end
  }
  parts.push(text.slice(cursor))

  return (
    <div>
      {selection && (
        <div className="mask-bar" role="toolbar" aria-label="Mask selected text">
          <span>
            Mask <strong>“{selection.length > 40 ? selection.slice(0, 40) + '…' : selection}”</strong> as:
          </span>
          {ENTITY_TYPES.map((t) => (
            <button key={t} className={`chip ent-${t}`} onClick={() => applyMask(t)}>
              {t}
            </button>
          ))}
          <span className="muted">or your own tag:</span>
          <input
            className="tag-input"
            placeholder="e.g. MODULE"
            value={tagName}
            aria-label="Custom tag name"
            onChange={(e) => setTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sanitiseLabel(tagName) && applyMask('CUSTOM', sanitiseLabel(tagName))}
          />
          <button disabled={!sanitiseLabel(tagName)} onClick={() => applyMask('CUSTOM', sanitiseLabel(tagName))}>
            Use tag
          </button>
          <button className="ghost" onClick={() => setSelection(null)}>
            Cancel
          </button>
        </div>
      )}
      <div ref={ref} className="review" onMouseUp={handleMouseUp}>
        {text ? parts : <span className="muted">Detected items will be highlighted here.</span>}
      </div>
    </div>
  )
}
