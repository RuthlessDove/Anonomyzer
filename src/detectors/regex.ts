import type { EntityType, Span } from '../types'

const MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
const DAY = '(?:3[01]|[12]\\d|0?[1-9])(?:st|nd|rd|th)?'
const WEEKDAY = '(?:(?:Mon|Tues?|Wed(?:nes)?|Thu(?:rs)?|Fri|Sat(?:ur)?|Sun)(?:day)?,?\\s+)?'
const CAP_WORD = "[A-Z][\\w'’-]*"

interface Rule {
  type: EntityType
  re: RegExp
}

/** UK-focused patterns. All must use the global flag. */
export const RULES: Rule[] = [
  { type: 'EMAIL', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g },

  // +44 7911 123456, +44 (0)20 7946 0958, 07911 123456, 020-7946-0958
  { type: 'PHONE', re: /(?<![\w+])(?:\+44\s?(?:\(0\)\s?)?|0)(?:\d[\s-]?){8,9}\d(?!\d)/g },

  // SW1A 1AA, M1 1AE, ls2 9jt
  {
    type: 'POSTCODE',
    re: /\b(?:GIR\s?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]?\s?\d[ABD-HJLNP-UW-Z]{2})\b/gi,
  },

  // QQ 12 34 56 C
  {
    type: 'NI_NUMBER',
    re: /\b(?!BG|GB|KN|NK|NT|TN|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/gi,
  },

  // Dates: 03/04/2025, 3.4.25, 2025-04-03, 3rd April 2025, Thursday 3 April, April 3rd, 2025, April 2025
  { type: 'DATE', re: /\b(?:3[01]|[12]\d|0?[1-9])[/.-](?:1[0-2]|0?[1-9])[/.-](?:\d{4}|\d{2})\b/g },
  { type: 'DATE', re: /\b\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/g },
  {
    type: 'DATE',
    re: new RegExp(`\\b${WEEKDAY}${DAY}\\s+(?:of\\s+)?${MONTH}\\.?(?:,?\\s+\\d{4})?\\b`, 'gi'),
  },
  {
    type: 'DATE',
    re: new RegExp(`\\b${WEEKDAY}${MONTH}\\.?\\s+${DAY}(?:,?\\s+\\d{4})?\\b`, 'gi'),
  },
  { type: 'DATE', re: new RegExp(`\\b${MONTH}\\.?\\s+\\d{4}\\b`, 'gi') },

  // Universities: "University of Leeds", "Leeds Beckett University", "King's College London"
  {
    type: 'UNIVERSITY',
    re: new RegExp(
      `\\b(?:The\\s+)?University\\s+of\\s+(?:the\\s+)?${CAP_WORD}(?:\\s+(?:and\\s+)?${CAP_WORD}){0,3}`,
      'g',
    ),
  },
  {
    type: 'UNIVERSITY',
    re: new RegExp(
      `\\b(?:${CAP_WORD}\\s+){1,3}(?:University|College|Institute)(?:\\s+(?:of\\s+)?${CAP_WORD}){0,2}\\b`,
      'g',
    ),
  },

  // Starter patterns; to be tuned once real examples are available.
  // Student IDs: s1234567, 201912345
  { type: 'STUDENT_ID', re: /\b[A-Za-z]?\d{7,9}\b/g },
  // Course / module codes, any case: COMP3011, CS101, cs320, MA 1001, LAW2010A
  { type: 'COURSE_CODE', re: /\b[A-Z]{2,5}\s?\d{3,5}[A-Z]?\b/gi },
]

export function detectRegex(text: string): Span[] {
  const spans: Span[] = []
  for (const { type, re } of RULES) {
    for (const m of text.matchAll(re)) {
      const raw = m[0]
      // Trim trailing whitespace/hyphens that a greedy pattern may have swallowed.
      const trimmed = raw.replace(/[\s-]+$/, '')
      if (!trimmed) continue
      const start = m.index
      spans.push({ start, end: start + trimmed.length, type, text: trimmed, source: 'regex' })
    }
  }
  return spans
}
