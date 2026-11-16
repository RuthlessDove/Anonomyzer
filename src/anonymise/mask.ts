import type { Span } from '../types'
import { assign, type Mapping } from './mapping'

/**
 * Replace each span with its placeholder.
 * `spans` must be sorted and non-overlapping (see mergeSpans).
 * Returns the masked text plus the mapping extended with any new values.
 */
export function mask(text: string, spans: Span[], mapping: Mapping): { masked: string; mapping: Mapping } {
  let out = ''
  let cursor = 0
  let m = mapping
  for (const span of spans) {
    const res = assign(m, text.slice(span.start, span.end), span.label ?? span.type)
    m = res.mapping
    out += text.slice(cursor, span.start) + res.placeholder
    cursor = span.end
  }
  out += text.slice(cursor)
  return { masked: out, mapping: m }
}

export const PROMPT_HINT =
  'Note: this text contains placeholders such as [PERSON_1] or [DATE_2] standing in for private details. ' +
  'Keep every placeholder exactly as written (including the square brackets) in your reply.\n\n'
