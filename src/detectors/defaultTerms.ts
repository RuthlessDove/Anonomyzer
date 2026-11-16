import type { CustomTerm } from '../types'

/**
 * Words and phrases that are ALWAYS masked. Edit this list, then save:
 * the dev server reloads automatically.
 *
 * Matching ignores case and only matches whole words. Multi-word phrases are fine.
 * `type` must be one of: PERSON, ORG, LOCATION, UNIVERSITY, COURSE_CODE, STUDENT_ID,
 * DATE, EMAIL, PHONE, POSTCODE, NI_NUMBER, CUSTOM.
 *
 * Optional `label` sets the placeholder name instead of the type, e.g.
 *   { term: 'Machine Learning', type: 'CUSTOM', label: 'MODULE' }  gives [MODULE_1]
 * (capital letters and underscores only; anything else is cleaned up automatically).
 *
 * Keep real names out of anything you share or commit (e.g. to GitHub).
 */
export const DEFAULT_TERMS: CustomTerm[] = [
  { term: 'University of Warwick', type: 'UNIVERSITY' },
  { term: 'Warwick', type: 'UNIVERSITY' },
  // { term: 'University of Leeds', type: 'UNIVERSITY' },
  // { term: 'Machine Learning', type: 'CUSTOM' },
]
