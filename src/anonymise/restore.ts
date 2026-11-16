import { ENTITY_TYPES } from '../types'
import { lookupByPlaceholder, type Mapping } from './mapping'

export interface RestoreResult {
  text: string
  /** Number of placeholders swapped back. */
  replaced: number
  /** Placeholders the LLM altered (e.g. "[Person 1]") that were still matched. */
  fuzzy: { found: string; placeholder: string }[]
  /** Placeholder-shaped tokens with a known type but no mapping entry. */
  unknown: string[]
}

// Any bracket style, any separator/case: [PERSON_1], (person 1), {Person-1}, <PERSON #1>
const BRACKETED = /[[({<]\s*([A-Za-z]+(?:[ _-][A-Za-z]+)*)[ _-]*#?(\d+)\s*[\])}>]/g

/** Entity types plus any user-chosen labels in this mapping (letters/underscores only). */
function knownTags(mapping: Mapping): string[] {
  return [...new Set<string>([...ENTITY_TYPES, ...mapping.map((e) => e.tag)])].sort(
    (a, b) => b.length - a.length,
  )
}

// Bare tokens the LLM stripped brackets from: PERSON_1
function bareRegex(tags: string[]): RegExp {
  return new RegExp(`(?<![[({<])\\b(${tags.join('|')})_(\\d+)\\b`, 'g')
}

function canonical(type: string, n: string): { type: string; placeholder: string } {
  const t = type.toUpperCase().replace(/[ -]/g, '_')
  return { type: t, placeholder: `[${t}_${Number(n)}]` }
}

export function restore(text: string, mapping: Mapping): RestoreResult {
  const tags = knownTags(mapping)
  const KNOWN = new Set<string>(tags)
  let replaced = 0
  const fuzzy: RestoreResult['fuzzy'] = []
  const unknown = new Set<string>()

  const pass1 = text.replace(BRACKETED, (found, type: string, n: string) => {
    const c = canonical(type, n)
    const entry = lookupByPlaceholder(mapping, c.placeholder)
    if (entry) {
      replaced++
      if (found !== c.placeholder) fuzzy.push({ found, placeholder: c.placeholder })
      return entry.original
    }
    if (KNOWN.has(c.type)) unknown.add(found)
    return found
  })

  const pass2 = pass1.replace(bareRegex(tags),(found, type: string, n: string) => {
    const c = canonical(type, n)
    const entry = lookupByPlaceholder(mapping, c.placeholder)
    if (!entry) {
      unknown.add(found)
      return found
    }
    replaced++
    fuzzy.push({ found, placeholder: c.placeholder })
    return entry.original
  })

  return { text: pass2, replaced, fuzzy, unknown: [...unknown] }
}
