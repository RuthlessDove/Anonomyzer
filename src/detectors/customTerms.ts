import { sanitiseLabel, type CustomTerm, type Span } from '../types'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Case-insensitive, whole-word match of user-supplied terms that must always be masked. */
export function detectCustomTerms(text: string, terms: CustomTerm[]): Span[] {
  const spans: Span[] = []
  for (const { term, type, label: rawLabel } of terms) {
    const label = rawLabel ? sanitiseLabel(rawLabel) || undefined : undefined
    const t = term.trim()
    if (t.length < 2) continue
    const body = t.split(/\s+/).map(escapeRegex).join('\\s+')
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'giu')
    for (const m of text.matchAll(re)) {
      spans.push({ start: m.index, end: m.index + m[0].length, type, text: m[0], source: 'custom', label })
    }
  }
  return spans
}
