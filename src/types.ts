export const ENTITY_TYPES = [
  'PERSON',
  'ORG',
  'LOCATION',
  'UNIVERSITY',
  'COURSE_CODE',
  'STUDENT_ID',
  'DATE',
  'EMAIL',
  'PHONE',
  'POSTCODE',
  'NI_NUMBER',
  'CUSTOM',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

/** Where a detection came from. Lower rank wins when spans overlap. */
export type SpanSource = 'custom' | 'regex' | 'ner'

export interface Span {
  start: number
  end: number
  type: EntityType
  text: string
  source: SpanSource
  /** Overrides the placeholder name, e.g. "MODULE" gives [MODULE_1]. Set by custom terms. */
  label?: string
}

export interface CustomTerm {
  term: string
  type: EntityType
  /** Optional tag name used in the placeholder instead of the type, e.g. "MODULE". */
  label?: string
}

/**
 * Turn user input into a safe tag name: capital letters and underscores only,
 * so the restore step can always recognise it (e.g. "my module!" gives "MY_MODULE").
 */
export function sanitiseLabel(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24)
}

/** Canonical form used to treat "John  Smith" and "john smith" as the same value. */
export function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}
