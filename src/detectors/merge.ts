import { normalise, type Span, type SpanSource } from '../types'

const RANK: Record<SpanSource, number> = { custom: 0, regex: 1, ner: 2 }

/**
 * Resolve overlapping detections into a sorted, non-overlapping list.
 * Priority: custom terms > regex > NER; within a source, the longest span wins.
 * Values the user has un-masked (by normalised text) are dropped, along with any
 * shorter automatic detections inside them (so un-masking "3rd April 2025" doesn't
 * leave "April 2025" masked). Custom terms are explicit and always kept.
 */
export function mergeSpans(spans: Span[], ignored: ReadonlySet<string> = new Set()): Span[] {
  const valid = spans.filter((s) => s.end > s.start)
  const unmasked = valid.filter((s) => ignored.has(normalise(s.text)))
  const candidates = valid
    .filter(
      (s) =>
        !ignored.has(normalise(s.text)) &&
        (s.source === 'custom' || !unmasked.some((u) => s.start < u.end && u.start < s.end)),
    )
    .sort(
      (a, b) =>
        RANK[a.source] - RANK[b.source] ||
        b.end - b.start - (a.end - a.start) ||
        a.start - b.start,
    )

  const accepted: Span[] = []
  for (const s of candidates) {
    if (!accepted.some((a) => s.start < a.end && a.start < s.end)) accepted.push(s)
  }
  return accepted.sort((a, b) => a.start - b.start)
}
